'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Edit2, Clock, MoreVertical } from 'lucide-react';
import { useChatHistory, ChatSession } from '@/hooks/useChatHistory';

interface ChatHistorySidebarProps {
  type?: string;
  onSessionSelect?: (session: ChatSession) => void;
  onNewChat?: () => void;
  currentSessionId?: string;
  className?: string;
}

export default function ChatHistorySidebar({ 
  type, 
  onSessionSelect, 
  onNewChat,
  currentSessionId,
  className = ''
}: ChatHistorySidebarProps) {
  const { sessions, loading, error, fetchSessions, deleteSession, updateSessionTitle } = useChatHistory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    fetchSessions(type);
  }, [type]);

  const handleStartEdit = (session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveEdit = async (sessionId: string) => {
    if (editTitle.trim()) {
      try {
        await updateSessionTitle(sessionId, editTitle.trim());
        setEditingId(null);
      } catch (error) {
        console.error('Failed to update title:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = async (sessionId: string) => {
    if (confirm('Are you sure you want to delete this chat?')) {
      try {
        await deleteSession(sessionId);
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getTypeIcon = (sessionType: string) => {
    switch (sessionType) {
      case 'career-advice':
        return '💡';
      case 'resume-tips':
        return '📄';
      case 'interview-prep':
        return '🎤';
      case 'job-search':
        return '🔍';
      case 'skill-gap':
        return '📊';
      case 'career-roadmap':
        return '🗺️';
      default:
        return '💬';
    }
  };

  return (
    <div className={`bg-slate-800/50 border-r border-slate-700 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Chat History</h2>
          </div>
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              title="New Chat"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
        {type && (
          <p className="text-sm text-slate-400 mt-1 capitalize">
            {type.replace('-', ' ')} conversations
          </p>
        )}
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {loading && sessions.length === 0 ? (
          <div className="p-4 text-center text-slate-400">
            <div className="animate-pulse">Loading chats...</div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-400">
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => fetchSessions(type)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              Try again
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center text-slate-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-blue-600/20 border border-blue-500/30'
                    : 'hover:bg-slate-700/50'
                }`}
                onClick={() => onSessionSelect?.(session)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{getTypeIcon(session.type)}</span>
                      {editingId === session.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleSaveEdit(session.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(session.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="flex-1 bg-slate-700 text-white text-sm px-2 py-1 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className="text-sm font-medium text-white truncate">
                          {session.title}
                        </h3>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(session.lastMessageAt)}</span>
                      <span>•</span>
                      <span>{session.messageCount} messages</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(session);
                      }}
                      className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white transition-colors"
                      title="Edit title"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(session.id);
                      }}
                      className="p-1 hover:bg-red-600 rounded text-slate-400 hover:text-red-300 transition-colors"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-400 text-center">
          {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
