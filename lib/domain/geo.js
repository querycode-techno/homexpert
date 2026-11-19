import { E } from '@/lib/platform/errors'

/**
 * Address lookup behind the app's "use my location" and typed-address suggestions (India only).
 * Provider: Google Geocoding when GOOGLE_MAPS_API_KEY is set, otherwise OpenStreetMap Nominatim (public instance,
 * ≤ 1 request/second — fine for pilot volume; switch to Google or a self-hosted instance as traffic grows).
 */
const cache = new Map()
const TTL = 10 * 60_000
let lastNominatim = 0

async function cached(key, fn) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL) return hit.value
  const value = await fn()
  cache.set(key, { at: Date.now(), value })
  if (cache.size > 500) cache.delete(cache.keys().next().value)
  return value
}

const fromNominatim = (r) => {
  const a = r.address || {}
  const line1 = [a.house_number, a.road || a.pedestrian || a.neighbourhood].filter(Boolean).join(' ')
  return {
    label: r.display_name,
    line1: line1 || a.suburb || a.neighbourhood || '',
    line2: line1 ? a.suburb || a.neighbourhood || undefined : undefined,
    city: a.city || a.town || a.village || a.state_district || a.county || '',
    state: a.state || '',
    pincode: (a.postcode || '').replace(/\s/g, ''),
    lat: Number(r.lat),
    lng: Number(r.lon),
  }
}

const fromGoogle = (r) => {
  const get = (t) => r.address_components?.find((c) => c.types.includes(t))?.long_name || ''
  const line1 = [get('street_number'), get('route')].filter(Boolean).join(' ')
  return {
    label: r.formatted_address,
    line1: line1 || get('sublocality_level_1') || get('premise'),
    line2: line1 ? get('sublocality_level_1') || undefined : undefined,
    city: get('locality') || get('administrative_area_level_2'),
    state: get('administrative_area_level_1'),
    pincode: get('postal_code'),
    lat: r.geometry?.location?.lat,
    lng: r.geometry?.location?.lng,
  }
}

async function nominatim(path, params) {
  const wait = lastNominatim + 1100 - Date.now()
  lastNominatim = Math.max(Date.now(), lastNominatim) + (wait > 0 ? wait : 0)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  const res = await fetch(`https://nominatim.openstreetmap.org/${path}?${new URLSearchParams({ format: 'jsonv2', addressdetails: '1', ...params })}`, {
    headers: { 'User-Agent': process.env.GEO_USER_AGENT || 'HomesXpert-CustomerAPI/1.0', 'Accept-Language': 'en' },
  })
  if (!res.ok) throw new Error(`geocoder ${res.status}`)
  return res.json()
}

async function google(params) {
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${new URLSearchParams({ key: process.env.GOOGLE_MAPS_API_KEY, region: 'in', ...params })}`)
  const json = await res.json()
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') throw new Error(`geocoder ${json.status}`)
  return json.results || []
}

export async function reverse(lat, lng) {
  const key = `r:${lat.toFixed(4)},${lng.toFixed(4)}`
  const found = await cached(key, async () => {
    try {
      if (process.env.GOOGLE_MAPS_API_KEY) {
        const r = (await google({ latlng: `${lat},${lng}` }))[0]
        return r ? fromGoogle(r) : null
      }
      const r = await nominatim('reverse', { lat, lon: lng })
      return r && !r.error ? fromNominatim(r) : null
    } catch {
      return undefined
    }
  })
  if (found === undefined) throw E.internal()
  if (!found || !found.pincode) throw E.notFound('We could not find an address for this location. Please enter it manually.', 'GEOCODE_NOT_FOUND')
  return found
}

export async function autocomplete(q) {
  const term = q.trim().toLowerCase()
  const out = await cached(`a:${term}`, async () => {
    try {
      if (process.env.GOOGLE_MAPS_API_KEY) {
        return (await google({ address: q, components: 'country:IN' })).slice(0, 5).map(fromGoogle)
      }
      return (await nominatim('search', { q, countrycodes: 'in', limit: '5' })).map(fromNominatim)
    } catch {
      return undefined
    }
  })
  if (out === undefined) throw E.internal()
  return out.filter((a) => a.pincode)
}
