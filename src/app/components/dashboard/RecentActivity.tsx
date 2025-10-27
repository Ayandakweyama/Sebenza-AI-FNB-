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

export const RecentActivity: React.FC<RecentActivityProps> = ({
  title,
  icon,
  items,
  showStatus = false,
  showType = false
}) => {
  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-3 text-purple-400">
          {(() => {
            const IconComponent = iconMap[icon as keyof typeof iconMap];
            return IconComponent ? <IconComponent className="w-5 h-5" /> : <span className="text-xl">{icon}</span>;
          })()}
        </span>
        {title}
      </h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm"
          >
            <div className="truncate pr-2">
              <p className="font-medium truncate">{item.position}</p>
              <p className="text-xs text-slate-300 truncate">{item.company}</p>
            </div>
            <div className="text-right whitespace-nowrap ml-2">
              {showStatus && item.status && (
                <p className={`text-xs text-${item.color}-400`}>{item.status}</p>
              )}
              {showType && item.type && (
                <p className="text-xs text-green-400">{item.type}</p>
              )}
              <p className="text-xs text-slate-400">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
