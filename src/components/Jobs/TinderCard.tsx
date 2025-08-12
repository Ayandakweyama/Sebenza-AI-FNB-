'use client';

import { useState, useCallback, memo } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Bookmark, X, Heart, MapPin, Clock, Briefcase, DollarSign } from 'lucide-react';
import { Job } from '@/types/job';
import { cn } from '@/lib/utils';

interface TinderCardProps {
  job: Job;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSave: (jobId: string) => void;
  active?: boolean;
  className?: string;
}

// Memoize the TinderCard component to prevent unnecessary re-renders
const TinderCardComponent = memo(function TinderCard({ 
  job, 
  onSwipeLeft,
  onSwipeRight,
  onSave,
  active = true,
  className,
}: TinderCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const controls = useAnimation();

  const handleSaveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    onSave(job.id);
  }, [isSaved, job.id, onSave]);

  const handleSwipeLeft = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!active) return;
    
    const swipeLeft = async () => {
      await controls.start({ 
        x: -1000, 
        opacity: 0, 
        transition: { duration: 0.3 } 
      });
      onSwipeLeft();
    };
    
    swipeLeft().catch(console.error);
  }, [active, controls, onSwipeLeft]);

  const handleSwipeRight = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!active) return;
    
    const swipeRight = async () => {
      await controls.start({ 
        x: 1000, 
        opacity: 0, 
        transition: { duration: 0.3 } 
      });
      onSwipeRight();
    };
    
    swipeRight().catch(console.error);
  }, [active, controls, onSwipeRight]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (!active) return;
    const offset = info.offset.x;
    if (Math.abs(offset) > 100) {
      const event = { stopPropagation: () => {} } as React.MouseEvent<HTMLButtonElement>;
      if (offset > 0) {
        handleSwipeRight(event);
      } else {
        handleSwipeLeft(event);
      }
    }
  }, [active, handleSwipeLeft, handleSwipeRight]);

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  return (
    <motion.div
      initial={{ x: 0, opacity: 1 }}
      animate={controls}
      className={cn(
        'relative w-full max-w-md bg-slate-800/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden',
        'border border-slate-700/50',
        active ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        className
      )}
      whileTap={active ? { scale: 0.98 } : {}}
      drag={active ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
    >
      {/* Job Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white">{job.title}</h2>
            <p className="text-purple-300 font-medium">{job.company}</p>
          </div>
          <button
            onClick={handleSaveClick}
            className={`p-2 rounded-full transition-colors ${
              isSaved 
                ? 'text-yellow-400 bg-yellow-500/20' 
                : 'text-slate-400 hover:bg-slate-700/50'
            }`}
            aria-label={isSaved ? 'Remove from saved' : 'Save job'}
          >
            <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Job Details */}
      <div className="px-6 pb-6 pt-0 space-y-4">
        <div className="flex flex-wrap gap-3 text-sm text-slate-300">
          {job.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1.5 text-purple-400" />
              <span>{job.location}</span>
            </div>
          )}
          {job.salary && (
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1.5 text-green-400" />
              <span>{job.salary}</span>
            </div>
          )}
          {job.jobType && (
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-1.5 text-blue-400" />
              <span>{job.jobType}</span>
            </div>
          )}
          {job.postedDate && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1.5 text-yellow-400" />
              <span>{formatDate(job.postedDate)}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {job.description && (
          <div className="mt-4">
            <p className="text-slate-300 text-sm line-clamp-3">
              {job.description}
            </p>
          </div>
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-400 mb-2">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-200 border border-slate-600/50 hover:border-purple-400/50 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 pt-0">
        <div className="flex justify-center gap-4">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full w-16 h-16 bg-slate-800/80 border border-slate-600/50 hover:bg-red-500/20 hover:border-red-400/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-red-500"
            onClick={handleSwipeLeft}
            disabled={!active}
          >
            <X className="w-8 h-8 text-red-400" />
          </button>
          
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full w-16 h-16 bg-slate-800/80 border border-slate-600/50 hover:bg-green-500/20 hover:border-green-400/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-green-500"
            onClick={handleSwipeRight}
            disabled={!active}
          >
            <Heart className="w-8 h-8 text-green-400" />
          </button>
          
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-full h-12 w-12 p-0 border-2 ${
              isSaved 
                ? 'border-yellow-500/50 bg-yellow-500/20' 
                : 'border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/20'
            } transition-all duration-200 shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500`}
            onClick={handleSaveClick}
            disabled={!active}
          >
            <Bookmark 
              className={`h-5 w-5 ${
                isSaved 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : 'text-blue-400'
              }`} 
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

// Export the component as a named export
export { TinderCardComponent as TinderCard };