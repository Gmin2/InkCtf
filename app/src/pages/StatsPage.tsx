import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useStatistics } from '../hooks/useStatistics';
import { useWallet } from '../lib/polkadot-provider';
import { PlayerStatsPanel } from '../components/PlayerStatsPanel';
import { GlobalStatsPanel } from '../components/GlobalStatsPanel';

const Crosshair: FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`cross ${className}`}></div>
);

interface StatsPageProps {
  theme: 'dark' | 'light';
}

export const StatsPage: FC<StatsPageProps> = ({ theme: _theme }) => {
  const { data, isLoading, error, refetch } = useStatistics();
  const { selectedAccount } = useWallet();

  return (
    <div className="flex-1 flex flex-col">
      {/* Header Section */}
      <section className="relative border-b border-(--border-color) pt-20 pb-16">
        <div className="text-center space-y-6 max-w-4xl mx-auto px-10">
          <div className="flex items-center justify-center gap-6">
            <div className="h-px w-20 bg-ink-pink/30"></div>
            <span className="text-[11px] font-black uppercase tracking-[0.6em] text-ink-pink">
              Performance Metrics
            </span>
            <div className="h-px w-20 bg-ink-pink/30"></div>
          </div>
          <h1 className="text-6xl font-black uppercase tracking-tighter text-(--text-primary) leading-none">
            STATS<span className="text-ink-pink">CONSOLE</span>
          </h1>
          <p className="text-lg text-(--text-secondary) font-medium tracking-tight max-w-2xl mx-auto">
            Track your performance and view global statistics across all security challenges.
          </p>
        </div>
        <Crosshair className="bottom-0 -left-[6px]" />
        <Crosshair className="bottom-0 -right-[6px]" />
      </section>

      {/* Controls Bar */}
      <div className="relative border-b border-(--border-color) px-10 py-4 bg-black/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-[10px] font-black uppercase tracking-widest text-(--text-secondary) hover:text-ink-pink transition-colors"
            >
              &larr; Back to Levels
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {selectedAccount && (
              <span className="text-[10px] mono text-(--text-secondary)">
                {selectedAccount.address.slice(0, 8)}...{selectedAccount.address.slice(-6)}
              </span>
            )}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed border-(--border-color) text-(--text-secondary)'
                  : 'border-ink-pink text-ink-pink hover:bg-ink-pink hover:text-white'
              }`}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
        <Crosshair className="bottom-0 -left-[6px]" />
        <Crosshair className="bottom-0 -right-[6px]" />
      </div>

      {/* Main Content */}
      <section className="flex-1 px-10 py-12">
        {error && (
          <div className="mb-8 p-4 border border-red-500/30 bg-red-500/10 text-red-500 text-sm">
            {error}
          </div>
        )}

        {isLoading && !data ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-2 border-ink-pink border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-(--text-secondary) text-sm">Loading statistics...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <PlayerStatsPanel
              stats={data?.playerStats || []}
              isConnected={!!selectedAccount}
            />
            <GlobalStatsPanel stats={data?.globalStats || []} />
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-(--border-color) relative">
        <div className="px-12 text-center">
          <p className="text-[10px] mono text-(--text-secondary) uppercase tracking-widest">
            Statistics are fetched directly from the on-chain Statistics contract
          </p>
        </div>
        <Crosshair className="top-0 -left-[6px]" />
        <Crosshair className="top-0 -right-[6px]" />
      </footer>
    </div>
  );
};
