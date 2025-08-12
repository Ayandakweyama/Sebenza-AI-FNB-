'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { JobCard } from './JobCard';
import { 
  FiRefreshCw, 
  FiHeart, 
  FiX, 
  FiFilter, 
  FiTrendingUp,
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiUsers,
  FiTarget,
  FiStar,
  FiZap
} from 'react-icons/fi';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  skills: string[];
  matchScore: number;
  postedDate?: string;
  applicants?: number;
  urgent?: boolean;
  remote?: boolean;
  companyLogo?: string;
}

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp',
    location: 'Remote',
    salary: '$120,000 - $150,000',
    description: 'We are looking for an experienced Frontend Developer to join our team. You will be responsible for building user interfaces using React and TypeScript.',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    matchScore: 92,
    postedDate: '2 days ago',
    applicants: 15,
    urgent: false,
    remote: true
  },
  {
    id: '2',
    title: 'UX/UI Designer',
    company: 'DesignHub',
    location: 'New York, NY',
    salary: '$100,000 - $130,000',
    description: 'Join our design team to create beautiful and intuitive user experiences for our clients.',
    skills: ['Figma', 'UI/UX', 'Prototyping', 'User Research'],
    matchScore: 85,
    postedDate: '1 day ago',
    applicants: 8,
    urgent: true,
    remote: false
  },
  {
    id: '3',
    title: 'Backend Engineer',
    company: 'DataSystems',
    location: 'San Francisco, CA',
    salary: '$130,000 - $160,000',
    description: 'Looking for a Backend Engineer to develop and maintain our server infrastructure and APIs.',
    skills: ['Node.js', 'Python', 'PostgreSQL', 'AWS'],
    matchScore: 78,
    postedDate: '5 days ago',
    applicants: 23,
    urgent: false,
    remote: false
  },
  {
    id: '4',
    title: 'Full Stack Developer',
    company: 'StartupXYZ',
    location: 'Austin, TX',
    salary: '$95,000 - $125,000',
    description: 'Join our fast-growing startup as a Full Stack Developer. Work on cutting-edge projects.',
    skills: ['React', 'Node.js', 'MongoDB', 'GraphQL'],
    matchScore: 88,
    postedDate: '3 days ago',
    applicants: 12,
    urgent: true,
    remote: true
  },
  {
    id: '5',
    title: 'DevOps Engineer',
    company: 'CloudTech',
    location: 'Seattle, WA',
    salary: '$140,000 - $170,000',
    description: 'Seeking a DevOps Engineer to manage our cloud infrastructure and deployment pipelines.',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform'],
    matchScore: 82,
    postedDate: '1 week ago',
    applicants: 31,
    urgent: false,
    remote: true
  }
];

const filterOptions = [
  { id: 'all', label: 'All Jobs', icon: FiTarget },
  { id: 'remote', label: 'Remote Only', icon: FiMapPin },
  { id: 'urgent', label: 'Urgent Hiring', icon: FiZap },
  { id: 'high-match', label: 'High Match (85+)', icon: FiStar }
];

export const JobsContainer = () => {
  const [allJobs] = useState<Job[]>(mockJobs);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(mockJobs);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [rejectedJobs, setRejectedJobs] = useState<Job[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [undoStack, setUndoStack] = useState<{job: Job, action: 'saved' | 'rejected', index: number}[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);
  const rotation = useTransform(dragX, [-200, 200], [-15, 15]);
  const opacity = useTransform(dragX, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // Filter jobs based on active filter
  useEffect(() => {
    let filtered = [...allJobs];
    
    switch (activeFilter) {
      case 'remote':
        filtered = filtered.filter(job => job.remote);
        break;
      case 'urgent':
        filtered = filtered.filter(job => job.urgent);
        break;
      case 'high-match':
        filtered = filtered.filter(job => job.matchScore >= 85);
        break;
      default:
        break;
    }
    
    setFilteredJobs(filtered);
    setCurrentIndex(0);
  }, [activeFilter, allJobs]);

  // Auto-show stats after user interaction
  useEffect(() => {
    if (savedJobs.length > 0 || rejectedJobs.length > 0) {
      const timer = setTimeout(() => setShowStats(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [savedJobs.length, rejectedJobs.length]);

  const handleSwipe = (direction: 'left' | 'right', jobId?: string) => {
    if (isAnimating) return; // Prevent multiple swipes during animation
    
    const currentJob = filteredJobs[currentIndex];
    if (!currentJob) return;

    setIsAnimating(true);
    setSwipeDirection(direction);
    
    // Add to undo stack
    const undoAction = {
      job: currentJob,
      action: direction === 'right' ? 'saved' as const : 'rejected' as const,
      index: currentIndex
    };
    setUndoStack(prev => [...prev.slice(-4), undoAction]); // Keep last 5 actions

    if (direction === 'right') {
      setSavedJobs(prev => [...prev, currentJob]);
    } else {
      setRejectedJobs(prev => [...prev, currentJob]);
    }

    // Reset drag position
    dragX.set(0);

    // Immediately update the current index to show the next job
    if (currentIndex < filteredJobs.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }

    // Reset animation state after a short delay
    setTimeout(() => {
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 300);
  };

  const handleUndo = () => {
    if (isAnimating) return; // Prevent undo during animation
    
    const lastAction = undoStack[undoStack.length - 1];
    if (!lastAction) return;

    // Remove from respective arrays
    if (lastAction.action === 'saved') {
      setSavedJobs(prev => prev.filter(job => job.id !== lastAction.job.id));
    } else {
      setRejectedJobs(prev => prev.filter(job => job.id !== lastAction.job.id));
    }

    // Go back to previous job
    setCurrentIndex(lastAction.index);
    setUndoStack(prev => prev.slice(0, -1));
    setSwipeDirection(null);
    dragX.set(0);
  };

  const resetJobs = () => {
    setCurrentIndex(0);
    setSavedJobs([]);
    setRejectedJobs([]);
    setUndoStack([]);
    setSwipeDirection(null);
    setIsAnimating(false);
    dragX.set(0);
  };

  const currentJob = filteredJobs[currentIndex];
  const nextJob = filteredJobs[currentIndex + 1];
  const noMoreJobs = currentIndex >= filteredJobs.length;
  const progress = filteredJobs.length > 0 ? (currentIndex / filteredJobs.length) * 100 : 0;

  const stats = {
    total: savedJobs.length + rejectedJobs.length,
    saved: savedJobs.length,
    rejected: rejectedJobs.length,
    averageMatch: savedJobs.length > 0 
      ? Math.round(savedJobs.reduce((sum, job) => sum + job.matchScore, 0) / savedJobs.length)
      : 0
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 pt-10 relative bg-slate-900 text-white">
      {/* Progress Bar with Enhanced Counter */}
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-purple-200">
              <span className="text-lg font-bold text-yellow-400">{Math.min(currentIndex + 1, filteredJobs.length)}</span> of {filteredJobs.length} jobs
            </span>
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
              {Math.round((Math.min(currentIndex + 1, filteredJobs.length) / filteredJobs.length) * 100)}% complete
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full transition-all duration-300 ${
                showFilters ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              <FiFilter className="w-4 h-4" />
            </button>
            
            {/* Stats Toggle */}
            <button
              onClick={() => setShowStats(!showStats)}
              className={`p-2 rounded-full transition-all duration-300 ${
                showStats ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              <FiTrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="relative w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-500 to-purple-500 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </motion.div>
          <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-end pr-2">
            <span className="text-[10px] font-medium text-white/80 drop-shadow-sm">
              {Math.min(currentIndex + 1, filteredJobs.length)}/{filteredJobs.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="w-full max-w-md mb-6 overflow-hidden"
          >
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                {filterOptions.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      activeFilter === filter.id
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <filter.icon className="w-4 h-4" />
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Panel */}
      <AnimatePresence>
        {showStats && stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="w-full max-w-md mb-6 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-200">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FiTrendingUp className="w-4 h-4" />
                Your Job Hunt Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.saved}</div>
                  <div className="text-xs text-slate-600">Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{stats.averageMatch}%</div>
                  <div className="text-xs text-slate-600">Avg Match</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Job Card Container */}
      <div ref={containerRef} className="w-full max-w-md relative h-[500px] perspective-1000">
        <AnimatePresence mode="wait">
          {noMoreJobs ? (
            <motion.div
              key="no-more-jobs"
              initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-white p-8 rounded-3xl shadow-2xl text-center border border-slate-200 h-full flex flex-col justify-center"
            >
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiTarget className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-800">All Done!</h3>
                <p className="text-slate-600 mb-6">
                  You've reviewed all {filteredJobs.length} jobs in this category.
                </p>
              </div>
              
              {stats.saved > 0 && (
                <div className="bg-green-50 p-4 rounded-2xl mb-6 border border-green-200">
                  <div className="flex items-center justify-center gap-2 text-green-700 font-semibold">
                    <FiHeart className="w-5 h-5" />
                    You saved {stats.saved} job{stats.saved !== 1 ? 's' : ''}!
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={resetJobs}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <FiRefreshCw className="w-5 h-5" />
                  Start Over
                </button>
                <button
                  onClick={() => setActiveFilter('all')}
                  className="w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-semibold hover:bg-slate-200 transition-all duration-300"
                >
                  Browse All Jobs
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="relative w-full h-full">
              {/* Next job preview (background layer) */}
              {nextJob && (
                <motion.div 
                  key={`preview-${nextJob.id}`}
                  className="absolute inset-0"
                  initial={{ scale: 0.9, y: 20, opacity: 0.7 }}
                  animate={{ scale: 0.95, y: 10, opacity: 0.8 }}
                  transition={{ duration: 0.3 }}
                  style={{ zIndex: 1 }}
                >
                  <JobCard
                    job={nextJob}
                    onSwipe={() => {}}
                    active={false}
                    preview={true}
                  />
                </motion.div>
              )}

              {/* Current job (foreground layer) */}
              <motion.div
                key={`current-${currentJob.id}`}
                style={{ 
                  x: swipeDirection ? (swipeDirection === 'right' ? 300 : -300) : dragX, 
                  rotate: swipeDirection ? (swipeDirection === 'right' ? 15 : -15) : rotation, 
                  opacity: swipeDirection ? 0 : opacity,
                  zIndex: 2
                }}
                className="absolute inset-0"
                initial={{ scale: 1, y: 0, opacity: 1 }}
                animate={swipeDirection ? {
                  x: swipeDirection === 'right' ? 300 : -300,
                  rotate: swipeDirection === 'right' ? 15 : -15,
                  opacity: 0,
                  scale: 0.8
                } : {
                  scale: 1,
                  y: 0,
                  opacity: 1
                }}
                transition={{ 
                  duration: 0.3, 
                  ease: "easeInOut"
                }}
                drag="x"
                dragConstraints={{ left: -100, right: 100 }}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 100) {
                    handleSwipe(info.offset.x > 0 ? 'right' : 'left');
                  } else {
                    dragX.set(0);
                  }
                }}
              >
                <JobCard
                  job={currentJob}
                  onSwipe={handleSwipe}
                  active={true}
                  swipeDirection={swipeDirection}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      {!noMoreJobs && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSwipe('left')}
            disabled={isAnimating}
            className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiX className="w-6 h-6" />
          </motion.button>
          
          {undoStack.length > 0 && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUndo}
              disabled={isAnimating}
              className="w-12 h-12 bg-yellow-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className="w-5 h-5" />
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSwipe('right')}
            disabled={isAnimating}
            className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiHeart className="w-6 h-6" />
          </motion.button>
        </div>
      )}

      {/* Swipe Instructions */}
      {!noMoreJobs && currentIndex === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex items-center justify-center gap-8 mt-6 text-sm text-slate-500"
        >
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mb-1">
              <FiX className="text-red-500 text-sm" />
            </div>
            <span className="text-xs">Pass</span>
          </div>
          <div className="text-xs text-slate-400">Swipe or tap</div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-1">
              <FiHeart className="text-green-500 text-sm" />
            </div>
            <span className="text-xs">Save</span>
          </div>
        </motion.div>
      )}

      {/* Quick Stats Footer */}
      {(savedJobs.length > 0 || rejectedJobs.length > 0) && !showStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center gap-4 text-sm text-slate-600"
        >
          {savedJobs.length > 0 && (
            <div className="flex items-center gap-1">
              <FiHeart className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-green-600">{savedJobs.length}</span>
              <span>saved</span>
            </div>
          )}
          {rejectedJobs.length > 0 && (
            <div className="flex items-center gap-1">
              <FiX className="w-4 h-4 text-red-500" />
              <span className="font-semibold text-red-600">{rejectedJobs.length}</span>
              <span>passed</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default JobsContainer;