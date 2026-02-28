package scanner

import (
	"context"
	"strings"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// detectController tries to find the active ingress controller in the cluster.
func (s *Scanner) detectController(ctx context.Context) (ControllerInfo, error) {
	// Search common namespaces for controller pods
	namespaces := []string{"ingress-nginx", "kube-system", "nginx-ingress"}

	for _, ns := range namespaces {
		pods, err := s.clientset.CoreV1().Pods(ns).List(ctx, metav1.ListOptions{
			LabelSelector: "app.kubernetes.io/name=ingress-nginx",
		})
		if err != nil {
			continue
		}
		for _, pod := range pods.Items {
			version := "unknown"
			for _, c := range pod.Spec.Containers {
				if strings.Contains(c.Image, "ingress-nginx") || strings.Contains(c.Image, "controller") {
					parts := strings.Split(c.Image, ":")
					if len(parts) > 1 {
						version = parts[len(parts)-1]
					}
				}
			}
			return ControllerInfo{
				Type:      "ingress-nginx",
				Version:   version,
				Namespace: ns,
				PodName:   pod.Name,
			}, nil
		}
	}

	// Try Traefik
	for _, ns := range []string{"traefik", "traefik-system", "kube-system"} {
		pods, err := s.clientset.CoreV1().Pods(ns).List(ctx, metav1.ListOptions{
			LabelSelector: "app.kubernetes.io/name=traefik",
		})
		if err != nil {
			continue
		}
		if len(pods.Items) > 0 {
			pod := pods.Items[0]
			version := "unknown"
			for _, c := range pod.Spec.Containers {
				parts := strings.Split(c.Image, ":")
				if len(parts) > 1 {
					version = parts[len(parts)-1]
				}
			}
			return ControllerInfo{
				Type:      "traefik",
				Version:   version,
				Namespace: ns,
				PodName:   pod.Name,
			}, nil
		}
	}

	return ControllerInfo{Type: "unknown", Version: "unknown"}, nil
}
