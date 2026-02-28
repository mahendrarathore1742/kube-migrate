import { useState } from 'react';
import type { ScanResult, AnalysisReport } from './types';
import Detect from './pages/Detect';
import Analyze from './pages/Analyze';
import Migrate from './pages/Migrate';
import Validate from './pages/Validate';

type Page = 'detect' | 'analyze' | 'migrate' | 'validate';

const navItems: { id: Page; label: string; icon: string; desc: string; step: number }[] = [
  { id: 'detect',   label: 'Detect',   icon: '🔍', desc: 'Scan cluster',          step: 1 },
  { id: 'analyze',  label: 'Analyze',  icon: '🔬', desc: 'Check compatibility',   step: 2 },
  { id: 'migrate',  label: 'Migrate',  icon: '🚀', desc: 'Generate files',        step: 3 },
  { id: 'validate', label: 'Validate', icon: '✅', desc: 'Verify migration',       step: 4 },
];

const stepOrder: Page[] = ['detect', 'analyze', 'migrate', 'validate'];

export default function App() {
  const [page, setPage] = useState<Page>('detect');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);

  const currentStep = stepOrder.indexOf(page);

  return (
    <div className="min-h-screen bg-black bg-mesh text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-[#222]/60 glass sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-lg">⚙️</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                kube<span className="text-gradient">-migrate</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">Kubernetes Ingress Migration Tool</p>
            </div>
          </div>

          {/* Progress indicator in header */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item, i) => {
              const isActive = page === item.id;
              const isCompleted = i < currentStep;
              return (
                <div key={item.id} className="flex items-center">
                  {i > 0 && (
                    <div className={`w-8 h-[2px] mx-0.5 rounded-full transition-colors duration-300 ${
                      isCompleted ? 'bg-blue-500' : 'bg-[#222]'
                    }`} />
                  )}
                  <button
                    onClick={() => setPage(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
                        : isCompleted
                        ? 'text-blue-400 hover:bg-blue-500/10'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-[#111]/50'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : isCompleted
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-[#111] text-slate-500'
                    }`}>
                      {isCompleted ? '✓' : item.step}
                    </span>
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* GitHub link */}
          <a
            href="https://github.com/kube-migrate/kube-migrate"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        {/* Sidebar navigation */}
        <aside className="w-[260px] border-r border-[#222]/40 p-5 hidden lg:flex flex-col gap-6">
          {/* Steps nav */}
          <nav className="space-y-1.5">
            {navItems.map((item, i) => {
              const isActive = page === item.id;
              const isCompleted = i < currentStep;
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 group ${
                    isActive
                      ? 'glass glow-blue'
                      : 'hover:bg-[#111]/80 border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-blue-500/20 shadow-inner'
                      : isCompleted
                      ? 'bg-emerald-500/10'
                      : 'bg-[#111]/80 group-hover:bg-[#181818]/80'
                  }`}>
                    {isCompleted ? (
                      <span className="text-emerald-400 text-sm">✓</span>
                    ) : (
                      <span className="text-lg">{item.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-semibold ${
                        isActive ? 'text-blue-400' : 'text-slate-600'
                      }`}>
                        0{item.step}
                      </span>
                      <span className={`font-semibold text-sm ${
                        isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-400'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="mt-auto">
            <div className="rounded-xl glass p-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Migration Status</p>
              <div className="space-y-2">
                <StatusItem label="Cluster scanned" done={!!scanResult} />
                <StatusItem label="Compatibility analyzed" done={!!analysisReport} />
                <StatusItem label="Files generated" done={false} />
                <StatusItem label="Migration validated" done={false} />
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="lg:hidden border-b border-[#222]/40 glass p-2 flex gap-1 overflow-x-auto w-full">
          {navItems.map((item, i) => {
            const isActive = page === item.id;
            const isCompleted = i < currentStep;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap font-medium transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
                    : isCompleted
                    ? 'text-emerald-400 hover:bg-[#111]/50'
                    : 'text-slate-400 hover:bg-[#111]/50'
                }`}
              >
                {isCompleted ? '✓' : item.icon} {item.label}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-6 lg:p-8 animate-fade-in" key={page}>
          {page === 'detect' && (
            <Detect
              onScanComplete={(r) => { setScanResult(r); setPage('analyze'); }}
              scanResult={scanResult}
            />
          )}
          {page === 'analyze' && (
            <Analyze
              scanResult={scanResult}
              onAnalysisComplete={(r) => { setAnalysisReport(r); }}
              analysisReport={analysisReport}
            />
          )}
          {page === 'migrate' && (
            <Migrate scanResult={scanResult} analysisReport={analysisReport} />
          )}
          {page === 'validate' && (
            <Validate scanResult={scanResult} />
          )}
        </main>
      </div>
    </div>
  );
}

function StatusItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
        done ? 'bg-emerald-500/20' : 'bg-[#111]'
      }`}>
        {done ? (
          <span className="text-emerald-400 text-[9px]">✓</span>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
        )}
      </div>
      <span className={`text-xs ${done ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
    </div>
  );
}
