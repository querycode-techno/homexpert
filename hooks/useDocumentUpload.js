import { useState } from 'react';
import { toast } from 'sonner';

export const useDocumentUpload = () => {
  const [uploadState, setUploadState] = useState({});

  const uploadDocument = async (file, documentType, subfolder = 'vendor-documents', uploadKey = null) => {
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

    const key = uploadKey || `${documentType}_${Date.now()}`;
    
    return new Promise((resolve) => {
      try {
        // Set loading state
        setUploadState(prev => ({
          ...prev,
          [key]: { loading: true, progress: 0 }
        }));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('subfolder', subfolder);

        // Use XMLHttpRequest for real upload progress tracking
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setUploadState(prev => ({
              ...prev,
              [key]: { 
                ...prev[key],
                loading: true, 
                progress: percentComplete 
              }
            }));
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              
              // Set success state
              setUploadState(prev => ({
                ...prev,
                [key]: { loading: false, success: true, progress: 100, file: result.file }
              }));

              toast.success(`${documentType} uploaded successfully`);
              resolve(result.file);
            } catch (parseError) {
              console.error('Parse error:', parseError);
              setUploadState(prev => ({
                ...prev,
                [key]: { loading: false, error: 'Failed to parse response', progress: 0 }
              }));
              toast.error(`Failed to upload ${documentType}`);
              resolve(null);
            }
          } else {
            let errorMessage = 'Upload failed';
            try {
              const errorData = JSON.parse(xhr.responseText);
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              errorMessage = xhr.statusText || errorMessage;
            }
            
            setUploadState(prev => ({
              ...prev,
              [key]: { loading: false, error: errorMessage, progress: 0 }
            }));
            
            toast.error(`Failed to upload ${documentType}: ${errorMessage}`);
            resolve(null);
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          setUploadState(prev => ({
            ...prev,
            [key]: { loading: false, error: 'Network error', progress: 0 }
          }));
          toast.error(`Failed to upload ${documentType}: Network error`);
          resolve(null);
        });

        // Handle abort
        xhr.addEventListener('abort', () => {
          setUploadState(prev => ({
            ...prev,
            [key]: { loading: false, error: 'Upload cancelled', progress: 0 }
          }));
          resolve(null);
        });

        // Start upload
        xhr.open('POST', '/api/auth/upload/image');
        xhr.send(formData);

      } catch (error) {
        console.error('Upload error:', error);
        
        // Set error state
        setUploadState(prev => ({
          ...prev,
          [key]: { loading: false, error: error.message, progress: 0 }
        }));

        toast.error(`Failed to upload ${documentType}: ${error.message}`);
        resolve(null);
      }
    });
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