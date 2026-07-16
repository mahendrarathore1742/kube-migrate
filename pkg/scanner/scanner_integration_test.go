package scanner

import (
	"context"
	"testing"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/fake"
)

func TestScanWithFakeClientset(t *testing.T) {
	// Create fake deployments
	deployments := []appsv1.Deployment{
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "ingress-nginx-controller",
				Namespace: "ingress-nginx",
				Labels: map[string]string{
					"app.kubernetes.io/name": "ingress-nginx",
				},
			},
			Spec: appsv1.DeploymentSpec{
				Template: corev1.PodTemplateSpec{
					Spec: corev1.PodSpec{
						Containers: []corev1.Container{
							{Name: "controller", Image: "ingress-nginx/controller:v1.9.4"},
						},
					},
				},
			},
		},
	}

	// Create fake ingresses
	ingresses := []networkingv1.Ingress{
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "my-app",
				Namespace: "default",
				Annotations: map[string]string{
					"nginx.ingress.kubernetes.io/ssl-redirect": "true",
					"nginx.ingress.kubernetes.io/limit-rps":    "10",
				},
			},
			Spec: networkingv1.IngressSpec{
				IngressClassName: strPtr("nginx"),
				Rules: []networkingv1.IngressRule{
					{
						Host: "myapp.example.com",
						IngressRuleValue: networkingv1.IngressRuleValue{
							HTTP: &networkingv1.HTTPIngressRuleValue{
								Paths: []networkingv1.HTTPIngressPath{
									{
										Path:     "/",
										PathType: pathTypePtr(networkingv1.PathTypePrefix),
										Backend: networkingv1.IngressBackend{
											Service: &networkingv1.IngressServiceBackend{
												Name: "my-app-svc",
												Port: networkingv1.ServiceBackendPort{
													Number: 80,
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	// Create fake clientset
	clientset := fake.NewSimpleClientset()

	// Add deployments
	for i := range deployments {
		_, err := clientset.AppsV1().Deployments(deployments[i].Namespace).Create(
			context.Background(), &deployments[i], metav1.CreateOptions{},
		)
		if err != nil {
			t.Fatalf("failed to create deployment: %v", err)
		}
	}

	// Add ingresses
	for i := range ingresses {
		_, err := clientset.NetworkingV1().Ingresses(ingresses[i].Namespace).Create(
			context.Background(), &ingresses[i], metav1.CreateOptions{},
		)
		if err != nil {
			t.Fatalf("failed to create ingress: %v", err)
		}
	}

	// Create scanner with fake clientset
	scanner := newScannerForTest(clientset)

	// Test scan
	result, err := scanner.Scan("")
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	// Verify controller detection
	if result.Controller.Type == "unknown" {
		t.Error("expected controller to be detected, got 'unknown'")
	}

	// Verify ingresses
	if len(result.Ingresses) != 1 {
		t.Fatalf("expected 1 ingress, got %d", len(result.Ingresses))
	}

	ing := result.Ingresses[0]
	if ing.Name != "my-app" {
		t.Errorf("expected ingress name 'my-app', got %q", ing.Name)
	}
	if ing.Namespace != "default" {
		t.Errorf("expected namespace 'default', got %q", ing.Namespace)
	}
	if len(ing.NginxAnnotations) != 2 {
		t.Errorf("expected 2 nginx annotations, got %d", len(ing.NginxAnnotations))
	}
	if ing.Complexity != "moderate" {
		t.Errorf("expected complexity 'moderate', got %q", ing.Complexity)
	}
}

func TestScanNamespaceFilter(t *testing.T) {
	clientset := fake.NewSimpleClientset()

	// Add ingress in default namespace
	ingress1 := &networkingv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "app-1",
			Namespace: "default",
		},
		Spec: networkingv1.IngressSpec{
			Rules: []networkingv1.IngressRule{
				{Host: "app1.example.com"},
			},
		},
	}
	clientset.NetworkingV1().Ingresses("default").Create(context.Background(), ingress1, metav1.CreateOptions{})

	// Add ingress in production namespace
	ingress2 := &networkingv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "app-2",
			Namespace: "production",
		},
		Spec: networkingv1.IngressSpec{
			Rules: []networkingv1.IngressRule{
				{Host: "app2.example.com"},
			},
		},
	}
	if _, err := clientset.NetworkingV1().Ingresses("production").Create(context.Background(), ingress2, metav1.CreateOptions{}); err != nil {
		t.Fatalf("failed to create ingress: %v", err)
	}

	scanner := newScannerForTest(clientset)

	// Scan only default namespace
	result, err := scanner.Scan("default")
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	if len(result.Ingresses) != 1 {
		t.Fatalf("expected 1 ingress in default namespace, got %d", len(result.Ingresses))
	}
	if result.Ingresses[0].Name != "app-1" {
		t.Errorf("expected ingress 'app-1', got %q", result.Ingresses[0].Name)
	}
}

func TestConvertIngressExtractsHosts(t *testing.T) {
	ingress := networkingv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "multi-host",
			Namespace: "default",
			Annotations: map[string]string{
				"nginx.ingress.kubernetes.io/ssl-redirect": "true",
				"custom-annotation":                        "value",
			},
		},
		Spec: networkingv1.IngressSpec{
			Rules: []networkingv1.IngressRule{
				{Host: "host1.example.com"},
				{Host: "host2.example.com"},
				{Host: "host3.example.com"},
			},
		},
	}

	info := convertIngress(ingress, nil)

	if len(info.Hosts) != 3 {
		t.Errorf("expected 3 hosts, got %d", len(info.Hosts))
	}

	// Check nginx annotations extracted correctly
	if len(info.NginxAnnotations) != 1 {
		t.Errorf("expected 1 nginx annotation, got %d", len(info.NginxAnnotations))
	}
	if _, ok := info.NginxAnnotations["ssl-redirect"]; !ok {
		t.Error("expected ssl-redirect annotation")
	}

	// Check all annotations preserved
	if len(info.Annotations) != 2 {
		t.Errorf("expected 2 total annotations, got %d", len(info.Annotations))
	}
}

func TestConvertIngressExtractsTLS(t *testing.T) {
	ingress := networkingv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "tls-app",
			Namespace: "default",
		},
		Spec: networkingv1.IngressSpec{
			TLS: []networkingv1.IngressTLS{
				{
					Hosts:      []string{"secure.example.com", "www.secure.example.com"},
					SecretName: "tls-secret",
				},
			},
			Rules: []networkingv1.IngressRule{
				{Host: "secure.example.com"},
			},
		},
	}

	info := convertIngress(ingress, nil)

	if len(info.TLS) != 1 {
		t.Fatalf("expected 1 TLS config, got %d", len(info.TLS))
	}
	if info.TLS[0].SecretName != "tls-secret" {
		t.Errorf("expected secret 'tls-secret', got %q", info.TLS[0].SecretName)
	}
	if len(info.TLS[0].Hosts) != 2 {
		t.Errorf("expected 2 TLS hosts, got %d", len(info.TLS[0].Hosts))
	}
}

func TestConvertIngressIgnoresAnnotations(t *testing.T) {
	ingress := networkingv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "filtered",
			Namespace: "default",
			Annotations: map[string]string{
				"nginx.ingress.kubernetes.io/ssl-redirect": "true",
				"kubectl.kubernetes.io/last-applied-configuration": "{}",
				"meta.helm.sh/release-name":                        "my-release",
				"custom-internal-annotation":                        "value",
			},
		},
	}

	// Ignore custom-internal-annotation
	info := convertIngress(ingress, []string{"custom-"})

	// Should only have ssl-redirect in nginx annotations
	if len(info.NginxAnnotations) != 1 {
		t.Errorf("expected 1 nginx annotation (filtered), got %d", len(info.NginxAnnotations))
	}
	if _, ok := info.NginxAnnotations["ssl-redirect"]; !ok {
		t.Error("expected ssl-redirect annotation")
	}
}

// newScannerForTest creates a Scanner with a fake clientset for testing.
// Note: This uses type assertion to set the concrete fake clientset.
func newScannerForTest(clientset *fake.Clientset) *Scanner {
	return &Scanner{
		clientset: clientset,
		config:    Config{},
	}
}

// Helper functions
func strPtr(s string) *string {
	return &s
}

func pathTypePtr(p networkingv1.PathType) *networkingv1.PathType {
	return &p
}
