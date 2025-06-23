import { useState } from 'react';
import { toast } from 'sonner';

export const useDocumentUpload = () => {
  const [uploadState, setUploadState] = useState({});

  const uploadDocument = async (file, documentType, subfolder = 'vendor-documents') => {
    if (!file) {
      toast.error('Please select a file to upload');
      return null;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload only images (JPG, PNG, WebP) or PDF files');
      return null;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return null;
    }

    const uploadKey = `${documentType}_${Date.now()}`;
    
    try {
      // Set loading state
      setUploadState(prev => ({
        ...prev,
        [uploadKey]: { loading: true, progress: 0 }
      }));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('subfolder', subfolder);

      const response = await fetch('/api/auth/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Set success state
      setUploadState(prev => ({
        ...prev,
        [uploadKey]: { loading: false, success: true, file: result.file }
      }));

      toast.success(`${documentType} uploaded successfully`);
      return result.file;

    } catch (error) {
      console.error('Upload error:', error);
      
      // Set error state
      setUploadState(prev => ({
        ...prev,
        [uploadKey]: { loading: false, error: error.message }
      }));

      toast.error(`Failed to upload ${documentType}: ${error.message}`);
      return null;
    }
  };

  const deleteDocument = async (publicUrl, documentType) => {
    try {
      const response = await fetch(`/api/auth/upload/image?url=${encodeURIComponent(publicUrl)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      toast.success(`${documentType} deleted successfully`);
      return true;

    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete ${documentType}: ${error.message}`);
      return false;
    }
  };

  const clearUploadState = (uploadKey) => {
    setUploadState(prev => {
      const newState = { ...prev };
      delete newState[uploadKey];
      return newState;
    });
  };

  return {
    uploadDocument,
    deleteDocument,
    uploadState,
    clearUploadState
  };
}; 