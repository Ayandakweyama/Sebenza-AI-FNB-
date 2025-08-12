import React from 'react';
import { UserButton } from '@clerk/nextjs';
import { Menu, MessageSquare } from 'lucide-react';
import type { DashboardHeaderProps } from './types';

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  onMenuClick,
  onChatClick,
  className = ''
}) => {
  return (
    <header className={`flex items-center justify-between p-4 border-b border-slate-700 ${className}`}>
      <div className="flex items-center">
        <button 
          className="p-2 rounded-full hover:bg-slate-700 mr-2 md:hidden transition-colors"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-slate-300" />
        </button>
        <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Career Hub
        </h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <button 
          className="p-2 rounded-full hover:bg-slate-700 md:hidden transition-colors"
          onClick={onChatClick}
          aria-label="Open chat"
        >
          <MessageSquare className="h-5 w-5 text-slate-300" />
        </button>
        
        {user && (
          <div className="flex items-center">
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                  userButtonPopoverCard: 'bg-slate-800 border border-slate-700',
                  userButtonPopoverActionButtonText: 'text-slate-200',
                  userButtonPopoverActionButton: 'hover:bg-slate-700',
                  userButtonPopoverFooter: 'bg-slate-800',
                }
              }}
            />
          </div>
        )}
      </div>
    </header>
  );
};
