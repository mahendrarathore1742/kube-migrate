package scanner

import (
	"testing"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TestMatchDeployment(t *testing.T) {
	tests := []struct {
		name         string
		deployment   appsv1.Deployment
		expectedType string
	}{
		{
			name: "nginx by name",
			deployment: appsv1.Deployment{
				ObjectMeta: metav1.ObjectMeta{
					Name: "ingress-nginx-controller",
				},
				Spec: appsv1.DeploymentSpec{
					Template: corev1.PodTemplateSpec{
						Spec: corev1.PodSpec{
							Containers: []corev1.Container{
								{Image: "nginx:1.25.3"},
							},
						},
					},
				},
			},
			expectedType: "nginx",
		},
		{
			name: "nginx by label",
			deployment: appsv1.Deployment{
				ObjectMeta: metav1.ObjectMeta{
					Name: "my-nginx",
					Labels: map[string]string{
						"app.kubernetes.io/name": "ingress-nginx",
					},
				},
				Spec: appsv1.DeploymentSpec{
					Template: corev1.PodTemplateSpec{
						Spec: corev1.PodSpec{
							Containers: []corev1.Container{
								{Image: "ingress-nginx/controller:v1.9.4"},
							},
						},
					},
				},
			},
			expectedType: "nginx",
		},
		{
			name: "traefik by name",
			deployment: appsv1.Deployment{
				ObjectMeta: metav1.ObjectMeta{
					Name: "traefik",
				},
				Spec: appsv1.DeploymentSpec{
					Template: corev1.PodTemplateSpec{
						Spec: corev1.PodSpec{
							Containers: []corev1.Container{
								{Image: "traefik:v3.0"},
							},
						},
					},
				},
			},
			expectedType: "traefik",
		},
		{
			name: "traefik by label",
			deployment: appsv1.Deployment{
				ObjectMeta: metav1.ObjectMeta{
					Name: "my-proxy",
					Labels: map[string]string{
						"app": "traefik",
					},
				},
				Spec: appsv1.DeploymentSpec{
					Template: corev1.PodTemplateSpec{
						Spec: corev1.PodSpec{
							Containers: []corev1.Container{
								{Image: "traefik:2.10"},
							},
						},
					},
				},
			},
			expectedType: "traefik",
		},
		{
			name: "envoy-gateway by name",
			deployment: appsv1.Deployment{
				ObjectMeta: metav1.ObjectMeta{
					Name: "envoy-gateway",
				},
				Spec: appsv1.DeploymentSpec{
					Template: corev1.PodTemplateSpec{
						Spec: corev1.PodSpec{
							Containers: []corev1.Container{
								{Image: "envoy-gateway:v1.0.0"},
							},
						},
					},
				},
			},
			expectedType: "envoy-gateway",
		},
		{
			name: "haproxy by name",
			deployment: appsv1.Deployment{
				ObjectMeta: metav1.ObjectMeta{
					Name: "haproxy-ingress",
				},
				Spec: appsv1.DeploymentSpec{
					Template: corev1.PodTemplateSpec{
						Spec: corev1.PodSpec{
							Containers: []corev1.Container{
								{Image: "haproxy:2.8"},
							},
						},
					},
				},
			},
			expectedType: "haproxy",
		},
		{
			name: "istio by name",
			deployment: appsv1.Deployment{
				ObjectMeta: metav1.ObjectMeta{
					Name: "istio-ingressgateway",
				},
				Spec: appsv1.DeploymentSpec{
					Template: corev1.PodTemplateSpec{
						Spec: corev1.PodSpec{
							Containers: []corev1.Container{
								{Image: "istio/proxyv2:1.20.0"},
							},
						},
					},
				},
			},
			expectedType: "istio",
		},
		{
			name: "unknown deployment",
			deployment: appsv1.Deployment{
				ObjectMeta: metav1.ObjectMeta{
					Name: "my-app",
				},
				Spec: appsv1.DeploymentSpec{
					Template: corev1.PodTemplateSpec{
						Spec: corev1.PodSpec{
							Containers: []corev1.Container{
								{Image: "my-app:1.0"},
							},
						},
					},
				},
			},
			expectedType: "unknown",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := matchDeployment(tt.deployment)
			if result.Type != tt.expectedType {
				t.Errorf("matchDeployment() type = %q, want %q", result.Type, tt.expectedType)
			}
		})
	}
}

func TestExtractVersion(t *testing.T) {
	tests := []struct {
		name        string
		containers  []corev1.Container
		expectedVer string
	}{
		{
			name: "simple version",
			containers: []corev1.Container{
				{Image: "nginx:1.25.3"},
			},
			expectedVer: "1.25.3",
		},
		{
			name: "version with prefix",
			containers: []corev1.Container{
				{Image: "traefik:v3.0.0"},
			},
			expectedVer: "v3.0.0",
		},
		{
			name: "version with suffix",
			containers: []corev1.Container{
				{Image: "envoy-gateway:v1.0.0-rc1"},
			},
			expectedVer: "v1.0.0",
		},
		{
			name: "no version tag",
			containers: []corev1.Container{
				{Image: "myapp"},
			},
			expectedVer: "unknown",
		},
		{
			name:       "empty containers",
			containers: []corev1.Container{},
			expectedVer: "unknown",
		},
		{
			name: "multiple containers",
			containers: []corev1.Container{
				{Image: "init:1.0"},
				{Image: "main:2.0"},
			},
			expectedVer: "1.0",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := extractVersion(tt.containers)
			if result != tt.expectedVer {
				t.Errorf("extractVersion() = %q, want %q", result, tt.expectedVer)
			}
		})
	}
}

func TestGetControllerPodName(t *testing.T) {
	deploy := appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name: "ingress-nginx-controller",
		},
	}
	result := getControllerPodName(deploy)
	if result != "ingress-nginx-controller" {
		t.Errorf("getControllerPodName() = %q, want %q", result, "ingress-nginx-controller")
	}
}

func TestClassifyComplexityExtended(t *testing.T) {
	tests := []struct {
		name     string
		annots   map[string]string
		expected string
	}{
		{
			name: "multiple moderate annotations",
			annots: map[string]string{
				"auth-url":  "http://auth/verify",
				"limit-rps": "10",
			},
			expected: "moderate",
		},
		{
			name: "canary annotations",
			annots: map[string]string{
				"canary":        "true",
				"canary-weight": "20",
			},
			expected: "moderate",
		},
		{
			name: "rewrite with regex",
			annots: map[string]string{
				"rewrite-target": "/$1",
				"use-regex":      "true",
			},
			expected: "moderate",
		},
		{
			name: "session affinity",
			annots: map[string]string{
				"affinity":            "true",
				"session-cookie-name": "route",
			},
			expected: "moderate",
		},
		{
			name: "IP filtering",
			annots: map[string]string{
				"whitelist-source-range": "10.0.0.0/8",
			},
			expected: "moderate",
		},
		{
			name: "timeouts",
			annots: map[string]string{
				"proxy-read-timeout":    "60",
				"proxy-connect-timeout": "5",
			},
			expected: "moderate",
		},
		{
			name: "modsecurity snippet",
			annots: map[string]string{
				"modsecurity-snippet": "SecRuleEngine On",
			},
			expected: "complex",
		},
		{
			name: "lua-resty-waf",
			annots: map[string]string{
				"lua-resty-waf": "active",
			},
			expected: "complex",
		},
		{
			name: "client-body-buffer-size",
			annots: map[string]string{
				"client-body-buffer-size": "8k",
			},
			expected: "complex",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := classifyComplexity(tt.annots)
			if got != tt.expected {
				t.Errorf("classifyComplexity(%v) = %q, want %q", tt.annots, got, tt.expected)
			}
		})
	}
}
