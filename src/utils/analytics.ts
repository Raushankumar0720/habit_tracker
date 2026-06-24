import type { Habit, HistoryState, LevelInfo, CompletionValue } from '../types';

export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getDaysOfWeek(baseDate: Date = new Date()): { name: string; dateStr: string; label: string }[] {
  const days: { name: string; dateStr: string; label: string }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const dateStr = formatDate(d);
    days.push({
      name: dayNames[d.getDay()],
      dateStr,
      label: String(d.getDate()),
    });
  }
  return days;
}

export function isHabitCompletedOnDate(habit: Habit, val: CompletionValue | undefined): boolean {
  if (val === 'frozen') return false; // frozen acts as a bridge, not a completion
  if (val === undefined) {
    // For negative habits, unchecked is avoided (success)
    return habit.type === 'negative';
  }
  if (habit.type === 'negative') {
    // Negative habit: true means did the vice (failed), false means avoided (success)
    return val === false || val === 0;
  }
  if (habit.trackingType === 'numeric') {
    const target = habit.targetValue ?? 1;
    return typeof val === 'number' && val >= target;
  }
  return val === true;
}

function isDateScheduled(habit: Habit, date: Date): boolean {
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekends') {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }
  // For weekly, 3x-week, monthly: they are scheduled in periods
  return true;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day); // go back to Sunday
  d.setHours(0, 0, 0, 0);
  return d;
}

function calculateDailyOrWeekendStreak(history: HistoryState, habit: Habit, isMax: boolean = false): number {
  const today = new Date();
  
  if (!isMax) {
    let date = new Date(today);
    let streak = 0;
    
    // Check up to 365 days
    for (let i = 0; i < 365; i++) {
      const dateStr = formatDate(date);
      
      // Before creation, stop
      if (dateStr < habit.createdAt) {
        break;
      }
      
      const val = history[dateStr]?.[habit.id];
      const isScheduled = isDateScheduled(habit, date);
      
      if (!isScheduled) {
        date.setDate(date.getDate() - 1);
        continue;
      }
      
      if (val === 'frozen') {
        date.setDate(date.getDate() - 1);
        continue;
      }
      
      const isCompleted = isHabitCompletedOnDate(habit, val);
      
      if (isCompleted) {
        streak++;
      } else {
        // If today is not completed, we check if yesterday is completed
        if (i === 0) {
          // Keep loop going to check yesterday
        } else if (i === 1 && streak === 0) {
          break;
        } else {
          break;
        }
      }
      
      date.setDate(date.getDate() - 1);
    }
    return streak;
  } else {
    // Max streak: traverse forward from habit creation date to today
    const startDate = parseLocalDate(habit.createdAt);
    const endDate = new Date(today);
    let maxStreak = 0;
    let currentStreak = 0;
    
    const date = new Date(startDate);
    while (date <= endDate) {
      const dateStr = formatDate(date);
      const val = history[dateStr]?.[habit.id];
      const isScheduled = isDateScheduled(habit, date);
      
      if (isScheduled) {
        if (val === 'frozen') {
          // Skip frozen day: does not increment, but does not break streak
        } else {
          const isCompleted = isHabitCompletedOnDate(habit, val);
          if (isCompleted) {
            currentStreak++;
            if (currentStreak > maxStreak) {
              maxStreak = currentStreak;
            }
          } else {
            currentStreak = 0;
          }
        }
      }
      date.setDate(date.getDate() + 1);
    }
    return maxStreak;
  }
}

function calculateWeeklyStreak(history: HistoryState, habit: Habit, targetPerWeek: number, isMax: boolean = false): number {
  const today = new Date();
  const startOfWeek = getWeekStart(today);
  const startLimit = getWeekStart(parseLocalDate(habit.createdAt));
  
  const weekCompletions: Record<string, number> = {};
  const weekHasFreeze: Record<string, boolean> = {};
  
  for (const dateStr in history) {
    if (dateStr < habit.createdAt) continue;
    const d = parseLocalDate(dateStr);
    const wStart = formatDate(getWeekStart(d));
    
    const val = history[dateStr]?.[habit.id];
    if (val === 'frozen') {
      weekHasFreeze[wStart] = true;
    } else if (isHabitCompletedOnDate(habit, val)) {
      weekCompletions[wStart] = (weekCompletions[wStart] || 0) + 1;
    }
  }
  
  if (!isMax) {
    let streak = 0;
    const checkWeek = new Date(startOfWeek);
    
    for (let i = 0; i < 52; i++) {
      const wStartStr = formatDate(checkWeek);
      if (wStartStr < formatDate(startLimit)) break;
      
      const completions = weekCompletions[wStartStr] || 0;
      const hasFreeze = weekHasFreeze[wStartStr];
      const isCompleted = completions >= targetPerWeek;
      
      if (isCompleted) {
        streak++;
      } else if (hasFreeze) {
        // pass through
      } else {
        if (i === 0) {
          // let it check last week
        } else if (i === 1 && streak === 0) {
          break;
        } else {
          break;
        }
      }
      checkWeek.setDate(checkWeek.getDate() - 7);
    }
    return streak;
  } else {
    let maxStreak = 0;
    let currentStreak = 0;
    const checkWeek = new Date(startLimit);
    
    while (checkWeek <= startOfWeek) {
      const wStartStr = formatDate(checkWeek);
      const completions = weekCompletions[wStartStr] || 0;
      const hasFreeze = weekHasFreeze[wStartStr];
      const isCompleted = completions >= targetPerWeek;
      
      if (isCompleted) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else if (hasFreeze) {
        // skip
      } else {
        currentStreak = 0;
      }
      checkWeek.setDate(checkWeek.getDate() + 7);
    }
    return maxStreak;
  }
}

function calculateMonthlyStreak(history: HistoryState, habit: Habit, isMax: boolean = false): number {
  const today = new Date();
  const startLimit = parseLocalDate(habit.createdAt);
  const startMonthStr = `${startLimit.getFullYear()}-${String(startLimit.getMonth() + 1).padStart(2, '0')}`;
  
  const monthCompletions: Record<string, number> = {};
  const monthHasFreeze: Record<string, boolean> = {};
  
  for (const dateStr in history) {
    if (dateStr < habit.createdAt) continue;
    const [y, m] = dateStr.split('-');
    const mKey = `${y}-${m}`;
    
    const val = history[dateStr]?.[habit.id];
    if (val === 'frozen') {
      monthHasFreeze[mKey] = true;
    } else if (isHabitCompletedOnDate(habit, val)) {
      monthCompletions[mKey] = (monthCompletions[mKey] || 0) + 1;
    }
  }
  
  if (!isMax) {
    let streak = 0;
    const checkDate = new Date(today.getFullYear(), today.getMonth(), 1);
    
    for (let i = 0; i < 12; i++) {
      const mKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
      if (mKey < startMonthStr) break;
      
      const completions = monthCompletions[mKey] || 0;
      const hasFreeze = monthHasFreeze[mKey];
      const isCompleted = completions >= 1;
      
      if (isCompleted) {
        streak++;
      } else if (hasFreeze) {
        // pass through
      } else {
        if (i === 0) {
          // let it check last month
        } else if (i === 1 && streak === 0) {
          break;
        } else {
          break;
        }
      }
      checkDate.setMonth(checkDate.getMonth() - 1);
    }
    return streak;
  } else {
    let maxStreak = 0;
    let currentStreak = 0;
    const checkDate = new Date(startLimit.getFullYear(), startLimit.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth(), 1);
    
    while (checkDate <= endDate) {
      const mKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
      const completions = monthCompletions[mKey] || 0;
      const hasFreeze = monthHasFreeze[mKey];
      const isCompleted = completions >= 1;
      
      if (isCompleted) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else if (hasFreeze) {
        // skip
      } else {
        currentStreak = 0;
      }
      checkDate.setMonth(checkDate.getMonth() + 1);
    }
    return maxStreak;
  }
}

export function calculateStreak(history: HistoryState, habit: Habit): number {
  if (habit.frequency === 'daily' || habit.frequency === 'weekends') {
    return calculateDailyOrWeekendStreak(history, habit, false);
  } else if (habit.frequency === 'weekly') {
    return calculateWeeklyStreak(history, habit, 1, false);
  } else if (habit.frequency === '3x-week') {
    return calculateWeeklyStreak(history, habit, 3, false);
  } else if (habit.frequency === 'monthly') {
    return calculateMonthlyStreak(history, habit, false);
  }
  return 0;
}

export function calculateMaxStreak(history: HistoryState, habit: Habit): number {
  if (habit.frequency === 'daily' || habit.frequency === 'weekends') {
    return calculateDailyOrWeekendStreak(history, habit, true);
  } else if (habit.frequency === 'weekly') {
    return calculateWeeklyStreak(history, habit, 1, true);
  } else if (habit.frequency === '3x-week') {
    return calculateWeeklyStreak(history, habit, 3, true);
  } else if (habit.frequency === 'monthly') {
    return calculateMonthlyStreak(history, habit, true);
  }
  return 0;
}

const LEVELS = [
  { max: 100, title: "Habit Initiate" },
  { max: 300, title: "Routine Builder" },
  { max: 600, title: "Discipline Apprentice" },
  { max: 1000, title: "Consistency Sage" },
  { max: 1500, title: "Habit Warrior" },
  { max: 2100, title: "Willpower Master" },
  { max: 2800, title: "Mindfulness Guru" },
  { max: 3600, title: "Behavior Architect" },
  { max: 4500, title: "Consistency Legend" },
];

export function getLevelInfo(xp: number): LevelInfo {
  let level = 1;
  let title = "Habit Initiate";
  let xpInCurrentLevel = xp;
  let xpNeededForNextLevel = 100;
  let prevLevelMax = 0;

  for (let i = 0; i < LEVELS.length; i++) {
    if (xp > LEVELS[i].max) {
      level = i + 2;
      prevLevelMax = LEVELS[i].max;
    } else {
      break;
    }
  }

  if (level > LEVELS.length + 1) {
    title = "Transcendent Master";
    const extraLevels = level - 10;
    prevLevelMax = 4500 + (extraLevels - 1) * 1000;
    xpNeededForNextLevel = 1000;
    xpInCurrentLevel = xp - prevLevelMax;
  } else {
    title = level - 1 < LEVELS.length ? LEVELS[level - 1].title : "Transcendent Master";
    
    if (level === 1) {
      xpInCurrentLevel = xp;
      xpNeededForNextLevel = 100;
    } else {
      xpInCurrentLevel = xp - prevLevelMax;
      const currentLevelMax = LEVELS[level - 2].max;
      const nextLevelMax = level - 1 < LEVELS.length ? LEVELS[level - 1].max : (LEVELS[LEVELS.length - 1].max + 1000);
      xpNeededForNextLevel = nextLevelMax - currentLevelMax;
    }
  }

  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));

  return {
    level,
    title,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercent,
    totalXp: xp,
  };
}

export function getDailyCompletionRate(history: HistoryState, activeHabits: Habit[], dateStr: string): number {
  const habitsOnDay = activeHabits.filter(h => h.createdAt <= dateStr);
  if (habitsOnDay.length === 0) return 0;
  const dayCompletion = history[dateStr];
  if (!dayCompletion) return 0;
  let completed = 0;
  
  habitsOnDay.forEach(habit => {
    if (isHabitCompletedOnDate(habit, dayCompletion[habit.id])) {
      completed++;
    }
  });
  return Math.round((completed / habitsOnDay.length) * 100);
}

export interface HeatmapDay {
  date: string;
  count: number;
  total: number;
  percentage: number;
}

export function generateHeatmapData(history: HistoryState, habits: Habit[]): HeatmapDay[] {
  const heatmap: HeatmapDay[] = [];
  const today = new Date();
  const daysToShow = 371; // 53 weeks * 7 days
  
  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);
    
    const activeHabitsOnDay = habits.filter(h => h.createdAt <= dateStr && !h.archived);
    
    let completedCount = 0;
    const dayHistory = history[dateStr];
    if (dayHistory) {
      activeHabitsOnDay.forEach(habit => {
        if (isHabitCompletedOnDate(habit, dayHistory[habit.id])) {
          completedCount++;
        }
      });
    }
    
    const percentage = activeHabitsOnDay.length > 0 
      ? Math.round((completedCount / activeHabitsOnDay.length) * 100)
      : 0;
      
    heatmap.push({
      date: dateStr,
      count: completedCount,
      total: activeHabitsOnDay.length,
      percentage
    });
  }
  return heatmap;
}

export interface WeekendStats {
  weekendCompletionRate: number;
  weekdayCompletionRate: number;
  isWeekendSlacker: boolean;
}

export function calculateWeekendStats(history: HistoryState, habits: Habit[]): WeekendStats {
  let weekendCompletions = 0;
  let weekendOpportunities = 0;
  let weekdayCompletions = 0;
  let weekdayOpportunities = 0;

  const activeHabits = habits.filter(h => !h.archived);
  if (activeHabits.length === 0) {
    return { weekendCompletionRate: 0, weekdayCompletionRate: 0, isWeekendSlacker: false };
  }

  const today = new Date();
  // Traverse last 30 days
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);
    
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const dayData = history[dateStr];

    activeHabits.forEach(habit => {
      if (habit.createdAt > dateStr) return;
      if (!isDateScheduled(habit, d)) return;

      if (isWeekend) {
        weekendOpportunities++;
        if (dayData && isHabitCompletedOnDate(habit, dayData[habit.id])) {
          weekendCompletions++;
        }
      } else {
        weekdayOpportunities++;
        if (dayData && isHabitCompletedOnDate(habit, dayData[habit.id])) {
          weekdayCompletions++;
        }
      }
    });
  }

  const weekendCompletionRate = weekendOpportunities > 0 
    ? Math.round((weekendCompletions / weekendOpportunities) * 100) 
    : 0;
  const weekdayCompletionRate = weekdayOpportunities > 0 
    ? Math.round((weekdayCompletions / weekdayOpportunities) * 100) 
    : 0;

  const isWeekendSlacker = weekdayCompletionRate - weekendCompletionRate >= 15;

  return {
    weekendCompletionRate,
    weekdayCompletionRate,
    isWeekendSlacker
  };
}
