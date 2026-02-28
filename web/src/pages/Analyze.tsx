import { useState } from 'react';
import { api } from '../api/client';
import type { ScanResult, AnalysisReport, Target } from '../types';
import AnnotationMatrix from '../components/AnnotationMatrix';
import DependencyGraph from '../components/DependencyGraph';
import ErrorBoundary from '../components/ErrorBoundary';

interface Props {
  scanResult: ScanResult | null;
  onAnalysisComplete: (report: AnalysisReport) => void;
  analysisReport: AnalysisReport | null;
}

type AnalyzeView = 'matrix' | 'graph';

export default function Analyze({ scanResult, onAnalysisComplete, analysisReport }: Props) {
  const [target, setTarget] = useState<Target>('gateway-api');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<AnalyzeView>('matrix');

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const report = await api.analyze(target);
      onAnalysisComplete(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <span className="text-xl">🔬</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Analyze</h2>
          <p className="text-slate-500 text-sm">
            Map every NGINX annotation to its equivalent in the target controller.
          </p>
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
          {/* Target selector + analyze button */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-2">
              {(['traefik', 'gateway-api'] as Target[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                    target === t
                      ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-300 border-blue-500/40 shadow-inner'
                      : 'text-slate-400 border-[#222] hover:border-[#333] bg-[#0a0a0a] hover:bg-[#111]'
                  }`}
                >
                  {t === 'traefik' ? '🚀 Traefik v3' : '🌐 Gateway API (Envoy)'}
                </button>
              ))}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-violet-800 disabled:to-violet-800 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </>
              ) : '🔬 Analyze Compatibility'}
            </button>
          </div>

          {error && (
            <div className="rounded-xl glass border-red-500/30 glow-red p-4 flex items-start gap-3 animate-fade-in">
              <span className="text-red-400 text-lg flex-shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-300">Analysis failed</p>
                <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Analysis results */}
          {analysisReport && (
            <div className="space-y-6 animate-fade-in">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryCard label="Total" value={analysisReport.summary.total} icon="📊" color="text-white" glow="" />
                <SummaryCard label="Compatible" value={analysisReport.summary.fullyCompatible} icon="✅" color="text-emerald-400" glow="glow-emerald" />
                <SummaryCard label="Workaround" value={analysisReport.summary.needsWorkaround} icon="⚠️" color="text-amber-400" glow="glow-amber" />
                <SummaryCard label="Unsupported" value={analysisReport.summary.hasUnsupported} icon="❌" color="text-red-400" glow="glow-red" />
              </div>

              {/* Compatibility score bar */}
              {(() => {
                const s = analysisReport.summary;
                const total = s.total || 1;
                const pctGreen = Math.round((s.fullyCompatible / total) * 100);
                const pctAmber = Math.round((s.needsWorkaround / total) * 100);
                return (
                  <div className="rounded-2xl glass p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compatibility Score</span>
                      <span className="text-sm font-bold text-white">{pctGreen}% direct</span>
                    </div>
                    <div className="h-3 rounded-full bg-neutral-900 overflow-hidden flex">
                      <div className="bg-emerald-500 h-full animate-progress" style={{ width: `${pctGreen}%` }} />
                      <div className="bg-amber-500 h-full animate-progress" style={{ width: `${pctAmber}%` }} />
                      <div className="bg-red-500 h-full animate-progress" style={{ width: `${100 - pctGreen - pctAmber}%` }} />
                    </div>
                    <div className="flex gap-4 mt-2.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Supported</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Workaround</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Unsupported</span>
                    </div>
                  </div>
                );
              })()}

              {/* View toggle */}
              <div className="flex gap-1 glass rounded-xl p-1 w-fit">
                {([
                  { key: 'matrix' as AnalyzeView, label: '📊 Annotation Matrix', icon: '📊' },
                  { key: 'graph' as AnalyzeView, label: '🕸️ Dependency Graph', icon: '🕸️' },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setView(key)}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      view === key
                        ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-white shadow-inner'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Matrix view */}
              {view === 'matrix' && (
                <ErrorBoundary fallbackTitle="Annotation Matrix failed to render">
                  <AnnotationMatrix ingressReports={analysisReport.ingressReports} />
                </ErrorBoundary>
              )}

              {/* Graph view */}
              {view === 'graph' && (
                <ErrorBoundary fallbackTitle="Dependency Graph failed to render">
                  <DependencyGraph ingressReports={analysisReport.ingressReports} />
                </ErrorBoundary>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon, color, glow }: { label: string; value: number; icon: string; color: string; glow: string }) {
  return (
    <div className={`rounded-2xl glass p-5 ${glow}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">{label}</p>
        <span className="text-base">{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
