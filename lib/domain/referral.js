import crypto from 'crypto'
import Lead from '@/lib/models/lead'
import { Customer } from '@/lib/models/customerAccount'
import { Promo, Referral, ServiceRequest } from '@/lib/models/booking'
import { E } from '@/lib/platform/errors'
import { money } from '@/lib/platform/money'
import { loadConfig } from './config'
import { notify } from './notifications'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const newCode = () => `HX${Array.from(crypto.randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join('')}`

async function ensureCode(customerId) {
  const c = await Customer.findById(customerId).select('referralCode')
  if (c.referralCode) return c.referralCode
  for (let i = 0; i < 5; i += 1) {
    try {
      const code = newCode()
      await Customer.updateOne({ _id: customerId, referralCode: { $exists: false } }, { $set: { referralCode: code } })
      const fresh = await Customer.findById(customerId).select('referralCode')
      if (fresh.referralCode) return fresh.referralCode
    } catch (e) {
      if (e.code !== 11000) throw e
    }
  }
  throw E.internal()
}

/** FR-GROW-02: the customer's code, share link, reward text and what they have earned so far. */
export async function getReferral(customerId) {
  const { referral } = await loadConfig()
  const code = await ensureCode(customerId)
  const rewarded = await Referral.countDocuments({ referrerId: customerId, status: 'rewarded' })
  const pending = await Referral.countDocuments({ referrerId: customerId, status: 'pending' })
  return {
    code,
    shareUrl: `https://homesxpert.in/app/refer?code=${code}`,
    rewardText: referral.rewardText,
    earned: money(rewarded * referral.rewardPaise),
    invited: rewarded + pending,
    rewarded,
  }
}

/** A new customer (no bookings, not yet referred) can enter a friend's code once. */
export async function applyReferralCode(customerId, rawCode) {
  const bad = (message) => E.validation([{ field: 'referralCode', code: 'REFERRAL_INVALID', message }], message)
  const code = String(rawCode || '').trim().toUpperCase()
  const me = await Customer.findById(customerId).select('referredBy referralCode')
  if (me.referredBy) throw bad('You have already used a referral code.')
  if (await ServiceRequest.exists({ customerId })) throw bad('Referral codes can only be added before your first booking.')
  const referrer = await Customer.findOne({ referralCode: code, status: 'active' }).select('_id')
  if (!referrer || String(referrer._id) === String(customerId)) throw bad('That referral code is not valid.')
  await Referral.create({ referrerId: referrer._id, refereeId: customerId })
  await Customer.updateOne({ _id: customerId }, { referredBy: referrer._id })
}

/** When a referred customer completes their first booking, both get a one-time reward code (a private promo). */
export async function issueReferralRewards(now = new Date()) {
  const { referral } = await loadConfig()
  const pending = await Referral.find({ status: 'pending' }).limit(100)
  let issued = 0
  for (const r of pending) {
    const done = await Lead.exists({ customerId: r.refereeId, source: 'user_app', status: { $in: ['completed', 'converted'] } })
    if (!done) continue
    const claim = await Referral.updateOne({ _id: r._id, status: 'pending' }, { status: 'rewarded', rewardedAt: now })
    if (claim.modifiedCount !== 1) continue
    for (const [customerId, who] of [[r.referrerId, 'friend'], [r.refereeId, 'welcome']]) {
      const promo = await Promo.create({
        code: `REF${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        title: who === 'friend' ? 'Referral reward' : 'Welcome reward',
        description: `${money(referral.rewardPaise).display} off your next booking`,
        type: 'flat',
        valuePaise: referral.rewardPaise,
        minSubtotalPaise: referral.minSubtotalPaise,
        validUntil: new Date(now.getTime() + 60 * 86400_000),
        perCustomerLimit: 1,
        customerId,
        showInOffers: true,
      })
      await notify(customerId, { category: 'bookings', title: 'You earned a reward', body: `${money(referral.rewardPaise).display} off your next booking. Use code ${promo.code}.`, deepLink: 'homesxpert://offers', dedupeKey: `referral:${r._id}:${customerId}` })
    }
    issued += 1
  }
  return issued
}
