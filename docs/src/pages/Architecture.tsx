import { H1, H2, P, Code } from '../components/Markdown';

export default function Architecture() {
  return (
    <div className="max-w-3xl">
      <H1>🏗️ Architecture</H1>
      <P>
        kube-migrate is a single Go binary that embeds a React frontend. The CLI commands
        and the Web UI share the same Go packages for scanning, analysis, and migration.
      </P>

      <H2 id="tech-stack">Tech Stack</H2>
      <div className="grid grid-cols-2 gap-3 my-5">
        {[
          { label: 'Backend', value: 'Go 1.22+, Cobra CLI, client-go' },
          { label: 'Frontend', value: 'React 18, TypeScript 5.6, Tailwind CSS 4, Vite 6' },
          { label: 'Build', value: 'Makefile → builds UI → embeds into Go binary via go:embed' },
          { label: 'CI/CD', value: 'GitHub Actions, GoReleaser' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-[#1a1a2e] bg-[#0a0a0f] p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
            <p className="text-sm text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <H2 id="project-structure">Project Structure</H2>
      <Code>{`kube-migrate/
├── main.go                    # Entry point
├── cmd/                       # Cobra CLI commands
│   ├── root.go                # Global flags + version
│   ├── scan.go                # kube-migrate scan
│   ├── analyze.go             # kube-migrate analyze
│   ├── migrate.go             # kube-migrate migrate
│   └── ui.go                  # kube-migrate ui
├── pkg/
│   ├── scanner/               # Kubernetes cluster scanning
│   │   ├── scanner.go         # Scan logic (controller + ingresses)
│   │   ├── types.go           # ScanResult, IngressInfo types
│   │   ├── controller.go      # Controller detection
│   │   └── config.go          # Kubeconfig handling
│   ├── analyzer/              # Annotation compatibility analysis
│   │   ├── analyzer.go        # Analysis engine
│   │   └── compatibility.go   # 50+ annotation mapping tables
│   ├── migrator/
│   │   ├── types.go           # MigrationFile interface
│   │   ├── traefik/           # Traefik file generator
│   │   └── gatewayapi/        # Gateway API file generator
│   ├── generator/             # Output writing + ZIP
│   │   └── output.go          # Write, CreateZip, BuildReport
│   └── server/                # HTTP API server
│       ├── server.go          # Handlers + middleware + embedded UI
│       ├── validate.go        # Migration validation logic
│       └── guides.go          # Annotation migration guides
├── web/                       # React frontend (Vite)
│   ├── src/
│   │   ├── App.tsx            # Main app with sidebar nav
│   │   ├── pages/             # Detect, Analyze, Migrate, Validate
│   │   ├── components/        # Shared UI components
│   │   ├── api/client.ts      # API client
│   │   └── types/index.ts     # TypeScript types
│   └── package.json
├── docs/                      # Documentation site (React + Vite)
├── Dockerfile                 # Multi-stage build
├── Makefile                   # Build orchestration
└── .github/workflows/         # CI + Release pipelines`}</Code>

      <H2 id="data-flow">Data Flow</H2>
      <Code>{`┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Scanner │────▶│ Analyzer │────▶│ Migrator │────▶│Generator │
└─────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
 ScanResult    AnalysisReport   []MigrationFile    ZIP / Files
     │                │                │                │
     └────────────────┴────────────────┴────────────────┘
                              │
                     ┌────────┴────────┐
                     │   HTTP Server   │
                     │  (pkg/server)   │
                     └────────┬────────┘
                              │
                     ┌────────┴────────┐
                     │   React UI      │
                     │  (go:embed)     │
                     └─────────────────┘`}</Code>

      <H2 id="embedding">Frontend Embedding</H2>
      <P>
        The React frontend is built by Vite into <code>pkg/server/dist/</code>.
        The Go server uses <code>go:embed</code> to include the built files directly
        in the binary, creating a zero-dependency single executable. A SPA fallback
        handler serves <code>index.html</code> for any unmatched route.
      </P>
    </div>
  );
}
