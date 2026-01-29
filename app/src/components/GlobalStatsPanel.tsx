import type { FC } from 'react';
import { LEVELS } from '../constants';
import type { GlobalLevelStats } from '../types/statistics';

interface GlobalStatsPanelProps {
  stats: GlobalLevelStats[];
}

export const GlobalStatsPanel: FC<GlobalStatsPanelProps> = ({ stats }) => {
  // Calculate total instances across all levels
  const totalInstances = stats.reduce((acc, stat) => acc + stat.totalInstances, 0);

  // Find most popular level
  const mostPopular = stats.reduce(
    (max, stat) => (stat.totalInstances > max.totalInstances ? stat : max),
    { levelId: '', totalInstances: 0 } as GlobalLevelStats
  );

  const mostPopularLevel = LEVELS.find((l) => l.id === mostPopular.levelId);

  return (
    <div className="border border-(--border-color) bg-(--card-bg)">
      <div className="p-4 border-b border-(--border-color)">
        <h2 className="text-lg font-black uppercase tracking-wider text-(--text-primary)">
          Global Stats
        </h2>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b border-(--border-color) bg-black/5">
        <div className="text-center">
          <div className="text-2xl font-black text-ink-pink mono">{totalInstances}</div>
          <div className="text-[10px] uppercase tracking-wider text-(--text-secondary)">Total Instances</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-black text-(--text-primary) truncate">
            {mostPopularLevel?.title || '-'}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-(--text-secondary)">Most Popular</div>
        </div>
      </div>

      {/* Per-Level Stats */}
      <div className="divide-y divide-(--border-color)">
        {LEVELS.slice(0, 6).map((level, idx) => {
          const stat = stats.find((s) => s.levelId === level.id);
          const instances = stat?.totalInstances || 0;
          const percentage = totalInstances > 0 ? (instances / totalInstances) * 100 : 0;

          return (
            <div key={level.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-(--border-color) text-[10px] font-black mono">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-(--text-primary)">{level.title}</span>
                </div>
                <span className="mono text-xs text-(--text-secondary)">
                  {instances} instances
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-(--border-color) overflow-hidden">
                <div
                  className="h-full bg-ink-pink transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
