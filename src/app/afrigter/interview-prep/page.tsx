'use client';

import { useState } from 'react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';

export default function InterviewPrepPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <DashboardNavigation 
          title="Interview Preparation"
          description="Prepare for your next job interview with AI-powered practice sessions"
        />
        
        <div className="mt-6">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
            <p className="mb-6 text-slate-300">Practice common interview questions and get AI-powered feedback on your responses.</p>
        
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3 text-white">Select Interview Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setSelectedType('technical')}
                    className={`p-4 rounded-lg text-left transition-all ${selectedType === 'technical' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                  >
                    <h3 className="font-medium text-white">Technical Interview</h3>
                    <p className="text-sm text-slate-300 mt-1">For software development and engineering roles</p>
                  </button>
                  <button 
                    onClick={() => setSelectedType('behavioral')}
                    className={`p-4 rounded-lg text-left transition-all ${selectedType === 'behavioral' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                  >
                    <h3 className="font-medium text-white">Behavioral Interview</h3>
                    <p className="text-sm text-slate-300 mt-1">Common HR and situational questions</p>
                  </button>
                  <button 
                    onClick={() => setSelectedType('management')}
                    className={`p-4 rounded-lg text-left transition-all ${selectedType === 'management' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                  >
                    <h3 className="font-medium text-white">Management Interview</h3>
                    <p className="text-sm text-slate-300 mt-1">For leadership and management positions</p>
                  </button>
                  <button 
                    onClick={() => setSelectedType('custom')}
                    className={`p-4 rounded-lg text-left transition-all ${selectedType === 'custom' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                  >
                    <h3 className="font-medium text-white">Custom Interview</h3>
                    <p className="text-sm text-slate-300 mt-1">Create your own set of questions</p>
                  </button>
                </div>
              </div>
              
              {selectedType && (
                <div className="mt-8 p-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    {selectedType === 'technical' && 'Technical Interview Setup'}
                    {selectedType === 'behavioral' && 'Behavioral Interview Setup'}
                    {selectedType === 'management' && 'Management Interview Setup'}
                    {selectedType === 'custom' && 'Custom Interview Setup'}
                  </h3>
                  <p className="text-slate-300 mb-4">
                    {selectedType === 'technical' && 'Select the technologies and topics you want to be interviewed on.'}
                    {selectedType === 'behavioral' && 'Choose the types of behavioral questions you want to practice.'}
                    {selectedType === 'management' && 'Select the management areas you want to focus on.'}
                    {selectedType === 'custom' && 'Enter your own questions or topics for the interview.'}
                  </p>
                  <button 
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                    onClick={() => console.log('Start interview:', selectedType)}
                  >
                    Start Practice Interview
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
