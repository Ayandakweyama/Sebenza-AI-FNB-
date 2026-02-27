'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Play,
  Pause,
  Square,
  RefreshCw,
  CheckCircle,
  XCircle,
  SkipForward,
  Clock,
  Search,
  MapPin,
  Briefcase,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AutoApplyLog {
  id: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
  status: string;
  matchScore: number | null;
  questionsFound: number;
  questionsAnswered: number;
  failureReason: string | null;
  skipReason: string | null;
  createdAt: string;
}

interface AutoApplySession {
  id: string;
  searchQuery: string;
  location: string;
  jobType: string | null;
  maxApplications: number;
  status: string;
  totalFound: number;
  appliedCount: number;
  skippedCount: number;
  failedCount: number;
  lastError: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  isActive: boolean;
  isPaused: boolean;
  logs: AutoApplyLog[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AutoApplyPage() {
  const { getToken } = useAuth();

  // Form state
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('South Africa');
  const [jobType, setJobType] = useState('');
  const [maxApplications, setMaxApplications] = useState(10);
  const [minMatchScore, setMinMatchScore] = useState(50);
  const [cvText, setCvText] = useState('');

  // Session state
  const [sessions, setSessions] = useState<AutoApplySession[]>([]);
  const [activeSession, setActiveSession] = useState<AutoApplySession | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);

  // ─── API Helpers ─────────────────────────────────────────────────────────

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  }, [getToken]);

  // ─── Delete Session ─────────────────────────────────────────────────────

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session and all its logs?')) return;
    setDeletingSession(sessionId);
    try {
      const res = await fetchWithAuth(`/api/auto-apply/delete?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (expandedLogs === sessionId) setExpandedLogs(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete session');
      }
    } catch {
      setError('Failed to delete session');
    } finally {
      setDeletingSession(null);
    }
  }, [fetchWithAuth, expandedLogs]);

  // ─── Load Sessions ──────────────────────────────────────────────────────

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/auto-apply/status');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);

        // Find active session
        const active = (data.sessions || []).find(
          (s: AutoApplySession) => s.status === 'running' || s.status === 'paused' || s.status === 'pending'
        );
        setActiveSession(active || null);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Poll for updates when there's an active session
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(loadSessions, 3000);
    return () => clearInterval(interval);
  }, [activeSession, loadSessions]);

  // ─── Start Agent ─────────────────────────────────────────────────────────

  const handleStart = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a job search query');
      return;
    }

    setIsStarting(true);
    setError('');

    try {
      const res = await fetchWithAuth('/api/auto-apply/start', {
        method: 'POST',
        body: JSON.stringify({
          searchQuery,
          location,
          jobType: jobType || undefined,
          maxApplications,
          minMatchScore,
          cvText: cvText || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to start agent');
        return;
      }

      // Reload sessions to pick up the new one
      await loadSessions();
    } catch (err) {
      setError('Failed to start auto-apply agent');
      console.error(err);
    } finally {
      setIsStarting(false);
    }
  };

  // ─── Control Agent ───────────────────────────────────────────────────────

  const handleControl = async (sessionId: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      const res = await fetchWithAuth('/api/auto-apply/control', {
        method: 'POST',
        body: JSON.stringify({ sessionId, action }),
      });

      if (res.ok) {
        await loadSessions();
      }
    } catch (err) {
      console.error(`Failed to ${action} session:`, err);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'text-green-400';
      case 'skipped': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      case 'running': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'cancelled': return 'text-gray-400';
      case 'paused': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'skipped': return <SkipForward className="w-4 h-4 text-yellow-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/jobs/all" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Auto-Apply Agent</h1>
              <p className="text-gray-400 text-sm">Let AI search and apply to jobs on Indeed for you</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Left: Config Panel ─────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-400" />
                Search Configuration
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Job Search Query *</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Software Developer, Data Analyst"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    disabled={!!activeSession}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="South Africa"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    disabled={!!activeSession}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> Job Type
                  </label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    disabled={!!activeSession}
                  >
                    <option value="">Any</option>
                    <option value="fulltime">Full-time</option>
                    <option value="parttime">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Applications</label>
                    <input
                      type="number"
                      value={maxApplications}
                      onChange={(e) => setMaxApplications(Number(e.target.value))}
                      min={1}
                      max={50}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      disabled={!!activeSession}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Min Match %</label>
                    <input
                      type="number"
                      value={minMatchScore}
                      onChange={(e) => setMinMatchScore(Number(e.target.value))}
                      min={0}
                      max={100}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      disabled={!!activeSession}
                    />
                  </div>
                </div>


                {/* CV Text (Optional) */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Paste CV Text (optional)
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">CV / Resume Text</label>
                        <textarea
                          value={cvText}
                          onChange={(e) => setCvText(e.target.value)}
                          placeholder="Paste your CV content here so the AI can answer application questions more accurately..."
                          rows={5}
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                          disabled={!!activeSession}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Start / Control Buttons */}
                {!activeSession ? (
                  <button
                    onClick={handleStart}
                    disabled={isStarting || !searchQuery.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    {isStarting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Starting Agent...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Start Auto-Apply
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    {activeSession.status === 'running' && (
                      <button
                        onClick={() => handleControl(activeSession.id, 'pause')}
                        className="flex-1 bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-600/30 transition-colors"
                      >
                        <Pause className="w-4 h-4" /> Pause
                      </button>
                    )}
                    {activeSession.status === 'paused' && (
                      <button
                        onClick={() => handleControl(activeSession.id, 'resume')}
                        className="flex-1 bg-green-600/20 border border-green-500/30 text-green-400 py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600/30 transition-colors"
                      >
                        <Play className="w-4 h-4" /> Resume
                      </button>
                    )}
                    <button
                      onClick={() => handleControl(activeSession.id, 'cancel')}
                      className="flex-1 bg-red-600/20 border border-red-500/30 text-red-400 py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-600/30 transition-colors"
                    >
                      <Square className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                )}

                {/* Tip */}
                <div className="text-xs text-gray-500 bg-slate-700/30 rounded-lg p-3 space-y-1">
                  <strong className="text-gray-400">💡 How it works:</strong>
                  <ol className="list-decimal list-inside space-y-0.5 text-gray-500">
                    <li>The agent opens a Chrome window automatically</li>
                    <li>It navigates to Indeed and checks if you&apos;re signed in</li>
                    <li>If not signed in, you have up to 5 minutes to sign in manually</li>
                    <li>Once signed in, the agent searches for jobs matching your criteria</li>
                    <li>AI evaluates each job against your profile</li>
                    <li>For matching jobs, AI fills out the application form using your CV</li>
                    <li>You can watch the entire process in the browser!</li>
                    <li><strong className="text-yellow-400">Keep an eye on the browser</strong> — you may need to complete &quot;I am human&quot; / CAPTCHA challenges that appear during the process</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Right: Live Progress & History ─────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Active Session Progress */}
            {activeSession && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/60 border border-purple-500/30 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    {getStatusIcon(activeSession.status)}
                    <span className={getStatusColor(activeSession.status)}>
                      {activeSession.status.charAt(0).toUpperCase() + activeSession.status.slice(1)}
                    </span>
                    <span className="text-gray-400 font-normal text-sm">— &quot;{activeSession.searchQuery}&quot;</span>
                  </h2>
                  <span className="text-xs text-gray-500">
                    {activeSession.startedAt ? new Date(activeSession.startedAt).toLocaleTimeString() : 'Pending...'}
                  </span>
                </div>

                {/* Progress Stats */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-700/40 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{activeSession.totalFound}</div>
                    <div className="text-xs text-gray-400">Found</div>
                  </div>
                  <div className="bg-slate-700/40 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{activeSession.appliedCount}</div>
                    <div className="text-xs text-gray-400">Applied</div>
                  </div>
                  <div className="bg-slate-700/40 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{activeSession.skippedCount}</div>
                    <div className="text-xs text-gray-400">Skipped</div>
                  </div>
                  <div className="bg-slate-700/40 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-400">{activeSession.failedCount}</div>
                    <div className="text-xs text-gray-400">Failed</div>
                  </div>
                </div>

                {/* Progress Bar */}
                {activeSession.totalFound > 0 && (
                  <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, ((activeSession.appliedCount + activeSession.skippedCount + activeSession.failedCount) / activeSession.totalFound) * 100)}%`,
                      }}
                    />
                  </div>
                )}

                {/* Recent Logs */}
                {activeSession.logs.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activeSession.logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between bg-slate-700/30 rounded-lg px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getStatusIcon(log.status)}
                          <span className="truncate">{log.jobTitle}</span>
                          <span className="text-gray-500 text-xs flex-shrink-0">at {log.company}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {log.matchScore !== null && (
                            <span className="text-xs text-gray-400">{log.matchScore}%</span>
                          )}
                          {log.questionsAnswered > 0 && (
                            <span className="text-xs text-purple-400">
                              {log.questionsAnswered}/{log.questionsFound} Q&A
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Session History */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Session History</h2>
                <button
                  onClick={loadSessions}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No auto-apply sessions yet</p>
                  <p className="text-sm mt-1">Configure your search and start the agent</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-slate-700/30 border border-slate-600/30 rounded-lg sm:rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedLogs(expandedLogs === session.id ? null : session.id)}
                        className="w-full p-3 sm:p-4 hover:bg-slate-700/50 transition-colors text-left"
                      >
                        {/* Top row: icon + title + chevron */}
                        <div className="flex items-start sm:items-center justify-between gap-2">
                          <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="mt-0.5 sm:mt-0 flex-shrink-0">{getStatusIcon(session.status)}</div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm sm:text-base truncate">&quot;{session.searchQuery}&quot;</div>
                              <div className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                                {session.location} &bull; {new Date(session.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                            {expandedLogs === session.id ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Stats row — stacks on mobile */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 ml-6 sm:ml-7 text-[11px] sm:text-xs">
                          <span className="text-green-400">{session.appliedCount} applied</span>
                          <span className="text-yellow-400">{session.skippedCount} skipped</span>
                          <span className="text-red-400">{session.failedCount} failed</span>
                        </div>
                      </button>

                      {/* Delete button — only for non-active sessions */}
                      {session.status !== 'running' && session.status !== 'pending' && (
                        <div className="px-3 sm:px-4 pb-2 flex justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                            disabled={deletingSession === session.id}
                            className="text-[11px] sm:text-xs text-red-400/60 hover:text-red-400 flex items-center gap-1 py-1 px-2 rounded-md hover:bg-red-500/10 transition-colors disabled:opacity-40"
                          >
                            <Trash2 className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${deletingSession === session.id ? 'animate-spin' : ''}`} />
                            {deletingSession === session.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}

                      <AnimatePresence>
                        {expandedLogs === session.id && session.logs.length > 0 && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-slate-600/30"
                          >
                            <div className="p-2 sm:p-3 space-y-2 max-h-64 overflow-y-auto">
                              {session.logs.map((log) => (
                                <div
                                  key={log.id}
                                  className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-2 text-sm bg-slate-800/40 rounded-lg p-2 sm:p-3"
                                >
                                  <div className="flex items-start gap-2 min-w-0 flex-1">
                                    <div className="flex-shrink-0 mt-0.5">{getStatusIcon(log.status)}</div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                                        <a
                                          href={log.jobUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-medium text-purple-400 hover:underline text-sm truncate"
                                        >
                                          {log.jobTitle}
                                        </a>
                                        <span className="text-gray-500 text-[11px] sm:text-xs">at {log.company}</span>
                                      </div>
                                      {log.failureReason && (
                                        <div className="text-[11px] sm:text-xs text-red-400 mt-1 break-words">{log.failureReason}</div>
                                      )}
                                      {log.skipReason && (
                                        <div className="text-[11px] sm:text-xs text-yellow-400 mt-1 break-words">{log.skipReason}</div>
                                      )}
                                      {log.questionsAnswered > 0 && (
                                        <div className="text-[11px] sm:text-xs text-gray-400 mt-1">
                                          AI answered {log.questionsAnswered}/{log.questionsFound} questions
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {log.matchScore !== null && (
                                    <span
                                      className={`self-start sm:self-auto ml-6 sm:ml-0 text-[11px] sm:text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                                        log.matchScore >= 70
                                          ? 'bg-green-500/20 text-green-400'
                                          : log.matchScore >= 50
                                          ? 'bg-yellow-500/20 text-yellow-400'
                                          : 'bg-red-500/20 text-red-400'
                                      }`}
                                    >
                                      {log.matchScore}%
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
