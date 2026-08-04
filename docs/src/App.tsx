import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import SearchModal from './components/SearchModal';
import Home from './pages/Home';
import Installation from './pages/Installation';
import QuickStart from './pages/QuickStart';
import Detect from './pages/workflow/Detect';
import Analyze from './pages/workflow/Analyze';
import Migrate from './pages/workflow/Migrate';
import Validate from './pages/workflow/Validate';
import Traefik from './pages/targets/Traefik';
import GatewayAPI from './pages/targets/GatewayAPI';
import CLI from './pages/CLI';
import APIReference from './pages/APIReference';
import Architecture from './pages/Architecture';
import Contributing from './pages/Contributing';

export default function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K or '/' key outside input elements
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName))
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <Sidebar onOpenSearch={() => setIsSearchOpen(true)} />
      <main className="flex-1 ml-64 p-8 lg:p-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/getting-started/installation" element={<Installation />} />
          <Route path="/getting-started/quickstart" element={<QuickStart />} />
          <Route path="/workflow/detect" element={<Detect />} />
          <Route path="/workflow/analyze" element={<Analyze />} />
          <Route path="/workflow/migrate" element={<Migrate />} />
          <Route path="/workflow/validate" element={<Validate />} />
          <Route path="/targets/traefik" element={<Traefik />} />
          <Route path="/targets/gateway-api" element={<GatewayAPI />} />
          <Route path="/cli" element={<CLI />} />
          <Route path="/api" element={<APIReference />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/contributing" element={<Contributing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

function NotFound() {
  return (
    <div className="text-center py-20">
      <p className="text-6xl mb-4">404</p>
      <p className="text-slate-400">Page not found</p>
      <a href="#/" className="text-blue-400 hover:underline text-sm mt-4 inline-block">
        ← Back to Home
      </a>
    </div>
  );
}
