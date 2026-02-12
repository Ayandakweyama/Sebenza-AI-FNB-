'use client';

import { useState, useRef, useMemo } from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import * as mammoth from 'mammoth';
import { parseCVResponse, downloadCVAsWord, downloadAnalysisAsPDF } from '@/lib/generateCVReport';
import type { ParsedCVResponse } from '@/lib/generateCVReport';

export default function CVRegeneratorPage() {
  const [cvText, setCvText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'mid' | 'senior' | 'executive'>('mid');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'cv' | 'report'>('cv');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsed: ParsedCVResponse | null = useMemo(() => {
    if (!response) return null;
    return parseCVResponse(response);
  }, [response]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    if (!validTypes.includes(file.type)) {
      setError('Please upload a .docx, .doc, or .txt file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    setUploading(true);
    setError('');
    setFileName(file.name);

    try {
      if (file.type === 'text/plain') {
        const text = await file.text();
        setCvText(text);
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setCvText(result.value);
      }
    } catch (err) {
      console.error('Error reading file:', err);
      setError('Failed to read the file. Please try again or paste your CV text manually.');
      setFileName('');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cvText.trim()) {
      setError('Please upload your CV or paste the text.');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please paste the job description.');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/afrigter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cv-regenerator',
          cvText: cvText.trim(),
          jobDescription: jobDescription.trim(),
          jobTitle: jobTitle.trim() || undefined,
          companyName: companyName.trim() || undefined,
          experienceLevel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to regenerate CV');
      }

      setResponse(data.response);
      setActiveTab('cv');
    } catch (err) {
      console.error('CV regeneration error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWord = async () => {
    if (!parsed?.enhancedCV) return;
    try {
      await downloadCVAsWord(parsed.enhancedCV, jobTitle || undefined, companyName || undefined);
    } catch (err) {
      console.error('Word download error:', err);
      setError('Failed to download Word document.');
    }
  };

  const handleDownloadPDF = () => {
    if (!parsed) return;
    try {
      downloadAnalysisAsPDF(parsed, jobTitle || undefined, companyName || undefined);
    } catch (err) {
      console.error('PDF download error:', err);
      setError('Failed to download PDF report.');
    }
  };

  const handleReset = () => {
    setCvText('');
    setJobDescription('');
    setJobTitle('');
    setCompanyName('');
    setResponse('');
    setError('');
    setFileName('');
    setActiveTab('cv');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Build the analysis markdown for the report tab
  const analysisMarkdown = useMemo(() => {
    if (!parsed) return '';
    const sections: string[] = [];

    if (parsed.changesMade.length > 0) {
      sections.push('## 🎯 What Was Changed');
      parsed.changesMade.forEach((c) => sections.push(`- ${c}`));
    }
    if (parsed.matchedKeywords.length > 0) {
      sections.push('\n## 📊 Matched Keywords');
      parsed.matchedKeywords.forEach((k) => sections.push(`- ${k}`));
    }
    if (parsed.missingKeywords.length > 0) {
      sections.push('\n## ❌ Missing Keywords');
      parsed.missingKeywords.forEach((k) => sections.push(`- ${k}`));
    }
    if (parsed.gapAnalysis.length > 0) {
      sections.push('\n## ⚠️ Gap Analysis');
      parsed.gapAnalysis.forEach((g) => sections.push(`- ${g}`));
    }
    if (parsed.additionalTips.length > 0) {
      sections.push('\n## 💡 Additional Tips');
      parsed.additionalTips.forEach((t) => sections.push(`- ${t}`));
    }

    return sections.join('\n');
  }, [parsed]);

  // Keyword match stats
  const kwStats = useMemo(() => {
    if (!parsed) return { matched: 0, missing: 0, total: 0, pct: 0 };
    const matched = parsed.matchedKeywords.length;
    const missing = parsed.missingKeywords.length;
    const total = matched + missing;
    return { matched, missing, total, pct: total > 0 ? Math.round((matched / total) * 100) : 0 };
  }, [parsed]);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto pt-16 sm:pt-20 pb-6 sm:pb-8 px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-8">
            <a
              href="/afrigter"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2" aria-hidden="true">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
              Back to Afrigter
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-500 bg-clip-text text-transparent text-center">
              CV Regenerator
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base text-center px-2 max-w-2xl mx-auto">
            Upload your CV and a job post — AI will enhance your CV to match the role without fabricating any credentials or abilities.
          </p>
        </div>

        {/* Show result or form */}
        {response && parsed ? (
          <div className="space-y-6">
            {/* Download & action bar */}
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                <p className="text-emerald-400 font-medium text-sm sm:text-base">
                  Your enhanced CV is ready
                </p>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
                >
                  Start Over
                </button>
              </div>

              {/* Download buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadWord}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-lg hover:shadow-blue-500/25 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
                  Download CV as Word
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-lg hover:shadow-rose-500/25 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
                  Download Analysis as PDF
                </button>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">{kwStats.pct}%</p>
                <p className="text-xs text-slate-400 mt-1">Keyword Match</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-cyan-400">{kwStats.matched}</p>
                <p className="text-xs text-slate-400 mt-1">Keywords Matched</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-amber-400">{kwStats.missing}</p>
                <p className="text-xs text-slate-400 mt-1">Keywords Missing</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-purple-400">{parsed.changesMade.length}</p>
                <p className="text-xs text-slate-400 mt-1">Changes Made</p>
              </div>
            </div>

            {/* Keyword match bar */}
            {kwStats.total > 0 && (
              <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
                <p className="text-sm font-medium text-slate-300 mb-2">Keyword Coverage</p>
                <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${kwStats.pct}%` }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                    style={{ width: `${100 - kwStats.pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-emerald-400">{kwStats.matched} matched</span>
                  <span className="text-xs text-red-400">{kwStats.missing} missing</span>
                </div>
              </div>
            )}

            {/* Tab switcher */}
            <div className="flex gap-1 bg-slate-900/60 border border-slate-700 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('cv')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'cv'
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Enhanced CV
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'report'
                    ? 'bg-rose-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Analysis Report
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'cv' ? (
              <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Enhanced CV</h2>
                  <button
                    onClick={handleDownloadWord}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 transition-colors"
                  >
                    Download .docx
                  </button>
                </div>
                <MarkdownRenderer content={parsed.enhancedCV || response} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Analysis Report</h2>
                    <button
                      onClick={handleDownloadPDF}
                      className="text-xs px-3 py-1.5 rounded-lg bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600/30 transition-colors"
                    >
                      Download PDF
                    </button>
                  </div>
                  <MarkdownRenderer content={analysisMarkdown || 'No analysis data available.'} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error */}
            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-xl p-4 text-sm">
                {error}
              </div>
            )}

            {/* CV Upload Section */}
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 sm:p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                Your CV
              </h2>

              {/* File upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Upload CV <span className="text-slate-500">(Word .docx, .doc, or .txt)</span>
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-slate-500 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.doc,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="cv-file-upload"
                  />
                  <label htmlFor="cv-file-upload" className="cursor-pointer">
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="text-sm text-slate-400">Reading file...</span>
                      </div>
                    ) : fileName ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <span className="text-sm text-emerald-300 font-medium">{fileName}</span>
                        <span className="text-xs text-slate-500">Click to upload a different file</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                        <span className="text-sm text-slate-400">Click to upload your CV</span>
                        <span className="text-xs text-slate-500">Supports .docx, .doc, .txt — Max 5MB</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Or paste manually */}
              <div>
                <label htmlFor="cv-text" className="block text-sm font-medium text-slate-300 mb-2">
                  Or paste your CV text
                </label>
                <textarea
                  id="cv-text"
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste your full CV text here..."
                  rows={8}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">{cvText.length} characters</p>
              </div>
            </div>

            {/* Job Post Section */}
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 sm:p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                Target Job Post
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="job-title" className="block text-sm font-medium text-slate-300 mb-2">
                    Job Title <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="job-title"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="company-name" className="block text-sm font-medium text-slate-300 mb-2">
                    Company Name <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="company-name"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. FNB"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="experience-level" className="block text-sm font-medium text-slate-300 mb-2">
                  Experience Level
                </label>
                <select
                  id="experience-level"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as 'entry' | 'mid' | 'senior' | 'executive')}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="entry">Entry Level (0-2 years)</option>
                  <option value="mid">Mid Level (2-5 years)</option>
                  <option value="senior">Senior Level (5-10 years)</option>
                  <option value="executive">Executive (10+ years)</option>
                </select>
              </div>

              <div>
                <label htmlFor="job-description" className="block text-sm font-medium text-slate-300 mb-2">
                  Job Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={8}
                  required
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">{jobDescription.length} characters</p>
              </div>
            </div>

            {/* Honesty notice */}
            <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-4 flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400 mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <p className="text-sm text-cyan-200">
                <strong>Honesty guarantee:</strong> The AI will only rephrase, reorganise, and optimise your existing credentials. It will never fabricate skills, experience, or qualifications you don't have. Any gaps will be flagged separately.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !cvText.trim() || !jobDescription.trim()}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 shadow-lg hover:shadow-cyan-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Enhancing your CV...
                </span>
              ) : (
                'Regenerate CV'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
