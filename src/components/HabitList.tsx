import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { HabitCard } from './HabitCard';
import type { Habit, HabitCategory } from '../types';
import { calculateStreak } from '../utils/analytics';
import { Plus, Search, Filter, ArrowUpDown, ShieldAlert } from 'lucide-react';

interface HabitListProps {
  onAddClick: () => void;
  onEditClick: (habit: Habit) => void;
}

type FilterTab = 'active' | 'archived' | 'all' | HabitCategory;
type SortOption = 'created' | 'name' | 'streak';

export const HabitList: React.FC<HabitListProps> = ({ onAddClick, onEditClick }) => {
  const { habits, history } = useHabits();
  
  const [activeTab, setActiveTab] = useState<FilterTab>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created');

  // Filter habits
  const filteredHabits = habits.filter((habit) => {
    // 1. Search Query filter
    const matchesSearch = 
      habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      habit.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;

    // 2. Tab Filter
    if (activeTab === 'active') return !habit.archived;
    if (activeTab === 'archived') return habit.archived;
    if (activeTab === 'all') return true;
    
    // Otherwise category filter
    return habit.category === activeTab && !habit.archived;
  });

  // Sort habits
  const sortedHabits = [...filteredHabits].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'streak') {
      const streakA = calculateStreak(history, a);
      const streakB = calculateStreak(history, b);
      return streakB - streakA; // highest streak first
    }
    // Default: 'created' (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const activeCount = habits.filter(h => !h.archived).length;
  const isSlotsFull = activeCount >= 99;

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Search, Filter, Sort Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 backdrop-blur-md">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search habits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        {/* Sort & Action Slot Bar */}
        <div className="flex items-center gap-3 justify-between lg:justify-end">
          
          {/* Sorting */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={15} className="text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg text-xs py-2 px-3 focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="created">Newest Created</option>
              <option value="name">Alphabetical</option>
              <option value="streak">Longest Streak</option>
            </select>
          </div>

          {/* Slot limit indicator & add button */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Active Slots</span>
              <span className={`text-xs font-bold font-mono ${isSlotsFull ? 'text-rose-500' : 'text-zinc-300'}`}>
                {activeCount} / 99
              </span>
            </div>

            <button
              onClick={onAddClick}
              disabled={isSlotsFull}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:from-violet-500 hover:to-cyan-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-500/10 cursor-pointer"
            >
              <Plus size={16} /> Add Habit
            </button>
          </div>

        </div>
      </div>

      {/* Slots full Alert */}
      {isSlotsFull && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs leading-normal">
          <ShieldAlert size={16} className="text-amber-400 shrink-0" />
          <span><strong>Slots Full:</strong> You are tracking 99 habits simultaneously. Archive or delete existing habits to unlock new slots.</span>
        </div>
      )}

      {/* Tabs list (Category and archive filters) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { id: 'active', label: 'Active' },
          { id: 'all', label: 'All Habits' },
          { id: 'health', label: 'Health' },
          { id: 'work', label: 'Work' },
          { id: 'mind', label: 'Mindfulness' },
          { id: 'finance', label: 'Finance' },
          { id: 'archived', label: 'Archived' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as FilterTab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer
              ${activeTab === tab.id
                ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-bold'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Habits Grid Stack */}
      {sortedHabits.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sortedHabits.map((habit) => (
            <HabitCard 
              key={habit.id} 
              habit={habit} 
              onEdit={onEditClick} 
            />
          ))}
        </div>
      ) : (
        <div className="w-full py-16 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10 text-center">
          <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
            <Filter size={20} />
          </div>
          <h3 className="text-base font-bold text-zinc-300">No habits found</h3>
          <p className="text-xs text-zinc-500 max-w-xs mt-1">
            {searchQuery 
              ? 'Try modifying your search query or switching tabs.' 
              : 'Add your first habit using the "Add Habit" button above!'}
          </p>
        </div>
      )}

    </div>
  );
};
