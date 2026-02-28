import { H1, H2, P, Code, Callout, Table } from '../../components/Markdown';

export default function Detect() {
  return (
    <div className="max-w-3xl">
      <H1>🔍 Detect</H1>
      <P>
        The Detect step scans your Kubernetes cluster to discover the active ingress controller
        and enumerate all Ingress resources.
      </P>

      <H2 id="what-it-does">What it Does</H2>
      <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 mb-4 ml-2">
        <li>Identifies the ingress controller type, version, namespace, and pod name</li>
        <li>Lists all Ingress resources across the target namespace (or all namespaces)</li>
        <li>Extracts NGINX-specific annotations from each Ingress</li>
        <li>Classifies each Ingress by migration complexity: <strong className="text-emerald-400">simple</strong>, <strong className="text-amber-400">moderate</strong>, or <strong className="text-red-400">complex</strong></li>
        <li>Collects TLS configuration and host/path rules</li>
      </ul>

      <H2 id="cli">CLI Usage</H2>
      <Code>{`# Scan all namespaces
kube-migrate scan

# Scan a specific namespace
kube-migrate scan --namespace production

# Use a specific kubeconfig context
kube-migrate scan --context staging-cluster`}</Code>

      <H2 id="api">API Endpoint</H2>
      <Table
        headers={['Method', 'Endpoint', 'Description']}
        rows={[['POST', '/api/scan', 'Scan the cluster and return controller + ingresses']]}
      />
      <P>Response contains:</P>
      <Code>{`{
  "controller": {
    "type": "ingress-nginx",
    "version": "v1.11.1",
    "namespace": "ingress-nginx",
    "podName": "ingress-nginx-controller-xxx"
  },
  "ingresses": [
    {
      "namespace": "default",
      "name": "my-app",
      "ingressClassName": "nginx",
      "hosts": ["app.example.com"],
      "complexity": "moderate",
      "nginxAnnotations": {
        "nginx.ingress.kubernetes.io/ssl-redirect": "true",
        "nginx.ingress.kubernetes.io/proxy-body-size": "10m"
      }
    }
  ]
}`}</Code>

      <H2 id="complexity">Complexity Classification</H2>
      <Table
        headers={['Level', 'Criteria', 'Example']}
        rows={[
          ['Simple', '0–2 NGINX annotations', 'Basic host + path routing with TLS'],
          ['Moderate', '3–5 NGINX annotations', 'Rate limiting + custom headers + SSL redirect'],
          ['Complex', '6+ NGINX annotations', 'Auth, CORS, proxy settings, custom snippets'],
        ]}
      />

      <Callout type="info" title="Controller Detection">
        kube-migrate searches for pods with labels matching known ingress controllers
        (ingress-nginx, traefik, envoy-gateway). Currently, NGINX Ingress is the primary
        source controller.
      </Callout>
    </div>
  );
}
