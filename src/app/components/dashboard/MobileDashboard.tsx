import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from './context/DashboardContext';
import type { NavigationItem } from './types';
import { Bot, Briefcase, User, ClipboardList, ChevronRight, Zap, TrendingUp } from 'lucide-react';

interface MobileDashboardProps {
  navigationItems?: NavigationItem[];
  hoveredCard?: number | null;
  setHoveredCard?: (card: number | null) => void;
  setChatbotOpen?: (open: boolean) => void;
  chatbotOpen?: boolean;
}

const getIconComponent = (iconName: string) => {
  const iconProps = {
    className: "w-8 h-8 text-white",
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
      return <ChevronRight {...iconProps} />;
  }
};

export const MobileDashboard: React.FC<MobileDashboardProps> = (props) => {
  const router = useRouter();
  const context = useDashboard();
  const [pressedItem, setPressedItem] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    navigationItems = [],
    hoveredCard,
    setHoveredCard = () => {},
    setChatbotOpen = () => {},
    chatbotOpen = false,
    user,
    setSidebarCollapsed = () => {}
  } = { ...context, ...props };
  
  // Track scroll for parallax effects - optimized with requestAnimationFrame
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Track mouse position for interactive effects - optimized
  useEffect(() => {
    let ticking = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setMousePosition({ x: e.clientX, y: e.clientY });
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Loading and visibility animations
  useEffect(() => {
    setIsLoading(true);
    const loadingTimer = setTimeout(() => setIsLoading(false), 600);
    const visibilityTimer = setTimeout(() => setIsVisible(true), 50);
    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(visibilityTimer);
    };
  }, []);
  
  const handleNavigation = (path: string) => {
    // Add smooth transition before navigation
    setIsVisible(false);
    setTimeout(() => router.push(path), 200);
  };

  const handleTouchStart = useCallback((index: number) => {
    setPressedItem(index);
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    setPressedItem(null);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`
        h-screen overflow-hidden
        bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 
        relative
        transition-opacity duration-700
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Enhanced Loading overlay with modern spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl">
          <div className="relative">
            {/* Outer ring */}
            <div className="w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            {/* Middle ring */}
            <div className="absolute inset-1 w-[4.5rem] h-[4.5rem] border-4 border-pink-500/20 border-r-pink-500 rounded-full animate-spin-slower"></div>
            {/* Inner ring */}
            <div className="absolute inset-2 w-16 h-16 border-4 border-indigo-500/20 border-b-indigo-500 rounded-full animate-spin-reverse"></div>
            {/* Center glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 rounded-full blur-md animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced Animated Background with Parallax - Fixed positioning */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Mouse-responsive background layer */}
        <div 
          className="absolute inset-0 transition-transform duration-300 ease-out will-change-transform"
          style={{
            transform: `translate(${mousePosition.x * 0.015}px, ${mousePosition.y * 0.015}px)`
          }}
        >
          {/* Primary floating orbs with enhanced parallax and wave motion */}
          <div 
            className="absolute top-0 -left-4 w-96 h-96 bg-purple-500/25 rounded-full mix-blend-multiply filter blur-3xl animate-blob"
            style={{ 
              transform: `translateY(${scrollY * 0.3}px) translateX(${Math.sin(Date.now() * 0.0005) * 15}px)`,
              animationDuration: '15s'
            }}
          ></div>
          <div 
            className="absolute top-0 -right-4 w-96 h-96 bg-pink-500/25 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"
            style={{ 
              transform: `translateY(${scrollY * 0.2}px) translateX(${Math.cos(Date.now() * 0.0005) * 12}px)`,
              animationDuration: '18s'
            }}
          ></div>
          <div 
            className="absolute bottom-0 left-20 w-96 h-96 bg-indigo-500/25 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"
            style={{ 
              transform: `translateY(${scrollY * -0.25}px) translateX(${Math.sin(Date.now() * 0.0007) * 20}px)`,
              animationDuration: '20s'
            }}
          ></div>
        </div>
        
        {/* Secondary accent orbs with enhanced mouse interaction */}
        <div 
          className="absolute inset-0 transition-transform duration-500 ease-out will-change-transform"
          style={{
            transform: `translate(${mousePosition.x * 0.03}px, ${mousePosition.y * 0.03}px)`
          }}
        >
          <div className="absolute top-1/4 -right-8 w-40 h-40 bg-cyan-500/15 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-1000"></div>
          <div className="absolute bottom-1/4 -left-8 w-40 h-40 bg-rose-500/15 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-3000"></div>
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-emerald-500/12 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-5000"></div>
          <div className="absolute top-3/4 left-1/3 w-36 h-36 bg-amber-500/10 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-6000"></div>
        </div>
        
        {/* Enhanced grid pattern with parallax */}
        <div 
          className="absolute inset-0 opacity-40 transition-transform duration-100 will-change-transform"
          style={{
            transform: `translateY(${scrollY * 0.05}px)`,
            backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')`
          }}
        ></div>
        
        {/* Enhanced radial gradient overlays with animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 animate-pulse-slower"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/15 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-900/15 via-transparent to-transparent"></div>
        
        {/* Enhanced floating particles with varied sizes and animations */}
        {[...Array(15)].map((_, i) => {
          const size = Math.random() * 3 + 1;
          return (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-float"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${5 + Math.random() * 8}s`,
                opacity: Math.random() * 0.4 + 0.2,
                filter: `blur(${Math.random() * 2}px)`,
              }}
            ></div>
          );
        })}
        
        {/* Enhanced aurora-like flowing gradients */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-transparent animate-flow-diagonal"></div>
          <div className="absolute top-1/3 right-0 w-full h-1/3 bg-gradient-to-bl from-indigo-600/20 via-cyan-600/10 to-transparent animate-flow-diagonal-reverse animation-delay-2000"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-tr from-pink-600/20 via-purple-600/10 to-transparent animate-flow-horizontal animation-delay-4000"></div>
        </div>
        
        {/* Radial spotlight effect following mouse */}
        <div 
          className="absolute w-96 h-96 bg-gradient-radial from-white/5 to-transparent rounded-full blur-3xl transition-all duration-700 ease-out pointer-events-none"
          style={{
            left: `${mousePosition.x - 192}px`,
            top: `${mousePosition.y - 192}px`,
            opacity: mousePosition.x > 0 ? 0.6 : 0,
          }}
        ></div>
      </div>

      {/* Content container with fixed height and internal scrolling for cards only */}
      <div className="h-full flex flex-col">
        {/* Premium Header - Fixed at top */}
        <div className="flex-shrink-0 px-5 py-5 backdrop-blur-3xl bg-gradient-to-r from-slate-900/95 via-slate-800/90 to-slate-900/95 border-b border-white/20 shadow-2xl shadow-black/40 z-30">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                {/* Enhanced gradient bar with animation */}
                <div className="relative">
                  <div className="w-1.5 h-12 bg-gradient-to-b from-purple-400 via-pink-400 to-indigo-400 rounded-full shadow-lg shadow-purple-500/50 animate-pulse"></div>
                  <div className="absolute inset-0 w-1.5 h-12 bg-gradient-to-b from-purple-400 via-pink-400 to-indigo-400 rounded-full blur-sm opacity-50 animate-pulse"></div>
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-pink-100 tracking-tight leading-tight animate-in fade-in slide-in-from-left duration-700">
                    Dashboard
                  </h2>
                  <div className="h-0.5 w-full bg-gradient-to-r from-purple-500/60 via-pink-500/60 to-indigo-500/60 rounded-full animate-in slide-in-from-left duration-500 delay-150"></div>
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-300 pl-6 tracking-wide animate-in fade-in slide-in-from-left duration-500 delay-300">
                Choose your workspace
              </p>
            </div>
            <div className="relative animate-in fade-in slide-in-from-right duration-500 delay-200">
              {/* Enhanced badge with glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/40 to-pink-500/40 rounded-full blur-lg animate-pulse"></div>
              <div className="relative flex items-center gap-2.5 bg-slate-800/80 backdrop-blur-2xl px-4 py-2 rounded-full border border-white/20 shadow-xl">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping"></div>
                </div>
                <span className="text-xs font-bold text-white">{navigationItems.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Cards Container - Takes remaining space */}
        <div className="flex-1 overflow-y-auto md:overflow-hidden overflow-x-hidden scroll-smooth">
          {/* Enhanced Ultra-Modern Navigation Cards */}
          <div className="relative z-10 px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-5 pb-6">
              {navigationItems.map((item: NavigationItem, index: number) => {
                const isHovered = hoveredCard === index;
                const isPressed = pressedItem === index;
                const hasHoverOptions = item.hoverOptions && item.hoverOptions.length > 0;
                const isAfrigterItem = item.title === 'Afrigter';
                
                return (
                  <div 
                    key={index} 
                    className="relative group perspective-1000 animate-in fade-in zoom-in duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Ultra-Modern sparkle system for Afrigter */}
                    {isAfrigterItem && (
                      <>
                        {/* Enhanced orbiting particles with varied speeds */}
                        <div className="absolute inset-0 animate-spin-slow">
                          <div className="absolute top-0 left-1/2 w-2.5 h-2.5 -ml-1 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full blur-sm animate-pulse shadow-lg shadow-pink-400/60"></div>
                        </div>
                        <div className="absolute inset-0 animate-spin-slower">
                          <div className="absolute bottom-0 left-1/2 w-2.5 h-2.5 -ml-1 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full blur-sm animate-pulse animation-delay-1000 shadow-lg shadow-purple-400/60"></div>
                        </div>
                        <div className="absolute inset-0 animate-spin-reverse">
                          <div className="absolute top-1/2 right-0 w-2 h-2 -mr-1 bg-gradient-to-br from-indigo-400 to-cyan-500 rounded-full blur-sm animate-pulse animation-delay-2000 shadow-lg shadow-indigo-400/60"></div>
                        </div>
                        
                        {/* Enhanced corner glow effects with varied sizes */}
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-lg opacity-70 animate-pulse"></div>
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full blur-lg opacity-60 animate-pulse animation-delay-500"></div>
                        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-full blur-lg opacity-60 animate-pulse animation-delay-1000"></div>
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full blur-lg opacity-70 animate-pulse animation-delay-1500"></div>
                        
                        {/* Multiple rotating ring effects */}
                        <div className="absolute inset-0 rounded-3xl border border-pink-500/20 animate-spin-very-slow"></div>
                        <div className="absolute inset-1 rounded-3xl border border-purple-500/15 animate-spin-slower"></div>
                      </>
                    )}

                    {/* Main Card with Advanced Glassmorphism */}
                    <div 
                      className={`
                        relative overflow-hidden rounded-3xl cursor-pointer
                        transition-all duration-500 ease-out transform will-change-transform
                        h-[210px] w-full
                        ${
                          isPressed 
                            ? 'scale-[0.94]' 
                            : isHovered 
                              ? 'scale-[1.06] -translate-y-3 shadow-3xl' 
                              : 'scale-100 hover:scale-[1.02]'
                        }
                        ${
                          isAfrigterItem 
                            ? 'bg-gradient-to-br from-pink-500/35 via-purple-500/30 to-indigo-500/35 backdrop-blur-2xl border-2 border-white/25' 
                            : 'bg-gradient-to-br from-slate-800/70 via-slate-700/60 to-slate-800/80 backdrop-blur-2xl border border-white/15'
                        }
                        shadow-2xl
                        ${isAfrigterItem ? 'shadow-pink-500/40' : 'shadow-black/50'}
                        before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/8 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500
                        after:absolute after:inset-0 after:rounded-3xl after:shadow-inner after:shadow-white/10
                      `}
                      style={{
                        transform: isHovered ? 'rotateX(3deg) rotateY(-3deg)' : 'rotateX(0deg) rotateY(0deg)',
                        transformStyle: 'preserve-3d',
                      }}
                      onClick={() => hasHoverOptions 
                        ? setHoveredCard(isHovered ? null : index)
                        : handleNavigation(item.path)}
                      onTouchStart={() => handleTouchStart(index)}
                      onTouchEnd={handleTouchEnd}
                      onMouseDown={() => handleTouchStart(index)}
                      onMouseUp={handleTouchEnd}
                      onMouseLeave={handleTouchEnd}
                    >
                      {/* Animated gradient mesh background */}
                      <div className={`
                        absolute inset-0 opacity-0 transition-opacity duration-700
                        ${
                          isAfrigterItem 
                            ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-500/30 via-purple-500/20 to-transparent' 
                            : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-600/25 via-slate-700/20 to-transparent'
                        }
                        ${isHovered ? 'opacity-100' : ''}
                      `}></div>
                      
                      {/* Afrigter exclusive effects */}
                      {isAfrigterItem && (
                        <>
                          {/* Animated gradient orb with enhanced pulse */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-indigo-500/30 rounded-full blur-3xl animate-pulse"></div>
                          
                          {/* Multiple scan line effects */}
                          <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent animate-scan-line"></div>
                            <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-pink-400/20 to-transparent animate-scan-line-slow top-1/3"></div>
                          </div>
                          
                          {/* Enhanced holographic shimmer */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 animate-shimmer"></div>
                          
                          {/* Pulsing border effect */}
                          <div className="absolute inset-0 rounded-3xl border-2 border-pink-400/0 group-hover:border-pink-400/30 transition-colors duration-500 animate-pulse-slow"></div>
                        </>
                      )}
                      
                      {/* Content Container */}
                      <div className="relative z-10 flex flex-col h-full p-6">
                        {/* Header section */}
                        <div className="relative flex items-start justify-between mb-6">
                          {/* Ultra-Modern Icon Container */}
                          <div className={`
                            relative flex-shrink-0
                            w-16 h-16 rounded-2xl
                            flex items-center justify-center
                            transition-all duration-500
                            ${
                              isAfrigterItem 
                                ? 'bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600' 
                                : 'bg-gradient-to-br from-slate-700/90 via-slate-600/90 to-slate-700/90'
                            }
                            backdrop-blur-xl
                            shadow-2xl
                            ${isAfrigterItem ? 'shadow-pink-500/60' : 'shadow-black/60'}
                            ring-2 ring-white/25
                            ${
                              isPressed 
                                ? 'scale-85' 
                                : isHovered 
                                  ? 'scale-115 rotate-12' 
                                  : 'group-hover:scale-105 group-hover:rotate-3'
                            }
                            transform
                            before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-tr before:from-white/15 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500
                            after:absolute after:inset-0 after:rounded-2xl after:shadow-inner after:shadow-white/20
                          `}>
                            {/* Enhanced icon glow effect */}
                            <div className={`absolute inset-0 rounded-2xl ${isAfrigterItem ? 'bg-gradient-to-br from-pink-500/50 to-purple-500/50' : 'bg-slate-600/50'} blur-xl transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>
                            
                            {item.title === 'Afrigter' ? (
                              <div className="relative">
                                {/* Enhanced rotating rings around logo */}
                                <div className="absolute -inset-3 border-2 border-white/30 rounded-full animate-spin-slow"></div>
                                <div className="absolute -inset-2 border border-pink-400/40 rounded-full animate-spin-slower"></div>
                                <img 
                                  src="/Sebenza ai raw logo.png" 
                                  alt="Sebenza AI Logo" 
                                  className={`
                                    relative w-full h-full object-contain p-2
                                    transition-transform duration-500
                                    ${isPressed ? 'scale-90' : isHovered ? 'scale-110 rotate-12' : ''}
                                    filter drop-shadow-2xl
                                  `}
                                />
                                {/* Logo glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
                              </div>
                            ) : (
                              <div className={`
                                relative
                                transition-transform duration-500
                                ${isPressed ? 'scale-90' : isHovered ? 'scale-110 rotate-6' : ''}
                                filter drop-shadow-xl
                              `}>
                                {getIconComponent(item.icon)}
                              </div>
                            )}
                          </div>
                          
                          {/* Enhanced Expand indicator */}
                          {hasHoverOptions && (
                            <div className={`
                              relative flex-shrink-0
                              w-10 h-10 rounded-xl
                              flex items-center justify-center
                              transition-all duration-500
                              backdrop-blur-xl
                              overflow-hidden
                              ${
                                isHovered 
                                  ? 'bg-gradient-to-br from-purple-500/50 to-pink-500/50 border-2 border-white/40 rotate-90 scale-110' 
                                  : 'bg-slate-800/90 border border-white/15 scale-100 hover:scale-105'
                              }
                              shadow-lg
                              before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/25 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                              after:absolute after:inset-0 after:rounded-xl after:shadow-inner after:shadow-white/10
                            `}>
                              <ChevronRight className={`w-5 h-5 opacity-70 transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`} strokeWidth={3} />
                              
                              {/* Enhanced pulse effect on hover */}
                              {isHovered && (
                                <>
                                  <div className="absolute inset-0 bg-white/30 rounded-xl animate-ping"></div>
                                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-xl blur-md animate-pulse"></div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Text Content - Modern Typography */}
                        <div className="flex-1 flex flex-col justify-end space-y-3">
                          {/* Title with gradient and animation */}
                          <h3 className={`
                            font-black text-lg leading-tight tracking-tight
                            transition-all duration-500
                            ${
                              isAfrigterItem 
                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-purple-100' 
                                : 'text-white'
                            }
                            ${
                              isPressed 
                                ? 'scale-[0.97]' 
                                : isHovered 
                                  ? 'scale-[1.03] translate-x-1' 
                                  : ''
                            }
                            drop-shadow-2xl
                          `}>
                            {item.title}
                          </h3>
                          
                          {/* Description with modern styling */}
                          {item.description && (
                            <p className={`
                              text-xs font-medium leading-relaxed line-clamp-2
                              transition-all duration-500
                              ${
                                isAfrigterItem 
                                  ? 'text-pink-100/90' 
                                  : 'text-slate-300/90'
                              }
                              ${isHovered ? 'text-slate-100 translate-x-1' : ''}
                              drop-shadow-lg
                            `}>
                              {item.description.length > 60 
                                ? `${item.description.substring(0, 60)}...` 
                                : item.description
                              }
                            </p>
                          )}
                          
                          {/* Enhanced status indicator */}
                          <div className={`
                            inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider
                            ${isAfrigterItem ? 'text-pink-200/70' : 'text-slate-400/70'}
                            transition-all duration-500
                            ${isHovered ? 'opacity-100 translate-x-1' : 'opacity-0'}
                          `}>
                            <div className="relative">
                              <div className={`w-1.5 h-1.5 rounded-full ${isAfrigterItem ? 'bg-pink-400' : 'bg-slate-400'} animate-pulse`}></div>
                              <div className={`absolute inset-0 w-1.5 h-1.5 rounded-full ${isAfrigterItem ? 'bg-pink-400' : 'bg-slate-400'} animate-ping`}></div>
                            </div>
                            <span>Ready</span>
                            <Zap className="w-3 h-3 animate-pulse" />
                          </div>
                        </div>
                      </div>

                      {/* Enhanced shine sweep effect */}
                      <div className={`
                        absolute inset-0 
                        bg-gradient-to-r from-transparent via-white/15 to-transparent
                        transform -translate-x-full
                        transition-transform duration-1000 ease-out
                        ${isHovered ? 'translate-x-full' : ''}
                        pointer-events-none
                      `}></div>
                      
                      {/* Bottom glow line with pulse */}
                      <div className={`
                        absolute bottom-0 left-0 right-0 h-0.5
                        bg-gradient-to-r from-transparent ${isAfrigterItem ? 'via-pink-500/60' : 'via-white/30'} to-transparent
                        transition-opacity duration-500
                        ${isHovered ? 'opacity-100 animate-pulse' : 'opacity-0'}
                      `}></div>
                      
                      {/* Corner accent lights */}
                      {isHovered && (
                        <>
                          <div className={`absolute top-0 left-0 w-2 h-2 ${isAfrigterItem ? 'bg-pink-400' : 'bg-slate-400'} rounded-full blur-sm animate-pulse`}></div>
                          <div className={`absolute top-0 right-0 w-2 h-2 ${isAfrigterItem ? 'bg-purple-400' : 'bg-slate-400'} rounded-full blur-sm animate-pulse animation-delay-500`}></div>
                          <div className={`absolute bottom-0 left-0 w-2 h-2 ${isAfrigterItem ? 'bg-indigo-400' : 'bg-slate-400'} rounded-full blur-sm animate-pulse animation-delay-1000`}></div>
                          <div className={`absolute bottom-0 right-0 w-2 h-2 ${isAfrigterItem ? 'bg-pink-400' : 'bg-slate-400'} rounded-full blur-sm animate-pulse animation-delay-1500`}></div>
                        </>
                      )}
                    </div>
                    
                    {/* Enhanced Dropdown Options */}
                    {isHovered && hasHoverOptions && (
                      <div className="mt-5 animate-in slide-in-from-top-4 fade-in duration-500 ease-out">
                        <div className={`
                          relative
                          border-l-4 pl-5 space-y-3
                          backdrop-blur-2xl rounded-2xl p-5
                          ${
                            isAfrigterItem 
                              ? 'border-pink-500/70 bg-gradient-to-br from-pink-500/25 via-purple-500/20 to-indigo-500/25' 
                              : 'border-slate-500/70 bg-gradient-to-br from-slate-800/80 to-slate-700/70'
                          }
                          shadow-2xl
                          ${isAfrigterItem ? 'shadow-pink-500/30' : 'shadow-black/50'}
                          ring-1 ring-white/15
                          before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/8 before:to-transparent before:pointer-events-none
                          after:absolute after:inset-0 after:rounded-2xl after:shadow-inner after:shadow-white/10 after:pointer-events-none
                        `}>
                          {/* Enhanced header for dropdown */}
                          <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-white/15">
                            <div className={`w-1 h-5 rounded-full ${isAfrigterItem ? 'bg-gradient-to-b from-pink-500 to-purple-500' : 'bg-gradient-to-b from-slate-500 to-slate-600'} shadow-lg`}></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-white/70">Quick Actions</span>
                            <div className="flex-1"></div>
                          </div>
                          
                          {item.hoverOptions?.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`
                                group/option relative
                                flex items-center justify-between
                                p-4 rounded-xl
                                transition-all duration-300
                                transform hover:scale-[1.02] active:scale-[0.98]
                                cursor-pointer
                                backdrop-blur-xl
                                overflow-hidden
                                ${
                                  isAfrigterItem 
                                    ? 'hover:bg-gradient-to-r hover:from-pink-500/35 hover:to-purple-500/35 active:from-pink-500/45 active:to-purple-500/45 text-pink-50 border-2 border-pink-500/25 hover:border-pink-400/50' 
                                    : 'hover:bg-gradient-to-r hover:from-slate-700/80 hover:to-slate-600/80 active:from-slate-600/90 active:to-slate-700/90 text-slate-200 border border-white/15 hover:border-white/25'
                                }
                                shadow-lg hover:shadow-xl
                                ${isAfrigterItem ? 'hover:shadow-pink-500/40' : 'hover:shadow-black/50'}
                                before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700
                                after:absolute after:inset-0 after:rounded-xl after:shadow-inner after:shadow-white/10
                              `}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (option.action) {
                                  option.action();
                                } else {
                                  handleNavigation(option.path);
                                }
                                setHoveredCard(null);
                              }}
                              onTouchStart={() => handleTouchStart(-1)}
                              onTouchEnd={handleTouchEnd}
                            >
                              <div className="flex items-center gap-3.5 flex-1">
                                {/* Enhanced option icon indicator */}
                                <div className={`
                                  relative w-9 h-9 rounded-lg flex items-center justify-center
                                  ${isAfrigterItem ? 'bg-pink-500/25' : 'bg-slate-600/40'}
                                  transition-all duration-300 group-hover/option:scale-110
                                  ring-1 ring-white/10
                                  overflow-hidden
                                `}>
                                  <TrendingUp className="w-5 h-5 relative z-10" strokeWidth={2.5} />
                                  <div className={`absolute inset-0 ${isAfrigterItem ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20' : 'bg-slate-600/20'} blur-sm opacity-0 group-hover/option:opacity-100 transition-opacity duration-300`}></div>
                                </div>
                                
                                <span className="text-sm font-bold tracking-wide flex-1">
                                  {option.label}
                                </span>
                              </div>
                              
                              <div className="relative">
                                {/* Enhanced animated arrow */}
                                <ChevronRight 
                                  className="w-5 h-5 opacity-70 transition-all duration-300 group-hover/option:opacity-100 group-hover/option:translate-x-1 group-hover/option:scale-110" 
                                  strokeWidth={2.5}
                                />
                                
                                {/* Enhanced pulse on hover */}
                                <div className="absolute inset-0 bg-white/25 rounded-full scale-0 group-hover/option:scale-150 opacity-0 group-hover/option:opacity-100 transition-all duration-500"></div>
                                <div className={`absolute -inset-1 ${isAfrigterItem ? 'bg-pink-400/20' : 'bg-slate-400/20'} rounded-full blur-md scale-0 group-hover/option:scale-100 opacity-0 group-hover/option:opacity-100 transition-all duration-500`}></div>
                              </div>
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
      </div>
      
      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          33% {
            transform: translateY(-15px) translateX(8px);
            opacity: 0.6;
          }
          66% {
            transform: translateY(-8px) translateX(-5px);
            opacity: 0.5;
          }
        }
        
        @keyframes scan-line {
          0% {
            top: -2px;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
        
        @keyframes scan-line-slow {
          0% {
            top: -2px;
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes pulse-slower {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        @keyframes spin-very-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        
        @keyframes flow-diagonal {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.2;
          }
          50% {
            transform: translate(20px, -20px);
            opacity: 0.4;
          }
        }
        
        @keyframes flow-diagonal-reverse {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.2;
          }
          50% {
            transform: translate(-20px, 20px);
            opacity: 0.4;
          }
        }
        
        @keyframes flow-horizontal {
          0%, 100% {
            transform: translateX(0);
            opacity: 0.2;
          }
          50% {
            transform: translateX(30px);
            opacity: 0.3;
          }
        }
        
        .animate-float {
          animation: float linear infinite;
        }
        
        .animate-scan-line {
          animation: scan-line 4s linear infinite;
        }
        
        .animate-scan-line-slow {
          animation: scan-line-slow 6s linear infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-pulse-slower {
          animation: pulse-slower 4s ease-in-out infinite;
        }
        
        .animate-spin-very-slow {
          animation: spin-very-slow 20s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }
        
        .animate-flow-diagonal {
          animation: flow-diagonal 8s ease-in-out infinite;
        }
        
        .animate-flow-diagonal-reverse {
          animation: flow-diagonal-reverse 10s ease-in-out infinite;
        }
        
        .animate-flow-horizontal {
          animation: flow-horizontal 12s ease-in-out infinite;
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .shadow-3xl {
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.6);
        }
        
        /* Custom scrollbar styling */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #ec4899);
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #9333ea, #db2777);
        }
      `}</style>
    </div>
  );
};