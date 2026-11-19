import { Category, Service, City, ServiceArea, SlotTemplate, FeeRule } from '@/lib/models/catalogue'
import { Customer, CustomerAddress, Consent } from '@/lib/models/customerAccount'
import { AppConfig } from '@/lib/models/customerPlatform'
import { Cart, Review, ServiceRequest, Promo } from '@/lib/models/booking'
import AuditLog from '@/lib/models/auditLog'
import { clearConfigCache } from '@/lib/domain/config'

/**
 * Registry of admin-managed customer-platform data. `roles` are the staff roles allowed (admin is always allowed);
 * `fields` are the only writable properties (everything else is ignored, so ids/timestamps/aggregates can't be forged).
 */
export const RESOURCES = {
  categories: { model: Category, roles: ['admin'], search: ['name', 'slug'], sort: { sortOrder: 1, name: 1 }, fields: ['slug', 'name', 'iconUrl', 'imageUrl', 'sortOrder', 'status', 'taxClass', 'cityIds'] },
  services: { model: Service, roles: ['admin'], search: ['name', 'slug', 'shortDescription'], sort: { name: 1 }, fields: ['categoryId', 'slug', 'name', 'shortDescription', 'description', 'imageUrl', 'gallery', 'inclusions', 'exclusions', 'howItWorks', 'warranty', 'faqs', 'subServices', 'taxClass', 'badges', 'popularityScore', 'status'], bump: 'catalogVersion' },
  cities: { model: City, roles: ['admin'], search: ['name'], sort: { name: 1 }, fields: ['name', 'state', 'isActive', 'launchedAt'] },
  'service-areas': { model: ServiceArea, roles: ['admin'], search: ['pincode'], sort: { pincode: 1 }, fields: ['cityId', 'pincode', 'categoryIds', 'status'] },
  'slot-templates': { model: SlotTemplate, roles: ['admin'], search: [], sort: { createdAt: 1 }, fields: ['cityId', 'windows', 'leadTimeMinutes', 'maxPerWindow', 'daysAhead', 'holidays', 'urgentSurchargeNote'] },
  'fee-rules': { model: FeeRule, roles: ['admin'], search: ['code', 'label'], sort: { code: 1 }, fields: ['code', 'label', 'type', 'amountPaise', 'pct', 'active'] },
  'app-config': { model: AppConfig, roles: ['admin'], search: ['key'], sort: { key: 1 }, fields: ['key', 'value'], afterWrite: () => clearConfigCache() },
  promos: { model: Promo, roles: ['admin'], search: ['code', 'title'], sort: { createdAt: -1 }, fields: ['code', 'title', 'description', 'type', 'valuePaise', 'pct', 'maxDiscountPaise', 'minSubtotalPaise', 'validFrom', 'validUntil', 'totalLimit', 'perCustomerLimit', 'showInOffers', 'status'], filters: ['status'] },
  customers: { model: Customer, roles: ['admin', 'helpline'], search: ['phone', 'name', 'email'], sort: { createdAt: -1 }, fields: ['status'], noCreate: true, noDelete: true, filters: ['status'] },
  reviews: { model: Review, roles: ['admin', 'helpline'], search: ['text', 'authorName'], sort: { createdAt: -1 }, fields: ['status'], noCreate: true, noDelete: true, filters: ['status'] },
  carts: { model: Cart, roles: ['admin', 'helpline'], search: [], sort: { lastActivityAt: -1 }, fields: [], noCreate: true, noDelete: true, filters: ['status'] },
  'audit-logs': { model: AuditLog, roles: ['admin'], search: ['entity', 'action', 'actor.name'], sort: { at: -1 }, fields: [], noCreate: true, noDelete: true, filters: ['entity'] },
}

export const extraDetail = {
  customers: async (doc) => ({
    addresses: await CustomerAddress.find({ customerId: doc._id, deletedAt: null }).lean(),
    consents: await Consent.find({ customerId: doc._id }).sort({ at: -1 }).limit(50).lean(),
    bookings: await ServiceRequest.find({ customerId: doc._id }).sort({ createdAt: -1 }).limit(20).select('displayId service.name slot pricing.total lastProjectedStatus createdAt').lean(),
  }),
}
