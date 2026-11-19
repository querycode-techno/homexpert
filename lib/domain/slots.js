import { SlotTemplate, City } from '@/lib/models/catalogue'
import { ServiceRequest } from '@/lib/models/booking'
import { E } from '@/lib/platform/errors'

const IST_MS = 5.5 * 3600 * 1000
const DEFAULT = {
  windows: [
    { start: '09:00', end: '11:00', label: '9 AM – 11 AM' },
    { start: '11:00', end: '13:00', label: '11 AM – 1 PM' },
    { start: '13:00', end: '15:00', label: '1 PM – 3 PM' },
    { start: '15:00', end: '17:00', label: '3 PM – 5 PM' },
    { start: '17:00', end: '19:00', label: '5 PM – 7 PM' },
  ],
  leadTimeMinutes: 120,
  maxPerWindow: 20,
  daysAhead: 14,
  holidays: [],
}

/** `YYYY-MM-DD` + `HH:MM` in IST → UTC Date. */
export const istToUtc = (date, hhmm) => new Date(new Date(`${date}T${hhmm}:00.000Z`).getTime() - IST_MS)
export const todayIst = (now = new Date()) => new Date(now.getTime() + IST_MS).toISOString().slice(0, 10)
const slotId = (date, start) => `${date.replace(/-/g, '')}-${start.replace(':', '')}`

async function templateFor(cityName) {
  let tpl = null
  if (cityName) {
    const city = await City.findOne({ name: new RegExp(`^${cityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).lean()
    tpl = city ? await SlotTemplate.findOne({ cityId: city._id }).lean() : null
  }
  tpl = tpl || (await SlotTemplate.findOne({ cityId: null }).lean())
  return { ...DEFAULT, ...(tpl || {}) }
}

async function usage(starts) {
  const rows = await ServiceRequest.aggregate([{ $match: { 'slot.start': { $in: starts }, 'cancellation.at': null } }, { $group: { _id: '$slot.start', n: { $sum: 1 } } }])
  return Object.fromEntries(rows.map((r) => [String(r._id.getTime()), r.n]))
}

/** Slot windows for `days` days from `from`; unavailable ones are returned flagged, not hidden. */
export async function listSlots({ cityName, from, days = 7, now = new Date() }) {
  const tpl = await templateFor(cityName)
  const out = []
  const dates = []
  for (let i = 0; i < days; i += 1) {
    const d = new Date(new Date(`${from}T00:00:00.000Z`).getTime() + i * 86400_000).toISOString().slice(0, 10)
    if (d >= todayIst(now) && i < tpl.daysAhead) {
      dates.push(d)
    }
  }
  const starts = dates.flatMap((d) => tpl.windows.map((w) => istToUtc(d, w.start)))
  const used = await usage(starts)
  const earliest = now.getTime() + tpl.leadTimeMinutes * 60_000
  dates.forEach((date) => {
    out.push({
      date,
      slots: tpl.windows.map((w) => {
        const start = istToUtc(date, w.start)
        const taken = used[String(start.getTime())] || 0
        const available = !tpl.holidays.includes(date) && start.getTime() >= earliest && taken < tpl.maxPerWindow
        return { id: slotId(date, w.start), start: start.toISOString(), end: istToUtc(date, w.end).toISOString(), label: w.label, available }
      }),
    })
  })
  return out
}

/** Re-validate a slot id at booking time (never trust a previously-listed availability). */
export async function resolveSlot(id, { cityName, now = new Date() }) {
  const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(id || '')
  if (!m) {
    throw E.conflict('That time is no longer available. Please pick another slot.', 'SLOT_UNAVAILABLE')
  }
  const date = `${m[1]}-${m[2]}-${m[3]}`
  const days = await listSlots({ cityName, from: date, days: 1, now })
  const slot = days[0]?.slots.find((s) => s.id === id)
  if (!slot || !slot.available) {
    throw E.conflict('That time slot was just taken. Please choose another.', 'SLOT_UNAVAILABLE')
  }
  return slot
}
