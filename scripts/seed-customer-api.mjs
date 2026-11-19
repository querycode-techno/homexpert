/**
 * One-time / re-runnable setup for the customer API: catalogue (from lib/data/services.json), default slot template,
 * app config, support topics + FAQs, and optionally a launch city with its serviceable pincodes.
 *
 *   MONGODB_URI=... [PUBLIC_ORIGIN=https://api...] node scripts/seed-customer-api.mjs [--city "Bengaluru,Karnataka" --pincodes 560001,560002,...]
 *
 * Idempotent: existing documents (matched by slug / key / pincode) are updated, never duplicated.
 */
import fs from 'node:fs'
import mongoose from 'mongoose'
import { Category, Service, City, ServiceArea, SlotTemplate, FeeRule } from '../lib/models/catalogue.js'
import { Review, Promo } from '../lib/models/booking.js'
import { Customer } from '../lib/models/customerAccount.js'
import Slide from '../lib/models/slide.js'
import { AppConfig } from '../lib/models/customerPlatform.js'
import { BANNERS, ART_VERSION } from './seed/art-data.mjs'
import { serviceContent, reviewsFor, PROMOS, FAQS } from './seed/content.mjs'

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required')
}
const arg = (n) => {
  const i = process.argv.indexOf(`--${n}`)
  return i > -1 ? process.argv[i + 1] : undefined
}
const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
// PUBLIC_ORIGIN must be the address phones can reach (e.g. http://192.168.1.5:3012 or https://api.homesxpert.in).
// Run `node scripts/seed/make-artwork.mjs` first; the images are served from /public/seed.
const origin = (process.env.PUBLIC_ORIGIN || '').replace(/\/$/, '')
const img = (p) => (origin ? `${origin}/seed/${p}?v=${ART_VERSION}` : undefined)

await mongoose.connect(process.env.MONGODB_URI)
const data = JSON.parse(fs.readFileSync(new URL('../lib/data/services.json', import.meta.url), 'utf8'))

let order = 0
let services = 0
const catIds = {}
const svcIds = {}
for (const c of data.categories) {
  const cat = await Category.findOneAndUpdate(
    { slug: c.id },
    { slug: c.id, name: c.name, sortOrder: order++, status: 'published', ...(origin ? { iconUrl: img(`categories/${c.id}-icon.png`), imageUrl: img(`categories/${c.id}-cover.png`) } : {}) },
    { upsert: true, new: true },
  )
  catIds[c.id] = cat._id
  for (const [idx, s] of c.services.entries()) {
    const subServices = s.subServices.map((x) => ({ key: slug(x.name), name: x.name, pricing: typeof x.price === 'number' ? { type: 'fixed', amountPaise: Math.round(x.price * 100) } : { type: 'quote' } }))
    const doc = await Service.findOneAndUpdate(
      { slug: s.id },
      {
        slug: s.id,
        categoryId: cat._id,
        name: s.name,
        subServices,
        status: 'published',
        ...serviceContent(c.id, s, idx),
        ...(origin ? { imageUrl: img(`services/${s.id}-0.png`), gallery: [0, 1, 2].map((v) => img(`services/${s.id}-${v}.png`)) } : {}),
      },
      { upsert: true, new: true },
    )
    svcIds[s.id] = doc._id
    services += 1
  }
}

// Reviews for the 30 most popular services, then rating aggregates recomputed from them
const reviewer = await Customer.findOneAndUpdate({ phone: '+910000000000' }, { $setOnInsert: { phone: '+910000000000', phoneHash: 'seed-reviewer', name: 'HomesXpert Customer', status: 'active' } }, { upsert: true, new: true })
const top = await Service.find({ status: 'published' }).sort({ popularityScore: -1 }).limit(30).lean()
let reviews = 0
for (const svc of top) {
  const list = reviewsFor(svc, 6 + (parseInt(String(svc._id).slice(-2), 16) % 9))
  for (const rv of list) {
    const { createdAt, ...fields } = rv
    await Review.updateOne({ requestId: rv.requestId }, { $set: { ...fields, customerId: reviewer._id, serviceId: svc._id, status: 'published' } }, { upsert: true })
    // createdAt is immutable in Mongoose, so spread the dates out with a raw update
    await Review.collection.updateOne({ requestId: new mongoose.Types.ObjectId(rv.requestId) }, { $set: { createdAt } })
    reviews += 1
  }
  const agg = await Review.aggregate([{ $match: { serviceId: svc._id, status: 'published' } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }])
  if (agg[0]) {
    await Service.updateOne({ _id: svc._id }, { ratingAvg: Math.round(agg[0].avg * 10) / 10, ratingCount: agg[0].n })
  }
}

let promos = 0
for (const p of PROMOS()) {
  await Promo.updateOne({ code: p.code }, { $set: p, $setOnInsert: { usedCount: 0 } }, { upsert: true })
  promos += 1
}

const slotExists = await SlotTemplate.findOne({ cityId: null })
if (!slotExists) {
  await SlotTemplate.create({
    cityId: null,
    windows: [
      { start: '09:00', end: '11:00', label: '9 AM – 11 AM' },
      { start: '11:00', end: '13:00', label: '11 AM – 1 PM' },
      { start: '13:00', end: '15:00', label: '1 PM – 3 PM' },
      { start: '15:00', end: '17:00', label: '3 PM – 5 PM' },
      { start: '17:00', end: '19:00', label: '5 PM – 7 PM' },
    ],
  })
}

const cfg = {
  support_topics: { items: [{ id: 'booking', name: 'My booking', requiresBooking: true }, { id: 'payment', name: 'Payment', requiresBooking: false }, { id: 'xpert', name: 'Xpert behaviour', requiresBooking: true }, { id: 'account', name: 'My account', requiresBooking: false }, { id: 'other', name: 'Something else', requiresBooking: false }] },
  faqs: { items: FAQS },
  support: { hours: '9 AM – 8 PM, Monday to Saturday', ...(process.env.SUPPORT_PHONE ? { phone: process.env.SUPPORT_PHONE } : {}), ...(process.env.SUPPORT_WHATSAPP ? { whatsapp: process.env.SUPPORT_WHATSAPP } : {}) },
}
for (const [key, value] of Object.entries(cfg)) {
  await AppConfig.updateOne({ key }, { $set: { key, value } }, { upsert: true })
}

// Home slides: upserted by title so re-runs refresh the images; admin-created slides are left alone
let slides = 0
if (origin) {
  for (const [i, b] of BANNERS.entries()) {
    const target = b.target === 'service' && svcIds[b.slug] ? { navigationType: 'service', navigationTarget: String(svcIds[b.slug]) } : { navigationType: 'category', navigationTarget: String(catIds[b.category]) }
    await Slide.updateOne({ title: b.title }, { $set: { title: b.title, subtitle: b.subtitle, ctaText: b.cta, imageUrl: img(`banners/${b.file}.png`), sortOrder: i, isActive: true, ...target } }, { upsert: true })
    slides += 1
  }
}

// Launch city: --city "Name,State" --pincodes a,b,c — defaults to Bengaluru if none exists yet, so serviceability + checkout work out of the box
let city = arg('city')
let pins = arg('pincodes')
if (!city && (await City.countDocuments()) === 0) {
  city = 'Bengaluru,Karnataka'
  pins = '560001,560002,560003,560004,560005,560008,560010,560011,560034,560038,560066,560068,560076,560095,560102'
}
if (city) {
  const [name, state] = city.split(',').map((s) => s.trim())
  const c = await City.findOneAndUpdate({ name }, { name, state, isActive: true, launchedAt: new Date() }, { upsert: true, new: true })
  for (const pincode of (pins || '').split(',').filter(Boolean)) {
    await ServiceArea.findOneAndUpdate({ pincode }, { cityId: c._id, pincode, status: 'live' }, { upsert: true })
  }
}
await FeeRule.init()

process.stdout.write(`Seeded ${data.categories.length} categories, ${services} services, ${reviews} reviews, ${promos} promos, ${slides} slides${city ? `, city ${city}` : ''}${origin ? '' : ' (no PUBLIC_ORIGIN: images/slides skipped)'}.\n`)
await mongoose.disconnect()
