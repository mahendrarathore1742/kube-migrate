import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { navigation } from '../navigation';
import type { NavItem } from '../navigation';

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-[#080808] border-r border-[#1a1a2e] flex flex-col z-30">
      {/* Logo */}
      <div className="p-5 border-b border-[#1a1a2e]">
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-sm shadow-lg shadow-blue-500/20">
            ⚙️
          </div>
          <div>
            <span className="text-white font-bold text-sm tracking-tight">kube-migrate</span>
            <span className="text-[10px] ml-1.5 text-slate-600 font-mono">docs</span>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigation.map((item) => (
          <SidebarItem key={item.path} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#1a1a2e]">
        <a
          href="https://github.com/mahendrarathore1742/kube-migrate"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub Repository
        </a>
      </div>
    </aside>
  );
}

function SidebarItem({ item }: { item: NavItem }) {
  const location = useLocation();
  const [open, setOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some((c) => location.pathname === c.path);
  });

  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-[#111] transition-colors"
        >
          <span className="flex items-center gap-2.5">
            {item.icon && <span className="text-xs">{item.icon}</span>}
            {item.title}
          </span>
          <svg
            className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {open && (
          <div className="ml-5 mt-0.5 space-y-0.5 border-l border-[#1a1a2e] pl-3">
            {item.children!.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) =>
                  `block px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'text-blue-400 bg-blue-500/10'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-[#111]'
                  }`
                }
              >
                {child.title}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? 'text-white bg-[#111] border border-[#1a1a2e]'
            : 'text-slate-400 hover:text-white hover:bg-[#111]'
        }`
      }
    >
      {item.icon && <span className="text-xs">{item.icon}</span>}
      {item.title}
    </NavLink>
  );
}
