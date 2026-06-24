import React, { useState } from 'react';
import { BookOpen, X, Edit2, Calendar } from 'lucide-react';
import { formatDate } from '../utils/analytics';
import { useHabits } from '../context/HabitContext';

interface WeeklyJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklyJournalModal: React.FC<WeeklyJournalModalProps> = ({ isOpen, onClose }) => {
  const { reflections, saveReflection } = useHabits();

  const [currentText, setCurrentText] = useState('');
  const [editingWeek, setEditingWeek] = useState<string | null>(null);

  if (!isOpen) return null;

  const today = new Date();
  const getSundayOfCurrentWeek = () => {
    const d = new Date(today);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return formatDate(d);
  };

  const currentWeekSunday = getSundayOfCurrentWeek();
  const existingReflection = reflections.find(r => r.weekOf === currentWeekSunday);

  const handleSave = () => {
    if (!currentText.trim()) return;
    saveReflection(currentWeekSunday, currentText.trim());
    setCurrentText('');
    setEditingWeek(null);
  };

  const startEditing = (reflection: { weekOf: string; text: string }) => {
    setCurrentText(reflection.text);
    setEditingWeek(reflection.weekOf);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <BookOpen size={18} className="text-zinc-800" />
            <div>
              <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">Weekly Reflection Journal</h2>
              <p className="text-[10px] text-zinc-500 font-medium">Sunday check-in & review logs</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* New Reflection Entry */}
          <div className="bg-zinc-50 border border-zinc-200/60 rounded-xl p-4.5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-zinc-600" />
              <span className="text-xs font-bold text-zinc-800">
                Week of {currentWeekSunday} (Current Week)
              </span>
            </div>

            {existingReflection && editingWeek !== currentWeekSunday ? (
              <div className="bg-white border border-zinc-100 rounded-lg p-3.5">
                <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                  {existingReflection.text}
                </p>
                <button
                  onClick={() => startEditing(existingReflection)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 hover:border-zinc-300 text-[10px] font-bold text-zinc-850 rounded-lg bg-white shadow-sm transition-all"
                >
                  <Edit2 size={10} />
                  Edit Reflection
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Reflect on your performance this week. What habits did you struggle with? What strategies worked, and how can you optimize your discipline for next week?
                </p>
                <textarea
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  placeholder="Type your weekly reflection notes here..."
                  rows={4}
                  className="w-full bg-white border border-zinc-200 rounded-lg p-3 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors resize-none"
                />
                <div className="flex items-center gap-2 justify-end">
                  {editingWeek === currentWeekSunday && (
                    <button
                      onClick={() => setEditingWeek(null)}
                      className="px-3 py-1.5 border border-zinc-200 text-[10px] font-bold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!currentText.trim()}
                    className="px-4 py-1.5 bg-zinc-905 hover:bg-zinc-850 disabled:opacity-50 text-[10px] font-bold text-white rounded-lg transition-colors shadow-sm"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Historical Logs */}
          <div>
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Past Reflections</h3>
            {reflections.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/30">
                <BookOpen size={24} className="text-zinc-300 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Your journal is currently empty.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {reflections.map((ref) => (
                  <div 
                    key={ref.weekOf} 
                    className="border border-zinc-150 rounded-xl p-4 bg-white hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-50">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        <span className="text-[11px] font-bold text-zinc-900">Week of {ref.weekOf}</span>
                      </div>
                      <span className="text-[9px] text-zinc-400">
                        {new Date(ref.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-650 leading-relaxed whitespace-pre-wrap">
                      {ref.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
