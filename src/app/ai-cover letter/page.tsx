'use client';

import { useState } from 'react';
import { Upload, FileText, Sparkles, CheckCircle, Loader2, X, AlertCircle, Briefcase } from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';

export default function AICoverLetterPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('text');
  const [file, setFile] = useState<File | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  const generateCoverLetter = async () => {
    if (!jobDescription.trim() || (activeTab === 'text' && !resumeText.trim()) || (activeTab === 'upload' && !file)) {
      setError('Please provide job description and resume information');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      let resumeContent = resumeText;

      // If file is uploaded, extract text
      if (activeTab === 'upload' && file) {
        if (file.type === 'text/plain') {
          resumeContent = await file.text();
        } else {
          resumeContent = `Resume file: ${file.name}\n\nPlease note: File parsing is not implemented in this demo. Please use the 'Paste Text' option for full functionality.`;
        }
      }

      const response = await fetch('/api/afrigter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'cover-letter',
          jobDescription,
          resumeText: resumeContent,
          companyName: companyName || undefined,
          jobTitle: jobTitle || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate cover letter');
      }

      setGeneratedCoverLetter(data.response);
      setGenerationComplete(true);
    } catch (err) {
      console.error('Cover letter generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating your cover letter');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <DashboardNavigation
          title="AI Cover Letter Generator"
          description="Generate personalized cover letters tailored to specific job applications"
        />

        <div className="mt-6">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            {!generationComplete ? (
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Generate Your Cover Letter</h2>
                  <div className="inline-flex rounded-lg border border-slate-700 p-1 bg-slate-800/50">
                    <button
                      onClick={() => setActiveTab('text')}
                      className={`px-4 py-2 text-sm font-medium rounded-md ${
                        activeTab === 'text'
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <FileText className="inline w-4 h-4 mr-2 -mt-1" />
                      Paste Text
                    </button>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className={`px-4 py-2 text-sm font-medium rounded-md ${
                        activeTab === 'upload'
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Upload className="inline w-4 h-4 mr-2 -mt-0.5" />
                      Upload Resume
                    </button>
                  </div>
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Job Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Google"
                    />
                  </div>
                </div>

                {/* Job Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full h-32 p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Paste the job description here..."
                    required
                  />
                </div>

                {/* Resume Input */}
                {activeTab === 'text' ? (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Your Resume Content *
                    </label>
                    <textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      className="w-full h-64 p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Paste your resume content here..."
                      required
                    />
                  </div>
                ) : (
                  <div className="mb-6 border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                    <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                    <h3 className="text-lg font-medium text-white mb-1">Upload your resume</h3>
                    <p className="text-slate-400 text-sm mb-4">Supported formats: PDF, DOCX, TXT (Max 5MB)</p>
                    <label className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleFileChange}
                      />
                      <span>Choose File</span>
                    </label>
                    {file && (
                      <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700 inline-flex items-center">
                        <FileText className="w-5 h-5 text-blue-400 mr-2" />
                        <span className="text-sm text-slate-300">{file.name}</span>
                        <button
                          onClick={() => setFile(null)}
                          className="ml-3 text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-red-400 font-medium mb-1">Generation Failed</h4>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={generateCoverLetter}
                  disabled={isGenerating || !jobDescription.trim() || (activeTab === 'text' ? !resumeText.trim() : !file)}
                  className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Cover Letter
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Your AI-Generated Cover Letter</h2>
                    <p className="text-slate-400 text-sm mt-1">Personalized for this job application</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Generated Cover Letter */}
                <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50 mb-6">
                  <div className="prose prose-invert max-w-none">
                    <div
                      className="text-slate-300 leading-relaxed whitespace-pre-wrap"
                      style={{ fontSize: '14px', lineHeight: '1.6' }}
                    >
                      {generatedCoverLetter}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setGenerationComplete(false);
                      setGeneratedCoverLetter('');
                      setError('');
                    }}
                    className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Another
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCoverLetter);
                    }}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Copy Cover Letter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}