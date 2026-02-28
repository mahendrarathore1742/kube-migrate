import { H1, H2, P, Code, Callout } from '../components/Markdown';

export default function Installation() {
  return (
    <div className="max-w-3xl">
      <H1>Installation</H1>
      <P>
        kube-migrate is a single Go binary with an embedded React UI. You can install it from source,
        use Docker, or download a pre-built release.
      </P>

      <H2 id="prerequisites">Prerequisites</H2>
      <P>
        A working <code>kubectl</code> connection to your Kubernetes cluster is required.
        kube-migrate uses your local kubeconfig to connect.
      </P>
      <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 mb-4 ml-2">
        <li>Go 1.22+ (for building from source)</li>
        <li>Node.js 20+ (for building the frontend)</li>
        <li>kubectl configured with cluster access</li>
      </ul>

      <H2 id="from-source">Build from Source</H2>
      <Code>{`git clone https://github.com/mahendrarathore1742/kube-migrate.git
cd kube-migrate

# Build everything (frontend + Go binary)
make build

# Verify
./kube-migrate --version`}</Code>

      <H2 id="docker">Docker</H2>
      <Code>{`# Build the image
docker build -t kube-migrate .

# Run with your kubeconfig mounted
docker run --rm \\
  -v ~/.kube:/root/.kube \\
  kube-migrate scan`}</Code>

      <Callout type="tip" title="Web UI in Docker">
        To use the Web UI from Docker, expose port 8080:
        <pre className="mt-2">
          <code>{`docker run --rm -p 8080:8080 \\
  -v ~/.kube:/root/.kube \\
  kube-migrate ui --port 8080`}</code>
        </pre>
      </Callout>

      <H2 id="releases">GitHub Releases</H2>
      <P>
        Pre-built binaries for Linux, macOS, and Windows are available on the{' '}
        <a href="https://github.com/mahendrarathore1742/kube-migrate/releases" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
          Releases page
        </a>. Download the binary for your platform and add it to your PATH.
      </P>
      <Code>{`# Example: Linux amd64
curl -Lo kube-migrate https://github.com/mahendrarathore1742/kube-migrate/releases/latest/download/kube-migrate_linux_amd64
chmod +x kube-migrate
sudo mv kube-migrate /usr/local/bin/`}</Code>
    </div>
  );
}
