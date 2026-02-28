package generator

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/kube-migrate/kube-migrate/pkg/analyzer"
)

func TestWrite(t *testing.T) {
	tmpDir := t.TempDir()

	gen := NewOutputGenerator(tmpDir)
	files := []GeneratedFile{
		{
			RelPath:     "01-install/install.sh",
			Content:     "#!/bin/bash\necho hello",
			Description: "Install script",
			Category:    "install",
		},
		{
			RelPath:     "02-routes/my-route.yaml",
			Content:     "apiVersion: v1\nkind: ConfigMap",
			Description: "A route",
			Category:    "httproute",
		},
	}

	report := &analyzer.AnalysisReport{
		Target: "traefik",
		Summary: analyzer.Summary{
			Total:           1,
			FullyCompatible: 1,
		},
	}

	if err := gen.Write(files, report); err != nil {
		t.Fatalf("Write failed: %v", err)
	}

	// Verify report file exists
	reportPath := filepath.Join(tmpDir, "00-migration-report.md")
	if _, err := os.Stat(reportPath); os.IsNotExist(err) {
		t.Error("migration report not created")
	}

	// Verify content files exist
	for _, f := range files {
		fullPath := filepath.Join(tmpDir, f.RelPath)
		data, err := os.ReadFile(fullPath)
		if err != nil {
			t.Errorf("file %s not created: %v", f.RelPath, err)
			continue
		}
		if string(data) != f.Content {
			t.Errorf("file %s: content mismatch", f.RelPath)
		}
	}
}

func TestBuildReport(t *testing.T) {
	gen := NewOutputGenerator(".")
	report := &analyzer.AnalysisReport{
		Target: "gateway-api",
		Summary: analyzer.Summary{
			Total:           3,
			FullyCompatible: 1,
			NeedsWorkaround: 1,
			HasUnsupported:  1,
		},
		IngressReports: []analyzer.IngressReport{
			{
				Namespace:     "default",
				Name:          "my-app",
				OverallStatus: "ready",
				Mappings: []analyzer.AnnotationMapping{
					{
						OriginalKey:    "ssl-redirect",
						OriginalValue:  "true",
						Status:         "supported",
						TargetResource: "HTTPRoute",
						Note:           "Use redirect filter",
					},
				},
			},
		},
	}

	md := gen.buildReport(report)

	if md == "" {
		t.Fatal("buildReport returned empty string")
	}
	if !contains(md, "gateway-api") {
		t.Error("report missing target name")
	}
	if !contains(md, "ssl-redirect") {
		t.Error("report missing annotation")
	}
	if !contains(md, "my-app") {
		t.Error("report missing ingress name")
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && searchString(s, substr)
}

func searchString(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
