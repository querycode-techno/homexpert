import crypto from 'crypto'
import SupportTicket from '@/lib/models/supportTicket'
import { ServiceRequest } from '@/lib/models/booking'
import { E } from '@/lib/platform/errors'
import { oid } from './catalog'
import { consumeUploads } from './media'
import { notify } from './notifications'
import { AppConfig } from '@/lib/models/customerPlatform'

const TOPICS = [
  { id: 'booking', name: 'My booking', requiresBooking: true },
  { id: 'payment', name: 'Payment', requiresBooking: false },
  { id: 'xpert', name: 'Xpert behaviour', requiresBooking: true },
  { id: 'account', name: 'My account', requiresBooking: false },
  { id: 'other', name: 'Something else', requiresBooking: false },
]
const ISSUE_PRIORITY = { safety: 'urgent', no_show: 'high', damage: 'high', overcharge: 'high', payment: 'high', quality: 'medium', other: 'medium' }
const ISSUE_TITLE = { quality: 'Work quality', no_show: 'Xpert did not arrive', damage: 'Damage', overcharge: 'Overcharged', payment: 'Payment issue', safety: 'Safety concern', other: 'Other issue' }

export async function listTopics() {
  const doc = await AppConfig.findOne({ key: 'support_topics' }).lean()
  return doc?.value?.items?.length ? doc.value.items : TOPICS
}

export async function listFaqs({ q, topicId }) {
  const doc = await AppConfig.findOne({ key: 'faqs' }).lean()
  let items = doc?.value?.items || []
  if (topicId) {
    items = items.filter((f) => f.topicId === topicId)
  }
  if (q) {
    const needle = q.toLowerCase()
    items = items.filter((f) => `${f.question} ${f.answer}`.toLowerCase().includes(needle))
  }
  return items.map((f) => ({ id: f.id, question: f.question, answer: f.answer, topicId: f.topicId }))
}

const STATUS = { open: 'open', in_progress: 'in_progress', waiting_for_vendor: 'in_progress', waiting_for_admin: 'in_progress', waiting_for_customer: 'waiting_for_customer', resolved: 'resolved', closed: 'closed' }

function toDto(t, { withMessages = false } = {}) {
  const visible = (t.messages || []).filter((m) => !m.isInternal && !m.deletedAt)
  const last = visible[visible.length - 1]
  const closed = t.status === 'closed'
  return {
    id: String(t._id),
    displayId: t.ticketId,
    topicName: t.topicName || t.title,
    bookingId: t.bookingId ? String(t.bookingId) : null,
    status: STATUS[t.status] || 'open',
    lastMessagePreview: last?.content?.slice(0, 120),
    unread: (t.unreadCount?.customer || 0) > 0,
    canReply: !closed,
    canClose: !closed,
    canRate: ['resolved', 'closed'].includes(t.status) && !t.satisfaction?.rating,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    ...(withMessages
      ? { messages: visible.map((m) => ({ id: m.messageId, from: m.senderType === 'customer' ? 'customer' : m.senderType === 'system' ? 'system' : 'agent', text: m.content, attachments: (m.attachments || []).map((a) => a.url), createdAt: m.timestamp })) }
      : {}),
  }
}

const owned = async (customerId, id) => {
  const t = await SupportTicket.findOne({ _id: oid(id, 'ticket'), customerId })
  if (!t) {
    throw E.notFound('We could not find that ticket.')
  }
  return t
}

async function attach(customerId, ids) {
  const files = await consumeUploads(customerId, 'ticket_attachment', ids || [])
  return files.map((f) => ({ filename: f.objectKey.split('/').pop(), url: f.url, fileType: f.contentType, fileSize: f.sizeBytes }))
}

export async function createTicket(customerId, { topicId, bookingId, description, attachmentUploadIds }, { title, priority = 'medium', topicName } = {}) {
  const topics = await listTopics()
  const topic = topics.find((t) => t.id === topicId)
  if (!topic && !title) {
    throw E.validation([{ field: 'topicId', message: 'Please choose a topic.' }])
  }
  if (topic?.requiresBooking && !bookingId) {
    throw E.validation([{ field: 'bookingId', message: 'Please choose the booking this is about.' }])
  }
  let booking
  if (bookingId) {
    booking = await ServiceRequest.findOne({ _id: oid(bookingId, 'booking'), customerId }).select('_id displayId')
    if (!booking) {
      throw E.notFound('We could not find that booking.')
    }
  }
  const files = await attach(customerId, attachmentUploadIds)
  const name = topicName || topic?.name || title
  const ticketId = `HXT${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`
  const t = await SupportTicket.create({
    ticketId,
    title: `${name}${booking ? ` · ${booking.displayId}` : ''}`,
    description,
    category: 'customer_support',
    priority,
    customerId,
    createdByType: 'customer',
    bookingId: booking?._id,
    topicName: name,
    source: 'app',
    status: 'open',
    messages: [{ messageId: `MSG${Date.now()}0`, content: description, sender: customerId, senderType: 'customer', attachments: files }],
  })
  if (booking) {
    await ServiceRequest.updateOne({ _id: booking._id }, { $addToSet: { issueTicketIds: t._id } })
  }
  return toDto(t, { withMessages: true })
}

export async function reportIssue(customerId, bookingId, { type, description, attachmentUploadIds }) {
  return createTicket(customerId, { topicId: 'booking', bookingId, description, attachmentUploadIds }, { title: ISSUE_TITLE[type], priority: ISSUE_PRIORITY[type], topicName: ISSUE_TITLE[type] })
}

export async function listTickets(customerId, { cursor, limit = 20 }) {
  const filter = { customerId }
  if (cursor) {
    filter._id = { $lt: oid(cursor, 'cursor') }
  }
  const rows = await SupportTicket.find(filter).sort({ _id: -1 }).limit(limit + 1)
  const page = rows.slice(0, limit)
  return { items: page.map((t) => toDto(t)), nextCursor: rows.length > limit ? String(page[page.length - 1]._id) : null }
}

export async function getTicket(customerId, id) {
  const t = await owned(customerId, id)
  if ((t.unreadCount?.customer || 0) > 0) {
    t.unreadCount.customer = 0
    await t.save()
  }
  return toDto(t, { withMessages: true })
}

export async function postMessage(customerId, id, { text, attachmentUploadIds }) {
  const t = await owned(customerId, id)
  if (t.status === 'closed') {
    throw E.forbidden('This ticket is closed. Please raise a new one.', 'TICKET_CLOSED')
  }
  const files = await attach(customerId, attachmentUploadIds)
  t.addMessage({ content: text, sender: customerId, senderType: 'customer', attachments: files })
  t.status = 'waiting_for_admin'
  await t.save()
  return toDto(t, { withMessages: true })
}

export async function closeTicket(customerId, id) {
  const t = await owned(customerId, id)
  if (t.status !== 'closed') {
    t.status = 'closed'
    t.sla.closedAt = new Date()
    await t.save()
  }
  return toDto(t, { withMessages: true })
}

export async function rateTicket(customerId, id, { rating, feedback }) {
  const t = await owned(customerId, id)
  if (!['resolved', 'closed'].includes(t.status)) {
    throw E.conflict('You can rate a ticket once it is resolved or closed.', 'TICKET_NOT_RESOLVED')
  }
  if (t.satisfaction?.rating) {
    throw E.conflict('You already rated this ticket.', 'ALREADY_RATED')
  }
  t.satisfaction = { rating, feedback, ratedAt: new Date() }
  await t.save()
}

/** Called by the sync job when staff reply: customer gets a notification. */
export async function notifyStaffReply(t) {
  await notify(t.customerId, { category: 'support', title: 'Support replied', body: `New reply on ${t.ticketId}`, deepLink: `homesxpert://support/ticket/${t._id}`, dedupeKey: `ticket:${t._id}:${t.messages.length}` })
}
