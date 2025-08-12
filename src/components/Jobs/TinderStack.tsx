'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TinderCard } from './TinderCard';
import { Button } from '@/components/ui/button';
import { X, Heart, Bookmark, RefreshCw } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  skills?: string[];
  type?: string;
  posted?: string;
  experience?: string;
  logo?: string;
}

interface TinderStackProps {
  jobs: Job[];
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSave: (jobId: string) => void;
  onEmpty?: () => void;
  className?: string;
}

export function TinderStack({ 
  jobs, 
  onSwipeLeft, 
  onSwipeRight, 
  onSave, 
  onEmpty,
  className = ''
}: TinderStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [removedJobs, setRemovedJobs] = useState<Set<string>>(new Set());
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const stackRef = useRef<HTMLDivElement>(null);

  // Handle swipe left (reject)
  const handleSwipeLeft = useCallback(() => {
    if (isAnimating || currentIndex >= jobs.length) return;
    
    setIsAnimating(true);
    setDirection(-1);
    const currentJob = jobs[currentIndex];
    setRemovedJobs(prev => new Set(prev).add(currentJob.id));
    
    // Call the callback after animation would be complete
    setTimeout(() => {
      onSwipeLeft();
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
      
      // Check if we've reached the end
      if (currentIndex >= jobs.length - 1 && onEmpty) {
        onEmpty();
      }
    }, 300);
  }, [currentIndex, isAnimating, jobs, onEmpty, onSwipeLeft]);

  // Handle swipe right (like)
  const handleSwipeRight = useCallback(() => {
    if (isAnimating || currentIndex >= jobs.length) return;
    
    setIsAnimating(true);
    setDirection(1);
    const currentJob = jobs[currentIndex];
    setRemovedJobs(prev => new Set(prev).add(currentJob.id));
    
    // Call the callback after animation would be complete
    setTimeout(() => {
      onSwipeRight();
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
      
      // Check if we've reached the end
      if (currentIndex >= jobs.length - 1 && onEmpty) {
        onEmpty();
      }
    }, 300);
  }, [currentIndex, isAnimating, jobs, onEmpty, onSwipeRight]);

  // Handle save
  const handleSave = useCallback((jobId: string) => {
    setSavedJobs(prev => {
      const newSaved = new Set(prev);
      if (newSaved.has(jobId)) {
        newSaved.delete(jobId);
      } else {
        newSaved.add(jobId);
      }
      onSave(jobId);
      return newSaved;
    });
  }, [onSave]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating || currentIndex >= jobs.length) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          handleSwipeLeft();
          break;
        case 'ArrowRight':
          handleSwipeRight();
          break;
        case 's':
        case 'S':
          if (currentIndex < jobs.length) {
            handleSave(jobs[currentIndex].id);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, handleSave, handleSwipeLeft, handleSwipeRight, isAnimating, jobs]);

  // Reset the stack when jobs change
  useEffect(() => {
    setCurrentIndex(0);
    setRemovedJobs(new Set());
    setSavedJobs(new Set());
  }, [jobs]);

  // Show empty state if no jobs
  if (jobs.length === 0 || currentIndex >= jobs.length) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-800/50 rounded-2xl p-8 text-center ${className}`}>
        <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
          <RefreshCw className="h-10 w-10 text-purple-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No more jobs</h3>
        <p className="text-slate-300 mb-6 max-w-md">
          You've seen all available jobs. Check back later for more opportunities!
        </p>
        <Button 
          onClick={() => {
            setCurrentIndex(0);
            setRemovedJobs(new Set());
            setSavedJobs(new Set());
            if (onEmpty) onEmpty();
          }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset and start over
        </Button>
      </div>
    );
  }

  // Get the current job and the next few for the stack
  const currentJob = jobs[currentIndex];
  const nextJobs = jobs.slice(currentIndex + 1, currentIndex + 3);

  return (
    <div 
      ref={stackRef}
      className={`relative w-full h-full flex items-center justify-center ${className}`}
    >
      {/* Stack of upcoming cards */}
      <div className="relative w-full h-full">
        {nextJobs.map((job, index) => {
          const zIndex = 10 - index;
          const scale = 1 - (index + 1) * 0.03;
          const y = (index + 1) * 10;
          
          return (
            <motion.div
              key={job.id}
              className="absolute inset-0"
              style={{
                zIndex,
                scale,
                y,
                opacity: 1 - (index * 0.2),
              }}
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ 
                scale,
                y,
                opacity: 1 - (index * 0.2),
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                delay: 0.1 * index,
              }}
            >
              <TinderCard 
                job={job} 
                onSwipeLeft={() => {}}
                onSwipeRight={() => {}}
                onSave={() => {}}
                active={false}
              />
            </motion.div>
          );
        })}
        
        {/* Current active card */}
        <AnimatePresence mode="wait">
          {!removedJobs.has(currentJob.id) && (
            <motion.div
              key={currentJob.id}
              className="absolute inset-0"
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ 
                scale: 1,
                y: 0,
                opacity: 1,
              }}
              exit={{
                x: direction > 0 ? 500 : -500,
                opacity: 0,
                scale: 0.8,
                transition: { duration: 0.3 },
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              dragConstraints={stackRef}
            >
              <TinderCard 
                job={currentJob} 
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onSave={() => handleSave(currentJob.id)}
                active={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Action Buttons - Only for mobile */}
      <div className="lg:hidden fixed bottom-6 left-0 right-0 flex justify-center gap-6 px-6">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-14 w-14 p-0 border-2 border-red-500/30 hover:border-red-500/50 bg-slate-800/50 hover:bg-red-500/20 transition-all duration-200 shadow-lg backdrop-blur-sm"
          onClick={handleSwipeLeft}
          disabled={isAnimating}
        >
          <X className="h-6 w-6 text-red-400" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-16 w-16 p-0 border-2 border-green-500/30 hover:border-green-500/50 bg-slate-800/50 hover:bg-green-500/20 transition-all duration-200 shadow-lg backdrop-blur-sm"
          onClick={handleSwipeRight}
          disabled={isAnimating}
        >
          <Heart className="h-7 w-7 text-green-400" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full h-14 w-14 p-0 border-2 ${
            savedJobs.has(currentJob.id) 
              ? 'border-yellow-500/50 bg-yellow-500/20' 
              : 'border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/20'
          } transition-all duration-200 shadow-lg backdrop-blur-sm`}
          onClick={() => handleSave(currentJob.id)}
          disabled={isAnimating}
        >
          <Bookmark 
            className={`h-6 w-6 ${
              savedJobs.has(currentJob.id) 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-blue-400'
            }`} 
          />
        </Button>
      </div>
    </div>
  );
}
