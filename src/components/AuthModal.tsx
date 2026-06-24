import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { useHabits } from '../context/HabitContext';
import { X, Mail, Lock, ShieldCheck, RefreshCw, User, Calendar } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { mergeLocalDataToCloud } = useHabits();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setMessage({ type: 'error', text: 'Supabase credentials are not configured in your .env file.' });
      return;
    }

    if (!email.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Email and password are required.' });
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setMessage({ type: 'error', text: 'Full name is required for sign up.' });
        return;
      }
      const ageNum = parseInt(age, 10);
      if (isNaN(ageNum) || ageNum <= 0) {
        setMessage({ type: 'error', text: 'Please enter a valid age.' });
        return;
      }
    }

    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase!.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;

        if (data?.user) {
          setMessage({ type: 'success', text: 'Logged in successfully!' });
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else {
        const { data, error } = await supabase!.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: name.trim(),
              age: parseInt(age, 10),
            }
          }
        });

        if (error) throw error;

        if (data?.user) {
          await mergeLocalDataToCloud(data.user);
          setMessage({ type: 'success', text: 'Account registered and local data synced!' });
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Authentication failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-sm bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xl z-10 flex flex-col animate-scaleUp">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-100 mb-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-zinc-800" />
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
              {isLogin ? 'Account Login' : 'Forge Account'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {message && (
            <div className={`p-3 text-[10.5px] rounded-lg border font-bold leading-normal
              ${message.type === 'error' 
                ? 'bg-rose-50 border-rose-100 text-rose-600' 
                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Conditional Name and Age fields for SignUp */}
          {!isLogin && (
            <>
              {/* Full Name */}
              <div className="flex flex-col gap-1.5 animate-fadeIn">
                <label className="text-[10px] font-black text-zinc-550 uppercase tracking-wider">Full Name</label>
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 focus-within:border-zinc-950 focus-within:bg-white transition-colors">
                  <User size={14} className="text-zinc-400" />
                  <input
                    type="text"
                    placeholder="e.g. Raushan Singh"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs text-zinc-800 bg-transparent border-none focus:outline-none"
                  />
                </div>
              </div>

              {/* Age */}
              <div className="flex flex-col gap-1.5 animate-fadeIn">
                <label className="text-[10px] font-black text-zinc-555 uppercase tracking-wider">Age</label>
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 focus-within:border-zinc-950 focus-within:bg-white transition-colors">
                  <Calendar size={14} className="text-zinc-400" />
                  <input
                    type="number"
                    placeholder="e.g. 24"
                    min="1"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full text-xs text-zinc-800 bg-transparent border-none focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-550 uppercase tracking-wider">Email Address</label>
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 focus-within:border-zinc-950 focus-within:bg-white transition-colors">
              <Mail size={14} className="text-zinc-400" />
              <input
                type="email"
                placeholder="e.g. raushan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs text-zinc-800 bg-transparent border-none focus:outline-none"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-550 uppercase tracking-wider">Password</label>
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 focus-within:border-zinc-950 focus-within:bg-white transition-colors">
              <Lock size={14} className="text-zinc-400" />
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs text-zinc-800 bg-transparent border-none focus:outline-none"
              />
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-850 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading && <RefreshCw size={12} className="animate-spin" />}
            {isLogin ? 'Log In' : 'Sign Up & Sync Data'}
          </button>

          {/* Toggle Tab link */}
          <div className="text-center mt-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setMessage(null); }}
              className="text-[10.5px] font-bold text-zinc-500 hover:text-zinc-850 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
