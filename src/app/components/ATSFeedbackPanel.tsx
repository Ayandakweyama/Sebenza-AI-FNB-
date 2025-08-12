'use client';

import { useState } from 'react';
import { ATSScore } from './ATSScore';
import { ScoreBreakdown } from './ScoreBreakdown';

type ATSFeedbackPanelProps = {
  score: number;
  breakdown: {
    sections: number;
    keywords: number;
    length: number;
    formatting: number;
  };
  feedback: {
    sections: string[];
    keywords: string[];
    length: string[];
    formatting: string[];
  };
  className?: string;
};

export function ATSFeedbackPanel({ 
  score, 
  breakdown, 
  feedback, 
  className = '' 
}: ATSFeedbackPanelProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ATS Score Analysis</h2>
            <p className="text-gray-600 dark:text-gray-300">
              How well your resume performs with Applicant Tracking Systems
            </p>
          </div>
          <ATSScore score={score} />
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Score Breakdown</h3>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showBreakdown ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          {showBreakdown && (
            <div className="mt-4">
              <ScoreBreakdown scores={breakdown} feedback={feedback} />
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Tips to improve your ATS score:</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• Use standard section headers like "Work Experience" and "Education"</li>
          <li>• Include relevant keywords from the job description</li>
          <li>• Keep your resume between 1-2 pages</li>
          <li>• Use a clean, professional format with good contrast</li>
        </ul>
      </div>
    </div>
  );
}
