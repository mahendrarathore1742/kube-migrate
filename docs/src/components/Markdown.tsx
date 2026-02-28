import { ReactNode } from 'react';

export function H1({ children }: { children: ReactNode }) {
  return <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{children}</h1>;
}

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-xl font-bold text-white mt-10 mb-4 flex items-center gap-2 scroll-mt-20">
      {children}
      {id && (
        <a href={`#${id}`} className="text-slate-600 hover:text-blue-400 transition-colors text-base">
          #
        </a>
      )}
    </h2>
  );
}

export function H3({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h3 id={id} className="text-lg font-semibold text-slate-200 mt-8 mb-3 scroll-mt-20">
      {children}
    </h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-slate-400 leading-relaxed mb-4 text-[15px]">{children}</p>;
}

export function Code({ children }: { children: string }) {
  return (
    <pre className="my-4">
      <code>{children}</code>
    </pre>
  );
}

export function Callout({ type = 'info', title, children }: { type?: 'info' | 'warning' | 'tip'; title?: string; children: ReactNode }) {
  const styles = {
    info: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', icon: '💡', color: 'text-blue-400' },
    warning: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', icon: '⚠️', color: 'text-amber-400' },
    tip: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', icon: '✅', color: 'text-emerald-400' },
  }[type];

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-4 my-5`}>
      <div className={`flex items-center gap-2 font-semibold text-sm ${styles.color} mb-1`}>
        <span>{styles.icon}</span>
        {title || type.charAt(0).toUpperCase() + type.slice(1)}
      </div>
      <div className="text-sm text-slate-400 leading-relaxed">{children}</div>
    </div>
  );
}

export function Badge({ children, color = 'blue' }: { children: ReactNode; color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' }) {
  const c = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    red: 'bg-red-500/10 text-red-400 border-red-500/25',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
  }[color];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c}`}>
      {children}
    </span>
  );
}

export function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-5 rounded-xl border border-[#1a1a2e]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1a1a2e] bg-[#0a0a0f]">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#1a1a2e]/50 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-slate-400">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Card({ title, description, icon, href }: { title: string; description: string; icon: string; href?: string }) {
  const content = (
    <div className="rounded-xl border border-[#1a1a2e] bg-[#0a0a0f] p-5 hover:border-[#2a2a3e] hover:bg-[#0d0d14] transition-all group cursor-pointer">
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{icon}</span>
        <div>
          <h4 className="text-white font-semibold text-sm group-hover:text-blue-400 transition-colors">{title}</h4>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <a href={href} className="block no-underline">{content}</a>;
  }
  return content;
}
