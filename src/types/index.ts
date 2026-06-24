export type HabitCategory = 'health' | 'work' | 'mind' | 'finance' | 'custom';

export type HabitFrequency = 'daily' | 'weekly' | '3x-week' | 'weekends' | 'monthly';

export type HabitType = 'positive' | 'negative';

export type TrackingType = 'binary' | 'numeric';

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  type: HabitType;
  trackingType: TrackingType;
  targetValue?: number; // target metric (e.g. 3)
  unit?: string; // unit of measure (e.g. "L", "pages")
  createdAt: string; // ISO date string YYYY-MM-DD
  archived: boolean;
  icon: string; // Name of lucide icon
  goalPercent: number; // target completion percentage (e.g. 80)
}

export type CompletionValue = boolean | number | 'frozen';

export interface DailyCompletion {
  [habitId: string]: CompletionValue;
}

export interface HistoryState {
  [dateStr: string]: DailyCompletion; // YYYY-MM-DD -> { habitId: CompletionValue }
}

export interface StreakMetrics {
  currentStreak: number;
  maxStreak: number;
}

export interface LevelInfo {
  level: number;
  title: string;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
  totalXp: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string;
}

export interface Reflection {
  weekOf: string;
  text: string;
  createdAt: string;
}
