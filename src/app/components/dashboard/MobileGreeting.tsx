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
    <div className="md:hidden pt-20 px-4 py-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl px-5 py-6 shadow-[0_0_60px_rgba(168,85,247,0.10)]">
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-blue-500/20 opacity-70 blur-xl pointer-events-none" />
        <div className="relative flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-white leading-tight">
            <span className="bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent">
              {getTimeBasedGreeting()}{user?.firstName ? `, ${user.firstName}` : ''}!
            </span>
          </h1>
          <p className="mt-2 text-slate-300/85 text-base">
            Here&apos;s what&apos;s happening with your job search today.
          </p>

          <div className="mt-4 flex flex-col items-center text-center">
            <div className="text-slate-300/70 text-sm">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="mt-1 text-purple-300 font-mono text-lg">
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
    </div>
  );
};
