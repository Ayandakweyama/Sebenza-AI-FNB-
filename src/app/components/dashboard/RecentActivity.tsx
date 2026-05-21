import React from 'react';
import { ActivityItem, RecentActivityProps } from './types';
import { 
  FileText, 
  Target, 
  Calendar, 
  Send, 
  Eye, 
  TrendingUp,
  Users,
  Briefcase,
  MessageSquare,
  Clock,
  CheckCircle,
  Activity
} from 'lucide-react';

// Icon mapping for dynamic icon rendering
const iconMap = {
  FileText,
  Target,
  Calendar,
  Send,
  Eye,
  TrendingUp,
  Users,
  Briefcase,
  MessageSquare,
  Clock,
  CheckCircle,
  Activity
};

const statusColorClasses: Record<string, string> = {
  green: 'text-emerald-300',
  yellow: 'text-amber-300',
  blue: 'text-sky-300',
  purple: 'text-purple-300',
  pink: 'text-pink-300',
};

export const RecentActivity: React.FC<RecentActivityProps> = ({
  title,
  icon,
  items,
  showStatus = false,
  showType = false
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 shadow-[0_0_60px_rgba(168,85,247,0.08)]">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-purple-500/15 via-pink-500/8 to-blue-500/15 opacity-70 blur-xl pointer-events-none" />
      <h3 className="relative text-lg font-semibold mb-4 flex items-center text-white">
        <span className="mr-3 text-purple-300">
          {(() => {
            const IconComponent = iconMap[icon as keyof typeof iconMap];
            return IconComponent ? <IconComponent className="w-5 h-5" /> : <span className="text-xl">{icon}</span>;
          })()}
        </span>
        {title}
      </h3>
      <div className="relative space-y-2.5">
        {items.map((item, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] transition-colors text-sm"
          >
            <div className="truncate pr-2">
              <p className="font-medium truncate text-white">{item.position}</p>
              <p className="text-xs text-slate-300/75 truncate">{item.company}</p>
            </div>
            <div className="text-right whitespace-nowrap ml-2">
              {showStatus && item.status && (
                <p className={`text-xs ${statusColorClasses[item.color] ?? 'text-slate-300/70'}`}>{item.status}</p>
              )}
              {showType && item.type && (
                <p className="text-xs text-emerald-300">{item.type}</p>
              )}
              <p className="text-xs text-slate-300/55">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
