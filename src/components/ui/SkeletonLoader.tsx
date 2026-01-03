'use client';

import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'profile' | 'job' | 'text';
  count?: number;
  className?: string;
}

export default function SkeletonLoader({ 
  type = 'card', 
  count = 1, 
  className = '' 
}: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return <CardSkeleton />;
      case 'list':
        return <ListSkeleton />;
      case 'profile':
        return <ProfileSkeleton />;
      case 'job':
        return <JobSkeleton />;
      case 'text':
        return <TextSkeleton />;
      default:
        return <CardSkeleton />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          {renderSkeleton()}
        </motion.div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-slate-700 rounded-lg shimmer" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-slate-700 rounded w-3/4 shimmer" />
          <div className="h-3 bg-slate-700 rounded w-1/2 shimmer" />
          <div className="space-y-2">
            <div className="h-3 bg-slate-700 rounded w-full shimmer" />
            <div className="h-3 bg-slate-700 rounded w-5/6 shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-700 rounded-full shimmer" />
        <div className="flex-1">
          <div className="h-4 bg-slate-700 rounded w-1/3 shimmer mb-2" />
          <div className="h-3 bg-slate-700 rounded w-2/3 shimmer" />
        </div>
        <div className="h-6 bg-slate-700 rounded w-16 shimmer" />
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-20 h-20 bg-slate-700 rounded-full shimmer" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-slate-700 rounded w-1/3 shimmer" />
          <div className="h-4 bg-slate-700 rounded w-1/2 shimmer" />
          <div className="h-3 bg-slate-700 rounded w-2/3 shimmer" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-slate-700 rounded w-1/4 shimmer" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-3 bg-slate-700 rounded shimmer" />
          <div className="h-3 bg-slate-700 rounded shimmer" />
          <div className="h-3 bg-slate-700 rounded shimmer" />
          <div className="h-3 bg-slate-700 rounded shimmer" />
        </div>
      </div>
    </div>
  );
}

function JobSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="h-5 bg-slate-700 rounded w-2/3 shimmer mb-3" />
          <div className="flex items-center gap-4 mb-3">
            <div className="h-4 bg-slate-700 rounded w-1/4 shimmer" />
            <div className="h-4 bg-slate-700 rounded w-1/5 shimmer" />
            <div className="h-4 bg-slate-700 rounded w-1/6 shimmer" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-slate-700 rounded w-full shimmer" />
            <div className="h-3 bg-slate-700 rounded w-5/6 shimmer" />
            <div className="h-3 bg-slate-700 rounded w-4/5 shimmer" />
          </div>
        </div>
        <div className="ml-4">
          <div className="h-8 bg-slate-700 rounded w-20 shimmer" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-700 rounded shimmer" />
          <div className="h-3 bg-slate-700 rounded w-24 shimmer" />
        </div>
        <div className="h-6 bg-slate-700 rounded w-16 shimmer" />
      </div>
    </div>
  );
}

function TextSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 bg-slate-700 rounded w-full shimmer" />
      <div className="h-4 bg-slate-700 rounded w-5/6 shimmer" />
      <div className="h-4 bg-slate-700 rounded w-4/5 shimmer" />
      <div className="h-4 bg-slate-700 rounded w-3/4 shimmer" />
    </div>
  );
}
