'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Briefcase, 
  FileText, 
  BarChart2, 
  LogIn, 
  UserPlus,
  ChevronDown,
  Sparkles,
  Zap
} from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHover, setActiveHover] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const pathname = usePathname();
  const navRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    const handleMouseMove = (e) => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [scrolled]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const navLinks = [
    { 
      name: 'Home', 
      href: '/', 
      icon: <Briefcase className="w-5 h-5" />,
      description: 'Find your dream job'
    },
    { 
      name: 'Jobs', 
      href: '/jobs', 
      icon: <FileText className="w-5 h-5" />,
      description: 'Browse opportunities'
    },
    { 
      name: 'CV Builder', 
      href: '/cvbuilder', 
      icon: <FileText className="w-5 h-5" />,
      description: 'Create professional CVs'
    },
    { 
      name: 'ATS Checker', 
      href: '/ats-checker', 
      icon: <BarChart2 className="w-5 h-5" />,
      description: 'Optimize your resume'
    },
  ];

  return (
    <header 
      ref={navRef}
      className={`fixed w-full z-50 transition-all duration-500 ease-out ${
        scrolled 
          ? 'bg-slate-900/90 backdrop-blur-xl py-3 shadow-2xl border-b border-slate-800/50' 
          : 'bg-slate-900/90 backdrop-blur-xl py-5 border-b border-slate-800/50'
      } min-h-[80px]`}
      style={{
        background: scrolled 
          ? `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.1), transparent 40%)`
          : 'transparent'
      }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-transparent to-yellow-500/5 animate-pulse" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between h-20">
          {/* Enhanced Logo */}
          <div className="flex-shrink-0 group">
            <Link href="/" className="flex items-center relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-yellow-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
              <div className="relative flex items-center">
                <Sparkles className="w-6 h-6 text-purple-400 mr-2 animate-pulse" />
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                  Sebenza AI
                </span>
                <Zap className="w-5 h-5 text-yellow-400 ml-2 animate-bounce" />
              </div>
            </Link>
          </div>

          {/* Enhanced Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navLinks.map((link, index) => {
              const isActive = pathname === link.href;
              return (
                <div 
                  key={link.name}
                  className="relative group"
                  onMouseEnter={() => setActiveHover(index)}
                  onMouseLeave={() => setActiveHover(null)}
                >
                  <Link
                    href={link.href}
                    className={`relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      isActive 
                        ? 'bg-gradient-to-r from-purple-600/80 to-yellow-500/80 text-white shadow-lg shadow-purple-500/25' 
                        : 'text-gray-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    {/* Animated background for active state */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-yellow-500 rounded-xl animate-pulse opacity-75" />
                    )}
                    
                    <span className="relative mr-2 transition-transform duration-300 group-hover:rotate-12">
                      {link.icon}
                    </span>
                    <span className="relative">{link.name}</span>
                    
                    {/* Hover tooltip */}
                    {activeHover === index && !isActive && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg border border-slate-700 whitespace-nowrap opacity-0 animate-fade-in">
                        {link.description}
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                      </div>
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Enhanced Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/login"
              className="group relative px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-all duration-300 rounded-lg hover:bg-slate-800/50"
            >
              <LogIn className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Sign In
              </span>
            </Link>
            <Link
              href="/register"
              className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-yellow-500 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
            >
              <span className="relative z-10 flex items-center">
                <UserPlus className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                Get Started
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-yellow-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>

          {/* Enhanced Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-3 rounded-xl text-gray-400 hover:text-white hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-110"
              aria-expanded={isOpen}
              aria-label="Toggle navigation menu"
            >
              <span className="sr-only">
                {isOpen ? 'Close main menu' : 'Open main menu'}
              </span>
              <div className="relative w-6 h-6">
                <Menu className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${isOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
                <X className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${isOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile menu */}
      <div
        className={`md:hidden transition-all duration-500 ease-out ${
          isOpen ? 'max-h-screen opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4 overflow-hidden'
        }`}
      >
        <div className="px-4 pt-4 pb-6 space-y-2 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/50">
          {/* Mobile navigation links */}
          {navLinks.map((link, index) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`group flex items-center px-4 py-4 text-base font-medium rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/80 to-yellow-500/80 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-slate-800/60 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="mr-3 transition-transform duration-300 group-hover:rotate-12">
                  {link.icon}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{link.name}</div>
                  <div className="text-sm text-gray-400 group-hover:text-gray-300">
                    {link.description}
                  </div>
                </div>
              </Link>
            );
          })}
          
          {/* Mobile auth buttons */}
          <div className="pt-4 border-t border-slate-800/50 space-y-3">
            <Link
              href="/login"
              className="flex items-center px-4 py-4 text-base font-medium text-gray-300 hover:bg-slate-800/60 hover:text-white rounded-xl transition-all duration-300"
              onClick={() => setIsOpen(false)}
            >
              <LogIn className="w-5 h-5 mr-3" />
              <div>
                <div className="font-medium">Sign In</div>
                <div className="text-sm text-gray-400">Access your account</div>
              </div>
            </Link>
            <Link
              href="/register"
              className="flex items-center justify-center px-4 py-4 text-base font-medium text-white bg-gradient-to-r from-purple-600 to-yellow-500 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
              onClick={() => setIsOpen(false)}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              <span>Get Started Today</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </header>
  );
};

export default Navbar;