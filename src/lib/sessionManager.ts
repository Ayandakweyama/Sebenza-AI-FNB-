// Enhanced Session Management System
// Unified session manager for all session types in the application

import { ChatSession, ChatMessage } from '@/hooks/useChatHistory';

export interface SessionMetadata {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: {
    platform: string;
    browser: string;
    version: string;
    mobile: boolean;
  };
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  averageDuration: number;
  totalMessages: number;
  peakConcurrentUsers: number;
  sessionTypes: Record<string, number>;
}

export interface SessionConfig {
  // Timeouts
  chatSessionTimeout: number; // minutes
  userSessionTimeout: number; // minutes
  maxConcurrentSessions: number;

  // Cleanup
  cleanupInterval: number; // minutes
  archiveAfter: number; // days

  // Analytics
  enableAnalytics: boolean;
  trackUserBehavior: boolean;
}

export class SessionManager {
  private static instance: SessionManager;
  private config: SessionConfig;
  private analytics: Map<string, any> = new Map();
  private cleanupTimer?: NodeJS.Timeout;

  private constructor() {
    this.config = {
      chatSessionTimeout: 60, // 1 hour
      userSessionTimeout: 480, // 8 hours
      maxConcurrentSessions: 5,
      cleanupInterval: 30, // 30 minutes
      archiveAfter: 30, // 30 days
      enableAnalytics: true,
      trackUserBehavior: true,
    };

    this.initializeCleanup();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Configuration
  public updateConfig(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Session Creation & Management
  public async createChatSession(
    userId: string,
    type: string,
    title?: string,
    context?: any,
    metadata?: SessionMetadata
  ): Promise<ChatSession> {
    // Check concurrent session limits
    const activeSessions = await this.getActiveChatSessions(userId);
    if (activeSessions >= this.config.maxConcurrentSessions) {
      throw new Error('Maximum concurrent sessions reached');
    }

    // Create session via API
    const response = await fetch('/api/chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        title,
        context,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create chat session');
    }

    const { session } = await response.json();

    // Track analytics
    if (this.config.enableAnalytics) {
      this.trackSessionEvent('created', session.id, { type, userId });
    }

    return session;
  }

  public async getChatSession(sessionId: string, userId: string): Promise<ChatSession | null> {
    const response = await fetch(`/api/chat/sessions/${sessionId}`);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch session');
    }

    const { session } = await response.json();

    // Check ownership
    if (session.userId !== userId) {
      throw new Error('Unauthorized access to session');
    }

    return session;
  }

  public async updateChatSession(
    sessionId: string,
    userId: string,
    updates: { title?: string; context?: any }
  ): Promise<void> {
    const response = await fetch(`/api/chat/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update session');
    }

    // Track analytics
    if (this.config.enableAnalytics) {
      this.trackSessionEvent('updated', sessionId, updates);
    }
  }

  public async deleteChatSession(sessionId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete session');
    }

    // Track analytics
    if (this.config.enableAnalytics) {
      this.trackSessionEvent('deleted', sessionId, { userId });
    }

    // Clean up analytics data
    this.analytics.delete(`session_${sessionId}`);
  }

  // Message Management
  public async addChatMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: {
      tokens?: number;
      model?: string;
      userId: string;
    }
  ): Promise<ChatMessage> {
    const response = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        role,
        content,
        tokens: metadata?.tokens,
        model: metadata?.model,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add message');
    }

    const { message } = await response.json();

    // Track analytics
    if (this.config.enableAnalytics) {
      this.trackMessageEvent(sessionId, role, message.id, metadata);
    }

    return message;
  }

  // Session Analytics
  public async getSessionStats(userId?: string): Promise<SessionStats> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/chat/sessions/stats?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch session stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching session stats:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        averageDuration: 0,
        totalMessages: 0,
        peakConcurrentUsers: 0,
        sessionTypes: {},
      };
    }
  }

  public async getUserSessions(userId: string, options?: {
    type?: string;
    limit?: number;
    offset?: number;
    includeMessages?: boolean;
  }): Promise<ChatSession[]> {
    try {
      const params = new URLSearchParams();
      if (options?.type) params.append('type', options.type);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.includeMessages) params.append('includeMessages', 'true');

      const response = await fetch(`/api/chat/sessions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user sessions');
      }

      const { sessions } = await response.json();
      return sessions;
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
  }

  public async getActiveChatSessions(userId: string): Promise<number> {
    const sessions = await this.getUserSessions(userId);
    return sessions.filter(session => this.isSessionActive(session)).length;
  }

  // Session Utilities
  public isSessionActive(session: ChatSession): boolean {
    const now = new Date();
    const lastActivity = new Date(session.lastMessageAt);
    const timeoutMs = this.config.chatSessionTimeout * 60 * 1000;

    return (now.getTime() - lastActivity.getTime()) < timeoutMs;
  }

  public getSessionAge(session: ChatSession): number {
    const now = new Date();
    const created = new Date(session.createdAt);
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)); // days
  }

  // Analytics & Monitoring
  private trackSessionEvent(event: string, sessionId: string, data: any): void {
    const key = `session_${sessionId}`;
    const events = this.analytics.get(key) || [];
    events.push({
      event,
      timestamp: new Date().toISOString(),
      data,
    });
    this.analytics.set(key, events);
  }

  private trackMessageEvent(sessionId: string, role: string, messageId: string, metadata?: any): void {
    this.trackSessionEvent('message', sessionId, {
      messageId,
      role,
      metadata,
    });
  }

  public getSessionAnalytics(sessionId: string): any[] {
    return this.analytics.get(`session_${sessionId}`) || [];
  }

  // Cleanup & Maintenance
  private initializeCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval * 60 * 1000);
  }

  private async performCleanup(): Promise<void> {
    try {
      console.log('🧹 Performing session cleanup...');

      // Archive old sessions
      const archiveThreshold = new Date();
      archiveThreshold.setDate(archiveThreshold.getDate() - this.config.archiveAfter);

      // This would typically be done via a database cleanup job
      // For now, we'll just log the cleanup
      console.log(`📦 Would archive sessions older than ${archiveThreshold.toISOString()}`);

      // Clean up analytics data for old sessions
      for (const [key, events] of this.analytics.entries()) {
        const lastEvent = events[events.length - 1];
        if (lastEvent) {
          const eventDate = new Date(lastEvent.timestamp);
          if (eventDate < archiveThreshold) {
            this.analytics.delete(key);
          }
        }
      }

      console.log('✅ Session cleanup completed');
    } catch (error) {
      console.error('❌ Error during session cleanup:', error);
    }
  }

  // Persistence (for client-side session data)
  public saveSessionToStorage(sessionId: string, data: any): void {
    try {
      const key = `session_${sessionId}`;
      localStorage.setItem(key, JSON.stringify({
        ...data,
        savedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error);
    }
  }

  public loadSessionFromStorage(sessionId: string): any | null {
    try {
      const key = `session_${sessionId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        const savedAt = new Date(parsed.savedAt);
        const now = new Date();

        // Check if data is still fresh (within 24 hours)
        if ((now.getTime() - savedAt.getTime()) < 24 * 60 * 60 * 1000) {
          return parsed;
        } else {
          // Remove stale data
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Failed to load session from localStorage:', error);
    }
    return null;
  }

  public clearSessionStorage(sessionId: string): void {
    try {
      localStorage.removeItem(`session_${sessionId}`);
    } catch (error) {
      console.warn('Failed to clear session from localStorage:', error);
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
