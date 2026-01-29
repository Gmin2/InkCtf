import type { LevelId } from '../lib/chain-config';

export interface PlayerLevelStats {
  levelId: LevelId;
  successCount: number;
  failureCount: number;
  instanceCount: number;
}

export interface GlobalLevelStats {
  levelId: LevelId;
  totalInstances: number;
}

export interface StatisticsData {
  playerStats: PlayerLevelStats[];
  globalStats: GlobalLevelStats[];
}
