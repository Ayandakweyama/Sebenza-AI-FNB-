import React, { useState, useEffect } from 'react';
import { useDashboard } from './context/DashboardContext';

export const MobileGreeting: React.FC = () => {
  const { user } = useDashboard();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="md:hidden pt-20 px-4 py-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800/50">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
          {getTimeBasedGreeting()}{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-slate-300 text-base mb-3">
          Here's what's happening with your job search today.
        </p>

        <div className="flex flex-col items-center text-center">
          <div className="text-slate-400 text-sm mb-1">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="text-purple-400 font-mono text-lg">
            {currentTime.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
