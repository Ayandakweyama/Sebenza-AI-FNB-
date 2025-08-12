'use client';

import { useState } from 'react';
import { Send, User, Bot, Briefcase, TrendingUp, Users, BookOpen, Mic, BarChart3, HandHeart, Sparkles, MessageSquare } from 'lucide-react';
import { useAfrigter } from '@/hooks/useAfrigter';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';

export default function CareerAdvicePage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hello! I'm your AI career advisor. I'm here to help you navigate your professional journey, whether you're just starting out, looking to make a career change, or aiming for that next promotion. What career challenge can I help you with today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { callAfrigter } = useAfrigter();

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!experienceLevel) {
      alert('Please select your experience level first');
      return;
    }

    const newMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      content: inputValue
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await callAfrigter({
        type: 'career-advice',
        question: inputValue,
        experienceLevel
      });

      if (response) {
        const aiMessage = {
          id: messages.length + 2,
          type: 'assistant' as const,
          content: response as string
        };
        setMessages(prev => [...prev, aiMessage]);
      }
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
      icon: Sparkles, 
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Chat Interface */}
              <div className="lg:col-span-2">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden">
                  {/* Experience Level Selector */}
                  <div className="p-4 bg-slate-800/80 border-b border-slate-700">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Your Experience Level
                    </label>
                    <select 
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full p-3 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      <option value="">Select your experience level</option>
                      <option value="student">Student/Entry-level</option>
                      <option value="early">Early Career (1-3 years)</option>
                      <option value="mid">Mid-Career (4-9 years)</option>
                      <option value="experienced">Experienced (10+ years)</option>
                      <option value="executive">Executive</option>
                    </select>
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
                          <p className="text-sm leading-relaxed">{message.content}</p>
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
              <div className="space-y-6">
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