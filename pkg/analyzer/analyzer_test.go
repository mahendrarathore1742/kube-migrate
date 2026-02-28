package analyzer

import (
	"testing"

	"github.com/kube-migrate/kube-migrate/pkg/scanner"
)

func TestNewAnalyzer(t *testing.T) {
	tests := []struct {
		target      string
		wantEntries bool
	}{
		{"traefik", true},
		{"gateway-api", true},
		{"unknown", false},
	}

	for _, tt := range tests {
		t.Run(tt.target, func(t *testing.T) {
			a := NewAnalyzer(tt.target)
			if a == nil {
				t.Fatal("NewAnalyzer returned nil")
			}
			if tt.wantEntries && len(a.mappings) == 0 {
				t.Error("expected mappings to be populated")
			}
			if !tt.wantEntries && len(a.mappings) != 0 {
				t.Errorf("expected empty mappings, got %d", len(a.mappings))
			}
		})
	}
}

func TestAnalyze_EmptyIngresses(t *testing.T) {
	a := NewAnalyzer("traefik")
	scan := &scanner.ScanResult{
		Ingresses: []scanner.IngressInfo{},
	}
	report := a.Analyze(scan)

	if report.Summary.Total != 0 {
		t.Errorf("expected 0 total, got %d", report.Summary.Total)
	}
}

func TestAnalyze_FullyCompatible(t *testing.T) {
	a := NewAnalyzer("traefik")
	scan := &scanner.ScanResult{
		Ingresses: []scanner.IngressInfo{
			{
				Namespace: "default",
				Name:      "my-app",
				NginxAnnotations: map[string]string{
					"ssl-redirect": "true",
					"limit-rps":    "10",
				},
			},
		},
	}
	report := a.Analyze(scan)

	if report.Summary.Total != 1 {
		t.Errorf("expected 1 total, got %d", report.Summary.Total)
	}
	if report.Summary.FullyCompatible != 1 {
		t.Errorf("expected 1 fully compatible, got %d", report.Summary.FullyCompatible)
	}
	if len(report.IngressReports[0].Mappings) != 2 {
		t.Errorf("expected 2 mappings, got %d", len(report.IngressReports[0].Mappings))
	}
}

func TestAnalyze_WithUnsupported(t *testing.T) {
	a := NewAnalyzer("traefik")
	scan := &scanner.ScanResult{
		Ingresses: []scanner.IngressInfo{
			{
				Namespace: "default",
				Name:      "my-app",
				NginxAnnotations: map[string]string{
					"configuration-snippet": "proxy_set_header X-Real-IP $remote_addr;",
				},
			},
		},
	}
	report := a.Analyze(scan)

	if report.Summary.HasUnsupported != 1 {
		t.Errorf("expected 1 unsupported, got %d", report.Summary.HasUnsupported)
	}
	if report.IngressReports[0].OverallStatus != "breaking" {
		t.Errorf("expected breaking status, got %s", report.IngressReports[0].OverallStatus)
	}
}

func TestAnalyze_WithPartial(t *testing.T) {
	a := NewAnalyzer("traefik")
	scan := &scanner.ScanResult{
		Ingresses: []scanner.IngressInfo{
			{
				Namespace: "default",
				Name:      "my-app",
				NginxAnnotations: map[string]string{
					"canary":        "true",
					"canary-weight": "20",
				},
			},
		},
	}
	report := a.Analyze(scan)

	if report.Summary.NeedsWorkaround != 1 {
		t.Errorf("expected 1 needs workaround, got %d", report.Summary.NeedsWorkaround)
	}
	if report.IngressReports[0].OverallStatus != "workaround" {
		t.Errorf("expected workaround status, got %s", report.IngressReports[0].OverallStatus)
	}
}

func TestAnalyze_GatewayAPI(t *testing.T) {
	a := NewAnalyzer("gateway-api")
	scan := &scanner.ScanResult{
		Ingresses: []scanner.IngressInfo{
			{
				Namespace: "default",
				Name:      "my-app",
				NginxAnnotations: map[string]string{
					"ssl-redirect":    "true",
					"rewrite-target":  "/$1",
					"proxy-body-size": "10m",
				},
			},
		},
	}
	report := a.Analyze(scan)

	if report.Target != "gateway-api" {
		t.Errorf("expected target gateway-api, got %s", report.Target)
	}
	if report.Summary.Total != 1 {
		t.Errorf("expected 1 total, got %d", report.Summary.Total)
	}
}

func TestMapAnnotation_Unknown(t *testing.T) {
	a := NewAnalyzer("traefik")
	mapping := a.mapAnnotation("totally-unknown-annotation", "value")

	if mapping.Status != "unsupported" {
		t.Errorf("expected unsupported status, got %s", mapping.Status)
	}
	if mapping.TargetResource != "N/A" {
		t.Errorf("expected N/A target, got %s", mapping.TargetResource)
	}
}

func TestCompatibilityMappingsComplete(t *testing.T) {
	// Verify key annotations exist in both mapping tables
	critical := []string{
		"ssl-redirect", "auth-url", "limit-rps", "rewrite-target",
		"whitelist-source-range", "proxy-read-timeout", "backend-protocol",
	}

	for _, key := range critical {
		if _, ok := traefikMappings[key]; !ok {
			t.Errorf("traefik mappings missing critical key: %s", key)
		}
		if _, ok := gatewayAPIMappings[key]; !ok {
			t.Errorf("gateway-api mappings missing critical key: %s", key)
		}
	}
}
