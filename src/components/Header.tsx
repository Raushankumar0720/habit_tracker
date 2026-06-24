import React from 'react';
import { useHabits } from '../context/HabitContext';
import { Trophy, Flame, Sparkles } from 'lucide-react';

const MOTIVATION_QUOTES = [
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
  "Small daily improvements over time lead to stunning results.",
  "Your habits will determine your future. Choose consistency.",
  "The secret of your success is found in your daily routine.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Discipline is choosing between what you want now and what you want most."
];

export const Header: React.FC = () => {
  const { xp, levelInfo, longestStreak } = useHabits();

  // Get a quote based on the current level or day of the year
  const quoteIndex = (levelInfo.level + Math.floor(xp / 100)) % MOTIVATION_QUOTES.length;
  const quote = MOTIVATION_QUOTES[quoteIndex];

  // Calculate if there are active streak multipliers
  let multiplierText = '';
  let multiplierClass = '';

  if (longestStreak >= 7) {
    multiplierText = '1.5x Ultra Streak Multiplier Active!';
    multiplierClass = 'bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white animate-pulse border-amber-400/50 shadow-md shadow-fuchsia-500/20';
  } else if (longestStreak >= 3) {
    multiplierText = '1.2x Quick Streak Multiplier Active!';
    multiplierClass = 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-violet-400/30';
  }

  return (
    <div className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 md:p-8 border border-zinc-800 shadow-xl">
      {/* Decorative radial glows */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
        
        {/* Left Side: Avatar and Stats */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative group">
            {/* Pulsing avatar frame */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt" />
            
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-3xl font-bold select-none text-zinc-100">
              {levelInfo.level}
            </div>
            
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-zinc-950 rounded-full p-1 border border-zinc-900 shadow-md flex items-center justify-center">
              <Trophy size={14} className="fill-current" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-zinc-50 leading-tight">
                Level {levelInfo.level}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                {levelInfo.title}
              </span>
            </div>
            
            <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-[280px] md:max-w-md italic">
              "{quote}"
            </p>
          </div>
        </div>

        {/* Right Side: XP Progress and Total Points */}
        <div className="flex flex-col w-full md:w-80 gap-3">
          <div className="flex justify-between items-end text-xs">
            <span className="text-zinc-400 font-medium flex items-center gap-1">
              <Sparkles size={13} className="text-violet-400 animate-spin-slow" /> XP Progress
            </span>
            <span className="text-zinc-200 font-semibold font-mono">
              {levelInfo.xpInCurrentLevel} / {levelInfo.xpNeededForNextLevel} XP
            </span>
          </div>

          {/* XP Bar */}
          <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/60 p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs mt-1">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Total XP</span>
                <span className="text-sm font-bold text-zinc-100 font-mono">{xp}</span>
              </div>
              <div className="h-6 w-px bg-zinc-800" />
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Longest Streak</span>
                <span className="text-sm font-bold text-amber-400 font-mono flex items-center gap-0.5">
                  {longestStreak} <Flame size={12} className="fill-current text-amber-500" />
                </span>
              </div>
            </div>

            {/* Streak Multiplier Badge */}
            {multiplierText && (
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${multiplierClass}`}>
                {multiplierText}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
