import React, { useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
const WEEK_COLORS = {
  1: { bg: 'bg-[#b4d2f9]', text: 'text-[#1d4ed8]', stroke: '#2563eb', track: '#eff6ff' },
  2: { bg: 'bg-[#fbcfe8]', text: 'text-[#be185d]', stroke: '#db2777', track: '#fdf2f8' },
  3: { bg: 'bg-[#ccfbf1]', text: 'text-[#0f766e]', stroke: '#0d9488', track: '#f0fdfa' },
  4: { bg: 'bg-[#fef08a]', text: 'text-[#a16207]', stroke: '#ca8a04', track: '#fefce8' },
  5: { bg: 'bg-[#cbd5e1]', text: 'text-[#334155]', stroke: '#475569', track: '#f8fafc' },
};

export const WeeklyStats: React.FC = () => {
  const { habits, history, currentMonth, currentYear } = useHabits();

  const totalDays = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const activeHabits = useMemo(() => {
    return habits.filter(h => !h.archived);
  }, [habits]);

  // Compute stats for each day (1 to totalDays)
  const dailyStats = useMemo(() => {
    const stats: { day: number; count: number; total: number; percent: number; weekNum: number }[] = [];
    const mm = String(currentMonth + 1).padStart(2, '0');

    for (let day = 1; day <= totalDays; day++) {
      const dd = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${mm}-${dd}`;
      const activeOnDay = activeHabits.filter(h => h.createdAt <= dateStr);
      
      let count = 0;
      const dayHistory = history[dateStr];
      if (dayHistory) {
        activeOnDay.forEach(h => {
          if (dayHistory[h.id] === true) {
            count++;
          }
        });
      }

      // Determine week number (1-5)
      let weekNum = 1;
      if (day <= 7) weekNum = 1;
      else if (day <= 14) weekNum = 2;
      else if (day <= 21) weekNum = 3;
      else if (day <= 28) weekNum = 4;
      else weekNum = 5;

      const percent = activeOnDay.length > 0 ? Math.round((count / activeOnDay.length) * 100) : 0;

      stats.push({
        day,
        count,
        total: activeOnDay.length,
        percent,
        weekNum
      });
    }
    return stats;
  }, [history, activeHabits, currentMonth, currentYear, totalDays]);

  // Compute averages for each week (1 to 5)
  const weeklyAverages = useMemo(() => {
    const averages = [
      { week: 1, sumPercent: 0, count: 0, avg: 0 },
      { week: 2, sumPercent: 0, count: 0, avg: 0 },
      { week: 3, sumPercent: 0, count: 0, avg: 0 },
      { week: 4, sumPercent: 0, count: 0, avg: 0 },
      { week: 5, sumPercent: 0, count: 0, avg: 0 },
    ];

    dailyStats.forEach(day => {
      const idx = day.weekNum - 1;
      averages[idx].sumPercent += day.percent;
      averages[idx].count += 1;
    });

    averages.forEach(w => {
      w.avg = w.count > 0 ? Math.round((w.sumPercent / w.count) * 10) / 10 : 0;
    });

    return averages;
  }, [dailyStats]);

  // Group days by week for rendering titles
  const weekGroups = [
    { name: 'week 1', days: dailyStats.filter(d => d.weekNum === 1) },
    { name: 'week 2', days: dailyStats.filter(d => d.weekNum === 2) },
    { name: 'week 3', days: dailyStats.filter(d => d.weekNum === 3) },
    { name: 'week 4', days: dailyStats.filter(d => d.weekNum === 4) },
    { name: 'week 5', days: dailyStats.filter(d => d.weekNum === 5) },
  ];

  return (
    <div className="w-full bg-white p-5 rounded-2xl border border-zinc-150 shadow-sm flex flex-col gap-6 select-none">
      
      {/* 1. Bar Chart Container */}
      <div className="w-full">
        {/* Week Headers */}
        <div className="flex pl-1 w-full justify-between items-end border-b border-zinc-100 pb-1.5 mb-3 text-[10px] font-bold text-zinc-400">
          {weekGroups.map((group, gIdx) => {
            if (group.days.length === 0) return null;
            // Width style: proportion of columns
            const pctWidth = (group.days.length / totalDays) * 100;
            return (
              <div 
                key={gIdx} 
                className="text-center italic"
                style={{ width: `${pctWidth}%` }}
              >
                {group.name}
              </div>
            );
          })}
        </div>

        {/* Vertical Bars Grid */}
        <div className="flex w-full items-end h-28 gap-[3px] md:gap-[5px] pl-1">
          {dailyStats.map((day) => {
            const colors = WEEK_COLORS[day.weekNum as keyof typeof WEEK_COLORS] || WEEK_COLORS[5];
            // Height proportional to percentage (min height 4px so it is visible)
            const heightPx = Math.max(4, (day.percent / 100) * 100);
            
            return (
              <div 
                key={day.day} 
                className="flex-1 flex flex-col items-center group/bar relative"
              >
                {/* Bar */}
                <div 
                  className={`w-full rounded-t-[3px] transition-all duration-300 ${colors.bg}`}
                  style={{ height: `${heightPx}px` }}
                />
                
                {/* Completion rate below */}
                <span className="text-[7.5px] font-bold text-zinc-500 mt-1">
                  {day.percent}%
                </span>
                {/* Check count below percentage */}
                <span className="text-[7.5px] font-bold text-zinc-400">
                  {day.count}
                </span>

                {/* Tooltip on hover */}
                <div className="pointer-events-none opacity-0 group-hover/bar:opacity-100 transition-opacity absolute bottom-full mb-1.5 bg-zinc-950 text-white px-2 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap z-20">
                  Day {day.day}: {day.count}/{day.total} checked
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Circular Weekly Progress Gauges */}
      <div className="grid grid-cols-5 gap-3 pt-3 border-t border-zinc-100">
        {weeklyAverages.map((w) => {
          const colors = WEEK_COLORS[w.week as keyof typeof WEEK_COLORS] || WEEK_COLORS[5];
          // SVG Circle maths
          const radius = 24;
          const strokeWidth = 5;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (w.avg / 100) * circumference;

          // Don't render if this week has no days in the active month
          if (w.count === 0) return null;

          return (
            <div key={w.week} className="flex flex-col items-center gap-1.5">
              {/* Circular SVG Gauge */}
              <div className="relative w-14 h-14">
                <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                  {/* Track */}
                  <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    fill="transparent"
                    stroke={colors.track}
                    strokeWidth={strokeWidth}
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    fill="transparent"
                    stroke={colors.stroke}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                {/* Percentage text in middle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-black font-mono text-zinc-800">
                    {w.avg}%
                  </span>
                </div>
              </div>
              
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 italic">
                wk {w.week}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
};
