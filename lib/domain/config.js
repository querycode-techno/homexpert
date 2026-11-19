import { AppConfig } from '@/lib/models/customerPlatform'
import mongoose from 'mongoose'

const DEFAULTS = {
  version_policy: { android: { min: '1.0.0', latest: '1.0.0', storeUrl: '' }, ios: { min: '1.0.0', latest: '1.0.0', storeUrl: '' }, message: '' },
  maintenance: { enabled: false, message: '', until: null },
  flags: {},
  support: { phone: '', whatsapp: '', hours: '', open: { start: '09:00', end: '20:00', days: [1, 2, 3, 4, 5, 6] } },
  legal: { termsUrl: '', privacyUrl: '', refundUrl: '', termsVersion: '1', privacyVersion: '1' },
  limits: { maxAddresses: 10, maxPhotos: 5, maxCartLines: 20 },
  cancellation: { freeWindowMinutes: 120, lateFeePaise: 0, noCancelStatuses: ['in_progress', 'completed', 'cancelled'] },
  payment: { autoConfirmHours: 24, toleranceBps: 1000 },
  invoice: { legalName: 'HomesXpert', gstin: '', address: '', pan: '' },
  referral: { rewardPaise: 10000, rewardText: 'Give ₹100, get ₹100 on your first completed booking', minSubtotalPaise: 29900 },
}

let cache = { at: 0, map: null }

/** All config documents merged over defaults; cached 60 s per instance. */
export async function loadConfig() {
  if (cache.map && Date.now() - cache.at < 60_000) {
    return cache.map
  }
  const docs = await AppConfig.find({}).lean()
  // Contact details come from the team's Business Settings (Admin → Settings); an explicit `support` config overrides them
  const biz = await mongoose.connection.collection('businesssettings').findOne({}, { sort: { updatedAt: -1 }, projection: { phone: 1, whatsapp: 1 } }).catch(() => null)
  const map = { ...DEFAULTS, support: { ...DEFAULTS.support, phone: biz?.phone || '', whatsapp: biz?.whatsapp || '' } }
  docs.forEach((d) => {
    map[d.key] = { ...(map[d.key] || {}), ...(d.value || {}) }
  })
  cache = { at: Date.now(), map }
  return map
}

export const clearConfigCache = () => {
  cache = { at: 0, map: null }
}

const parse = (v) => String(v || '0').split('.').map((n) => parseInt(n, 10) || 0)
export function compareVersions(a, b) {
  const x = parse(a)
  const y = parse(b)
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
    const d = (x[i] || 0) - (y[i] || 0)
    if (d !== 0) {
      return d < 0 ? -1 : 1
    }
  }
  return 0
}

function isOpenNow(support, now = new Date()) {
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000)
  const hhmm = ist.toISOString().slice(11, 16)
  const o = support.open || {}
  return (o.days || []).includes(ist.getUTCDay()) && hhmm >= (o.start || '00:00') && hhmm < (o.end || '24:00')
}

/** The server — not the app — decides whether an update is soft/forced and whether we are in maintenance. */
export async function getAppConfig({ platform, appVersion }) {
  const c = await loadConfig()
  const vp = c.version_policy[platform] || c.version_policy.android
  let status = 'none'
  if (appVersion && vp.min && compareVersions(appVersion, vp.min) < 0) {
    status = 'force'
  } else if (appVersion && vp.latest && compareVersions(appVersion, vp.latest) < 0) {
    status = 'soft'
  }
  return {
    update: { status, minVersion: vp.min, latestVersion: vp.latest, storeUrl: vp.storeUrl, message: status === 'none' ? undefined : c.version_policy.message || undefined },
    maintenance: { enabled: !!c.maintenance.enabled, message: c.maintenance.message || undefined, until: c.maintenance.until || null },
    flags: c.flags,
    support: { phone: c.support.phone, whatsapp: c.support.whatsapp, hours: c.support.hours, isOpenNow: isOpenNow(c.support) },
    legal: c.legal,
    limits: c.limits,
  }
}
