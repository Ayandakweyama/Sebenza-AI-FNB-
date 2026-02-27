'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Download, Trash2, Eye, Plus, Edit, Star } from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';

interface Document {
  id: string;
  name: string;
  type: 'resume' | 'cover_letter' | 'portfolio' | 'certificate';
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  isPrimary: boolean;
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ResumeDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [uploadType, setUploadType] = useState<string>('resume');
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/profile/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        console.error('Failed to fetch documents:', response.status);
        // Could add user notification here
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Could add user notification here
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', uploadType);
    formData.append('description', '');

    try {
      const response = await fetch('/api/profile/documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(prev => [data.document, ...prev]);
        setUploadMessage('Document uploaded successfully!');
      } else {
        const err = await response.json();
        setUploadMessage(err.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadMessage('Error uploading document');
    } finally {
      setUploading(false);
      // Reset the file input
      event.target.value = '';
      setTimeout(() => setUploadMessage(''), 4000);
    }
  };

  const setPrimaryDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/profile/documents/${documentId}`, {
        method: 'PUT',
      });

      if (response.ok) {
        setDocuments(prev => 
          prev.map(doc => ({
            ...doc,
            isPrimary: doc.id === documentId
          }))
        );
      } else {
        console.error('Failed to set primary document:', response.status);
        alert('Failed to set document as primary. Please try again.');
      }
    } catch (error) {
      console.error('Error setting primary document:', error);
      alert('Error setting primary document. Please try again.');
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/profile/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } else {
        console.error('Failed to delete document:', response.status);
        alert('Failed to delete document. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document. Please try again.');
    }
  };

  const downloadDocument = (doc: Document) => {
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'resume': return '📄';
      case 'cover_letter': return '📝';
      case 'portfolio': return '🎨';
      case 'certificate': return '🏆';
      default: return '📁';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'resume': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'cover_letter': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'portfolio': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'certificate': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const filteredDocuments = selectedType === 'all' 
    ? documents 
    : documents.filter(doc => doc.type === selectedType);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-6 sm:pb-8 lg:pb-12">
        <DashboardNavigation 
          title="Resume & Documents"
          description="Upload and manage your resumes, cover letters, and other career documents"
        />

        {/* Upload Section */}
        <div className="mb-8">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Upload New Document</h2>

            {/* Document type selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Document Type</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full sm:w-64 px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="resume">Resume / CV</option>
                <option value="cover_letter">Cover Letter</option>
                <option value="portfolio">Portfolio</option>
                <option value="certificate">Certificate</option>
              </select>
            </div>

            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-500/50 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-white font-medium mb-2">
                  {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-slate-400 text-sm">
                  PDF, DOC, or DOCX files up to 10MB
                </p>
              </label>
            </div>

            {uploadMessage && (
              <p className={`mt-3 text-sm font-medium ${uploadMessage.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
                {uploadMessage}
              </p>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Documents' },
              { key: 'resume', label: 'Resumes' },
              { key: 'cover_letter', label: 'Cover Letters' },
              { key: 'portfolio', label: 'Portfolio' },
              { key: 'certificate', label: 'Certificates' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedType(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No documents found</h3>
            <p className="text-slate-400 mb-6">
              {selectedType === 'all' 
                ? 'Upload your first document to get started'
                : `No ${selectedType.replace('_', ' ')} documents found`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
              >
                {/* Document Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getTypeIcon(document.type)}</div>
                    <div>
                      <h3 className="font-semibold text-white truncate">{document.name}</h3>
                      <div className={`inline-flex items-center px-2 py-1 rounded text-xs border ${getTypeColor(document.type)}`}>
                        {document.type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  {document.isPrimary && (
                    <Star className="w-5 h-5 text-amber-400 fill-current" />
                  )}
                </div>

                {/* Document Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Size:</span>
                    <span className="text-white">{formatFileSize(document.fileSize)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Uploaded:</span>
                    <span className="text-white">
                      {new Date(document.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {document.description && (
                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                    {document.description}
                  </p>
                )}

                {/* Tags */}
                {document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {document.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(document.fileUrl, '_blank')}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  
                  <button
                    onClick={() => downloadDocument(document)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  
                  <button
                    onClick={() => setPrimaryDocument(document.id)}
                    disabled={document.isPrimary}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      document.isPrimary
                        ? 'bg-amber-600/20 text-amber-300 cursor-not-allowed'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                    title={document.isPrimary ? 'Primary document' : 'Set as primary'}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => deleteDocument(document.id)}
                    className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
