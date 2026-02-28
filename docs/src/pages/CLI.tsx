import { H1, H2, P, Code, Table } from '../components/Markdown';

export default function CLI() {
  return (
    <div className="max-w-3xl">
      <H1>💻 CLI Reference</H1>
      <P>
        kube-migrate provides a full command-line interface powered by Cobra. All operations
        available in the Web UI are also accessible via the CLI.
      </P>

      <H2 id="global-flags">Global Flags</H2>
      <Table
        headers={['Flag', 'Default', 'Description']}
        rows={[
          ['--kubeconfig', '~/.kube/config', 'Path to kubeconfig file'],
          ['--context', '(current)', 'Kubernetes context to use'],
          ['--namespace', '(all)', 'Target namespace (empty = all namespaces)'],
          ['--version', '', 'Print version and exit'],
        ]}
      />

      <H2 id="scan">kube-migrate scan</H2>
      <P>Scan the cluster for the ingress controller and all Ingress resources.</P>
      <Code>{`kube-migrate scan [flags]

# Examples
kube-migrate scan
kube-migrate scan --namespace production
kube-migrate scan --context staging`}</Code>

      <H2 id="analyze">kube-migrate analyze</H2>
      <P>Analyze annotation compatibility for the chosen migration target.</P>
      <Code>{`kube-migrate analyze --target <traefik|gateway-api> [flags]

# Examples
kube-migrate analyze --target gateway-api
kube-migrate analyze --target traefik --namespace default`}</Code>
      <Table
        headers={['Flag', 'Required', 'Description']}
        rows={[
          ['--target', 'Yes', 'Migration target: "traefik" or "gateway-api"'],
        ]}
      />

      <H2 id="migrate">kube-migrate migrate</H2>
      <P>Generate migration files for the chosen target.</P>
      <Code>{`kube-migrate migrate --target <traefik|gateway-api> [flags]

# Examples
kube-migrate migrate --target gateway-api -o output/
kube-migrate migrate --target traefik -o traefik-migration/`}</Code>
      <Table
        headers={['Flag', 'Required', 'Description']}
        rows={[
          ['--target', 'Yes', 'Migration target: "traefik" or "gateway-api"'],
          ['-o, --output', 'No', 'Output directory (default: stdout)'],
        ]}
      />

      <H2 id="ui">kube-migrate ui</H2>
      <P>Launch the interactive Web UI dashboard.</P>
      <Code>{`kube-migrate ui [flags]

# Examples
kube-migrate ui
kube-migrate ui --port 3000`}</Code>
      <Table
        headers={['Flag', 'Default', 'Description']}
        rows={[
          ['--port', '8080', 'Port to serve the Web UI on'],
        ]}
      />

      <H2 id="environment-variables">Environment Variables</H2>
      <Table
        headers={['Variable', 'Description']}
        rows={[
          ['KUBE_MIGRATE_CORS=1', 'Enable CORS headers (for development with separate frontend)'],
        ]}
      />
    </div>
  );
}
