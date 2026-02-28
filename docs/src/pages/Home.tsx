import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="space-y-12 max-w-4xl">
      {/* Hero */}
      <div className="text-center py-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
          ⚙️ Open Source Kubernetes Migration Tool
        </div>
        <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4">
          kube-migrate
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Scan, analyze, and migrate your Kubernetes Ingress resources from
          NGINX to <span className="text-emerald-400 font-semibold">Traefik v3</span> or{' '}
          <span className="text-blue-400 font-semibold">Gateway API</span> — with zero downtime.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link
            to="/getting-started/installation"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all"
          >
            Get Started →
          </Link>
          <a
            href="https://github.com/mahendrarathore1742/kube-migrate"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-[#111] border border-[#222] text-slate-300 font-semibold text-sm hover:bg-[#161616] hover:border-[#333] transition-all"
          >
            GitHub ↗
          </a>
        </div>
      </div>

      {/* 4-step workflow */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest text-center mb-6">
          4-Step Migration Workflow
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '1', icon: '🔍', title: 'Detect', desc: 'Scan your cluster for NGINX Ingress controller and all Ingress resources', path: '/workflow/detect', color: 'blue' },
            { step: '2', icon: '🔬', title: 'Analyze', desc: 'Map every NGINX annotation to its equivalent in the target controller', path: '/workflow/analyze', color: 'purple' },
            { step: '3', icon: '🚀', title: 'Migrate', desc: 'Generate numbered, step-by-step YAML manifests for safe parallel migration', path: '/workflow/migrate', color: 'green' },
            { step: '4', icon: '✅', title: 'Validate', desc: 'Verify the new controller is running and serving traffic correctly', path: '/workflow/validate', color: 'amber' },
          ].map((s) => (
            <Link
              key={s.step}
              to={s.path}
              className={`rounded-xl border border-[#1a1a2e] bg-[#0a0a0f] p-5 hover:border-${s.color === 'green' ? 'emerald' : s.color}-500/30 transition-all group block`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{s.icon}</span>
                <span className="text-xs font-mono text-slate-600">Step {s.step}</span>
              </div>
              <h3 className="text-white font-semibold text-sm group-hover:text-blue-400 transition-colors">
                {s.title}
              </h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">{s.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest text-center mb-6">
          Key Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: '📊', title: '50+ Annotation Mappings', desc: 'Comprehensive mapping tables for both Traefik and Gateway API targets' },
            { icon: '🔄', title: 'Zero-Downtime Migration', desc: 'New controller runs alongside NGINX until DNS cutover — no traffic disruption' },
            { icon: '🖥️', title: 'CLI + Web UI', desc: 'Full command-line interface plus an interactive React dashboard for visual workflow' },
            { icon: '📈', title: 'Smart Complexity Scoring', desc: 'Each Ingress is rated simple, moderate, or complex based on annotations' },
            { icon: '📁', title: 'Full File Generation', desc: 'Install scripts, middlewares, HTTPRoutes, verify scripts, DNS guide, and cleanup' },
            { icon: '📝', title: 'Migration Report', desc: 'Markdown report summarizing the complete migration plan with actionable steps' },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-[#1a1a2e] bg-[#0a0a0f] p-5"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{f.icon}</span>
                <div>
                  <h4 className="text-white font-semibold text-sm">{f.title}</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick install */}
      <div className="rounded-xl border border-[#1a1a2e] bg-[#0a0a0f] p-6">
        <h3 className="text-white font-semibold text-sm mb-4">Quick Install</h3>
        <pre>
          <code>{`# Build from source
git clone https://github.com/mahendrarathore1742/kube-migrate.git
cd kube-migrate
make build

# Launch the Web UI
./kube-migrate ui

# Or use the CLI directly
./kube-migrate scan
./kube-migrate analyze --target gateway-api
./kube-migrate migrate --target gateway-api -o output/`}</code>
        </pre>
      </div>
    </div>
  );
}
