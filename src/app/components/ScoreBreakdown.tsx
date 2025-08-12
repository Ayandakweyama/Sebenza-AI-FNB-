'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ScoreCategory = 'sections' | 'keywords' | 'length' | 'formatting';

type ScoreBreakdownProps = {
  scores: {
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
};

export function ScoreBreakdown({ scores, feedback }: ScoreBreakdownProps) {
  const [expandedCategory, setExpandedCategory] = useState<ScoreCategory | null>(null);

  const categoryInfo: Record<ScoreCategory, { label: string; description: string }> = {
    sections: {
      label: 'Sections',
      description: 'Measures if your CV has all the essential sections clearly labeled.'
    },
    keywords: {
      label: 'Keywords',
      description: 'Checks for relevant industry-specific terms and skills.'
    },
    length: {
      label: 'Length',
      description: 'Evaluates if your CV has an appropriate amount of content.'
    },
    formatting: {
      label: 'Formatting',
      description: 'Assesses the overall structure and readability of your CV.'
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getImprovementTips = (category: ScoreCategory) => {
    const tips: Record<ScoreCategory, string[]> = {
      sections: [
        'Ensure you have clear section headers like "WORK EXPERIENCE", "EDUCATION", and "SKILLS"',
        'Use consistent formatting for section headers (all caps, bold, or underlined)',
        'List your experience in reverse chronological order (most recent first)'
      ],
      keywords: [
        'Review the job description and include relevant keywords',
        'Incorporate industry-specific terminology',
        'List both general and specific skills relevant to the position',
        'Include variations of important terms (e.g., "JavaScript" and "JS")
      ],
      length: [
        'Aim for 1-2 pages for most industries',
        'Include 3-5 bullet points per position',
        'Focus on achievements rather than just responsibilities',
        'Remove outdated or irrelevant experiences'
      ],
      formatting: [
        'Use a clean, professional font (Arial, Calibri, or Times New Roman)',
        'Maintain consistent spacing and alignment',
        'Use bullet points for better readability',
        'Avoid using tables or complex formatting that might not parse well'
      ]
    };

    return [...tips[category], ...feedback[category]];
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Score Breakdown</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(scores) as ScoreCategory[]).map((category) => {
          const score = scores[category];
          const { label, description } = categoryInfo[category];
          const isExpanded = expandedCategory === category;

          return (
            <div 
              key={category}
              className={`p-4 rounded-lg border ${isExpanded ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
              onClick={() => setExpandedCategory(isExpanded ? null : category)}
            >
              <div className="flex justify-between items-center cursor-pointer">
                <div>
                  <h4 className="font-medium">{label}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                    {Math.round(score)}%
                  </span>
                  <button 
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCategory(isExpanded ? null : category);
                    }}
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700"
                  >
                    <h5 className="text-sm font-medium mb-2">How to improve:</h5>
                    <ul className="space-y-1.5 text-sm">
                      {getImprovementTips(category).map((tip, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
