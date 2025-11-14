import React, { useState, useEffect } from 'react';
import { StatsCard } from './StatsCard';
import { RecentActivity } from './RecentActivity';
import { ProfileProgress } from './ProfileProgress';
import { useDashboard } from './context/DashboardContext';
import { 
  Loader2, 
  Send, 
  Calendar, 
  Eye, 
  TrendingUp,
  FileText,
  Target
} from 'lucide-react';
import { useIsMobile } from '../../../hooks/useIsMobile';

interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
}

interface ApplicationItem {
  id: string;
  company: string;
  position: string;
  status: string;
  time: string;
  color: string;
}

interface InterviewItem {
  id: string;
  company: string;
  position: string;
  time: string;
  type: string;
}

export const DashboardContent: React.FC = () => {
  const { user, setChatbotOpen } = useDashboard();
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Mobile detection
  const isMobile = useIsMobile();
  
  // Data states
  const [statsCards, setStatsCards] = useState<StatCard[]>([]);
  const [recentApplications, setRecentApplications] = useState<ApplicationItem[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewItem[]>([]);
  
  // Loading states
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [loadingInterviews, setLoadingInterviews] = useState(true);
  
  // Error states
  const [statsError, setStatsError] = useState<string | null>(null);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [interviewsError, setInterviewsError] = useState<string | null>(null);

  useEffect(() => {
    setIsVisible(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const response = await fetch('/api/dashboard/mock-stats', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Stats fetch error:', response.status, errorData);
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        setStatsCards(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStatsError('Failed to load statistics');
        // Set default data
        setStatsCards([
          { title: 'Applications Sent', value: '0', change: 'No data', icon: 'Send', color: 'purple' },
          { title: 'Interviews', value: '0', change: 'No data', icon: 'Calendar', color: 'green' },
          { title: 'Profile Views', value: '0', change: 'No data', icon: 'Eye', color: 'blue' },
          { title: 'Response Rate', value: '0%', change: 'No data', icon: 'TrendingUp', color: 'yellow' }
        ]);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch recent applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoadingApplications(true);
        const response = await fetch('/api/dashboard/mock-applications', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Applications fetch error:', response.status, errorData);
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        setRecentApplications(data);
      } catch (error) {
        console.error('Error fetching applications:', error);
        setApplicationsError('Failed to load applications');
        setRecentApplications([]);
      } finally {
        setLoadingApplications(false);
      }
    };

    fetchApplications();
  }, []);

  // Fetch upcoming interviews
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoadingInterviews(true);
        const response = await fetch('/api/dashboard/mock-interviews', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Interviews fetch error:', response.status, errorData);
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        setUpcomingInterviews(data);
      } catch (error) {
        console.error('Error fetching interviews:', error);
        setInterviewsError('Failed to load interviews');
        setUpcomingInterviews([]);
      } finally {
        setLoadingInterviews(false);
      }
    };

    fetchInterviews();
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex-1 pt-6 md:pt-12 px-4 md:px-8 pb-8 overflow-y-auto h-[calc(100vh-5rem)] md:h-[calc(100vh-5rem)] relative">
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
        
        {/* Enhanced Dashboard Stats */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 transition-all ${
          isMobile ? 'duration-200' : 'duration-1000 delay-200'
        } transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          {loadingStats ? (
            <div className="col-span-full flex justify-center items-center py-6 md:py-8">
              <Loader2 className={`h-6 w-6 md:h-8 md:w-8 animate-spin text-purple-400 ${isMobile ? '' : 'animate-spin'}`} />
            </div>
          ) : statsError ? (
            <div className="col-span-full text-center text-red-400 py-4">
              {statsError}
            </div>
          ) : (
            statsCards.map((stat, index) => (
              <div
                key={index}
                className={`transform transition-all ${
                  isMobile
                    ? 'duration-200 hover:scale-[1.02]'
                    : 'duration-500 hover:scale-105 hover:-translate-y-2'
                }`}
                style={{
                  animationDelay: isMobile ? '0ms' : `${300 + index * 100}ms`,
                  animation: isVisible ? (isMobile ? 'none' : 'slideInUp 0.6s ease-out forwards') : ''
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
            ))
          )}
        </div>
        
        {/* Profile Progress Section */}
        <div className={`mb-6 md:mb-8 transition-all ${
          isMobile ? 'duration-200' : 'duration-1000 delay-300'
        } transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <ProfileProgress />
        </div>

        {/* Enhanced Recent Activity Section */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 transition-all ${
          isMobile ? 'duration-200' : 'duration-1000 delay-400'
        } transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className={`transform transition-all ${
            isMobile ? 'duration-200 hover:scale-[1.01]' : 'duration-500 hover:scale-[1.02]'
          } group`}>
            <div className="relative overflow-hidden rounded-xl">
              <div className={`absolute inset-0 opacity-0 transition-opacity ${
                isMobile ? 'duration-200' : 'duration-300'
              } group-hover:opacity-100 bg-gradient-to-br from-purple-500/10 to-transparent`}></div>
              {loadingApplications ? (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 flex justify-center items-center h-48 md:h-64">
                  <Loader2 className={`h-6 w-6 md:h-8 md:w-8 animate-spin text-purple-400 ${isMobile ? '' : 'animate-spin'}`} />
                </div>
              ) : applicationsError ? (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 text-center text-red-400">
                  {applicationsError}
                </div>
              ) : (
                <RecentActivity
                  title="Recent Applications"
                  icon="FileText"
                  items={recentApplications.length > 0 ? recentApplications : [
                    {
                      company: 'No applications yet',
                      position: 'Start applying to jobs',
                      status: '',
                      time: '',
                      color: 'gray'
                    }
                  ]}
                  showStatus
                />
              )}
            </div>
          </div>

          <div className={`transform transition-all ${
            isMobile ? 'duration-200 hover:scale-[1.01]' : 'duration-500 hover:scale-[1.02]'
          } group`}>
            <div className="relative overflow-hidden rounded-xl">
              <div className={`absolute inset-0 opacity-0 transition-opacity ${
                isMobile ? 'duration-200' : 'duration-300'
              } group-hover:opacity-100 bg-gradient-to-br from-pink-500/10 to-transparent`}></div>
              {loadingInterviews ? (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 flex justify-center items-center h-48 md:h-64">
                  <Loader2 className={`h-6 w-6 md:h-8 md:w-8 animate-spin text-purple-400 ${isMobile ? '' : 'animate-spin'}`} />
                </div>
              ) : interviewsError ? (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 text-center text-red-400">
                  {interviewsError}
                </div>
              ) : (
                <RecentActivity
                  title="Upcoming Interviews"
                  icon="Target"
                  items={upcomingInterviews.length > 0 ? upcomingInterviews : [
                    {
                      company: 'No interviews scheduled',
                      position: 'Keep applying!',
                      time: '',
                      type: ''
                    }
                  ]}
                  showType
                />
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
