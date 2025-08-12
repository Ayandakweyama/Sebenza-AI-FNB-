'use client';

import { motion, PanInfo, useAnimation } from 'framer-motion';
import { useState } from 'react';
import {
  FiHeart,
  FiX,
  FiSend,
  FiBookmark,
  FiMapPin,
  FiDollarSign
} from 'react-icons/fi';

interface JobCardProps {
  job: {
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
  };
  onSwipe: (direction: 'left' | 'right') => void;
  active: boolean;
  preview?: boolean;
  swipeDirection?: 'left' | 'right' | null;
}

export const JobCard = ({ job, onSwipe, active, preview = false, swipeDirection = null }: JobCardProps) => {
  const controls = useAnimation();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleDragEnd = async (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!active || isAnimating) return;
    
    const threshold = 120;
    let direction: 'left' | 'right' | null = null;
    
    if (info.offset.x > threshold) {
      direction = 'right';
    } else if (info.offset.x < -threshold) {
      direction = 'left';
    }
    
    if (direction) {
      setIsAnimating(true);
      await controls.start({
        x: direction === 'right' ? '100vw' : '-100vw',
        opacity: 0,
        transition: { duration: 0.3 }
      });
      onSwipe(direction);
      setIsAnimating(false);
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  return (
    <motion.div
      drag={active && !isAnimating ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      initial={preview ? { scale: 0.95, y: 10, opacity: 0.8 } : undefined}
      animate={{
        scale: preview ? 0.95 : 1,
        y: preview ? 10 : 0,
        opacity: preview ? 0.8 : 1,
        transition: { duration: 0.3 }
      }}
      className={`relative bg-slate-800 rounded-2xl shadow-lg overflow-hidden h-full ${preview ? 'mt-4' : ''} border border-slate-700`}
      dragElastic={0.2}
      whileDrag={{ scale: 1.02 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ scale: 0.95, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      style={{
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Match Score */}
      <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
        Match: {job.matchScore}%
      </div>

      {/* Job Title + Company */}
      <h3 className="text-xl font-bold text-white mb-1">{job.title}</h3>
      <p className="text-purple-300 font-medium mb-4">{job.company}</p>

      {/* Location + Salary */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 mb-4">
        <div className="flex items-center gap-1">
          <FiMapPin className="w-4 h-4" />
          <span>{job.location}</span>
        </div>
        {job.salary && (
          <div className="flex items-center gap-1">
            <FiDollarSign className="w-4 h-4" />
            <span>{job.salary}</span>
          </div>
        )}
      </div>

      {/* Short Description */}
      <p className="text-slate-300 mb-4 line-clamp-3 text-sm leading-relaxed">
        {job.description}
      </p>

      {/* Skills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {job.skills.map((skill, index) => (
          <span
            key={index}
            className="bg-slate-700/50 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-500/30"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t border-slate-700 mt-6">
        {/* Skip */}
        <button
          className="p-3 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          onClick={() => onSwipe('left')}
        >
          <FiX className="w-6 h-6" />
        </button>

        {/* Apply */}
        <button
          className="px-6 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow-lg hover:shadow-yellow-500/20"
          onClick={() => onSwipe('right')}
        >
          <FiSend className="w-4 h-4" />
          Apply
        </button>

        {/* Save */}
        <button className="p-3 rounded-full bg-slate-700/50 text-yellow-400 hover:bg-slate-600/50 transition-colors border border-slate-600/50">
          <FiBookmark className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
};

export default JobCard;
