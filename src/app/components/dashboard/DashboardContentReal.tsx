import React, { useState, useEffect } from 'react';
import { ProfileProgress } from './ProfileProgress';
import { useDashboard } from './context/DashboardContext';
import { useIsMobile } from '../../../hooks/useIsMobile';
import '../../../styles/scrollbar.css';

export const DashboardContent: React.FC = () => {
  const { user } = useDashboard();
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Mobile detection
  const isMobile = useIsMobile();

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
    <div className="flex-1 pt-0 md:pt-12 px-4 md:px-8 pb-8 h-[calc(100vh-5rem)] md:h-[calc(100vh-5rem)] relative overflow-y-auto scrollbar-thin">
      {/* Animated background elements - reduced on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 md:-top-40 -right-20 md:-right-40 w-40 md:w-80 h-40 md:h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 md:-bottom-40 -left-20 md:-left-40 w-40 md:w-80 h-40 md:h-80 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="hidden md:block absolute top-1/2 left-1/2 w-60 h-60 bg-blue-500/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Enhanced Header Section - Hidden on mobile, shown on desktop */}
        <div className={`hidden md:block mb-6 md:mb-8 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
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
        
        {/* Profile Progress Section */}
        <div className={`mb-6 md:mb-8 transition-all ${
          isMobile ? 'duration-200' : 'duration-1000 delay-200'
        } transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <ProfileProgress />
        </div>

      </div>
    </div>
  );
};
