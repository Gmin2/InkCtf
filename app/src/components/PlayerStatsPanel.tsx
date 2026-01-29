import type { FC } from 'react';
import { LEVELS } from '../constants';
import type { PlayerLevelStats } from '../types/statistics';

interface PlayerStatsPanelProps {
  stats: PlayerLevelStats[];
  isConnected: boolean;
}

export const PlayerStatsPanel: FC<PlayerStatsPanelProps> = ({ stats, isConnected }) => {
  // Calculate totals
  const totals = stats.reduce(
    (acc, stat) => ({
      successes: acc.successes + stat.successCount,
      failures: acc.failures + stat.failureCount,
      instances: acc.instances + stat.instanceCount,
    }),
    { successes: 0, failures: 0, instances: 0 }
  );

  if (!isConnected) {
    return (
      <div className="border border-(--border-color) bg-(--card-bg)">
        <div className="p-4 border-b border-(--border-color)">
          <h2 className="text-lg font-black uppercase tracking-wider text-(--text-primary)">
            Your Stats
          </h2>
        </div>
        <div className="p-8 text-center">
          <p className="text-(--text-secondary) text-sm">
            Connect your wallet to view your statistics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-(--border-color) bg-(--card-bg)">
      <div className="p-4 border-b border-(--border-color)">
        <h2 className="text-lg font-black uppercase tracking-wider text-(--text-primary)">
          Your Stats
        </h2>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-(--border-color) bg-black/5">
        <div className="text-center">
          <div className="text-2xl font-black text-green-500 mono">{totals.successes}</div>
          <div className="text-[10px] uppercase tracking-wider text-(--text-secondary)">Completions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-red-500 mono">{totals.failures}</div>
          <div className="text-[10px] uppercase tracking-wider text-(--text-secondary)">Failed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-ink-pink mono">{totals.instances}</div>
          <div className="text-[10px] uppercase tracking-wider text-(--text-secondary)">Instances</div>
        </div>
      </div>

      {/* Per-Level Stats */}
      <div className="divide-y divide-(--border-color)">
        {LEVELS.slice(0, 6).map((level, idx) => {
          const stat = stats.find((s) => s.levelId === level.id);
          const hasActivity = stat && (stat.successCount > 0 || stat.failureCount > 0 || stat.instanceCount > 0);

          return (
            <div
              key={level.id}
              className={`flex items-center justify-between p-4 ${hasActivity ? '' : 'opacity-50'}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center bg-(--border-color) text-[10px] font-black mono">
                  {idx + 1}
                </span>
                <span className="text-sm text-(--text-primary)">{level.title}</span>
              </div>
              <div className="flex items-center gap-4 mono text-xs">
                <span className="text-green-500" title="Completions">
                  {stat?.successCount || 0}
                </span>
                <span className="text-(--text-secondary)">/</span>
                <span className="text-red-500" title="Failed">
                  {stat?.failureCount || 0}
                </span>
                <span className="text-(--text-secondary)">/</span>
                <span className="text-ink-pink" title="Instances">
                  {stat?.instanceCount || 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
