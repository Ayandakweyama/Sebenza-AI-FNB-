import React from 'react';
import { MobileDashboard } from './MobileDashboard';
import { DesktopSidebar } from './DesktopSidebar';
import { DashboardContent } from './DashboardContent';
import { useDashboard } from './context/DashboardContext';

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
    <div className="min-h-screen bg-slate-900 text-white pt-16">
      {/* Mobile View */}
      <MobileDashboard 
        navigationItems={updatedNavigationItems}
        hoveredCard={hoveredCard}
        setHoveredCard={setHoveredCard}
        setChatbotOpen={setChatbotOpen}
        chatbotOpen={chatbotOpen}
      />

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
