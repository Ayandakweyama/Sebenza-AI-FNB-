'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Play,
  Square,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  ArrowLeft,
  Zap,
  AlertTriangle,
  BarChart3,
  Target,
  MessageSquare,
  Eye,
  TrendingUp,
  Award,
  Camera,
  CameraOff,
  Upload,
  FileText,
  Briefcase,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

interface InterviewQuestion {
  id: string;
  questionText: string;
  category: string | null;
  order: number;
  timeLimitSecs: number;
  response: {
    id: string;
    transcript: string | null;
    clarityScore: number | null;
    confidenceScore: number | null;
    relevanceScore: number | null;
    communicationScore: number | null;
    emotionScore: number | null;
    facialScore: number | null;
    aiFeedback: string | null;
    analysisStatus: string;
    durationSecs: number | null;
  } | null;
}

interface InterviewSession {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  status: string;
  overallScore: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface InterviewReport {
  finalScore: number;
  answerQualityScore: number | null;
  communicationScore: number | null;
  confidenceScore: number | null;
  engagementScore: number | null;
  relevanceScore: number | null;
  strengths: string[];
  weaknesses: string[];
  recruiterSummary: string | null;
  hiringRecommendation: string | null;
}

type PageView = 'setup' | 'recording' | 'analyzing' | 'results';

// ─── API base path ───────────────────────────────────────────────────────────

const API_BASE = '/api/afrigter/video-interview';

// ─── Component ───────────────────────────────────────────────────────────────

export default function VideoInterviewPage() {
  const { getToken } = useAuth();

  // Page state
  const [view, setView] = useState<PageView>('setup');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Setup form
  const [interviewType, setInterviewType] = useState('behavioral');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [cvText, setCvText] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // Session state
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Results
  const [report, setReport] = useState<InterviewReport | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── API Helper ─────────────────────────────────────────────────────────

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  }, [getToken]);

  // ─── Start Interview ───────────────────────────────────────────────────

  const handleStartInterview = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetchWithAuth(`${API_BASE}/start`, {
        method: 'POST',
        body: JSON.stringify({
          type: interviewType,
          difficulty,
          questionCount,
          cvText: cvText || undefined,
          jobTitle: jobTitle || undefined,
          jobDescription: jobDescription || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to start interview');
        return;
      }

      setSession(data.session);
      setQuestions(data.session.questions || []);
      setCurrentQuestionIndex(0);
      setView('recording');

      await startCamera();
    } catch (err) {
      setError('Failed to start interview session');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Camera ────────────────────────────────────────────────────────────

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Could not access camera/microphone. Please grant permissions.');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // ─── Recording ─────────────────────────────────────────────────────────

  const startRecording = () => {
    if (!streamRef.current) return;

    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          beginRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const beginRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus',
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      uploadRecording(blob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);
    setIsRecording(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        const currentQ = questions[currentQuestionIndex];
        if (currentQ && prev >= currentQ.timeLimitSecs) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // ─── Upload Recording ──────────────────────────────────────────────────

  const uploadRecording = async (blob: Blob) => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('questionId', currentQ.id);
      formData.append('video', blob, `recording-${currentQ.id}.webm`);
      formData.append('durationSecs', String(recordingTime));

      const res = await fetchWithAuth(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to upload recording');
        return;
      }

      setQuestions(prev => prev.map((q, i) =>
        i === currentQuestionIndex
          ? { ...q, response: { ...q.response, id: 'uploaded', analysisStatus: 'pending', transcript: null, clarityScore: null, confidenceScore: null, relevanceScore: null, communicationScore: null, emotionScore: null, facialScore: null, aiFeedback: null, durationSecs: recordingTime } as any }
          : q
      ));

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setRecordingTime(0);
      } else {
        await startAnalysis();
      }
    } catch (err) {
      setError('Failed to upload recording');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Analysis ──────────────────────────────────────────────────────────

  const startAnalysis = async () => {
    if (!session) return;

    stopCamera();
    setView('analyzing');

    try {
      const res = await fetchWithAuth(`${API_BASE}/analyze`, {
        method: 'POST',
        body: JSON.stringify({ sessionId: session.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to start analysis');
        return;
      }

      pollForResults(session.id);
    } catch (err) {
      setError('Failed to start analysis');
      console.error(err);
    }
  };

  const pollForResults = useCallback(async (sessionId: string) => {
    const poll = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE}/report?sessionId=${sessionId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.session?.status === 'completed' && data.report) {
          setReport(data.report);
          setQuestions(data.questions || []);
          setSession(prev => prev ? { ...prev, ...data.session } : prev);
          setView('results');
          return;
        }

        if (data.session?.status === 'failed') {
          setError('Analysis failed. Please try again.');
          setView('setup');
          return;
        }

        setTimeout(poll, 3000);
      } catch {
        setTimeout(poll, 5000);
      }
    };

    poll();
  }, [fetchWithAuth]);

  // ─── Cleanup ───────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopCamera]);

  // ─── Speak Question (Text-to-Speech) ───────────────────────────────────

  const speakQuestion = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech is not supported in your browser.');
      return;
    }

    // Stop any current speech first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Prefer a natural-sounding English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                      voices.find(v => v.lang.startsWith('en') && v.localService === false) ||
                      voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // ─── Helpers ───────────────────────────────────────────────────────────

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const scoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const scoreBg = (score: number | null) => {
    if (score === null) return 'bg-gray-500/10';
    if (score >= 80) return 'bg-green-500/10 border-green-500/20';
    if (score >= 60) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto pt-10 sm:pt-14">

        {/* Header */}
        <div className="mb-6">
          <Link href="/afrigter" className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors text-sm sm:text-base mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Afrigter
          </Link>
          <h1 className="text-2xl font-bold text-white">AI Video Interview Analysis</h1>
          <p className="text-sm text-gray-400 mt-1">Record practice interviews and get AI-powered feedback</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
              <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
                <XCircle className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Setup View ──────────────────────────────────────────────── */}
        {view === 'setup' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                Configure Your Interview
              </h2>

              {/* CV Upload + Job Description */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* CV Upload */}
                <div className="bg-slate-800/30 border border-slate-600/50 rounded-xl p-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <FileText className="w-4 h-4 text-purple-400" /> Your CV / Resume
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Upload your CV so the AI generates questions based on your experience.</p>
                  <label className="flex items-center justify-center gap-2 w-full bg-slate-700/50 border border-dashed border-slate-500 rounded-lg px-4 py-3 text-sm text-gray-400 hover:border-purple-500 hover:text-purple-400 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    {cvFileName || 'Upload CV (.txt, .pdf)'}
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setCvFileName(file.name);
                        const text = await file.text();
                        setCvText(text.substring(0, 5000));
                      }}
                    />
                  </label>
                  {cvText && (
                    <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> CV loaded ({cvText.length} chars)
                    </p>
                  )}
                  <textarea
                    value={cvText}
                    onChange={(e) => setCvText(e.target.value)}
                    placeholder="Or paste your CV text here..."
                    rows={3}
                    className="mt-2 w-full bg-slate-700/30 border border-slate-600/30 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                {/* Job Details */}
                <div className="bg-slate-800/30 border border-slate-600/50 rounded-xl p-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <Briefcase className="w-4 h-4 text-purple-400" /> Job You&apos;re Applying For
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Paste the job title and description so questions are tailored to the role.</p>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Job title (e.g. Senior Software Engineer)"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-2"
                  />
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here..."
                    rows={5}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Interview Type</label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="behavioral">Behavioral</option>
                    <option value="technical">Technical</option>
                    <option value="situational">Situational</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Questions ({questionCount})</label>
                  <input
                    type="range"
                    min={3}
                    max={10}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full accent-purple-500 mt-2"
                  />
                </div>
              </div>

              <button
                onClick={handleStartInterview}
                disabled={isLoading}
                className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> Generating Questions...</>
                ) : (
                  <><Play className="w-5 h-5" /> Start Interview</>
                )}
              </button>
            </div>

            <div className="text-xs text-gray-500 bg-slate-800/30 rounded-lg p-4 space-y-1">
              <strong className="text-gray-400">How it works:</strong>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Upload your CV and paste the job description</li>
                <li>AI generates tailored interview questions for the role</li>
                <li>Record your video answers for each question</li>
                <li>AI transcribes and analyzes your responses against the job requirements</li>
                <li>Get detailed scores and a recruiter-style report</li>
              </ol>
            </div>
          </motion.div>
        )}

        {/* ─── Recording View ──────────────────────────────────────────── */}
        {view === 'recording' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <div className="flex-1 bg-slate-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${((currentQuestionIndex + (questions[currentQuestionIndex]?.response ? 1 : 0)) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-purple-500/20 rounded-lg p-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <span className="text-xs text-purple-400 uppercase tracking-wide">
                    {questions[currentQuestionIndex]?.category || 'Question'}
                  </span>
                  <p className="text-lg text-white mt-1">
                    {questions[currentQuestionIndex]?.questionText}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className={isRecording ? 'text-red-400 font-mono' : ''}>
                    {formatTime(recordingTime)} / {formatTime(questions[currentQuestionIndex]?.timeLimitSecs || 120)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                    } else {
                      speakQuestion(questions[currentQuestionIndex]?.questionText || '');
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isSpeaking
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-700 border border-slate-600/50'
                  }`}
                >
                  {isSpeaking ? (
                    <><VolumeX className="w-4 h-4" /> Stop Audio</>
                  ) : (
                    <><Volume2 className="w-4 h-4" /> Hear Question</>
                  )}
                </button>
              </div>
            </div>

            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <AnimatePresence>
                {countdown > 0 && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/60"
                  >
                    <span className="text-8xl font-bold text-white">{countdown}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 rounded-full px-3 py-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-sm font-medium">REC</span>
                </div>
              )}
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <div className="text-center">
                    <CameraOff className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400">Waiting for camera...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={!cameraReady || isLoading || countdown > 0}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-xl flex items-center gap-2 transition-all"
                >
                  <Camera className="w-5 h-5" /> Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-8 rounded-xl flex items-center gap-2 transition-all"
                >
                  <Square className="w-5 h-5" /> Stop Recording
                </button>
              )}
              {!isRecording && (
                <button
                  onClick={() => {
                    if (currentQuestionIndex < questions.length - 1) {
                      setCurrentQuestionIndex(prev => prev + 1);
                    } else {
                      startAnalysis();
                    }
                  }}
                  className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
                >
                  Skip <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {isLoading && (
              <div className="text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Uploading recording...
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Analyzing View ─────────────────────────────────────────── */}
        {view === 'analyzing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-12 max-w-lg mx-auto">
              <RefreshCw className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-bold text-white mb-2">Analyzing Your Interview</h2>
              <p className="text-gray-400 mb-6">
                AI is transcribing your answers, analyzing confidence, communication clarity, and generating your report...
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>Transcribing audio with Whisper...</p>
                <p>Evaluating answer quality...</p>
                <p>Analyzing speaking confidence...</p>
                <p>Generating recruiter report...</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Results View ───────────────────────────────────────────── */}
        {view === 'results' && report && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className={`border rounded-2xl p-6 text-center ${scoreBg(report.finalScore)}`}>
              <Award className={`w-12 h-12 mx-auto mb-2 ${scoreColor(report.finalScore)}`} />
              <div className={`text-5xl font-bold ${scoreColor(report.finalScore)}`}>
                {report.finalScore}
                <span className="text-lg text-gray-400">/100</span>
              </div>
              <p className="text-gray-400 mt-1">Overall Interview Score</p>
              {report.hiringRecommendation && (
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  report.hiringRecommendation === 'proceed' ? 'bg-green-500/20 text-green-400' :
                  report.hiringRecommendation === 'maybe' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {report.hiringRecommendation === 'proceed' ? 'Proceed to Next Round' :
                   report.hiringRecommendation === 'maybe' ? 'Consider Further' :
                   'Needs Improvement'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Answer Quality', score: report.answerQualityScore, icon: Target, weight: '40%' },
                { label: 'Communication', score: report.communicationScore, icon: MessageSquare, weight: '20%' },
                { label: 'Confidence', score: report.confidenceScore, icon: TrendingUp, weight: '15%' },
                { label: 'Engagement', score: report.engagementScore, icon: Eye, weight: '15%' },
                { label: 'Relevance', score: report.relevanceScore, icon: BarChart3, weight: '10%' },
              ].map((item) => (
                <div key={item.label} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-center">
                  <item.icon className={`w-5 h-5 mx-auto mb-1 ${scoreColor(item.score)}`} />
                  <div className={`text-2xl font-bold ${scoreColor(item.score)}`}>
                    {item.score ?? '—'}
                  </div>
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-xs text-gray-600">{item.weight}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 border border-green-500/20 rounded-xl p-5">
                <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Strengths
                </h3>
                <ul className="space-y-2">
                  {(report.strengths || []).map((s, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-900/50 border border-amber-500/20 rounded-xl p-5">
                <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {(report.weaknesses || []).map((w, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {report.recruiterSummary && (
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-3">Recruiter Assessment</h3>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{report.recruiterSummary}</p>
              </div>
            )}

            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Question-by-Question Analysis</h3>
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id} className="border border-slate-700/30 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-xs text-purple-400 uppercase">{q.category}</span>
                        <p className="text-sm text-white mt-1">{q.questionText}</p>
                      </div>
                      {q.response?.clarityScore !== null && (
                        <div className={`text-lg font-bold ${scoreColor(q.response?.clarityScore ?? null)}`}>
                          {Math.round(
                            ((q.response?.clarityScore || 0) + (q.response?.communicationScore || 0) + (q.response?.confidenceScore || 0)) / 3
                          )}
                        </div>
                      )}
                    </div>
                    {q.response?.aiFeedback && (
                      <p className="text-xs text-gray-400 mt-2 border-t border-slate-700/30 pt-2">
                        {q.response.aiFeedback.substring(0, 300)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setView('setup');
                  setSession(null);
                  setQuestions([]);
                  setReport(null);
                  setCurrentQuestionIndex(0);
                  setError('');
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" /> Practice Again
              </button>
              <Link
                href="/afrigter"
                className="px-6 py-3 bg-slate-800 border border-slate-700 rounded-xl text-gray-300 hover:text-white transition-colors text-center"
              >
                Back to Afrigter
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
