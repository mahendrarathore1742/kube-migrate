package analyzer

// CompatibilityEntry defines how a single NGINX annotation maps to a target.
type CompatibilityEntry struct {
	Status         string // supported | partial | unsupported
	TargetResource string // e.g. "Middleware (RateLimit)", "HTTPRoute"
	Note           string // human-readable explanation
}

// traefikMappings maps nginx annotation short keys to Traefik equivalents.
var traefikMappings = map[string]CompatibilityEntry{
	// --- SSL / TLS ---
	"ssl-redirect": {
		Status:         "supported",
		TargetResource: "Middleware (RedirectScheme)",
		Note:           "Use Traefik RedirectScheme middleware",
	},
	"force-ssl-redirect": {
		Status:         "supported",
		TargetResource: "Middleware (RedirectScheme)",
		Note:           "Same as ssl-redirect in Traefik",
	},
	"hsts": {
		Status:         "supported",
		TargetResource: "Middleware (Headers)",
		Note:           "Set via Traefik Headers middleware: stsSeconds, stsIncludeSubdomains",
	},
	"hsts-max-age": {
		Status:         "supported",
		TargetResource: "Middleware (Headers)",
		Note:           "Map to stsSeconds in Headers middleware",
	},
	"hsts-include-subdomains": {
		Status:         "supported",
		TargetResource: "Middleware (Headers)",
		Note:           "Map to stsIncludeSubdomains in Headers middleware",
	},
	"hsts-preload": {
		Status:         "supported",
		TargetResource: "Middleware (Headers)",
		Note:           "Map to stsPreload in Headers middleware",
	},

	// --- CORS ---
	"enable-cors": {
		Status:         "supported",
		TargetResource: "Middleware (Headers)",
		Note:           "Configure CORS via Traefik Headers middleware",
	},
	"cors-allow-origin": {
		Status:         "supported",
		TargetResource: "Middleware (Headers)",
		Note:           "Map to accessControlAllowOriginList",
	},
	"cors-allow-methods": {
		Status:         "supported",
		TargetResource: "Middleware (Headers)",
		Note:           "Map to accessControlAllowMethods",
	},
	"cors-allow-headers": {
		Status:         "supported",
		TargetResource: "Middleware (Headers)",
		Note:           "Map to accessControlAllowHeaders",
	},
	"cors-expose-headers": {
		Status:         "supported",
		TargetResource: "Middleware (Headers)",
		Note:           "Map to accessControlExposeHeaders",
	},
	"cors-max-age": {
		Status:         "supported",
		TargetResource: "Middleware (Headers)",
		Note:           "Map to accessControlMaxAge",
	},

	// --- Auth ---
	"auth-url": {
		Status:         "supported",
		TargetResource: "Middleware (ForwardAuth)",
		Note:           "Use Traefik ForwardAuth middleware with address field",
	},
	"auth-response-headers": {
		Status:         "supported",
		TargetResource: "Middleware (ForwardAuth)",
		Note:           "Map to authResponseHeaders in ForwardAuth",
	},
	"auth-signin": {
		Status:         "supported",
		TargetResource: "Middleware (ForwardAuth)",
		Note:           "Map to authResponseHeaders redirect in ForwardAuth",
	},

	// --- Rate Limiting ---
	"limit-rps": {
		Status:         "supported",
		TargetResource: "Middleware (RateLimit)",
		Note:           "Use Traefik RateLimit middleware: average + burst",
	},
	"limit-connections": {
		Status:         "supported",
		TargetResource: "Middleware (InFlightReq)",
		Note:           "Use Traefik InFlightReq middleware",
	},

	// --- IP Filtering ---
	"whitelist-source-range": {
		Status:         "supported",
		TargetResource: "Middleware (IPAllowList)",
		Note:           "Use Traefik IPAllowList middleware",
	},
	"denylist-source-range": {
		Status:         "partial",
		TargetResource: "Middleware (IPAllowList)",
		Note:           "Traefik has IPAllowList but no native denylist; invert logic or use plugin",
	},

	// --- Rewrite ---
	"rewrite-target": {
		Status:         "supported",
		TargetResource: "Middleware (ReplacePath/ReplacePathRegex)",
		Note:           "Use ReplacePathRegex middleware for capture group rewrites",
	},
	"use-regex": {
		Status:         "supported",
		TargetResource: "IngressRoute (PathRegexp)",
		Note:           "Traefik supports regex paths natively with PathRegexp matcher",
	},

	// --- Session Affinity ---
	"affinity": {
		Status:         "supported",
		TargetResource: "Service (sticky)",
		Note:           "Use Traefik sticky cookie on IngressRoute service",
	},
	"session-cookie-name": {
		Status:         "supported",
		TargetResource: "Service (sticky.cookie.name)",
		Note:           "Map to sticky.cookie.name",
	},
	"session-cookie-path": {
		Status:         "supported",
		TargetResource: "Service (sticky.cookie.path)",
		Note:           "Map to sticky.cookie.path",
	},
	"session-cookie-max-age": {
		Status:         "supported",
		TargetResource: "Service (sticky.cookie.maxAge)",
		Note:           "Map to sticky.cookie.maxAge",
	},
	"session-cookie-secure": {
		Status:         "supported",
		TargetResource: "Service (sticky.cookie.secure)",
		Note:           "Map to sticky.cookie.secure",
	},
	"session-cookie-samesite": {
		Status:         "supported",
		TargetResource: "Service (sticky.cookie.sameSite)",
		Note:           "Map to sticky.cookie.sameSite",
	},
	"affinity-mode": {
		Status:         "partial",
		TargetResource: "Service (sticky)",
		Note:           "Traefik doesn't support 'balanced' mode; only persistent stickiness",
	},

	// --- Canary ---
	"canary": {
		Status:         "partial",
		TargetResource: "Weighted Service",
		Note:           "Use Traefik weighted round robin; limited compared to NGINX canary",
	},
	"canary-weight": {
		Status:         "partial",
		TargetResource: "Weighted Service",
		Note:           "Map to Traefik weighted service; header/cookie canary needs TraefikService",
	},
	"canary-by-header": {
		Status:         "partial",
		TargetResource: "Middleware (Headers) + IngressRoute",
		Note:           "Requires separate IngressRoute with header match rule",
	},
	"canary-by-cookie": {
		Status:         "partial",
		TargetResource: "IngressRoute (HeadersRegexp)",
		Note:           "Requires cookie-based routing rule on IngressRoute",
	},

	// --- Timeouts ---
	"proxy-read-timeout": {
		Status:         "supported",
		TargetResource: "ServersTransport",
		Note:           "Map to responseHeaderTimeout in ServersTransport",
	},
	"proxy-connect-timeout": {
		Status:         "supported",
		TargetResource: "ServersTransport",
		Note:           "Map to dialTimeout in ServersTransport",
	},
	"proxy-send-timeout": {
		Status:         "supported",
		TargetResource: "ServersTransport",
		Note:           "Map to idleConnTimeout or forwardingTimeouts",
	},

	// --- WebSocket / gRPC ---
	"proxy-http-version": {
		Status:         "supported",
		TargetResource: "Automatic",
		Note:           "Traefik auto-detects HTTP/2 and WebSocket upgrade",
	},
	"backend-protocol": {
		Status:         "supported",
		TargetResource: "Service annotation",
		Note:           "Use traefik.ingress.kubernetes.io/service.serversscheme: h2c for gRPC",
	},

	// --- Body Size ---
	"proxy-body-size": {
		Status:         "partial",
		TargetResource: "Middleware (Buffering)",
		Note:           "Traefik Buffering middleware has maxRequestBodyBytes but behavior differs",
	},
	"client-body-buffer-size": {
		Status:         "partial",
		TargetResource: "Middleware (Buffering)",
		Note:           "Map to memRequestBodyBytes in Buffering middleware",
	},

	// --- Snippets / WAF ---
	"configuration-snippet": {
		Status:         "unsupported",
		TargetResource: "N/A",
		Note:           "Raw NGINX config not portable; decompose into native Traefik features",
	},
	"server-snippet": {
		Status:         "unsupported",
		TargetResource: "N/A",
		Note:           "Raw NGINX server block not portable; use Traefik middleware chain",
	},
	"snippets": {
		Status:         "unsupported",
		TargetResource: "N/A",
		Note:           "Generic snippets not portable to Traefik",
	},
	"lua-resty-waf": {
		Status:         "unsupported",
		TargetResource: "N/A",
		Note:           "Lua-based WAF not available in Traefik; consider Traefik plugin or external WAF",
	},
	"modsecurity-snippet": {
		Status:         "unsupported",
		TargetResource: "N/A",
		Note:           "ModSecurity not available in Traefik; use Traefik plugin or external WAF",
	},

	// --- Custom Headers ---
	"custom-http-errors": {
		Status:         "supported",
		TargetResource: "Middleware (Errors)",
		Note:           "Use Traefik Errors middleware with custom error pages",
	},
	"proxy-set-headers": {
		Status:         "supported",
		TargetResource: "Middleware (Headers)",
		Note:           "Map to customRequestHeaders in Headers middleware",
	},

	// --- Misc ---
	"upstream-hash-by": {
		Status:         "unsupported",
		TargetResource: "N/A",
		Note:           "Consistent hashing not natively supported in Traefik",
	},
}

// gatewayAPIMappings maps nginx annotation short keys to Gateway API equivalents.
var gatewayAPIMappings = map[string]CompatibilityEntry{
	// --- SSL / TLS ---
	"ssl-redirect": {
		Status:         "supported",
		TargetResource: "HTTPRoute (RequestRedirect)",
		Note:           "Separate HTTPRoute with RequestRedirect filter for HTTP→HTTPS",
	},
	"force-ssl-redirect": {
		Status:         "supported",
		TargetResource: "HTTPRoute (RequestRedirect)",
		Note:           "Same pattern as ssl-redirect using HTTPRoute filter",
	},
	"hsts": {
		Status:         "supported",
		TargetResource: "HTTPRoute (ResponseHeaderModifier)",
		Note:           "Add Strict-Transport-Security header via ResponseHeaderModifier",
	},
	"hsts-max-age": {
		Status:         "supported",
		TargetResource: "HTTPRoute (ResponseHeaderModifier)",
		Note:           "Part of HSTS header value in ResponseHeaderModifier",
	},
	"hsts-include-subdomains": {
		Status:         "supported",
		TargetResource: "HTTPRoute (ResponseHeaderModifier)",
		Note:           "Part of HSTS header value",
	},
	"hsts-preload": {
		Status:         "supported",
		TargetResource: "HTTPRoute (ResponseHeaderModifier)",
		Note:           "Part of HSTS header value",
	},

	// --- CORS ---
	"enable-cors": {
		Status:         "partial",
		TargetResource: "HTTPRoute (ResponseHeaderModifier)",
		Note:           "Core Gateway API has no native CORS; use ResponseHeaderModifier or Envoy filter",
	},
	"cors-allow-origin": {
		Status:         "partial",
		TargetResource: "HTTPRoute (ResponseHeaderModifier)",
		Note:           "Set Access-Control-Allow-Origin header manually",
	},
	"cors-allow-methods": {
		Status:         "partial",
		TargetResource: "HTTPRoute (ResponseHeaderModifier)",
		Note:           "Set Access-Control-Allow-Methods header manually",
	},
	"cors-allow-headers": {
		Status:         "partial",
		TargetResource: "HTTPRoute (ResponseHeaderModifier)",
		Note:           "Set Access-Control-Allow-Headers header manually",
	},
	"cors-expose-headers": {
		Status:         "partial",
		TargetResource: "HTTPRoute (ResponseHeaderModifier)",
		Note:           "Set Access-Control-Expose-Headers header manually",
	},
	"cors-max-age": {
		Status:         "partial",
		TargetResource: "HTTPRoute (ResponseHeaderModifier)",
		Note:           "Set Access-Control-Max-Age header manually",
	},

	// --- Auth ---
	"auth-url": {
		Status:         "supported",
		TargetResource: "SecurityPolicy (ExtAuth)",
		Note:           "Envoy Gateway SecurityPolicy with ext-auth HTTP backend",
	},
	"auth-response-headers": {
		Status:         "supported",
		TargetResource: "SecurityPolicy (ExtAuth)",
		Note:           "Configure headersToBackend in SecurityPolicy ext-auth block",
	},
	"auth-signin": {
		Status:         "partial",
		TargetResource: "SecurityPolicy (ExtAuth)",
		Note:           "Envoy Gateway ext-auth doesn't have native signin redirect",
	},

	// --- Rate Limiting ---
	"limit-rps": {
		Status:         "supported",
		TargetResource: "BackendTrafficPolicy (RateLimit)",
		Note:           "Envoy Gateway BackendTrafficPolicy with rateLimit rule",
	},
	"limit-connections": {
		Status:         "supported",
		TargetResource: "BackendTrafficPolicy (ConnectionLimit)",
		Note:           "Use Envoy Gateway connection limit in BackendTrafficPolicy",
	},

	// --- IP Filtering ---
	"whitelist-source-range": {
		Status:         "partial",
		TargetResource: "SecurityPolicy",
		Note:           "Use Envoy Gateway SecurityPolicy with authorization rules",
	},
	"denylist-source-range": {
		Status:         "partial",
		TargetResource: "SecurityPolicy",
		Note:           "Use Envoy Gateway SecurityPolicy with deny authorization",
	},

	// --- Rewrite ---
	"rewrite-target": {
		Status:         "supported",
		TargetResource: "HTTPRoute (URLRewrite)",
		Note:           "Use HTTPRoute URLRewrite filter with replacePrefixMatch",
	},
	"use-regex": {
		Status:         "supported",
		TargetResource: "HTTPRoute (RegularExpression)",
		Note:           "Gateway API supports RegularExpression path match type",
	},

	// --- Session Affinity ---
	"affinity": {
		Status:         "partial",
		TargetResource: "BackendTrafficPolicy",
		Note:           "Envoy Gateway supports session persistence via BackendTrafficPolicy",
	},
	"session-cookie-name": {
		Status:         "partial",
		TargetResource: "BackendTrafficPolicy",
		Note:           "Cookie name configurable in Envoy session persistence",
	},
	"session-cookie-path": {
		Status:         "partial",
		TargetResource: "BackendTrafficPolicy",
		Note:           "Cookie path configurable in Envoy session persistence",
	},
	"session-cookie-max-age": {
		Status:         "partial",
		TargetResource: "BackendTrafficPolicy",
		Note:           "Cookie TTL configurable in Envoy session persistence",
	},
	"session-cookie-secure": {
		Status:         "partial",
		TargetResource: "BackendTrafficPolicy",
		Note:           "Secure flag behavior differs from NGINX",
	},
	"session-cookie-samesite": {
		Status:         "partial",
		TargetResource: "BackendTrafficPolicy",
		Note:           "SameSite may not be directly configurable",
	},
	"affinity-mode": {
		Status:         "partial",
		TargetResource: "BackendTrafficPolicy",
		Note:           "Balanced mode not supported; persistent only",
	},

	// --- Canary ---
	"canary": {
		Status:         "supported",
		TargetResource: "HTTPRoute (weight)",
		Note:           "Use HTTPRoute backendRef weight for traffic splitting",
	},
	"canary-weight": {
		Status:         "supported",
		TargetResource: "HTTPRoute (weight)",
		Note:           "Map to backendRef weight in HTTPRoute",
	},
	"canary-by-header": {
		Status:         "supported",
		TargetResource: "HTTPRoute (HeaderMatch)",
		Note:           "Use HTTPRoute header match rule",
	},
	"canary-by-cookie": {
		Status:         "partial",
		TargetResource: "HTTPRoute",
		Note:           "Gateway API doesn't have native cookie matching; use header workaround",
	},

	// --- Timeouts ---
	"proxy-read-timeout": {
		Status:         "supported",
		TargetResource: "BackendTrafficPolicy (Timeout)",
		Note:           "Map to backendRequest timeout in BackendTrafficPolicy",
	},
	"proxy-connect-timeout": {
		Status:         "partial",
		TargetResource: "BackendTrafficPolicy (Timeout)",
		Note:           "Omitted to avoid backendRequest ≤ request constraint violations",
	},
	"proxy-send-timeout": {
		Status:         "partial",
		TargetResource: "BackendTrafficPolicy (Timeout)",
		Note:           "No direct mapping; closest is request timeout",
	},

	// --- WebSocket / gRPC ---
	"proxy-http-version": {
		Status:         "supported",
		TargetResource: "Automatic",
		Note:           "Envoy Gateway auto-detects HTTP/2 and WebSocket",
	},
	"backend-protocol": {
		Status:         "supported",
		TargetResource: "BackendRef (appProtocol)",
		Note:           "Set appProtocol on Service for gRPC/h2c",
	},

	// --- Body Size ---
	"proxy-body-size": {
		Status:         "unsupported",
		TargetResource: "N/A",
		Note:           "No native body size limit in core Gateway API; use EnvoyPatchPolicy",
	},
	"client-body-buffer-size": {
		Status:         "unsupported",
		TargetResource: "N/A",
		Note:           "No direct equivalent in Gateway API",
	},

	// --- Snippets / WAF ---
	"configuration-snippet": {
		Status:         "unsupported",
		TargetResource: "N/A",
		Note:           "Decompose into native Gateway API resources or EnvoyPatchPolicy",
	},
	"server-snippet": {
		Status:         "unsupported",
		TargetResource: "N/A",
		Note:           "No equivalent; decompose into HTTPRoute filters / policies",
	},
	"snippets": {
		Status:         "unsupported",
		TargetResource: "N/A",
		Note:           "Generic snippets not portable",
	},
	"lua-resty-waf": {
		Status:         "unsupported",
		TargetResource: "N/A",
		Note:           "Use external WAF or Envoy ext_authz",
	},
	"modsecurity-snippet": {
		Status:         "unsupported",
		TargetResource: "N/A",
		Note:           "No ModSecurity in Envoy; use external WAF",
	},

	// --- Custom Headers ---
	"custom-http-errors": {
		Status:         "partial",
		TargetResource: "EnvoyPatchPolicy",
		Note:           "Custom error pages require EnvoyPatchPolicy or custom error filter",
	},
	"proxy-set-headers": {
		Status:         "supported",
		TargetResource: "HTTPRoute (RequestHeaderModifier)",
		Note:           "Use RequestHeaderModifier filter in HTTPRoute",
	},

	// --- Misc ---
	"upstream-hash-by": {
		Status:         "partial",
		TargetResource: "BackendTrafficPolicy",
		Note:           "Use Envoy's ring hash load balancer via BackendTrafficPolicy",
	},
}
