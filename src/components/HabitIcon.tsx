import React from 'react';
import * as Icons from 'lucide-react';

interface HabitIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const HabitIcon: React.FC<HabitIconProps> = ({ name, className, size }) => {
  const IconComponent = (Icons as any)[name] || Icons.Sparkles;
  return <IconComponent className={className} size={size} />;
};

export const AVAILABLE_ICONS = [
  'Brain',
  'Dumbbell',
  'BookOpen',
  'Code',
  'Sparkles',
  'Flame',
  'Target',
  'Heart',
  'Coffee',
  'Wallet',
  'Briefcase',
  'Compass',
  'GraduationCap',
  'Music',
  'Smile',
  'Sun',
  'Moon',
  'TreePine',
  'Activity',
  'Clock'
];
