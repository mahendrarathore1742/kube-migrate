import { H1, H2, P, Code, Callout, Table } from '../../components/Markdown';

export default function Validate() {
  return (
    <div className="max-w-3xl">
      <H1>✅ Validate</H1>
      <P>
        The Validate step checks the current state of your migration by inspecting the cluster
        for both the source (NGINX) and target controller, determining which phase you're in.
      </P>

      <H2 id="phases">Migration Phases</H2>
      <Table
        headers={['Phase', 'NGINX', 'Target', 'Description']}
        rows={[
          ['pre-migration', '✅ Running', '❌ Not found', 'Ready to begin — NGINX is the only controller'],
          ['in-progress', '✅ Running', '✅ Running', 'Both controllers active — parallel migration in progress'],
          ['post-migration', '❌ Not found', '✅ Running', 'Migration complete — target controller is serving traffic'],
        ]}
      />

      <H2 id="checks">Health Checks</H2>
      <P>The validator performs these checks:</P>
      <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 mb-4 ml-2">
        <li><strong className="text-white">NGINX Controller</strong> — Checks if ingress-nginx pods are running</li>
        <li><strong className="text-white">Target Controller</strong> — Checks if Traefik or Envoy Gateway pods are running</li>
      </ul>

      <H2 id="next-steps">Next Steps</H2>
      <P>Based on the detected phase, kube-migrate provides tailored next steps:</P>

      <Callout type="info" title="Pre-Migration">
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Generate migration files on the Migrate tab</li>
          <li>Review the migration report</li>
          <li>Install target controller CRDs</li>
          <li>Install the target controller alongside NGINX</li>
        </ul>
      </Callout>

      <Callout type="warning" title="In-Progress">
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Apply HTTPRoutes/IngressRoutes for each service</li>
          <li>Verify traffic is reaching the new controller</li>
          <li>Update DNS records to point to the new controller</li>
          <li>Monitor for errors during the cutover window</li>
        </ul>
      </Callout>

      <Callout type="tip" title="Post-Migration">
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Confirm all services are healthy on the new controller</li>
          <li>Run the cleanup script to remove NGINX</li>
          <li>Remove old Ingress resources</li>
        </ul>
      </Callout>

      <H2 id="cli">CLI Usage</H2>
      <Code>{`# Check migration status
kube-migrate validate --target gateway-api`}</Code>

      <H2 id="api">API Endpoint</H2>
      <Table
        headers={['Method', 'Endpoint', 'Body']}
        rows={[['POST', '/api/validate', '{ "target": "gateway-api" | "traefik" }']]}
      />
    </div>
  );
}
