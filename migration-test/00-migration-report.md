# Migration Report

**Target:** gateway-api

## Summary

| Metric | Count |
|--------|-------|
| Total Ingresses | 6 |
| Fully Compatible ✅ | 0 |
| Needs Workaround ⚠️ | 0 |
| Has Unsupported ❌ | 6 |

## Per-Ingress Analysis

### ❌ demo-app/admin-panel

| Annotation | Status | Target Resource | Note |
|------------|--------|-----------------|------|
| ⚠️ `affinity-mode` | partial | BackendTrafficPolicy | Balanced mode not supported; persistent only |
| ⚠️ `session-cookie-max-age` | partial | BackendTrafficPolicy | Cookie TTL configurable in Envoy session persistence |
| ✅ `ssl-redirect` | supported | HTTPRoute (RequestRedirect) | Separate HTTPRoute with RequestRedirect filter for HTTP→HTTPS |
| ⚠️ `affinity` | partial | BackendTrafficPolicy | Envoy Gateway supports session persistence via BackendTrafficPolicy |
| ❌ `session-cookie-change-on-failure` | unsupported | N/A | No known mapping for this annotation |
| ⚠️ `session-cookie-name` | partial | BackendTrafficPolicy | Cookie name configurable in Envoy session persistence |
| ⚠️ `whitelist-source-range` | partial | SecurityPolicy | Use Envoy Gateway SecurityPolicy with authorization rules |
| ❌ `auth-realm` | unsupported | N/A | No known mapping for this annotation |
| ❌ `auth-type` | unsupported | N/A | No known mapping for this annotation |
| ❌ `auth-secret` | unsupported | N/A | No known mapping for this annotation |
| ❌ `proxy-body-size` | unsupported | N/A | No native body size limit in core Gateway API; use EnvoyPatchPolicy |

### ❌ demo-app/api-gateway

| Annotation | Status | Target Resource | Note |
|------------|--------|-----------------|------|
| ✅ `ssl-redirect` | supported | HTTPRoute (RequestRedirect) | Separate HTTPRoute with RequestRedirect filter for HTTP→HTTPS |
| ✅ `auth-response-headers` | supported | SecurityPolicy (ExtAuth) | Configure headersToBackend in SecurityPolicy ext-auth block |
| ❌ `proxy-buffering` | unsupported | N/A | No known mapping for this annotation |
| ⚠️ `auth-signin` | partial | SecurityPolicy (ExtAuth) | Envoy Gateway ext-auth doesn't have native signin redirect |
| ❌ `proxy-body-size` | unsupported | N/A | No native body size limit in core Gateway API; use EnvoyPatchPolicy |
| ❌ `proxy-buffer-size` | unsupported | N/A | No known mapping for this annotation |
| ⚠️ `proxy-send-timeout` | partial | BackendTrafficPolicy (Timeout) | No direct mapping; closest is request timeout |
| ✅ `proxy-read-timeout` | supported | BackendTrafficPolicy (Timeout) | Map to backendRequest timeout in BackendTrafficPolicy |
| ❌ `server-snippet` | unsupported | N/A | No equivalent; decompose into HTTPRoute filters / policies |
| ❌ `limit-burst-multiplier` | unsupported | N/A | No known mapping for this annotation |
| ⚠️ `custom-http-errors` | partial | EnvoyPatchPolicy | Custom error pages require EnvoyPatchPolicy or custom error filter |
| ⚠️ `upstream-hash-by` | partial | BackendTrafficPolicy | Use Envoy's ring hash load balancer via BackendTrafficPolicy |
| ✅ `limit-rps` | supported | BackendTrafficPolicy (RateLimit) | Envoy Gateway BackendTrafficPolicy with rateLimit rule |
| ✅ `auth-url` | supported | SecurityPolicy (ExtAuth) | Envoy Gateway SecurityPolicy with ext-auth HTTP backend |

### ❌ demo-app/grpc-service

| Annotation | Status | Target Resource | Note |
|------------|--------|-----------------|------|
| ✅ `ssl-redirect` | supported | HTTPRoute (RequestRedirect) | Separate HTTPRoute with RequestRedirect filter for HTTP→HTTPS |
| ✅ `backend-protocol` | supported | BackendRef (appProtocol) | Set appProtocol on Service for gRPC/h2c |
| ❌ `proxy-body-size` | unsupported | N/A | No native body size limit in core Gateway API; use EnvoyPatchPolicy |
| ✅ `proxy-read-timeout` | supported | BackendTrafficPolicy (Timeout) | Map to backendRequest timeout in BackendTrafficPolicy |
| ⚠️ `proxy-send-timeout` | partial | BackendTrafficPolicy (Timeout) | No direct mapping; closest is request timeout |
| ❌ `server-snippet` | unsupported | N/A | No equivalent; decompose into HTTPRoute filters / policies |

### ❌ demo-app/legacy-redirect

| Annotation | Status | Target Resource | Note |
|------------|--------|-----------------|------|
| ✅ `rewrite-target` | supported | HTTPRoute (URLRewrite) | Use HTTPRoute URLRewrite filter with replacePrefixMatch |
| ✅ `ssl-redirect` | supported | HTTPRoute (RequestRedirect) | Separate HTTPRoute with RequestRedirect filter for HTTP→HTTPS |
| ❌ `app-root` | unsupported | N/A | No known mapping for this annotation |
| ❌ `from-to-www-redirect` | unsupported | N/A | No known mapping for this annotation |
| ❌ `permanent-redirect` | unsupported | N/A | No known mapping for this annotation |
| ❌ `temporal-redirect` | unsupported | N/A | No known mapping for this annotation |
| ✅ `use-regex` | supported | HTTPRoute (RegularExpression) | Gateway API supports RegularExpression path match type |

### ❌ demo-app/main-website

| Annotation | Status | Target Resource | Note |
|------------|--------|-----------------|------|
| ⚠️ `cors-allow-methods` | partial | HTTPRoute (ResponseHeaderModifier) | Set Access-Control-Allow-Methods header manually |
| ✅ `limit-connections` | supported | BackendTrafficPolicy (ConnectionLimit) | Use Envoy Gateway connection limit in BackendTrafficPolicy |
| ✅ `limit-rps` | supported | BackendTrafficPolicy (RateLimit) | Envoy Gateway BackendTrafficPolicy with rateLimit rule |
| ⚠️ `cors-allow-headers` | partial | HTTPRoute (ResponseHeaderModifier) | Set Access-Control-Allow-Headers header manually |
| ⚠️ `enable-cors` | partial | HTTPRoute (ResponseHeaderModifier) | Core Gateway API has no native CORS; use ResponseHeaderModifier or Envoy filter |
| ✅ `force-ssl-redirect` | supported | HTTPRoute (RequestRedirect) | Same pattern as ssl-redirect using HTTPRoute filter |
| ⚠️ `proxy-connect-timeout` | partial | BackendTrafficPolicy (Timeout) | Omitted to avoid backendRequest ≤ request constraint violations |
| ✅ `ssl-redirect` | supported | HTTPRoute (RequestRedirect) | Separate HTTPRoute with RequestRedirect filter for HTTP→HTTPS |
| ✅ `proxy-read-timeout` | supported | BackendTrafficPolicy (Timeout) | Map to backendRequest timeout in BackendTrafficPolicy |
| ⚠️ `cors-max-age` | partial | HTTPRoute (ResponseHeaderModifier) | Set Access-Control-Max-Age header manually |
| ❌ `proxy-body-size` | unsupported | N/A | No native body size limit in core Gateway API; use EnvoyPatchPolicy |
| ❌ `configuration-snippet` | unsupported | N/A | Decompose into native Gateway API resources or EnvoyPatchPolicy |
| ⚠️ `cors-allow-origin` | partial | HTTPRoute (ResponseHeaderModifier) | Set Access-Control-Allow-Origin header manually |
| ⚠️ `proxy-send-timeout` | partial | BackendTrafficPolicy (Timeout) | No direct mapping; closest is request timeout |

### ❌ demo-app/websocket-app

| Annotation | Status | Target Resource | Note |
|------------|--------|-----------------|------|
| ✅ `proxy-http-version` | supported | Automatic | Envoy Gateway auto-detects HTTP/2 and WebSocket |
| ✅ `proxy-read-timeout` | supported | BackendTrafficPolicy (Timeout) | Map to backendRequest timeout in BackendTrafficPolicy |
| ✅ `use-regex` | supported | HTTPRoute (RegularExpression) | Gateway API supports RegularExpression path match type |
| ❌ `connection-proxy-header` | unsupported | N/A | No known mapping for this annotation |
| ⚠️ `proxy-send-timeout` | partial | BackendTrafficPolicy (Timeout) | No direct mapping; closest is request timeout |
| ✅ `ssl-redirect` | supported | HTTPRoute (RequestRedirect) | Separate HTTPRoute with RequestRedirect filter for HTTP→HTTPS |
| ⚠️ `upstream-hash-by` | partial | BackendTrafficPolicy | Use Envoy's ring hash load balancer via BackendTrafficPolicy |
| ❌ `configuration-snippet` | unsupported | N/A | Decompose into native Gateway API resources or EnvoyPatchPolicy |

