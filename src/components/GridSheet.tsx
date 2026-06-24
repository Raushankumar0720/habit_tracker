import React, { useMemo, useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { Check, Snowflake, Shield, Skull, X } from 'lucide-react';
import { isHabitCompletedOnDate } from '../utils/analytics';
import type { Habit } from '../types';

const WEEK_STYLES = {
  1: { headerBg: 'bg-[#b4d2f9]', text: 'text-blue-800', border: 'border-[#93c5fd]', activeBorder: 'border-blue-400', checkBg: 'bg-blue-500', hoverBg: 'hover:bg-blue-50', barBg: 'bg-blue-500/20' },
  2: { headerBg: 'bg-[#fbcfe8]', text: 'text-pink-800', border: 'border-[#f9a8d4]', activeBorder: 'border-pink-400', checkBg: 'bg-pink-500', hoverBg: 'hover:bg-pink-50', barBg: 'bg-pink-500/20' },
  3: { headerBg: 'bg-[#ccfbf1]', text: 'text-teal-800', border: 'border-[#99f6e4]', activeBorder: 'border-teal-400', checkBg: 'bg-teal-500', hoverBg: 'hover:bg-teal-50', barBg: 'bg-teal-500/20' },
  4: { headerBg: 'bg-[#fef08a]', text: 'text-amber-800', border: 'border-[#fde047]', activeBorder: 'border-amber-400', checkBg: 'bg-amber-500', hoverBg: 'hover:bg-yellow-50', barBg: 'bg-amber-500/20' },
  5: { headerBg: 'bg-[#cbd5e1]', text: 'text-slate-800', border: 'border-[#94a3b8]', activeBorder: 'border-slate-400', checkBg: 'bg-slate-500', hoverBg: 'hover:bg-slate-50', barBg: 'bg-slate-500/20' },
};

const isDateScheduled = (habit: Habit, dateStr: string) => {
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekends') {
    const [y, m, d] = dateStr.split('-').map(Number);
    const day = new Date(y, m - 1, d).getDay();
    return day === 0 || day === 6;
  }
  return true;
};

export const GridSheet: React.FC = () => {
  const {
    activeHabits,
    history,
    toggleHabitCompletion,
    logNumericValue,
    currentMonth,
    currentYear,
    accountabilityMode,
    zenMode,
    hoveredRowIndex,
    setHoveredRowIndex,
    streakFreezes,
    useStreakFreeze,
  } = useHabits();

  const [editingNumericCell, setEditingNumericCell] = useState<{
    habitId: string;
    habitName: string;
    dateStr: string;
    targetValue: number;
    unit: string;
    currentValue: number;
  } | null>(null);

  const [freezingCell, setFreezingCell] = useState<{ habit: Habit; dateStr: string } | null>(null);

  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const totalDays = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const days = useMemo(() => {
    const dList: { day: number; weekday: string; weekNum: number; dateStr: string }[] = [];
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const mm = String(currentMonth + 1).padStart(2, '0');

    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(currentYear, currentMonth, day);
      const dd = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${mm}-${dd}`;

      let weekNum = 1;
      if (day <= 7) weekNum = 1;
      else if (day <= 14) weekNum = 2;
      else if (day <= 21) weekNum = 3;
      else if (day <= 28) weekNum = 4;
      else weekNum = 5;

      dList.push({
        day,
        weekday: weekdays[dateObj.getDay()],
        weekNum,
        dateStr,
      });
    }
    return dList;
  }, [currentMonth, currentYear, totalDays]);

  const weekSpans = useMemo(() => {
    const spans = [
      { week: 1, label: 'week 1', cols: 0, styles: WEEK_STYLES[1] },
      { week: 2, label: 'week 2', cols: 0, styles: WEEK_STYLES[2] },
      { week: 3, label: 'week 3', cols: 0, styles: WEEK_STYLES[3] },
      { week: 4, label: 'week 4', cols: 0, styles: WEEK_STYLES[4] },
      { week: 5, label: 'week 5', cols: 0, styles: WEEK_STYLES[5] },
    ];

    days.forEach(d => {
      spans[d.weekNum - 1].cols += 1;
    });

    return spans.filter(s => s.cols > 0);
  }, [days]);

  const handleCellClick = (habit: Habit, dateStr: string) => {
    const val = history[dateStr]?.[habit.id];
    const isCompleted = isHabitCompletedOnDate(habit, val);
    const isPast = dateStr < todayStr;
    const isFrozen = val === 'frozen';

    // Past locked cell with freezes remaining allows freeze action
    if (isPast && accountabilityMode && !isCompleted && !isFrozen && streakFreezes > 0) {
      setFreezingCell({ habit, dateStr });
      return;
    }

    if (habit.trackingType === 'numeric') {
      setEditingNumericCell({
        habitId: habit.id,
        habitName: habit.name,
        dateStr,
        targetValue: habit.targetValue ?? 1,
        unit: habit.unit ?? '',
        currentValue: typeof val === 'number' ? val : 0,
      });
    } else {
      toggleHabitCompletion(habit.id, dateStr);
    }
  };

  const handleNumericSave = (value: number) => {
    if (editingNumericCell) {
      logNumericValue(editingNumericCell.habitId, editingNumericCell.dateStr, value);
      setEditingNumericCell(null);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-zinc-150 shadow-sm p-4 overflow-x-auto select-none scrollbar-thin">
      <div className="min-w-[800px]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {weekSpans.map((span) => (
                <th
                  key={span.week}
                  colSpan={span.cols}
                  className={`text-[10px] font-bold py-1 border-b text-center italic ${span.styles.text}`}
                  style={{ borderRight: '1px solid #f1f5f9' }}
                >
                  {span.label}
                </th>
              ))}
            </tr>
            
            <tr>
              {days.map((day) => {
                const style = WEEK_STYLES[day.weekNum as keyof typeof WEEK_STYLES] || WEEK_STYLES[5];
                const borderRightStyle = (day.day === 7 || day.day === 14 || day.day === 21 || day.day === 28) 
                  ? '2px solid #e2e8f0' 
                  : '1px solid #f1f5f9';
                
                return (
                  <th
                    key={day.day}
                    className={`text-[10px] font-bold py-1 text-center font-sans ${style.headerBg} ${style.text}`}
                    style={{ 
                      width: `${100 / totalDays}%`,
                      borderRight: borderRightStyle,
                      borderBottom: '1px solid #e2e8f0'
                    }}
                  >
                    {day.weekday}
                  </th>
                );
              })}
            </tr>

            <tr>
              {days.map((day) => {
                const style = WEEK_STYLES[day.weekNum as keyof typeof WEEK_STYLES] || WEEK_STYLES[5];
                const borderRightStyle = (day.day === 7 || day.day === 14 || day.day === 21 || day.day === 28) 
                  ? '2px solid #e2e8f0' 
                  : '1px solid #f1f5f9';
                
                return (
                  <th
                    key={day.day}
                    className={`text-[10px] font-bold py-1 text-center font-mono ${style.headerBg} ${style.text}`}
                    style={{ 
                      borderRight: borderRightStyle,
                      borderBottom: '2px solid #cbd5e1'
                    }}
                  >
                    {day.day}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 30 }).map((_, rowIndex) => {
              const habit = activeHabits[rowIndex];
              const isDimmed = zenMode && hoveredRowIndex !== null && hoveredRowIndex !== rowIndex;

              return (
                <tr 
                  key={rowIndex} 
                  onMouseEnter={() => setHoveredRowIndex(rowIndex)}
                  onMouseLeave={() => setHoveredRowIndex(null)}
                  className={`hover:bg-zinc-50/50 transition-all h-[36px] ${isDimmed ? 'opacity-25' : 'opacity-100'}`}
                >
                  {days.map((day) => {
                    const style = WEEK_STYLES[day.weekNum as keyof typeof WEEK_STYLES] || WEEK_STYLES[5];
                    const val = habit ? history[day.dateStr]?.[habit.id] : undefined;
                    
                    const isFuture = day.dateStr > todayStr;
                    const isBeforeCreated = habit ? day.dateStr < habit.createdAt : true;
                    const isPast = day.dateStr < todayStr;
                    const isScheduled = habit ? isDateScheduled(habit, day.dateStr) : false;
                    
                    const isCompleted = habit ? (
                      habit.type === 'negative'
                        ? (val === false || val === 0 || val === undefined) && isScheduled
                        : habit.trackingType === 'numeric'
                          ? typeof val === 'number' && val >= (habit.targetValue ?? 1)
                          : val === true
                    ) : false;

                    const isFrozen = val === 'frozen';
                    const isNegativeViolation = habit && habit.type === 'negative' && (val === true || (typeof val === 'number' && val > 0));

                    // Past locked day can still be frozen if not completed and freeze owned
                    const canFreeze = isPast && accountabilityMode && !isCompleted && !isFrozen && streakFreezes > 0 && isScheduled;
                    const isLocked = (isFuture || isBeforeCreated || !isScheduled || (accountabilityMode && isPast)) && !canFreeze;
                    
                    const borderRightStyle = (day.day === 7 || day.day === 14 || day.day === 21 || day.day === 28) 
                      ? '2px solid #e2e8f0' 
                      : '1px solid #f1f5f9';

                    return (
                      <td
                        key={day.day}
                        align="center"
                        className="py-1 border-b border-zinc-100"
                        style={{ 
                          borderRight: borderRightStyle,
                        }}
                      >
                        {habit ? (
                          isFrozen ? (
                            <div className="w-4 h-4 rounded border border-blue-200 bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
                              <Snowflake size={9} strokeWidth={3} />
                            </div>
                          ) : isNegativeViolation ? (
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleCellClick(habit, day.dateStr)}
                              className="w-4 h-4 rounded border border-rose-300 bg-rose-50 text-rose-500 flex items-center justify-center scale-105 shadow-sm cursor-pointer select-none"
                            >
                              <Skull size={9} strokeWidth={3} />
                            </button>
                          ) : habit.type === 'negative' && isPast && isScheduled ? (
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleCellClick(habit, day.dateStr)}
                              className="w-4 h-4 rounded border border-emerald-250 bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm cursor-pointer select-none"
                            >
                              <Shield size={9} strokeWidth={3} />
                            </button>
                          ) : habit.trackingType === 'numeric' && typeof val === 'number' && val > 0 && val < (habit.targetValue ?? 1) ? (
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleCellClick(habit, day.dateStr)}
                              className={`relative w-4 h-4 rounded border ${style.activeBorder} overflow-hidden cursor-pointer select-none flex items-center justify-center text-[7px] font-bold text-zinc-700 bg-white`}
                            >
                              <div 
                                className={`absolute left-0 bottom-0 top-0 ${style.barBg} transition-all`}
                                style={{ width: `${Math.min(100, Math.round((val / (habit.targetValue ?? 1)) * 100))}%` }}
                              />
                              <span className="z-10">{val}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleCellClick(habit, day.dateStr)}
                              className={`w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer select-none
                                ${isLocked 
                                  ? 'bg-zinc-50 border-zinc-150 opacity-30 cursor-not-allowed'
                                  : isCompleted
                                    ? `${style.checkBg} ${style.activeBorder} text-white scale-105 shadow-sm`
                                    : `bg-white border-zinc-300 ${style.hoverBg}`
                                }
                              `}
                            >
                              {isCompleted && <Check size={10} strokeWidth={4} />}
                            </button>
                          )
                        ) : (
                          <div className="w-4 h-4 rounded border border-zinc-200 bg-zinc-50/30 opacity-40" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Numeric Logging Dialog */}
      {editingNumericCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setEditingNumericCell(null)}
          />
          <div className="relative w-full max-w-xs bg-white border border-zinc-200 rounded-xl p-5 shadow-xl z-10 animate-scaleUp">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-bold text-zinc-900 truncate max-w-[200px]">Log {editingNumericCell.habitName}</h3>
                <p className="text-[9px] text-zinc-400 font-medium">Date: {editingNumericCell.dateStr}</p>
              </div>
              <button 
                onClick={() => setEditingNumericCell(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px] font-bold text-zinc-650">
                  <span>Progress</span>
                  <span>{editingNumericCell.currentValue} / {editingNumericCell.targetValue} {editingNumericCell.unit}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={editingNumericCell.targetValue}
                  step="0.1"
                  value={editingNumericCell.currentValue}
                  onChange={(e) => setEditingNumericCell(prev => prev ? { ...prev, currentValue: Number(e.target.value) } : null)}
                  className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={editingNumericCell.targetValue * 2}
                  step="0.1"
                  value={editingNumericCell.currentValue}
                  onChange={(e) => setEditingNumericCell(prev => prev ? { ...prev, currentValue: Number(e.target.value) } : null)}
                  className="w-20 bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1 text-xs text-zinc-800 text-center font-bold focus:outline-none"
                />
                <button
                  onClick={() => handleNumericSave(editingNumericCell.currentValue)}
                  className="flex-1 bg-zinc-950 hover:bg-zinc-850 text-white rounded text-xs py-1.5 font-bold shadow-sm transition-colors"
                >
                  Save Progress
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Freeze Confirmation Dialog */}
      {freezingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setFreezingCell(null)}
          />
          <div className="relative w-full max-w-xs bg-white border border-zinc-200 rounded-xl p-5 shadow-xl z-10 text-center flex flex-col gap-4 animate-scaleUp">
            <div className="mx-auto p-3 rounded-full bg-blue-50 text-blue-500 w-fit">
              <Snowflake size={24} className="animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900">Use Streak Freeze?</h3>
              <p className="text-[10px] text-zinc-500 mt-1">
                Apply 1 freeze to protect your streak for <strong>{freezingCell.habit.name}</strong> on {freezingCell.dateStr}?
              </p>
              <p className="text-[9px] text-zinc-400 mt-0.5">({streakFreezes} freezes remaining)</p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setFreezingCell(null)}
                className="flex-1 border border-zinc-200 hover:bg-zinc-50 text-zinc-650 rounded text-xs py-1.5 font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  useStreakFreeze(freezingCell.habit.id, freezingCell.dateStr);
                  setFreezingCell(null);
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs py-1.5 font-bold shadow-sm transition-colors"
              >
                Use Freeze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
