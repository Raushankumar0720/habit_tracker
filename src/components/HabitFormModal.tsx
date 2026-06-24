import React, { useState, useEffect } from 'react';
import type { Habit, HabitCategory, HabitFrequency, HabitType, TrackingType } from '../types';
import { useHabits } from '../context/HabitContext';
import { AVAILABLE_ICONS, HabitIcon } from './HabitIcon';
import { X, Sparkles, Sliders } from 'lucide-react';

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitToEdit?: Habit | null;
}

const CATEGORY_DETAILS: { id: HabitCategory; label: string; bg: string; text: string; border: string }[] = [
  { id: 'health', label: 'Health', bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-200' },
  { id: 'work', label: 'Work', bg: 'bg-violet-500/10', text: 'text-violet-600', border: 'border-violet-200' },
  { id: 'mind', label: 'Mind', bg: 'bg-cyan-500/10', text: 'text-cyan-600', border: 'border-cyan-200' },
  { id: 'finance', label: 'Finance', bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-200' },
  { id: 'custom', label: 'Custom', bg: 'bg-zinc-500/10', text: 'text-zinc-650', border: 'border-zinc-200' },
];

const FREQUENCIES: { id: HabitFrequency; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly (1x)' },
  { id: '3x-week', label: '3x a Week' },
  { id: 'weekends', label: 'Weekends' },
  { id: 'monthly', label: 'Monthly' },
];

export const HabitFormModal: React.FC<HabitFormModalProps> = ({ isOpen, onClose, habitToEdit }) => {
  const { addHabit, editHabit } = useHabits();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('health');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [type, setType] = useState<HabitType>('positive');
  const [trackingType, setTrackingType] = useState<TrackingType>('binary');
  const [targetValue, setTargetValue] = useState<number>(3);
  const [unit, setUnit] = useState<string>('L');
  const [icon, setIcon] = useState('Brain');
  const [error, setError] = useState('');

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setDescription(habitToEdit.description);
      setCategory(habitToEdit.category);
      setFrequency(habitToEdit.frequency);
      setType(habitToEdit.type || 'positive');
      setTrackingType(habitToEdit.trackingType || 'binary');
      setTargetValue(habitToEdit.targetValue ?? 3);
      setUnit(habitToEdit.unit ?? 'L');
      setIcon(habitToEdit.icon);
    } else {
      setName('');
      setDescription('');
      setCategory('health');
      setFrequency('daily');
      setType('positive');
      setTrackingType('binary');
      setTargetValue(3);
      setUnit('L');
      setIcon('Brain');
    }
    setError('');
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Habit name is required.');
      return;
    }

    if (habitToEdit) {
      editHabit(
        habitToEdit.id,
        name.trim(),
        description.trim(),
        category,
        frequency,
        type,
        trackingType,
        icon,
        80, // goalPercent default
        trackingType === 'numeric' ? targetValue : undefined,
        trackingType === 'numeric' ? unit.trim() : undefined
      );
    } else {
      addHabit(
        name.trim(),
        description.trim(),
        category,
        frequency,
        type,
        trackingType,
        icon,
        80,
        trackingType === 'numeric' ? targetValue : undefined,
        trackingType === 'numeric' ? unit.trim() : undefined
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xl z-10 overflow-y-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-zinc-800 animate-pulse" />
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">
              {habitToEdit ? 'Edit Habit Settings' : 'Forge New Routine'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-100 text-rose-600 rounded-lg font-bold">
              {error}
            </div>
          )}

          {/* Habit Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Habit Name *</label>
            <input
              type="text"
              maxLength={50}
              placeholder="e.g., Lift Weights, Drink Water, Avoid Junk Food"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-450 focus:outline-none focus:border-zinc-900 transition-colors"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Description</label>
            <textarea
              maxLength={150}
              placeholder="Details of this routine... (Max 150 chars)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-450 focus:outline-none focus:border-zinc-900 transition-colors resize-none"
            />
          </div>

          {/* Category selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Category</label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORY_DETAILS.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`py-2 rounded-lg border text-center text-[10px] font-bold transition-all cursor-pointer
                      ${isSelected 
                        ? `${cat.bg} ${cat.text} border-zinc-900 ring-1 ring-zinc-900`
                        : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-zinc-800'
                      }
                    `}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frequency & Type (Positive/Negative) Grid */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Frequency Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-xs font-bold text-zinc-700 focus:outline-none cursor-pointer"
              >
                {FREQUENCIES.map((freq) => (
                  <option key={freq.id} value={freq.id}>{freq.label}</option>
                ))}
              </select>
            </div>

            {/* Type Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Habit Type</label>
              <div className="grid grid-cols-2 gap-2 h-full">
                {[
                  { id: 'positive', label: 'Positive', active: 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-emerald-400' },
                  { id: 'negative', label: 'Vice / Negative', active: 'bg-rose-50 text-rose-700 border-rose-300 ring-rose-400' }
                ].map((t) => {
                  const isSelected = type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id as HabitType)}
                      className={`rounded-lg border text-center text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center py-2.5
                        ${isSelected
                          ? `${t.active} ring-1`
                          : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-zinc-800'
                        }
                      `}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Tracking Type Grid */}
          <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Tracking Type</label>
              <div className="flex items-center gap-2">
                {['binary', 'numeric'].map((track) => (
                  <button
                    key={track}
                    type="button"
                    onClick={() => setTrackingType(track as TrackingType)}
                    className={`px-3 py-1 border rounded text-[10px] font-bold transition-all cursor-pointer
                      ${trackingType === track
                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-zinc-700'
                      }
                    `}
                  >
                    {track === 'binary' ? 'Checkbox' : 'Numeric Value'}
                  </button>
                ))}
              </div>
            </div>

            {/* Numeric Sub-settings */}
            {trackingType === 'numeric' && (
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 border border-zinc-150 rounded-xl p-3 mt-1.5 animate-fadeIn">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase">Target Goal</label>
                  <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded px-2.5 py-1">
                    <Sliders size={12} className="text-zinc-400" />
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={targetValue}
                      onChange={(e) => setTargetValue(Number(e.target.value))}
                      className="w-full text-xs text-zinc-800 font-bold bg-transparent border-none focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase">Unit of Measure</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. L, pages, hours"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full text-xs text-zinc-800 font-bold bg-white border border-zinc-200 rounded px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Icon Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Select Avatar / Icon</label>
            <div className="grid grid-cols-10 gap-1.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 max-h-32 overflow-y-auto">
              {AVAILABLE_ICONS.map((iconName) => {
                const isSelected = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`aspect-square rounded-md flex items-center justify-center transition-all cursor-pointer
                      ${isSelected 
                        ? 'bg-zinc-950 text-white scale-110 shadow-md' 
                        : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200'
                      }
                    `}
                    title={iconName}
                  >
                    <HabitIcon name={iconName} size={15} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 justify-end mt-2 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[10px] font-bold rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-all cursor-pointer animate-pulse-once"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-[10px] font-bold rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {habitToEdit ? 'Apply Changes' : 'Forge Routine'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
