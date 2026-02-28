import { useState } from 'react';
import type { IngressReport, AnnotationMapping } from '../types';

interface Props {
  ingressReports: IngressReport[];
}

const statusConfig = {
  supported:   { icon: '✅', label: 'Supported',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', glow: 'glow-emerald' },
  partial:     { icon: '⚠️', label: 'Workaround',  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   glow: 'glow-amber' },
  unsupported: { icon: '❌', label: 'Unsupported',  color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/25',     glow: 'glow-red' },
};

export default function AnnotationMatrix({ ingressReports }: Props) {
  // defensive: ensure we always work with an array
  const reports = Array.isArray(ingressReports) ? ingressReports : [];
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'supported' | 'partial' | 'unsupported'>('all');

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const expandAll = () =>
    setExpanded(new Set(reports.map((ir) => `${ir.namespace}/${ir.name}`)));
  const collapseAll = () => setExpanded(new Set());

  const filterMappings = (mappings: AnnotationMapping[]) =>
    filter === 'all' ? mappings : mappings.filter((m) => m.status === filter);

  const totalMappings = reports.reduce((acc, ir) => acc + (Array.isArray(ir.mappings) ? ir.mappings.length : 0), 0);
  const counts = reports.reduce(
    (acc, ir) => {
      const maps = Array.isArray(ir.mappings) ? ir.mappings : [];
      maps.forEach((m) => acc[m.status]++);
      return acc;
    },
    { supported: 0, partial: 0, unsupported: 0 } as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="glass rounded-xl p-1 flex gap-1">
          {(['all', 'supported', 'partial', 'unsupported'] as const).map((f) => {
            const isActive = filter === f;
            const badge = f === 'all' ? totalMappings : counts[f] ?? 0;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-white shadow-inner'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'all' ? '🔍 All' : statusConfig[f].icon + ' ' + statusConfig[f].label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-[#222]/50 text-slate-500'
                }`}>
                  {badge}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 text-xs">
          <button onClick={expandAll} className="text-slate-500 hover:text-blue-400 transition-colors font-medium">Expand all</button>
          <span className="text-slate-700">|</span>
          <button onClick={collapseAll} className="text-slate-500 hover:text-blue-400 transition-colors font-medium">Collapse all</button>
        </div>
      </div>

      {/* Accordion */}
      {reports.map((ir, idx) => {
        const key = `${ir.namespace}/${ir.name}`;
        const isOpen = expanded.has(key);
        const filtered = filterMappings(Array.isArray(ir.mappings) ? ir.mappings : []);
        const overallKey = ir.overallStatus === 'ready' ? 'supported' : ir.overallStatus === 'workaround' ? 'partial' : 'unsupported';
        const overall = statusConfig[overallKey];
        const perStatus = (Array.isArray(ir.mappings) ? ir.mappings : []).reduce(
          (acc, m) => { acc[m.status]++; return acc; },
          { supported: 0, partial: 0, unsupported: 0 } as Record<string, number>,
        );

        return (
          <div key={key} className={`rounded-2xl glass overflow-hidden animate-slide-in`}
            style={{ animationDelay: `${idx * 30}ms` }}>
            {/* Header */}
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
            >
              <span className={`transition-transform duration-200 text-slate-600 text-xs ${isOpen ? 'rotate-90' : ''}`}>▶</span>
              <span className="text-sm">{overall.icon}</span>
              <span className="font-mono text-xs text-slate-600">{ir.namespace}/</span>
              <span className="font-semibold text-white text-sm">{ir.name}</span>
              <div className="ml-auto flex gap-3 text-[11px] font-semibold">
                <span className="text-emerald-500">{perStatus.supported}✓</span>
                <span className="text-amber-500">{perStatus.partial}⚠</span>
                <span className="text-red-500">{perStatus.unsupported}✗</span>
              </div>
            </button>

            {/* Body */}
            {isOpen && (
              <div className="border-t border-[#222]/40">
                {filtered.length === 0 ? (
                  <p className="p-5 text-xs text-slate-600 italic">No annotations match the current filter.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#222]/40 text-slate-600 text-[10px] uppercase tracking-wider font-semibold">
                          <th className="text-left px-4 py-3 w-10">#</th>
                          <th className="text-left px-4 py-3">Annotation</th>
                          <th className="text-left px-4 py-3">Value</th>
                          <th className="text-left px-4 py-3">Status</th>
                          <th className="text-left px-4 py-3">Target Resource</th>
                          <th className="text-left px-4 py-3">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((m, i) => {
                          const s = statusConfig[m.status];
                          return (
                            <tr key={m.originalKey} className="border-b border-[#222]/20 hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3 text-xs text-slate-700 font-mono">{i + 1}</td>
                              <td className="px-4 py-3 font-mono text-xs text-slate-300 break-all">{m.originalKey}</td>
                              <td className="px-4 py-3 font-mono text-xs text-slate-500 max-w-[160px] truncate" title={m.originalValue}>{m.originalValue}</td>
                              <td className="px-4 py-3">
                                <span className={`badge border ${s.bg} ${s.color} ${s.border}`}>
                                  {s.icon} {s.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-400">{m.targetResource || '—'}</td>
                              <td className="px-4 py-3 text-xs text-slate-500 max-w-[280px]">{m.note || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
