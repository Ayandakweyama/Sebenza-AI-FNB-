import React, { useState, useEffect } from 'react';
import { StatsCard } from './StatsCard';
import { RecentActivity } from './RecentActivity';
import { statsCards, recentApplications, upcomingInterviews } from './constants';
import { useDashboard } from './context/DashboardContext';

export const DashboardContent: React.FC = () => {
  const { user, setChatbotOpen, setSidebarCollapsed } = useDashboard();
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
    <div className="flex-1 pt-12 px-8 pb-8 overflow-y-auto h-[calc(100vh-5rem)] relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-blue-500/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Enhanced Header Section */}
        <div className={`mb-8 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                {getTimeBasedGreeting()}{user?.firstName ? `, ${user.firstName}` : ''}! ✨
              </h1>
              <p className="text-slate-300 text-lg mb-2">
                Here's what's happening with your job search today.
              </p>
            </div>
            
            <div className="flex flex-col items-end text-right">
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

          {/* Progress indicator */}
          <div className="w-full bg-slate-800/50 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Enhanced Dashboard Stats */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transition-all duration-1000 delay-200 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className="transform transition-all duration-500 hover:scale-105 hover:-translate-y-2"
              style={{ 
                animationDelay: `${300 + index * 100}ms`,
                animation: isVisible ? 'slideInUp 0.6s ease-out forwards' : ''
              }}
            >
              <StatsCard
                title={stat.title}
                value={stat.value}
                change={stat.change}
                icon={stat.icon}
                color={stat.color as any}
              />
            </div>
          ))}
        </div>
        
        {/* Enhanced Recent Activity Section */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-1000 delay-400 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="transform transition-all duration-500 hover:scale-[1.02] group">
            <div className="relative overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <RecentActivity
                title="Recent Applications"
                icon="📋"
                items={recentApplications}
                showStatus
              />
            </div>
          </div>
          
          <div className="transform transition-all duration-500 hover:scale-[1.02] group">
            <div className="relative overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <RecentActivity
                title="Upcoming Interviews"
                icon="🎯"
                items={upcomingInterviews}
                showType
              />
            </div>
          </div>
        </div>

        {/* Quick Actions Floating Button */}
        <div className="fixed bottom-8 right-8 z-20">
          <div className="relative group">
            <button 
              className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center text-white text-xl animate-bounce"
              onClick={() => setChatbotOpen(true)}
            >
              💬
            </button>
            <div className="absolute bottom-16 right-0 bg-slate-800 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Ask AI Assistant
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};