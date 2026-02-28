package scanner

// ScanResult holds everything discovered during a cluster scan.
type ScanResult struct {
	Controller ControllerInfo `json:"controller"`
	Ingresses  []IngressInfo  `json:"ingresses"`
}

// ControllerInfo describes the detected ingress controller.
type ControllerInfo struct {
	Type      string `json:"type"`
	Version   string `json:"version"`
	Namespace string `json:"namespace"`
	PodName   string `json:"podName"`
}

// IngressInfo describes a single Ingress resource.
type IngressInfo struct {
	Namespace        string            `json:"namespace"`
	Name             string            `json:"name"`
	IngressClassName string            `json:"ingressClassName"`
	Hosts            []string          `json:"hosts"`
	TLS              []TLSInfo         `json:"tls"`
	Rules            []RuleInfo        `json:"rules"`
	Annotations      map[string]string `json:"annotations"`
	NginxAnnotations map[string]string `json:"nginxAnnotations"`
	Complexity       string            `json:"complexity"`
}

// TLSInfo holds TLS configuration from an Ingress.
type TLSInfo struct {
	Hosts      []string `json:"hosts"`
	SecretName string   `json:"secretName"`
}

// RuleInfo holds a single Ingress rule.
type RuleInfo struct {
	Host  string     `json:"host"`
	Paths []PathInfo `json:"paths"`
}

// PathInfo holds a single path within an Ingress rule.
type PathInfo struct {
	Path        string `json:"path"`
	PathType    string `json:"pathType"`
	ServiceName string `json:"serviceName"`
	ServicePort int32  `json:"servicePort"`
}
