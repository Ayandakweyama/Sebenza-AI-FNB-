import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { useDashboard } from './context/DashboardContext';
import type { DesktopSidebarProps, NavigationItem, HoverOption } from './types';
import { useProfileStrength } from '@/hooks/useProfileStrength';
import { RefreshCw, Bot, Briefcase, User, ClipboardList } from 'lucide-react';

// Enhanced animations and transitions with GPU acceleration
const ANIMATION_DURATION = 300;
const HOVER_DELAY = 150;
const STAGGER_DELAY = 50;

const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Enhanced intersection observer for better performance
const useIntersectionObserver = <T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  options: IntersectionObserverInit = {}
): boolean => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
};

// Enhanced mobile detection with orientation support
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(width < 768 || (isTouchDevice && width < 1024));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  return isMobile;
};

// Memoized navigation item component with enhanced mobile support
const NavigationItem = memo(({ 
  item, 
  index,
  isExpanded, 
  isCollapsed, 
  onClick,
  onOptionClick,
  animationDelay = 0
}: {
  item: NavigationItem;
  index: number;
  isExpanded: boolean;
  isCollapsed: boolean;
  onClick: () => void;
  onOptionClick: (option: HoverOption) => void;
  animationDelay?: number;
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const router = useRouter();
  const itemRef = useRef<HTMLLIElement | null>(null);
  const isVisible = useIntersectionObserver<HTMLLIElement>(itemRef, { threshold: 0.1 });
  const isMobile = useIsMobile();

  // Track visibility for staggered animations
  useEffect(() => {
    if (isVisible && !hasBeenVisible) {
      setTimeout(() => setHasBeenVisible(true), animationDelay);
    }
  }, [isVisible, hasBeenVisible, animationDelay]);

  // Enhanced haptic feedback simulation
  const triggerHapticFeedback = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  // Handle direct navigation for menu items without hover options
  const handleItemClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback();
    
    if (!item.hoverOptions || item.hoverOptions.length === 0) {
      if (item.path) {
        router.push(item.path);
        return;
      }
    }
    onClick();
  }, [item.hoverOptions, item.path, router, onClick, triggerHapticFeedback]);

  // Enhanced keyboard handling
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleItemClick(e as any);
    } else if (e.key === 'ArrowDown' && isExpanded) {
      const firstSubItem = itemRef.current?.querySelector('[role="menuitem"]') as HTMLElement;
      firstSubItem?.focus();
    }
  }, [handleItemClick, isExpanded]);

  // Check if this is the Afrigter item
  const isAfrigterItem = item.title === 'Afrigter';

  // Mobile-optimized styles for better touch targets and visibility
  const itemStyles = useMemo(() => {
    const mobileEnhancement = isMobile ? 'min-h-[56px] active:scale-[0.98]' : '';
    
    if (isAfrigterItem) {
      return {
        expanded: `bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white shadow-lg shadow-pink-500/20 scale-[1.02] translate-x-1 ring-1 ring-pink-500/30 ${mobileEnhancement}`,
        default: `text-slate-300 ${
          isMobile 
            ? 'bg-gradient-to-r from-pink-500/15 to-purple-500/15 ring-1 ring-pink-500/25 shadow-md shadow-pink-500/15' 
            : 'hover:bg-gradient-to-r hover:from-pink-500/15 hover:to-purple-500/15 hover:ring-1 hover:ring-pink-500/25 hover:shadow-lg hover:shadow-pink-500/20'
        } hover:text-white hover:scale-[1.02] transition-all duration-300 ${mobileEnhancement}`,
        pressed: 'scale-[0.96] brightness-125 saturate-150'
      };
    }
    
    return {
      expanded: `bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-white shadow-lg shadow-purple-500/10 scale-[1.02] translate-x-1 ${mobileEnhancement}`,
      default: `text-slate-300 ${isMobile ? 'active:bg-slate-800/70' : 'hover:bg-slate-800/50'} hover:text-white hover:scale-[1.01] hover:shadow-md ${mobileEnhancement}`,
      pressed: 'scale-[0.98] brightness-110'
    };
  }, [isAfrigterItem, isMobile]);

  // Mobile-optimized icon styles with better visibility
  const iconStyles = useMemo(() => {
    if (isAfrigterItem) {
      return {
        expanded: 'bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30 ring-2 ring-pink-400/20',
        default: `${
          isMobile 
            ? 'bg-gradient-to-br from-pink-500/90 to-purple-500/90 text-white shadow-md shadow-pink-500/30' 
            : 'bg-slate-800/50 text-slate-400 group-hover:bg-gradient-to-br group-hover:from-pink-500/90 group-hover:to-purple-500/90 group-hover:text-white group-hover:shadow-lg group-hover:shadow-pink-500/30'
        } transition-all duration-300`
      };
    }
    
    return {
      expanded: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25',
      default: `${
        isMobile
          ? 'bg-slate-800/70 text-slate-300'
          : 'bg-slate-800/50 text-slate-400 group-hover:bg-slate-700/50 group-hover:text-slate-200'
      } group-hover:shadow-md transition-all duration-300`
    };
  }, [isAfrigterItem, isMobile]);

  return (
    <li 
      ref={itemRef}
      className={`relative group transition-all duration-300 ${
        hasBeenVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div 
        className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 transform will-change-transform ${
          isExpanded ? itemStyles.expanded : itemStyles.default
        } ${isPressed ? itemStyles.pressed : ''} ${
          isAfrigterItem ? 'hover:shadow-xl hover:shadow-pink-500/25' : ''
        }`}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => {
          if (!isMobile) {
            setIsHovered(false);
            setIsPressed(false);
          }
        }}
        onTouchStart={() => {
          setIsPressed(true);
          triggerHapticFeedback();
        }}
        onTouchEnd={() => setIsPressed(false)}
        onMouseDown={() => !isMobile && setIsPressed(true)}
        onMouseUp={() => !isMobile && setIsPressed(false)}
        onClick={handleItemClick}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${item.title}${item.hoverOptions?.length ? ' - expandable menu' : ''}${isAfrigterItem ? ' - featured item' : ''}`}
        onKeyDown={handleKeyDown}
      >
        {/* Enhanced icon container with guaranteed visibility */}
        <div className={`p-2 rounded-lg transition-all duration-300 will-change-transform flex-shrink-0 ${
          isExpanded ? iconStyles.expanded : iconStyles.default
        }`}>
          <span className={`text-lg flex items-center justify-center ${
            isAfrigterItem ? 'transform hover:scale-110 transition-transform duration-200' : ''
          }`} role="img" aria-label={item.title}>
            {(() => {
              const iconProps = {
                className: `w-5 h-5 transition-colors duration-300 ${isMobile ? 'text-white' : 'text-current group-hover:text-white'}`,
                strokeWidth: 2,
                'aria-hidden': true
              };
              
              switch (item.icon) {
                case 'Bot':
                  return <Bot {...iconProps} />;
                case 'Briefcase':
                  return <Briefcase {...iconProps} />;
                case 'User':
                  return <User {...iconProps} />;
                case 'ClipboardList':
                  return <ClipboardList {...iconProps} />;
                default:
                  return (
                    <span className={`w-5 h-5 flex items-center justify-center font-bold ${isMobile ? 'text-white' : 'text-current'}`}>
                      ?
                    </span>
                  );
              }
            })()}
          </span>
        </div>
        
        {!isCollapsed && (
          <span className={`ml-3 font-medium transition-all duration-200 select-none ${
            isAfrigterItem ? 'font-semibold tracking-wide' : ''
          } ${isMobile ? 'text-base' : 'text-sm'}`}>
            {item.title}
          </span>
        )}
        
        {!isCollapsed && item.hoverOptions && item.hoverOptions.length > 0 && (
          <svg 
            className={`ml-auto w-4 h-4 transition-all duration-200 will-change-transform flex-shrink-0 ${
              isExpanded 
                ? isAfrigterItem 
                  ? 'rotate-90 text-pink-400' 
                  : 'rotate-90 text-purple-400'
                : isAfrigterItem
                  ? 'text-pink-500/70 group-hover:text-pink-400'
                  : 'text-slate-500 group-hover:text-slate-400'
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
      
      {/* Enhanced submenu with mobile optimization */}
      {!isCollapsed && isExpanded && item.hoverOptions && item.hoverOptions.length > 0 && (
        <div 
          className={`ml-2 mt-1.5 space-y-1.5 pl-4 border-l-2 ${
            isAfrigterItem ? 'border-pink-500/30' : 'border-slate-700/50'
          } animate-in slide-in-from-left-2 duration-200 will-change-transform`}
          role="menu"
          aria-label={`${item.title} submenu`}
        >
          {item.hoverOptions.map((option: HoverOption, optionIndex: number) => (
            <SubmenuItem
              key={`${item.title}-option-${optionIndex}`}
              option={option}
              index={optionIndex}
              onOptionClick={onOptionClick}
              animationDelay={optionIndex * 50}
              isAfrigterSubmenu={isAfrigterItem}
            />
          ))}
        </div>
      )}
    </li>
  );
});

NavigationItem.displayName = 'NavigationItem';

// Enhanced submenu item with mobile touch support
const SubmenuItem = memo(({ 
  option, 
  index, 
  onOptionClick, 
  animationDelay = 0,
  isAfrigterSubmenu = false
}: {
  option: HoverOption;
  index: number;
  onOptionClick: (option: HoverOption) => void;
  animationDelay?: number;
  isAfrigterSubmenu?: boolean;
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onOptionClick(option);
  }, [option, onOptionClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOptionClick(option);
    } else if (e.key === 'ArrowUp') {
      const prevItem = itemRef.current?.previousElementSibling as HTMLElement;
      prevItem?.focus();
    } else if (e.key === 'ArrowDown') {
      const nextItem = itemRef.current?.nextElementSibling as HTMLElement;
      nextItem?.focus();
    }
  }, [option, onOptionClick]);

  return (
    <div
      ref={itemRef}
      className={`flex items-center p-2.5 text-sm text-slate-300 ${
        isAfrigterSubmenu 
          ? isMobile
            ? 'active:bg-pink-500/15 active:ring-1 active:ring-pink-500/25'
            : 'hover:bg-pink-500/10 hover:ring-1 hover:ring-pink-500/20 hover:shadow-md hover:shadow-pink-500/10'
          : isMobile
            ? 'active:bg-slate-800/80'
            : 'hover:bg-slate-800/70'
      } rounded-lg cursor-pointer transition-all duration-200 hover:translate-x-1 group/option will-change-transform ${
        isPressed ? 'scale-[0.98]' : ''
      } ${isMobile ? 'min-h-[48px]' : ''}`}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={handleClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => !isMobile && setIsPressed(true)}
      onMouseUp={() => !isMobile && setIsPressed(false)}
      onMouseLeave={() => !isMobile && setIsPressed(false)}
      role="menuitem"
      tabIndex={0}
      aria-label={option.label}
      onKeyDown={handleKeyDown}
    >
      <div className={`w-1.5 h-1.5 rounded-full mr-3 transition-all duration-200 group-hover/option:scale-125 flex-shrink-0 ${
        isAfrigterSubmenu 
          ? 'bg-pink-400 group-hover/option:bg-pink-300 group-hover/option:shadow-sm group-hover/option:shadow-pink-300/50' 
          : 'bg-purple-400 group-hover/option:bg-purple-300'
      }`}></div>
      <span className={`text-slate-300 group-hover/option:text-white transition-colors duration-200 select-none font-medium flex-1 ${
        isMobile ? 'text-sm' : 'text-xs'
      }`}>
        {option.label}
      </span>
      <svg 
        className={`ml-auto w-3.5 h-3.5 transition-all duration-200 group-hover/option:translate-x-1 flex-shrink-0 ${
          isAfrigterSubmenu 
            ? 'text-pink-500/70 group-hover/option:text-pink-400' 
            : 'text-slate-500 group-hover/option:text-purple-400'
        }`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
});

SubmenuItem.displayName = 'SubmenuItem';

// Enhanced User Profile Component with mobile optimization
const UserProfile = memo(({ user, isCollapsed }: { user: any; isCollapsed: boolean }) => {
  const { percentage: profileStrength, label: strengthLabel, color: strengthColor, recommendations } = useProfileStrength();
  const [isOnline] = useState(true);
  const [pulseKey, setPulseKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseKey(prev => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    const profileUpdateEvent = new CustomEvent('profileDataUpdated');
    window.dispatchEvent(profileUpdateEvent);
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  const profileStyles = useMemo(() => ({
    container: `overflow-hidden transition-all duration-${ANIMATION_DURATION} will-change-transform ${
      isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100 py-6 px-4'
    }`,
    card: `p-4 bg-slate-800/50 rounded-xl backdrop-blur-sm border border-slate-700/50 shadow-lg ${
      isMobile ? 'active:shadow-xl active:border-slate-600/50' : 'hover:shadow-xl hover:border-slate-600/50'
    } transition-all duration-300`,
    avatar: `${isMobile ? 'w-14 h-14 text-xl' : 'w-12 h-12 text-lg'} bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all duration-300 will-change-transform`,
    statusIndicator: `absolute -bottom-1 -right-1 ${isMobile ? 'w-5 h-5 border-3' : 'w-4 h-4 border-2'} rounded-full border-slate-900 transition-all duration-300 ${
      isOnline ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-slate-400'
    }`
  }), [isCollapsed, isOnline, isMobile]);

  return (
    <div ref={profileRef} className={profileStyles.container}>
      <div className={profileStyles.card}>
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <div className={profileStyles.avatar}>
              {user?.firstName?.[0] || 'U'}
            </div>
            <div 
              className={profileStyles.statusIndicator}
              title={isOnline ? 'Online' : 'Offline'}
            ></div>
          </div>
          <div className="min-w-0 flex-1">
            <p className={`font-semibold text-white truncate ${isMobile ? 'text-base' : 'text-sm'}`}>
              {user?.firstName || 'User'}
            </p>
            <p className={`text-slate-400 font-medium ${isMobile ? 'text-sm' : 'text-xs'}`}>Premium Member</p>
          </div>
        </div>
        
        {/* Enhanced profile strength indicator */}
        <div className={`mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-700/50 ${
          isMobile ? 'active:border-slate-600/50' : 'hover:border-slate-600/50'
        } transition-colors duration-200`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`font-medium text-slate-300 ${isMobile ? 'text-sm' : 'text-xs'}`}>Profile Strength</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-1 ${isMobile ? 'active:bg-slate-600/50' : 'hover:bg-slate-600/50'} rounded transition-colors duration-200 ${
                  isMobile ? 'min-w-[32px] min-h-[32px]' : ''
                }`}
                title="Refresh profile strength"
              >
                <RefreshCw className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'} text-slate-400 hover:text-slate-300 ${
                  isRefreshing ? 'animate-spin' : ''
                }`} />
              </button>
              <span className={`font-medium text-slate-400 ${isMobile ? 'text-sm' : 'text-xs'}`}>{strengthLabel}</span>
              <span className={`font-semibold text-purple-400 ${isMobile ? 'text-sm' : 'text-xs'}`}>{profileStrength}%</span>
            </div>
          </div>
          <div className={`w-full bg-slate-700/50 rounded-full overflow-hidden ${isMobile ? 'h-2.5' : 'h-2'}`}>
            <div 
              className={`bg-gradient-to-r ${strengthColor} h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
              style={{ width: `${profileStrength}%` }}
            >
              <div 
                key={pulseKey}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
              ></div>
            </div>
          </div>
          {profileStrength < 100 && recommendations && recommendations.length > 0 && (
            <Link href="/profile/personal" className="block mt-2">
              <p className={`text-slate-400 hover:text-purple-400 transition-colors cursor-pointer ${
                isMobile ? 'text-sm' : 'text-xs'
              }`}>
                {recommendations[0]}
              </p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
});

UserProfile.displayName = 'UserProfile';

// Main Enhanced Desktop Sidebar Component with mobile support
export const DesktopSidebar: React.FC<Partial<DesktopSidebarProps>> = memo(({
  user: propUser,
  navigationItems: propNavigationItems,
  hoveredCard: propHoveredCard,
  setHoveredCard: propSetHoveredCard,
  sidebarCollapsed: propSidebarCollapsed,
  setSidebarCollapsed: propSetSidebarCollapsed,
  setChatbotOpen: propSetChatbotOpen,
  router: propRouter,
}) => {
  const { 
    user: contextUser, 
    navigationItems: contextNavigationItems, 
    hoveredCard: contextHoveredCard, 
    setHoveredCard: contextSetHoveredCard,
    sidebarCollapsed: contextSidebarCollapsed,
    setSidebarCollapsed: contextSetSidebarCollapsed,
    setChatbotOpen: contextSetChatbotOpen,
    handleNavigation: contextHandleNavigation
  } = useDashboard();
  
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const user = propUser || contextUser;
  const navigationItems = propNavigationItems || contextNavigationItems || [];
  const expandedCard = propHoveredCard ?? contextHoveredCard;
  const setExpandedCardFn = propSetHoveredCard || contextSetHoveredCard || (() => {});
  const sidebarCollapsed = propSidebarCollapsed ?? contextSidebarCollapsed ?? false;
  const setSidebarCollapsedFn = propSetSidebarCollapsed || contextSetSidebarCollapsed || (() => {});
  const setChatbotOpenFn = propSetChatbotOpen || contextSetChatbotOpen || (() => {});
  const handleNavigationFn = contextHandleNavigation || ((path: string) => {
    router.push(path);
  });

  const debouncedCollapsed = useDebounce(sidebarCollapsed, 100);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedCard !== null) {
        setExpandedCardFn(null);
        const expandedItem = sidebarRef.current?.querySelector(`[role="button"][aria-expanded="true"]`) as HTMLElement;
        expandedItem?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expandedCard, setExpandedCardFn]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setExpandedCardFn(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, { passive: true });
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [setExpandedCardFn]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsedFn(true);
      }
    };

    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize, { passive: true });
    handleResize();

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [setSidebarCollapsedFn]);

  const handleSidebarClick = useCallback(() => {
    if (sidebarCollapsed) {
      setSidebarCollapsedFn(false);
    }
  }, [sidebarCollapsed, setSidebarCollapsedFn]);

  const handleCollapseToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSidebarCollapsedFn(!sidebarCollapsed);
  }, [sidebarCollapsed, setSidebarCollapsedFn]);

  const handleNavItemClick = useCallback((item: NavigationItem, index: number) => {
    if (sidebarCollapsed) {
      setSidebarCollapsedFn(false);
      if (item.title === 'Afrigter' && item.hoverOptions?.length) {
        setTimeout(() => setExpandedCardFn(index), 50);
      }
      return;
    }
    
    if (item.hoverOptions && item.hoverOptions.length > 0) {
      setExpandedCardFn(expandedCard === index ? null : index);
      
      if (item.title === 'Afrigter' && item.path) {
        router.push(item.path);
      }
    } 
    else if (item.path) {
      router.push(item.path);
    }
  }, [sidebarCollapsed, setSidebarCollapsedFn, expandedCard, setExpandedCardFn, router]);

  const handleOptionClick = useCallback((option: HoverOption) => {
    if (option.action) {
      option.action();
      return;
    }
    
    if (option.path) {
      router.push(option.path);
      setExpandedCardFn(null);
    }
  }, [router, setExpandedCardFn]);

  const sidebarStyles = useMemo(() => ({
    main: `${
      sidebarCollapsed ? 'w-20 hover:w-72' : 'w-72'
    } bg-slate-900 transition-all duration-${ANIMATION_DURATION} ease-in-out flex flex-col border-r border-slate-800 shadow-2xl relative z-50 group will-change-transform ${
      isMobile ? 'touch-pan-y' : ''
    }`,
    nav: 'flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent',
    list: 'space-y-1.5 px-2'
  }), [sidebarCollapsed, isMobile]);

  return (
    <div 
      ref={sidebarRef}
      className={sidebarStyles.main}
      onClick={handleSidebarClick}
      role="navigation"
      aria-label="Main navigation"
    >
      <UserProfile user={user} isCollapsed={debouncedCollapsed} />
      
      <nav className={sidebarStyles.nav}>
        <ul className={sidebarStyles.list} role="menu">
          {navigationItems.map((item, index) => {
            // Special Afrigter item with enhanced mobile support
            if (item.title === 'Afrigter') {
              return (
                <li key="afrigter-icon" className="relative">
                  <div 
                    className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 transform will-change-transform ${
                      expandedCard === index 
                        ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white shadow-xl shadow-pink-500/25 scale-[1.05] ring-2 ring-pink-500/30' 
                        : isMobile
                          ? 'text-white bg-gradient-to-r from-pink-500/30 to-pink-600/30 shadow-lg shadow-pink-500/20 ring-1 ring-pink-500/25 scale-[1.02]'
                          : 'text-gray-300 hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-purple-500/20 hover:text-white hover:shadow-xl hover:shadow-pink-500/25 hover:scale-[1.05] hover:ring-2 hover:ring-pink-500/30'
                    } ${isMobile ? 'min-h-[56px] active:scale-[0.98]' : ''}`}
                    onClick={() => handleNavItemClick(item, index)}
                    onTouchStart={(e) => {
                      if ('vibrate' in navigator) {
                        navigator.vibrate(10);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.title} - featured special navigation item`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNavItemClick(item, index);
                      }
                    }}
                  >
                    <div className={`px-0.5 py-0 rounded-lg transition-all duration-300 flex-shrink-0 ${
                      expandedCard === index
                        ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/40 ring-2 ring-pink-400/30'
                        : isMobile
                          ? 'bg-gradient-to-br from-pink-500/70 to-pink-600/70 text-white shadow-md shadow-pink-500/30'
                          : 'bg-slate-800/70 text-slate-300 group-hover:bg-gradient-to-br group-hover:from-pink-500 group-hover:to-purple-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-pink-500/40'
                    }`}>
                      <img 
                        src="/Sebenza ai raw logo.png" 
                        alt="Sebenza AI Logo" 
                        className={`object-contain transform hover:scale-110 transition-transform duration-200 ${
                          isMobile ? 'w-20 h-20' : 'w-16 h-16'
                        }`}
                      />
                    </div>
                    {!sidebarCollapsed && (
                      <span className={`ml-3 font-semibold tracking-wide transition-all duration-300 select-none ${
                        isMobile ? 'opacity-100 text-base' : 'opacity-0 group-hover:opacity-100 text-sm'
                      }`}>
                        {item.title}
                      </span>
                    )}
                  </div>
                </li>
              );
            }
            
            return (
              <NavigationItem
                key={`nav-${index}-${item.title}`}
                item={item}
                index={index}
                isExpanded={expandedCard === index}
                isCollapsed={debouncedCollapsed}
                onClick={() => handleNavItemClick(item, index)}
                onOptionClick={handleOptionClick}
                animationDelay={index * STAGGER_DELAY}
              />
            );
          })}
        </ul>
      </nav>
    </div>
  );
});

DesktopSidebar.displayName = 'DesktopSidebar';

export default DesktopSidebar;