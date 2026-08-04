import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchIndex } from '../data/searchData';
import type { SearchItem } from '../data/searchData';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter search items based on query
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchIndex;

    const terms = q.split(/\s+/);

    return searchIndex.filter((item) => {
      const textToSearch = `${item.title} ${item.category} ${item.snippet} ${item.content} ${item.keywords?.join(' ') || ''}`.toLowerCase();
      return terms.every((term) => textToSearch.includes(term));
    });
  }, [query]);

  // Reset selection index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Handle keyboard navigation within search modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredResults.length > 0 ? (prev + 1) % filteredResults.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredResults.length > 0 ? (prev - 1 + filteredResults.length) % filteredResults.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults.length > 0 && filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelect = (item: SearchItem) => {
    onClose();
    if (item.path.includes('#')) {
      const [route, hash] = item.path.split('#');
      navigate(route || '/');
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      navigate(item.path);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0b0c14] border border-[#1e2238] rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#1e2238] bg-[#0f111c] gap-3">
          <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentation, topics, flags, CRDs..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-0 border-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-500 hover:text-slate-300 p-1 rounded-md text-xs transition-colors"
              title="Clear search"
            >
              ✕
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-[#161826] border border-[#282d46] rounded-md shadow-inner">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800"
        >
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center">
              <span className="text-3xl mb-2 block">🔍</span>
              <p className="text-slate-300 text-sm font-medium">No documentation results found</p>
              <p className="text-slate-500 text-xs mt-1">Try searching for keywords like "ingress", "traefik", "gateway api", "scan", or "analyze"</p>
            </div>
          ) : (
            filteredResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group px-3.5 py-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 border ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-lg shadow-blue-500/5'
                      : 'border-transparent text-slate-300 hover:bg-[#141726]'
                  }`}
                >
                  <span className="text-lg mt-0.5 shrink-0">{item.icon || '📄'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                        {item.title}
                      </h4>
                      <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#161826] text-slate-400 border border-[#262b42]">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                      {item.snippet}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="shrink-0 text-xs text-blue-400 font-mono mt-1 hidden sm:inline-block">
                      ↵
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Keyboard Shortcut Hints */}
        <div className="px-4 py-2.5 border-t border-[#1e2238] bg-[#090a10] text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#141624] border border-[#25293f] rounded text-[10px] text-slate-400 font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-[#141624] border border-[#25293f] rounded text-[10px] text-slate-400 font-mono">↓</kbd>
              <span className="ml-0.5">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#141624] border border-[#25293f] rounded text-[10px] text-slate-400 font-mono">↵</kbd>
              <span className="ml-0.5">Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#141624] border border-[#25293f] rounded text-[10px] text-slate-400 font-mono">ESC</kbd>
              <span className="ml-0.5">Close</span>
            </span>
          </div>
          <div className="hidden sm:block text-slate-600">
            {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}
          </div>
        </div>
      </div>
    </div>
  );
}
