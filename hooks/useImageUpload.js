import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for handling image uploads
 * @param {Object} options - Configuration options
 * @returns {Object} - Upload functions and state
 */
export function useImageUpload({ 
  subfolder = 'uploads',
  onUploadSuccess,
  onUploadError,
  maxSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
} = {}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @returns {Object} - Validation result
   */
  const validateFile = (file) => {
    const errors = [];

    if (!file) {
      errors.push('No file selected');
      return { isValid: false, errors };
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      errors.push(`File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  /**
   * Upload single image file
   * @param {File} file - File to upload
   * @returns {Promise<Object>} - Upload result
   */
  const uploadImage = async (file) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        const errorMessage = validation.errors.join(', ');
        toast.error(errorMessage);
        if (onUploadError) onUploadError(validation.errors);
        return { success: false, errors: validation.errors };
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subfolder', subfolder);

      // Simulate progress (since fetch doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Upload file
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      toast.success('Image uploaded successfully');
      if (onUploadSuccess) onUploadSuccess(result.file);

      return {
        success: true,
        file: result.file
      };

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
      if (onUploadError) onUploadError([error.message]);
      return {
        success: false,
        errors: [error.message]
      };
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  /**
   * Upload single image without triggering callbacks (for internal use in multiple upload)
   * @param {File} file - File to upload
   * @returns {Promise<Object>} - Upload result
   */
  const uploadImageSilent = async (file) => {
    try {
      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subfolder', subfolder);

      // Upload file
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      return {
        success: true,
        file: result.file
      };

    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      };
    }
  };

  /**
   * Upload multiple images
   * @param {FileList|Array} files - Files to upload
   * @returns {Promise<Object>} - Upload results
   */
  const uploadMultipleImages = async (files) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const fileArray = Array.from(files);
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const result = await uploadImageSilent(file);
        
        results.push(result);
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }

        // Update progress
        setUploadProgress(((i + 1) / fileArray.length) * 100);
      }

      const summary = `Uploaded ${successCount} of ${fileArray.length} images`;
      if (errorCount > 0) {
        toast.warning(`${summary}. ${errorCount} failed.`);
      } else {
        toast.success(summary);
      }

      return {
        results,
        successCount,
        errorCount,
        total: fileArray.length
      };

    } catch (error) {
      console.error('Multiple upload error:', error);
      toast.error('Failed to upload images');
      if (onUploadError) onUploadError([error.message]);
      return {
        results: [],
        successCount: 0,
        errorCount: files.length,
        total: files.length
      };
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  /**
   * Delete uploaded image
   * @param {string} publicUrl - Public URL of image to delete
   * @returns {Promise<boolean>} - Success status
   */
  const deleteImage = async (publicUrl) => {
    try {
      const response = await fetch(`/api/upload/image?url=${encodeURIComponent(publicUrl)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Delete failed');
      }

      toast.success('Image deleted successfully');
      return true;

    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete image');
      return false;
    }
  };

  /**
   * Handle file input change
   * @param {Event} event - File input change event
   * @param {boolean} multiple - Whether to handle multiple files
   */
  const handleFileChange = async (event, multiple = false) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (multiple) {
      return await uploadMultipleImages(files);
    } else {
      return await uploadImage(files[0]);
    }
  };

  /**
   * Handle drag and drop
   * @param {DragEvent} event - Drop event
   * @param {boolean} multiple - Whether to handle multiple files
   */
  const handleDrop = async (event, multiple = false) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    
    if (!files || files.length === 0) return;

    if (multiple) {
      return await uploadMultipleImages(files);
    } else {
      return await uploadImage(files[0]);
    }
  };

  return {
    // State
    uploading,
    uploadProgress,

    // Functions
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    handleFileChange,
    handleDrop,
    validateFile,

    // Configuration
    maxSize,
    allowedTypes,
    subfolder
  };
} 