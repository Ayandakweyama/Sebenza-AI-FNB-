'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserButton, useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';

// Client-side only components
const ClientSideNavbar = dynamic(() => Promise.resolve(NavbarContent), { ssr: false });

const Navbar = () => {
  // This component is just a wrapper for the client-side NavbarContent
  return <ClientSideNavbar />;
};

const NavbarContent = () => {
  const { isSignedIn } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  // Navigation links
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'ATS Score Checker', href: '/ats-checker' },
    { name: 'CV Builder', href: '/cvbuilder' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Contact', href: '/contact' },
  ];

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    // Set initial state
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-slate-900/95 backdrop-blur-md shadow-lg border-b border-slate-800/50' 
          : 'bg-transparent backdrop-blur-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:pl-4 lg:pr-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button and logo container */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <div className="md:hidden mr-2">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                aria-expanded={isOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Logo - centered on mobile, far left on desktop */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <Link href="/dashboard" className="flex items-center">
                <div className="relative h-20 w-20 md:h-28 md:w-28 transition-all duration-300 hover:scale-105 transform">
                  <Image 
                    src="/images/logonobg.png" 
                    alt="Sebenza AI"
                    width={112}
                    height={112}
                    priority
                    className="h-full w-full object-contain"
                  />
                </div>
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium ${
                    pathname === link.href
                      ? 'text-white bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-4 py-2 rounded-lg backdrop-blur-sm'
                      : 'text-gray-300 hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg transition-all'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {!isSignedIn ? (
                <>
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="relative overflow-hidden group px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all transform hover:scale-105">
                      <span className="relative z-10">Get Started</span>
                      <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </button>
                  </SignUpButton>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/dashboard"
                    className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white"
                  >
                    Dashboard
                  </Link>
                  <div className="relative">
                    <UserButton 
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: 'w-8 h-8',
                        },
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Auth Buttons - Mobile (only visible when menu is closed) */}
          {!isOpen && (
            <div className="md:hidden">
              {!isSignedIn ? (
                <div className="flex items-center space-x-2">
                  <SignInButton mode="modal">
                    <button className="px-3 py-1 text-sm font-medium text-gray-300 hover:text-white">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">
                      Get Started
                    </button>
                  </SignUpButton>
                </div>
              ) : (
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'w-8 h-8',
                    },
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-md">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === link.href 
                    ? 'bg-slate-800 text-white' 
                    : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          {/* Auth Buttons - Mobile */}
          <div className="pt-4 pb-3 border-t border-gray-700">
            {!isSignedIn ? (
              <div className="px-2 space-y-3">
                <SignInButton mode="modal">
                  <button className="w-full px-4 py-2 text-center text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="w-full px-4 py-2 text-center text-base font-medium text-blue-600 bg-white rounded-md hover:bg-gray-100">
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            ) : (
              <div className="px-2 mt-3 space-y-1">
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-slate-800 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="px-3 py-2">
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        rootBox: 'w-full',
                        userButtonBox: 'w-full justify-start',
                        userButtonTrigger: 'w-full justify-start',
                        userButtonPopoverCard: 'w-full',
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

export { NavbarContent };