import React from 'react';
import { StatsCardProps } from './types';

const colorClasses = {
  purple: 'border-purple-500 hover:border-purple-500 text-purple-400',
  green: 'border-green-500 hover:border-green-500 text-green-400',
  blue: 'border-blue-500 hover:border-blue-500 text-blue-400',
  yellow: 'border-yellow-500 hover:border-yellow-500 text-yellow-400',
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  color = 'purple'
}) => {
  return (
    <div className={`bg-slate-800 p-6 rounded-xl border border-slate-700 transition-colors ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-300 text-sm">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          <p className={`text-xs mt-1 ${getChangeColorClass(change, color)}`}>
            {change}
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
};

const getChangeColorClass = (change: string, color: string) => {
  if (change.includes('+') || change.includes('Above')) {
    return `text-${color}-400`;
  }
  return 'text-slate-400';
};
