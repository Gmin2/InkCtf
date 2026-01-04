export const Difficulty = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
  EXTREME: 'Extreme'
} as const;

export type Difficulty = typeof Difficulty[keyof typeof Difficulty];

export interface Level {
  id: string;
  title: string;
  difficulty: Difficulty;
  description: string;
  objective: string;
  sourceCode: string;
  initialState: Record<string, unknown>;
  contractAddress: string;
  hint?: string;
  skills?: string[];
}

export interface UserProgress {
  completedLevels: string[];
  currentLevelId: string | null;
  achievements: string[];
}

export interface ConsoleMessage {
  type: 'info' | 'error' | 'success' | 'warning';
  text: string;
  timestamp: string;
}
