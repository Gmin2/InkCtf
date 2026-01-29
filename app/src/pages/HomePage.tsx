import type { FC } from 'react';
import { Link } from 'react-router-dom';
import type { Level } from '../types';
import { LEVELS } from '../constants';
import { useProgress } from '../hooks/useProgress';
import { SquinkSchematic } from '../components/SquinkSchematic';
import { MissionNode } from '../components/MissionNode';
import { InkLogoWhite } from '../components/svgs/InkLogoWhite';
import { InkLogoBlack } from '../components/svgs/InkLogoBlack';
import type { LevelId } from '../lib/chain-config';

const Crosshair: FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`cross ${className}`}></div>
);

interface HomePageProps {
  theme: 'dark' | 'light';
}

export const HomePage: FC<HomePageProps> = ({ theme }) => {
  const { isLevelCompleted, progress } = useProgress();

  return (
    <div className="flex-1 flex flex-col">
      <section className="relative border-b border-(--border-color) pt-20">
        <SquinkSchematic theme={theme} />

        <div className="text-center space-y-8 max-w-4xl mx-auto -mt-24 pb-32 relative z-30">
          <div className="flex items-center justify-center gap-6">
            <div className="h-px w-20 bg-ink-pink/30"></div>
            <span className="text-[11px] font-black uppercase tracking-[0.6em] text-ink-pink">Guardian Training Interface</span>
            <div className="h-px w-20 bg-ink-pink/30"></div>
          </div>
          <h1 className="text-7xl font-black uppercase tracking-tighter text-(--text-primary) leading-none">
            INK!<span className="text-ink-pink">SPECTOR</span> GADGET
          </h1>
          <p className="text-xl text-(--text-secondary) font-medium tracking-tight max-w-2xl mx-auto leading-relaxed">
            An interactive CTF platform for testing and learning about ink! smart contract security.
          </p>
          <div className="flex justify-center gap-8 pt-6">
            <Link
              to="/docs"
              className={`px-12 py-5 border text-[12px] font-black uppercase tracking-[0.2em] transition-all ${
                theme === 'light'
                  ? 'bg-black text-white border-black hover:bg-zinc-800'
                  : 'bg-(--card-bg) text-(--text-primary) border-(--border-color) hover:bg-(--text-primary) hover:text-(--bg-void)'
              }`}
            >
              Access Vault Archives
            </Link>
            <Link
              to="/stats"
              className="px-12 py-5 border text-[12px] font-black uppercase tracking-[0.2em] transition-all bg-ink-pink text-white border-ink-pink hover:brightness-110"
            >
              View Statistics
            </Link>
          </div>
        </div>

        <Crosshair className="bottom-0 -left-[6px]" />
        <Crosshair className="bottom-0 -right-[6px]" />
      </section>

      <div className="relative border-b border-(--border-color) px-10 py-6 bg-black/5 dark:bg-black/20">
        <div className="flex items-center gap-8">
          <div className="w-3 h-3 bg-ink-pink"></div>
          <h3 className="text-xs font-black uppercase tracking-[0.5em] text-(--text-primary)">Sector_Deployment_Map</h3>
          <div className="flex-1 h-px bg-(--border-color)"></div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] mono text-(--text-secondary) font-bold uppercase tracking-[0.2em]">
              Progress: {progress.totalCompleted}/{LEVELS.length}
            </span>
            <div className="flex gap-1">
              {LEVELS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 ${i < progress.totalCompleted ? 'bg-green-500' : 'bg-(--border-color)'}`}
                />
              ))}
            </div>
          </div>
        </div>
        <Crosshair className="bottom-0 -left-[6px]" />
        <Crosshair className="bottom-0 -right-[6px]" />
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {LEVELS.map((level: Level, i: number) => (
          <MissionNode
            key={level.id}
            level={level}
            index={i}
            isLocked={i > 5}
            isCompleted={isLevelCompleted(level.id as LevelId)}
            linkTo={`/level/${i + 1}`}
          />
        ))}
      </section>

      <footer className="mt-auto py-24 border-t border-(--border-color) relative">
        <div className="px-12 flex flex-col md:flex-row justify-between items-center gap-12 opacity-60">
          <div className="flex items-center gap-6">
            {theme === 'dark' ? (
              <InkLogoWhite className="h-8 transition-all duration-300" />
            ) : (
              <InkLogoBlack className="h-8 transition-all duration-300" />
            )}
            <span className="font-black text-lg uppercase tracking-tighter text-(--text-secondary)">ink!Spector</span>
          </div>
          <div className="flex gap-12 text-[10px] font-black text-(--text-secondary) uppercase tracking-[0.3em]">
            <a href="https://github.com/Gmin2/InkCtf" target="_blank" rel="noopener noreferrer" className="hover:text-ink-pink transition-colors">Github_Repo</a>
            <Link to="/docs" className="hover:text-ink-pink transition-colors">Documentation</Link>
            <Link to="/stats" className="hover:text-ink-pink transition-colors">Statistics</Link>
            <a href="https://passet-hub.subscan.io" target="_blank" rel="noopener noreferrer" className="hover:text-ink-pink transition-colors">Paseo_Scan</a>
          </div>
          <div className="text-[10px] mono text-(--text-secondary) uppercase tracking-[0.4em]">
            [ Secure_Transmission_Ready ]
          </div>
        </div>
        <Crosshair className="top-0 -left-[6px]" />
        <Crosshair className="top-0 -right-[6px]" />
      </footer>
    </div>
  );
};
