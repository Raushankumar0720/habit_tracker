import React from 'react';
import { useHabits } from '../context/HabitContext';
import { isHabitCompletedOnDate, formatDate } from '../utils/analytics';
import { Sun, Award, Shield, Target, Sparkles } from 'lucide-react';

interface AchievementItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progressText: string;
  progressPercent: number;
}

export const AchievementWidget: React.FC = () => {
  const { habits, history, totalCompletions } = useHabits();

  // 1. Century Club (100 total completions)
  const centuryClubUnlocked = totalCompletions >= 100;
  const centuryClubProgress = Math.min(100, Math.round((totalCompletions / 100) * 100));

  // 2. Early Bird (Wake Up Early completed 5 times)
  const wakeUpEarlyHabit = habits.find(h => h.id === 'habit-6');
  let wakeUpEarlyCompletions = 0;
  if (wakeUpEarlyHabit) {
    for (const dateStr in history) {
      if (history[dateStr]?.[wakeUpEarlyHabit.id] === true) {
        wakeUpEarlyCompletions++;
      }
    }
  }
  const earlyBirdUnlocked = wakeUpEarlyCompletions >= 5;
  const earlyBirdProgress = Math.min(100, Math.round((wakeUpEarlyCompletions / 5) * 100));

  // 3. Perfect Week (7 consecutive days of 100% positive habit completions)
  // Let's compute if there is any 7-day window where completion rate was 100%
  let perfectWeekUnlocked = false;
  const today = new Date();
  
  // Let's check last 30 days
  let maxConsecutivePerfectDays = 0;
  let currentConsecutivePerfectDays = 0;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);
    
    // Check positive active habits on this day
    const positiveActiveHabits = habits.filter(
      h => h.createdAt <= dateStr && !h.archived && h.type === 'positive'
    );
    
    if (positiveActiveHabits.length === 0) {
      continue;
    }

    const dayData = history[dateStr];
    const allCompleted = dayData ? positiveActiveHabits.every(h => {
      const val = dayData[h.id];
      return isHabitCompletedOnDate(h, val);
    }) : false;

    if (allCompleted) {
      currentConsecutivePerfectDays++;
      if (currentConsecutivePerfectDays > maxConsecutivePerfectDays) {
        maxConsecutivePerfectDays = currentConsecutivePerfectDays;
      }
    } else {
      currentConsecutivePerfectDays = 0;
    }
  }

  perfectWeekUnlocked = maxConsecutivePerfectDays >= 7;
  const perfectWeekProgress = Math.min(100, Math.round((maxConsecutivePerfectDays / 7) * 100));

  // 4. Vice Crusher (7 consecutive days of no negative habit checks)
  let viceCrusherUnlocked = false;
  let maxConsecutiveViceFreeDays = 0;
  let currentConsecutiveViceFreeDays = 0;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);

    const negativeActiveHabits = habits.filter(
      h => h.createdAt <= dateStr && !h.archived && h.type === 'negative'
    );

    if (negativeActiveHabits.length === 0) {
      // If no vices are tracked, let's treat it as vice-free
      currentConsecutiveViceFreeDays++;
      if (currentConsecutiveViceFreeDays > maxConsecutiveViceFreeDays) {
        maxConsecutiveViceFreeDays = currentConsecutiveViceFreeDays;
      }
      continue;
    }

    const dayData = history[dateStr];
    // Avoided all vices on this day if none of them are true/positive numeric
    const noVicesChecked = dayData ? negativeActiveHabits.every(h => {
      const val = dayData[h.id];
      return val !== true && !(typeof val === 'number' && val > 0);
    }) : true;

    if (noVicesChecked) {
      currentConsecutiveViceFreeDays++;
      if (currentConsecutiveViceFreeDays > maxConsecutiveViceFreeDays) {
        maxConsecutiveViceFreeDays = currentConsecutiveViceFreeDays;
      }
    } else {
      currentConsecutiveViceFreeDays = 0;
    }
  }

  viceCrusherUnlocked = maxConsecutiveViceFreeDays >= 7;
  const viceCrusherProgress = Math.min(100, Math.round((maxConsecutiveViceFreeDays / 7) * 100));

  const items: AchievementItem[] = [
    {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Complete the "Wake Up Early" habit 5 times.',
      icon: <Sun size={20} className={earlyBirdUnlocked ? 'text-amber-500' : 'text-zinc-400'} />,
      unlocked: earlyBirdUnlocked,
      progressText: `${wakeUpEarlyCompletions} / 5`,
      progressPercent: earlyBirdProgress,
    },
    {
      id: 'perfect_week',
      name: 'Perfect Week',
      description: 'Complete 100% of positive habits for 7 consecutive days.',
      icon: <Award size={20} className={perfectWeekUnlocked ? 'text-emerald-500' : 'text-zinc-400'} />,
      unlocked: perfectWeekUnlocked,
      progressText: `${maxConsecutivePerfectDays} / 7 days`,
      progressPercent: perfectWeekProgress,
    },
    {
      id: 'vice_crusher',
      name: 'Vice Crusher',
      description: 'Avoid all negative habits for 7 consecutive days.',
      icon: <Shield size={20} className={viceCrusherUnlocked ? 'text-blue-500' : 'text-zinc-400'} />,
      unlocked: viceCrusherUnlocked,
      progressText: `${maxConsecutiveViceFreeDays} / 7 days`,
      progressPercent: viceCrusherProgress,
    },
    {
      id: 'century_club',
      name: 'Century Club',
      description: 'Reach 100 total habit completion counts.',
      icon: <Sparkles size={20} className={centuryClubUnlocked ? 'text-violet-500' : 'text-zinc-400'} />,
      unlocked: centuryClubUnlocked,
      progressText: `${totalCompletions} / 100`,
      progressPercent: centuryClubProgress,
    },
  ];

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Target size={18} className="text-zinc-700" />
        <h2 className="text-sm font-bold text-zinc-950 tracking-tight uppercase">Milestones & Achievements</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {items.map((item) => (
          <div 
            key={item.id} 
            className={`relative flex flex-col justify-between border rounded-xl p-3.5 transition-all
              ${item.unlocked 
                ? 'bg-zinc-50 border-zinc-200/80 shadow-sm' 
                : 'bg-zinc-50/40 border-zinc-100 opacity-75'
              }`}
          >
            {/* Badge Status */}
            <div className="absolute top-3 right-3">
              {item.unlocked ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-zinc-900 text-white rounded-md">
                  UNLOCKED
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-zinc-200 text-zinc-600 rounded-md">
                  LOCKED
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <div className={`p-2 rounded-lg flex items-center justify-center h-fit
                ${item.unlocked 
                  ? 'bg-white border border-zinc-100 shadow-sm' 
                  : 'bg-zinc-100'
                }`}
              >
                {item.icon}
              </div>
              <div className="flex-1 pr-14">
                <h3 className="text-xs font-bold text-zinc-900 mb-0.5">{item.name}</h3>
                <p className="text-[10px] text-zinc-500 leading-normal">{item.description}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3.5">
              <div className="flex justify-between items-center text-[9px] text-zinc-500 font-medium mb-1">
                <span>Progress</span>
                <span className="font-bold text-zinc-800">{item.progressText}</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-200/60 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full
                    ${item.unlocked ? 'bg-zinc-900' : 'bg-zinc-400'}`}
                  style={{ width: `${item.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
