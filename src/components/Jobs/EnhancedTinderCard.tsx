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
  Eye,
  Lock,
  Sparkles
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
    
    const isMobile = 'ontouchstart' in window || window.innerWidth < 768;
    
    await controls.start({ 
      x: -1000, 
      opacity: 0, 
      rotate: isMobile ? -15 : -20, // Reduced rotation for desktop too
      scale: isMobile ? 0.9 : 0.8,  // Less dramatic scale for better performance
      transition: { 
        duration: isMobile ? 0.2 : 0.25, // Faster on desktop
        ease: "easeOut" // Consistent easing for smoother feel
      } 
    });
    onSwipeLeft();
  }, [active, controls, onSwipeLeft]);

  // Handle manual swipe right - DISABLED for AI Agent
  const handleSwipeRight = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    // AI Agent feature coming soon - disabled for now
    return;
  }, []);

  // Handle show details
  const handleShowDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onShowDetails(job);
  }, [job, onShowDetails]);

  // Handle drag with improved mobile support
  const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!active) return;
    
    // Prevent default touch behavior on mobile to avoid scrolling
    if (event.type === 'touchmove' && event.cancelable) {
      event.preventDefault();
    }
    
    setIsDragging(true);
    setDragX(info.offset.x);
    
    // Optimized rotation calculation for smoother experience on both platforms
    const isMobile = 'ontouchstart' in window || window.innerWidth < 768;
    const rotationDivisor = isMobile ? 12 : 10; // More responsive on desktop
    const rotation = Math.min(Math.max(info.offset.x / rotationDivisor, -15), 15); // Reduced max rotation
    const scale = Math.max(0.96, 1 - Math.abs(info.offset.x) / 1200); // Gentler scale effect
    
    // Use requestAnimationFrame for smoother animations on all platforms
    requestAnimationFrame(() => {
      controls.set({
        x: info.offset.x,
        rotate: rotation,
        scale: scale
      });
    });
  }, [active, controls]);

  // Handle drag end with improved mobile thresholds
  const handleDragEnd = useCallback(async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!active) return;
    
    setIsDragging(false);
    
    // Better mobile detection and thresholds
    const isMobile = 'ontouchstart' in window || window.innerWidth < 768;
    const screenWidth = window.innerWidth;
    
    // Dynamic thresholds based on screen size
    const swipeThreshold = isMobile ? Math.min(screenWidth * 0.25, 120) : 150;
    const velocityThreshold = isMobile ? 300 : 500; // Lower velocity threshold for mobile
    
    // Consider both distance and velocity for better mobile UX
    const distanceRatio = Math.abs(info.offset.x) / screenWidth;
    const shouldSwipe = Math.abs(info.offset.x) > swipeThreshold || 
                       Math.abs(info.velocity.x) > velocityThreshold ||
                       distanceRatio > 0.3; // 30% of screen width
    
    if (shouldSwipe) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      const exitX = direction === 'right' ? screenWidth + 100 : -(screenWidth + 100);
      const exitRotate = direction === 'right' ? 25 : -25;
      
      // Optimized animation for both mobile and desktop
      await controls.start({
        x: exitX,
        opacity: 0,
        rotate: isMobile ? exitRotate * 0.5 : exitRotate * 0.8, // Reduce rotation for smoother feel
        scale: isMobile ? 0.9 : 0.8, // Less dramatic scale for better performance
        transition: { 
          duration: isMobile ? 0.15 : 0.2, // Faster on desktop too
          ease: "easeOut" // Consistent simple easing for both
        }
      });
      
      // Add haptic feedback on mobile if available
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      if (direction === 'right') {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    } else {
      // Optimized snap back animation for both platforms
      await controls.start({
        x: 0,
        rotate: 0,
        scale: 1,
        transition: { 
          type: "spring",
          stiffness: isMobile ? 500 : 450, // Slightly stiffer on desktop
          damping: isMobile ? 35 : 32,     // Better damping for desktop
          mass: 0.7                        // Lighter mass for snappier feel
        }
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

  console.log('🃏 EnhancedTinderCard rendering:', { title: job.title, active, zIndex });

  return (
    <motion.div
      className={cn(
        "absolute inset-0 w-full h-full select-none touch-pan-x tinder-card tinder-card-animated",
        isDragging && "tinder-dragging",
        className
      )}
      style={{ 
        zIndex,
        touchAction: active ? 'pan-x' : 'auto',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
      animate={controls}
      drag={active ? "x" : false}
      dragConstraints={{ left: -250, right: 250 }} // Tighter constraints for better control
      dragElastic={0.15} // Reduced elasticity for snappier feel
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 700, bounceDamping: 25 }} // Stiffer bounce for desktop
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileTap={active ? { scale: 0.98 } : undefined}
      initial={{ scale: 0.9, opacity: 0, x: 0, y: 20 }}
      whileInView={{ scale: 1, opacity: 1, x: 0, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        mass: 0.8
      }}
    >
      {/* Swipe Indicators */}
      <motion.div
        className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20 bg-red-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-sm sm:text-lg rotate-12 tinder-swipe-indicator"
        style={{ 
          opacity: getSwipeOpacity('left'),
          pointerEvents: 'none'
        }}
      >
        SKIP
      </motion.div>
      
      <motion.div
        className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20 bg-green-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-sm sm:text-lg -rotate-12 tinder-swipe-indicator"
        style={{ 
          opacity: getSwipeOpacity('right'),
          pointerEvents: 'none'
        }}
      >
        APPLY
      </motion.div>

      {/* Main Card */}
      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden backdrop-blur-xl flex flex-col touch-manipulation">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 p-4 sm:p-5 md:p-6 text-white relative shadow-lg flex-shrink-0">
          {/* Save button */}
          <motion.button
            onClick={handleSaveClick}
            className={cn(
              "absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full transition-all shadow-lg",
              isSaved 
                ? "bg-yellow-500 text-white shadow-yellow-500/50" 
                : "bg-white/20 hover:bg-white/30 text-white hover:shadow-white/30"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bookmark className={cn("w-4 h-4 sm:w-5 sm:h-5", isSaved && "fill-current")} />
          </motion.button>

          <div className="pr-10 sm:pr-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 leading-tight">
              {job.title}
            </h2>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-base sm:text-lg font-medium">{job.company}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{formatDate(job.postedDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {/* Salary and Job Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                <span className="text-sm font-medium text-green-400">Salary</span>
              </div>
              <p className="text-green-300 font-semibold text-sm sm:text-base">
                {formatSalary(job.salary)}
              </p>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">Type</span>
              </div>
              <p className="text-blue-300 font-semibold text-sm sm:text-base">
                {job.jobType || 'Full-time'}
              </p>
            </div>
          </div>

          {/* Description Preview */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Job Description</h3>
            <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
              {showPreview 
                ? job.description || 'No description available'
                : truncateDescription(job.description || '')
              }
            </p>
            
            {job.description && job.description.length > 120 && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="mt-2 text-purple-400 hover:text-purple-300 font-medium text-xs sm:text-sm flex items-center gap-1 transition-colors"
              >
                {showPreview ? (
                  <>
                    <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    Show more
                  </>
                )}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-auto pt-4">
            {/* View Details */}
            <motion.button
              onClick={handleShowDetails}
              className="flex-1 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-purple-500/30 text-slate-300 hover:text-white font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              View Details
            </motion.button>

            {/* External Link */}
            {job.url && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(job.url, '_blank');
                }}
                className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 hover:text-purple-200 font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="border-t border-slate-700/50 p-4 sm:p-5 md:p-6 flex-shrink-0">
          <div className="flex justify-center gap-4 sm:gap-6 md:gap-8">
            {/* Skip Button */}
            <motion.button
              onClick={handleSwipeLeft}
              className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 active:from-red-600 active:to-red-700 text-white rounded-full shadow-2xl shadow-red-500/30 flex items-center justify-center transition-all duration-200 border-2 border-red-400/50 touch-manipulation tinder-action-button tinder-button-touch"
              whileHover={{ 
                scale: 1.15,
                boxShadow: "0 0 30px rgba(239, 68, 68, 0.6)"
              }}
              whileTap={{ scale: 0.9 }}
              disabled={!active}
            >
              <X className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 drop-shadow-lg" />
              <div className="absolute inset-0 rounded-full bg-red-400/20 animate-pulse"></div>
            </motion.button>

            {/* Apply Button - DISABLED for AI Agent */}
            <div className="relative">
              <motion.button
                disabled
                className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-400 cursor-not-allowed text-white rounded-full shadow-xl opacity-60 flex items-center justify-center transition-all duration-200 border-2 border-gray-300 touch-manipulation tinder-action-button tinder-button-touch"
              >
                <Lock className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 drop-shadow-lg" />
              </motion.button>
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>AI Agent Soon</span>
              </div>
            </div>
          </div>
          
          {/* Action Labels - Aligned with icons */}
          <div className="flex justify-center items-center gap-4 sm:gap-6 md:gap-8 mt-2 sm:mt-3">
            <div className="flex flex-col items-center w-14 sm:w-16 md:w-20">
              <span className="text-red-400 text-xs sm:text-sm font-medium">Skip</span>
            </div>
            <div className="flex flex-col items-center w-16 sm:w-20 md:w-24">
              <span className="text-gray-400 text-xs sm:text-sm font-medium line-through">Apply</span>
              <span className="text-purple-400 text-[10px] sm:text-xs font-medium">Pro Only</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export { EnhancedTinderCard };
