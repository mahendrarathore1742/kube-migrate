import { H1, H2, H3, P, Code, Callout, Table } from '../../components/Markdown';

export default function GatewayAPI() {
  return (
    <div className="max-w-3xl">
      <H1>Gateway API Migration</H1>
      <P>
        Gateway API is the official successor to the Ingress API in Kubernetes. It provides
        a more expressive, extensible, and role-oriented model for routing traffic.
        kube-migrate targets Envoy Gateway as the default Gateway API implementation.
      </P>

      <H2 id="overview">Overview</H2>
      <P>
        When migrating to Gateway API, kube-migrate converts NGINX Ingress resources to
        HTTPRoute resources, and maps annotations to BackendTrafficPolicy, SecurityPolicy,
        and other Gateway API policy resources.
      </P>

      <H2 id="generated-resources">Generated Resources</H2>
      <Table
        headers={['NGINX Concept', 'Gateway API Equivalent']}
        rows={[
          ['Ingress resource', 'HTTPRoute'],
          ['IngressClass', 'GatewayClass + Gateway'],
          ['nginx.ingress.kubernetes.io/ssl-redirect', 'HTTPRoute RequestRedirect filter'],
          ['nginx.ingress.kubernetes.io/proxy-body-size', 'Not natively supported'],
          ['nginx.ingress.kubernetes.io/rate-limit-*', 'BackendTrafficPolicy (Envoy Gateway)'],
          ['nginx.ingress.kubernetes.io/cors-*', 'SecurityPolicy (Envoy Gateway)'],
          ['nginx.ingress.kubernetes.io/auth-*', 'SecurityPolicy with OIDC/BasicAuth'],
          ['nginx.ingress.kubernetes.io/rewrite-target', 'HTTPRoute URLRewrite filter'],
          ['TLS termination', 'Gateway TLS listener + certificateRefs'],
        ]}
      />

      <H2 id="example">Example Migration</H2>
      <H3>Before: NGINX Ingress</H3>
      <Code>{`apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
spec:
  ingressClassName: nginx
  tls:
    - hosts: [app.example.com]
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 80`}</Code>

      <H3>After: Gateway API Resources</H3>
      <Code>{`# GatewayClass
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: envoy-gateway
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller
---
# Gateway
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: main-gateway
spec:
  gatewayClassName: envoy-gateway
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      tls:
        mode: Terminate
        certificateRefs:
          - name: app-tls
---
# HTTPRoute
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: my-app
spec:
  parentRefs:
    - name: main-gateway
  hostnames: [app.example.com]
  rules:
    - backendRefs:
        - name: my-app
          port: 80
---
# HTTPRoute for HTTPS redirect
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: my-app-redirect
spec:
  parentRefs:
    - name: main-gateway
      sectionName: http
  hostnames: [app.example.com]
  rules:
    - filters:
        - type: RequestRedirect
          requestRedirect:
            scheme: https
            statusCode: 301`}</Code>

      <Callout type="info" title="Envoy Gateway Policies">
        Features like rate limiting, timeouts, and CORS are configured via Envoy Gateway's
        policy CRDs (BackendTrafficPolicy, SecurityPolicy) rather than HTTPRoute annotations.
        kube-migrate generates these automatically.
      </Callout>

      <Callout type="tip" title="Gateway API Docs">
        See the{' '}
        <a href="https://gateway-api.sigs.k8s.io/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
          Gateway API documentation
        </a>{' '}
        and{' '}
        <a href="https://gateway.envoyproxy.io/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
          Envoy Gateway docs
        </a>{' '}
        for full references.
      </Callout>
    </div>
  );
}
