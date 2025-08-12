'use client';

import { motion } from 'framer-motion';

type ATSScoreProps = {
  score: number;
  maxScore?: number;
  label?: string;
  className?: string;
};

export function ATSScore({ score, maxScore = 100, label = 'ATS Score', className = '' }: ATSScoreProps) {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };
  
  const getRingColor = (score: number) => {
    if (score >= 80) return 'stroke-green-500';
    if (score >= 50) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className="stroke-gray-200 dark:stroke-gray-700"
            strokeWidth="8"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className={getRingColor(score)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="283"
            strokeDashoffset="283"
            initial={{ strokeDashoffset: 283 }}
            animate={{ 
              strokeDashoffset: 283 - (283 * percentage / 100) 
            }}
            transition={{ duration: 1, ease: "easeOut" }}
            transform="rotate(-90 50 50)"
          />
          
          {/* Score text */}
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            className={`text-3xl font-bold ${getScoreColor(score)}`}
          >
            {Math.round(score)}
          </text>
          
          {/* Max score */}
          <text
            x="50"
            y="70"
            textAnchor="middle"
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            / {maxScore}
          </text>
        </svg>
      </div>
      
      <div className="mt-2 text-center">
        <h3 className="text-lg font-medium">{label}</h3>
        <p className={`text-sm font-medium ${getScoreColor(score)}`}>
          {getScoreLabel(score)}
        </p>
      </div>
    </div>
  );
}
