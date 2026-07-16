package generator

import (
	"archive/zip"
	"bytes"
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

func TestBuildReportFile(t *testing.T) {
	gen := NewOutputGenerator(".")
	report := &analyzer.AnalysisReport{
		Target: "traefik",
		Summary: analyzer.Summary{
			Total:           2,
			FullyCompatible: 2,
		},
		IngressReports: []analyzer.IngressReport{
			{
				Namespace:     "production",
				Name:          "api-gateway",
				OverallStatus: "ready",
				Mappings: []analyzer.AnnotationMapping{
					{
						OriginalKey:    "limit-rps",
						OriginalValue:  "100",
						Status:         "supported",
						TargetResource: "Middleware (RateLimit)",
						Note:           "Use RateLimit middleware",
					},
				},
			},
		},
	}

	file := gen.BuildReportFile(report)

	if file.Category != "guide" {
		t.Errorf("expected category 'guide', got %q", file.Category)
	}
	if file.RelPath != "00-migration-report.md" {
		t.Errorf("expected path '00-migration-report.md', got %q", file.RelPath)
	}
	if !contains(file.Content, "traefik") {
		t.Error("report content missing target")
	}
	if !contains(file.Content, "api-gateway") {
		t.Error("report content missing ingress name")
	}
}

func TestCreateZip(t *testing.T) {
	files := []GeneratedFile{
		{
			RelPath:     "install.sh",
			Content:     "#!/bin/bash\necho install",
			Description: "Install script",
			Category:    "install",
		},
		{
			RelPath:     "route.yaml",
			Content:     "apiVersion: gateway.networking.k8s.io/v1\nkind: HTTPRoute",
			Description: "HTTPRoute",
			Category:    "httproute",
		},
	}

	report := &analyzer.AnalysisReport{
		Target: "gateway-api",
		Summary: analyzer.Summary{
			Total:           1,
			FullyCompatible: 1,
		},
	}

	zipData, err := CreateZip(files, report)
	if err != nil {
		t.Fatalf("CreateZip failed: %v", err)
	}

	if len(zipData) == 0 {
		t.Fatal("CreateZip returned empty data")
	}

	// Verify it's a valid ZIP
	zipReader, err := zip.NewReader(bytes.NewReader(zipData), int64(len(zipData)))
	if err != nil {
		t.Fatalf("invalid ZIP data: %v", err)
	}

	// Check expected files
	expectedFiles := map[string]bool{
		"install.sh":            false,
		"route.yaml":            false,
		"00-migration-report.md": false,
	}

	for _, f := range zipReader.File {
		name := f.FileInfo().Name()
		if _, ok := expectedFiles[name]; ok {
			expectedFiles[name] = true
		}
	}

	for name, found := range expectedFiles {
		if !found {
			t.Errorf("ZIP missing expected file: %s", name)
		}
	}
}

func TestCreateZipEmpty(t *testing.T) {
	files := []GeneratedFile{}
	report := &analyzer.AnalysisReport{
		Target: "traefik",
		Summary: analyzer.Summary{
			Total: 0,
		},
	}

	zipData, err := CreateZip(files, report)
	if err != nil {
		t.Fatalf("CreateZip failed: %v", err)
	}

	if len(zipData) == 0 {
		t.Fatal("CreateZip returned empty data for empty input")
	}
}

func TestGenerateMigrationReport(t *testing.T) {
	report := &analyzer.AnalysisReport{
		Target: "traefik",
		Summary: analyzer.Summary{
			Total:           5,
			FullyCompatible: 3,
			NeedsWorkaround: 1,
			HasUnsupported:  1,
		},
	}

	content := GenerateMigrationReport([]GeneratedFile{}, report)

	if content == "" {
		t.Fatal("GenerateMigrationReport returned empty string")
	}
	if !contains(content, "5") {
		t.Error("report missing total count")
	}
	if !contains(content, "3") {
		t.Error("report missing compatible count")
	}
	if !contains(content, "traefik") {
		t.Error("report missing target name")
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
