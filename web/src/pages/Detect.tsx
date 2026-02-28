import { useState } from 'react';
import { api } from '../api/client';
import type { ScanResult } from '../types';

interface Props {
  onScanComplete: (result: ScanResult) => void;
  scanResult: ScanResult | null;
}

export default function Detect({ onScanComplete, scanResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.scan();
      onScanComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <span className="text-xl">🔍</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Detect</h2>
            <p className="text-slate-500 text-sm">
              Scan your Kubernetes cluster to discover the ingress controller and all Ingress resources.
            </p>
          </div>
        </div>
      </div>

      {/* Scan button + hero area */}
      {!scanResult && (
        <div className="rounded-2xl glass p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mx-auto">
            <span className="text-3xl">🏗️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Ready to scan your cluster</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              kube-migrate will detect your NGINX Ingress controller, enumerate all Ingress resources,
              and classify their migration complexity.
            </p>
          </div>
          <button
            onClick={handleScan}
            disabled={loading}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2.5 mx-auto ${
              loading
                ? 'bg-blue-800 text-blue-300 cursor-wait'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scanning cluster...
              </>
            ) : (
              <>🔍 Scan Cluster</>
            )}
          </button>
        </div>
      )}

      {/* Re-scan button when results exist */}
      {scanResult && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleScan}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-blue-800 disabled:to-blue-800 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scanning...
              </>
            ) : '🔄 Re-scan Cluster'}
          </button>
          <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            ✓ {scanResult.ingresses.length} ingresses found
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-xl glass border-red-500/30 glow-red p-4 flex items-start gap-3 animate-fade-in">
          <span className="text-red-400 text-lg flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-medium text-red-300">Scan failed</p>
            <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {scanResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Controller info */}
          <div className="rounded-2xl glass p-6 glow-blue">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse-glow" />
              Ingress Controller Detected
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              <InfoCard label="Type" value={scanResult.controller.type} icon="🏷️" />
              <InfoCard label="Version" value={scanResult.controller.version} icon="📦" truncate />
              <InfoCard label="Namespace" value={scanResult.controller.namespace} icon="📁" truncate />
              <InfoCard label="Ingresses" value={String(scanResult.ingresses.length)} icon="🔢" accent />
            </div>
          </div>

          {/* Complexity breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {(['simple', 'moderate', 'complex'] as const).map((level) => {
              const count = scanResult.ingresses.filter((i) => i.complexity === level).length;
              const total = scanResult.ingresses.length;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const config = {
                simple:   { color: 'emerald', icon: '✅', glow: 'glow-emerald' },
                moderate: { color: 'amber',   icon: '⚠️', glow: 'glow-amber' },
                complex:  { color: 'red',     icon: '❌', glow: 'glow-red' },
              }[level];
              return (
                <div key={level} className={`rounded-2xl glass p-5 ${config.glow}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider capitalize">{level}</span>
                    <span className="text-lg">{config.icon}</span>
                  </div>
                  <p className={`text-3xl font-bold text-${config.color}-400`}>{count}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-${config.color}-500 animate-progress`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">{pct}% of total</p>
                </div>
              );
            })}
          </div>

          {/* Ingress table */}
          <div className="rounded-2xl glass overflow-hidden">
            <div className="p-5 border-b border-[#222]/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Ingress Resources
              </h3>
              <span className="badge bg-neutral-900 text-slate-400 border border-[#222]">
                {scanResult.ingresses.length} total
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#222]/50 text-slate-500 text-[11px] uppercase tracking-wider">
                    <th className="text-left px-5 py-3 font-semibold">Namespace</th>
                    <th className="text-left px-5 py-3 font-semibold">Name</th>
                    <th className="text-left px-5 py-3 font-semibold">Hosts</th>
                    <th className="text-left px-5 py-3 font-semibold">Annotations</th>
                    <th className="text-left px-5 py-3 font-semibold">Complexity</th>
                  </tr>
                </thead>
                <tbody>
                  {scanResult.ingresses.map((ing, i) => (
                    <tr
                      key={`${ing.namespace}/${ing.name}`}
                      className="border-b border-[#222]/30 hover:bg-[#111]/80 transition-colors animate-slide-in"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{ing.namespace}</td>
                      <td className="px-5 py-3.5 text-white font-medium">{ing.name}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs max-w-[200px] truncate">
                        {ing.hosts?.join(', ') || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="badge bg-neutral-900 text-slate-300 border border-[#222]">
                          {Object.keys(ing.nginxAnnotations || {}).length}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`badge border ${
                          ing.complexity === 'simple'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : ing.complexity === 'moderate'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                            : 'bg-red-500/10 text-red-400 border-red-500/25'
                        }`}>
                          {ing.complexity === 'simple' ? '✅' : ing.complexity === 'moderate' ? '⚠️' : '❌'} {ing.complexity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, icon, accent, truncate }: { label: string; value: string; icon: string; accent?: boolean; truncate?: boolean }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[11px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        <span className="text-xs">{icon}</span> {label}
      </p>
      <p
        className={`text-base font-semibold ${accent ? 'text-blue-400' : 'text-white'} ${truncate ? 'truncate' : ''}`}
        title={truncate ? value : undefined}
      >
        {value}
      </p>
    </div>
  );
}
