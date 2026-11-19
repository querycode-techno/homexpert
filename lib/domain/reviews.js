import { Review, ReviewVote, ServiceRequest } from '@/lib/models/booking'
import { Service } from '@/lib/models/catalogue'
import { Customer } from '@/lib/models/customerAccount'
import { E } from '@/lib/platform/errors'
import { oid } from './catalog'
import { loadOwned, statusOf } from './booking'
import { consumeUploads } from './media'

const REVIEW_WINDOW_DAYS = 30
const toDto = (r, voted = new Set()) => ({ id: String(r._id), rating: r.rating, tags: r.tags, text: r.text, authorName: r.authorName, createdAt: r.createdAt, verifiedBooking: true, helpfulCount: r.helpfulCount || 0, markedHelpful: voted.has(String(r._id)) })

export async function listServiceReviews(serviceId, { cursor, limit = 20 }, customerId) {
  const filter = { serviceId: oid(serviceId, 'service'), status: 'published' }
  if (cursor) {
    filter._id = { $lt: oid(cursor, 'cursor') }
  }
  const rows = await Review.find(filter).sort({ _id: -1 }).limit(limit + 1).lean()
  const page = rows.slice(0, limit)
  const mine = customerId ? await ReviewVote.find({ customerId, reviewId: { $in: page.map((r) => r._id) } }).select('reviewId').lean() : []
  const voted = new Set(mine.map((v) => String(v.reviewId)))
  let summary
  if (!cursor) {
    const dist = await Review.aggregate([{ $match: { serviceId: oid(serviceId, 'service'), status: 'published' } }, { $group: { _id: '$rating', n: { $sum: 1 } } }])
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    dist.forEach((d) => {
      distribution[d._id] = d.n
    })
    const count = Object.values(distribution).reduce((a, b) => a + b, 0)
    const avg = count ? Object.entries(distribution).reduce((a, [k, v]) => a + Number(k) * v, 0) / count : 0
    summary = { average: Math.round(avg * 10) / 10, count, distribution }
  }
  return { items: page.map((r) => toDto(r, voted)), nextCursor: rows.length > limit ? String(page[page.length - 1]._id) : null, summary }
}

/** One review per completed booking, within the window. Updates the service's rating aggregate atomically. */
export async function submitReview(customerId, bookingId, { rating, tags, text, photoUploadIds }) {
  const { req, lead } = await loadOwned(customerId, bookingId)
  if (statusOf(lead) !== 'completed') {
    throw E.forbidden('You can review a booking once the service is completed.', 'REVIEW_NOT_ALLOWED')
  }
  if (req.reviewId) {
    throw E.conflict('You have already reviewed this booking.', 'ALREADY_REVIEWED')
  }
  const done = lead.completedAt || lead.convertedAt || lead.updatedAt
  if (done && Date.now() - new Date(done).getTime() > REVIEW_WINDOW_DAYS * 86400_000) {
    throw E.forbidden(`The review window (${REVIEW_WINDOW_DAYS} days) has closed for this booking.`, 'REVIEW_WINDOW_CLOSED')
  }
  const files = await consumeUploads(customerId, 'review_photo', photoUploadIds || [])
  const customer = await Customer.findById(customerId).select('name').lean()
  let review
  try {
    review = await Review.create({ requestId: req._id, customerId, serviceId: req.service.id, vendorId: lead.takenBy, rating, tags: tags || [], text, mediaIds: files.map((f) => f.id), authorName: (customer?.name || 'Customer').split(' ')[0] })
  } catch (e) {
    if (e.code === 11000) {
      throw E.conflict('You have already reviewed this booking.', 'ALREADY_REVIEWED')
    }
    throw e
  }
  await ServiceRequest.updateOne({ _id: req._id }, { reviewId: review._id })
  const svc = await Service.findById(req.service.id).select('ratingAvg ratingCount')
  if (svc) {
    const n = svc.ratingCount + 1
    await Service.updateOne({ _id: svc._id }, { ratingCount: n, ratingAvg: Math.round(((svc.ratingAvg * svc.ratingCount + rating) / n) * 10) / 10 })
  }
  return toDto(review)
}

/** One "helpful" vote per customer per review; calling again removes it. */
export async function toggleHelpful(customerId, reviewId) {
  const review = await Review.findOne({ _id: oid(reviewId, 'review'), status: 'published' })
  if (!review) throw E.notFound('That review was not found.')
  if (String(review.customerId) === String(customerId)) throw E.conflict('You cannot mark your own review as helpful.', 'OWN_REVIEW')
  const existing = await ReviewVote.findOneAndDelete({ reviewId: review._id, customerId })
  if (existing) {
    const r = await Review.findByIdAndUpdate(review._id, { $inc: { helpfulCount: -1 } }, { new: true })
    return { helpfulCount: Math.max(0, r.helpfulCount), markedHelpful: false }
  }
  await ReviewVote.create({ reviewId: review._id, customerId })
  const r = await Review.findByIdAndUpdate(review._id, { $inc: { helpfulCount: 1 } }, { new: true })
  return { helpfulCount: r.helpfulCount, markedHelpful: true }
}
