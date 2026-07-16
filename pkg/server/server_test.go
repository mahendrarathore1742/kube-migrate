package server

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/kube-migrate/kube-migrate/pkg/analyzer"
)

func TestIsKubernetesManifest(t *testing.T) {
	tests := []struct {
		name    string
		content string
		want    bool
	}{
		{"valid deployment", "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: test", true},
		{"valid service", "---\napiVersion: v1\nkind: Service\nmetadata:\n  name: svc", true},
		{"helm values", "replicas: 2\nservice:\n  type: LoadBalancer", false},
		{"shell script", "#!/bin/bash\nset -euo pipefail\necho hello", false},
		{"empty", "", false},
		{"apiVersion only", "apiVersion: v1\nname: test", false},
		{"kind only", "kind: ConfigMap\nname: test", false},
		{"configmap", "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: test", true},
		{"kustomization", "resources:\n  - deployment.yaml", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isKubernetesManifest(tt.content)
			if got != tt.want {
				t.Errorf("isKubernetesManifest() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestStatusWriter(t *testing.T) {
	sw := &statusWriter{status: 200}
	if sw.status != 200 {
		t.Errorf("expected 200, got %d", sw.status)
	}
}

func TestMiddlewareFunctions(t *testing.T) {
	dummy := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})
	if corsMiddleware(dummy) == nil {
		t.Error("corsMiddleware returned nil")
	}
	if loggingMiddleware(dummy) == nil {
		t.Error("loggingMiddleware returned nil")
	}
	if bodySizeMiddleware(dummy) == nil {
		t.Error("bodySizeMiddleware returned nil")
	}
}

func TestGuidesMapsExist(t *testing.T) {
	if len(traefikGuides) == 0 {
		t.Error("traefikGuides is empty")
	}
	if len(gatewayAPIGuides) == 0 {
		t.Error("gatewayAPIGuides is empty")
	}
	for _, key := range []string{"ssl-redirect", "auth-url", "limit-rps", "rewrite-target"} {
		if _, ok := traefikGuides[key]; !ok {
			t.Errorf("traefikGuides missing: %s", key)
		}
		if _, ok := gatewayAPIGuides[key]; !ok {
			t.Errorf("gatewayAPIGuides missing: %s", key)
		}
	}
}

func TestValidationHelpers(t *testing.T) {
	if boolToStatus(true) != "pass" {
		t.Error("boolToStatus(true) != pass")
	}
	if boolToStatus(false) != "fail" {
		t.Error("boolToStatus(false) != fail")
	}
	if boolToDetail(true, "y", "n") != "y" {
		t.Error("boolToDetail true failed")
	}
	if boolToDetail(false, "y", "n") != "n" {
		t.Error("boolToDetail false failed")
	}
}

func TestBuildSteps(t *testing.T) {
	for _, tc := range []struct {
		target string
		phase  string
	}{
		{"traefik", "pre-migration"},
		{"gateway-api", "pre-migration"},
		{"traefik", "migrating"},
		{"traefik", "post-migration"},
	} {
		steps := buildSteps(tc.target, tc.phase, false)
		if len(steps) == 0 {
			t.Errorf("buildSteps(%s, %s) returned empty", tc.target, tc.phase)
		}
	}
}

func TestBuildStepsEmptyPhase(t *testing.T) {
	steps := buildSteps("traefik", "unknown-phase", false)
	if steps != nil {
		t.Errorf("expected nil for unknown phase, got %v", steps)
	}
}

func TestEnrichReport(t *testing.T) {
	report := &analyzer.AnalysisReport{
		Target: "traefik",
		IngressReports: []analyzer.IngressReport{
			{
				Namespace: "default",
				Name:      "my-app",
				Mappings: []analyzer.AnnotationMapping{
					{
						OriginalKey: "ssl-redirect",
						Note:        "original note",
					},
					{
						OriginalKey: "unknown-annotation",
						Note:        "keep this",
					},
				},
			},
		},
	}

	enrichReport(report, "traefik")

	// First annotation should be enriched
	if report.IngressReports[0].Mappings[0].Note == "original note" {
		t.Error("enrichReport did not update note for ssl-redirect")
	}

	// Unknown annotation should keep original note
	if report.IngressReports[0].Mappings[1].Note != "keep this" {
		t.Error("enrichReport modified unknown annotation note")
	}
}

func TestEnrichReportGatewayAPI(t *testing.T) {
	report := &analyzer.AnalysisReport{
		Target: "gateway-api",
		IngressReports: []analyzer.IngressReport{
			{
				Namespace: "default",
				Name:      "api-gateway",
				Mappings: []analyzer.AnnotationMapping{
					{
						OriginalKey: "ssl-redirect",
						Note:        "old",
					},
				},
			},
		},
	}

	enrichReport(report, "gateway-api")

	// Should use gatewayAPIGuides
	if report.IngressReports[0].Mappings[0].Note == "old" {
		t.Error("enrichReport did not update note for gateway-api target")
	}
}

func TestSPAHandler(t *testing.T) {
	// Create a temporary directory with test files
	tmpDir := t.TempDir()
	testFile := filepath.Join(tmpDir, "test.html")
	if err := os.WriteFile(testFile, []byte("<html>test</html>"), 0644); err != nil {
		t.Fatal(err)
	}

	handler := spaHandler(http.Dir(tmpDir))
	if handler == nil {
		t.Error("spaHandler returned nil")
	}
}

func TestSPAHandlerFallback(t *testing.T) {
	tmpDir := t.TempDir()
	// Create index.html
	indexFile := filepath.Join(tmpDir, "index.html")
	if err := os.WriteFile(indexFile, []byte("<html>index</html>"), 0644); err != nil {
		t.Fatal(err)
	}

	handler := spaHandler(http.Dir(tmpDir))

	// Request for non-existent file should fallback to index.html
	req := httptest.NewRequest("GET", "/nonexistent", nil)
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestNewServer(t *testing.T) {
	srv := NewServer("/path/to/kubeconfig", "my-context", 3000)
	if srv.kubeconfig != "/path/to/kubeconfig" {
		t.Errorf("expected kubeconfig '/path/to/kubeconfig', got %q", srv.kubeconfig)
	}
	if srv.kubecontext != "my-context" {
		t.Errorf("expected context 'my-context', got %q", srv.kubecontext)
	}
	if srv.port != 3000 {
		t.Errorf("expected port 3000, got %d", srv.port)
	}
}
