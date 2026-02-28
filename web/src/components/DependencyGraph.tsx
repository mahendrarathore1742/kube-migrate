import type { IngressReport } from '../types';

interface Props {
  ingressReports: IngressReport[];
}

/**
 * Visual dependency graph showing how ingresses relate.
 * Groups ingresses by host and shows annotation dependency links.
 */
export default function DependencyGraph({ ingressReports }: Props) {
  const reports = Array.isArray(ingressReports) ? ingressReports : [];
  const hostMap = new Map<string, IngressReport[]>();
  for (const ir of reports) {
    const key = `${ir.namespace}/${ir.name}`;
    const hosts = extractHosts(ir);
    if (hosts.length === 0) hosts.push('(no host)');
    for (const host of hosts) {
      const list = hostMap.get(host) || [];
      list.push(ir);
      hostMap.set(host, list);
    }
    void key;
  }
  const sharedAnnotations = findSharedAnnotations(reports);

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl glass p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl opacity-40">🕸️</span>
        </div>
        <p className="text-sm text-slate-500">No ingresses to visualize.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Host clusters */}
      <div className="grid gap-4 md:grid-cols-2">
  {[...hostMap.entries()].map(([host, reports], idx) => (
          <div key={host} className="rounded-2xl glass overflow-hidden glow-blue animate-slide-in"
            style={{ animationDelay: `${idx * 60}ms` }}>
            <div className="px-5 py-3.5 border-b border-[#222]/40 bg-gradient-to-r from-blue-500/5 to-indigo-500/5">
              <h4 className="text-xs font-semibold text-blue-300 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <span className="text-[10px]">🌐</span>
                </div>
                <span className="font-mono truncate">{host}</span>
                <span className="badge bg-blue-500/10 text-blue-400 border border-blue-500/25 ml-auto">
                  {reports.length} ingress{reports.length > 1 ? 'es' : ''}
                </span>
              </h4>
            </div>
            <div className="p-3 space-y-2">
              {reports.map((ir) => {
                const overall =
                  ir.overallStatus === 'ready'
                    ? { icon: '✅', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' }
                    : ir.overallStatus === 'workaround'
                    ? { icon: '⚠️', border: 'border-amber-500/20', bg: 'bg-amber-500/5' }
                    : { icon: '❌', border: 'border-red-500/20', bg: 'bg-red-500/5' };
                return (
                  <div
                    key={`${ir.namespace}/${ir.name}`}
                    className={`rounded-xl border ${overall.border} ${overall.bg} px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors`}
                  >
                    <span className="text-sm">{overall.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium truncate">
                        <span className="text-slate-600 font-mono">{ir.namespace}/</span>
                        {ir.name}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {ir.mappings.length} annotation{ir.mappings.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2.5 text-[10px] font-semibold">
                      <span className="text-emerald-500">{ir.mappings.filter((m) => m.status === 'supported').length}✓</span>
                      <span className="text-amber-500">{ir.mappings.filter((m) => m.status === 'partial').length}⚠</span>
                      <span className="text-red-500">{ir.mappings.filter((m) => m.status === 'unsupported').length}✗</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Shared annotations */}
      {sharedAnnotations.length > 0 && (
        <div className="rounded-2xl glass bg-gradient-to-r from-indigo-500/5 to-purple-500/5 p-5">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            Shared Annotation Patterns
            <span className="badge bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">{sharedAnnotations.length}</span>
          </h4>
          <div className="space-y-2.5">
            {sharedAnnotations.map((sa, i) => (
              <div key={sa.annotation} className="flex items-center gap-3 text-xs p-2.5 rounded-lg bg-[#0a0a0a] border border-[#222]/30 animate-slide-in"
                style={{ animationDelay: `${i * 30}ms` }}>
                <span className="font-mono text-slate-300 break-all flex-shrink-0 max-w-[40%] truncate">{sa.annotation}</span>
                <span className="text-slate-700">→</span>
                <span className="text-slate-500 flex gap-1 flex-wrap">
                  {sa.ingresses.map((n) => (
                    <span key={n} className="badge bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{n}</span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function extractHosts(ir: IngressReport): string[] {
  const hosts = new Set<string>();
  for (const m of ir.mappings) {
    if (m.originalKey.includes('server-alias') || m.originalKey.includes('from-to-www')) {
      hosts.add(m.originalValue);
    }
  }
  return [...hosts];
}

interface SharedAnnotation {
  annotation: string;
  ingresses: string[];
}

function findSharedAnnotations(reports: IngressReport[]): SharedAnnotation[] {
  const annotMap = new Map<string, Set<string>>();
  for (const ir of reports) {
    for (const m of ir.mappings) {
      const key = m.originalKey;
      const existing = annotMap.get(key) || new Set();
      existing.add(`${ir.namespace}/${ir.name}`);
      annotMap.set(key, existing);
    }
  }
  return [...annotMap.entries()]
    .filter(([, names]) => names.size > 1)
    .map(([annotation, names]) => ({ annotation, ingresses: [...names] }))
    .sort((a, b) => b.ingresses.length - a.ingresses.length)
    .slice(0, 15);
}
