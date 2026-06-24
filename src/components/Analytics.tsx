import React, { useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import { generateHeatmapData, formatDate, type HeatmapDay } from '../utils/analytics';
import { Trophy, Flame, CheckCircle, TrendingUp, Calendar, Brain, Dumbbell, Code, Wallet } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { habits, history, totalCompletions, longestStreak, mostReliableHabit } = useHabits();

  // Generate heatmap data
  const heatmapData = useMemo(() => {
    return generateHeatmapData(history, habits);
  }, [history, habits]);

  // Group heatmap days into 53 weeks (each week has 7 days)
  const weeks = useMemo(() => {
    const w: HeatmapDay[][] = [];
    const size = 7;
    for (let i = 0; i < heatmapData.length; i += size) {
      w.push(heatmapData.slice(i, i + size));
    }
    return w;
  }, [heatmapData]);

  // Calculate month labels position based on columns
  // We want to map which month name should be printed above which week column index
  const monthLabels = useMemo(() => {
    const labels: { text: string; colIndex: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, index) => {
      if (week.length > 0) {
        // Look at the middle day of the week
        const midDay = new Date(week[0].date);
        const currentMonth = midDay.getMonth();
        if (currentMonth !== lastMonth) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          labels.push({
            text: monthNames[currentMonth],
            colIndex: index
          });
          lastMonth = currentMonth;
        }
      }
    });
    
    return labels;
  }, [weeks]);

  // Category completion summary
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number; percent: number }> = {
      health: { total: 0, completed: 0, percent: 0 },
      work: { total: 0, completed: 0, percent: 0 },
      mind: { total: 0, completed: 0, percent: 0 },
      finance: { total: 0, completed: 0, percent: 0 },
    };

    const activeHabits = habits.filter(h => !h.archived);

    activeHabits.forEach(habit => {
      const cat = habit.category;
      if (stats[cat] === undefined) return;
      
      // Calculate how many times it was completed historically
      let completions = 0;
      let totalDays = 0;

      // Check completions over the last 30 days
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = formatDate(d);
        if (dateStr >= habit.createdAt) {
          totalDays++;
          if (history[dateStr]?.[habit.id] === true) {
            completions++;
          }
        }
      }

      stats[cat].total += totalDays;
      stats[cat].completed += completions;
    });

    // Compute percentage
    for (const key in stats) {
      const s = stats[key];
      s.percent = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
    }

    return stats;
  }, [history, habits]);

  // Color shading logic for contribution cells
  const getCellColor = (percentage: number) => {
    if (percentage === 0) return 'bg-zinc-900 border-zinc-950/20';
    if (percentage <= 25) return 'bg-violet-950/40 border-violet-900/20 text-violet-300';
    if (percentage <= 50) return 'bg-violet-850/70 border-violet-700/30 text-violet-200';
    if (percentage <= 75) return 'bg-violet-600 border-violet-500/40 text-zinc-50';
    return 'bg-gradient-to-br from-violet-500 to-fuchsia-500 border-violet-400/50 text-white shadow-[0_0_4px_rgba(168,85,247,0.3)]';
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Tasks Card */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl flex items-center gap-4 hover:border-zinc-700/50 transition-colors">
          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Total Habits Completed</span>
            <h3 className="text-2xl font-black text-zinc-100 font-mono mt-0.5">{totalCompletions}</h3>
          </div>
        </div>

        {/* Longest Active Streak Card */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl flex items-center gap-4 hover:border-zinc-700/50 transition-colors">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Flame size={24} className="fill-current text-amber-500 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Longest Active Streak</span>
            <h3 className="text-2xl font-black text-amber-400 font-mono mt-0.5">{longestStreak} {longestStreak === 1 ? 'Day' : 'Days'}</h3>
          </div>
        </div>

        {/* Most Reliable Habit Card */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl flex items-center gap-4 hover:border-zinc-700/50 transition-colors">
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Trophy size={24} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Most Reliable Habit</span>
            <h3 className="text-base font-bold text-zinc-100 truncate max-w-[160px] md:max-w-[200px] mt-0.5" title={mostReliableHabit}>
              {mostReliableHabit}
            </h3>
          </div>
        </div>

      </div>

      {/* GitHub Contribution Heatmap Card */}
      <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <h3 className="text-sm font-bold text-zinc-50 flex items-center gap-2">
            <Calendar size={16} className="text-violet-400" /> Completion Matrix (Past Year)
          </h3>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <span>Less</span>
            <div className="w-2.5 h-2.5 bg-zinc-900 border border-zinc-950/20 rounded" />
            <div className="w-2.5 h-2.5 bg-violet-950/40 border border-violet-900/20 rounded" />
            <div className="w-2.5 h-2.5 bg-violet-850/70 border border-violet-700/30 rounded" />
            <div className="w-2.5 h-2.5 bg-violet-600 border border-violet-500/40 rounded" />
            <div className="w-2.5 h-2.5 bg-gradient-to-br from-violet-500 to-fuchsia-500 border-violet-400/50 rounded" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid Wrapper (Scrollable on small screens) */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-thin select-none">
          <div className="min-w-[680px] flex flex-col gap-1.5">
            {/* Month labels header row */}
            <div className="relative h-4 text-[9px] text-zinc-500 font-bold ml-7">
              {monthLabels.map((lbl, idx) => (
                <div 
                  key={idx} 
                  className="absolute"
                  style={{ left: `${lbl.colIndex * 12}px` }}
                >
                  {lbl.text}
                </div>
              ))}
            </div>

            {/* Grid with Weekdays and Columns */}
            <div className="flex gap-2">
              {/* Day of Week labels column */}
              <div className="flex flex-col justify-between text-[9px] text-zinc-500 font-bold h-[78px] py-0.5 w-5 pr-1 text-right">
                <span>Sun</span>
                <span>Tue</span>
                <span>Thu</span>
                <span>Sat</span>
              </div>

              {/* Columns of weeks */}
              <div className="flex gap-[2px]">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[2px]">
                    {week.map((day, dIdx) => (
                      <div
                        key={dIdx}
                        className={`w-2.5 h-2.5 rounded-[2px] border transition-all duration-300 relative group/cell ${getCellColor(day.percentage)}`}
                      >
                        {/* Hover Tooltip card */}
                        <div className="pointer-events-none opacity-0 group-hover/cell:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-[9px] font-bold text-zinc-100 whitespace-nowrap shadow-xl z-20">
                          {day.date} • {day.count}/{day.total} ({day.percentage}%)
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Category completion breakdown */}
      <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl flex flex-col gap-4">
        <h3 className="text-sm font-bold text-zinc-50 flex items-center gap-2">
          <TrendingUp size={16} className="text-violet-400" /> Category Performance (Last 30 Days)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'health', name: 'Health & Fitness', icon: Dumbbell, color: 'from-rose-500 to-orange-500', txt: 'text-rose-400' },
            { id: 'work', name: 'Work & Projects', icon: Code, color: 'from-violet-500 to-fuchsia-500', txt: 'text-violet-400' },
            { id: 'mind', name: 'Mind & Learning', icon: Brain, color: 'from-cyan-500 to-blue-500', txt: 'text-cyan-400' },
            { id: 'finance', name: 'Finance & Saving', icon: Wallet, color: 'from-amber-500 to-yellow-500', txt: 'text-amber-400' },
          ].map((cat) => {
            const stat = categoryStats[cat.id] || { percent: 0, completed: 0, total: 0 };
            return (
              <div key={cat.id} className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <cat.icon size={16} className={cat.txt} />
                    <span className="text-xs font-bold text-zinc-200">{cat.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-400">
                    {stat.percent}% ({stat.completed}/{stat.total} checks)
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-850">
                  <div 
                    className={`h-full bg-gradient-to-r ${cat.color} rounded-full transition-all duration-500`}
                    style={{ width: `${stat.percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
