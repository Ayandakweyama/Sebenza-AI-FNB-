import React from 'react';
import { MobileDashboard } from './MobileDashboard';
import { DesktopSidebar } from './DesktopSidebar';
import { DashboardContent } from './DashboardContentReal';
import { MobileGreeting } from './MobileGreeting';
import { useDashboard } from './context/DashboardContext';
import { Plus } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { 
    updatedNavigationItems, 
    hoveredCard, 
    setHoveredCard, 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    setChatbotOpen, 
    chatbotOpen 
  } = useDashboard();

  return (
    <div className="min-h-screen bg-slate-900 text-white md:pt-16">
      {/* Mobile View */}
      <div className="md:hidden relative">
        {/* Mobile Greeting at the top */}
        <MobileGreeting />

        <MobileDashboard 
          navigationItems={updatedNavigationItems}
          hoveredCard={hoveredCard}
          setHoveredCard={setHoveredCard}
          setChatbotOpen={setChatbotOpen}
          chatbotOpen={chatbotOpen}
        />
        
        {/* Mobile Dashboard Content */}
        <div className="px-4 pb-8">
          <DashboardContent />
        </div>

      </div>

      {/* Desktop View */}
      <div className="hidden md:flex h-screen">
        <DesktopSidebar 
          navigationItems={updatedNavigationItems}
          hoveredCard={hoveredCard}
          setHoveredCard={setHoveredCard}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          setChatbotOpen={setChatbotOpen}
        />
        
        <DashboardContent />
      </div>
    </div>
  );
};
