import { useState, useEffect } from 'react';

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

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's chat sessions
  const fetchSessions = async (type?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      
      const response = await fetch(`/api/chat/sessions?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sessions');
      }
      
      setSessions(data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  // Create new chat session
  const createSession = async (type: string, title?: string, context?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          title,
          context,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session');
      }
      
      const newSession = { ...data.session, messages: [] };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load specific session with messages
  const loadSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load session');
      }
      
      setCurrentSession(data.session);
      return data.session;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add message to current session
  const addMessage = async (role: 'user' | 'assistant', content: string, tokens?: number, model?: string, session?: ChatSession) => {
    const targetSession = session || currentSession;
    if (!targetSession) {
      throw new Error('No active session');
    }

    setError(null);
    
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: targetSession.id,
          role,
          content,
          tokens,
          model,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add message');
      }
      
      // Update current session with new message
      const newMessage = data.message;
      setCurrentSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), newMessage],
          messageCount: prev.messageCount + 1,
          lastMessageAt: newMessage.createdAt,
        };
      });
      
      // Update sessions list
      setSessions(prev => 
        prev.map(session => 
          session.id === targetSession.id 
            ? { ...session, messageCount: session.messageCount + 1, lastMessageAt: newMessage.createdAt }
            : session
        )
      );
      
      return newMessage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add message');
      throw err;
    }
  };

  // Update session title
  const updateSessionTitle = async (sessionId: string, title: string) => {
    setError(null);
    
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update session');
      }
      
      // Update sessions list
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId ? { ...session, title } : session
        )
      );
      
      // Update current session if it's the one being updated
      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, title } : prev);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session');
      throw err;
    }
  };

  // Delete session
  const deleteSession = async (sessionId: string) => {
    setError(null);
    
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete session');
      }
      
      // Remove from sessions list
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // Clear current session if it's the one being deleted
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
      throw err;
    }
  };

  return {
    sessions,
    currentSession,
    loading,
    error,
    fetchSessions,
    createSession,
    loadSession,
    addMessage,
    updateSessionTitle,
    deleteSession,
    setCurrentSession,
  };
}
