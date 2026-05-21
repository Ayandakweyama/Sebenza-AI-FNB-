import React, { useState, useEffect } from 'react';
import { useDashboard } from './context/DashboardContext';

export const DesktopGreeting: React.FC = () => {
  const { user } = useDashboard();
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setIsVisible(true);
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
    <div className={`hidden md:block px-4 md:px-8 pt-8 pb-4 transition-all duration-1000 transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    }`}>
      <div className="max-w-7xl mx-auto">
        <div
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl px-6 py-6 shadow-[0_0_70px_rgba(168,85,247,0.10)]"
        >
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-blue-500/20 opacity-70 blur-xl pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                <span className="bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent">
                  {getTimeBasedGreeting()}{user?.firstName ? `, ${user.firstName}` : ''}!
                </span>
              </h1>
              <p className="mt-2 text-slate-300/85 text-base md:text-lg">
                Here&apos;s what&apos;s happening with your job search today.
              </p>
            </div>
            
            <div className="flex flex-col items-start lg:items-end text-left lg:text-right">
              <div className="text-slate-300/70 text-sm">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="mt-1 text-purple-300 font-mono text-base md:text-lg">
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
    </div>
  );
};
