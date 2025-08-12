'use client';

import { useState, useCallback, memo } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { 
  Bookmark, 
  X, 
  Heart, 
  MapPin, 
  Clock, 
  Briefcase, 
  DollarSign, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  Eye
} from 'lucide-react';
import { Job } from '@/hooks/useJobScraper';
import { cn } from '@/lib/utils';

interface EnhancedTinderCardProps {
  job: Job;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSave: (jobId: string) => void;
  onShowDetails: (job: Job) => void;
  active?: boolean;
  className?: string;
  zIndex?: number;
}

const EnhancedTinderCard = memo(function EnhancedTinderCard({ 
  job, 
  onSwipeLeft,
  onSwipeRight,
  onSave,
  onShowDetails,
  active = true,
  className,
  zIndex = 1
}: EnhancedTinderCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const controls = useAnimation();

  // Handle save functionality
  const handleSaveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    onSave(job.url || `${job.company}-${job.title}`);
  }, [isSaved, job, onSave]);

  // Handle manual swipe left
  const handleSwipeLeft = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!active) return;
    
    await controls.start({ 
      x: -1000, 
      opacity: 0, 
      rotate: -30,
      transition: { duration: 0.4, ease: "easeInOut" } 
    });
    onSwipeLeft();
  }, [active, controls, onSwipeLeft]);

  // Handle manual swipe right
  const handleSwipeRight = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!active) return;
    
    await controls.start({ 
      x: 1000, 
      opacity: 0, 
      rotate: 30,
      transition: { duration: 0.4, ease: "easeInOut" } 
    });
    onSwipeRight();
  }, [active, controls, onSwipeRight]);

  // Handle show details
  const handleShowDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onShowDetails(job);
  }, [job, onShowDetails]);

  // Handle drag
  const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!active) return;
    
    setIsDragging(true);
    setDragX(info.offset.x);
  }, [active]);

  // Handle drag end
  const handleDragEnd = useCallback(async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!active) return;
    
    setIsDragging(false);
    const swipeThreshold = 150;
    
    if (Math.abs(info.offset.x) > swipeThreshold) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      const exitX = direction === 'right' ? 1000 : -1000;
      const exitRotate = direction === 'right' ? 30 : -30;
      
      await controls.start({
        x: exitX,
        opacity: 0,
        rotate: exitRotate,
        transition: { duration: 0.4, ease: "easeInOut" }
      });
      
      if (direction === 'right') {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    } else {
      // Snap back to center
      await controls.start({
        x: 0,
        rotate: 0,
        transition: { duration: 0.3, ease: "easeOut" }
      });
      setDragX(0);
    }
  }, [active, controls, onSwipeLeft, onSwipeRight]);

  // Get swipe indicator opacity
  const getSwipeOpacity = (direction: 'left' | 'right') => {
    if (!isDragging) return 0;
    const threshold = 50;
    const opacity = Math.abs(dragX) / 200;
    
    if (direction === 'left' && dragX < -threshold) {
      return Math.min(opacity, 1);
    } else if (direction === 'right' && dragX > threshold) {
      return Math.min(opacity, 1);
    }
    return 0;
  };

  // Format salary display
  const formatSalary = (salary: string) => {
    if (!salary || salary.toLowerCase().includes('not specified')) {
      return 'Salary not specified';
    }
    return salary;
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently posted';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-ZA', { 
        day: 'numeric', 
        month: 'short' 
      });
    } catch {
      return dateString;
    }
  };

  // Truncate description
  const truncateDescription = (text: string, maxLength: number = 120) => {
    if (!text) return 'No description available';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <motion.div
      className={cn(
        "absolute inset-0 w-full h-full select-none",
        className
      )}
      style={{ zIndex }}
      animate={controls}
      drag={active ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }}
    >
      {/* Swipe Indicators */}
      <motion.div
        className="absolute top-8 left-8 z-20 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg rotate-12"
        style={{ 
          opacity: getSwipeOpacity('left'),
          pointerEvents: 'none'
        }}
      >
        SKIP
      </motion.div>
      
      <motion.div
        className="absolute top-8 right-8 z-20 bg-green-500 text-white px-4 py-2 rounded-full font-bold text-lg -rotate-12"
        style={{ 
          opacity: getSwipeOpacity('right'),
          pointerEvents: 'none'
        }}
      >
        APPLY
      </motion.div>

      {/* Main Card */}
      <div className="w-full h-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
          {/* Save button */}
          <motion.button
            onClick={handleSaveClick}
            className={cn(
              "absolute top-4 right-4 p-2 rounded-full transition-colors",
              isSaved 
                ? "bg-yellow-500 text-white" 
                : "bg-white/20 hover:bg-white/30 text-white"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
          </motion.button>

          <div className="pr-12">
            <h2 className="text-2xl font-bold mb-2 leading-tight">
              {job.title}
            </h2>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5" />
              <span className="text-lg font-medium">{job.company}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(job.postedDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Salary and Job Type */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Salary</span>
              </div>
              <p className="text-green-800 font-semibold">
                {formatSalary(job.salary)}
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Type</span>
              </div>
              <p className="text-blue-800 font-semibold">
                {job.jobType || 'Full-time'}
              </p>
            </div>
          </div>

          {/* Description Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
            <p className="text-gray-600 leading-relaxed">
              {showPreview 
                ? job.description || 'No description available'
                : truncateDescription(job.description || '')
              }
            </p>
            
            {job.description && job.description.length > 120 && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
              >
                {showPreview ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show more
                  </>
                )}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-auto">
            {/* View Details */}
            <motion.button
              onClick={handleShowDetails}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Eye className="w-5 h-5" />
              View Details
            </motion.button>

            {/* External Link */}
            {job.url && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(job.url, '_blank');
                }}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ExternalLink className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex justify-center gap-6">
            {/* Skip Button */}
            <motion.button
              onClick={handleSwipeLeft}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={!active}
            >
              <X className="w-8 h-8" />
            </motion.button>

            {/* Apply Button */}
            <motion.button
              onClick={handleSwipeRight}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={!active}
            >
              <Heart className="w-8 h-8" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export { EnhancedTinderCard };
