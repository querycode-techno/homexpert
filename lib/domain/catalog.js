import mongoose from 'mongoose'
import { Category, Service, City, ServiceArea } from '@/lib/models/catalogue'
import Slide from '@/lib/models/slide'
import { money } from '@/lib/platform/money'
import { E } from '@/lib/platform/errors'

export const oid = (v, what = 'id') => {
  if (!mongoose.isValidObjectId(v)) {
    throw E.notFound(`That ${what} was not found.`)
  }
  return new mongoose.Types.ObjectId(v)
}

/** Price label shown to customers. The app never builds or computes one. */
export function priceDisplay(pricing) {
  if (!pricing || pricing.type === 'quote' || pricing.amountPaise == null) {
    return { kind: 'quote', label: 'Get a quote' }
  }
  const m = money(pricing.amountPaise)
  return pricing.type === 'from' ? { kind: 'from', label: `From ${m.display}`, price: m } : { kind: 'fixed', label: m.display, price: m }
}

const activeSubs = (svc) => (svc.subServices || []).filter((s) => s.status !== 'hidden')

/** Lowest sub-service price represents the service ("From ₹x"). */
export function servicePriceDisplay(svc) {
  const priced = activeSubs(svc).filter((s) => s.pricing?.type !== 'quote' && s.pricing?.amountPaise != null)
  if (priced.length === 0) {
    return { kind: 'quote', label: 'Get a quote' }
  }
  const min = priced.reduce((a, b) => (b.pricing.amountPaise < a.pricing.amountPaise ? b : a))
  const m = money(min.pricing.amountPaise)
  return priced.length > 1 || min.pricing.type === 'from' ? { kind: 'from', label: `From ${m.display}`, price: m } : { kind: 'fixed', label: m.display, price: m }
}

/** id → slug for categories (the app picks the category illustration from the slug). Refreshed every 5 minutes. */
let slugCache = { at: 0, map: {} }
export async function ensureSlugs() {
  if (Date.now() - slugCache.at > 300_000) {
    const rows = await Category.find({}).select('slug').lean()
    slugCache = { at: Date.now(), map: Object.fromEntries(rows.map((c) => [String(c._id), c.slug])) }
  }
}

export const toCity = (c) => ({ id: String(c._id), name: c.name, state: c.state, isActive: c.isActive })
export const toCategory = (c, serviceCount) => ({ id: String(c._id), slug: c.slug, name: c.name, iconUrl: c.iconUrl, imageUrl: c.imageUrl, sortOrder: c.sortOrder, ...(serviceCount != null ? { serviceCount } : {}) })
export const toServiceSummary = (s) => ({
  id: String(s._id),
  categoryId: String(s.categoryId),
  categorySlug: slugCache.map[String(s.categoryId)],
  name: s.name,
  shortDescription: s.shortDescription,
  imageUrl: s.imageUrl,
  priceDisplay: servicePriceDisplay(s),
  rating: s.ratingAvg || undefined,
  ratingCount: s.ratingCount || undefined,
  badges: s.badges?.length ? s.badges : undefined,
})
export const toServiceDetail = (s) => ({
  ...toServiceSummary(s),
  description: s.description,
  gallery: s.gallery,
  inclusions: s.inclusions,
  exclusions: s.exclusions,
  howItWorks: s.howItWorks,
  warranty: s.warranty || null,
  faqs: (s.faqs || []).map((f) => ({ id: String(f._id), question: f.question, answer: f.answer })),
  subServices: activeSubs(s).map((x) => ({ id: x.key, name: x.name, note: x.note || null, durationMinutes: x.durationMinutes, priceDisplay: priceDisplay(x.pricing) })),
})

const LIVE = { status: 'published' }

export async function listCities() {
  return (await City.find({ isActive: true }).sort({ name: 1 }).lean()).map(toCity)
}

/** Categories visible in a city (a category with no cityIds is available everywhere). */
export async function listCategories(cityId) {
  const filter = { ...LIVE }
  if (cityId) {
    filter.$or = [{ cityIds: { $size: 0 } }, { cityIds: oid(cityId, 'city') }]
  }
  const cats = await Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean()
  const counts = await Service.aggregate([{ $match: { ...LIVE, categoryId: { $in: cats.map((c) => c._id) } } }, { $group: { _id: '$categoryId', n: { $sum: 1 } } }])
  const byId = Object.fromEntries(counts.map((c) => [String(c._id), c.n]))
  return cats.map((c) => toCategory(c, byId[String(c._id)] || 0))
}

export async function listServicesByCategory(categoryId, { cursor, limit = 20 }) {
  await ensureSlugs()
  const filter = { ...LIVE, categoryId: oid(categoryId, 'category') }
  if (cursor) {
    filter._id = { $gt: oid(cursor, 'cursor') }
  }
  const rows = await Service.find(filter).sort({ _id: 1 }).limit(limit + 1).lean()
  const page = rows.slice(0, limit)
  return { items: page.map(toServiceSummary), nextCursor: rows.length > limit ? String(page[page.length - 1]._id) : null }
}

export async function getService(serviceId) {
  await ensureSlugs()
  const s = await Service.findOne({ _id: oid(serviceId, 'service'), ...LIVE }).lean()
  if (!s) {
    throw E.notFound('This service is no longer available.')
  }
  return toServiceDetail(s)
}

const esc = (q) => q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Edit distance (small strings only) for typo tolerance. */
function distance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j += 1) dp[0][j] = j
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
  }
  return dp[a.length][b.length]
}

/** A query word matches a service if it is within 1 edit (2 for long words) of any word in the name or option names. */
function fuzzyMatches(term, svc) {
  const words = term.toLowerCase().split(/\s+/).filter(Boolean)
  const hay = `${svc.name} ${(svc.subServices || []).map((x) => x.name).join(' ')}`.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  return words.every((w) => hay.some((h) => h.startsWith(w) || distance(w, h.slice(0, w.length + 1)) <= (w.length > 5 ? 2 : 1) || distance(w, h) <= (w.length > 5 ? 2 : 1)))
}

/**
 * Case-insensitive substring match on name, description and option names; when nothing matches, a typo-tolerant pass over the
 * published catalogue (small) is used. Returns category facets so the app can offer filters.
 */
export async function searchServices(q, { cursor, limit = 20, categoryId }) {
  await ensureSlugs()
  const term = q.trim()
  const base = { ...LIVE, $or: [{ name: new RegExp(esc(term), 'i') }, { shortDescription: new RegExp(esc(term), 'i') }, { 'subServices.name': new RegExp(esc(term), 'i') }] }
  let matched = await Service.find(base).select('_id categoryId').lean()
  let fuzzy = false
  if (matched.length === 0) {
    const all = await Service.find(LIVE).select('name subServices categoryId').lean()
    matched = all.filter((x) => fuzzyMatches(term, x))
    fuzzy = matched.length > 0
  }
  const ids = matched.map((m) => m._id)
  const counts = {}
  matched.forEach((m) => {
    counts[String(m.categoryId)] = (counts[String(m.categoryId)] || 0) + 1
  })
  const cats = await Category.find({ _id: { $in: Object.keys(counts).map((c) => oid(c)) } }).select('name').lean()
  const facets = cats.map((c) => ({ id: String(c._id), name: c.name, count: counts[String(c._id)] })).sort((a, b) => b.count - a.count)

  const filter = { _id: { $in: ids } }
  if (categoryId) {
    filter.categoryId = oid(categoryId, 'category')
  }
  if (cursor) {
    filter._id = { $in: ids.filter((i) => String(i) > cursor) }
  }
  const rows = await Service.find(filter).sort({ _id: 1 }).limit(limit + 1).lean()
  const page = rows.slice(0, limit)
  return { items: page.map(toServiceSummary), nextCursor: rows.length > limit ? String(page[page.length - 1]._id) : null, facets, fuzzy }
}

export async function suggest(q) {
  const rows = await Service.find({ ...LIVE, name: new RegExp(`^${esc(q.trim())}|\\b${esc(q.trim())}`, 'i') }).sort({ popularityScore: -1 }).limit(6).select('name').lean()
  return rows.map((r) => r.name)
}

/** Home banners come from the team's `Slide` model (managed in Admin → Home Slides). */
async function homeSlides() {
  const now = new Date()
  const slides = await Slide.find({
    isActive: true,
    $and: [{ $or: [{ startDate: null }, { startDate: { $exists: false } }, { startDate: { $lte: now } }] }, { $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }] }],
  })
    .sort({ sortOrder: 1 })
    .limit(8)
    .lean()
  const out = []
  for (const sl of slides) {
    // A target may be an id or a slug (the team's admin form takes free text); resolve slugs to ids the app can open
    let type = sl.navigationType === 'external_url' ? 'url' : sl.navigationType
    let value = sl.navigationTarget
    if (type === 'category' && !mongoose.isValidObjectId(value)) {
      const c = await Category.findOne({ slug: value }).select('_id').lean()
      value = c ? String(c._id) : null
    } else if (type === 'service' && !mongoose.isValidObjectId(value)) {
      const sv = await Service.findOne({ slug: value }).select('_id').lean()
      value = sv ? String(sv._id) : null
    }
    out.push({ id: String(sl._id), title: sl.title, imageUrl: sl.imageUrl, altText: sl.subtitle || sl.title, target: { type, value: value || undefined } })
  }
  return out
}

export async function homeFeed(cityId) {
  await ensureSlugs()
  const [city, banners, categories, popular] = await Promise.all([
    cityId ? City.findById(oid(cityId, 'city')).lean() : null,
    homeSlides(),
    listCategories(cityId),
    Service.find(LIVE).sort({ popularityScore: -1 }).limit(10).lean(),
  ])
  return {
    city: city ? toCity(city) : undefined,
    banners,
    categories,
    popular: popular.map(toServiceSummary),
    offers: [],
  }
}

/** Serviceability is decided here from `service_areas` (doc 08 §6). */
export async function checkServiceability(pincode, categoryId) {
  const area = await ServiceArea.findOne({ pincode }).lean()
  if (!area || area.status === 'closed') {
    return { serviceable: false, message: `We're not in ${pincode} yet. Tell us and we'll notify you when we arrive.`, waitlistAvailable: true }
  }
  if (area.status === 'waitlist') {
    return { serviceable: false, message: `We're opening in ${pincode} soon. Join the waitlist and we'll let you know.`, waitlistAvailable: true }
  }
  if (categoryId && area.categoryIds?.length && !area.categoryIds.some((c) => String(c) === categoryId)) {
    return { serviceable: false, message: 'This service is not available in your area yet.', waitlistAvailable: false }
  }
  const city = await City.findById(area.cityId).lean()
  return { serviceable: true, city: city ? toCity(city) : undefined }
}
