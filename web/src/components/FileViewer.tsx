import { useState } from 'react';
import type { GeneratedFile } from '../types';

interface Props {
  files: GeneratedFile[];
}

const categoryOrder = ['install', 'gateway', 'middleware', 'ingress', 'httproute', 'policy', 'verify', 'guide', 'cleanup'];

const categoryConfig: Record<string, { label: string; icon: string; color: string; dot: string }> = {
  install:    { label: 'Installation',  icon: '📦', color: 'text-blue-400',    dot: 'bg-blue-500' },
  gateway:    { label: 'Gateway',       icon: '🌐', color: 'text-purple-400',  dot: 'bg-purple-500' },
  middleware: { label: 'Middlewares',    icon: '🔧', color: 'text-cyan-400',    dot: 'bg-cyan-500' },
  ingress:    { label: 'Ingresses',     icon: '🔀', color: 'text-emerald-400', dot: 'bg-emerald-500' },
  httproute:  { label: 'HTTPRoutes',    icon: '🛣️',  color: 'text-indigo-400', dot: 'bg-indigo-500' },
  policy:     { label: 'Policies',      icon: '🛡️', color: 'text-orange-400',  dot: 'bg-orange-500' },
  verify:     { label: 'Verification',  icon: '✅', color: 'text-green-400',   dot: 'bg-green-500' },
  guide:      { label: 'Guides',        icon: '📖', color: 'text-yellow-400',  dot: 'bg-yellow-500' },
  cleanup:    { label: 'Cleanup',       icon: '🧹', color: 'text-red-400',     dot: 'bg-red-500' },
};

export default function FileViewer({ files }: Props) {
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(files[0] || null);
  const [copied, setCopied] = useState(false);

  const grouped: Record<string, GeneratedFile[]> = {};
  for (const f of files) {
    const cat = f.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  }

  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  const handleCopy = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex gap-4 h-[600px]">
      {/* File tree */}
      <div className="w-64 flex-shrink-0 rounded-2xl glass overflow-y-auto">
        <div className="p-4 border-b border-[#222]/40">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Generated Files
            <span className="badge bg-blue-500/10 text-blue-400 border border-blue-500/25 ml-auto">{files.length}</span>
          </h3>
        </div>
        <div className="p-2 space-y-3">
          {sortedCategories.map((cat) => {
            const cfg = categoryConfig[cat] || { label: cat, icon: '📄', color: 'text-slate-400', dot: 'bg-slate-500' };
            return (
              <div key={cat}>
                <p className={`text-[10px] font-semibold px-3 py-1.5 ${cfg.color} flex items-center gap-2 uppercase tracking-wider`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </p>
                {grouped[cat].map((f) => (
                  <button
                    key={f.relPath}
                    onClick={() => setSelectedFile(f)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono truncate transition-all duration-150 ${
                      selectedFile?.relPath === f.relPath
                        ? 'bg-gradient-to-r from-blue-600/15 to-indigo-600/10 text-blue-300 border-l-2 border-blue-500'
                        : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-300 border-l-2 border-transparent'
                    }`}
                  >
                    {f.relPath}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* File content */}
      <div className="flex-1 rounded-2xl glass overflow-hidden flex flex-col">
        {selectedFile ? (
          <>
            <div className="p-4 border-b border-[#222]/40 flex items-center justify-between">
              <div>
                <p className="text-sm font-mono text-white">{selectedFile.relPath}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedFile.description}</p>
              </div>
              <button onClick={handleCopy}
                className={`text-xs px-4 py-2 rounded-lg border font-semibold transition-all duration-200 ${
                  copied
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : 'bg-[#0a0a0a] text-slate-400 border-[#222] hover:border-[#333] hover:text-white'
                }`}>
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-5 text-xs font-mono text-slate-300 leading-6 bg-[#050505]">
              {selectedFile.content}
            </pre>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl opacity-50">📄</span>
              </div>
              Select a file to view
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
