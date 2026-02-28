import { H1, H2, H3, P, Code, Callout } from '../components/Markdown';

export default function QuickStart() {
  return (
    <div className="max-w-3xl">
      <H1>Quick Start</H1>
      <P>
        Get up and running with kube-migrate in under 5 minutes. This guide walks you through the
        complete migration workflow from NGINX to your target controller.
      </P>

      <H2 id="step-1">Step 1 — Scan your Cluster</H2>
      <P>
        First, detect the current ingress controller and discover all Ingress resources:
      </P>
      <Code>{`# Using the CLI
kube-migrate scan

# Or launch the Web UI
kube-migrate ui`}</Code>
      <P>
        The scan identifies your NGINX Ingress controller (version, namespace) and lists every
        Ingress resource with its annotations and a complexity score (simple, moderate, or complex).
      </P>

      <H2 id="step-2">Step 2 — Analyze Compatibility</H2>
      <P>Choose your migration target and analyze annotation compatibility:</P>
      <Code>{`# Analyze for Gateway API
kube-migrate analyze --target gateway-api

# Or for Traefik
kube-migrate analyze --target traefik`}</Code>
      <P>
        The analysis produces a per-ingress report showing which annotations have direct equivalents,
        which need workarounds, and which are unsupported in the target.
      </P>

      <H2 id="step-3">Step 3 — Generate Migration Files</H2>
      <Code>{`# Generate all migration files
kube-migrate migrate --target gateway-api -o migration-output/`}</Code>
      <P>
        This creates a numbered directory structure with everything you need:
      </P>
      <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 mb-4 ml-2">
        <li><code>00-migration-report.md</code> — Full migration overview</li>
        <li><code>01-install-*/</code> — CRD and controller install scripts</li>
        <li><code>02-*/</code> — Helm values and install commands</li>
        <li><code>03-*/</code> — Gateway / IngressClass definitions</li>
        <li><code>04-*/</code> — HTTPRoutes or IngressRoutes per service</li>
        <li><code>05-*/</code> — Policies and middlewares</li>
        <li><code>06-verify.sh</code> — Verification script</li>
        <li><code>07-cleanup/</code> — NGINX removal scripts</li>
      </ul>

      <Callout type="warning" title="Don't skip the report!">
        Always read <code>00-migration-report.md</code> before applying anything.
        It lists unsupported annotations and manual steps needed.
      </Callout>

      <H2 id="step-4">Step 4 — Apply and Validate</H2>
      <H3>Apply files in order</H3>
      <Code>{`# Install the target controller (runs alongside NGINX)
bash migration-output/01-install-*/install.sh
bash migration-output/02-install-*/helm-install.sh

# Apply routes
kubectl apply -f migration-output/04-httproutes/
kubectl apply -f migration-output/05-policies/

# Verify
bash migration-output/06-verify.sh`}</Code>

      <H3>Cut over DNS</H3>
      <P>
        Once the new controller is verified, update your DNS records to point to
        the new controller's external IP. Monitor traffic, then clean up NGINX:
      </P>
      <Code>{`# After DNS propagation is confirmed
bash migration-output/07-cleanup/remove-nginx.sh`}</Code>

      <Callout type="tip" title="Web UI">
        All these steps are available visually in the Web UI at{' '}
        <code>kube-migrate ui</code>. The UI provides a guided workflow with
        real-time cluster validation at each step.
      </Callout>
    </div>
  );
}
