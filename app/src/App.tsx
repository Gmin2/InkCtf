import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { gsap } from 'gsap';
import { Toaster } from 'sonner';
import { PolkadotProvider, useWallet } from './lib/polkadot-provider';
import { PlayerHUD } from './components/PlayerHUD';
import { InkSquink } from './components/svgs/InkSquink';
import { HomePage } from './pages/HomePage';
import { DocsPage } from './pages/DocsPage';
import { LevelPage } from './pages/LevelPage';
import { StatsPage } from './pages/StatsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { WalkthroughPage } from './pages/WalkthroughPage';

// Wallet Status Indicator
const WalletStatus: FC = () => {
  const { isConnected, selectedAccount } = useWallet();

  return (
    <div className="fixed bottom-10 right-10 flex items-center gap-5 bg-(--bg-void) border border-(--border-color) px-6 py-3 z-40 shadow-2xl backdrop-blur-md">
      <div className="flex gap-1 h-2 items-end">
        <div className={`w-1.5 h-[60%] ${isConnected ? 'bg-green-500/50' : 'bg-ink-pink/50'}`}></div>
        <div className={`w-1.5 h-full ${isConnected ? 'bg-green-500' : 'bg-ink-pink'}`}></div>
        <div className={`w-1.5 h-[40%] ${isConnected ? 'bg-green-500/70' : 'bg-ink-pink/70'}`}></div>
        <div className={`w-1.5 h-[80%] ${isConnected ? 'bg-green-500' : 'bg-ink-pink'}`}></div>
      </div>
      <span className="text-[10px] mono text-(--text-secondary) font-bold tracking-[0.3em] uppercase">
        {isConnected
          ? `Wallet_Connected: ${selectedAccount?.name || selectedAccount?.address.slice(0, 8)}...`
          : 'Wallet_Disconnected'
        }
      </span>
    </div>
  );
};

const Crosshair: FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`cross ${className}`}></div>
);

function AppContent() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const wipeRef = useRef<HTMLDivElement>(null);
  const wipeMascotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const duration = 2.2;

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(wipeRef.current, { x: "-100%" });
        gsap.set(wipeMascotRef.current, { opacity: 0 });
      }
    });

    tl.to(wipeRef.current, {
      x: "100%",
      duration: duration,
      ease: "power3.inOut"
    });

    tl.fromTo(wipeMascotRef.current,
      { x: "-100vw", opacity: 1, scale: 0.8 },
      { x: "100vw", opacity: 1, scale: 1.2, duration: duration, ease: "power3.inOut" },
      0
    );

    tl.add(() => {
      setTheme(nextTheme);
    }, duration * 0.5);
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <PlayerHUD theme={theme} onToggleTheme={toggleTheme} />

      <div ref={wipeRef} className="theme-transition-mask"></div>
      <div ref={wipeMascotRef} className="fixed inset-0 z-10000 flex items-center justify-center pointer-events-none opacity-0">
        <InkSquink className="w-[600px] h-[600px] drop-shadow-[0_0_80px_rgba(255,255,255,0.8)]" />
      </div>

      <div className="flex-1 flex flex-col relative mx-[10%] border-x border-(--border-color) min-h-screen">
        <Crosshair className="top-[110px] -left-[6px] highlight" />
        <Crosshair className="top-[110px] -right-[6px] highlight" />

        <div className="flex-1 flex flex-col mt-[110px]">
          <Routes>
            <Route path="/" element={<HomePage theme={theme} />} />
            <Route path="/docs" element={<DocsPage theme={theme} />} />
            <Route path="/stats" element={<StatsPage theme={theme} />} />
            <Route path="/walkthrough" element={<WalkthroughPage theme={theme} />} />
            <Route path="/level/:id" element={<LevelPage theme={theme} />} />
            <Route path="*" element={<NotFoundPage theme={theme} />} />
          </Routes>
        </div>
      </div>

      <WalletStatus />

      {/* Toast notifications */}
      <Toaster
        position="bottom-left"
        toastOptions={{
          style: {
            background: 'var(--bg-void)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          },
        }}
      />
    </div>
  );
}

// Main App with Provider and Router
export default function App() {
  return (
    <BrowserRouter>
      <PolkadotProvider>
        <AppContent />
      </PolkadotProvider>
    </BrowserRouter>
  );
}
