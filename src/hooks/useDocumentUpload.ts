import { useState, useCallback } from 'react';

interface UploadProgress {
  status: 'idle' | 'getting-url' | 'uploading' | 'saving' | 'done' | 'error';
  progress: number; // 0-100
  error?: string;
}

interface DocumentMetadata {
  id: string;
  name: string;
  type: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  isPrimary: boolean;
  createdAt: string;
}

interface UseDocumentUploadReturn {
  upload: (file: File, documentType: string, isPrimary?: boolean) => Promise<DocumentMetadata | null>;
  download: (documentId: string) => Promise<void>;
  remove: (documentId: string) => Promise<boolean>;
  uploadState: UploadProgress;
  reset: () => void;
}

/**
 * Hook for uploading, downloading, and deleting documents via S3 presigned URLs.
 *
 * Upload flow:
 *   1. Call /api/documents/upload-url to get a presigned S3 URL
 *   2. PUT the file directly to S3 (browser → S3, bypasses server)
 *   3. POST metadata to /api/documents to save the DB record
 */
export function useDocumentUpload(): UseDocumentUploadReturn {
  const [uploadState, setUploadState] = useState<UploadProgress>({
    status: 'idle',
    progress: 0,
  });

  const reset = useCallback(() => {
    setUploadState({ status: 'idle', progress: 0 });
  }, []);

  const upload = useCallback(
    async (file: File, documentType: string, isPrimary = false): Promise<DocumentMetadata | null> => {
      try {
        // Step 1: Get presigned upload URL
        setUploadState({ status: 'getting-url', progress: 10 });

        const urlResponse = await fetch('/api/documents/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            documentType,
          }),
        });

        if (!urlResponse.ok) {
          const err = await urlResponse.json();
          throw new Error(err.error || 'Failed to get upload URL');
        }

        const { uploadUrl, s3Key } = await urlResponse.json();

        // Step 2: Upload file directly to S3
        setUploadState({ status: 'uploading', progress: 40 });

        const s3Response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!s3Response.ok) {
          throw new Error('Failed to upload file to storage');
        }

        // Step 3: Save document metadata to database
        setUploadState({ status: 'saving', progress: 80 });

        const docResponse = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name.replace(/\.[^/.]+$/, ''),
            type: documentType,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            fileUrl: s3Key,
            isPrimary,
          }),
        });

        if (!docResponse.ok) {
          const err = await docResponse.json();
          throw new Error(err.error || 'Failed to save document');
        }

        const document: DocumentMetadata = await docResponse.json();

        setUploadState({ status: 'done', progress: 100 });
        return document;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        setUploadState({ status: 'error', progress: 0, error: message });
        console.error('Document upload error:', error);
        return null;
      }
    },
    []
  );

  const download = useCallback(async (documentId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/documents/download/${documentId}`);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to get download URL');
      }

      const { downloadUrl } = await response.json();
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Document download error:', error);
    }
  }, []);

  const remove = useCallback(async (documentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete document');
      }

      return true;
    } catch (error) {
      console.error('Document delete error:', error);
      return false;
    }
  }, []);

  return { upload, download, remove, uploadState, reset };
}
