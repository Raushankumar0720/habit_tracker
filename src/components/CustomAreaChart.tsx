import React, { useMemo } from 'react';
import { useHabits } from '../context/HabitContext';

export const CustomAreaChart: React.FC = () => {
  const { habits, history, currentMonth, currentYear } = useHabits();

  // Get total days in active month
  const totalDays = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const activeHabits = useMemo(() => {
    return habits.filter(h => !h.archived);
  }, [habits]);

  // Compute daily completion rates
  const dailyData = useMemo(() => {
    const data: number[] = [];
    const mm = String(currentMonth + 1).padStart(2, '0');
    
    for (let day = 1; day <= totalDays; day++) {
      const dd = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${mm}-${dd}`;
      
      // Habits active on or before this day
      const activeOnDay = activeHabits.filter(h => h.createdAt <= dateStr);
      if (activeOnDay.length === 0) {
        data.push(0);
        continue;
      }

      let completed = 0;
      const dayHistory = history[dateStr];
      if (dayHistory) {
        activeOnDay.forEach(h => {
          if (dayHistory[h.id] === true) {
            completed++;
          }
        });
      }
      
      data.push((completed / activeOnDay.length) * 100);
    }
    return data;
  }, [history, activeHabits, currentMonth, currentYear, totalDays]);

  // Create SVG path points
  const points = useMemo(() => {
    const width = 800;
    const height = 120;
    const xStep = width / (totalDays - 1);
    
    // Map data to coordinates (y is inverted in SVG)
    return dailyData.map((pct, i) => {
      const x = i * xStep;
      // Map 0-100% to height range [10, 110] (to prevent clipping)
      const y = height - 10 - (pct / 100) * 90;
      return { x, y };
    });
  }, [dailyData, totalDays]);

  // Generate SVG path string (curved line using cubic bezier command 'S' or 'C')
  const pathData = useMemo(() => {
    if (points.length === 0) return '';
    
    let d = `M ${points[0].x} ${points[0].y}`;
    
    // Draw simple line segments (since 31 points make a smooth curve anyway)
    // To make it extra smooth, we can use bezier control points.
    // A standard Catmull-Rom or simple bezier smoothing:
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points]);

  // Generate path data for the closed filled area
  const areaPathData = useMemo(() => {
    if (points.length === 0) return '';
    const width = 800;
    const height = 120;
    
    // Draw line from bottom-right, to bottom-left, then close
    return `${pathData} L ${width} ${height} L 0 ${height} Z`;
  }, [pathData, points]);

  return (
    <div className="w-full bg-[#f0f6ff]/40 rounded-2xl border border-[#d6e4f9] p-4 flex flex-col gap-2 relative">
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Completion Trend</span>
        <span className="text-[10px] text-blue-500 font-bold font-mono">Synced Real-Time</span>
      </div>
      
      {/* Chart SVG */}
      <div className="w-full h-24 relative">
        <svg 
          viewBox="0 0 800 120" 
          width="100%" 
          height="100%" 
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b4d2f9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#b4d2f9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="20" x2="800" y2="20" stroke="#e2e8f0" strokeDasharray="3,3" strokeWidth={1} />
          <line x1="0" y1="65" x2="800" y2="65" stroke="#e2e8f0" strokeDasharray="3,3" strokeWidth={1} />
          <line x1="0" y1="110" x2="800" y2="110" stroke="#e2e8f0" strokeDasharray="3,3" strokeWidth={1} />

          {/* Area Fill */}
          {areaPathData && (
            <path 
              d={areaPathData} 
              fill="url(#area-gradient)" 
            />
          )}

          {/* Stroke Line */}
          {pathData && (
            <path 
              d={pathData} 
              fill="none" 
              stroke="#7eb0f7" 
              strokeWidth={2.5} 
              strokeLinecap="round"
            />
          )}

          {/* Dots on hover */}
          {points.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={3}
              fill="#ffffff"
              stroke="#3b82f6"
              strokeWidth={1.5}
              className="hover:r-5 transition-all duration-100 cursor-pointer"
            >
              <title>{`Day ${idx + 1}: ${Math.round(dailyData[idx])}%`}</title>
            </circle>
          ))}
        </svg>
      </div>
    </div>
  );
};
