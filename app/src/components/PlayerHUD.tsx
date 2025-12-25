import React from 'react';
import { Link } from 'react-router-dom';
import { WalletConnect } from './WalletConnect';

interface PlayerHUDProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const PlayerHUD: React.FC<PlayerHUDProps> = ({ theme, onToggleTheme }) => {
  const logo = theme === 'dark'
    ? "https://use.ink/img/logo/ink-logo-with-squid-white.svg"
    : "https://use.ink/img/logo/ink-logo-with-squid-black.svg";

  return (
    <div className="fixed top-0 left-0 w-full h-[110px] border-b border-[var(--border-color)] z-50 bg-[var(--hud-bg)] backdrop-blur-md transition-colors duration-300">
      <div className="mx-[10%] h-full border-x border-[var(--border-color)] px-10 flex justify-between items-center">
        <Link to="/" className="flex gap-6 items-center group">
          <div className="flex items-center gap-4">
             <img
               src={logo}
               className="h-10 transition-all duration-500 group-hover:scale-105"
               alt="ink! logo"
             />
             <div className="h-6 w-px bg-[var(--border-color)] mx-2"></div>
             <div className="flex flex-col">
               <span className="text-[10px] mono text-[var(--text-secondary)] font-bold tracking-[0.2em] group-hover:text-ink-pink transition-colors">SPECTOR_UNIT_01</span>
               <span className="text-[9px] mono text-ink-pink font-bold uppercase tracking-widest">Core: Verified</span>
             </div>
          </div>
        </Link>

        <div className="flex gap-10 items-center">
          <div className="hidden lg:flex gap-10 mr-4">
            <div className="text-right">
              <span className="text-[9px] mono text-[var(--text-secondary)] block uppercase tracking-widest mb-1 font-bold">Zone</span>
              <span className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-tight">PASEO_PASSET_HUB</span>
            </div>
            <div className="text-right border-l border-[var(--border-color)] pl-10">
              <span className="text-[9px] mono text-[var(--text-secondary)] block uppercase tracking-widest mb-1 font-bold">Secure_Uplink</span>
              <span className="text-[12px] font-black text-[var(--text-primary)] uppercase">ACTIVE</span>
            </div>
          </div>

          <button
            onClick={onToggleTheme}
            className="w-12 h-12 flex items-center justify-center border border-[var(--border-color)] hover:bg-ink-pink transition-all group overflow-hidden relative"
            title="Toggle Core Phase"
          >
             <div className="absolute inset-0 bg-ink-pink/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <img
                src="https://use.ink/img/ink-squink.svg"
                className={`w-9 h-9 transition-transform duration-500 ${theme === 'light' ? 'invert' : ''} group-active:scale-110`}
             />
          </button>

          <WalletConnect />
        </div>
      </div>
    </div>
  );
};
