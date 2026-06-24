import React, { useEffect, useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { Sparkles, Trophy } from 'lucide-react';

interface Particle {
  id: number;
  left: string;
  color: string;
  delay: string;
  size: string;
  duration: string;
}

export const LevelUpModal: React.FC = () => {
  const { levelInfo, triggerLevelUp, setTriggerLevelUp } = useHabits();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (triggerLevelUp) {
      // Generate 60 random confetti particles
      const colors = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
      const newParticles: Particle[] = Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: `${Math.random() * 2}s`,
        size: `${Math.random() * 6 + 6}px`,
        duration: `${Math.random() * 1.5 + 2}s`
      }));
      setParticles(newParticles);
      
      // Auto close after 6 seconds if not closed manually
      const timer = setTimeout(() => {
        setTriggerLevelUp(false);
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      setParticles([]);
    }
  }, [triggerLevelUp]);

  if (!triggerLevelUp) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Background Dim Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md cursor-pointer animate-fade-in"
        onClick={() => setTriggerLevelUp(false)}
      />

      {/* Confetti Spawner */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: p.left,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
          }}
        />
      ))}

      {/* Level-Up Card Modal */}
      <div className="relative w-full max-w-sm bg-gradient-to-b from-zinc-900 to-zinc-950 border border-violet-500/40 rounded-2xl p-6 text-center shadow-2xl z-10 animate-bounce-slow">
        
        {/* Glow behind */}
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-2xl blur opacity-30 animate-pulse pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          
          {/* Animated level insignia */}
          <div className="h-20 w-20 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20 animate-spin-slow">
            <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center text-3xl font-black text-white font-mono">
              {levelInfo.level}
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest flex items-center justify-center gap-1">
              <Sparkles size={12} className="animate-spin-slow" /> LEVEL UP! <Sparkles size={12} className="animate-spin-slow" />
            </span>
            <h2 className="text-2xl font-black text-zinc-50 leading-tight">
              Congratulations!
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              You've forged habits and reached new heights.
            </p>
          </div>

          <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center mt-1">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">New Title Unlocked</span>
            <span className="text-sm font-bold text-violet-300 flex items-center gap-1 mt-0.5">
              <Trophy size={14} className="text-amber-500" /> {levelInfo.title}
            </span>
          </div>

          <button
            onClick={() => setTriggerLevelUp(false)}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-bold text-xs hover:from-violet-500 hover:to-fuchsia-400 transition-all shadow-md active:scale-95 cursor-pointer mt-2"
          >
            Continue Journey
          </button>
        </div>

      </div>
    </div>
  );
};
