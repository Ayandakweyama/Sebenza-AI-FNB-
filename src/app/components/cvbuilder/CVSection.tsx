import React, { ReactNode } from 'react';
import { Plus, X, ChevronDown, ChevronUp, GripVertical, LucideIcon } from 'lucide-react';

interface CVSectionProps {
  title: string;
  icon: React.ReactElement<{ className?: string }> | LucideIcon;
  children: ReactNode;
  onAdd?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
  isRemovable?: boolean;
}

const CVSection: React.FC<CVSectionProps> = ({
  title,
  icon,
  children,
  onAdd,
  isOpen,
  onToggle,
  onRemove,
  isRemovable = false,
}) => {
  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <div 
        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-2">
          <GripVertical className="text-gray-400" />
          {React.isValidElement(icon) 
            ? React.cloneElement(icon, { className: 'w-5 h-5 text-blue-600' } as React.HTMLAttributes<SVGElement>)
            : React.createElement(icon, { className: 'w-5 h-5 text-blue-600' })}
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {onAdd && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded-full"
              aria-label={`Add ${title}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {isRemovable && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 text-red-600 hover:bg-red-50 rounded-full"
              aria-label={`Remove ${title}`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            className="p-1 text-gray-500 hover:bg-gray-100 rounded-full"
            aria-label={isOpen ? 'Collapse section' : 'Expand section'}
          >
            {isOpen ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      {(isOpen === undefined || isOpen) && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

export default CVSection;
