package traefik

import (
	"fmt"
	"strings"

	"github.com/kube-migrate/kube-migrate/pkg/analyzer"
	"github.com/kube-migrate/kube-migrate/pkg/generator"
	"github.com/kube-migrate/kube-migrate/pkg/scanner"
)

// Migrator generates Traefik migration files.
type Migrator struct{}

// NewMigrator creates a new Traefik migrator.
func NewMigrator() *Migrator {
	return &Migrator{}
}

// Migrate generates all files for Traefik migration.
func (m *Migrator) Migrate(scan *scanner.ScanResult, report *analyzer.AnalysisReport) ([]generator.GeneratedFile, error) {
	var files []generator.GeneratedFile

	// 1. Install scripts
	files = append(files, generateHelmInstall())
	files = append(files, generateHelmValues())

	// 2. Middlewares (one per ingress that needs them)
	for _, ing := range scan.Ingresses {
		if len(ing.NginxAnnotations) > 0 {
			mw := generateMiddleware(ing)
			if mw.Content != "" {
				files = append(files, mw)
			}
		}
	}

	// 3. Updated ingresses
	for _, ing := range scan.Ingresses {
		files = append(files, generateUpdatedIngress(ing))
	}

	// 4. Verify script
	files = append(files, generateVerifyScript(scan))

	// 5. DNS guide
	files = append(files, generateDNSGuide())

	// 6. Cleanup
	files = append(files, generateCleanupScript())

	return files, nil
}

func generateHelmInstall() generator.GeneratedFile {
	return generator.GeneratedFile{
		RelPath: "01-install-traefik/helm-install.sh",
		Content: `#!/bin/bash
set -euo pipefail

echo "=== Installing Traefik v3 alongside NGINX ==="
echo "This is safe — NGINX continues serving all traffic"
echo ""

# Add Traefik Helm repo
helm repo add traefik https://traefik.github.io/charts
helm repo update

# Install Traefik with custom values
helm install traefik traefik/traefik \
  --namespace traefik-system \
  --create-namespace \
  -f "$(dirname "$0")/values.yaml" \
  --wait

echo ""
echo "✅ Traefik installed successfully"
echo "   Traefik LoadBalancer IP:"
kubectl get svc -n traefik-system traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
echo ""
`,
		Description: "Traefik Helm install script",
		Category:    "install",
	}
}

func generateHelmValues() generator.GeneratedFile {
	return generator.GeneratedFile{
		RelPath: "01-install-traefik/values.yaml",
		Content: `# Traefik Helm values — production-ready defaults
# Docs: https://doc.traefik.io/traefik/

# Replicas for high availability
deployment:
  replicas: 2

# Pod anti-affinity to spread across nodes
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app.kubernetes.io/name: traefik
          topologyKey: kubernetes.io/hostname

# Minimum availability
podDisruptionBudget:
  enabled: true
  minAvailable: 1

# Service — gets its own LoadBalancer IP
service:
  enabled: true
  type: LoadBalancer

# Entrypoints
ports:
  web:
    port: 8000
    expose:
      default: true
    exposedPort: 80
  websecure:
    port: 8443
    expose:
      default: true
    exposedPort: 443
    tls:
      enabled: true

logs:
  general:
    level: INFO
  access:
    enabled: true
`,
		Description: "Traefik Helm values file",
		Category:    "install",
	}
}

func generateMiddleware(ing scanner.IngressInfo) generator.GeneratedFile {
	var middlewares []string

	// Rate limiting
	if rps, ok := ing.NginxAnnotations["limit-rps"]; ok {
		middlewares = append(middlewares, fmt.Sprintf(`---
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: %s-rate-limit
  namespace: %s
spec:
  rateLimit:
    average: %s
    burst: %s`, ing.Name, ing.Namespace, rps, rps))
	}

	// IP allowlist
	if ips, ok := ing.NginxAnnotations["whitelist-source-range"]; ok {
		cidrs := strings.Split(ips, ",")
		cidrList := ""
		for _, c := range cidrs {
			cidrList += fmt.Sprintf("\n      - \"%s\"", strings.TrimSpace(c))
		}
		middlewares = append(middlewares, fmt.Sprintf(`---
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: %s-ip-allowlist
  namespace: %s
spec:
  ipAllowList:
    sourceRange:%s`, ing.Name, ing.Namespace, cidrList))
	}

	// Forward auth
	if authURL, ok := ing.NginxAnnotations["auth-url"]; ok {
		mw := fmt.Sprintf(`---
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: %s-forward-auth
  namespace: %s
spec:
  forwardAuth:
    address: "%s"`, ing.Name, ing.Namespace, authURL)

		if headers, ok := ing.NginxAnnotations["auth-response-headers"]; ok {
			mw += "\n    authResponseHeaders:"
			for _, h := range strings.Split(headers, ",") {
				mw += fmt.Sprintf("\n      - \"%s\"", strings.TrimSpace(h))
			}
		}
		middlewares = append(middlewares, mw)
	}

	// CORS
	if _, ok := ing.NginxAnnotations["enable-cors"]; ok {
		mw := fmt.Sprintf(`---
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: %s-cors
  namespace: %s
spec:
  headers:
    accessControlAllowMethods:
      - "GET"
      - "POST"
      - "PUT"
      - "DELETE"
      - "OPTIONS"
    accessControlAllowOriginList:
      - "*"
    accessControlMaxAge: 86400`, ing.Name, ing.Namespace)

		if origin, ok := ing.NginxAnnotations["cors-allow-origin"]; ok {
			mw = strings.Replace(mw, `- "*"`, fmt.Sprintf(`- "%s"`, origin), 1)
		}
		middlewares = append(middlewares, mw)
	}

	// SSL redirect
	if v, ok := ing.NginxAnnotations["ssl-redirect"]; ok && v == "true" {
		middlewares = append(middlewares, fmt.Sprintf(`---
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: %s-redirect-https
  namespace: %s
spec:
  redirectScheme:
    scheme: https
    permanent: true`, ing.Name, ing.Namespace))
	}

	if len(middlewares) == 0 {
		return generator.GeneratedFile{}
	}

	return generator.GeneratedFile{
		RelPath:     fmt.Sprintf("02-middlewares/%s-%s.yaml", ing.Namespace, ing.Name),
		Content:     strings.Join(middlewares, "\n"),
		Description: fmt.Sprintf("Traefik Middleware CRDs for %s/%s", ing.Namespace, ing.Name),
		Category:    "middleware",
	}
}

func generateUpdatedIngress(ing scanner.IngressInfo) generator.GeneratedFile {
	var b strings.Builder

	b.WriteString(fmt.Sprintf(`apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: %s
  namespace: %s
  annotations:
    # Switched to Traefik
    kubernetes.io/ingress.class: traefik`, ing.Name, ing.Namespace))

	// Add middleware annotations if any were generated
	var mwNames []string
	if _, ok := ing.NginxAnnotations["limit-rps"]; ok {
		mwNames = append(mwNames, fmt.Sprintf("%s-%s-rate-limit@kubernetescrd", ing.Namespace, ing.Name))
	}
	if _, ok := ing.NginxAnnotations["whitelist-source-range"]; ok {
		mwNames = append(mwNames, fmt.Sprintf("%s-%s-ip-allowlist@kubernetescrd", ing.Namespace, ing.Name))
	}
	if _, ok := ing.NginxAnnotations["auth-url"]; ok {
		mwNames = append(mwNames, fmt.Sprintf("%s-%s-forward-auth@kubernetescrd", ing.Namespace, ing.Name))
	}
	if _, ok := ing.NginxAnnotations["enable-cors"]; ok {
		mwNames = append(mwNames, fmt.Sprintf("%s-%s-cors@kubernetescrd", ing.Namespace, ing.Name))
	}
	if v, ok := ing.NginxAnnotations["ssl-redirect"]; ok && v == "true" {
		mwNames = append(mwNames, fmt.Sprintf("%s-%s-redirect-https@kubernetescrd", ing.Namespace, ing.Name))
	}

	if len(mwNames) > 0 {
		b.WriteString(fmt.Sprintf("\n    traefik.ingress.kubernetes.io/router.middlewares: %s",
			strings.Join(mwNames, ",")))
	}

	b.WriteString("\nspec:\n  ingressClassName: traefik\n")

	// TLS
	if len(ing.TLS) > 0 {
		b.WriteString("  tls:\n")
		for _, tls := range ing.TLS {
			b.WriteString(fmt.Sprintf("    - secretName: %s\n", tls.SecretName))
			if len(tls.Hosts) > 0 {
				b.WriteString("      hosts:\n")
				for _, h := range tls.Hosts {
					b.WriteString(fmt.Sprintf("        - %s\n", h))
				}
			}
		}
	}

	// Rules
	if len(ing.Rules) > 0 {
		b.WriteString("  rules:\n")
		for _, rule := range ing.Rules {
			b.WriteString(fmt.Sprintf("    - host: %s\n", rule.Host))
			if len(rule.Paths) > 0 {
				b.WriteString("      http:\n        paths:\n")
				for _, p := range rule.Paths {
					pathType := p.PathType
					if pathType == "" {
						pathType = "Prefix"
					}
					b.WriteString(fmt.Sprintf("          - path: %s\n", p.Path))
					b.WriteString(fmt.Sprintf("            pathType: %s\n", pathType))
					b.WriteString("            backend:\n")
					b.WriteString("              service:\n")
					b.WriteString(fmt.Sprintf("                name: %s\n", p.ServiceName))
					b.WriteString("                port:\n")
					b.WriteString(fmt.Sprintf("                  number: %d\n", p.ServicePort))
				}
			}
		}
	}

	return generator.GeneratedFile{
		RelPath:     fmt.Sprintf("03-ingresses/%s-%s.yaml", ing.Namespace, ing.Name),
		Content:     b.String(),
		Description: fmt.Sprintf("Updated Ingress for %s/%s (traefik ingressClassName)", ing.Namespace, ing.Name),
		Category:    "ingress",
	}
}

func generateVerifyScript(scan *scanner.ScanResult) generator.GeneratedFile {
	var b strings.Builder
	b.WriteString(`#!/bin/bash
set -euo pipefail

echo "=== Verifying Traefik Migration ==="
echo ""

# Get Traefik LoadBalancer IP
TRAEFIK_IP=$(kubectl get svc -n traefik-system traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)

if [ -z "$TRAEFIK_IP" ]; then
  echo "❌ Could not get Traefik LoadBalancer IP"
  exit 1
fi

echo "Traefik IP: $TRAEFIK_IP"
echo ""

`)

	for _, ing := range scan.Ingresses {
		for _, host := range ing.Hosts {
			b.WriteString(fmt.Sprintf(`echo "Testing %s..."
curl -sk --resolve %s:443:$TRAEFIK_IP https://%s/ -o /dev/null -w "  %%{http_code} %%{time_total}s\n"
`, host, host, host))
		}
	}

	b.WriteString(`
echo ""
echo "✅ Verification complete"
echo "   If all responses are 200, Traefik is ready for DNS cutover"
`)

	return generator.GeneratedFile{
		RelPath:     "04-verify.sh",
		Content:     b.String(),
		Description: "Verification script — tests all hosts via Traefik IP",
		Category:    "verify",
	}
}

func generateDNSGuide() generator.GeneratedFile {
	return generator.GeneratedFile{
		RelPath: "05-dns-migration.md",
		Content: `# DNS Migration Guide

## Overview

After verifying that Traefik serves all hosts correctly, update DNS to point to the Traefik LoadBalancer IP.

## Steps

1. **Get the Traefik IP:**
   ` + "```bash" + `
   kubectl get svc -n traefik-system traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
   ` + "```" + `

2. **Update DNS records** — change A/CNAME records to the Traefik IP

3. **Wait for propagation** — DNS TTL determines how long this takes (typically 5–60 minutes)

4. **Monitor** — watch logs for errors:
   ` + "```bash" + `
   kubectl logs -n traefik-system -l app.kubernetes.io/name=traefik -f
   ` + "```" + `

5. **Keep NGINX running** for at least 24 hours as a safety net

## Rollback

If issues are found, revert DNS to the NGINX LoadBalancer IP:
` + "```bash" + `
kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
` + "```" + `
`,
		Description: "DNS migration guide",
		Category:    "guide",
	}
}

func generateCleanupScript() generator.GeneratedFile {
	return generator.GeneratedFile{
		RelPath: "06-cleanup/remove-nginx.sh",
		Content: `#!/bin/bash
set -euo pipefail

echo "=== Removing NGINX Ingress Controller ==="
echo ""
echo "⚠️  WARNING: Only run this after:"
echo "   1. DNS has been updated to Traefik IP"
echo "   2. Traffic has been flowing through Traefik for 24+ hours"
echo "   3. No errors in Traefik logs"
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
