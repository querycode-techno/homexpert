# Cloudinary CDN Setup

This project uses Cloudinary for image and document uploads. Cloudinary provides optimized image delivery, transformations, and CDN distribution.

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dh4njmebp
CLOUDINARY_API_KEY=458448514385394
CLOUDINARY_API_SECRET=vfcZDShtw_c1hqgW1CQXdi7lmus

# Optional: For client-side components
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dh4njmebp
```

## Features

- ✅ Automatic image optimization
- ✅ CDN delivery for fast loading
- ✅ Image transformations (resize, crop, format conversion)
- ✅ Fallback to local storage if Cloudinary is not configured
- ✅ Support for images and PDF documents
- ✅ Secure file deletion

## Usage

### Server-Side Upload

The upload utilities automatically use Cloudinary when environment variables are set:

```javascript
import { processImageUpload } from '@/lib/uploadUtils';

const result = await processImageUpload(file, 'uploads');
// Returns: { success: true, publicUrl: 'https://res.cloudinary.com/...', ... }
```

### Client-Side Image Display

Use the `CloudinaryImage` component for optimized images:

```jsx
import { CloudinaryImage } from '@/components/ui/cloudinary-image';

<CloudinaryImage
  src="uploads/your-image-id"
  width={500}
  height={500}
  alt="Description"
  crop={{ type: 'auto', source: true }}
/>
```

Or use `CldImage` directly from `next-cloudinary`:

```jsx
import { CldImage } from 'next-cloudinary';

<CldImage
  src="uploads/your-image-id"
  width="500"
  height="500"
  crop={{ type: 'auto', source: true }}
/>
```

## API Endpoints

### Upload Image
- **POST** `/api/auth/upload/image`
- Requires admin authentication
- Returns: `{ file: { publicUrl, cloudinaryPublicId, ... } }`

### Delete Image
- **DELETE** `/api/auth/upload/image?url=<url>&publicId=<id>`
- Requires admin authentication

### Upload Vendor Document
- **POST** `/api/vendors/documents/upload`
- Requires vendor authentication
- Automatically uses Cloudinary

## File Structure

- `lib/cloudinary.js` - Cloudinary configuration and utilities
- `lib/uploadUtils.js` - Upload utilities with Cloudinary support
- `components/ui/cloudinary-image.jsx` - Optimized image component

## Migration Notes

- Existing local files will continue to work (fallback mode)
- New uploads will use Cloudinary when configured
- Cloudinary URLs are stored in the database
- The system automatically detects Cloudinary URLs for deletion

