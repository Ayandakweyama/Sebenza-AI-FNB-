'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Bot, Briefcase, History, Mic, MessageSquare, Search, Send, Sparkles, TrendingUp, Users, BarChart3, HandHeart, User } from 'lucide-react';
import ChatHistorySidebar from '@/components/chat/ChatHistorySidebar';
import { useChatHistory, ChatSession } from '@/hooks/useChatHistory';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export default function CareerAdvicePage() {
  const makeMsgId = useMemo(() => {
    return () =>
      (globalThis.crypto && 'randomUUID' in globalThis.crypto
        ? (globalThis.crypto as Crypto).randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  }, []);

  const [messages, setMessages] = useState([
    {
      id: makeMsgId(),
      type: 'assistant',
      content: "Hello! I'm your AI career advisor. I'm here to help you navigate your professional journey, whether you're just starting out, looking to make a career change, or aiming for that next promotion. What career challenge can I help you with today?"
    }
  ]);
  const inFlightRef = useRef(false);
  const [inputValue, setInputValue] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'mid' | 'senior' | 'executive'>('mid');
  const [currentRole, setCurrentRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [goals, setGoals] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');
  const [topicCategory, setTopicCategory] = useState<'all' | 'transition' | 'salary' | 'growth' | 'networking' | 'balance'>('all');
  const { currentSession, createSession, loadSession, addMessage, setCurrentSession } = useChatHistory();

  // Initialize or load session
  useEffect(() => {
    if (currentSession && currentSession.type === 'career-advice') {
      // Convert session messages to local format
      const sessionMessages = currentSession.messages?.map((msg, index) => ({
        id: makeMsgId(),
        type: msg.role as 'user' | 'assistant',
        content: msg.content
      })) || [];
      
      if (sessionMessages.length > 0) {
        setMessages(sessionMessages);
      }
    }
  }, [currentSession, makeMsgId]);

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText ?? inputValue).trim();
    if (!textToSend) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const userMessage = textToSend;
    const newMessage = {
      id: makeMsgId(),
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
        id: makeMsgId(),
        type: 'assistant' as const,
        content: aiResponse
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Add AI message to session
      await addMessage('assistant', aiResponse, undefined, 'gpt-4o-mini', session);
      
    } catch (error) {
      console.error('Error getting career advice:', error);
      const errorMessage = {
        id: makeMsgId(),
        type: 'assistant' as const,
        content: "I'm sorry, I encountered an error while processing your request. Please try again later."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      inFlightRef.current = false;
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
      id: makeMsgId(),
      type: 'assistant',
      content: "Hello! I'm your AI career advisor. I'm here to help you navigate your professional journey, whether you're just starting out, looking to make a career change, or aiming for that next promotion. What career challenge can I help you with today?"
    }]);
    setShowHistory(false);
  };

  const quickTopics = [
    { 
      icon: TrendingUp, 
      text: "How can I transition into a new career field?", 
      color: "bg-blue-500",
      category: 'transition' as const
    },
    { 
      icon: BarChart3, 
      text: "What's the best way to negotiate a higher salary?", 
      color: "bg-green-500",
      category: 'salary' as const
    },
    { 
      icon: TrendingUp, 
      text: "How can I build a strong personal brand?", 
      color: "bg-purple-500",
      category: 'growth' as const
    },
    { 
      icon: BookOpen, 
      text: "What skills should I learn to advance in my career?", 
      color: "bg-orange-500",
      category: 'growth' as const
    },
    { 
      icon: Users, 
      text: "What are effective networking strategies?", 
      color: "bg-pink-500",
      category: 'networking' as const
    },
    { 
      icon: HandHeart, 
      text: "How can I achieve better work-life balance?", 
      color: "bg-teal-500",
      category: 'balance' as const
    }
  ];

  const resources = [
    {
      icon: BookOpen,
      title: "Career Development Reading Plan",
      desc: "Curated reading list + what to practice each week",
      prompt: "Create a 4-week career development reading plan with specific topics, practical exercises, and deliverables I can show in interviews.",
      accent: "from-purple-500/20 via-pink-500/10 to-transparent"
    },
    {
      icon: Mic,
      title: "Podcast + Notes System",
      desc: "Listen smarter with summaries and action items",
      prompt: "Recommend a podcast learning system for career growth: how to take notes, extract actions, and review weekly. Include a template I can copy.",
      accent: "from-blue-500/20 via-purple-500/10 to-transparent"
    },
    {
      icon: BarChart3,
      title: "Salary Negotiation Toolkit",
      desc: "Scripts, anchors, and counter-offers that work",
      prompt: "Build a salary negotiation toolkit: preparation checklist, market research steps, 3 negotiation scripts, and how to handle common pushbacks.",
      accent: "from-emerald-500/20 via-teal-500/10 to-transparent"
    },
    {
      icon: HandHeart,
      title: "Mentorship Outreach Pack",
      desc: "Find mentors + send high-converting messages",
      prompt: "Create a mentorship outreach plan: where to find mentors, how to pick 10 targets, and write 3 outreach messages (LinkedIn, email, warm intro).",
      accent: "from-pink-500/20 via-purple-500/10 to-transparent"
    }
  ];

  const topicCategories = [
    { key: 'all' as const, label: 'All' },
    { key: 'transition' as const, label: 'Transitions' },
    { key: 'salary' as const, label: 'Salary' },
    { key: 'growth' as const, label: 'Growth' },
    { key: 'networking' as const, label: 'Networking' },
    { key: 'balance' as const, label: 'Balance' }
  ];

  const filteredTopics = quickTopics.filter((t) => {
    const matchesCategory = topicCategory === 'all' ? true : t.category === topicCategory;
    const q = topicSearch.trim().toLowerCase();
    const matchesSearch = !q ? true : t.text.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto pt-16 sm:pt-20 pb-6 sm:pb-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-8">
            <a 
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left h-5 w-5 mr-2" aria-hidden="true">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
              Back to Dashboard
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent text-center">
              Career Advice
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base text-center px-2">
            Get personalized career guidance and advice from our AI mentor
          </p>
        </div>
        
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
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask me about career development, job search, salary negotiation..."
                        className="flex-1 p-3 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors placeholder-slate-400"
                      />
                      <button
                        onClick={() => handleSendMessage()}
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
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 overflow-hidden">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                      <h2 className="text-xl font-semibold text-white">Popular Topics</h2>
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Sparkles className="w-4 h-4 text-purple-300" />
                      Tap to ask
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        value={topicSearch}
                        onChange={(e) => setTopicSearch(e.target.value)}
                        placeholder="Search topics..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-700/40 rounded-lg text-sm text-white border border-slate-600/60 focus:border-blue-500 focus:outline-none placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3">
                    {topicCategories.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setTopicCategory(c.key)}
                        className={[
                          'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                          topicCategory === c.key
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-slate-900/20 border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-600'
                        ].join(' ')}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {filteredTopics.map((topic, index) => (
                      <motion.button
                        key={`${topic.text}-${index}`}
                        type="button"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSendMessage(topic.text)}
                        className="w-full flex items-start gap-3 p-3 bg-slate-700/40 hover:bg-slate-700/60 rounded-xl transition-colors group border border-transparent hover:border-white/10"
                      >
                        <div className={`w-9 h-9 ${topic.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-black/20`}>
                          <topic.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-slate-200 group-hover:text-white transition-colors text-sm leading-snug">
                            {topic.text}
                          </div>
                          <div className="mt-1 text-xs text-slate-500 group-hover:text-slate-400 transition-colors inline-flex items-center gap-1">
                            Ask now <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </motion.button>
                    ))}
                    {filteredTopics.length === 0 ? (
                      <div className="text-sm text-slate-400 bg-slate-700/20 rounded-xl p-4 border border-slate-700/60">
                        No topics match your search.
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Resources */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 overflow-hidden">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-400" />
                      <h2 className="text-xl font-semibold text-white">Career Resources</h2>
                    </div>
                    <div className="text-xs text-slate-400">One tap prompts</div>
                  </div>

                  <div className="space-y-4">
                    {resources.map((resource, index) => (
                      <motion.button
                        key={`${resource.title}-${index}`}
                        type="button"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSendMessage(resource.prompt)}
                        className="w-full text-left relative overflow-hidden rounded-2xl border border-white/10 bg-slate-700/20 hover:bg-slate-700/35 transition-colors"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${resource.accent}`} />
                        <div className="relative p-4 flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900/40 border border-white/10 flex items-center justify-center">
                            <resource.icon className="w-5 h-5 text-slate-200" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-sm font-semibold text-white">{resource.title}</h3>
                              <span className="shrink-0 inline-flex items-center gap-1 text-xs text-slate-300 bg-white/5 border border-white/10 px-2 py-1 rounded-full">
                                Ask <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                            <p className="text-xs text-slate-300/80 mt-1">{resource.desc}</p>
                            <p className="text-[11px] text-slate-400 mt-3">
                              Uses your experience level, role, industry, and goals for better recommendations.
                            </p>
                          </div>
                        </div>
                      </motion.button>
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
