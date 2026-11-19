/** Realistic catalogue copy, reviews, promos, FAQs for the seed. Deterministic (seeded PRNG), no network. */
import crypto from 'node:crypto'
import { rng } from './art-data.mjs'

export const CATEGORY_COPY = {
  'home-appliances': {
    inclusions: ['Visit by a background-verified Xpert', 'Inspection and diagnosis of the issue', 'Standard cleaning and servicing', 'Basic consumables included', 'Post-service performance check'],
    exclusions: ['Spare parts and gas refill (quoted before work)', 'Civil or electrical rewiring work', 'Appliances out of manufacturer warranty terms'],
    howItWorks: ['Choose a slot that suits you', 'Your Xpert arrives with tools and ID', 'Diagnosis and a clear quote before any work', 'Service completed and tested with you', 'Pay after the job is done'],
    warranty: '30-day service warranty on workmanship',
    badges: ['Top rated', 'Popular'],
  },
  'kitchen-appliances': {
    inclusions: ['Doorstep inspection by a trained Xpert', 'Fault diagnosis and repair estimate', 'Cleaning of accessible parts', 'Genuine-quality parts on request', 'Functional test before leaving'],
    exclusions: ['Cost of replacement parts', 'Plumbing or wall-mounting changes', 'Water or gas connection re-routing'],
    howItWorks: ['Book your preferred time', 'Xpert inspects and shares the estimate', 'Approve the quote in the app', 'Repair done at home', 'Pay after the service'],
    warranty: '30-day warranty on repair work, 90 days on replaced parts',
    badges: ['Popular', 'Warranty'],
  },
  'cleaning-pest': {
    inclusions: ['Trained and verified cleaning professionals', 'Professional-grade, skin-safe solutions', 'Equipment brought by the team', 'Cleaning of floors, fixtures and surfaces', 'Final walkthrough with you'],
    exclusions: ['Moving heavy furniture', 'Exterior glass above 10 ft', 'Stain removal that damages the fabric'],
    howItWorks: ['Pick a date and time', 'Team arrives with all equipment', 'Area is prepared and protected', 'Deep clean or treatment carried out', 'You inspect and approve the result'],
    warranty: 'Free re-service within 7 days if you are not satisfied',
    badges: ['Top rated', 'New'],
  },
  handyman: {
    inclusions: ['Experienced, verified Xpert', 'Visit and diagnosis', 'Standard tools and fittings for the job', 'Clean-up after work', 'Safety check'],
    exclusions: ['Cost of materials and fixtures', 'Structural or civil work', 'Work needing a permit'],
    howItWorks: ['Describe the problem and pick a slot', 'Xpert arrives and assesses the work', 'Fixed quote shared before starting', 'Work completed and tested', 'Pay after the job'],
    warranty: '30-day workmanship warranty',
    badges: ['Popular', 'Same-day'],
  },
  'packers-movers': {
    inclusions: ['Pre-move survey and quote', 'Packing material and labour', 'Loading, transport and unloading', 'Basic furniture dismantling and fitting', 'Transit handling support'],
    exclusions: ['Transit insurance (optional add-on)', 'Parking or lift permissions', 'Items that are illegal or hazardous to move'],
    howItWorks: ['Share your move details', 'Get a firm quote after the survey', 'Packing a day before or on moving day', 'Safe transport to the new place', 'Unpacking and placement help'],
    warranty: 'Damage-claim support within 48 hours',
    badges: ['Quote'],
  },
  'contractor-services': {
    inclusions: ['Site visit and measurement', 'Detailed written estimate', 'Skilled crew and supervision', 'Clean-up and debris removal', 'Progress updates'],
    exclusions: ['Raw materials unless stated in the quote', 'Government approvals', 'Work outside the agreed scope'],
    howItWorks: ['Book a free site visit', 'Receive a detailed estimate', 'Confirm scope and schedule', 'Work carried out with updates', 'Handover and final inspection'],
    warranty: '6-month workmanship warranty',
    badges: ['Quote'],
  },
  salon: {
    inclusions: ['Certified beautician at your home', 'Single-use or sanitised kits', 'Premium, dermatologist-tested products', 'Hygiene-first setup', 'Patch test when needed'],
    exclusions: ['Chair or table (please keep a chair ready)', 'Treatments for known skin allergies', 'Extra add-ons not in the package'],
    howItWorks: ['Choose a service and a slot', 'Beautician arrives with the kit', 'Consultation and patch test', 'Treatment at your comfort', 'Pay after the service'],
    warranty: 'Hygiene and satisfaction guarantee',
    badges: ['Top rated', 'Women Xperts'],
  },
  'professional-experts': {
    inclusions: ['Verified professional', 'One-to-one consultation', 'Personalised guidance', 'Follow-up notes', 'Confidential handling'],
    exclusions: ['Travel outside service area', 'Materials or medicines', 'Legal or medical advice'],
    howItWorks: ['Book a convenient slot', 'Meet your expert at home or online', 'Discuss your needs', 'Receive a clear plan', 'Pay after the session'],
    warranty: 'Satisfaction support for 7 days',
    badges: ['New'],
  },
  'real-estate': {
    inclusions: ['Dedicated property advisor', 'Shortlisting as per your budget', 'Site visits arranged', 'Documentation guidance', 'Negotiation support'],
    exclusions: ['Registration and stamp duty', 'Brokerage as per local norms', 'Legal fees'],
    howItWorks: ['Tell us what you need', 'Advisor shortlists options', 'Visit properties together', 'Negotiate and finalise', 'Complete paperwork'],
    warranty: 'Verified listings only',
    badges: ['Quote'],
  },
}

const FAQ_BANK = (name) => [
  { question: `How long does ${name} take?`, answer: 'Most visits take 45 to 90 minutes depending on the work. Your Xpert shares an estimate on arrival.' },
  { question: 'Do I need to be at home?', answer: 'An adult should be present at the start and at the end of the service to approve the work.' },
  { question: 'Is the price final?', answer: 'The price shown is an estimate. The Xpert confirms the final price after inspection and you approve it in the app.' },
  { question: 'What if I am not happy with the service?', answer: 'Raise an issue from your booking within 7 days and our team will arrange a free re-visit or a resolution.' },
]

export function serviceContent(categorySlug, service, idx) {
  const c = CATEGORY_COPY[categorySlug]
  const r = rng(`content-${service.id}`)
  const faqs = FAQ_BANK(service.name).slice(0, 3 + Math.floor(r() * 2))
  return {
    shortDescription: service.description,
    description: `${service.description.replace(/[.\s]+$/, '')}. Book a verified HomesXpert professional at a time that suits you. You see the price up front and pay only after the work is complete.`,
    inclusions: c.inclusions,
    exclusions: c.exclusions,
    howItWorks: c.howItWorks,
    warranty: c.warranty,
    faqs,
    badges: idx < 2 ? c.badges.slice(0, 2) : r() > 0.7 ? c.badges.slice(0, 1) : [],
    // Priced, bookable services rank ahead of quote-only ones on the Popular rail
    popularityScore: Math.round(40 + r() * 60 - idx * 2 - (service.subServices.some((x) => typeof x.price === 'number') ? 0 : 45)),
  }
}

const FIRST = ['Aarav', 'Priya', 'Rohan', 'Sneha', 'Vikram', 'Ananya', 'Karan', 'Meera', 'Arjun', 'Isha', 'Rahul', 'Pooja', 'Siddharth', 'Neha', 'Aditya', 'Kavya', 'Manish', 'Divya', 'Nikhil', 'Riya', 'Suresh', 'Anjali', 'Deepak', 'Shruti']
const LAST = ['Sharma', 'Verma', 'Iyer', 'Reddy', 'Patel', 'Nair', 'Singh', 'Gupta', 'Mehta', 'Das', 'Joshi', 'Kapoor']
const GOOD = [
  'Xpert arrived on time and was very professional. The work was neat and explained properly.',
  'Great service. Fixed the issue in one visit and cleaned up after. Will book again.',
  'Transparent pricing, no surprises. Quote matched what I paid.',
  'Polite and skilled. Took the time to show me what was wrong.',
  'Booking was easy and the slot was kept. Happy with the result.',
  'Quick, clean and affordable. Much better than calling random people.',
  'Very satisfied. The Xpert called before arriving and finished earlier than expected.',
  'Excellent finish and good follow-up from support.',
]
const MID = ['Good work overall, though the Xpert arrived a little late.', 'Service was fine. Took longer than I expected but the result is good.', 'Decent experience. Price was fair.']
const LOW = ['Had to ask for a revisit, but support sorted it quickly.']
const TAGS_GOOD = ['On time', 'Professional', 'Clean work', 'Fair price', 'Polite', 'Skilled']

export function reviewsFor(service, count) {
  const r = rng(`rev-${service.slug}`)
  const out = []
  for (let i = 0; i < count; i += 1) {
    const roll = r()
    const rating = roll < 0.62 ? 5 : roll < 0.88 ? 4 : roll < 0.96 ? 3 : 2
    const pool = rating >= 4 ? GOOD : rating === 3 ? MID : LOW
    const requestId = crypto.createHash('sha1').update(`${service.slug}:${i}`).digest('hex').slice(0, 24)
    out.push({
      requestId,
      rating,
      text: pool[Math.floor(r() * pool.length)],
      tags: rating >= 4 ? [...TAGS_GOOD].sort(() => r() - 0.5).slice(0, 1 + Math.floor(r() * 3)) : [],
      authorName: `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)][0]}.`,
      helpfulCount: Math.floor(r() * 18),
      createdAt: new Date(Date.now() - Math.floor(r() * 150) * 86400000),
    })
  }
  return out
}

export const PROMOS = (now = Date.now()) => {
  const until = new Date(now + 180 * 86400000)
  return [
    { code: 'WELCOME100', title: '₹100 off your first booking', description: 'On orders of ₹499 and above', type: 'flat', valuePaise: 10000, minSubtotalPaise: 49900 },
    { code: 'SAVE15', title: '15% off, up to ₹300', description: 'On orders of ₹799 and above', type: 'pct', pct: 15, maxDiscountPaise: 30000, minSubtotalPaise: 79900 },
    { code: 'FIRST20', title: '20% off your first service', description: 'Max discount ₹400', type: 'pct', pct: 20, maxDiscountPaise: 40000, minSubtotalPaise: 59900 },
    { code: 'SALON200', title: '₹200 off salon at home', description: 'On orders of ₹1,299 and above', type: 'flat', valuePaise: 20000, minSubtotalPaise: 129900 },
    { code: 'FESTIVE10', title: 'Festive 10% off', description: 'Up to ₹250, on orders of ₹599+', type: 'pct', pct: 10, maxDiscountPaise: 25000, minSubtotalPaise: 59900 },
    { code: 'CLEAN150', title: '₹150 off cleaning services', description: 'On orders of ₹899 and above', type: 'flat', valuePaise: 15000, minSubtotalPaise: 89900 },
  ].map((p) => ({ ...p, validFrom: new Date(now - 86400000), validUntil: until, perCustomerLimit: 1, showInOffers: true, status: 'active' }))
}

export const FAQS = [
  { id: 'f1', topicId: 'booking', question: 'How do I book a service?', answer: 'Pick a service, add it to your cart, choose an address and a time slot, and confirm. You pay after the service.' },
  { id: 'f2', topicId: 'payment', question: 'When do I pay?', answer: 'After the service is done, directly to your Xpert by cash or UPI. There is no advance payment.' },
  { id: 'f3', topicId: 'booking', question: 'Can I cancel or reschedule?', answer: 'Yes, from the booking details screen. Any fee is shown before you confirm.' },
  { id: 'f4', topicId: 'xpert', question: 'Are Xperts verified?', answer: 'Every Xpert is background-checked and verified by HomesXpert before joining.' },
  { id: 'f5', topicId: 'booking', question: 'How is the price decided?', answer: 'Prices shown are estimates. Your Xpert confirms the final price after inspection, and you approve it in the app before work begins.' },
  { id: 'f6', topicId: 'booking', question: 'What if my Xpert is late?', answer: 'You can track your booking in the app. If your Xpert is more than 30 minutes late, contact support and we will help right away.' },
  { id: 'f7', topicId: 'payment', question: 'Which payment methods are accepted?', answer: 'Cash and UPI, paid to your Xpert after the service. Online payment in the app is coming soon.' },
  { id: 'f8', topicId: 'xpert', question: 'Is there a warranty on services?', answer: 'Most services carry a 30-day workmanship warranty. Details are on each service page.' },
  { id: 'f9', topicId: 'account', question: 'How do I change my phone number?', answer: 'Open Account, then Profile, and verify the new number with a one-time password.' },
  { id: 'f10', topicId: 'account', question: 'How do I delete my account?', answer: 'Go to Account, then Data and privacy, then Delete account. There is a grace period before it is permanent.' },
  { id: 'f11', topicId: 'booking', question: 'Can I book for someone else?', answer: 'Yes. Add their address while booking and make sure someone is present to receive the Xpert.' },
  { id: 'f12', topicId: 'xpert', question: 'How do I report a problem with an Xpert?', answer: 'Open the booking and tap Report an issue. Our team reviews every report.' },
]
