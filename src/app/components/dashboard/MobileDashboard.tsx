import React from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from './context/DashboardContext';
import type { NavigationItem } from './types';

interface MobileDashboardProps {
  navigationItems?: NavigationItem[];
  hoveredCard?: number | null;
  setHoveredCard?: (card: number | null) => void;
  setChatbotOpen?: (open: boolean) => void;
  chatbotOpen?: boolean;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = (props) => {
  const router = useRouter();
  const context = useDashboard();
  
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

  return (
    <div className="md:hidden p-4">
      <div className="p-4">
        <ul className="space-y-2">
          {navigationItems.map((item: NavigationItem, index: number) => {
            const isHovered = hoveredCard === index;
            const hasHoverOptions = item.hoverOptions && item.hoverOptions.length > 0;
            
            return (
              <li key={index} className="relative">
                <div 
                  className="bg-slate-800 p-6 rounded-lg shadow-lg hover:bg-slate-700 transition-all duration-200 cursor-pointer transform hover:scale-105"
                  onClick={() => hasHoverOptions 
                    ? setHoveredCard(isHovered ? null : index)
                    : handleNavigation(item.path)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{item.icon}</span>
                      <h2 className="text-xl font-semibold">{item.title}</h2>
                    </div>
                    {hasHoverOptions && (
                      <svg 
                        className={`w-5 h-5 text-slate-400 transition-transform ${isHovered ? 'transform rotate-90' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                  
                  {item.description && (
                    <p className="text-slate-300 mt-2">{item.description}</p>
                  )}
                </div>
                
                {/* Mobile Dropdown Options */}
                {isHovered && hasHoverOptions && (
                  <div className="mt-2 pl-4">
                    <div className="border-l-2 border-slate-600 pl-4 space-y-2">
                      {item.hoverOptions?.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className="text-purple-300 text-sm py-2 px-3 -mx-3 rounded hover:bg-slate-600 transition-colors flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (option.action) {
                              option.action();
                            } else {
                              router.push(option.path);
                            }
                            setHoveredCard(null);
                          }}
                        >
                          {option.label}
                          <svg 
                            className="w-3.5 h-3.5 ml-1.5" 
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
              </li>
            );
          })}
        </ul>

        {/* Mobile Chatbot Button - Only shown when chatbot is closed */}
        {!chatbotOpen && (
          <div className="fixed bottom-4 right-4 z-40">
            <button
              onClick={() => setChatbotOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-xl transition-all duration-200 transform hover:scale-110"
              aria-label="Open chatbot"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.013 9.013 0 01-5.618-2.033L3 20l1.343-2.382A9.013 9.013 0 013 12c0-4.418 4.418-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
