import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Allowed file types (images and PDFs for documents)
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

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
 * Save file to public directory
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Filename to save
 * @param {string} subfolder - Subfolder in public directory (optional)
 * @returns {Promise<string>} - Public URL of saved file
 */
export async function saveFileToPublic(buffer, filename, subfolder = 'uploads') {
  try {
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', subfolder);
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Return public URL
    return `/${subfolder}/${filename}`;
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Failed to save file');
  }
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

    // Generate unique filename
    const filename = generateUniqueFilename(file.name);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file
    const publicUrl = await saveFileToPublic(buffer, filename, subfolder);

    return {
      success: true,
      filename,
      publicUrl,
      originalName: file.name,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('Error processing image upload:', error);
    return {
      success: false,
      errors: ['Failed to process file upload']
    };
  }
}

/**
 * Delete file from public directory
 * @param {string} publicUrl - Public URL of the file to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteFileFromPublic(publicUrl) {
  try {
    const { unlink } = await import('fs/promises');
    const filePath = join(process.cwd(), 'public', publicUrl);
    
    if (existsSync(filePath)) {
      await unlink(filePath);
      return true;
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