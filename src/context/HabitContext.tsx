import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { Habit, HistoryState, HabitCategory, LevelInfo, HabitFrequency, HabitType, TrackingType, Reflection } from '../types';
import { calculateStreak, calculateMaxStreak, getLevelInfo, isHabitCompletedOnDate, formatDate } from '../utils/analytics';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface HabitContextType {
  habits: Habit[];
  activeHabits: Habit[];
  history: HistoryState;
  xp: number;
  levelInfo: LevelInfo;
  totalCompletions: number;
  longestStreak: number;
  mostReliableHabit: string;
  addHabit: (
    name: string,
    description: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    type: HabitType,
    trackingType: TrackingType,
    icon: string,
    goalPercent?: number,
    targetValue?: number,
    unit?: string
  ) => void;
  editHabit: (
    id: string,
    name: string,
    description: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    type: HabitType,
    trackingType: TrackingType,
    icon: string,
    goalPercent?: number,
    targetValue?: number,
    unit?: string
  ) => void;
  deleteHabit: (id: string) => void;
  archiveHabit: (id: string) => void;
  unarchiveHabit: (id: string) => void;
  toggleHabitCompletion: (id: string, dateStr: string) => void;
  triggerLevelUp: boolean;
  setTriggerLevelUp: (trigger: boolean) => void;
  currentMonth: number;
  setCurrentMonth: (month: number) => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  updateHabitName: (id: string, name: string) => void;
  updateHabitGoal: (id: string, goal: number) => void;
  accountabilityMode: boolean;
  setAccountabilityMode: (enabled: boolean) => void;
  streakFreezes: number;
  buyStreakFreeze: () => void;
  useStreakFreeze: (habitId: string, dateStr: string) => void;
  logNumericValue: (habitId: string, dateStr: string, value: number) => void;
  
  smartSort: boolean;
  setSmartSort: (enabled: boolean) => void;
  zenMode: boolean;
  setZenMode: (enabled: boolean) => void;
  hoveredRowIndex: number | null;
  setHoveredRowIndex: (index: number | null) => void;

  // Reflections & Weekly Journal logs
  reflections: Reflection[];
  saveReflection: (weekOf: string, text: string) => void;

  // Supabase Auth and Sync States
  user: User | null;
  authLoading: boolean;
  isSyncing: boolean;
  mergeLocalDataToCloud: (user: User) => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

const todayDate = new Date();
const currentMonthStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-01`;

const defaultHabits: Habit[] = [
  { id: 'habit-1', name: 'Read 1 Hour', description: 'Self improvement reading', category: 'mind', frequency: 'daily', type: 'positive', trackingType: 'binary', createdAt: currentMonthStr, archived: false, icon: 'BookOpen', goalPercent: 81 },
  { id: 'habit-2', name: 'Stop Doomscrolling', description: 'No social media browsing', category: 'mind', frequency: 'daily', type: 'negative', trackingType: 'binary', createdAt: currentMonthStr, archived: false, icon: 'Smile', goalPercent: 77 },
  { id: 'habit-3', name: 'Workout', description: 'Strength and movement session', category: 'health', frequency: 'weekends', type: 'positive', trackingType: 'binary', createdAt: currentMonthStr, archived: false, icon: 'Dumbbell', goalPercent: 74 },
  { id: 'habit-4', name: 'Eat Clean', description: 'Whole foods and hydration', category: 'health', frequency: 'daily', type: 'positive', trackingType: 'binary', createdAt: currentMonthStr, archived: false, icon: 'Heart', goalPercent: 84 },
  { id: 'habit-5', name: 'Go Out in Nature', description: 'Walk in the park', category: 'health', frequency: 'daily', type: 'positive', trackingType: 'binary', createdAt: currentMonthStr, archived: false, icon: 'TreePine', goalPercent: 84 },
  { id: 'habit-6', name: 'Wake Up Early', description: 'Wake up by 6:00 AM', category: 'health', frequency: 'daily', type: 'positive', trackingType: 'binary', createdAt: currentMonthStr, archived: false, icon: 'Sun', goalPercent: 81 },
  { id: 'habit-7', name: 'Drink 3L Water', description: 'Daily hydration goal', category: 'health', frequency: 'daily', type: 'positive', trackingType: 'numeric', targetValue: 3, unit: 'L', createdAt: currentMonthStr, archived: false, icon: 'Activity', goalPercent: 84 },
  { id: 'habit-8', name: 'Learn Spanish', description: 'Practice on Duolingo', category: 'mind', frequency: 'daily', type: 'positive', trackingType: 'binary', createdAt: currentMonthStr, archived: false, icon: 'GraduationCap', goalPercent: 84 },
];

const generateMonthlyMockHistory = (habitsList: Habit[]): HistoryState => {
  const seed: HistoryState = {};
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= totalDays; day++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;
    seed[dateStr] = {};
  }

  const weekendDays: number[] = [];
  for (let day = 1; day <= totalDays; day++) {
    const dayOfWeek = new Date(year, month, day).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDays.push(day);
    }
  }

  habitsList.forEach(habit => {
    const id = habit.id;
    for (let day = 1; day <= totalDays; day++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;

      if (habit.frequency === 'weekends') {
        const isWeekend = weekendDays.includes(day);
        if (isWeekend) {
          const missed = day === weekendDays[2] || day === weekendDays[3];
          seed[dateStr][id] = !missed;
        } else {
          seed[dateStr][id] = false;
        }
        continue;
      }

      let checked = true;
      if (id === 'habit-1' && day % 5 === 0) checked = false;
      if (id === 'habit-2' && day % 4 !== 0) checked = false;
      if (id === 'habit-4' && day % 6 === 0) checked = false;
      if (id === 'habit-5' && day % 7 === 0) checked = false;
      if (id === 'habit-6' && day % 5 === 1) checked = false;
      if (id === 'habit-7' && day % 6 === 1) checked = false;
      if (id === 'habit-8' && day % 5 === 2) checked = false;

      if (habit.type === 'negative') {
        seed[dateStr][id] = checked;
      } else if (habit.trackingType === 'numeric') {
        seed[dateStr][id] = checked ? 3 : 1.5;
      } else {
        seed[dateStr][id] = checked;
      }
    }
  });

  return seed;
};

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [accountabilityMode, setAccountabilityMode] = useState<boolean>(() => {
    return localStorage.getItem('robust_accountability') === 'true';
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const local = localStorage.getItem('robust_habits_v3');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error(e);
      }
    }
    return defaultHabits;
  });

  const [history, setHistory] = useState<HistoryState>(() => {
    const local = localStorage.getItem('robust_history_v3');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error(e);
      }
    }
    return generateMonthlyMockHistory(habits);
  });

  const [reflections, setReflections] = useState<Reflection[]>(() => {
    const local = localStorage.getItem('robust_reflections');
    return local ? JSON.parse(local) : [];
  });

  const [streakFreezes, setStreakFreezes] = useState<number>(() => {
    const local = localStorage.getItem('robust_streak_freezes');
    return local ? parseInt(local, 10) : 2;
  });

  const [spentXp, setSpentXp] = useState<number>(() => {
    const local = localStorage.getItem('robust_spent_xp');
    return local ? parseInt(local, 10) : 0;
  });

  // smartSort, zenMode layout preferences
  const [smartSort, setSmartSort] = useState<boolean>(() => {
    return localStorage.getItem('robust_smart_sort') === 'true';
  });
  const [zenMode, setZenMode] = useState<boolean>(() => {
    return localStorage.getItem('robust_zen_mode') === 'true';
  });
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

  const [triggerLevelUp, setTriggerLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(1);

  // Supabase Sync States
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auth Changes Listener
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    supabase!.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch Cloud Sync Data
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    const fetchUserData = async () => {
      setIsSyncing(true);
      try {
        // 1. Profile settings
        const { data: profile } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setStreakFreezes(profile.streak_freezes);
          setSpentXp(profile.spent_xp);
          setAccountabilityMode(profile.accountability_mode);
        } else {
          // Insert initial profile if missing in database
          const metadata = user.user_metadata || {};
          await supabase!
            .from('profiles')
            .insert({
              id: user.id,
              streak_freezes: streakFreezes,
              spent_xp: spentXp,
              accountability_mode: accountabilityMode,
              full_name: metadata.full_name || null,
              age: metadata.age || null,
            });
        }

        // 2. Habits
        const { data: habitsData } = await supabase!
          .from('habits')
          .select('*')
          .eq('user_id', user.id);

        if (habitsData && habitsData.length > 0) {
          const formattedHabits: Habit[] = habitsData.map(h => ({
            id: h.id,
            name: h.name,
            description: h.description || '',
            category: h.category as HabitCategory,
            frequency: h.frequency as HabitFrequency,
            type: h.type as HabitType,
            trackingType: h.tracking_type as TrackingType,
            targetValue: h.target_value ? Number(h.target_value) : undefined,
            unit: h.unit || undefined,
            createdAt: h.created_at,
            archived: h.archived,
            icon: h.icon,
            goalPercent: h.goal_percent,
          }));
          setHabits(formattedHabits);
        }

        // 3. History logs
        const { data: historyData } = await supabase!
          .from('history')
          .select('*')
          .eq('user_id', user.id);

        if (historyData) {
          const formattedHistory: HistoryState = {};
          historyData.forEach(row => {
            const date = row.date_str;
            if (!formattedHistory[date]) {
              formattedHistory[date] = {};
            }
            formattedHistory[date][row.habit_id] = row.completion_value;
          });
          setHistory(formattedHistory);
        }

        // 4. Reflections
        const { data: reflectionsData } = await supabase!
          .from('reflections')
          .select('*')
          .eq('user_id', user.id);

        if (reflectionsData) {
          const formattedRef: Reflection[] = reflectionsData.map(r => ({
            weekOf: r.week_of,
            text: r.text,
            createdAt: r.created_at,
          }));
          setReflections(formattedRef);
        }
      } catch (err) {
        console.error('Error fetching Supabase user data:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Sync Guest Changes to LocalStorage
  useEffect(() => {
    if (!user) {
      localStorage.setItem('robust_habits_v3', JSON.stringify(habits));
    }
  }, [habits, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('robust_history_v3', JSON.stringify(history));
    }
  }, [history, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('robust_reflections', JSON.stringify(reflections));
    }
  }, [reflections, user]);

  useEffect(() => {
    localStorage.setItem('robust_accountability', String(accountabilityMode));
  }, [accountabilityMode]);

  useEffect(() => {
    localStorage.setItem('robust_streak_freezes', String(streakFreezes));
  }, [streakFreezes]);

  useEffect(() => {
    localStorage.setItem('robust_spent_xp', String(spentXp));
  }, [spentXp]);

  useEffect(() => {
    localStorage.setItem('robust_smart_sort', String(smartSort));
  }, [smartSort]);

  useEffect(() => {
    localStorage.setItem('robust_zen_mode', String(zenMode));
  }, [zenMode]);

  // Compute active habits list
  const activeHabits = useMemo(() => {
    const active = habits.filter(h => !h.archived);
    if (!smartSort) return active;

    const todayStr = formatDate(new Date());
    return [...active].sort((a, b) => {
      const aCompleted = isHabitCompletedOnDate(a, history[todayStr]?.[a.id]);
      const bCompleted = isHabitCompletedOnDate(b, history[todayStr]?.[b.id]);
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      return 0;
    });
  }, [habits, history, smartSort]);

  // Calculate completions
  let totalCompletions = 0;
  let positiveCompletions = 0;
  let negativeViolations = 0;

  for (const dateStr in history) {
    const dayData = history[dateStr];
    if (!dayData) continue;
    habits.forEach(habit => {
      if (habit.archived) return;
      if (habit.createdAt > dateStr) return;

      const val = dayData[habit.id];

      if (habit.type === 'negative') {
        if (val === true || (typeof val === 'number' && val > 0)) {
          negativeViolations++;
        } else {
          const todayStr = formatDate(new Date());
          if (dateStr <= todayStr && val !== 'frozen') {
            totalCompletions++;
          }
        }
      } else {
        if (habit.trackingType === 'numeric') {
          const target = habit.targetValue ?? 1;
          if (typeof val === 'number' && val >= target) {
            totalCompletions++;
            positiveCompletions++;
          }
        } else {
          if (val === true) {
            totalCompletions++;
            positiveCompletions++;
          }
        }
      }
    });
  }

  // XP Math
  const totalNegativeCompletions = totalCompletions - positiveCompletions;
  const earnedXp = Math.max(0, (positiveCompletions * 10) + (totalNegativeCompletions * 10) - (negativeViolations * 10));
  const xp = Math.max(0, earnedXp - spentXp);
  const levelInfo = getLevelInfo(earnedXp);

  useEffect(() => {
    if (levelInfo.level > prevLevel) {
      setTriggerLevelUp(true);
      setPrevLevel(levelInfo.level);
    } else if (levelInfo.level < prevLevel) {
      setPrevLevel(levelInfo.level);
    }
  }, [levelInfo.level, prevLevel]);

  // Longest streak
  let longestStreak = 0;
  habits.filter(h => !h.archived).forEach(h => {
    const streak = calculateStreak(history, h);
    if (streak > longestStreak) {
      longestStreak = streak;
    }
  });

  // Most reliable habit
  let mostReliableHabit = 'None';
  let highestMaxStreak = 0;
  habits.filter(h => !h.archived).forEach(h => {
    const maxStr = calculateMaxStreak(history, h);
    if (maxStr > highestMaxStreak) {
      highestMaxStreak = maxStr;
      mostReliableHabit = h.name;
    }
  });

  const addHabit = async (
    name: string,
    description: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    type: HabitType,
    trackingType: TrackingType,
    icon: string,
    goalPercent: number = 80,
    targetValue?: number,
    unit?: string
  ) => {
    const tempId = `habit-${Date.now()}`;
    const newHabit: Habit = {
      id: tempId,
      name,
      description,
      category,
      frequency,
      type,
      trackingType,
      targetValue,
      unit,
      createdAt: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
      archived: false,
      icon,
      goalPercent,
    };

    setHabits(prev => [...prev, newHabit]);

    if (user && isSupabaseConfigured) {
      try {
        const { data } = await supabase!
          .from('habits')
          .insert({
            user_id: user.id,
            name,
            description,
            category,
            frequency,
            type,
            tracking_type: trackingType,
            target_value: targetValue,
            unit,
            icon,
            goal_percent: goalPercent,
            created_at: newHabit.createdAt,
          })
          .select()
          .single();

        if (data) {
          setHabits(prev => prev.map(h => h.id === tempId ? { ...h, id: data.id } : h));
        }
      } catch (e) {
        console.error('Error inserting habit to cloud:', e);
      }
    }
  };

  const editHabit = async (
    id: string,
    name: string,
    description: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    type: HabitType,
    trackingType: TrackingType,
    icon: string,
    goalPercent: number = 80,
    targetValue?: number,
    unit?: string
  ) => {
    setHabits(prev =>
      prev.map(h => (h.id === id ? { ...h, name, description, category, frequency, type, trackingType, icon, goalPercent, targetValue, unit } : h))
    );

    if (user && isSupabaseConfigured) {
      try {
        await supabase!
          .from('habits')
          .update({
            name,
            description,
            category,
            frequency,
            type,
            tracking_type: trackingType,
            target_value: targetValue,
            unit,
            icon,
            goal_percent: goalPercent,
          })
          .eq('id', id);
      } catch (e) {
        console.error('Error updating habit in cloud:', e);
      }
    }
  };

  const deleteHabit = async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setHistory(prev => {
      const updated = { ...prev };
      for (const date in updated) {
        if (updated[date][id] !== undefined) {
          const day = { ...updated[date] };
          delete day[id];
          updated[date] = day;
        }
      }
      return updated;
    });

    if (user && isSupabaseConfigured) {
      try {
        await supabase!.from('habits').delete().eq('id', id);
      } catch (e) {
        console.error('Error deleting habit from cloud:', e);
      }
    }
  };

  const archiveHabit = async (id: string) => {
    setHabits(prev => prev.map(h => (h.id === id ? { ...h, archived: true } : h)));
    if (user && isSupabaseConfigured) {
      try {
        await supabase!.from('habits').update({ archived: true }).eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const unarchiveHabit = async (id: string) => {
    setHabits(prev => prev.map(h => (h.id === id ? { ...h, archived: false } : h)));
    if (user && isSupabaseConfigured) {
      try {
        await supabase!.from('habits').update({ archived: false }).eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const toggleHabitCompletion = async (id: string, dateStr: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    let newValue: any = false;

    setHistory(prev => {
      const day = prev[dateStr] ? { ...prev[dateStr] } : {};
      const currentValue = day[id];

      if (currentValue === 'frozen') {
        day[id] = false;
        newValue = false;
      } else if (habit.type === 'negative') {
        newValue = !currentValue;
        day[id] = newValue;
      } else if (habit.trackingType === 'numeric') {
        const target = habit.targetValue ?? 1;
        const isCurrentlyCompleted = typeof currentValue === 'number' ? currentValue >= target : currentValue === true;
        newValue = isCurrentlyCompleted ? 0 : target;
        day[id] = newValue;
      } else {
        newValue = !currentValue;
        day[id] = newValue;
      }

      return {
        ...prev,
        [dateStr]: day,
      };
    });

    if (user && isSupabaseConfigured) {
      try {
        await supabase!
          .from('history')
          .upsert({
            user_id: user.id,
            habit_id: id,
            date_str: dateStr,
            completion_value: newValue,
          }, { onConflict: 'user_id, habit_id, date_str' });
      } catch (e) {
        console.error('Error toggling completion in cloud:', e);
      }
    }
  };

  const logNumericValue = async (id: string, dateStr: string, value: number) => {
    setHistory(prev => {
      const day = prev[dateStr] ? { ...prev[dateStr] } : {};
      day[id] = value;
      return {
        ...prev,
        [dateStr]: day,
      };
    });

    if (user && isSupabaseConfigured) {
      try {
        await supabase!
          .from('history')
          .upsert({
            user_id: user.id,
            habit_id: id,
            date_str: dateStr,
            completion_value: value,
          }, { onConflict: 'user_id, habit_id, date_str' });
      } catch (e) {
        console.error('Error logging numeric value in cloud:', e);
      }
    }
  };

  const useStreakFreeze = async (habitId: string, dateStr: string) => {
    if (streakFreezes <= 0) return;
    setStreakFreezes(prev => prev - 1);
    setHistory(prev => {
      const day = prev[dateStr] ? { ...prev[dateStr] } : {};
      day[habitId] = 'frozen';
      return {
        ...prev,
        [dateStr]: day,
      };
    });

    if (user && isSupabaseConfigured) {
      try {
        await supabase!
          .from('profiles')
          .update({ streak_freezes: streakFreezes - 1 })
          .eq('id', user.id);

        await supabase!
          .from('history')
          .upsert({
            user_id: user.id,
            habit_id: habitId,
            date_str: dateStr,
            completion_value: 'frozen',
          }, { onConflict: 'user_id, habit_id, date_str' });
      } catch (e) {
        console.error('Error using freeze in cloud:', e);
      }
    }
  };

  const buyStreakFreeze = async () => {
    if (xp >= 150) {
      const newSpent = spentXp + 150;
      const newFreezes = streakFreezes + 1;
      setSpentXp(newSpent);
      setStreakFreezes(newFreezes);

      if (user && isSupabaseConfigured) {
        try {
          await supabase!
            .from('profiles')
            .update({
              spent_xp: newSpent,
              streak_freezes: newFreezes,
            })
            .eq('id', user.id);
        } catch (e) {
          console.error('Error buying freeze in cloud:', e);
        }
      }
    }
  };

  const saveReflection = async (weekOf: string, text: string) => {
    const newReflection: Reflection = {
      weekOf,
      text,
      createdAt: new Date().toISOString(),
    };
    setReflections(prev => {
      const filtered = prev.filter(r => r.weekOf !== weekOf);
      return [newReflection, ...filtered];
    });

    if (user && isSupabaseConfigured) {
      try {
        await supabase!
          .from('reflections')
          .upsert({
            user_id: user.id,
            week_of: weekOf,
            text,
          }, { onConflict: 'user_id, week_of' });
      } catch (e) {
        console.error('Error saving reflection in cloud:', e);
      }
    }
  };

  const setAccountabilityModeWithSync = async (enabled: boolean) => {
    setAccountabilityMode(enabled);
    if (user && isSupabaseConfigured) {
      try {
        await supabase!
          .from('profiles')
          .update({ accountability_mode: enabled })
          .eq('id', user.id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const updateHabitName = async (id: string, name: string) => {
    setHabits(prev =>
      prev.map(h => (h.id === id ? { ...h, name } : h))
    );
    if (user && isSupabaseConfigured) {
      try {
        await supabase!.from('habits').update({ name }).eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const updateHabitGoal = async (id: string, goal: number) => {
    setHabits(prev =>
      prev.map(h => (h.id === id ? { ...h, goalPercent: goal } : h))
    );
    if (user && isSupabaseConfigured) {
      try {
        await supabase!.from('habits').update({ goal_percent: goal }).eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const mergeLocalDataToCloud = async (loggedInUser: User) => {
    if (!isSupabaseConfigured) return;
    setIsSyncing(true);

    try {
      const metadata = loggedInUser.user_metadata || {};
      const fullName = metadata.full_name || null;
      const age = metadata.age || null;

      // 1. Sync Profile Settings
      await supabase!
        .from('profiles')
        .upsert({
          id: loggedInUser.id,
          streak_freezes: streakFreezes,
          spent_xp: spentXp,
          accountability_mode: accountabilityMode,
          full_name: fullName,
          age: age,
        });

      // 2. Fetch existing habits to prevent duplicates
      const { data: existingHabits } = await supabase!
        .from('habits')
        .select('name')
        .eq('user_id', loggedInUser.id);

      const cloudHabitNames = (existingHabits || []).map(h => h.name.toLowerCase());

      // Loop local habits and insert cloud records
      for (const h of habits) {
        if (cloudHabitNames.includes(h.name.toLowerCase())) continue;

        const { data: insertedHabit } = await supabase!
          .from('habits')
          .insert({
            user_id: loggedInUser.id,
            name: h.name,
            description: h.description,
            category: h.category,
            frequency: h.frequency,
            type: h.type,
            tracking_type: h.trackingType,
            target_value: h.targetValue,
            unit: h.unit,
            icon: h.icon,
            goal_percent: h.goalPercent,
            created_at: h.createdAt,
          })
          .select()
          .single();

        if (insertedHabit) {
          // Collect and insert history
          const localHistoryForHabit: { dateStr: string; val: any }[] = [];
          for (const dateStr in history) {
            if (history[dateStr]?.[h.id] !== undefined) {
              localHistoryForHabit.push({ dateStr, val: history[dateStr][h.id] });
            }
          }

          if (localHistoryForHabit.length > 0) {
            const rows = localHistoryForHabit.map(item => ({
              user_id: loggedInUser.id,
              habit_id: insertedHabit.id,
              date_str: item.dateStr,
              completion_value: item.val,
            }));

            await supabase!.from('history').upsert(rows);
          }
        }
      }

      // 3. Migrate reflections
      if (reflections.length > 0) {
        const rows = reflections.map(r => ({
          user_id: loggedInUser.id,
          week_of: r.weekOf,
          text: r.text,
        }));
        await supabase!.from('reflections').upsert(rows);
      }
    } catch (err) {
      console.error('Migration failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        activeHabits,
        history,
        xp,
        levelInfo,
        totalCompletions,
        longestStreak,
        mostReliableHabit,
        addHabit,
        editHabit,
        deleteHabit,
        archiveHabit,
        unarchiveHabit,
        toggleHabitCompletion,
        triggerLevelUp,
        setTriggerLevelUp,
        currentMonth,
        setCurrentMonth,
        currentYear,
        setCurrentYear,
        updateHabitName,
        updateHabitGoal,
        accountabilityMode,
        setAccountabilityMode: setAccountabilityModeWithSync,
        streakFreezes,
        buyStreakFreeze,
        useStreakFreeze,
        logNumericValue,
        
        smartSort,
        setSmartSort,
        zenMode,
        setZenMode,
        hoveredRowIndex,
        setHoveredRowIndex,

        reflections,
        saveReflection,

        user,
        authLoading,
        isSyncing,
        mergeLocalDataToCloud,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};
