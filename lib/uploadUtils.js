import { join } from 'path';
import { existsSync } from 'fs';
import { uploadToCloudinary, deleteFromCloudinary } from './cloudinary';

// Allowed file types (images and PDFs for documents)
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Use Cloudinary by default (has fallback defaults in cloudinary.js), fallback to local storage if explicitly disabled
const USE_CLOUDINARY = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dh4njmebp';

/**
 * Generate a unique filename with timestamp
 * @param {string} originalName - Original filename
 * @returns {string} - Unique filename
 */
export function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${random}.${extension}`;
}

/**
 * Validate uploaded file (images and PDFs)
 * @param {File} file - File object
 * @returns {Object} - Validation result
 */
export function validateImageFile(file) {
  const errors = [];

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    errors.push(`Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`);
  }

  // Check file size
  if (file.size > MAX_SIZE) {
    errors.push(`File size too large. Maximum size: ${MAX_SIZE / 1024 / 1024}MB`);
  }

  // Check if file exists
  if (!file || file.size === 0) {
    errors.push('No file provided or file is empty');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Process and save uploaded file (image or PDF)
 * @param {File} file - File object from form data
 * @param {string} subfolder - Subfolder to save in (default: 'uploads')
 * @returns {Promise<Object>} - Upload result
 */
export async function processImageUpload(file, subfolder = 'uploads') {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Always try Cloudinary first (has default credentials), fallback to local storage if it fails
    try {
      // Determine resource type based on file type
      const resourceType = file.type === 'application/pdf' ? 'raw' : 'image';
      
      // Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(buffer, subfolder, {
        resource_type: resourceType,
        filename_override: generateUniqueFilename(file.name).replace(/\.[^/.]+$/, ''), // Remove extension for Cloudinary
        use_filename: false,
        unique_filename: true,
      });

      console.log('✅ Cloudinary upload successful:', cloudinaryResult.secure_url);
      
      return {
        success: true,
        filename: cloudinaryResult.public_id.split('/').pop(),
        publicUrl: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        originalName: file.name,
        size: cloudinaryResult.bytes || file.size,
        type: file.type,
        format: cloudinaryResult.format,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
      };
    } catch (cloudinaryError) {
      console.error('❌ Cloudinary upload failed:', cloudinaryError.message);
      console.error('Error details:', cloudinaryError);
      // Return error - no fallback to local storage
      return {
        success: false,
        errors: [`Cloudinary upload failed: ${cloudinaryError.message}`]
      };
    }
  } catch (error) {
    console.error('Error processing image upload:', error);
    return {
      success: false,
      errors: ['Failed to process file upload']
    };
  }
}

/**
 * Delete file from public directory or Cloudinary
 * @param {string} publicUrl - Public URL of the file to delete (Cloudinary URL or local path)
 * @param {string} publicId - Optional Cloudinary public_id (if available)
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteFileFromPublic(publicUrl, publicId = null) {
  try {
    // Check if it's a Cloudinary URL
    if (USE_CLOUDINARY && (publicUrl.includes('cloudinary.com') || publicId)) {
      const idToDelete = publicId || publicUrl;
      const deleted = await deleteFromCloudinary(idToDelete);
      if (deleted) {
        return true;
      }
      // If Cloudinary delete fails, try local fallback
    }

    // If it's not a Cloudinary URL, it might be an old local file
    // Try to delete from local storage if it exists
    if (publicUrl && publicUrl.startsWith('/') && !publicUrl.includes('cloudinary.com')) {
      try {
        const { unlink } = await import('fs/promises');
        const filePath = join(process.cwd(), 'public', publicUrl);
        
        if (existsSync(filePath)) {
          await unlink(filePath);
          return true;
        }
      } catch (error) {
        console.error('Error deleting local file:', error);
      }
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Get file info from public URL
 * @param {string} publicUrl - Public URL
 * @returns {Object} - File info
 */
export function getFileInfo(publicUrl) {
  const filename = publicUrl.split('/').pop();
  const extension = filename.split('.').pop();
  const nameWithoutExt = filename.replace(`.${extension}`, '');
  
  return {
    filename,
    extension,
    nameWithoutExt,
    publicUrl
  };
} 