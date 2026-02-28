import { useState } from 'react';
import { api } from '../api/client';
import type { ScanResult, ValidationResult, Target } from '../types';

interface Props {
  scanResult: ScanResult | null;
}

const phaseConfig: Record<string, { icon: string; label: string; desc: string; color: string; glow: string; gradient: string }> = {
  'pre-migration': {
    icon: '🔴',
    label: 'Pre-Migration',
    desc: 'NGINX is handling all traffic. No new controller detected yet.',
    color: 'text-slate-400',
    glow: '',
    gradient: 'from-slate-500/10 to-slate-600/5',
  },
  'migrating': {
    icon: '🟡',
    label: 'Parallel Migration',
    desc: 'Both controllers running side-by-side. Traffic is safe.',
    color: 'text-amber-400',
    glow: 'glow-amber',
    gradient: 'from-amber-500/10 to-orange-500/5',
  },
  'post-migration': {
    icon: '🟢',
    label: 'Migration Complete',
    desc: 'New controller is active and serving traffic. NGINX can be removed.',
    color: 'text-emerald-400',
    glow: 'glow-emerald',
    gradient: 'from-emerald-500/10 to-green-500/5',
  },
};

export default function Validate({ scanResult }: Props) {
  const [target, setTarget] = useState<Target>('gateway-api');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleValidate = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.validate(target);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <span className="text-xl">✅</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Validate</h2>
          <p className="text-slate-500 text-sm">
            Verify your migration status and get next-step recommendations.
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
          <div className="flex items-center gap-3 flex-wrap">
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
            <button onClick={handleValidate} disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-emerald-800 disabled:to-emerald-800 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Checking...
                </>
              ) : '✅ Run Validation'}
            </button>
          </div>

          {error && (
            <div className="rounded-xl glass border-red-500/30 glow-red p-4 flex items-start gap-3 animate-fade-in">
              <span className="text-red-400 text-lg flex-shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-300">Validation failed</p>
                <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-fade-in">
              {/* Phase indicator */}
              {(() => {
                const phase = phaseConfig[result.phase] || phaseConfig['pre-migration'];
                return (
                  <div className={`rounded-2xl glass bg-gradient-to-r ${phase.gradient} p-6 ${phase.glow}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <span className="text-2xl">{phase.icon}</span>
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${phase.color}`}>{phase.label}</h3>
                        <p className="text-sm text-slate-400 mt-0.5">{phase.desc}</p>
                      </div>
                    </div>
                    {/* Controller status */}
                    <div className="flex gap-6 mt-4 pt-4 border-t border-[#222]/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${result.nginxRunning ? 'bg-emerald-500 animate-pulse-glow' : 'bg-neutral-800'}`} />
                        <span className="text-xs text-slate-400">NGINX {result.nginxRunning ? 'Running' : 'Stopped'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${result.targetRunning ? 'bg-emerald-500 animate-pulse-glow' : 'bg-neutral-800'}`} />
                        <span className="text-xs text-slate-400">{result.target === 'traefik' ? 'Traefik' : 'Envoy'} {result.targetRunning ? 'Running' : 'Not detected'}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Checks */}
              <div className="rounded-2xl glass p-6 space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Validation Checks
                </h3>
                <div className="space-y-2 mt-4">
                  {result.checks.map((check, i) => (
                    <div
                      key={check.name}
                      className="flex items-center gap-4 p-3.5 rounded-xl bg-[#0a0a0a] border border-[#222]/40 hover:border-[#333]/60 transition-all animate-slide-in"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        check.status === 'pass' ? 'bg-emerald-500/15' :
                        check.status === 'fail' ? 'bg-red-500/15' : 'bg-neutral-900'
                      }`}>
                        <span className="text-sm">
                          {check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⏭️'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{check.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{check.detail}</p>
                      </div>
                      <span className={`badge border ${
                        check.status === 'pass'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          : check.status === 'fail'
                          ? 'bg-red-500/10 text-red-400 border-red-500/25'
                          : 'bg-neutral-900 text-slate-500 border-[#222]'
                      }`}>
                        {check.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next steps */}
              {result.nextSteps.length > 0 && (
                <div className="rounded-2xl glass p-6 space-y-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Recommended Next Steps
                  </h3>
                  <ol className="space-y-2.5">
                    {result.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-300 animate-slide-in"
                        style={{ animationDelay: `${i * 60}ms` }}>
                        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600/20 to-indigo-600/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/20">
                          {i + 1}
                        </span>
                        <span className="pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Manual checklist */}
              <div className="rounded-2xl glass p-6 space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Manual Verification Checklist
                </h3>
                <ul className="space-y-2.5">
                  {[
                    'Run verify.sh from the migration output directory',
                    'Test each host with: curl -kv https://<host> --resolve <host>:443:<new-ip>',
                    'Verify TLS certificates on all HTTPS hosts',
                    'Test authentication (auth-url / ForwardAuth) if configured',
                    'Validate rate limiting is enforced',
                    'Monitor logs for 5xx errors after DNS cutover',
                    'Monitor for 24+ hours before removing NGINX',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-400 group cursor-default">
                      <span className="w-5 h-5 rounded border border-[#222] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-blue-500/40 transition-colors">
                        <span className="w-2 h-2 rounded-sm bg-neutral-800 group-hover:bg-blue-500/30 transition-colors" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
