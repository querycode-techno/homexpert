import crypto from 'crypto'
import { MediaUpload } from '@/lib/models/customerPlatform'
import { E } from '@/lib/platform/errors'
import { oid } from './catalog'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
const MAX_BYTES = 25 * 1024 * 1024
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4' }
const bucketName = () => process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

async function bucket() {
  const { default: admin } = await import('@/lib/firebase/admin')
  return admin.storage().bucket(bucketName())
}

/** Presigned direct-to-storage upload. Bytes never pass through this server. */
export async function createUpload(ownerId, { purpose, contentType, sizeBytes }) {
  if (!ALLOWED.includes(contentType)) {
    throw E.validation([{ field: 'contentType', message: 'This file type is not supported.' }])
  }
  if (sizeBytes > MAX_BYTES) {
    throw E.validation([{ field: 'sizeBytes', message: 'This file is too large (25 MB max).' }])
  }
  const objectKey = `customer/${ownerId}/${purpose}/${crypto.randomUUID()}.${EXT[contentType]}`
  const expires = Date.now() + 15 * 60_000
  const doc = await MediaUpload.create({ ownerId, purpose, contentType, sizeBytes, objectKey, expiresAt: new Date(expires) })
  const [url] = await (await bucket()).file(objectKey).getSignedUrl({ version: 'v4', action: 'write', expires, contentType })
  return { uploadId: String(doc._id), url, method: 'PUT', headers: { 'Content-Type': contentType }, expiresAt: new Date(expires).toISOString() }
}

/** Short-lived read URL for a stored object (avatars are re-signed on every profile read). */
export async function signedReadUrl(objectKey, hours = 12) {
  const [url] = await (await bucket()).file(objectKey).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + hours * 3600_000 })
  return url
}

/**
 * Turn upload ids the client sends into verified files: must belong to the customer, match the purpose, and actually exist
 * in storage. Returns public read URLs.
 */
export async function consumeUploads(ownerId, purpose, ids) {
  if (!ids?.length) {
    return []
  }
  const docs = await MediaUpload.find({ _id: { $in: ids.map((i) => oid(i, 'upload')) }, ownerId, purpose })
  if (docs.length !== ids.length) {
    throw E.validation([{ field: 'uploadIds', message: 'One of the attachments is invalid. Please upload it again.' }])
  }
  const b = await bucket()
  const out = []
  for (const d of docs) {
    const [exists] = await b.file(d.objectKey).exists()
    if (!exists) {
      throw E.validation([{ field: 'uploadIds', message: 'An attachment did not finish uploading. Please try again.' }])
    }
    d.status = 'ready'
    await d.save()
    const [url] = await b.file(d.objectKey).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + 7 * 86400_000 })
    out.push({ id: d._id, objectKey: d.objectKey, contentType: d.contentType, sizeBytes: d.sizeBytes, url })
  }
  return out
}
