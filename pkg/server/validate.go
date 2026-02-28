package server

import (
	"context"

	corev1 "k8s.io/api/core/v1"

	"github.com/kube-migrate/kube-migrate/pkg/scanner"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// ValidationResult is the response for /api/validate.
type ValidationResult struct {
	Phase         string   `json:"phase"` // pre-migration | migrating | post-migration
	Target        string   `json:"target"`
	TargetRunning bool     `json:"targetRunning"`
	NginxRunning  bool     `json:"nginxRunning"`
	NextSteps     []string `json:"nextSteps"`
	Checks        []Check  `json:"checks"`
}

// Check is a single validation check result.
type Check struct {
	Name   string `json:"name"`
	Status string `json:"status"` // pass | fail | skip
	Detail string `json:"detail"`
}

func validateMigration(sc *scanner.Scanner, target string) *ValidationResult {
	ctx := context.Background()
	result := &ValidationResult{Target: target}

	// Check if NGINX is running
	result.NginxRunning = isPodRunning(sc, ctx, "ingress-nginx", "app.kubernetes.io/name=ingress-nginx,app.kubernetes.io/component=controller")

	// Check if target controller is running
	switch target {
	case "traefik":
		result.TargetRunning = isPodRunning(sc, ctx, "traefik-system", "app.kubernetes.io/name=traefik")
	case "gateway-api":
		result.TargetRunning = isPodRunning(sc, ctx, "envoy-gateway-system", "control-plane=envoy-gateway")
	}

	// Determine phase
	switch {
	case result.NginxRunning && !result.TargetRunning:
		result.Phase = "pre-migration"
	case result.NginxRunning && result.TargetRunning:
		result.Phase = "migrating"
	case !result.NginxRunning && result.TargetRunning:
		result.Phase = "post-migration"
	default:
		result.Phase = "pre-migration"
	}

	// Build checks
	result.Checks = buildChecks(sc, ctx, target, result)

	// Build next steps
	result.NextSteps = buildSteps(target, result.Phase, result.TargetRunning)

	return result
}

func isPodRunning(sc *scanner.Scanner, ctx context.Context, namespace, labelSelector string) bool {
	cs := sc.Clientset()
	if cs == nil {
		return false
	}

	pods, err := cs.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{
		LabelSelector: labelSelector,
		Limit:         1,
	})
	if err != nil || len(pods.Items) == 0 {
		return false
	}

	for _, pod := range pods.Items {
		if pod.Status.Phase == corev1.PodRunning {
			return true
		}
	}
	return false
}

func buildChecks(sc *scanner.Scanner, ctx context.Context, target string, result *ValidationResult) []Check {
	var checks []Check

	_ = sc
	_ = ctx

	checks = append(checks, Check{
		Name:   "NGINX Controller",
		Status: boolToStatus(result.NginxRunning),
		Detail: boolToDetail(result.NginxRunning, "NGINX is running", "NGINX not found"),
	})

	targetName := "Traefik"
	if target == "gateway-api" {
		targetName = "Envoy Gateway"
	}
	checks = append(checks, Check{
		Name:   targetName + " Controller",
		Status: boolToStatus(result.TargetRunning),
		Detail: boolToDetail(result.TargetRunning, targetName+" is running", targetName+" not found"),
	})

	return checks
}

func buildSteps(target, phase string, targetRunning bool) []string {
	switch phase {
	case "pre-migration":
		if target == "traefik" {
			return []string{
				"Generate migration files on the Migrate tab",
				"Review 00-migration-report.md to understand all changes",
				"Install Traefik alongside NGINX (safe — won't affect production traffic)",
			}
		}
		return []string{
			"Generate migration files on the Migrate tab",
			"Review 00-migration-report.md for a full migration overview",
			"Install Gateway API CRDs (standard-install.yaml)",
			"Install Envoy Gateway alongside NGINX (safe — won't affect production traffic)",
		}
	case "migrating":
		return []string{
			"Apply middleware/route resources",
			"Run verify.sh to test the new controller",
			"Update DNS to the new controller's LoadBalancer IP",
			"Monitor for 24+ hours before cleanup",
		}
	case "post-migration":
		return []string{
			"Monitor application logs and metrics for 24+ hours",
			"Verify all TLS certificates renew correctly",
			"Update any CI/CD pipelines to deploy new resource types",
		}
	}
	return nil
}

func boolToStatus(b bool) string {
	if b {
		return "pass"
	}
	return "fail"
}

func boolToDetail(b bool, pass, fail string) string {
	if b {
		return pass
	}
	return fail
}
