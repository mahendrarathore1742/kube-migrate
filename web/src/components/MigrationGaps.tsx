import { useState } from 'react';
import { api } from '../api/client';
import type { AnnotationMapping, Target, ApplyResponse } from '../types';

interface GapItem {
  ingress: string;
  mapping: AnnotationMapping;
}

interface Props {
  gaps: GapItem[];
  target: Target;
}

export default function MigrationGaps({ gaps, target }: Props) {
  const [applyingKey, setApplyingKey] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ApplyResponse>>({});

  if (gaps.length === 0) {
    return (
      <div className="rounded-2xl glass bg-gradient-to-r from-emerald-500/5 to-green-500/5 p-8 text-center glow-emerald">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎉</span>
        </div>
        <p className="text-sm text-emerald-300 font-medium">No migration gaps — all annotations are fully supported!</p>
      </div>
    );
  }

  const partialGaps = gaps.filter((g) => g.mapping.status === 'partial');
  const unsupportedGaps = gaps.filter((g) => g.mapping.status === 'unsupported');

  const handleApply = async (category: string, dryRun: boolean) => {
    const key = `${category}-${dryRun ? 'dry' : 'apply'}`;
    setApplyingKey(key);
    try {
      const resp = await api.apply({ target, category, dryRun });
      setResults((prev) => ({ ...prev, [key]: resp }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [key]: { success: false, output: '', dryRun, applied: [], error: err instanceof Error ? err.message : 'Failed' },
      }));
    } finally {
      setApplyingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Unsupported */}
      {unsupportedGaps.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Unsupported Annotations
            <span className="badge bg-red-500/10 text-red-400 border border-red-500/25">{unsupportedGaps.length}</span>
          </h3>
          <div className="space-y-3">
            {unsupportedGaps.map((g, i) => (
              <GapCard key={`${g.ingress}/${g.mapping.originalKey}`} gap={g} delay={i * 30} />
            ))}
          </div>
        </section>
      )}

      {/* Partial */}
      {partialGaps.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Workaround Needed
            <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/25">{partialGaps.length}</span>
          </h3>
          <div className="space-y-3">
            {partialGaps.map((g, i) => (
              <GapCard key={`${g.ingress}/${g.mapping.originalKey}`} gap={g} delay={i * 30} />
            ))}
          </div>
        </section>
      )}

      {/* Bulk apply buttons */}
      <div className="flex gap-3 pt-5 border-t border-[#222]/40 flex-wrap">
        {['middleware', 'httproute', 'policy', 'ingress'].map((cat) => (
          <div key={cat} className="flex gap-1.5">
            <button
              disabled={applyingKey !== null}
              onClick={() => handleApply(cat, true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#222] text-slate-400 bg-[#0a0a0a] hover:bg-[#111] hover:border-[#333] disabled:opacity-40 transition-all"
            >
              🧪 Dry-run {cat}
            </button>
            <button
              disabled={applyingKey !== null}
              onClick={() => handleApply(cat, false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600/15 to-indigo-600/10 border border-blue-500/25 text-blue-300 hover:from-blue-600/25 hover:to-indigo-600/15 disabled:opacity-40 transition-all"
            >
              🚀 Apply {cat}
            </button>
          </div>
        ))}
      </div>

      {/* Apply results */}
      {Object.entries(results).map(([key, r]) => (
        <div
          key={key}
          className={`rounded-xl p-4 text-sm animate-fade-in ${
            r.success
              ? 'bg-emerald-500/5 border border-emerald-500/20 text-emerald-300'
              : 'bg-red-500/5 border border-red-500/20 text-red-300'
          }`}
        >
          <p className="font-semibold mb-1">
            {r.dryRun ? '🧪 Dry-run' : '🚀 Apply'} — {key.split('-')[0]}
          </p>
          {r.output && <pre className="code-block mt-2 max-h-48 overflow-y-auto text-xs">{r.output}</pre>}
          {r.error && <p className="text-xs text-red-400 mt-1">{r.error}</p>}
          {r.applied.length > 0 && (
            <p className="text-xs text-slate-500 mt-2">Applied: {r.applied.join(', ')}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function GapCard({ gap, delay = 0 }: { gap: GapItem; delay?: number }) {
  const m = gap.mapping;
  const isUnsupported = m.status === 'unsupported';

  return (
    <div
      className={`rounded-2xl glass p-5 animate-slide-in ${isUnsupported ? 'glow-red' : 'glow-amber'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] text-slate-600 bg-[#0a0a0a] px-2 py-0.5 rounded">{gap.ingress}</span>
          </div>
          <p className="font-mono text-sm text-white break-all">{m.originalKey}</p>
          <p className="font-mono text-xs text-slate-500 mt-1 truncate" title={m.originalValue}>
            = {m.originalValue}
          </p>
          {m.note && (
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">{m.note}</p>
          )}
          {m.targetResource && (
            <p className="text-xs mt-2 flex items-center gap-1.5">
              <span className="text-slate-600">→</span>
              <span className={`font-mono ${isUnsupported ? 'text-red-300' : 'text-amber-300'}`}>{m.targetResource}</span>
            </p>
          )}
        </div>
        <span className={`badge border flex-shrink-0 ${
          isUnsupported
            ? 'bg-red-500/10 text-red-400 border-red-500/25'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
        }`}>
          {isUnsupported ? '❌ Unsupported' : '⚠️ Workaround'}
        </span>
      </div>
      {m.generatedYaml && (
        <pre className="code-block mt-4 max-h-48 overflow-x-auto text-xs">
          {m.generatedYaml}
        </pre>
      )}
    </div>
  );
}
