'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface SourceStatus {
  name: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  count: number;
  error?: string;
  duration?: number;
}

interface ProgressiveJobLoaderProps {
  isLoading: boolean;
  sources: string[];
  onComplete?: (jobs: any[]) => void;
  className?: string;
}

export default function ProgressiveJobLoader({ 
  isLoading, 
  sources, 
  onComplete,
  className = '' 
}: ProgressiveJobLoaderProps) {
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatus[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    if (isLoading) {
      setStartTime(Date.now());
      setSourceStatuses(sources.map(source => ({
        name: source,
        status: 'pending',
        count: 0
      })));
      setTotalJobs(0);
    }
  }, [isLoading, sources]);

  const getSourceIcon = (status: SourceStatus['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-slate-400" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getSourceColor = (status: SourceStatus['status']) => {
    switch (status) {
      case 'pending':
        return 'border-slate-600 bg-slate-800/30';
      case 'loading':
        return 'border-blue-500/50 bg-blue-500/10';
      case 'completed':
        return 'border-green-500/50 bg-green-500/10';
      case 'error':
        return 'border-red-500/50 bg-red-500/10';
    }
  };

  const completedSources = sourceStatuses.filter(s => s.status === 'completed').length;
  const errorSources = sourceStatuses.filter(s => s.status === 'error').length;
  const loadingSources = sourceStatuses.filter(s => s.status === 'loading').length;
  const progress = (completedSources + errorSources) / sources.length * 100;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getEstimatedTime = () => {
    if (completedSources === 0) return 'Estimating...';
    const elapsed = Date.now() - startTime;
    const avgTimePerSource = elapsed / completedSources;
    const remaining = sources.length - completedSources - errorSources;
    const estimated = remaining * avgTimePerSource;
    return `~${formatDuration(estimated)} remaining`;
  };

  if (!isLoading && sourceStatuses.length === 0) {
    return null;
  }

  return (
    <div className={`bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="w-6 h-6 text-blue-400" />
            {isLoading && (
              <div className="absolute inset-0 animate-ping">
                <Zap className="w-6 h-6 text-blue-400/50" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {isLoading ? 'Searching Job Sources' : 'Search Complete'}
            </h3>
            <p className="text-sm text-slate-400">
              {isLoading ? getEstimatedTime() : `Found ${totalJobs} jobs in ${formatDuration(Date.now() - startTime)}`}
            </p>
          </div>
        </div>
        
        {/* Progress Circle */}
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-slate-700"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
              className="text-blue-400 transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Progress</span>
          <span>{completedSources + errorSources} of {sources.length} sources</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Source Status List */}
      <div className="space-y-3">
        <AnimatePresence>
          {sourceStatuses.map((source, index) => (
            <motion.div
              key={source.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${getSourceColor(source.status)}`}
            >
              <div className="flex items-center gap-3">
                {getSourceIcon(source.status)}
                <div>
                  <div className="font-medium text-white capitalize">
                    {source.name}
                  </div>
                  {source.error && (
                    <div className="text-xs text-red-400 mt-1">
                      {source.error}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                {source.status === 'completed' && (
                  <div className="text-sm font-semibold text-green-400">
                    {source.count} jobs
                  </div>
                )}
                {source.duration && (
                  <div className="text-xs text-slate-400">
                    {formatDuration(source.duration)}
                  </div>
                )}
                {source.status === 'loading' && (
                  <div className="text-xs text-blue-400">
                    Searching...
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 pt-4 border-t border-slate-700/50"
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-green-400">
                ✓ {completedSources} successful
              </span>
              {errorSources > 0 && (
                <span className="text-red-400">
                  ✗ {errorSources} failed
                </span>
              )}
            </div>
            <div className="text-slate-400">
              Total: {totalJobs} jobs found
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
