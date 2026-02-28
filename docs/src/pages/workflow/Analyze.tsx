import { H1, H2, P, Code, Callout, Table } from '../../components/Markdown';

export default function Analyze() {
  return (
    <div className="max-w-3xl">
      <H1>🔬 Analyze</H1>
      <P>
        The Analyze step maps every NGINX annotation to its equivalent in the chosen
        migration target (Traefik v3 or Gateway API), producing a detailed compatibility report.
      </P>

      <H2 id="what-it-does">What it Does</H2>
      <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 mb-4 ml-2">
        <li>Evaluates each NGINX annotation against a mapping table of 50+ entries</li>
        <li>Classifies each annotation as: <strong className="text-emerald-400">direct</strong> (1:1 mapping), <strong className="text-amber-400">workaround</strong> (achievable differently), or <strong className="text-red-400">unsupported</strong></li>
        <li>Provides actionable migration notes with code examples</li>
        <li>Generates per-ingress reports and an overall summary</li>
        <li>Includes links to official documentation</li>
      </ul>

      <H2 id="cli">CLI Usage</H2>
      <Code>{`# Analyze for Gateway API migration
kube-migrate analyze --target gateway-api

# Analyze for Traefik migration
kube-migrate analyze --target traefik

# Analyze specific namespace
kube-migrate analyze --target gateway-api --namespace production`}</Code>

      <H2 id="api">API Endpoint</H2>
      <Table
        headers={['Method', 'Endpoint', 'Body']}
        rows={[['POST', '/api/analyze', '{ "target": "gateway-api" | "traefik" }']]}
      />

      <H2 id="report-structure">Report Structure</H2>
      <P>Each Ingress gets an individual report:</P>
      <Code>{`{
  "ingressReports": [
    {
      "namespace": "default",
      "name": "my-app",
      "mappings": [
        {
          "originalKey": "nginx.ingress.kubernetes.io/ssl-redirect",
          "originalValue": "true",
          "targetKey": "HTTPRoute redirect filter",
          "targetValue": "RequestRedirect with scheme=https",
          "status": "workaround",
          "note": "Use HTTPRoute RequestRedirect filter to redirect HTTP to HTTPS"
        }
      ]
    }
  ],
  "summary": {
    "total": 10,
    "fullyCompatible": 4,
    "needsWorkaround": 3,
    "hasUnsupported": 3
  }
}`}</Code>

      <H2 id="compatibility-statuses">Compatibility Statuses</H2>
      <Table
        headers={['Status', 'Meaning', 'Action Required']}
        rows={[
          ['direct', 'Annotation has a 1:1 equivalent in the target', 'None — auto-migrated'],
          ['workaround', 'Achievable via a different mechanism in the target', 'Review the generated workaround code'],
          ['unsupported', 'No equivalent exists in the target controller', 'Manual review required — may need architecture change'],
        ]}
      />

      <H2 id="annotation-matrix">Annotation Matrix (Web UI)</H2>
      <P>
        The Web UI displays an interactive annotation matrix showing all ingresses on one axis
        and all unique annotations on the other, with color-coded compatibility indicators.
        This gives you an at-a-glance view of your migration readiness.
      </P>

      <Callout type="tip" title="Migration Guides">
        Each annotation mapping includes a detailed migration guide with a description
        of what the annotation does, the recommended fix, a code example, and a link
        to the official documentation.
      </Callout>
    </div>
  );
}
