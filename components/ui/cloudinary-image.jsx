"use client";

import { CldImage } from 'next-cloudinary';

/**
 * Cloudinary Image Component
 * Optimized image component using Cloudinary CDN
 * 
 * @param {string} src - Cloudinary public_id or full URL
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} alt - Alt text
 * @param {Object} crop - Crop options
 * @param {Object} className - Additional CSS classes
 * @param {Object} ...props - Other CldImage props
 */
export function CloudinaryImage({ 
  src, 
  width, 
  height, 
  alt = '', 
  crop,
  className = '',
  ...props 
}) {
  // Extract public_id from URL if full URL is provided
  let publicId = src;
  if (src && src.includes('cloudinary.com')) {
    // Extract public_id from Cloudinary URL
    const urlParts = src.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
      // Get the path after version number
      const pathParts = urlParts.slice(uploadIndex + 2);
      publicId = pathParts.join('/').replace(/\.[^/.]+$/, ''); // Remove extension
    }
  }

  // If it's not a Cloudinary URL, use regular img tag
  if (!src || (!src.includes('cloudinary.com') && !src.startsWith('/'))) {
    return (
      <img 
        src={src} 
        alt={alt} 
        width={width} 
        height={height}
        className={className}
        {...props}
      />
    );
  }

  return (
    <CldImage
      src={publicId}
      width={width}
      height={height}
      alt={alt}
      crop={crop || { type: 'auto', source: true }}
      className={className}
      {...props}
    />
  );
}

export default CloudinaryImage;

