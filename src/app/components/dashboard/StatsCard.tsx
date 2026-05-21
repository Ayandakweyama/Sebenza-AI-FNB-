import React from 'react';
import { StatsCardProps } from './types';
import { 
  Send, 
  Calendar, 
  Eye, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Target, 
  Activity,
  Briefcase,
  MessageSquare,
  Clock,
  CheckCircle
} from 'lucide-react';

// Icon mapping for dynamic icon rendering
const iconMap = {
  Send,
  Calendar,
  Eye,
  TrendingUp,
  BarChart3,
  Users,
  Target,
  Activity,
  Briefcase,
  MessageSquare,
  Clock,
  CheckCircle
};

const colorClasses = {
  purple: { accent: 'text-purple-300', ring: 'group-hover:border-purple-400/30' },
  green: { accent: 'text-emerald-300', ring: 'group-hover:border-emerald-400/30' },
  blue: { accent: 'text-sky-300', ring: 'group-hover:border-sky-400/30' },
  yellow: { accent: 'text-amber-300', ring: 'group-hover:border-amber-400/30' },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  color = 'purple'
}) => {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 transition-all duration-300 hover:-translate-y-1 ${colorClasses[color].ring}`}
    >
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-purple-500/15 via-pink-500/8 to-blue-500/15 opacity-70 blur-xl pointer-events-none" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-300/75 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className={`text-xs mt-1 ${getChangeColorClass(change, color)}`}>
            {change}
          </p>
        </div>
        <div className={`${colorClasses[color].accent}`}>
          {(() => {
            const IconComponent = iconMap[icon as keyof typeof iconMap];
            return IconComponent ? <IconComponent className="w-8 h-8" /> : <div className="text-4xl">{icon}</div>;
          })()}
        </div>
      </div>
    </div>
  );
};

const getChangeColorClass = (change: string, color: string) => {
  if (change.includes('+') || change.includes('Above')) {
    return colorClasses[color as keyof typeof colorClasses]?.accent ?? 'text-slate-300/70';
  }
  return 'text-slate-300/60';
};
