import { H1, H2, P, Code, Table } from '../components/Markdown';

export default function APIReference() {
  return (
    <div className="max-w-3xl">
      <H1>📡 API Reference</H1>
      <P>
        The kube-migrate HTTP server exposes a RESTful JSON API on port 8080 (configurable).
        All API endpoints are prefixed with <code>/api/</code>.
      </P>

      <H2 id="scan">POST /api/scan</H2>
      <P>Scan the cluster for the ingress controller and Ingress resources.</P>
      <Table
        headers={['Property', 'Details']}
        rows={[
          ['Method', 'POST'],
          ['Content-Type', 'N/A (no body required)'],
          ['Response', 'ScanResult JSON'],
        ]}
      />
      <Code>{`curl -X POST http://localhost:8080/api/scan`}</Code>

      <H2 id="analyze">POST /api/analyze</H2>
      <P>Analyze annotation compatibility for a target controller.</P>
      <Table
        headers={['Property', 'Details']}
        rows={[
          ['Method', 'POST'],
          ['Content-Type', 'application/json'],
          ['Body', '{ "target": "gateway-api" | "traefik" }'],
          ['Response', 'AnalysisReport JSON'],
        ]}
      />
      <Code>{`curl -X POST http://localhost:8080/api/analyze \\
  -H "Content-Type: application/json" \\
  -d '{"target": "gateway-api"}'`}</Code>

      <H2 id="migrate">POST /api/migrate</H2>
      <P>Generate migration files (returned in-memory, no disk writes).</P>
      <Table
        headers={['Property', 'Details']}
        rows={[
          ['Method', 'POST'],
          ['Content-Type', 'application/json'],
          ['Body', '{ "target": "gateway-api" | "traefik" }'],
          ['Response', 'MigrateResponse JSON with files array'],
        ]}
      />
      <Code>{`curl -X POST http://localhost:8080/api/migrate \\
  -H "Content-Type: application/json" \\
  -d '{"target": "gateway-api"}'`}</Code>

      <H2 id="download">GET /api/download</H2>
      <P>Download all migration files as a ZIP archive.</P>
      <Table
        headers={['Property', 'Details']}
        rows={[
          ['Method', 'GET'],
          ['Query Params', '?target=gateway-api | traefik'],
          ['Response', 'application/zip'],
        ]}
      />
      <Code>{`curl -o migration.zip "http://localhost:8080/api/download?target=gateway-api"`}</Code>

      <H2 id="apply">POST /api/apply</H2>
      <P>
        Apply generated Kubernetes manifests to the cluster. Non-manifest files
        (shell scripts, markdown) are automatically skipped.
      </P>
      <Table
        headers={['Property', 'Details']}
        rows={[
          ['Method', 'POST'],
          ['Content-Type', 'application/json'],
          ['Body', '{ "target": "gateway-api" | "traefik", "files": [...] }'],
          ['Response', 'ApplyResponse JSON with applied/skipped lists'],
        ]}
      />

      <H2 id="validate">POST /api/validate</H2>
      <P>Check the migration phase and controller health status.</P>
      <Table
        headers={['Property', 'Details']}
        rows={[
          ['Method', 'POST'],
          ['Content-Type', 'application/json'],
          ['Body', '{ "target": "gateway-api" | "traefik" }'],
          ['Response', 'ValidationResult JSON'],
        ]}
      />
      <Code>{`curl -X POST http://localhost:8080/api/validate \\
  -H "Content-Type: application/json" \\
  -d '{"target": "gateway-api"}'`}</Code>

      <H2 id="middleware">Middleware</H2>
      <P>All API requests pass through these middleware layers:</P>
      <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 mb-4 ml-2">
        <li><strong className="text-white">Body Size Limit</strong> — Request bodies are limited to 1 MB</li>
        <li><strong className="text-white">Request Logging</strong> — All API requests are logged with method, path, status, and duration</li>
        <li><strong className="text-white">CORS</strong> — When <code>KUBE_MIGRATE_CORS=1</code>, permissive CORS headers are added</li>
      </ul>
    </div>
  );
}
