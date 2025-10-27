'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import type { ChatMessage, NavigationItem } from '../types';
import { navigationItems as defaultNavigationItems, aiResponses } from '../constants';

interface DashboardContextType {
  // User and Navigation
  user: any; // Using any for now, replace with proper User type
  navigationItems: NavigationItem[];
  
  // UI State
  hoveredCard: number | null;
  setHoveredCard: (card: number | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  chatbotOpen: boolean;
  setChatbotOpen: (open: boolean) => void;
  
  // Chat State
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  isTyping: boolean;
  
  // Handlers
  handleSendMessage: () => void;
  handleNavigation: (path: string) => void;
  
  // For backward compatibility
  updatedNavigationItems: NavigationItem[];
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Create a separate component for the actual provider content
const DashboardProviderContent: React.FC<{ 
  children: ReactNode;
  isLoaded: boolean;
  isSignedIn: boolean;
  user: any;
  router: ReturnType<typeof useRouter>;
}> = ({ children, isLoaded, isSignedIn, user, router }) => {
  // State hooks - must be called in the same order on every render
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { type: 'bot', message: 'Hello! I\'m Afrigter, your AI career mentor. How can I help you today?' }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>(defaultNavigationItems);

  // Memoized values
  const updatedNavigationItems = useMemo(() => {
    return navigationItems.map(item => ({
      ...item,
      hoverOptions: item.hoverOptions?.map(option => ({
        ...option,
        action: option.action || (() => setChatbotOpen(true))
      }))
    }));
  }, [navigationItems]);

  // Callbacks
  const handleSendMessage = useCallback(() => {
    if (!currentMessage.trim()) return;
    
    const userMessage = { type: 'user' as const, message: currentMessage };
    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    // Simulate AI response
    const timer = setTimeout(() => {
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      setChatMessages(prev => [...prev, { type: 'bot' as const, message: randomResponse }]);
      setIsTyping(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentMessage]);

  const handleNavigation = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  // Build context value
  const contextValue = useMemo(() => ({
    // User and Navigation
    user,
    navigationItems: updatedNavigationItems,
    updatedNavigationItems,
    
    // UI State
    hoveredCard,
    setHoveredCard,
    sidebarCollapsed,
    setSidebarCollapsed,
    chatbotOpen,
    setChatbotOpen,
    
    // Chat State
    chatMessages,
    setChatMessages,
    currentMessage,
    setCurrentMessage,
    isTyping,
    
    // Handlers
    handleSendMessage,
    handleNavigation
  }), [
    user,
    updatedNavigationItems,
    hoveredCard,
    sidebarCollapsed,
    chatbotOpen,
    chatMessages,
    currentMessage,
    isTyping,
    handleSendMessage,
    handleNavigation
  ]);

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

interface DashboardProviderProps {
  children: ReactNode;
  user: any; // Replace 'any' with proper user type if available
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children, user }) => {
  const router = useRouter();
  
  // We can assume the user is signed in at this point since we check in the page component
  const isSignedIn = true;
  const isLoaded = true;

  return (
    <DashboardProviderContent 
      isLoaded={isLoaded}
      isSignedIn={isSignedIn}
      user={user}
      router={router}
    >
      {children}
    </DashboardProviderContent>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
