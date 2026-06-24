import React, { useState } from 'react';
import type { Habit } from '../types';
import { useHabits } from '../context/HabitContext';
import { HabitIcon } from './HabitIcon';
import { calculateStreak, getDaysOfWeek } from '../utils/analytics';
import { Flame, Archive, Trash2, Edit2, Check, Lock } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
}

const CATEGORY_STYLES = {
  health: {
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15',
    accent: 'rose',
    checkboxChecked: 'bg-rose-500 border-rose-400 text-zinc-950',
    checkboxUnchecked: 'border-zinc-700 hover:border-rose-500/50 bg-zinc-900/40',
  },
  work: {
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/15',
    accent: 'violet',
    checkboxChecked: 'bg-violet-500 border-violet-400 text-zinc-950',
    checkboxUnchecked: 'border-zinc-700 hover:border-violet-500/50 bg-zinc-900/40',
  },
  mind: {
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/15',
    accent: 'cyan',
    checkboxChecked: 'bg-cyan-500 border-cyan-400 text-zinc-950',
    checkboxUnchecked: 'border-zinc-700 hover:border-cyan-500/50 bg-zinc-900/40',
  },
  finance: {
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15',
    accent: 'amber',
    checkboxChecked: 'bg-amber-500 border-amber-400 text-zinc-950',
    checkboxUnchecked: 'border-zinc-700 hover:border-amber-500/50 bg-zinc-900/40',
  },
  custom: {
    color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20 hover:bg-zinc-500/15',
    accent: 'zinc',
    checkboxChecked: 'bg-zinc-500 border-zinc-400 text-zinc-950',
    checkboxUnchecked: 'border-zinc-700 hover:border-zinc-500/50 bg-zinc-900/40',
  },
};

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onEdit }) => {
  const { history, toggleHabitCompletion, deleteHabit, archiveHabit, unarchiveHabit } = useHabits();
  const [popDay, setPopDay] = useState<string | null>(null);

  const streak = calculateStreak(history, habit);
  const styles = CATEGORY_STYLES[habit.category] || CATEGORY_STYLES.custom;
  
  // Weekly checklist dates (last 7 days)
  const last7Days = getDaysOfWeek();

  const handleToggle = (dateStr: string) => {
    // Before completing, verify if the habit was created yet
    if (dateStr < habit.createdAt) return;

    // Trigger pop micro-animation for this checkbox
    setPopDay(dateStr);
    toggleHabitCompletion(habit.id, dateStr);
    
    // Clear animation state after 300ms
    setTimeout(() => {
      setPopDay(null);
    }, 300);
  };

  // Flame color based on streak count
  let flameColor = 'text-zinc-500';
  let flameGlow = '';
  if (streak >= 7) {
    flameColor = 'text-amber-500 fill-amber-500';
    flameGlow = 'animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]';
  } else if (streak >= 3) {
    flameColor = 'text-orange-500 fill-orange-500';
    flameGlow = 'drop-shadow-[0_0_4px_rgba(249,115,22,0.4)]';
  }

  return (
    <div className={`group relative w-full flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 rounded-xl border bg-zinc-900/40 hover:bg-zinc-900/70 transition-all duration-300 ${habit.archived ? 'border-zinc-800/50 opacity-60' : 'border-zinc-800'}`}>
      
      {/* Left side: Habit info */}
      <div className="flex items-start gap-3 flex-1 min-w-[200px]">
        {/* Category-themed icon badge */}
        <div className={`p-2.5 rounded-lg border transition-colors flex items-center justify-center shrink-0 ${styles.color}`}>
          <HabitIcon name={habit.icon} size={20} />
        </div>
        
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <h3 className={`text-base font-semibold truncate text-zinc-100 ${habit.archived ? 'line-through text-zinc-500' : ''}`}>
              {habit.name}
            </h3>
            {habit.archived && (
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                Archived
              </span>
            )}
          </div>
          
          <p className="text-xs text-zinc-400 mt-0.5 max-w-[240px] md:max-w-md truncate">
            {habit.description || 'No description provided.'}
          </p>

          {/* Streak Indicator */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono bg-zinc-800/80 border border-zinc-700/50 ${streak > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
              <Flame size={12} className={`${flameColor} ${flameGlow}`} />
              {streak} {streak === 1 ? 'day' : 'days'} streak
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">
              Created {habit.createdAt}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: 7-day checkmarks grid & actions */}
      <div className="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-800/80">
        
        {/* Weekly Checklist Strip */}
        <div className="flex gap-2">
          {last7Days.map((day) => {
            const isCompleted = history[day.dateStr]?.[habit.id] === true;
            const isLocked = day.dateStr < habit.createdAt;
            
            return (
              <button
                key={day.dateStr}
                disabled={isLocked || habit.archived}
                onClick={() => handleToggle(day.dateStr)}
                className={`group/btn relative w-9 h-11 rounded-lg border flex flex-col items-center justify-between py-1 transition-all duration-200 select-none cursor-pointer 
                  ${isLocked 
                    ? 'border-zinc-800/30 opacity-25 cursor-not-allowed bg-transparent' 
                    : isCompleted 
                      ? `${styles.checkboxChecked} scale-100 shadow-md` 
                      : `${styles.checkboxUnchecked}`
                  }
                  ${popDay === day.dateStr ? 'check-pop-active' : ''}
                `}
                title={isLocked ? `Locked (Habit created on ${habit.createdAt})` : `${day.name} ${day.label}`}
              >
                {/* Weekday Label */}
                <span className={`text-[8px] font-bold uppercase tracking-wider ${isCompleted ? 'text-zinc-950 font-black' : 'text-zinc-500 group-hover/btn:text-zinc-400'}`}>
                  {day.name.slice(0, 1)}
                </span>
                
                {/* Date Check / Icon */}
                <div className="flex items-center justify-center h-4 w-4">
                  {isLocked ? (
                    <Lock size={8} className="text-zinc-500" />
                  ) : isCompleted ? (
                    <Check size={12} strokeWidth={3.5} className="text-zinc-950" />
                  ) : (
                    <span className="text-[10px] font-mono font-medium text-zinc-400 group-hover/btn:text-zinc-300">
                      {day.label}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Hover / Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(habit)}
            className="p-2 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-700/30 text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Edit Habit"
          >
            <Edit2 size={14} />
          </button>
          
          {habit.archived ? (
            <button
              onClick={() => unarchiveHabit(habit.id)}
              className="p-2 rounded-lg bg-zinc-800/40 hover:bg-emerald-500/10 border border-zinc-700/30 text-zinc-400 hover:text-emerald-400 transition-colors"
              title="Unarchive Habit"
            >
              <Archive size={14} />
            </button>
          ) : (
            <button
              onClick={() => archiveHabit(habit.id)}
              className="p-2 rounded-lg bg-zinc-800/40 hover:bg-amber-500/10 border border-zinc-700/30 text-zinc-400 hover:text-amber-400 transition-colors"
              title="Archive Habit"
            >
              <Archive size={14} />
            </button>
          )}

          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete "${habit.name}"? This removes all historical records.`)) {
                deleteHabit(habit.id);
              }
            }}
            className="p-2 rounded-lg bg-zinc-800/40 hover:bg-rose-500/10 border border-zinc-700/30 text-zinc-400 hover:text-rose-400 transition-colors"
            title="Delete Habit"
          >
            <Trash2 size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};
