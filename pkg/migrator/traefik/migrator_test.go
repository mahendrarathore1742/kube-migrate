package traefik

import (
	"strings"
	"testing"

	"github.com/kube-migrate/kube-migrate/pkg/analyzer"
	"github.com/kube-migrate/kube-migrate/pkg/scanner"
)

func TestMigrate_Empty(t *testing.T) {
	m := NewMigrator()
	scan := &scanner.ScanResult{Ingresses: []scanner.IngressInfo{}}
	report := &analyzer.AnalysisReport{Target: "traefik"}

	files, err := m.Migrate(scan, report)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should still have install, verify, dns guide, cleanup
	if len(files) < 4 {
		t.Errorf("expected at least 4 base files, got %d", len(files))
	}
}

func TestMigrate_WithAnnotations(t *testing.T) {
	m := NewMigrator()
	scan := &scanner.ScanResult{
		Ingresses: []scanner.IngressInfo{
			{
				Namespace: "default",
				Name:      "my-app",
				Hosts:     []string{"app.example.com"},
				NginxAnnotations: map[string]string{
					"ssl-redirect": "true",
					"limit-rps":    "10",
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
	report := &analyzer.AnalysisReport{Target: "traefik"}

	files, err := m.Migrate(scan, report)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Check that middleware file was generated
	hasMiddleware := false
	hasIngress := false
	for _, f := range files {
		if strings.Contains(f.RelPath, "02-middlewares/") {
			hasMiddleware = true
			if !strings.Contains(f.Content, "rate-limit") {
				t.Error("middleware file missing rate-limit")
			}
			if !strings.Contains(f.Content, "redirect-https") {
				t.Error("middleware file missing redirect-https")
			}
		}
		if strings.Contains(f.RelPath, "03-ingresses/") {
			hasIngress = true
			if !strings.Contains(f.Content, "ingressClassName: traefik") {
				t.Error("ingress file missing traefik ingressClassName")
			}
		}
	}
	if !hasMiddleware {
		t.Error("no middleware files generated")
	}
	if !hasIngress {
		t.Error("no ingress files generated")
	}
}

func TestMigrate_VerifyScriptHasHosts(t *testing.T) {
	m := NewMigrator()
	scan := &scanner.ScanResult{
		Ingresses: []scanner.IngressInfo{
			{
				Namespace: "default",
				Name:      "web",
				Hosts:     []string{"web.example.com", "api.example.com"},
			},
		},
	}
	report := &analyzer.AnalysisReport{Target: "traefik"}

	files, err := m.Migrate(scan, report)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	for _, f := range files {
		if f.RelPath == "04-verify.sh" {
			if !strings.Contains(f.Content, "web.example.com") {
				t.Error("verify script missing host web.example.com")
			}
			if !strings.Contains(f.Content, "api.example.com") {
				t.Error("verify script missing host api.example.com")
			}
		}
	}
}
