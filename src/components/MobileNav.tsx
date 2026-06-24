import React from 'react';
import { ListTodo, BarChart3 } from 'lucide-react';

interface MobileNavProps {
  activeView: 'habits' | 'analytics';
  setActiveView: (view: 'habits' | 'analytics') => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeView, setActiveView }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-t border-zinc-800/80 py-2.5 px-6 flex items-center justify-around shadow-2xl">
      
      {/* Habits View Toggle */}
      <button
        onClick={() => setActiveView('habits')}
        className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer
          ${activeView === 'habits'
            ? 'text-violet-400 bg-violet-500/5'
            : 'text-zinc-500 hover:text-zinc-300'
          }
        `}
      >
        <ListTodo size={20} className={activeView === 'habits' ? 'scale-110 transition-transform' : ''} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Habits</span>
      </button>

      {/* Analytics View Toggle */}
      <button
        onClick={() => setActiveView('analytics')}
        className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer
          ${activeView === 'analytics'
            ? 'text-violet-400 bg-violet-500/5'
            : 'text-zinc-500 hover:text-zinc-300'
          }
        `}
      >
        <BarChart3 size={20} className={activeView === 'analytics' ? 'scale-110 transition-transform' : ''} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Stats</span>
      </button>

    </div>
  );
};
