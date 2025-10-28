import { useState, useEffect, useCallback, useRef } from 'react';
import { sessionManager } from '@/lib/sessionManager';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  tokens?: number;
  model?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  type: string;
  lastMessageAt: string;
  messageCount: number;
  context?: any;
  messages?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatHistoryOptions {
  autoSave?: boolean;
  enableAnalytics?: boolean;
  persistenceEnabled?: boolean;
  sessionTimeout?: number; // minutes
}

export function useChatHistory(options: ChatHistoryOptions = {}) {
  const {
    autoSave = true,
    enableAnalytics = true,
    persistenceEnabled = true,
    sessionTimeout = 60,
  } = options;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // Initialize session manager config
  useEffect(() => {
    if (enableAnalytics) {
      sessionManager.updateConfig({
        enableAnalytics: true,
        chatSessionTimeout: sessionTimeout,
      });
    }
  }, [enableAnalytics, sessionTimeout]);

  // Get current user ID (this would need to be implemented based on your auth system)
  const getCurrentUserId = useCallback(async (): Promise<string | null> => {
    try {
      // This should be replaced with your actual auth logic
      // For example, using Clerk auth() or similar
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const data = await response.json();
        // Handle the actual response format from /api/auth/user
        if (data.success && data.user && data.user.id) {
          userIdRef.current = data.user.id;
          return data.user.id;
        } else if (data.userId) {
          // Fallback for simple format
          userIdRef.current = data.userId;
          return data.userId;
        }
      }
    } catch (error) {
      console.warn('Failed to get current user ID:', error);
    }
    return null;
  }, []);

  // Enhanced session fetching with caching
  const fetchSessions = useCallback(async (type?: string) => {
    setLoading(true);
    setError(null);

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const sessions = await sessionManager.getUserSessions(userId, {
        type,
        limit: 50,
        includeMessages: false,
      });

      setSessions(sessions);
      return sessions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sessions';
      setError(errorMessage);
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [getCurrentUserId]);

  // Enhanced session creation with analytics
  const createSession = useCallback(async (
    type: string,
    title?: string,
    context?: any
  ): Promise<ChatSession> => {
    setLoading(true);
    setError(null);

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const session = await sessionManager.createChatSession(
        userId,
        type,
        title,
        context
      );

      // Update local state
      setSessions(prev => [session, ...prev]);
      setCurrentSession(session);

      // Persist session data if enabled
      if (persistenceEnabled) {
        sessionManager.saveSessionToStorage(session.id, {
          type,
          title,
          context,
          createdAt: session.createdAt,
        });
      }

      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getCurrentUserId, persistenceEnabled]);

  // Enhanced session loading with persistence
  const loadSession = useCallback(async (sessionId: string): Promise<ChatSession> => {
    setLoading(true);
    setError(null);

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Try to load from local storage first
      let session: ChatSession | null = null;
      if (persistenceEnabled) {
        const cachedSession = sessionManager.loadSessionFromStorage(sessionId);
        if (cachedSession) {
          // Validate cached session is still valid
          const age = sessionManager.getSessionAge(cachedSession as any);
          if (age < 7) { // Use cache if less than 7 days old
            session = cachedSession as ChatSession;
          }
        }
      }

      // Load from API if not cached or cache is stale
      if (!session) {
        session = await sessionManager.getChatSession(sessionId, userId);
      }

      if (!session) {
        throw new Error('Session not found');
      }

      setCurrentSession(session);
      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load session';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getCurrentUserId, persistenceEnabled]);

  // Enhanced message adding with better error handling
  const addMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string,
    tokens?: number,
    model?: string,
    session?: ChatSession
  ): Promise<ChatMessage> => {
    const targetSession = session || currentSession;
    if (!targetSession) {
      throw new Error('No active session');
    }

    setError(null);

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const message = await sessionManager.addChatMessage(
        targetSession.id,
        role,
        content,
        { tokens, model, userId }
      );

      // Update current session with new message
      setCurrentSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), message],
          messageCount: prev.messageCount + 1,
          lastMessageAt: message.createdAt,
        };
      });

      // Update sessions list
      setSessions(prev =>
        prev.map(session =>
          session.id === targetSession.id
            ? {
                ...session,
                messageCount: session.messageCount + 1,
                lastMessageAt: message.createdAt
              }
            : session
        )
      );

      // Auto-save to persistence if enabled
      if (autoSave && persistenceEnabled) {
        sessionManager.saveSessionToStorage(targetSession.id, {
          lastMessageAt: message.createdAt,
          messageCount: targetSession.messageCount + 1,
        });
      }

      return message;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add message';
      setError(errorMessage);
      throw err;
    }
  }, [currentSession, getCurrentUserId, autoSave, persistenceEnabled]);

  // Enhanced session title update
  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    setError(null);

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      await sessionManager.updateChatSession(sessionId, userId, { title });

      // Update local state
      setSessions(prev =>
        prev.map(session =>
          session.id === sessionId ? { ...session, title } : session
        )
      );

      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, title } : prev);
      }

      // Update persistence
      if (persistenceEnabled) {
        sessionManager.saveSessionToStorage(sessionId, { title });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update session title';
      setError(errorMessage);
      throw err;
    }
  }, [getCurrentUserId, currentSession, persistenceEnabled]);

  // Enhanced session deletion with cleanup
  const deleteSession = useCallback(async (sessionId: string) => {
    setError(null);

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      await sessionManager.deleteChatSession(sessionId, userId);

      // Update local state
      setSessions(prev => prev.filter(session => session.id !== sessionId));

      // Clear current session if it's the one being deleted
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }

      // Clear persistence
      if (persistenceEnabled) {
        sessionManager.clearSessionStorage(sessionId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete session';
      setError(errorMessage);
      throw err;
    }
  }, [getCurrentUserId, currentSession, persistenceEnabled]);

  // Get session statistics
  const getSessionStats = useCallback(async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null;

      return await sessionManager.getSessionStats(userId);
    } catch (err) {
      console.error('Error fetching session stats:', err);
      return null;
    }
  }, [getCurrentUserId]);

  // Initialize on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      // Optionally auto-fetch sessions on mount
      // fetchSessions();
    }
  }, []);

  return {
    // Core session management
    sessions,
    currentSession,
    loading,
    error,

    // Session operations
    fetchSessions,
    createSession,
    loadSession,
    addMessage,
    updateSessionTitle,
    deleteSession,
    setCurrentSession,

    // Analytics and stats
    getSessionStats,

    // Utility functions
    getCurrentUserId,
  };
}
