import React from 'react';

type Template = 'professional' | 'modern' | 'creative' | 'minimal';

interface CVLayoutProps {
  children: React.ReactNode;
  template: Template;
}

// Template-specific background gradients
const templateGradients = {
  professional: 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800',
  modern: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
  creative: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900',
  minimal: 'bg-gradient-to-br from-slate-100 to-slate-300',
};

// Template-specific text colors
const templateTextColors = {
  professional: 'text-white',
  modern: 'text-white',
  creative: 'text-white',
  minimal: 'text-slate-800',
};

const CVLayout: React.FC<CVLayoutProps> = ({ children, template = 'modern' }) => {
  const gradientClass = templateGradients[template];
  const textColorClass = templateTextColors[template];

  return (
    <div className={`min-h-screen relative overflow-hidden ${gradientClass} ${textColorClass}`}>
      {/* Animated background elements - only show for non-minimal templates */}
      {template !== 'minimal' && (
        <div className="absolute inset-0">
          <div className={`absolute top-20 left-10 w-72 h-72 ${
            template === 'professional' ? 'bg-blue-500' : 
            template === 'creative' ? 'bg-pink-500' : 'bg-purple-500'
          } rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse`}></div>
          <div className={`absolute top-40 right-10 w-72 h-72 ${
            template === 'professional' ? 'bg-slate-600' : 
            template === 'creative' ? 'bg-indigo-400' : 'bg-yellow-400'
          } rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000`}></div>
          <div className={`absolute bottom-20 left-1/2 w-72 h-72 ${
            template === 'professional' ? 'bg-blue-400' : 
            template === 'creative' ? 'bg-purple-400' : 'bg-purple-400'
          } rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000`}></div>
        </div>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default CVLayout;