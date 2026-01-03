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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white md:pt-16 relative overflow-hidden">
      {/* Background decoration for desktop */}
      <div className="hidden md:block absolute inset-0">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYwNSIvPjwvZGVmcz48L3N2Zz4=')] opacity-5"></div>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-slate-900/30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-transparent to-purple-900/10"></div>
        
        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-32 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500/5 rounded-full blur-3xl"></div>
      </div>
      
      {/* Content container */}
      <div className="relative z-10">
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
          <div className="px-4 pb-8 pt-0 -mt-16">
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
    </div>
  );
};
