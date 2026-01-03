'use client';

import { useState, useEffect } from 'react';
import { Send, User, Bot, Briefcase, TrendingUp, Users, BookOpen, Mic, BarChart3, HandHeart, MessageSquare, History } from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import ChatHistorySidebar from '@/components/chat/ChatHistorySidebar';
import { useChatHistory, ChatSession } from '@/hooks/useChatHistory';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export default function CareerAdvicePage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hello! I'm your AI career advisor. I'm here to help you navigate your professional journey, whether you're just starting out, looking to make a career change, or aiming for that next promotion. What career challenge can I help you with today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'mid' | 'senior' | 'executive'>('mid');
  const [currentRole, setCurrentRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [goals, setGoals] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { currentSession, createSession, loadSession, addMessage, setCurrentSession } = useChatHistory();

  // Initialize or load session
  useEffect(() => {
    if (currentSession && currentSession.type === 'career-advice') {
      // Convert session messages to local format
      const sessionMessages = currentSession.messages?.map((msg, index) => ({
        id: index + 1,
        type: msg.role as 'user' | 'assistant',
        content: msg.content
      })) || [];
      
      if (sessionMessages.length > 0) {
        setMessages(sessionMessages);
      }
    }
  }, [currentSession]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    const newMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      content: userMessage
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Create session if none exists
      let session = currentSession;
      if (!session || session.type !== 'career-advice') {
        session = await createSession('career-advice', 'Career Advice Chat', {
          experienceLevel,
          currentRole,
          industry,
          goals
        });
        // Ensure the current session is set immediately
        setCurrentSession(session);
      }

      // Ensure we have a valid session before adding messages
      if (!session) {
        throw new Error('Failed to create or load session');
      }

      // Add user message to session
      await addMessage('user', userMessage, undefined, undefined, session);

      // Get AI response
      const response = await fetch('/api/afrigter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'career-advice',
          question: userMessage,
          experienceLevel,
          currentRole: currentRole || undefined,
          industry: industry || undefined,
          goals: goals || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get career advice');
      }

      const aiResponse = data.response;
      const aiMessage = {
        id: messages.length + 2,
        type: 'assistant' as const,
        content: aiResponse
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Add AI message to session
      await addMessage('assistant', aiResponse, undefined, 'gpt-4o-mini', session);
      
    } catch (error) {
      console.error('Error getting career advice:', error);
      const errorMessage = {
        id: messages.length + 2,
        type: 'assistant' as const,
        content: "I'm sorry, I encountered an error while processing your request. Please try again later."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSessionSelect = async (session: ChatSession) => {
    try {
      await loadSession(session.id);
      setShowHistory(false);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const handleNewChat = () => {
    setMessages([{
      id: 1,
      type: 'assistant',
      content: "Hello! I'm your AI career advisor. I'm here to help you navigate your professional journey, whether you're just starting out, looking to make a career change, or aiming for that next promotion. What career challenge can I help you with today?"
    }]);
    setShowHistory(false);
  };

  const quickTopics = [
    { 
      icon: TrendingUp, 
      text: "How can I transition into a new career field?", 
      color: "bg-blue-500" 
    },
    { 
      icon: BarChart3, 
      text: "What's the best way to negotiate a higher salary?", 
      color: "bg-green-500" 
    },
    { 
      icon: TrendingUp, 
      text: "How can I build a strong personal brand?", 
      color: "bg-purple-500" 
    },
    { 
      icon: BookOpen, 
      text: "What skills should I learn to advance in my career?", 
      color: "bg-orange-500" 
    },
    { 
      icon: Users, 
      text: "What are effective networking strategies?", 
      color: "bg-pink-500" 
    },
    { 
      icon: HandHeart, 
      text: "How can I achieve better work-life balance?", 
      color: "bg-teal-500" 
    }
  ];

  const resources = [
    { icon: BookOpen, title: "Career Development E-books", desc: "Comprehensive guides for professional growth" },
    { icon: Mic, title: "Industry Expert Podcasts", desc: "Weekly insights from career coaches" },
    { icon: BarChart3, title: "Salary Benchmarking Tools", desc: "Know your market value" },
    { icon: HandHeart, title: "Mentorship Programs", desc: "Connect with experienced professionals" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20">
        <DashboardNavigation 
          title="Career Advice"
          description="Get personalized career guidance and advice from our AI mentor"
        />
        
        <div className="mt-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
            <div className="px-4 py-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Career Advisor AI</h1>
                  <p className="text-slate-400 text-sm">Your personalized career guidance companion</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-8">
            <div className={`grid gap-8 ${showHistory ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1 lg:grid-cols-3'}`}>
              
              {/* Chat History Sidebar */}
              {showHistory && (
                <div className="lg:col-span-1">
                  <ChatHistorySidebar 
                    type="career-advice"
                    onSessionSelect={handleSessionSelect}
                    onNewChat={handleNewChat}
                    currentSessionId={currentSession?.id}
                    className="h-[600px]"
                  />
                </div>
              )}
              {/* Main Chat Interface */}
              <div className={showHistory ? 'lg:col-span-2' : 'lg:col-span-2'}>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden">
                  {/* Chat Header with History Toggle */}
                  <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-medium">Career Advisor</span>
                      {currentSession && (
                        <span className="text-xs text-slate-400">• {currentSession.title}</span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className={`p-2 rounded-lg transition-colors ${
                        showHistory 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      title="Toggle chat history"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Profile Setup */}
                  <div className="p-4 bg-slate-800/80 border-b border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Experience Level
                        </label>
                        <select 
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value as any)}
                          className="w-full p-3 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
                        >
                          <option value="entry">Entry Level (0-2 years)</option>
                          <option value="mid">Mid Level (3-7 years)</option>
                          <option value="senior">Senior Level (8-15 years)</option>
                          <option value="executive">Executive (15+ years)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Current Role (Optional)
                        </label>
                        <input
                          type="text"
                          value={currentRole}
                          onChange={(e) => setCurrentRole(e.target.value)}
                          placeholder="e.g., Software Engineer"
                          className="w-full p-3 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors placeholder-slate-400"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Industry (Optional)
                        </label>
                        <input
                          type="text"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder="e.g., Technology, Finance"
                          className="w-full p-3 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors placeholder-slate-400"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Career Goals (Optional)
                        </label>
                        <input
                          type="text"
                          value={goals}
                          onChange={(e) => setGoals(e.target.value)}
                          placeholder="e.g., Leadership role, Career change"
                          className="w-full p-3 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.type === 'user' 
                            ? 'bg-blue-500' 
                            : 'bg-gradient-to-br from-purple-500 to-pink-500'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className={`max-w-[85%] p-3 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-700 text-slate-100'
                        }`}>
                          {message.type === 'assistant' ? (
                            <MarkdownRenderer content={message.content} className="prose-sm" />
                          ) : (
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-slate-700 text-slate-100 p-3 rounded-2xl">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 bg-slate-800/80 border-t border-slate-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask me about career development, job search, salary negotiation..."
                        className="flex-1 p-3 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors placeholder-slate-400"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className={`space-y-6 ${showHistory ? 'lg:col-span-1' : 'lg:col-span-1'}`}>
                {/* Quick Topics */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    <h2 className="text-xl font-semibold text-white">Popular Topics</h2>
                  </div>
                  <div className="space-y-3">
                    {quickTopics.map((topic, index) => (
                      <button
                        key={index}
                        onClick={() => setInputValue(topic.text)}
                        className="w-full flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group"
                      >
                        <div className={`w-8 h-8 ${topic.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <topic.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-slate-300 group-hover:text-white transition-colors text-sm">
                          {topic.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">Career Resources</h2>
                  </div>
                  <div className="space-y-4">
                    {resources.map((resource, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer group">
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center group-hover:from-slate-500 group-hover:to-slate-600 transition-all">
                          <resource.icon className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                            {resource.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">{resource.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Status */}
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl border border-blue-500/30 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-300">AI Assistant Online</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Ready to provide personalized career guidance based on your experience and goals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}