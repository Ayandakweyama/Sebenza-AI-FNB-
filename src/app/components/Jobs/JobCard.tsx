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
      className={`relative bg-white rounded-2xl shadow-lg overflow-hidden h-full ${preview ? 'mt-4' : ''}`}
      dragElastic={0.2}
      whileDrag={{ scale: 1.02 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ scale: 0.95, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      className="relative bg-card p-6 rounded-2xl shadow-xl w-full max-w-md mx-auto cursor-grab active:cursor-grabbing transition-all duration-300"
    >
      {/* Match Score */}
      <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
        Match: {job.matchScore}%
      </div>

      {/* Job Title + Company */}
      <h3 className="text-xl font-bold text-foreground mb-1">{job.title}</h3>
      <p className="text-muted-foreground font-medium mb-4">{job.company}</p>

      {/* Location + Salary */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
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
      <p className="text-foreground/80 mb-4 line-clamp-3 text-sm leading-relaxed">
        {job.description}
      </p>

      {/* Skills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {job.skills.map((skill, index) => (
          <span
            key={index}
            className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t border-border mt-6">
        {/* Skip */}
        <button
          className="p-3 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          onClick={() => onSwipe('left')}
        >
          <FiX className="w-6 h-6" />
        </button>

        {/* Apply */}
        <button
          className="px-6 py-2 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow"
          onClick={() => onSwipe('right')}
        >
          <FiSend className="w-4 h-4" />
          Apply
        </button>

        {/* Save */}
        <button className="p-3 rounded-full bg-muted text-foreground hover:bg-muted/70 transition-colors">
          <FiBookmark className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
};

export default JobCard;
