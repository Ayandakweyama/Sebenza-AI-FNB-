'use client';

import { useState, useEffect } from 'react';
import { useChatHistory } from '@/hooks/useChatHistory';
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  Activity,
  Calendar,
  PieChart
} from 'lucide-react';

interface SessionAnalyticsProps {
  className?: string;
}

export function SessionAnalytics({ className }: SessionAnalyticsProps) {
  const { getSessionStats } = useChatHistory();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const sessionStats = await getSessionStats();
        setStats(sessionStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [getSessionStats]);

  if (loading) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-slate-300">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-red-500/30 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">Failed to load analytics</div>
          <div className="text-slate-400 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-slate-400">No analytics data available</div>
        </div>
      </div>
    );
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const sessionTypeColors = {
    'career-advice': 'bg-blue-500',
    'resume-tips': 'bg-green-500',
    'interview-prep': 'bg-purple-500',
    'job-search': 'bg-orange-500',
    'skill-gap': 'bg-pink-500',
    'career-roadmap': 'bg-teal-500',
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl border border-blue-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">Total Sessions</p>
              <p className="text-white text-2xl font-bold">{formatNumber(stats.totalSessions)}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl border border-green-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">Active Sessions</p>
              <p className="text-white text-2xl font-bold">{stats.activeSessions}</p>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-400 text-sm font-medium">Avg Duration</p>
              <p className="text-white text-2xl font-bold">{formatDuration(stats.averageDuration)}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-xl border border-orange-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-400 text-sm font-medium">Total Messages</p>
              <p className="text-white text-2xl font-bold">{formatNumber(stats.totalMessages)}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Session Types Breakdown */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Session Types</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stats.sessionTypes).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  sessionTypeColors[type as keyof typeof sessionTypeColors] || 'bg-gray-500'
                }`} />
                <span className="text-slate-300 capitalize">
                  {type.replace('-', ' ')}
                </span>
              </div>
              <span className="text-white font-medium">{count as number}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      {stats.recentSessions && stats.recentSessions.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Recent Sessions</h3>
          </div>

          <div className="space-y-3">
            {stats.recentSessions.slice(0, 5).map((session: any) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium capitalize">
                      {session.type.replace('-', ' ')}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {session.messageCount} messages
                    </span>
                  </div>
                  <div className="text-slate-400 text-xs">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 text-sm">
                    Active {Math.floor((new Date().getTime() - new Date(session.lastMessageAt).getTime()) / (1000 * 60))}m ago
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {stats.peakConcurrentUsers}
            </div>
            <div className="text-slate-400 text-sm">Peak Concurrent Users</div>
          </div>

          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {stats.totalSessions > 0 ? Math.round((stats.activeSessions / stats.totalSessions) * 100) : 0}%
            </div>
            <div className="text-slate-400 text-sm">Session Activity Rate</div>
          </div>

          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {stats.totalMessages > 0 ? Math.round(stats.totalMessages / stats.totalSessions) : 0}
            </div>
            <div className="text-slate-400 text-sm">Avg Messages/Session</div>
          </div>
        </div>
      </div>
    </div>
  );
}
