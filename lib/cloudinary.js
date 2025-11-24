import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dh4njmebp',
  api_key: process.env.CLOUDINARY_API_KEY || '458448514385394',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'vfcZDShtw_c1hqgW1CQXdi7lmus',
});

/**
 * Upload file to Cloudinary
 * @param {Buffer|string|File} file - File buffer, file path, or File object
 * @param {string} folder - Folder path in Cloudinary (optional)
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} - Upload result with secure_url and public_id
 */
export async function uploadToCloudinary(file, folder = 'uploads', options = {}) {
  try {
    let uploadOptions = {
      folder: folder,
      resource_type: options.resource_type || 'auto', // auto-detect image, video, or raw
      ...options,
    };

    // If file is a Buffer, use upload_stream for better performance
    if (Buffer.isBuffer(file)) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(new Error(`Failed to upload to Cloudinary: ${error.message}`));
            } else {
              resolve({
                success: true,
                public_id: result.public_id,
                secure_url: result.secure_url,
                url: result.url,
                format: result.format,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                created_at: result.created_at,
              });
            }
          }
        );
        uploadStream.end(file);
      });
    } else {
      // For file paths or data URIs
      const result = await cloudinary.uploader.upload(file, uploadOptions);
      return {
        success: true,
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        created_at: result.created_at,
      };
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file (or URL)
 * @param {Object} options - Delete options
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteFromCloudinary(publicId, options = {}) {
  try {
    // Extract public_id from URL if full URL is provided
    let idToDelete = publicId;
    if (publicId.includes('cloudinary.com')) {
      // Extract public_id from Cloudinary URL
      const urlParts = publicId.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
        // Get the path after version number
        const pathParts = urlParts.slice(uploadIndex + 2);
        idToDelete = pathParts.join('/').replace(/\.[^/.]+$/, ''); // Remove extension
      }
    }

    const result = await cloudinary.uploader.destroy(idToDelete, options);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Get Cloudinary URL from public_id
 * @param {string} publicId - Public ID
 * @param {Object} options - Transformation options
 * @returns {string} - Cloudinary URL
 */
export function getCloudinaryUrl(publicId, options = {}) {
  return cloudinary.url(publicId, {
    secure: true,
    ...options,
  });
}

export default cloudinary;

