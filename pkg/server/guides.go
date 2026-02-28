package server

// AnnotationGuide holds actionable fix information for a single annotation mapping issue.
type AnnotationGuide struct {
	What        string // what the annotation does
	Fix         string // specific steps to configure equivalent in target
	Example     string // YAML/command example
	DocsLink    string // upstream docs link
	Consequence string // what happens if not migrated
}

// traefikGuides maps annotation key → actionable fix guide for Traefik target.
var traefikGuides = map[string]AnnotationGuide{
	"affinity-mode": {
		What: "Controls how sticky sessions are re-balanced when pod replicas change.",
		Fix:  "Traefik only supports persistent stickiness. Balanced mode is not available.",
	},
	"ssl-redirect": {
		What: "Redirects HTTP requests to HTTPS.",
		Fix:  "Use Traefik RedirectScheme middleware with scheme=https, permanent=true.",
		Example: `apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: redirect-https
spec:
  redirectScheme:
    scheme: https
    permanent: true`,
	},
	"auth-url": {
		What: "Sends a subrequest to an external authentication service before proxying.",
		Fix:  "Use Traefik ForwardAuth middleware pointing to the same auth URL.",
		Example: `apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: forward-auth
spec:
  forwardAuth:
    address: "http://auth-service.default.svc.cluster.local/verify"
    authResponseHeaders:
      - Authorization
      - X-User-Id`,
	},
	"limit-rps": {
		What: "Limits requests per second from a single IP to prevent abuse.",
		Fix:  "Use Traefik RateLimit middleware with average + burst fields.",
		Example: `apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: rate-limit
spec:
  rateLimit:
    average: 10
    burst: 20`,
	},
	"proxy-body-size": {
		What: "Limits the maximum client request body size.",
		Fix:  "Use Traefik Buffering middleware with maxRequestBodyBytes.",
		Example: `apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: body-limit
spec:
  buffering:
    maxRequestBodyBytes: 10485760`,
		Consequence: "Without this, there is no upload size limit — large uploads could overwhelm backends.",
	},
	"configuration-snippet": {
		What:        "Injects raw NGINX configuration directly into the server block.",
		Fix:         "Decompose the snippet into native Traefik features: headers middleware, redirects, etc.",
		Consequence: "Snippet functionality will be lost entirely. Each directive must be manually replicated.",
	},
	"rewrite-target": {
		What: "Rewrites the URL path before proxying to the backend.",
		Fix:  "Use Traefik ReplacePathRegex middleware for capture group rewrites.",
		Example: `apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: rewrite
spec:
  replacePathRegex:
    regex: "^/api/(.*)"
    replacement: "/$1"`,
	},
	"whitelist-source-range": {
		What: "Restricts access to specific IP CIDR ranges.",
		Fix:  "Use Traefik IPAllowList middleware with the same CIDR list.",
		Example: `apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: ip-allowlist
spec:
  ipAllowList:
    sourceRange:
      - "10.0.0.0/8"
      - "192.168.1.0/24"`,
	},
	"enable-cors": {
		What: "Enables Cross-Origin Resource Sharing headers.",
		Fix:  "Use Traefik Headers middleware with accessControl* fields.",
	},
	"backend-protocol": {
		What: "Sets the backend protocol (e.g., GRPC, H2C).",
		Fix:  "Use Traefik service annotation: traefik.ingress.kubernetes.io/service.serversscheme: h2c",
	},
}

// gatewayAPIGuides maps annotation key → actionable fix guide for Gateway API target.
var gatewayAPIGuides = map[string]AnnotationGuide{
	"ssl-redirect": {
		What: "Redirects HTTP requests to HTTPS.",
		Fix:  "Create a separate HTTPRoute with RequestRedirect filter attached to the HTTP listener.",
		Example: `apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: redirect-http
spec:
  parentRefs:
    - name: main-gateway
      sectionName: http
  rules:
    - filters:
        - type: RequestRedirect
          requestRedirect:
            scheme: https
            statusCode: 301`,
	},
	"auth-url": {
		What: "Sends a subrequest to an external authentication service.",
		Fix:  "Use Envoy Gateway SecurityPolicy with ext-auth HTTP backend.",
		Example: `apiVersion: gateway.envoyproxy.io/v1alpha1
kind: SecurityPolicy
metadata:
  name: ext-auth
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: my-route
  extAuth:
    http:
      backendRef:
        name: auth-service
        port: 80`,
	},
	"limit-rps": {
		What: "Limits requests per second from a single IP.",
		Fix:  "Create an Envoy Gateway BackendTrafficPolicy with rateLimit rule.",
		Example: `apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata:
  name: rate-limit
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: my-route
  rateLimit:
    type: Local
    local:
      rules:
        - limit:
            requests: 10
            unit: Second`,
	},
	"proxy-body-size": {
		What:        "Limits the maximum client request body size.",
		Fix:         "No native Gateway API support. Use EnvoyPatchPolicy to inject buffer limits.",
		Consequence: "Without this, there is no upload size limit.",
	},
	"configuration-snippet": {
		What:        "Injects raw NGINX configuration directly.",
		Fix:         "Decompose into HTTPRoute filters, SecurityPolicy, BackendTrafficPolicy, or EnvoyPatchPolicy.",
		Consequence: "Snippet functionality will be lost entirely.",
	},
	"rewrite-target": {
		What: "Rewrites the URL path before proxying to the backend.",
		Fix:  "Use HTTPRoute URLRewrite filter with replacePrefixMatch.",
		Example: `rules:
  - matches:
      - path:
          type: PathPrefix
          value: /api
    filters:
      - type: URLRewrite
        urlRewrite:
          path:
            type: ReplacePrefixMatch
            replacePrefixMatch: /`,
	},
	"whitelist-source-range": {
		What: "Restricts access to specific IP CIDR ranges.",
		Fix:  "Use Envoy Gateway SecurityPolicy with authorization rules.",
	},
	"enable-cors": {
		What: "Enables Cross-Origin Resource Sharing headers.",
		Fix:  "Set CORS headers via HTTPRoute ResponseHeaderModifier or Envoy CORS filter.",
	},
	"backend-protocol": {
		What: "Sets the backend protocol (e.g., GRPC, H2C).",
		Fix:  "Set appProtocol on the Kubernetes Service.",
	},
	"proxy-read-timeout": {
		What: "Sets the read timeout for proxy connections to backends.",
		Fix:  "Map to backendRequest timeout in BackendTrafficPolicy.",
	},
}
