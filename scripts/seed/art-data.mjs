/** Shared by the artwork generator and the seed: pictograms (24×24 stroke paths) and banner copy. */

/** Bump when the artwork is regenerated: it is appended to image URLs so devices drop their cached copies. */
export const ART_VERSION = 2

export function rng(seed) {
  let h = 1779033703 ^ String(seed).length
  for (let i = 0; i < String(seed).length; i += 1) {
    h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const CATEGORY_ART = {
  'home-appliances': { glyph: '<rect x="3" y="5" width="18" height="8" rx="2"/><path d="M7 17v2M12 17v3M17 17v2M7 9h10"/>' },
  'kitchen-appliances': { glyph: '<path d="M4 11h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM2 11h20M9 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4"/>' },
  'cleaning-pest': { glyph: '<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>' },
  handyman: { glyph: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>' },
  'packers-movers': { glyph: '<path d="M2 6h12v10H2zM14 10h4l4 3v3h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>' },
  'contractor-services': { glyph: '<path d="M4 21V8l8-5 8 5v13zM9 21v-6h6v6"/>' },
  salon: { glyph: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 8.1L20 20M8.1 15.9L20 4"/>' },
  'professional-experts': { glyph: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>' },
  'real-estate': { glyph: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M11 21v-3h2v3"/>' },
}

export const BANNERS = [
  { file: 'ac-service', category: 'home-appliances', kicker: 'SUMMER READY', line1: 'AC service', line2: 'from ₹299', cta: 'Book now', slug: 'ac-service', target: 'service', title: 'AC service from ₹299', subtitle: 'Gas top-up, jet cleaning and repair' },
  { file: 'deep-clean', category: 'cleaning-pest', kicker: 'SPOTLESS HOME', line1: 'Deep cleaning', line2: 'and pest control', cta: 'Explore', title: 'Deep cleaning and pest control', subtitle: 'Verified Xperts, safe products' },
  { file: 'salon-home', category: 'salon', kicker: 'SALON AT HOME', line1: 'Glow up at', line2: 'your doorstep', cta: 'Book now', title: 'Salon care at your doorstep', subtitle: 'Facials, waxing, mani-pedi and more' },
  { file: 'handyman', category: 'handyman', kicker: 'FIX IT FAST', line1: 'Electrician &', line2: 'plumber today', cta: 'Book now', title: 'Electrician and plumber, same day', subtitle: 'Background-verified, on time' },
  { file: 'kitchen', category: 'kitchen-appliances', kicker: 'KITCHEN CARE', line1: 'RO, geyser &', line2: 'fridge repair', cta: 'Explore', title: 'Kitchen appliance repair', subtitle: 'Warranty on every repair' },
  { file: 'movers', category: 'packers-movers', kicker: 'STRESS-FREE MOVE', line1: 'Packers &', line2: 'movers', cta: 'Get a quote', title: 'Packers and movers', subtitle: 'Careful packing, on-time delivery' },
]
