import { useState } from 'react';
import { api } from '../api/client';
import type { ScanResult, AnalysisReport, MigrateResponse, Target, ApplyResponse } from '../types';
import FileViewer from '../components/FileViewer';
import MigrationGaps from '../components/MigrationGaps';

interface Props {
  scanResult: ScanResult | null;
  analysisReport: AnalysisReport | null;
}

export default function Migrate({ scanResult, analysisReport }: Props) {
  const [target, setTarget] = useState<Target>('gateway-api');
  const [outputDir, setOutputDir] = useState('./migration');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migrateResult, setMigrateResult] = useState<MigrateResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'checklist' | 'files' | 'gaps'>('checklist');
  const [stepResults, setStepResults] = useState<Record<string, ApplyResponse>>({});
  const [applyingStep, setApplyingStep] = useState<string | null>(null);

  const handleMigrate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.migrate(target, outputDir);
      setMigrateResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStepApply = async (category: string, dryRun: boolean) => {
    const key = `${category}-${dryRun ? 'dry' : 'apply'}`;
    setApplyingStep(key);
    try {
      const resp = await api.apply({ target, category, dryRun });
      setStepResults((prev) => ({ ...prev, [key]: resp }));
    } catch (err) {
      setStepResults((prev) => ({
        ...prev,
        [key]: { success: false, output: '', dryRun, applied: [], error: err instanceof Error ? err.message : 'Failed' },
      }));
    } finally {
      setApplyingStep(null);
    }
  };

  const steps = target === 'traefik'
    ? [
        { label: 'Review Migration Report', desc: 'Read 00-migration-report.md in the Files tab', icon: '📖', category: 'guide', action: 'view' as const },
        { label: 'Install Traefik v3', desc: 'Run the Helm install script (see Files tab → Installation)', icon: '📦', category: 'install', action: 'script' as const },
        { label: 'Apply Middlewares', desc: 'Middleware CRDs (auth, rate-limit, CORS, IP allow)', icon: '🔧', category: 'middleware', action: 'apply' as const },
        { label: 'Apply Updated Ingresses', desc: 'Switch ingressClassName to traefik + add middleware refs', icon: '🔀', category: 'ingress', action: 'apply' as const },
        { label: 'Verify Traefik', desc: 'Run the verify script to test via Traefik IP', icon: '✅', category: 'verify', action: 'script' as const },
        { label: 'DNS Cutover', desc: 'Point DNS to Traefik LoadBalancer IP', icon: '🌐', category: 'guide', action: 'view' as const },
        { label: 'Cleanup NGINX', desc: 'Run cleanup script after 24h monitoring', icon: '🧹', category: 'cleanup', action: 'script' as const },
      ]
    : [
        { label: 'Review Migration Report', desc: 'Read 00-migration-report.md in the Files tab', icon: '📖', category: 'guide', action: 'view' as const },
        { label: 'Install Gateway API CRDs', desc: 'Run the CRD install script (see Files tab → Installation)', icon: '📦', category: 'install', action: 'script' as const },
        { label: 'Install Envoy Gateway', desc: 'Run the Helm install script (see Files tab → Installation)', icon: '📦', category: 'install', action: 'script' as const },
        { label: 'Apply Gateway Resources', desc: 'GatewayClass + Gateway definitions', icon: '🌐', category: 'gateway', action: 'apply' as const },
        { label: 'Apply HTTPRoutes', desc: 'Converted from Ingress objects (one per host)', icon: '🛣️', category: 'httproute', action: 'apply' as const },
        { label: 'Apply Policies', desc: 'BackendTrafficPolicy, SecurityPolicy, rate limits', icon: '🛡️', category: 'policy', action: 'apply' as const },
        { label: 'Verify', desc: 'Run the verify script to test via Envoy Gateway IP', icon: '✅', category: 'verify', action: 'script' as const },
        { label: 'DNS Cutover', desc: 'Point DNS to Envoy Gateway LoadBalancer', icon: '🌐', category: 'guide', action: 'view' as const },
        { label: 'Cleanup NGINX', desc: 'Run cleanup script after monitoring', icon: '🧹', category: 'cleanup', action: 'script' as const },
      ];

  const gapItems = analysisReport
    ? analysisReport.ingressReports.flatMap((ir) =>
        ir.mappings
          .filter((m) => m.status !== 'supported')
          .map((m) => ({ ingress: `${ir.namespace}/${ir.name}`, mapping: m })),
      )
    : [];

  // Only categories that contain actual Kubernetes manifests (apiVersion + kind)
  const applyableCategories = new Set(['middleware', 'ingress', 'gateway', 'httproute', 'policy']);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <span className="text-xl">🚀</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Migrate</h2>
          <p className="text-slate-500 text-sm">Generate migration files, then apply step-by-step.</p>
        </div>
      </div>

      {!scanResult && (
        <div className="rounded-2xl glass p-6 flex items-start gap-3 glow-amber">
          <span className="text-amber-400 text-lg flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-medium text-amber-300">Scan required</p>
            <p className="text-xs text-amber-400/70 mt-0.5">Please run a scan first on the Detect page.</p>
          </div>
        </div>
      )}

      {scanResult && (
        <>
          {/* Controls */}
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Target</label>
              <div className="flex gap-2">
                {(['traefik', 'gateway-api'] as Target[]).map((t) => (
                  <button key={t} onClick={() => setTarget(t)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                      target === t
                        ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-300 border-blue-500/40 shadow-inner'
                        : 'text-slate-400 border-[#222] hover:border-[#333] bg-[#0a0a0a] hover:bg-[#111]'
                    }`}>
                    {t === 'traefik' ? '🚀 Traefik v3' : '🌐 Gateway API (Envoy)'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-[180px] max-w-xs">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Output Directory</label>
              <input type="text" value={outputDir} onChange={e => setOutputDir(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-xl text-sm text-white font-mono focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all" />
            </div>
            <button onClick={handleMigrate} disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-emerald-800 disabled:to-emerald-800 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : '⚡ Generate Migration Files'}
            </button>
            {migrateResult && (
              <a
                href={api.downloadUrl(target)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              >
                📥 Download All (ZIP)
              </a>
            )}
          </div>

          {/* Safety banner */}
          <div className="rounded-2xl glass bg-gradient-to-r from-blue-500/5 to-indigo-500/5 p-5 flex items-start gap-4 glow-blue">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🛡️</span>
            </div>
            <div className="text-sm text-blue-300/90">
              <strong className="text-blue-200">Zero-downtime migration:</strong> Install the new controller alongside NGINX first.
              DNS still points to NGINX — production is unaffected until the{' '}
              <span className="text-amber-300 font-medium">DNS Cutover</span> step.
            </div>
          </div>

          {error && (
            <div className="rounded-xl glass border-red-500/30 glow-red p-4 flex items-start gap-3 animate-fade-in">
              <span className="text-red-400 text-lg flex-shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-300">Generation failed</p>
                <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          {migrateResult && (
            <div className="glass rounded-xl p-1 flex gap-1 w-fit">
              {([
                { key: 'checklist' as const, label: '📋 Migration Steps' },
                { key: 'files' as const, label: `📁 Files (${migrateResult.files.length})` },
                { key: 'gaps' as const, label: `⚠️ Gaps (${gapItems.length})` },
              ]).map(({ key, label }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === key
                      ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-white shadow-inner'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Checklist view */}
          {migrateResult && activeTab === 'checklist' && (
            <div className="space-y-3 animate-fade-in">
              {steps.map((step, i) => {
                const dryKey = `${step.category}-dry`;
                const applyKey = `${step.category}-apply`;
                const dryResult = stepResults[dryKey];
                const applyResult = stepResults[applyKey];
                const canApply = step.action === 'apply' && applyableCategories.has(step.category);

                return (
                  <div key={i} className="rounded-2xl glass overflow-hidden animate-slide-in"
                    style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="flex items-start gap-4 p-5 hover:bg-white/[0.02] transition-colors">
                      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center text-sm font-bold text-blue-300 border border-blue-500/20">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{step.icon}</span>
                          <span className="font-semibold text-white text-sm">{step.label}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
                      </div>
                      {/* Apply buttons for K8s manifests */}
                      {canApply && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            disabled={applyingStep !== null}
                            onClick={() => handleStepApply(step.category, true)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#222] text-slate-300 bg-[#0a0a0a] hover:bg-[#111] hover:border-[#333] disabled:opacity-40 transition-all"
                          >
                            {applyingStep === dryKey ? (
                              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            ) : '🧪 Dry-run'}
                          </button>
                          <button
                            disabled={applyingStep !== null}
                            onClick={() => handleStepApply(step.category, false)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600/20 to-green-600/20 border border-emerald-500/30 text-emerald-300 hover:from-emerald-600/30 hover:to-green-600/30 disabled:opacity-40 transition-all"
                          >
                            {applyingStep === applyKey ? (
                              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            ) : '🚀 Apply'}
                          </button>
                        </div>
                      )}
                      {/* Script badge for manual steps */}
                      {step.action === 'script' && (
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <span className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-cyan-500/20 text-cyan-400/80 bg-cyan-500/5 inline-flex items-center gap-1.5">
                            💻 Run script manually
                          </span>
                          <button
                            onClick={() => setActiveTab('files')}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-[#222] text-slate-400 bg-[#0a0a0a] hover:bg-[#111] hover:border-[#333] hover:text-white transition-all"
                          >
                            📁 View files
                          </button>
                        </div>
                      )}
                      {/* Info badge for view-only steps */}
                      {step.action === 'view' && (
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => setActiveTab('files')}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-blue-500/20 text-blue-400/80 bg-blue-500/5 hover:bg-blue-500/10 transition-all inline-flex items-center gap-1.5"
                          >
                            📖 View in Files tab
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Step result */}
                    {(dryResult || applyResult) && (
                      <div className="border-t border-[#222]/40 p-4 space-y-2">
                        {[dryResult, applyResult].filter(Boolean).map((r) => (
                          <div
                            key={r!.dryRun ? 'dry' : 'apply'}
                            className={`rounded-xl p-4 text-xs ${
                              r!.success
                                ? 'bg-emerald-500/5 border border-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/5 border border-red-500/20 text-red-300'
                            }`}
                          >
                            <p className="font-semibold">{r!.dryRun ? '🧪 Dry-run result' : '🚀 Apply result'}</p>
                            {r!.output && (
                              <pre className="code-block mt-2 max-h-32 overflow-y-auto text-[11px]">{r!.output}</pre>
                            )}
                            {r!.error && <p className="text-red-400 mt-1">{r!.error}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Files view */}
          {migrateResult && activeTab === 'files' && (
            <div className="animate-fade-in">
              <FileViewer files={migrateResult.files} />
            </div>
          )}

          {/* Gaps view */}
          {migrateResult && activeTab === 'gaps' && (
            <div className="animate-fade-in">
              <MigrationGaps gaps={gapItems} target={target} />
            </div>
          )}

          {/* Not yet generated */}
          {!migrateResult && (
            <div className="rounded-2xl glass bg-gradient-to-r from-amber-500/5 to-orange-500/5 p-8 text-center glow-amber">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <p className="text-sm text-amber-300/80">
                Click <strong className="text-amber-200">Generate Migration Files</strong> to produce all YAML manifests
                for <strong className="text-amber-200">{target === 'traefik' ? 'Traefik v3' : 'Envoy Gateway + Gateway API'}</strong>.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
