import React from 'react';
import { Award, Star, Zap, Trophy, Clock, BookOpen } from 'lucide-react';

interface AchievementBadgeProps {
  type: 'streak' | 'focus' | 'completion' | 'journal' | 'early' | 'custom';
  label: string;
  value?: string | number;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  icon?: React.ReactNode;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ 
  type, 
  label, 
  value,
  color = 'blue',
  icon 
}) => {
  // Define colors
  const colorClasses = {
    blue: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    green: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    yellow: 'bg-amber-50 border-amber-100 text-amber-600',
    purple: 'bg-purple-50 border-purple-100 text-purple-600',
    red: 'bg-rose-50 border-rose-100 text-rose-600'
  };

  // Define default icons based on type
  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'streak':
        return <Zap size={16} />;
      case 'focus':
        return <Clock size={16} />;
      case 'completion':
        return <Trophy size={16} />;
      case 'journal':
        return <BookOpen size={16} />;
      case 'early':
        return <Star size={16} />;
      default:
        return <Award size={16} />;
    }
  };

  return (
    <div className={`p-2 rounded-lg border flex items-center ${colorClasses[color]}`}>
      <div className="mr-1">
        {getIcon()}
      </div>
      <span className="text-sm">{label} {value && <span className="font-bold">{value}</span>}</span>
    </div>
  );
};

export default AchievementBadge;
