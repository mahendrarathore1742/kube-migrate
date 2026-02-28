import { H1, H2, P, Code, Callout } from '../components/Markdown';

export default function Contributing() {
  return (
    <div className="max-w-3xl">
      <H1>🤝 Contributing</H1>
      <P>
        We welcome contributions! kube-migrate is open source under the MIT license.
        Here's how to get set up for development.
      </P>

      <H2 id="prerequisites">Prerequisites</H2>
      <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 mb-4 ml-2">
        <li>Go 1.22+</li>
        <li>Node.js 20+</li>
        <li>A Kubernetes cluster (Kind or Minikube for local development)</li>
        <li>kubectl configured</li>
      </ul>

      <H2 id="setup">Development Setup</H2>
      <Code>{`# Clone the repo
git clone https://github.com/mahendrarathore1742/kube-migrate.git
cd kube-migrate

# Install frontend dependencies
cd web && npm install && cd ..

# Build everything
make build

# Or run frontend and backend separately for development
cd web && KUBE_MIGRATE_CORS=1 npm run dev &
go run . ui --port 8080`}</Code>

      <H2 id="project-layout">Key Directories</H2>
      <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 mb-4 ml-2">
        <li><code>cmd/</code> — CLI commands (scan, analyze, migrate, ui)</li>
        <li><code>pkg/scanner/</code> — Cluster scanning logic</li>
        <li><code>pkg/analyzer/</code> — Annotation mapping engine</li>
        <li><code>pkg/migrator/traefik/</code> — Traefik file generation</li>
        <li><code>pkg/migrator/gatewayapi/</code> — Gateway API file generation</li>
        <li><code>pkg/generator/</code> — Output writing and ZIP creation</li>
        <li><code>pkg/server/</code> — HTTP server and API handlers</li>
        <li><code>web/</code> — React frontend</li>
        <li><code>docs/</code> — This documentation site</li>
      </ul>

      <H2 id="testing">Running Tests</H2>
      <Code>{`# Run all Go tests with race detector
go test -race ./pkg/...

# Run frontend type checking
cd web && npm run build`}</Code>

      <H2 id="adding-annotations">Adding Annotation Mappings</H2>
      <P>
        To add support for a new NGINX annotation, edit the mapping tables in{' '}
        <code>pkg/analyzer/compatibility.go</code>:
      </P>
      <Code>{`// In traefikMappings or gatewayAPIMappings
"nginx.ingress.kubernetes.io/your-annotation": {
    TargetKey:   "Middleware: yourMiddleware",
    TargetValue: "How to configure it",
    Status:      "direct",
    Note:        "Description of the mapping",
},`}</Code>

      <P>
        Then add a corresponding guide entry in <code>pkg/server/guides.go</code> for
        the Web UI's migration guide tooltip.
      </P>

      <Callout type="info" title="Pull Requests">
        Please open an issue first to discuss significant changes. For bug fixes and
        small improvements, feel free to submit a PR directly.
      </Callout>

      <H2 id="local-testing">Local Testing with Kind</H2>
      <Code>{`# Create a Kind cluster
kind create cluster --name kube-migrate-test

# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Create sample Ingress resources
kubectl apply -f examples/

# Run kube-migrate
./kube-migrate ui`}</Code>
    </div>
  );
}
