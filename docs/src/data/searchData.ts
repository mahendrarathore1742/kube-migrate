export interface SearchItem {
  id: string;
  title: string;
  category: string;
  path: string;
  snippet: string;
  content: string;
  icon?: string;
  keywords?: string[];
}

export const searchIndex: SearchItem[] = [
  // Home / General
  {
    id: 'home-overview',
    title: 'kube-migrate Overview',
    category: 'General',
    path: '/',
    icon: '⚙️',
    snippet: 'Scan, analyze, and migrate Kubernetes Ingress resources from NGINX to Traefik v3 or Gateway API.',
    content: 'kube-migrate overview zero downtime migration nginx traefik v3 gateway api kubernetes ingress scan analyze migrate validate cli react web ui dashboard complexity scoring',
    keywords: ['overview', 'introduction', 'kube-migrate', 'kubernetes', 'ingress', 'nginx', 'traefik', 'gateway api']
  },
  {
    id: 'home-workflow',
    title: '4-Step Migration Workflow',
    category: 'General',
    path: '/',
    icon: '🔄',
    snippet: 'Overview of the 4 steps: Detect, Analyze, Migrate, and Validate.',
    content: 'detect scan cluster analyze map annotations migrate generate numbered yaml manifests validate verify traffic zero downtime',
    keywords: ['workflow', 'steps', 'detect', 'analyze', 'migrate', 'validate']
  },
  {
    id: 'home-quick-install',
    title: 'Quick Install Commands',
    category: 'General',
    path: '/',
    icon: '⚡',
    snippet: 'Quick installation commands using git clone, make build, or Docker.',
    content: 'git clone make build ./kube-migrate ui scan analyze migrate docker run kubectl',
    keywords: ['install', 'quickstart', 'build', 'docker', 'binary']
  },

  // Getting Started - Installation
  {
    id: 'install-overview',
    title: 'Installation Overview',
    category: 'Getting Started',
    path: '/getting-started/installation',
    icon: '🚀',
    snippet: 'Install kube-migrate as a single Go binary with an embedded React UI.',
    content: 'installation install binary go docker github releases path kubectl requirements prerequisites',
    keywords: ['install', 'setup', 'prerequisites', 'kubectl', 'go', 'node']
  },
  {
    id: 'install-prerequisites',
    title: 'Prerequisites',
    category: 'Getting Started',
    path: '/getting-started/installation#prerequisites',
    icon: '📋',
    snippet: 'Requirements: Go 1.22+, Node.js 20+, and kubectl cluster access.',
    content: 'prerequisites kubectl kubeconfig cluster access go 1.22 node.js 20 frontend binary build',
    keywords: ['prerequisites', 'requirements', 'kubectl', 'kubeconfig']
  },
  {
    id: 'install-from-source',
    title: 'Build from Source',
    category: 'Getting Started',
    path: '/getting-started/installation#from-source',
    icon: '🛠️',
    snippet: 'Clone repo and run make build to create the single binary.',
    content: 'git clone https://github.com/mahendrarathore1742/kube-migrate.git make build ./kube-migrate --version',
    keywords: ['source', 'make build', 'git clone', 'compile']
  },
  {
    id: 'install-docker',
    title: 'Docker Setup',
    category: 'Getting Started',
    path: '/getting-started/installation#docker',
    icon: '🐳',
    snippet: 'Run kube-migrate using Docker with your kubeconfig mounted.',
    content: 'docker build -t kube-migrate docker run --rm -v ~/.kube:/root/.kube -p 8080:8080 kube-migrate ui',
    keywords: ['docker', 'container', 'volume', 'kubeconfig']
  },
  {
    id: 'install-releases',
    title: 'GitHub Releases',
    category: 'Getting Started',
    path: '/getting-started/installation#releases',
    icon: '📦',
    snippet: 'Download pre-built binaries for Linux, macOS, and Windows.',
    content: 'github releases latest download curl chmod +x kube-migrate linux amd64 darwin arm64 windows',
    keywords: ['releases', 'download', 'curl', 'binary', 'linux', 'mac', 'windows']
  },

  // Getting Started - Quick Start
  {
    id: 'quickstart-step1',
    title: 'Step 1: Scan your Cluster',
    category: 'Getting Started',
    path: '/getting-started/quickstart#step-1',
    icon: '🔍',
    snippet: 'Detect NGINX Ingress controller and scan all Ingress objects.',
    content: 'kube-migrate scan kube-migrate ui scan discovery ingress objects annotations complexity scoring simple moderate complex',
    keywords: ['scan', 'detect', 'discovery', 'ingress', 'complexity']
  },
  {
    id: 'quickstart-step2',
    title: 'Step 2: Analyze Compatibility',
    category: 'Getting Started',
    path: '/getting-started/quickstart#step-2',
    icon: '🔬',
    snippet: 'Analyze annotation compatibility for Traefik or Gateway API targets.',
    content: 'kube-migrate analyze --target gateway-api --target traefik compatibility report direct equivalents workarounds unsupported annotations',
    keywords: ['analyze', 'compatibility', 'report', 'traefik', 'gateway api']
  },
  {
    id: 'quickstart-step3',
    title: 'Step 3: Generate Migration Files',
    category: 'Getting Started',
    path: '/getting-started/quickstart#step-3',
    icon: '📁',
    snippet: 'Generate numbered YAML manifests and setup scripts.',
    content: 'kube-migrate migrate --target gateway-api -o migration-output 00-migration-report.md 01-install 02-helm 03-gateway 04-httproutes 05-policies 06-verify.sh 07-cleanup',
    keywords: ['migrate', 'generate', 'manifests', 'output', 'yaml']
  },
  {
    id: 'quickstart-step4',
    title: 'Step 4: Apply and Validate',
    category: 'Getting Started',
    path: '/getting-started/quickstart#step-4',
    icon: '✅',
    snippet: 'Apply generated manifests, cut over DNS, and clean up old NGINX resources.',
    content: 'kubectl apply -f migration-output/04-httproutes/ 06-verify.sh dns cutover remove-nginx.sh zero downtime',
    keywords: ['apply', 'validate', 'dns', 'cleanup', 'verify']
  },

  // Workflow - Detect
  {
    id: 'workflow-detect',
    title: 'Detect Workflow & Discovery',
    category: 'Workflow',
    path: '/workflow/detect',
    icon: '🔍',
    snippet: 'Auto-detect NGINX Ingress controller pods, services, and Ingress resources.',
    content: 'detect scan discovery nginx ingress controller labels pods services ingress resources annotations parsing complexity score simple moderate complex namespace filtering',
    keywords: ['detect', 'scanner', 'nginx pods', 'annotations', 'namespaces']
  },
  {
    id: 'workflow-analyze',
    title: 'Analyze & Rule Engine',
    category: 'Workflow',
    path: '/workflow/analyze',
    icon: '🔬',
    snippet: 'Rule-based mapping engine converting NGINX annotations to target CRDs.',
    content: 'analyze rule engine annotation mapping ssl-redirect rewrite-target cors rate-limit auth-url proxy-body-size compatibility score warnings workarounds',
    keywords: ['analyze', 'engine', 'annotations', 'rewrite-target', 'ssl-redirect', 'cors', 'rate-limit', 'auth']
  },
  {
    id: 'workflow-migrate',
    title: 'Migrate & Manifest Generator',
    category: 'Workflow',
    path: '/workflow/migrate',
    icon: '🚀',
    snippet: 'Generate structured migration packages with install scripts and routes.',
    content: 'migrate generator yaml manifests numbered files helm install scripts IngressRoute HTTPRoute Middleware policies verification script cleanup script dry-run',
    keywords: ['migrate', 'manifests', 'generator', 'yaml', 'helm', 'httproute', 'ingressroute']
  },
  {
    id: 'workflow-validate',
    title: 'Validate & Health Check',
    category: 'Workflow',
    path: '/workflow/validate',
    icon: '✅',
    snippet: 'Verify new controller deployment, HTTP endpoints, and traffic cutover.',
    content: 'validate verification health check synthetic traffic curl test http endpoint controller status phase green ready rollout',
    keywords: ['validate', 'verify', 'health', 'endpoints', 'cutover']
  },

  // Targets - Traefik
  {
    id: 'target-traefik',
    title: 'Traefik v3 Target',
    category: 'Migration Targets',
    path: '/targets/traefik',
    icon: '🎯',
    snippet: 'Migrate NGINX Ingress to Traefik v3 IngressRoute CRDs and Middlewares.',
    content: 'traefik v3 ingressroute middleware redirectScheme rateLimit buffering headers basicAuth forwardAuth replacePathRegex ipAllowList entryPoints websecure tls',
    keywords: ['traefik', 'ingressroute', 'middleware', 'redirectScheme', 'rateLimit', 'buffering', 'basicAuth', 'replacePathRegex']
  },
  {
    id: 'target-traefik-examples',
    title: 'Traefik CRD Examples',
    category: 'Migration Targets',
    path: '/targets/traefik#example',
    icon: '📝',
    snippet: 'Code examples of converting NGINX Ingress to Traefik IngressRoute & Middleware.',
    content: 'traefik.io/v1alpha1 Middleware IngressRoute entryPoints websecure Host match Rule scheme https permanent true average 100 burst 200',
    keywords: ['traefik example', 'yaml example', 'ingressroute spec', 'middleware spec']
  },

  // Targets - Gateway API
  {
    id: 'target-gateway-api',
    title: 'Gateway API Target',
    category: 'Migration Targets',
    path: '/targets/gateway-api',
    icon: '🌐',
    snippet: 'Migrate to standard Kubernetes Gateway API and Envoy Gateway.',
    content: 'gateway api envoy gateway HTTPRoute GatewayClass Gateway listeners RequestRedirect URLRewrite BackendTrafficPolicy SecurityPolicy certificateRefs GEP-1731',
    keywords: ['gateway api', 'envoy gateway', 'httproute', 'gatewayclass', 'requestredirect', 'urlrewrite', 'backendtrafficpolicy']
  },
  {
    id: 'target-gateway-api-examples',
    title: 'Gateway API Examples',
    category: 'Migration Targets',
    path: '/targets/gateway-api#example',
    icon: '📄',
    snippet: 'YAML examples converting NGINX Ingress to Gateway, GatewayClass, and HTTPRoute.',
    content: 'gateway.networking.k8s.io/v1 GatewayClass Gateway HTTPRoute parentRefs hostnames backendRefs RequestRedirect scheme https statusCode 301',
    keywords: ['gateway api example', 'httproute example', 'envoy gateway example']
  },

  // CLI Reference
  {
    id: 'cli-reference',
    title: 'CLI Reference & Commands',
    category: 'Reference',
    path: '/cli',
    icon: '💻',
    snippet: 'Complete CLI command reference powered by Cobra.',
    content: 'cli reference commands flags scan analyze migrate validate ui --kubeconfig --context --namespace --target --output --port KUBE_MIGRATE_CORS',
    keywords: ['cli', 'commands', 'flags', 'scan', 'analyze', 'migrate', 'validate', 'ui', 'kubeconfig']
  },
  {
    id: 'cli-flags',
    title: 'Global CLI Flags',
    category: 'Reference',
    path: '/cli#global-flags',
    icon: '🚩',
    snippet: 'Global flags: --kubeconfig, --context, --namespace, --version.',
    content: '--kubeconfig --context --namespace --version global flags cobra cli',
    keywords: ['flags', 'kubeconfig', 'namespace', 'context']
  },
  {
    id: 'cli-ui-command',
    title: 'kube-migrate ui Command',
    category: 'Reference',
    path: '/cli#ui',
    icon: '🖥️',
    snippet: 'Launch the interactive web UI dashboard on custom port.',
    content: 'kube-migrate ui --port 8080 --port 3000 web dashboard browser backend http server',
    keywords: ['ui command', 'web ui', 'port', 'dashboard']
  },

  // API Reference
  {
    id: 'api-reference',
    title: 'REST API Reference',
    category: 'Reference',
    path: '/api',
    icon: '📡',
    snippet: 'HTTP REST API endpoints on port 8080 for web dashboard and automation.',
    content: 'rest api endpoints post /api/scan post /api/analyze post /api/migrate get /api/download post /api/apply post /api/validate json curl requests responses middleware cors body size limit logging',
    keywords: ['api', 'rest', 'endpoints', 'json', 'curl', 'scan api', 'analyze api', 'migrate api', 'download api', 'apply api', 'validate api']
  },

  // Architecture
  {
    id: 'architecture-overview',
    title: 'System Architecture',
    category: 'Architecture',
    path: '/architecture',
    icon: '🏗️',
    snippet: 'Deep dive into kube-migrate pipeline, pkg packages, and embedded UI.',
    content: 'architecture pkg/detector pkg/analyzer pkg/generator pkg/server scanner engine manifest writer cobra embed react vite tailwind plugin model',
    keywords: ['architecture', 'design', 'pkg', 'detector', 'analyzer', 'generator', 'embed']
  },

  // Contributing
  {
    id: 'contributing-guide',
    title: 'Contributing Guide',
    category: 'Community',
    path: '/contributing',
    icon: '🤝',
    snippet: 'How to contribute code, add target controllers, run tests, and open PRs.',
    content: 'contributing github pull requests PR issues go test make test minikube kind target controller rules developer setup',
    keywords: ['contribute', 'testing', 'go test', 'pull request', 'github', 'dev']
  }
];
