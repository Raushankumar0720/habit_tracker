import { useState, useMemo } from 'react';
import { HabitProvider, useHabits } from './context/HabitContext';
import { CustomAreaChart } from './components/CustomAreaChart';
import { WeeklyStats } from './components/WeeklyStats';
import { GridSheet } from './components/GridSheet';
import { LevelUpModal } from './components/LevelUpModal';
import { AchievementWidget } from './components/AchievementWidget';
import { WeeklyJournalModal } from './components/WeeklyJournalModal';
import { HabitFormModal } from './components/HabitFormModal';
import { AuthModal } from './components/AuthModal';
import { calculateStreak, calculateMaxStreak, isHabitCompletedOnDate, calculateWeekendStats } from './utils/analytics';
import { supabase, isSupabaseConfigured } from './utils/supabaseClient';
import type { Habit } from './types';
import { ChevronDown, Lock, Unlock, Settings, Eye, Sliders, BookOpen, Snowflake, Trophy, Flame, Cloud, CloudOff, CloudLightning, User, Skull } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

function DashboardContent() {
  const {
    activeHabits,
    history,
    updateHabitGoal,
    currentMonth,
    setCurrentMonth,
    currentYear,
    setCurrentYear,
    accountabilityMode,
    setAccountabilityMode,
    xp,
    levelInfo,
    streakFreezes,
    buyStreakFreeze,
    smartSort,
    setSmartSort,
    zenMode,
    setZenMode,
    
    // Supabase States
    user,
    authLoading,
    isSyncing,
  } = useHabits();

  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);

  const totalDays = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // Calculate monthly stats for the active month
  const { totalMonthCompletions, totalMonthPossible, monthlyCompletionRate } = useMemo(() => {
    let completed = 0;
    let possible = 0;
    const mm = String(currentMonth + 1).padStart(2, '0');

    for (let day = 1; day <= totalDays; day++) {
      const dd = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${mm}-${dd}`;
      
      const activeOnDay = activeHabits.filter(h => h.createdAt <= dateStr);
      possible += activeOnDay.length;

      const dayHistory = history[dateStr];
      if (dayHistory) {
        activeOnDay.forEach(h => {
          if (isHabitCompletedOnDate(h, dayHistory[h.id])) {
            completed++;
          }
        });
      }
    }

    const rate = possible > 0 ? Math.round((completed / possible) * 10000) / 100 : 0;
    return {
      totalMonthCompletions: completed,
      totalMonthPossible: possible,
      monthlyCompletionRate: rate,
    };
  }, [history, activeHabits, currentMonth, currentYear, totalDays]);

  // Calculate stats for each habit in the active month
  const habitsMonthStats = useMemo(() => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    
    return activeHabits.map((habit) => {
      let completions = 0;
      let possibleDays = 0;

      for (let day = 1; day <= totalDays; day++) {
        const dd = String(day).padStart(2, '0');
        const dateStr = `${currentYear}-${mm}-${dd}`;
        
        if (dateStr >= habit.createdAt) {
          possibleDays++;
          if (isHabitCompletedOnDate(habit, history[dateStr]?.[habit.id])) {
            completions++;
          }
        }
      }

      const percent = possibleDays > 0 ? Math.round((completions / possibleDays) * 100) : 0;
      const maxStreak = calculateMaxStreak(history, habit);

      return {
        habit,
        completions,
        possibleDays,
        percent,
        maxStreak,
      };
    });
  }, [history, activeHabits, currentMonth, currentYear, totalDays]);

  const top10Habits = useMemo(() => {
    return [...habitsMonthStats]
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 10);
  }, [habitsMonthStats]);

  const weekendStats = useMemo(() => {
    return calculateWeekendStats(history, activeHabits);
  }, [history, activeHabits]);

  const coachInsights = useMemo(() => {
    if (activeHabits.length === 0) {
      return {
        appreciation: "Welcome to ROBUST! Add your first habit in the grid to begin your journey.",
        improvement: "No habits tracked yet. Start small with 1 or 2 daily routines.",
        blunder: "No alerts. Keep your dashboard clean and focused!"
      };
    }

    let bestHabit: Habit | null = null;
    let bestStreak = 0;
    let highestPercent = -1;

    let weakHabit: Habit | null = null;
    let lowestPercent = 101;

    let recentBlunder: string | null = null;

    habitsMonthStats.forEach(stat => {
      const currentStreak = calculateStreak(history, stat.habit);
      
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
        bestHabit = stat.habit;
      } else if (bestStreak === 0 && stat.percent > highestPercent) {
        highestPercent = stat.percent;
        bestHabit = stat.habit;
      }

      if (stat.possibleDays >= 3) {
        if (stat.percent < lowestPercent) {
          lowestPercent = stat.percent;
          weakHabit = stat.habit;
        }
      }
    });

    if (!bestHabit && activeHabits.length > 0) {
      bestHabit = activeHabits[0];
      highestPercent = habitsMonthStats[0]?.percent || 0;
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const formatDateStr = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };
    
    const todayStr = formatDateStr(today);
    const yesterdayStr = formatDateStr(yesterday);

    const negativeHabits = activeHabits.filter(h => h.type === 'negative');
    let violatedHabitName: string | null = null;
    for (const h of negativeHabits) {
      const valToday = history[todayStr]?.[h.id];
      const valYesterday = history[yesterdayStr]?.[h.id];
      if (valToday === true || (typeof valToday === 'number' && valToday > 0)) {
        violatedHabitName = h.name;
        break;
      }
      if (valYesterday === true || (typeof valYesterday === 'number' && valYesterday > 0)) {
        violatedHabitName = h.name;
        break;
      }
    }

    if (violatedHabitName) {
      recentBlunder = `Slip-up logged in "${violatedHabitName}" recently. Forgive yourself, reset your mindset, and win today!`;
    } else {
      if (streakFreezes === 0) {
        recentBlunder = "You have 0 Streak Freezes remaining! If you miss a day, your streak will break. Earn 150 XP to buy one now.";
      } else {
        let missedHabitName: string | null = null;
        for (const stat of habitsMonthStats) {
          if (stat.habit.type === 'positive' && stat.habit.createdAt <= yesterdayStr) {
            const valYesterday = history[yesterdayStr]?.[stat.habit.id];
            const completedYesterday = isHabitCompletedOnDate(stat.habit, valYesterday);
            const currentStreak = calculateStreak(history, stat.habit);
            if (!completedYesterday && valYesterday !== 'frozen' && currentStreak === 0) {
              missedHabitName = stat.habit.name;
              break;
            }
          }
        }
        if (missedHabitName) {
          recentBlunder = `Streak reset on "${missedHabitName}" due to a missed day. Remember, consistency is a long game. Try again!`;
        } else {
          recentBlunder = "No critical blunders detected! Your streaks are secure and protected.";
        }
      }
    }

    const appreciation = bestHabit
      ? bestStreak > 0
        ? `Outstanding! You are on a ${bestStreak}-day streak for "${bestHabit.name}". You are building incredible momentum!`
        : `Great work! Your completion rate for "${bestHabit.name}" is at ${highestPercent}%. Keep showing up!`
      : "Keep taking action! Every checkmark builds your level and XP.";

    const improvement = weakHabit && lowestPercent < 60
      ? `Focus Area: "${weakHabit.name}" is currently at ${lowestPercent}% completion. Try setting a specific daily trigger or doing it first thing in the morning.`
      : "Excellent balance! All your active habits are performing at a high level of consistency.";

    return {
      appreciation,
      improvement,
      blunder: recentBlunder
    };
  }, [activeHabits, history, habitsMonthStats, streakFreezes]);

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await supabase!.auth.signOut();
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-800 flex flex-col items-center">
      <LevelUpModal />

      <div className="w-full max-w-[1440px] p-4 md:p-6 flex flex-col gap-5">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* COLUMN 1: LEFT SIDEBAR */}
          <div className="md:col-span-3 flex flex-col gap-5">
            
            {/* User Profile & Database Sync Card */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Cloud Synchronization</span>
                {isSyncing ? (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                ) : user ? (
                  <span className="h-2 w-2 rounded-full bg-emerald-500" title="Synchronized" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-amber-400" title="Guest Mode" />
                )}
              </div>

              {authLoading ? (
                <div className="py-2 text-center text-xs text-zinc-400 font-medium">Checking credentials...</div>
              ) : user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-full bg-zinc-100 text-zinc-700">
                      <User size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-zinc-900 truncate">
                        {user.user_metadata?.full_name || user.email}
                      </p>
                      {user.user_metadata?.full_name && (
                        <p className="text-[9.5px] text-zinc-500 truncate">{user.email}</p>
                      )}
                      <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                        <Cloud size={10} /> Cloud Sync Active
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full py-1.5 border border-zinc-200 hover:border-zinc-350 text-[10px] font-bold text-zinc-650 rounded-lg bg-white shadow-sm transition-colors cursor-pointer"
                  >
                    Sign Out Account
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-full bg-amber-50 text-amber-500 border border-amber-100">
                      <CloudOff size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900">Guest Profile Mode</p>
                      <p className="text-[9px] text-amber-600 font-bold flex items-center gap-1 mt-0.5">
                        <CloudLightning size={10} /> Saved locally
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAuthOpen(true)}
                    className="w-full py-2 bg-zinc-950 hover:bg-zinc-850 text-white rounded-lg text-[10px] font-bold shadow-md transition-colors cursor-pointer"
                  >
                    Sign In & Enable Cloud Sync
                  </button>
                </div>
              )}
            </div>

            {/* Title / Date Pickers */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-4">
              <div>
                <h1 className="text-4xl font-normal font-script text-slate-800 leading-tight">
                  {MONTH_NAMES[currentMonth]}
                </h1>
                <p className="text-[10px] tracking-widest text-slate-400 font-bold uppercase mt-0.5">
                  Habit Tracker
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Month</label>
                  <div className="relative">
                    <select
                      value={currentMonth}
                      onChange={(e) => setCurrentMonth(Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-1.5 pl-2.5 pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:border-zinc-950 appearance-none cursor-pointer"
                    >
                      {MONTH_NAMES.map((name, idx) => (
                        <option key={idx} value={idx}>{name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Year</label>
                  <div className="relative">
                    <select
                      value={currentYear}
                      onChange={(e) => setCurrentYear(Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-1.5 pl-2.5 pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:border-zinc-950 appearance-none cursor-pointer"
                    >
                      {YEARS.map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Level & XP Gauge Card */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-violet-500 font-bold">XP Level Info</span>
                  <h2 className="text-sm font-bold text-zinc-900 mt-0.5">
                    Level {levelInfo.level} — <span className="text-violet-600 font-bold">{levelInfo.title}</span>
                  </h2>
                </div>
                <div className="bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-violet-100 flex items-center gap-1 shadow-sm">
                  <Trophy size={10} className="fill-current text-violet-500" /> Rank
                </div>
              </div>
              
              <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                <div 
                  className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 font-mono">
                <span>{levelInfo.xpInCurrentLevel} / {levelInfo.xpNeededForNextLevel} XP</span>
                <span>Total XP: {levelInfo.totalXp}</span>
              </div>
            </div>

            {/* Streak Freeze Shop Card */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-500 border border-blue-100">
                    <Snowflake size={14} />
                  </div>
                  <span className="text-xs font-bold text-zinc-800">Streak Freeze Shop</span>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 font-mono bg-zinc-50 border border-zinc-150 px-2 py-0.5 rounded-lg">
                  {streakFreezes} Owned
                </span>
              </div>
              <p className="text-[9.5px] leading-relaxed text-zinc-400 font-medium font-sans">
                Preserve streaks on missed days. Cost: 150 XP. Available Balance: <strong className="text-violet-600">{xp} XP</strong>.
              </p>
              
              <button
                type="button"
                onClick={buyStreakFreeze}
                disabled={xp < 150}
                className={`w-full py-2 rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer
                  ${xp >= 150 
                    ? 'bg-zinc-950 hover:bg-zinc-850 text-white shadow-md' 
                    : 'bg-zinc-100 border border-zinc-205 text-zinc-400 cursor-not-allowed'}`}
              >
                Buy Streak Freeze (-150 XP)
              </button>
            </div>

            {/* Weekly Reflection Card */}
            <div className="bg-[#fdfaf2] p-5 rounded-2xl border border-[#ebdcb9] shadow-sm flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-250/30">
                    <BookOpen size={14} />
                  </div>
                  <span className="text-xs font-bold text-[#786940]">Weekly Journal</span>
                </div>
                {new Date().getDay() === 0 && (
                  <span className="animate-pulse bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                    REFLECT TODAY
                  </span>
                )}
              </div>
              <p className="text-[9.5px] leading-relaxed text-[#84754e] font-medium font-sans">
                Write down weekly reflections, wins, and optimizations to maintain absolute consistency.
              </p>
              <button
                type="button"
                onClick={() => setIsJournalOpen(true)}
                className="w-full py-2 bg-[#786940] hover:bg-[#685930] text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
              >
                Open Reflection Journal
              </button>
            </div>

            {/* Dashboard Control Panel */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-3.5">
              <div className="flex items-center gap-1.5">
                <Settings size={14} className="text-zinc-555" />
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Dashboard Controls</span>
              </div>

              <div className="flex flex-col gap-3">
                {/* Accountability Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                      {accountabilityMode ? <Lock size={12} className="text-red-500" /> : <Unlock size={12} className="text-zinc-400" />}
                      Accountability Mode
                    </span>
                    <span className="text-[9px] text-zinc-400">Lock past days editing</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAccountabilityMode(!accountabilityMode)}
                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 focus:outline-none 
                      ${accountabilityMode ? 'bg-zinc-950' : 'bg-zinc-200'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200
                        ${accountabilityMode ? 'translate-x-3.5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>

                {/* Smart Sort */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                      <Sliders size={12} className="text-zinc-400" />
                      Smart Sort
                    </span>
                    <span className="text-[9px] text-zinc-400">Completions shift to bottom</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSmartSort(!smartSort)}
                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 focus:outline-none 
                      ${smartSort ? 'bg-zinc-950' : 'bg-zinc-200'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200
                        ${smartSort ? 'translate-x-3.5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>

                {/* Zen Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                      <Eye size={12} className="text-zinc-400" />
                      Zen Mode
                    </span>
                    <span className="text-[9px] text-zinc-400">Highlight hovered row</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setZenMode(!zenMode)}
                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 focus:outline-none 
                      ${zenMode ? 'bg-zinc-950' : 'bg-zinc-200'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200
                        ${zenMode ? 'translate-x-3.5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Coach Feedback & AI Insights Card */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#ccfbf1] text-teal-600 border border-[#99f6e4]/30">
                  <Trophy size={14} className="text-teal-600" />
                </div>
                <span className="text-xs font-black tracking-wider text-teal-800 uppercase">
                  Habit Coach Insights
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {/* 1. Appreciation Block */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[10px] uppercase tracking-wider">
                    <Flame size={12} className="fill-current text-emerald-500" /> Appreciation
                  </div>
                  <p className="text-[10px] text-emerald-900 leading-normal font-semibold font-sans">
                    {coachInsights.appreciation}
                  </p>
                </div>

                {/* 2. Improvement Block */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[10px] uppercase tracking-wider">
                    <Sliders size={12} className="text-blue-500" /> Improvement
                  </div>
                  <p className="text-[10px] text-blue-900 leading-normal font-semibold font-sans">
                    {coachInsights.improvement}
                  </p>
                </div>

                {/* 3. Blunder Block */}
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-rose-700 font-bold text-[10px] uppercase tracking-wider">
                    <Skull size={12} className="text-rose-500" /> Blunder Warning
                  </div>
                  <p className="text-[10px] text-rose-950 leading-normal font-semibold font-sans">
                    {coachInsights.blunder}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMN 2: CENTER PANEL */}
          <div className="md:col-span-6 flex flex-col gap-5">
            <CustomAreaChart />
            <WeeklyStats />
            <GridSheet onEditHabit={(habit) => { setHabitToEdit(habit); setIsFormOpen(true); }} />
            <AchievementWidget />
          </div>

          {/* COLUMN 3: RIGHT SIDEBAR */}
          <div className="md:col-span-3 flex flex-col gap-5">
            
            {/* Top Right Card: Overall Month completions */}
            <div className="bg-[#fdf2f8] p-5 rounded-2xl border border-[#fbcfe8] flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-pink-500 font-bold">Daily Progress</span>
                  <span className="text-3xl font-black text-pink-700 leading-tight font-mono mt-0.5">
                    {monthlyCompletionRate.toFixed(2)}%
                  </span>
                </div>

                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="transparent"
                      stroke="#fce7f3"
                      strokeWidth={4.5}
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="transparent"
                      stroke="#ec4899"
                      strokeWidth={4.5}
                      strokeDasharray={2 * Math.PI * 24}
                      strokeDashoffset={2 * Math.PI * 24 - (monthlyCompletionRate / 100) * (2 * Math.PI * 24)}
                      strokeLinecap="round"
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[7.5px] font-bold text-pink-400 uppercase tracking-widest leading-none">Habits</span>
                    <span className="text-[9px] font-black font-mono text-pink-800 leading-tight mt-0.5">
                      {totalMonthCompletions}/{totalMonthPossible}
                    </span>
                  </div>
                </div>

              </div>

              {/* Weekend Stats Banner */}
              <div className="border-t border-pink-100/60 pt-3">
                <div className="grid grid-cols-2 text-[9px] font-bold text-pink-500/80 mb-2">
                  <span>Weekday Avg: {weekendStats.weekdayCompletionRate}%</span>
                  <span className="text-right">Weekend Avg: {weekendStats.weekendCompletionRate}%</span>
                </div>
                {weekendStats.isWeekendSlacker ? (
                  <div className="bg-rose-50 border border-rose-100 rounded px-2.5 py-1 text-[9px] font-bold text-rose-600 flex items-center gap-1 leading-normal">
                    ⚠️ Weekend Slacker! weekend rate is -{(weekendStats.weekdayCompletionRate - weekendStats.weekendCompletionRate)}% lower.
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-100 rounded px-2.5 py-1 text-[9px] font-bold text-emerald-600 flex items-center gap-1 leading-normal">
                    ✨ Weekend Warrior! Consistently executing.
                  </div>
                )}
              </div>
            </div>

            {/* TOP 10 HABITS Scoreboard */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-[#dbeafe] py-2.5 px-4 border-b border-zinc-200">
                <h3 className="text-[10px] font-black tracking-widest text-blue-900 uppercase text-center">
                  Top 10 Habits
                </h3>
              </div>
              
              <div className="flex flex-col">
                <div className="flex justify-between px-4 py-1 bg-zinc-50 border-b border-zinc-100 text-[9px] font-black text-zinc-400 uppercase tracking-wider">
                  <span>daily habit</span>
                  <span className="text-right">progress</span>
                </div>

                {Array.from({ length: 10 }).map((_, idx) => {
                  const item = top10Habits[idx];
                  return (
                    <div 
                      key={idx} 
                      className="flex justify-between items-center h-[30px] px-4 border-b border-zinc-50 text-[11px]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[9px] font-bold text-zinc-400 font-mono w-4">{idx + 1}</span>
                        <span className="font-semibold text-slate-700 truncate">
                          {item ? item.habit.name : '—'}
                        </span>
                      </div>
                      <span className="text-right font-bold text-slate-500 font-mono">
                        {item ? `${item.percent}%` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="py-2.5 px-4 bg-zinc-50 text-center border-t border-zinc-100 text-[10px] font-semibold text-zinc-500 italic">
                Focus on consistency every single day! 🚀
              </div>
            </div>

            {/* DAILY PROGRESS checklist */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-[#b4d2f9] py-2 px-4 border-b border-zinc-200">
                <h3 className="text-[10px] font-black tracking-widest text-blue-900 uppercase text-center">
                  Daily Progress
                </h3>
                <p className="text-[9px] font-bold text-blue-700 text-center mt-0.5">
                  {totalMonthCompletions} / {totalMonthPossible} completed
                </p>
              </div>

              <div className="flex flex-col">
                <div className="flex px-4 py-1.5 bg-zinc-50 border-b border-zinc-100 text-[9px] font-black text-zinc-400 uppercase tracking-wider">
                  <span className="w-10">goal</span>
                  <span className="flex-1 px-2">percentage</span>
                  <span className="w-12 text-center">count</span>
                  <span className="w-12 text-right">longest streak</span>
                </div>

                {Array.from({ length: 30 }).map((_, index) => {
                  const stat = habitsMonthStats[index];
                  
                  return (
                    <div 
                      key={index} 
                      className="flex items-center h-[36px] px-4 border-b border-zinc-100 text-[10px] text-zinc-650"
                    >
                      {stat ? (
                        <>
                          <div className="w-10 font-bold text-slate-705 font-mono">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={stat.habit.goalPercent}
                              onChange={(e) => updateHabitGoal(stat.habit.id, Number(e.target.value))}
                              className="w-full bg-transparent border-none text-slate-700 font-bold focus:outline-none focus:bg-zinc-100 text-[10px] text-center"
                            />
                          </div>

                          <div className="flex-1 px-3 flex flex-col gap-0.5">
                            <div className="w-full h-1.5 bg-zinc-100 rounded-full border border-zinc-200/50 overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${stat.percent}%` }}
                              />
                            </div>
                          </div>

                          <div className="w-12 text-center font-bold text-slate-500 font-mono text-[9px]">
                            {stat.completions} / {stat.possibleDays}
                          </div>

                          <div className="w-12 text-right font-black text-amber-500 font-mono text-[10px]">
                            {stat.maxStreak}
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex justify-between">
                          <span className="text-zinc-300 font-mono text-[9px]">—</span>
                          <span className="text-zinc-300 font-mono text-[9px]">—</span>
                          <span className="text-zinc-300 font-mono text-[9px]">—</span>
                          <span className="text-zinc-300 font-mono text-[9px]">—</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Modals */}
      <HabitFormModal 
        isOpen={isFormOpen} 
        onClose={() => { setIsFormOpen(false); setHabitToEdit(null); }} 
        habitToEdit={habitToEdit} 
      />
      <WeeklyJournalModal 
        isOpen={isJournalOpen} 
        onClose={() => setIsJournalOpen(false)} 
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <HabitProvider>
      <DashboardContent />
    </HabitProvider>
  );
}
