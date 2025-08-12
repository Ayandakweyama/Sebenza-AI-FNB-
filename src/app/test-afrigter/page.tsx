'use client';

import { useState } from 'react';
import { useAfrigter } from '@/hooks/useAfrigter';

type ServiceType = 
  | 'resume-tips' 
  | 'interview-prep' 
  | 'job-search' 
  | 'career-advice' 
  | 'career-roadmap' 
  | 'skill-gap';

const testData = {
  'resume-tips': {
    resumeText: 'Experienced software developer with 5+ years of experience in web development...',
    jobDescription: 'We are looking for a senior full-stack developer with experience in React, Node.js, and cloud technologies...',
    experienceLevel: 'senior'
  },
  'interview-prep': {
    role: 'Senior Frontend Developer',
    experienceLevel: 'senior',
    industry: 'Fintech'
  },
  'job-search': {
    role: 'Software Engineer',
    field: 'Web Development',
    locations: ['Johannesburg', 'Cape Town', 'Remote'],
    experienceLevel: 'mid-level'
  },
  'career-advice': {
    question: 'How can I transition from a backend developer to a full-stack role?',
    experienceLevel: 'mid-level',
    context: 'I have 3 years of experience with Java and Spring Boot, and basic knowledge of React.'
  },
  'career-roadmap': {
    currentRole: 'Junior Developer',
    targetRole: 'Senior Full-Stack Developer',
    experienceLevel: 'junior',
    timeline: '24',
    interests: ['Web Development', 'Cloud Computing']
  },
  'skill-gap': {
    currentSkills: ['JavaScript', 'HTML', 'CSS', 'React', 'Node.js'],
    targetRole: 'Senior Full-Stack Developer',
    experienceLevel: 'mid-level',
    industry: 'E-commerce'
  }
};

export default function TestAfrigter() {
  const [activeTab, setActiveTab] = useState<ServiceType>('resume-tips');
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const {
    callAfrigter,
    provideResumeTips,
    conductInterviewPrep,
    searchJobs,
    provideCareerAdvice,
    generateCareerRoadmap,
    analyzeSkillGap,
    loading,
    error: apiError
  } = useAfrigter();

  const testEndpoint = async () => {
    setError(null);
    setResponse(null);

    try {
      console.log(`Testing ${activeTab} with data:`, testData[activeTab]);
      
      let result;
      
      switch (activeTab) {
        case 'resume-tips':
          result = await provideResumeTips(testData['resume-tips']);
          break;
        case 'interview-prep':
          result = await conductInterviewPrep(testData['interview-prep']);
          break;
        case 'job-search':
          result = await searchJobs(testData['job-search']);
          break;
        case 'career-advice':
          result = await provideCareerAdvice(testData['career-advice']);
          break;
        case 'career-roadmap':
          result = await generateCareerRoadmap(testData['career-roadmap']);
          break;
        case 'skill-gap':
          result = await analyzeSkillGap(testData['skill-gap']);
          break;
        default:
          throw new Error(`Unsupported service type: ${activeTab}`);
      }
      
      console.log('API Response:', result);
      setResponse({ response: result });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Test failed:', errorMessage, err);
      setError(errorMessage);
    }
  };

  const renderTabContent = () => {
    const data = testData[activeTab];
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
        <h3 className="font-semibold mb-2">Test Data:</h3>
        <pre className="text-sm bg-white p-3 rounded border border-gray-200 overflow-auto max-h-60">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Afrigter Service Tester</h1>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.keys(testData).map((service) => (
            <button
              key={service}
              onClick={() => setActiveTab(service as ServiceType)}
              className={`px-4 py-2 rounded-md ${
                activeTab === service
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {service.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            {activeTab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Test
          </h2>
          {renderTabContent()}
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={testEndpoint}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">↻</span> Testing...
              </>
            ) : (
              `Test ${activeTab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`
            )}
          </button>
          
          <button
            onClick={() => {
              setResponse(null);
              setError(null);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Clear Results
          </button>
        </div>
      </div>

      {(error || apiError) && (
        <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error occurred</h3>
              <div className="mt-2 text-sm text-red-700">
                <pre className="whitespace-pre-wrap">{error || apiError}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {response && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Response</h3>
            <button
              onClick={() => {
                const text = JSON.stringify(response, null, 2);
                navigator.clipboard.writeText(text);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Copy to Clipboard
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto max-h-96">
            <pre className="text-sm">
              {typeof response.response === 'string' 
                ? response.response 
                : JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Testing Tips</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Check the browser console for detailed request/response logs (Press F12 and go to Console tab)</li>
                <li>Each tab represents a different Afrigter service you can test</li>
                <li>Click "Copy to Clipboard" to save the response for later review</li>
                <li>If you encounter errors, check the network tab for detailed request/response information</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
