'use client';

import { useState } from 'react';
import { parsePdf } from '@/utils/pdfParser';

export default function PdfUploader() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setIsLoading(true);
    setError('');
    setText('');

    try {
      const extractedText = await parsePdf(file);
      setText(extractedText);
    } catch (err) {
      console.error('Error processing PDF:', err);
      setError('Failed to process PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          id="pdf-upload"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        <label
          htmlFor="pdf-upload"
          className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Processing...' : 'Upload PDF'}
        </label>
        <p className="mt-2 text-sm text-gray-500">
          {isLoading ? 'Extracting text...' : 'or drag and drop PDF here'}
        </p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {text && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Extracted Text:</h3>
          <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans text-sm">{text}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
