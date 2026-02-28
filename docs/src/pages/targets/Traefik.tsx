import { H1, H2, H3, P, Code, Callout, Table } from '../../components/Markdown';

export default function Traefik() {
  return (
    <div className="max-w-3xl">
      <H1>Traefik v3 Migration</H1>
      <P>
        Traefik v3 is a modern, cloud-native reverse proxy and load balancer with native
        Kubernetes support via IngressRoute CRDs and Middlewares.
      </P>

      <H2 id="overview">Overview</H2>
      <P>
        When migrating to Traefik, kube-migrate converts NGINX Ingress resources to Traefik-native
        CRDs. Each NGINX annotation is mapped to either a Middleware or an IngressRoute field.
      </P>

      <H2 id="generated-resources">Generated Resources</H2>
      <Table
        headers={['NGINX Concept', 'Traefik Equivalent']}
        rows={[
          ['Ingress resource', 'IngressRoute CRD'],
          ['nginx.ingress.kubernetes.io/ssl-redirect', 'Middleware: redirectScheme'],
          ['nginx.ingress.kubernetes.io/proxy-body-size', 'Middleware: buffering (maxRequestBodyBytes)'],
          ['nginx.ingress.kubernetes.io/rate-limit-*', 'Middleware: rateLimit'],
          ['nginx.ingress.kubernetes.io/cors-*', 'Middleware: headers (CORS fields)'],
          ['nginx.ingress.kubernetes.io/auth-*', 'Middleware: basicAuth / forwardAuth'],
          ['nginx.ingress.kubernetes.io/rewrite-target', 'Middleware: replacePathRegex'],
          ['nginx.ingress.kubernetes.io/whitelist-source-range', 'Middleware: ipAllowList'],
          ['TLS termination', 'TLS section in IngressRoute'],
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
    nginx.ingress.kubernetes.io/rate-limit-rps: "100"
spec:
  ingressClassName: nginx
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

      <H3>After: Traefik IngressRoute + Middlewares</H3>
      <Code>{`# Middleware: HTTPS redirect
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: my-app-redirect
spec:
  redirectScheme:
    scheme: https
    permanent: true
---
# Middleware: Rate limiting
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: my-app-rate-limit
spec:
  rateLimit:
    average: 100
    burst: 200
---
# IngressRoute
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: my-app
spec:
  entryPoints: [websecure]
  routes:
    - match: Host(\`app.example.com\`)
      kind: Rule
      middlewares:
        - name: my-app-redirect
        - name: my-app-rate-limit
      services:
        - name: my-app
          port: 80
  tls: {}`}</Code>

      <Callout type="tip" title="Traefik Docs">
        See the{' '}
        <a href="https://doc.traefik.io/traefik/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
          Traefik documentation
        </a>{' '}
        for the full reference of IngressRoute and Middleware CRDs.
      </Callout>
    </div>
  );
}
