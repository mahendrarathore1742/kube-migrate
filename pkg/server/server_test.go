package server

import (
	"net/http"
	"testing"
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
