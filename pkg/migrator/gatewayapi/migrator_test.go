package gatewayapi

import (
	"strings"
	"testing"

	"github.com/kube-migrate/kube-migrate/pkg/analyzer"
	"github.com/kube-migrate/kube-migrate/pkg/scanner"
)

func TestMigrate_Empty(t *testing.T) {
	m := NewMigrator()
	scan := &scanner.ScanResult{Ingresses: []scanner.IngressInfo{}}
	report := &analyzer.AnalysisReport{Target: "gateway-api"}

	files, err := m.Migrate(scan, report)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// CRD install + envoy install + envoy values + gatewayclass + gateway + verify + cleanup = 7
	if len(files) < 5 {
		t.Errorf("expected at least 5 base files, got %d", len(files))
	}
}

func TestMigrate_GeneratesHTTPRoutes(t *testing.T) {
	m := NewMigrator()
	scan := &scanner.ScanResult{
		Ingresses: []scanner.IngressInfo{
			{
				Namespace: "default",
				Name:      "my-app",
				Hosts:     []string{"app.example.com"},
				NginxAnnotations: map[string]string{
					"ssl-redirect": "true",
				},
				Rules: []scanner.RuleInfo{
					{
						Host: "app.example.com",
						Paths: []scanner.PathInfo{
							{Path: "/", PathType: "Prefix", ServiceName: "my-app", ServicePort: 80},
						},
					},
				},
			},
		},
	}
	report := &analyzer.AnalysisReport{Target: "gateway-api"}

	files, err := m.Migrate(scan, report)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	hasHTTPRoute := false
	hasRedirect := false
	for _, f := range files {
		if strings.Contains(f.RelPath, "04-httproutes/") {
			if strings.Contains(f.RelPath, "redirect") {
				hasRedirect = true
				if !strings.Contains(f.Content, "RequestRedirect") {
					t.Error("redirect route missing RequestRedirect filter")
				}
			} else {
				hasHTTPRoute = true
				if !strings.Contains(f.Content, "kind: HTTPRoute") {
					t.Error("HTTPRoute file missing kind")
				}
			}
		}
	}
	if !hasHTTPRoute {
		t.Error("no HTTPRoute files generated")
	}
	if !hasRedirect {
		t.Error("no redirect route generated")
	}
}

func TestMigrate_GeneratesPolicies(t *testing.T) {
	m := NewMigrator()
	scan := &scanner.ScanResult{
		Ingresses: []scanner.IngressInfo{
			{
				Namespace: "default",
				Name:      "api",
				NginxAnnotations: map[string]string{
					"limit-rps":          "10",
					"auth-url":           "http://auth.svc/verify",
					"proxy-read-timeout": "60",
				},
			},
		},
	}
	report := &analyzer.AnalysisReport{Target: "gateway-api"}

	files, err := m.Migrate(scan, report)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	hasRateLimit := false
	hasSecurity := false
	hasTimeout := false
	for _, f := range files {
		if strings.Contains(f.RelPath, "rate-limit") {
			hasRateLimit = true
		}
		if strings.Contains(f.RelPath, "security") {
			hasSecurity = true
		}
		if strings.Contains(f.RelPath, "timeout") {
			hasTimeout = true
		}
	}

	if !hasRateLimit {
		t.Error("no rate limit policy generated")
	}
	if !hasSecurity {
		t.Error("no security policy generated")
	}
	if !hasTimeout {
		t.Error("no timeout policy generated")
	}
}

func TestMigrate_GatewayHasTLSListeners(t *testing.T) {
	m := NewMigrator()
	scan := &scanner.ScanResult{
		Ingresses: []scanner.IngressInfo{
			{
				Namespace: "default",
				Name:      "my-app",
				Hosts:     []string{"app.example.com"},
				TLS: []scanner.TLSInfo{
					{Hosts: []string{"app.example.com"}, SecretName: "app-tls"},
				},
			},
		},
	}
	report := &analyzer.AnalysisReport{Target: "gateway-api"}

	files, err := m.Migrate(scan, report)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	for _, f := range files {
		if f.RelPath == "03-gateway/gateway.yaml" {
			if !strings.Contains(f.Content, "protocol: HTTPS") {
				t.Error("gateway missing HTTPS listener")
			}
			if !strings.Contains(f.Content, "app-tls") {
				t.Error("gateway missing TLS secret ref")
			}
		}
	}
}
