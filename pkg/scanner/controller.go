package scanner

import (
	"context"
	"fmt"
	"strings"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// detectController identifies the active ingress controller by inspecting
// deployments and services in common namespaces.
func (s *Scanner) detectController(ctx context.Context) (ControllerInfo, error) {
	// Check common ingress controller namespaces
	namespaces := []string{
		"ingress-nginx",
		"traefik",
		"envoy-gateway-system",
		"kube-system",
		"default",
	}

	for _, ns := range namespaces {
		controller, err := s.detectInNamespace(ctx, ns)
		if err == nil && controller.Type != "unknown" {
			return controller, nil
		}
	}

	return ControllerInfo{
		Type:    "unknown",
		Version: "unknown",
	}, fmt.Errorf("no ingress controller detected")
}

// detectInNamespace checks a specific namespace for ingress controller deployments.
func (s *Scanner) detectInNamespace(ctx context.Context, namespace string) (ControllerInfo, error) {
	deployList, err := s.clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return ControllerInfo{Type: "unknown", Version: "unknown"}, err
	}

	for _, deploy := range deployList.Items {
		controller := matchDeployment(deploy)
		if controller.Type != "unknown" {
			controller.Namespace = namespace
			controller.PodName = getControllerPodName(deploy)
			return controller, nil
		}
	}

	return ControllerInfo{Type: "unknown", Version: "unknown"}, fmt.Errorf("no controller found in %s", namespace)
}

// matchDeployment checks if a deployment matches known ingress controller patterns.
func matchDeployment(deploy appsv1.Deployment) ControllerInfo {
	name := strings.ToLower(deploy.Name)
	labels := deploy.Labels

	// NGINX Ingress Controller
	if strings.Contains(name, "ingress-nginx") ||
		labels["app.kubernetes.io/name"] == "ingress-nginx" ||
		labels["app"] == "ingress-nginx" {
		return ControllerInfo{
			Type:    "nginx",
			Version: extractVersion(deploy.Spec.Template.Spec.Containers),
			PodName: deploy.Name,
		}
	}

	// Traefik
	if strings.Contains(name, "traefik") ||
		labels["app.kubernetes.io/name"] == "traefik" ||
		labels["app"] == "traefik" {
		return ControllerInfo{
			Type:    "traefik",
			Version: extractVersion(deploy.Spec.Template.Spec.Containers),
			PodName: deploy.Name,
		}
	}

	// Envoy Gateway
	if strings.Contains(name, "envoy-gateway") ||
		strings.Contains(name, "gateway") && strings.Contains(name, "envoy") ||
		labels["app.kubernetes.io/name"] == "envoy-gateway" {
		return ControllerInfo{
			Type:    "envoy-gateway",
			Version: extractVersion(deploy.Spec.Template.Spec.Containers),
			PodName: deploy.Name,
		}
	}

	// HAProxy Ingress
	if strings.Contains(name, "haproxy") &&
		(strings.Contains(name, "ingress") || strings.Contains(name, "controller")) {
		return ControllerInfo{
			Type:    "haproxy",
			Version: extractVersion(deploy.Spec.Template.Spec.Containers),
			PodName: deploy.Name,
		}
	}

	// Istio
	if strings.Contains(name, "istio-ingress") ||
		labels["app"] == "istio-ingressgateway" {
		return ControllerInfo{
			Type:    "istio",
			Version: extractVersion(deploy.Spec.Template.Spec.Containers),
			PodName: deploy.Name,
		}
	}

	return ControllerInfo{Type: "unknown", Version: "unknown"}
}

// extractVersion attempts to extract version from container images.
func extractVersion(containers []corev1.Container) string {
	for _, c := range containers {
		parts := strings.Split(c.Image, ":")
		if len(parts) == 2 {
			version := parts[1]
			// Clean up version string
			if idx := strings.IndexAny(version, "-+"); idx > 0 {
				version = version[:idx]
			}
			return version
		}
	}
	return "unknown"
}

// getControllerPodName returns the deployment name as a base for pod lookup.
func getControllerPodName(deploy appsv1.Deployment) string {
	return deploy.Name
}
