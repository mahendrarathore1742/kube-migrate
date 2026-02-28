package gatewayapi

import (
	"fmt"
	"strings"

	"github.com/kube-migrate/kube-migrate/pkg/analyzer"
	"github.com/kube-migrate/kube-migrate/pkg/generator"
	"github.com/kube-migrate/kube-migrate/pkg/scanner"
)

// Migrator generates Gateway API (Envoy Gateway) migration files.
type Migrator struct{}

// NewMigrator creates a new Gateway API migrator.
func NewMigrator() *Migrator {
	return &Migrator{}
}

// Migrate generates all files for Gateway API migration.
func (m *Migrator) Migrate(scan *scanner.ScanResult, report *analyzer.AnalysisReport) ([]generator.GeneratedFile, error) {
	var files []generator.GeneratedFile

	// 1. CRD install
	files = append(files, generateCRDInstall())

	// 2. Envoy Gateway install
	files = append(files, generateEnvoyGatewayInstall())
	files = append(files, generateEnvoyGatewayValues())

	// 3. Gateway resources
	files = append(files, generateGatewayClass())
	files = append(files, generateGateway(scan))

	// 4. HTTPRoutes
	for _, ing := range scan.Ingresses {
		routes := generateHTTPRoutes(ing)
		files = append(files, routes...)
	}

	// 5. Policies
	for _, ing := range scan.Ingresses {
		policies := generatePolicies(ing)
		files = append(files, policies...)
	}

	// 6. Verify
	files = append(files, generateVerifyScript(scan))

	// 7. Cleanup
	files = append(files, generateCleanupScript())

	return files, nil
}

func generateCRDInstall() generator.GeneratedFile {
	return generator.GeneratedFile{
		RelPath: "01-install-gateway-api-crds/install.sh",
		Content: `#!/bin/bash
set -euo pipefail

echo "=== Installing Gateway API CRDs ==="
echo "This is safe — it only registers API types, no traffic changes"
echo ""

kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml

echo ""
echo "✅ Gateway API CRDs installed"
kubectl get crd | grep gateway
`,
		Description: "Gateway API CRD install script",
		Category:    "install",
	}
}

func generateEnvoyGatewayInstall() generator.GeneratedFile {
	return generator.GeneratedFile{
		RelPath: "02-install-envoy-gateway/helm-install.sh",
		Content: `#!/bin/bash
set -euo pipefail

echo "=== Installing Envoy Gateway ==="
echo "This installs alongside NGINX — production traffic is unaffected"
echo ""

helm install eg oci://docker.io/envoyproxy/gateway-helm \
  --version v1.3.0 \
  -n envoy-gateway-system \
  --create-namespace \
  -f "$(dirname "$0")/values.yaml" \
  --wait

echo ""
echo "✅ Envoy Gateway installed"
kubectl get pods -n envoy-gateway-system
`,
		Description: "Envoy Gateway Helm install script",
		Category:    "install",
	}
}

func generateEnvoyGatewayValues() generator.GeneratedFile {
	return generator.GeneratedFile{
		RelPath: "02-install-envoy-gateway/values.yaml",
		Content: `# Envoy Gateway Helm values
config:
  envoyGateway:
    logging:
      level:
        default: info
`,
		Description: "Envoy Gateway Helm values",
		Category:    "install",
	}
}

func generateGatewayClass() generator.GeneratedFile {
	return generator.GeneratedFile{
		RelPath: "03-gateway/gatewayclass.yaml",
		Content: `apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: envoy-gateway
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller
`,
		Description: "GatewayClass for Envoy Gateway",
		Category:    "gateway",
	}
}

func generateGateway(scan *scanner.ScanResult) generator.GeneratedFile {
	var b strings.Builder
	b.WriteString(`apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: main-gateway
  namespace: envoy-gateway-system
spec:
  gatewayClassName: envoy-gateway
  listeners:
    - name: http
      protocol: HTTP
      port: 80
      allowedRoutes:
        namespaces:
          from: All
`)

	// Add HTTPS listeners per TLS host
	tlsHosts := make(map[string]string) // host -> secretName
	for _, ing := range scan.Ingresses {
		for _, tls := range ing.TLS {
			for _, host := range tls.Hosts {
				tlsHosts[host] = tls.SecretName
			}
		}
	}

	i := 1
	for host, secret := range tlsHosts {
		b.WriteString(fmt.Sprintf(`    - name: https-%d
      protocol: HTTPS
      port: 443
      hostname: "%s"
      allowedRoutes:
        namespaces:
          from: All
      tls:
        mode: Terminate
        certificateRefs:
          - kind: Secret
            name: %s
`, i, host, secret))
		i++
	}

	return generator.GeneratedFile{
		RelPath:     "03-gateway/gateway.yaml",
		Content:     b.String(),
		Description: "Gateway with HTTP + HTTPS listeners",
		Category:    "gateway",
	}
}

func generateHTTPRoutes(ing scanner.IngressInfo) []generator.GeneratedFile {
	var files []generator.GeneratedFile

	// Generate redirect route (HTTP→HTTPS) if ssl-redirect is enabled
	if v, ok := ing.NginxAnnotations["ssl-redirect"]; ok && v == "true" {
		var b strings.Builder
		b.WriteString(fmt.Sprintf(`apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: %s-redirect
  namespace: %s
spec:
  parentRefs:
    - name: main-gateway
      namespace: envoy-gateway-system
      sectionName: http
  hostnames:
`, ing.Name, ing.Namespace))

		for _, host := range ing.Hosts {
			b.WriteString(fmt.Sprintf("    - \"%s\"\n", host))
		}

		b.WriteString(`  rules:
    - filters:
        - type: RequestRedirect
          requestRedirect:
            scheme: https
            statusCode: 301
`)

		files = append(files, generator.GeneratedFile{
			RelPath:     fmt.Sprintf("04-httproutes/%s-%s-redirect.yaml", ing.Namespace, ing.Name),
			Content:     b.String(),
			Description: fmt.Sprintf("HTTP→HTTPS redirect for %s/%s", ing.Namespace, ing.Name),
			Category:    "httproute",
		})
	}

	// Generate main HTTPRoute
	var b strings.Builder
	b.WriteString(fmt.Sprintf(`apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: %s
  namespace: %s
spec:
  parentRefs:
    - name: main-gateway
      namespace: envoy-gateway-system
`, ing.Name, ing.Namespace))

	// Attach to HTTPS listener if TLS is configured
	if len(ing.TLS) > 0 {
		// Find matching section name
		b.WriteString("      sectionName: https-1\n")
	}

	if len(ing.Hosts) > 0 {
		b.WriteString("  hostnames:\n")
		for _, host := range ing.Hosts {
			b.WriteString(fmt.Sprintf("    - \"%s\"\n", host))
		}
	}

	b.WriteString("  rules:\n")
	for _, rule := range ing.Rules {
		for _, path := range rule.Paths {
			matchType := "PathPrefix"
			if path.PathType == "Exact" {
				matchType = "Exact"
			}
			// Detect regex paths
			if strings.ContainsAny(path.Path, "()|[]") {
				matchType = "RegularExpression"
			}

			b.WriteString(fmt.Sprintf(`    - matches:
        - path:
            type: %s
            value: %s
      backendRefs:
        - name: %s
          port: %d
`, matchType, path.Path, path.ServiceName, path.ServicePort))
		}
	}

	// Add rewrite filter if rewrite-target is set
	if target, ok := ing.NginxAnnotations["rewrite-target"]; ok {
		b.WriteString(fmt.Sprintf(`      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: %s
`, target))
	}

	files = append(files, generator.GeneratedFile{
		RelPath:     fmt.Sprintf("04-httproutes/%s-%s.yaml", ing.Namespace, ing.Name),
		Content:     b.String(),
		Description: fmt.Sprintf("HTTPRoute for %s/%s", ing.Namespace, ing.Name),
		Category:    "httproute",
	})

	return files
}

func generatePolicies(ing scanner.IngressInfo) []generator.GeneratedFile {
	var files []generator.GeneratedFile

	// Rate limit policy
	if rps, ok := ing.NginxAnnotations["limit-rps"]; ok {
		policy := fmt.Sprintf(`apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata:
  name: %s-rate-limit
  namespace: %s
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: %s
  rateLimit:
    type: Local
    local:
      rules:
        - limit:
            requests: %s
            unit: Second
`, ing.Name, ing.Namespace, ing.Name, rps)

		files = append(files, generator.GeneratedFile{
			RelPath:     fmt.Sprintf("05-policies/%s-%s-rate-limit.yaml", ing.Namespace, ing.Name),
			Content:     policy,
			Description: fmt.Sprintf("Rate limit policy for %s/%s", ing.Namespace, ing.Name),
			Category:    "policy",
		})
	}

	// Auth policy
	if authURL, ok := ing.NginxAnnotations["auth-url"]; ok {
		policy := fmt.Sprintf(`apiVersion: gateway.envoyproxy.io/v1alpha1
kind: SecurityPolicy
metadata:
  name: %s-ext-auth
  namespace: %s
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: %s
  extAuth:
    http:
      backendRef:
        name: auth-service
        port: 80
      path: "%s"
`, ing.Name, ing.Namespace, ing.Name, authURL)

		if headers, ok := ing.NginxAnnotations["auth-response-headers"]; ok {
			policy += "      headersToBackend:\n"
			for _, h := range strings.Split(headers, ",") {
				policy += fmt.Sprintf("        - \"%s\"\n", strings.TrimSpace(h))
			}
		}

		files = append(files, generator.GeneratedFile{
			RelPath:     fmt.Sprintf("05-policies/%s-%s-security.yaml", ing.Namespace, ing.Name),
			Content:     policy,
			Description: fmt.Sprintf("Security policy for %s/%s", ing.Namespace, ing.Name),
			Category:    "policy",
		})
	}

	// Timeout policy
	if timeout, ok := ing.NginxAnnotations["proxy-read-timeout"]; ok {
		policy := fmt.Sprintf(`apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata:
  name: %s-timeout
  namespace: %s
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: %s
  timeout:
    tcp:
      connectTimeout: 5s
    http:
      requestTimeout: %ss
`, ing.Name, ing.Namespace, ing.Name, timeout)

		files = append(files, generator.GeneratedFile{
			RelPath:     fmt.Sprintf("05-policies/%s-%s-timeout.yaml", ing.Namespace, ing.Name),
			Content:     policy,
			Description: fmt.Sprintf("Timeout policy for %s/%s", ing.Namespace, ing.Name),
			Category:    "policy",
		})
	}

	return files
}

func generateVerifyScript(scan *scanner.ScanResult) generator.GeneratedFile {
	var b strings.Builder
	b.WriteString(`#!/bin/bash
set -euo pipefail

echo "=== Verifying Gateway API Migration ==="
echo ""

# Get Envoy Gateway IP
EG_IP=$(kubectl get svc -n envoy-gateway-system -l gateway.networking.k8s.io/owning-gateway-name=main-gateway -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}' 2>/dev/null)

if [ -z "$EG_IP" ]; then
  echo "❌ Could not get Envoy Gateway LoadBalancer IP"
  exit 1
fi

echo "Envoy Gateway IP: $EG_IP"
echo ""

`)
	for _, ing := range scan.Ingresses {
		for _, host := range ing.Hosts {
			b.WriteString(fmt.Sprintf(`echo "Testing %s..."
curl -sk --resolve %s:443:$EG_IP https://%s/ -o /dev/null -w "  %%{http_code} %%{time_total}s\n"
`, host, host, host))
		}
	}

	b.WriteString(`
echo ""
echo "✅ Verification complete"
`)

	return generator.GeneratedFile{
		RelPath:     "06-verify.sh",
		Content:     b.String(),
		Description: "Verification script for Gateway API migration",
		Category:    "verify",
	}
}

func generateCleanupScript() generator.GeneratedFile {
	return generator.GeneratedFile{
		RelPath: "07-cleanup/remove-nginx.sh",
		Content: `#!/bin/bash
set -euo pipefail

echo "=== Removing NGINX Ingress Controller ==="
echo ""
echo "⚠️  WARNING: Only run this after:"
echo "   1. DNS has been updated to Envoy Gateway IP"
echo "   2. Traffic has been flowing through Envoy Gateway for 24+ hours"
echo "   3. No errors in Envoy Gateway logs"
echo ""
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Cancelled."
  exit 0
fi

# Backup NGINX values
echo "Backing up NGINX Helm values..."
helm get values ingress-nginx -n ingress-nginx > nginx-values-backup.yaml 2>/dev/null || true

# Uninstall NGINX
echo "Removing NGINX Ingress Controller..."
helm uninstall ingress-nginx -n ingress-nginx

echo ""
echo "✅ NGINX removed. Backup saved to nginx-values-backup.yaml"
`,
		Description: "Cleanup script — removes NGINX after migration",
		Category:    "cleanup",
	}
}
