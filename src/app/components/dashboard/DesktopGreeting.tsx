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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              {getTimeBasedGreeting()}{user?.firstName ? `, ${user.firstName}` : ''}!
            </h1>
            <p className="text-slate-300 text-base md:text-lg mb-2">
              Here's what's happening with your job search today.
            </p>
          </div>
          
          <div className="flex flex-col items-start md:items-end text-left md:text-right">
            <div className="text-slate-400 text-sm mb-1">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-purple-400 font-mono text-base md:text-lg">
              {currentTime.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>
        </div>

        {/* Progress indicator - hidden on mobile for cleaner look */}
        <div className="hidden md:block w-full bg-slate-800/50 rounded-full h-1 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};
