import type { User } from '@clerk/nextjs/server';

export interface NavigationItem {
  title: string;
  description: string;
  path: string;
  icon: string;
  hoverOptions?: HoverOption[];
}

export interface HoverOption {
  label: string;
  path: string;
  action?: () => void;
}

export interface ChatMessage {
  type: 'user' | 'bot';
  message: string;
}

export interface DashboardPageProps {
  user: User | null | undefined;
  isLoaded: boolean;
  isSignedIn: boolean;
}

export interface MobileDashboardProps {
  navigationItems: NavigationItem[];
  hoveredCard: number | null;
  setHoveredCard: (index: number | null) => void;
  router?: any; // Made optional as we're using useRouter from next/navigation
  setChatbotOpen: (open: boolean) => void;
  chatbotOpen: boolean;
}

export interface DesktopSidebarProps {
  user?: User | null | undefined;
  navigationItems?: NavigationItem[];
  hoveredCard?: number | null;
  setHoveredCard?: (index: number | null) => void;
  sidebarCollapsed?: boolean;
  setSidebarCollapsed?: (collapsed: boolean) => void;
  setChatbotOpen?: (open: boolean) => void;
  router?: any; // Made optional as we're using useRouter from next/navigation
}

export interface DashboardHeaderProps {
  user?: any; // Consider using proper User type from your auth provider
  onMenuClick?: () => void;
  onChatClick?: () => void;
  className?: string;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: string;
  color: 'purple' | 'green' | 'blue' | 'yellow';
}

export interface ActivityItem {
  company: string;
  position: string;
  status?: string;
  time: string;
  type?: string;
  color?: string;
}

export interface RecentActivityProps {
  title: string;
  icon: string;
  items: ActivityItem[];
  showStatus?: boolean;
  showType?: boolean;
}

export interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  isTyping: boolean;
}
