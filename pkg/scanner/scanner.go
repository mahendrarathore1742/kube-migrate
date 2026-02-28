package scanner

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	networkingv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

const nginxAnnotationPrefix = "nginx.ingress.kubernetes.io/"

// Scanner connects to a Kubernetes cluster and discovers Ingress resources.
type Scanner struct {
	clientset *kubernetes.Clientset
	config    Config
}

// Clientset returns the underlying Kubernetes clientset for advanced queries.
func (s *Scanner) Clientset() *kubernetes.Clientset {
	return s.clientset
}

// NewScanner creates a scanner connected to the cluster.
func NewScanner(kubeconfigPath, kubecontext string) (*Scanner, error) {
	cfg, err := buildConfig(kubeconfigPath, kubecontext)
	if err != nil {
		return nil, fmt.Errorf("building kubeconfig: %w", err)
	}

	cs, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		return nil, fmt.Errorf("creating kubernetes client: %w", err)
	}

	return &Scanner{
		clientset: cs,
		config:    loadConfig(),
	}, nil
}

// Scan enumerates all Ingress resources, detects the controller, and returns results.
func (s *Scanner) Scan(namespace string) (*ScanResult, error) {
	ctx := context.Background()

	// Detect controller
	controller, err := s.detectController(ctx)
	if err != nil {
		controller = ControllerInfo{Type: "unknown", Version: "unknown"}
	}

	// List ingresses
	var ingList *networkingv1.IngressList
	if namespace != "" {
		ingList, err = s.clientset.NetworkingV1().Ingresses(namespace).List(ctx, metav1.ListOptions{})
	} else {
		ingList, err = s.clientset.NetworkingV1().Ingresses("").List(ctx, metav1.ListOptions{})
	}
	if err != nil {
		return nil, fmt.Errorf("listing ingresses: %w", err)
	}

	ingresses := make([]IngressInfo, 0, len(ingList.Items))
	for _, ing := range ingList.Items {
		info := convertIngress(ing, s.config.IgnoreAnnotations)
		ingresses = append(ingresses, info)
	}

	return &ScanResult{
		Controller: controller,
		Ingresses:  ingresses,
	}, nil
}

func convertIngress(ing networkingv1.Ingress, ignorePrefixes []string) IngressInfo {
	info := IngressInfo{
		Namespace:        ing.Namespace,
		Name:             ing.Name,
		Annotations:      ing.Annotations,
		NginxAnnotations: make(map[string]string),
	}

	if ing.Spec.IngressClassName != nil {
		info.IngressClassName = *ing.Spec.IngressClassName
	}

	// Extract NGINX-specific annotations
	for k, v := range ing.Annotations {
		if strings.HasPrefix(k, nginxAnnotationPrefix) {
			shortKey := strings.TrimPrefix(k, nginxAnnotationPrefix)
			if !shouldIgnoreAnnotation(shortKey, ignorePrefixes) {
				info.NginxAnnotations[shortKey] = v
			}
		}
	}

	// Extract hosts
	hostSet := make(map[string]bool)
	for _, rule := range ing.Spec.Rules {
		if rule.Host != "" {
			hostSet[rule.Host] = true
		}
	}
	for h := range hostSet {
		info.Hosts = append(info.Hosts, h)
	}

	// Extract TLS
	for _, tls := range ing.Spec.TLS {
		info.TLS = append(info.TLS, TLSInfo{
			Hosts:      tls.Hosts,
			SecretName: tls.SecretName,
		})
	}

	// Extract rules
	for _, rule := range ing.Spec.Rules {
		ri := RuleInfo{Host: rule.Host}
		if rule.HTTP != nil {
			for _, path := range rule.HTTP.Paths {
				pi := PathInfo{
					Path:     path.Path,
					PathType: string(*path.PathType),
				}
				if path.Backend.Service != nil {
					pi.ServiceName = path.Backend.Service.Name
					if path.Backend.Service.Port.Number != 0 {
						pi.ServicePort = path.Backend.Service.Port.Number
					}
				}
				ri.Paths = append(ri.Paths, pi)
			}
		}
		info.Rules = append(info.Rules, ri)
	}

	info.Complexity = classifyComplexity(info.NginxAnnotations)

	return info
}

// classifyComplexity assigns a complexity tier based on annotation usage.
func classifyComplexity(nginx map[string]string) string {
	if len(nginx) == 0 {
		return "simple"
	}

	unsupported := map[string]bool{
		"proxy-body-size":         true,
		"client-body-buffer-size": true,
		"snippets":                true,
		"lua-resty-waf":           true,
		"modsecurity-snippet":     true,
	}

	complex := map[string]bool{
		"auth-url":               true,
		"auth-response-headers":  true,
		"canary":                 true,
		"canary-weight":          true,
		"limit-rps":              true,
		"limit-connections":      true,
		"rewrite-target":         true,
		"use-regex":              true,
		"affinity":               true,
		"whitelist-source-range": true,
		"denylist-source-range":  true,
		"proxy-read-timeout":     true,
		"proxy-connect-timeout":  true,
	}

	for k := range nginx {
		if unsupported[k] {
			return "complex"
		}
	}
	for k := range nginx {
		if complex[k] {
			return "moderate"
		}
	}
	return "simple"
}

func buildConfig(kubeconfigPath, kubecontext string) (*rest.Config, error) {
	if kubeconfigPath == "" {
		kubeconfigPath = os.Getenv("KUBECONFIG")
	}
	if kubeconfigPath == "" {
		home, _ := os.UserHomeDir()
		kubeconfigPath = filepath.Join(home, ".kube", "config")
	}

	loadingRules := &clientcmd.ClientConfigLoadingRules{ExplicitPath: kubeconfigPath}
	overrides := &clientcmd.ConfigOverrides{}
	if kubecontext != "" {
		overrides.CurrentContext = kubecontext
	}

	return clientcmd.NewNonInteractiveDeferredLoadingClientConfig(loadingRules, overrides).ClientConfig()
}
