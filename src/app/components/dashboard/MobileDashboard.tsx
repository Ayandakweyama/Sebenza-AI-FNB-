import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from './context/DashboardContext';
import type { NavigationItem } from './types';
import { Bot, Briefcase, User, ClipboardList } from 'lucide-react';

interface MobileDashboardProps {
  navigationItems?: NavigationItem[];
  hoveredCard?: number | null;
  setHoveredCard?: (card: number | null) => void;
  setChatbotOpen?: (open: boolean) => void;
  chatbotOpen?: boolean;
}

const getIconComponent = (iconName: string) => {
  const iconProps = {
    className: "w-6 h-6 text-white",
    strokeWidth: 2,
  };
  
  switch (iconName) {
    case 'Bot':
      return <Bot {...iconProps} />;
    case 'Briefcase':
      return <Briefcase {...iconProps} />;
    case 'User':
      return <User {...iconProps} />;
    case 'ClipboardList':
      return <ClipboardList {...iconProps} />;
    default:
      return <span className="w-6 h-6 text-white text-2xl font-bold flex items-center justify-center">?</span>;
  }
};

export const MobileDashboard: React.FC<MobileDashboardProps> = (props) => {
  const router = useRouter();
  const context = useDashboard();
  const [pressedItem, setPressedItem] = useState<number | null>(null);
  
  // Use props if provided, otherwise use context
  const {
    navigationItems = [],
    hoveredCard,
    setHoveredCard = () => {},
    setChatbotOpen = () => {},
    chatbotOpen = false,
    user,
    setSidebarCollapsed = () => {}
  } = { ...context, ...props };
  
  const handleNavigation = (path: string) => router.push(path);

  const handleTouchStart = useCallback((index: number) => {
    setPressedItem(index);
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    setPressedItem(null);
  }, []);

  return (
    <div className="md:hidden">
      {/* Mobile Navigation Header */}
      <div className="px-4 py-4 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md border-b border-slate-700/50 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-wide drop-shadow-lg">Navigation</h2>
          <div className="text-sm text-slate-300/80 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-600/30 backdrop-blur-sm">
            {navigationItems.length} items
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Navigation */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {navigationItems.map((item: NavigationItem, index: number) => {
            const isHovered = hoveredCard === index;
            const isPressed = pressedItem === index;
            const hasHoverOptions = item.hoverOptions && item.hoverOptions.length > 0;
            const isAfrigterItem = item.title === 'Afrigter';
            
            return (
              <div key={index} className="relative">
                {/* Sparkle effects for Afrigter */}
                {isAfrigterItem && (
                  <>
                    <div className="absolute -top-2 -left-2 w-3 h-3 bg-pink-400 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-60 animation-delay-500"></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-indigo-400 rounded-full animate-ping opacity-60 animation-delay-1000"></div>
                    <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-pink-300 rounded-full animate-ping opacity-75 animation-delay-1500"></div>
                  </>
                )}
                <div 
                  className={`relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all duration-300 transform will-change-transform min-h-[140px] backdrop-blur-md ${
                    isPressed 
                      ? 'scale-95 shadow-inner' 
                      : isHovered 
                        ? 'scale-105 shadow-2xl shadow-pink-500/20' 
                        : 'scale-100 hover:scale-105'
                  } ${
                    isAfrigterItem 
                      ? 'bg-gradient-to-br from-pink-500/20 via-purple-500/15 to-indigo-500/20 border border-pink-500/40 shadow-xl shadow-pink-500/30 ring-1 ring-pink-500/20' 
                      : 'bg-slate-800/60 border border-slate-700/40 hover:bg-slate-700/70 hover:border-slate-600/60 shadow-lg shadow-slate-900/50'
                  } ${isPressed ? 'bg-slate-700/80 shadow-inner' : ''}`}
                  onClick={() => hasHoverOptions 
                    ? setHoveredCard(isHovered ? null : index)
                    : handleNavigation(item.path)}
                  onTouchStart={() => handleTouchStart(index)}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={() => handleTouchStart(index)}
                  onMouseUp={handleTouchEnd}
                  onMouseLeave={handleTouchEnd}
                >
                  {/* Background gradient effect */}
                  <div className={`absolute inset-0 opacity-0 transition-opacity duration-500 ${
                    isAfrigterItem 
                      ? 'bg-gradient-to-br from-pink-500/15 via-purple-500/10 to-indigo-500/15' 
                      : 'bg-gradient-to-br from-slate-700/30 to-slate-600/30'
                  } ${isHovered ? 'opacity-100' : 'group-hover:opacity-80'}`}></div>
                  
                  {/* Afrigter glow effect */}
                  {isAfrigterItem && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-pink-500/8 via-purple-500/6 to-indigo-500/8 animate-breathe min-h-[140px]"></div>
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Top section with icon and expand indicator */}
                    <div className="relative">
                      {/* Icon */}
                      <div className={`w-20 h-20 rounded-xl flex items-center justify-center mb-3 mx-auto transition-all duration-300 ${
                        isAfrigterItem 
                          ? 'bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 shadow-lg shadow-pink-500/50 ring-2 ring-pink-400/30' 
                          : 'bg-gradient-to-br from-slate-700/90 to-slate-600/90 shadow-md shadow-slate-900/50 ring-1 ring-slate-500/20'
                      } ${
                        isPressed ? 'scale-95' : isHovered ? 'scale-110' : 'hover:scale-105'
                      } transform`}>
                        {item.title === 'Afrigter' ? (
                          <img 
                            src="/Sebenza ai raw logo.png" 
                            alt="Sebenza AI Logo" 
                            className={`w-full h-full object-contain transition-transform duration-300 p-2 ${
                              isPressed ? 'scale-90' : isHovered ? 'scale-110' : 'hover:scale-105'
                            }`}
                          />
                        ) : (
                          <div className={`w-6 h-6 transition-transform duration-300 ${
                            isPressed ? 'scale-90' : isHovered ? 'scale-110' : 'hover:scale-105'
                          }`}>
                            {getIconComponent(item.icon)}
                          </div>
                        )}
                      </div>
                      
                      {/* Expand indicator */}
                      {hasHoverOptions && (
                        <div className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm ${
                          isHovered 
                            ? 'rotate-90 bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-400/40 shadow-lg shadow-pink-500/30' 
                            : 'bg-slate-800/80 border border-slate-600/40 shadow-md'
                        }`}>
                          <svg 
                            className="w-3 h-3 text-white transition-transform duration-300" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Bottom section with text */}
                    <div className="flex-1 flex flex-col justify-end mt-2">
                      {/* Title */}
                      <h3 className={`font-bold text-center mb-2 text-sm leading-tight transition-colors duration-300 ${
                        isAfrigterItem 
                          ? 'text-white drop-shadow-lg' 
                          : 'text-white'
                      } ${isPressed ? 'text-slate-200 scale-95' : isHovered ? 'text-blue-100' : ''}`}>
                        {item.title}
                      </h3>
                      
                      {/* Description - truncated for mobile */}
                      {item.description && (
                        <p className="text-xs text-slate-300/80 text-center leading-relaxed line-clamp-2 px-1 transition-colors duration-300">
                          {item.description.length > 45 
                            ? `${item.description.substring(0, 45)}...` 
                            : item.description
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Mobile Dropdown Options */}
                {isHovered && hasHoverOptions && (
                  <div className="mt-3 animate-in slide-in-from-top-2 duration-300 ease-out">
                    <div className={`border-l-4 pl-4 space-y-2 backdrop-blur-sm rounded-lg p-2 ${
                      isAfrigterItem 
                        ? 'border-pink-500/60 bg-gradient-to-r from-pink-500/10 to-purple-500/10' 
                        : 'border-slate-500/60 bg-slate-800/40'
                    }`}>
                      {item.hoverOptions?.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                            isAfrigterItem 
                              ? 'hover:bg-pink-500/20 active:bg-pink-500/30 text-pink-100 border border-pink-500/20' 
                              : 'hover:bg-slate-700/70 active:bg-slate-600/90 text-slate-200 border border-slate-600/30'
                          } cursor-pointer shadow-md hover:shadow-lg backdrop-blur-sm`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (option.action) {
                              option.action();
                            } else {
                              router.push(option.path);
                            }
                            setHoveredCard(null);
                          }}
                          onTouchStart={() => handleTouchStart(-1)}
                          onTouchEnd={handleTouchEnd}
                        >
                          <span className="text-sm font-semibold tracking-wide">{option.label}</span>
                          <svg 
                            className="w-4 h-4 opacity-70 transition-transform duration-300 group-hover:translate-x-1" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};