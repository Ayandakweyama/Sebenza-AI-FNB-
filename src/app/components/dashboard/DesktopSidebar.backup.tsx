import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { useDashboard } from './context/DashboardContext';
import type { DesktopSidebarProps, NavigationItem, HoverOption } from './types';

// Enhanced animations and transitions with GPU acceleration
const ANIMATION_DURATION = 300;
const HOVER_DELAY = 150;
const STAGGER_DELAY = 50;

// Performance optimizations
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
const useIntersectionObserver = <T extends HTMLElement>(ref: React.RefObject<T>, options: IntersectionObserverInit = {}) => {
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

// Utility hook to detect mobile devices
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Memoized navigation item component with enhanced performance
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
  const itemRef = useRef<HTMLLIElement>(null);
  const isVisible = useIntersectionObserver(itemRef, { threshold: 0.1 });
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
      // Focus first submenu item
      const firstSubItem = itemRef.current?.querySelector('[role="menuitem"]') as HTMLElement;
      firstSubItem?.focus();
    }
  }, [handleItemClick, isExpanded]);

  // Check if this is the Afrigter item
  const isAfrigterItem = item.title === 'Afrigter';

  // Memoized styles for better performance with Afrigter enhancements
  const itemStyles = useMemo(() => {
    if (isAfrigterItem) {
      return {
        expanded: 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white shadow-lg shadow-pink-500/20 scale-[1.02] translate-x-1 ring-1 ring-pink-500/30',
        default: `text-slate-300 ${
          isMobile 
            ? 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 ring-1 ring-pink-500/20 shadow-md shadow-pink-500/10' 
            : 'hover:bg-gradient-to-r hover:from-pink-500/15 hover:to-purple-500/15 hover:ring-1 hover:ring-pink-500/25 hover:shadow-lg hover:shadow-pink-500/20'
        } hover:text-white hover:scale-[1.02] transition-all duration-300`,
        pressed: 'scale-[0.96] brightness-125 saturate-150'
      };
    }
    
    return {
      expanded: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-white shadow-lg shadow-purple-500/10 scale-[1.02] translate-x-1',
      default: 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:scale-[1.01] hover:shadow-md',
      pressed: 'scale-[0.98] brightness-110'
    };
  }, [isAfrigterItem, isMobile]);

  const iconStyles = useMemo(() => {
    if (isAfrigterItem) {
      return {
        expanded: 'bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30 ring-2 ring-pink-400/20',
        default: `${
          isMobile 
            ? 'bg-gradient-to-br from-pink-500/80 to-purple-500/80 text-white shadow-md shadow-pink-500/25' 
            : 'bg-slate-800/50 text-slate-400 group-hover:bg-gradient-to-br group-hover:from-pink-500/90 group-hover:to-purple-500/90 group-hover:text-white group-hover:shadow-lg group-hover:shadow-pink-500/30'
        } transition-all duration-300`
      };
    }
    
    return {
      expanded: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25',
      default: 'bg-slate-800/50 text-slate-400 group-hover:bg-slate-700/50 group-hover:shadow-md group-hover:text-slate-200'
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onClick={handleItemClick}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${item.title}${item.hoverOptions?.length ? ' - expandable menu' : ''}${isAfrigterItem ? ' - featured item' : ''}`}
        onKeyDown={handleKeyDown}
      >
        <div className={`p-2 rounded-lg transition-all duration-300 will-change-transform ${
          isExpanded ? iconStyles.expanded : iconStyles.default
        }`}>
          <span className={`text-lg block ${isAfrigterItem ? 'transform hover:scale-110 transition-transform duration-200' : ''}`} role="img" aria-label={item.title}>
            {item.icon}
          </span>
        </div>
        
        {!isCollapsed && (
          <span className={`ml-3 font-medium transition-all duration-200 select-none ${
            isAfrigterItem ? 'font-semibold tracking-wide' : ''
          }`}>
            {item.title}
          </span>
        )}
        
        {!isCollapsed && item.hoverOptions && item.hoverOptions.length > 0 && (
          <svg 
            className={`ml-auto w-4 h-4 transition-all duration-200 will-change-transform ${
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
      
      {/* Enhanced submenu with better animations and pink theme for Afrigter */}
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

// Separate submenu item component for better performance with Afrigter theming
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
          ? 'hover:bg-pink-500/10 hover:ring-1 hover:ring-pink-500/20 hover:shadow-md hover:shadow-pink-500/10' 
          : 'hover:bg-slate-800/70'
      } rounded-lg cursor-pointer transition-all duration-200 hover:translate-x-1 group/option will-change-transform ${
        isPressed ? 'scale-[0.98]' : ''
      }`}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      role="menuitem"
      tabIndex={0}
      aria-label={option.label}
      onKeyDown={handleKeyDown}
    >
      <div className={`w-1.5 h-1.5 rounded-full mr-3 transition-all duration-200 group-hover/option:scale-125 ${
        isAfrigterSubmenu 
          ? 'bg-pink-400 group-hover/option:bg-pink-300 group-hover/option:shadow-sm group-hover/option:shadow-pink-300/50' 
          : 'bg-purple-400 group-hover/option:bg-purple-300'
      }`}></div>
      <span className="text-slate-300 group-hover/option:text-white transition-colors duration-200 select-none font-medium">
        {option.label}
      </span>
      <svg 
        className={`ml-auto w-3.5 h-3.5 transition-all duration-200 group-hover/option:translate-x-1 ${
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

// Enhanced User Profile Component with better performance
const UserProfile = memo(({ user, isCollapsed }: { user: any; isCollapsed: boolean }) => {
  const [profileStrength] = useState(75);
  const [isOnline] = useState(true);
  const [pulseKey, setPulseKey] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);

  // Refresh pulse animation periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseKey(prev => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const profileStyles = useMemo(() => ({
    container: `overflow-hidden transition-all duration-${ANIMATION_DURATION} will-change-transform ${
      isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100 py-6 px-4'
    }`,
    card: 'p-4 bg-slate-800/50 rounded-xl backdrop-blur-sm border border-slate-700/50 shadow-lg hover:shadow-xl hover:border-slate-600/50 transition-all duration-300',
    avatar: 'w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all duration-300 will-change-transform',
    statusIndicator: `absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 transition-all duration-300 ${
      isOnline ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-slate-400'
    }`
  }), [isCollapsed, isOnline]);

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
            <p className="font-semibold text-white truncate">
              {user?.firstName || 'User'}
            </p>
            <p className="text-xs text-slate-400 font-medium">Premium Member</p>
          </div>
        </div>
        
        {/* Enhanced profile strength indicator */}
        <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors duration-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-300">Profile Strength</span>
            <span className="text-xs font-semibold text-purple-400">{profileStrength}%</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
              style={{ width: `${profileStrength}%` }}
            >
              <div 
                key={pulseKey}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

UserProfile.displayName = 'UserProfile';

// Main Enhanced Desktop Sidebar Component
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
  // Use context values if props are not provided
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
  
  // Use props if provided, otherwise use context
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

  // Debounce collapse state changes for better performance
  const debouncedCollapsed = useDebounce(sidebarCollapsed, 100);

  // Enhanced keyboard navigation with focus management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedCard !== null) {
        setExpandedCardFn(null);
        // Return focus to the expanded item
        const expandedItem = sidebarRef.current?.querySelector(`[role="button"][aria-expanded="true"]`) as HTMLElement;
        expandedItem?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expandedCard, setExpandedCardFn]);

  // Enhanced click outside handler with better performance
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setExpandedCardFn(null);
      }
    };

    // Use passive event listener for better performance
    document.addEventListener('mousedown', handleClickOutside, { passive: true });
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setExpandedCardFn]);

  // Enhanced responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsedFn(true);
      }
    };

    // Use debounced resize handler
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize, { passive: true });
    handleResize(); // Check on mount

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [setSidebarCollapsedFn]);

  // Memoized handlers for better performance
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
      // If it's the Afrigter menu, expand it after uncollapsing
      if (item.title === 'Afrigter' && item.hoverOptions?.length) {
        setTimeout(() => setExpandedCardFn(index), 50);
      }
      return;
    }
    
    // For items with hover options, toggle the expanded state
    if (item.hoverOptions && item.hoverOptions.length > 0) {
      setExpandedCardFn(expandedCard === index ? null : index);
      
      // For Afrigter, also navigate to the main path
      if (item.title === 'Afrigter' && item.path) {
        router.push(item.path);
      }
    } 
    // For items without hover options, navigate to their path
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

  // Memoized sidebar styles
  const sidebarStyles = useMemo(() => ({
    main: `${
      sidebarCollapsed ? 'w-20 hover:w-72' : 'w-72'
    } bg-slate-900 transition-all duration-${ANIMATION_DURATION} ease-in-out flex flex-col border-r border-slate-800 shadow-2xl relative z-50 group will-change-transform`,
    nav: 'flex-1 overflow-y-hidden py-4 px-2',
    list: 'space-y-1.5 px-2'
  }), [sidebarCollapsed]);

  return (
    <div 
      ref={sidebarRef}
      className={sidebarStyles.main}
      onClick={handleSidebarClick}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Enhanced User Profile */}
      <UserProfile user={user} isCollapsed={debouncedCollapsed} />
      
      {/* Enhanced Navigation Items */}
      <nav className={sidebarStyles.nav}>
        <ul className={sidebarStyles.list} role="menu">
          {navigationItems.map((item, index) => {
            // Special handling for Afrigter item with enhanced pink styling
            if (item.title === 'Afrigter') {
              return (
                <li key="afrigter-icon" className="relative">
                  <div 
                    className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 transform will-change-transform ${
                      expandedCard === index 
                        ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white shadow-xl shadow-pink-500/25 scale-[1.05] ring-2 ring-pink-500/30' 
                        : isMobile
                          ? 'text-white bg-gradient-to-r from-pink-500/15 to-purple-500/15 shadow-lg shadow-pink-500/20 ring-1 ring-pink-500/25 scale-[1.02]'
                          : 'text-gray-300 hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-purple-500/20 hover:text-white hover:shadow-xl hover:shadow-pink-500/25 hover:scale-[1.05] hover:ring-2 hover:ring-pink-500/30'
                    }`}
                    onClick={() => handleNavItemClick(item, index)}
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
                    <div className={`p-2 rounded-lg transition-all duration-300 ${
                      expandedCard === index
                        ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/40 ring-2 ring-pink-400/30'
                        : isMobile
                          ? 'bg-gradient-to-br from-pink-500/90 to-purple-500/90 text-white shadow-md shadow-pink-500/30'
                          : 'bg-slate-800/70 text-slate-300 group-hover:bg-gradient-to-br group-hover:from-pink-500 group-hover:to-purple-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-pink-500/40'
                    }`}>
                      <span className="text-2xl block transform hover:scale-110 transition-transform duration-200" role="img" aria-label={item.title}>
                        {item.icon}
                      </span>
                    </div>
                    {!sidebarCollapsed && (
                      <span className={`ml-3 font-semibold tracking-wide transition-all duration-300 select-none ${
                        isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        {item.title}
                      </span>
                    )}
                  </div>
                </li>
              );
            }
            
            // Regular navigation items with staggered animation
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