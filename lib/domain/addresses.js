import { CustomerAddress, Customer } from '@/lib/models/customerAccount'
import { ServiceRequest } from '@/lib/models/booking'
import Lead from '@/lib/models/lead'
import { E } from '@/lib/platform/errors'
import { oid, checkServiceability } from './catalog'
import { loadConfig } from './config'

export const ACTIVE_STATUSES = ['submitted', 'matching', 'confirmed', 'scheduled', 'in_progress']

async function present(a) {
  const s = await checkServiceability(a.pincode)
  return {
    id: String(a._id),
    label: a.label,
    line1: a.line1,
    line2: a.line2,
    landmark: a.landmark,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    contactName: a.contactName,
    contactPhone: a.contactPhone,
    isDefault: !!a.isDefault,
    serviceable: s.serviceable,
    serviceabilityMessage: s.serviceable ? undefined : s.message,
  }
}

/** An address is "in use" while any non-final booking (projected from its lead) references it. */
async function hasOpenBooking(customerId, addressId) {
  const reqs = await ServiceRequest.find({ customerId, addressId }).select('leadId').lean()
  if (reqs.length === 0) {
    return false
  }
  return !!(await Lead.exists({ _id: { $in: reqs.map((r) => r.leadId) }, status: { $nin: ['completed', 'converted', 'cancelled', 'expired'] } }))
}

const owned = async (customerId, id) => {
  const a = await CustomerAddress.findOne({ _id: oid(id, 'address'), customerId, deletedAt: null })
  if (!a) {
    throw E.notFound('That address was not found.')
  }
  return a
}

export async function listAddresses(customerId) {
  const rows = await CustomerAddress.find({ customerId, deletedAt: null }).sort({ isDefault: -1, createdAt: -1 })
  return Promise.all(rows.map(present))
}

async function makeDefault(customerId, id) {
  await CustomerAddress.updateMany({ customerId, _id: { $ne: id } }, { isDefault: false })
  await CustomerAddress.updateOne({ _id: id }, { isDefault: true })
  await Customer.updateOne({ _id: customerId }, { defaultAddressId: id })
}

export async function createAddress(customerId, input) {
  const { limits } = await loadConfig()
  const count = await CustomerAddress.countDocuments({ customerId, deletedAt: null })
  if (count >= limits.maxAddresses) {
    throw E.conflict(`You can save up to ${limits.maxAddresses} addresses. Delete one to add another.`, 'ADDRESS_LIMIT_REACHED')
  }
  const { lat, lng, ...fields } = input
  const a = await CustomerAddress.create({ ...fields, customerId, isDefault: false })
  if (input.isDefault || count === 0) {
    await makeDefault(customerId, a._id)
  }
  return present(await CustomerAddress.findById(a._id))
}

export async function updateAddress(customerId, id, input) {
  const a = await owned(customerId, id)
  const { lat, lng, isDefault, ...fields } = input
  a.set(fields)
  await a.save()
  if (isDefault) {
    await makeDefault(customerId, a._id)
  }
  return present(await CustomerAddress.findById(a._id))
}

export async function deleteAddress(customerId, id) {
  const a = await owned(customerId, id)
  const inUse = await hasOpenBooking(customerId, a._id)
  if (inUse) {
    throw E.conflict('This address is used by an active booking.', 'ADDRESS_IN_USE')
  }
  a.deletedAt = new Date()
  a.isDefault = false
  await a.save()
  if (a.isDefault || (await Customer.exists({ _id: customerId, defaultAddressId: a._id }))) {
    const next = await CustomerAddress.findOne({ customerId, deletedAt: null }).sort({ createdAt: -1 })
    await Customer.updateOne({ _id: customerId }, { defaultAddressId: next?._id || null })
    if (next) {
      await makeDefault(customerId, next._id)
    }
  }
}

export async function setDefaultAddress(customerId, id) {
  const a = await owned(customerId, id)
  await makeDefault(customerId, a._id)
}

export const getOwnedAddress = owned
