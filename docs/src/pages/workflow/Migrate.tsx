import { H1, H2, P, Code, Callout, Table } from '../../components/Markdown';

export default function Migrate() {
  return (
    <div className="max-w-3xl">
      <H1>🚀 Migrate</H1>
      <P>
        The Migrate step generates a complete set of numbered, ordered files that guide you through
        a safe parallel migration. The new controller is installed alongside NGINX — production
        traffic is never interrupted.
      </P>

      <H2 id="what-it-generates">What it Generates</H2>

      <H2 id="gateway-api-files">Gateway API Target</H2>
      <Table
        headers={['File', 'Purpose']}
        rows={[
          ['00-migration-report.md', 'Full migration overview and manual steps'],
          ['01-install-gateway-api-crds/', 'Script to install Gateway API CRDs'],
          ['02-install-envoy-gateway/', 'Helm install script + values.yaml for Envoy Gateway'],
          ['03-gateway/', 'GatewayClass and Gateway resource definitions'],
          ['04-httproutes/', 'One HTTPRoute per Ingress service + redirect routes for TLS'],
          ['05-policies/', 'BackendTLSPolicy, rate-limit, timeout, and security policies'],
          ['06-verify.sh', 'Script to verify the new controller is working'],
          ['07-cleanup/', 'Script to remove NGINX after DNS cutover'],
        ]}
      />

      <H2 id="traefik-files">Traefik Target</H2>
      <Table
        headers={['File', 'Purpose']}
        rows={[
          ['00-migration-report.md', 'Full migration overview and manual steps'],
          ['01-install-traefik/', 'Helm install script + values.yaml for Traefik'],
          ['02-middlewares/', 'Traefik Middleware CRDs (rate-limit, headers, redirect, etc.)'],
          ['03-ingressroutes/', 'One IngressRoute per Ingress, referencing the middlewares'],
          ['04-verify.sh', 'Script to verify Traefik is working'],
          ['05-dns-cutover.md', 'Guide for cutting DNS to Traefik'],
          ['06-cleanup/', 'Script to remove NGINX'],
        ]}
      />

      <H2 id="cli">CLI Usage</H2>
      <Code>{`# Generate Gateway API migration files
kube-migrate migrate --target gateway-api -o output/

# Generate Traefik migration files
kube-migrate migrate --target traefik -o output/

# Print to stdout (no file writing)
kube-migrate migrate --target gateway-api`}</Code>

      <H2 id="api">API Endpoint</H2>
      <Table
        headers={['Method', 'Endpoint', 'Body']}
        rows={[['POST', '/api/migrate', '{ "target": "gateway-api" | "traefik" }']]}
      />
      <P>
        The API returns all files in-memory (no disk writes). The Web UI provides a file
        viewer with syntax highlighting and a button to download everything as a ZIP.
      </P>

      <H2 id="download">Download ZIP</H2>
      <Table
        headers={['Method', 'Endpoint', 'Params']}
        rows={[['GET', '/api/download', '?target=gateway-api | traefik']]}
      />

      <Callout type="warning" title="Review Before Applying">
        Always review the generated files before applying them to your cluster. The migration
        report (<code>00-migration-report.md</code>) lists all annotations that couldn't be
        automatically migrated and require manual attention.
      </Callout>

      <H2 id="apply">Apply from Web UI</H2>
      <P>
        The Web UI includes an "Apply to Cluster" button that applies the generated Kubernetes
        manifests in the correct order using <code>kubectl apply</code>. Non-manifest files
        (shell scripts, markdown) are automatically skipped.
      </P>
    </div>
  );
}
