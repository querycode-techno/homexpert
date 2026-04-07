import mongoose from 'mongoose';
import Vendor from '@/lib/models/vendor';
import User from '@/lib/models/user';
import admin from '@/lib/firebase/admin';

const FCM_MULTICAST_LIMIT = 500;

/**
 * Service matching using lead `service` and `selectedService` only (not `selectedSubService`).
 */
function isServiceMatch(leadService, leadSelectedService, vendorServices) {
  if (!vendorServices || vendorServices.length === 0) return false;

  const vendorServicesLower = vendorServices.map((s) => s.toLowerCase().trim());
  const leadServiceLower = leadService?.toLowerCase().trim();
  const leadSelectedServiceLower = leadSelectedService?.toLowerCase().trim();

  if (leadServiceLower && vendorServicesLower.includes(leadServiceLower)) return true;
  if (leadSelectedServiceLower && vendorServicesLower.includes(leadSelectedServiceLower)) return true;

  for (const vendorService of vendorServicesLower) {
    if (leadServiceLower && leadServiceLower.includes(vendorService)) return true;
    if (leadSelectedServiceLower && leadSelectedServiceLower.includes(vendorService)) return true;
  }

  for (const vendorService of vendorServicesLower) {
    if (leadServiceLower && vendorService.includes(leadServiceLower)) return true;
    if (leadSelectedServiceLower && vendorService.includes(leadSelectedServiceLower)) return true;
  }

  return false;
}

/**
 * City-only match: vendor.address.city vs lead city and/or lead address text.
 * Does not use vendor.address.state or vendor.address.serviceAreas.
 */
function isCityMatch(lead, vendorAddress) {
  const vendorCity = vendorAddress?.city;
  if (!vendorCity || !String(vendorCity).trim()) return false;

  const vc = String(vendorCity).toLowerCase().trim();
  if (!vc) return false;

  const leadCity = lead.city && String(lead.city).toLowerCase().trim();
  if (leadCity && leadCity === vc) return true;

  const leadText = buildLeadLocationText(lead).toLowerCase();
  if (leadText && leadText.includes(vc)) return true;

  return false;
}

function buildLeadLocationText(lead) {
  const parts = [lead.address, lead.city, lead.state]
    .filter(Boolean)
    .map((s) => String(s).trim())
    .filter(Boolean);
  return parts.join(', ');
}

function normalizeLead(lead) {
  const obj = lead?.toObject ? lead.toObject() : lead;
  return {
    _id: obj._id,
    service: obj.service,
    selectedService: obj.selectedService,
    address: obj.address,
    city: obj.city,
    state: obj.state,
    customerName: obj.customerName,
  };
}

/**
 * After a new lead is saved, notify vendors whose profile matches service + vendor.address.city.
 * Does not throw — safe to await from API routes; failures are logged and returned in the result.
 */
export async function notifyMatchedVendorsForNewLead(savedLead) {
  const result = {
    success: true,
    matchedVendors: 0,
    notifiedUsers: 0,
    tokensAttempted: 0,
    successCount: 0,
    failureCount: 0,
    skippedNoToken: 0,
    error: null,
  };

  try {
    const lead = normalizeLead(savedLead);

    if (!lead.service) {
      result.success = false;
      result.error = 'Lead missing service';
      return result;
    }

    const vendors = await Vendor.find({ status: { $in: ['active', 'pending'] } })
      .select('user services address')
      .lean();

    const matchedUserIds = new Set();
    for (const v of vendors) {
      if (!v.user || !mongoose.Types.ObjectId.isValid(String(v.user))) continue;
      if (!isServiceMatch(lead.service, lead.selectedService, v.services)) {
        continue;
      }
      if (!isCityMatch(lead, v.address)) continue;
      matchedUserIds.add(String(v.user));
    }

    result.matchedVendors = matchedUserIds.size;
    if (matchedUserIds.size === 0) {
      return result;
    }

    const userIdArray = [...matchedUserIds].map((id) => new mongoose.Types.ObjectId(id));
    const users = await User.find({
      _id: { $in: userIdArray },
      type: 'vendor',
      fcmToken: { $exists: true, $nin: [null, ''] },
    })
      .select('_id fcmToken name')
      .lean();

    const recipients = users
      .map((u) => ({
        userId: u._id,
        token: u.fcmToken && String(u.fcmToken).trim() ? String(u.fcmToken).trim() : null,
        name: u.name,
      }))
      .filter((r) => r.token);

    result.skippedNoToken = matchedUserIds.size - recipients.length;
    if (recipients.length === 0) {
      return result;
    }

    const title = 'New lead near you';
    const serviceLine = lead.selectedService || lead.service || 'Service request';
    const body = `${serviceLine} — ${lead.customerName || 'Customer'}. Open the app to view details.`;

    const baseData = {
      type: 'lead_nearby',
      leadId: String(lead._id),
      service: String(lead.service || ''),
    };

    /** Android channel: system default sound + vibration (not custom tring_tring). */
    const MATCHED_LEAD_CHANNEL_ID = 'homesxpert_leads_silent';

    for (let i = 0; i < recipients.length; i += FCM_MULTICAST_LIMIT) {
      const batch = recipients.slice(i, i + FCM_MULTICAST_LIMIT);
      const tokens = batch.map((r) => r.token);
      result.tokensAttempted += tokens.length;

      try {
        const multicast = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: { title, body },
          data: baseData,
          android: {
            priority: 'high',
            notification: {
              channelId: MATCHED_LEAD_CHANNEL_ID,
              defaultSound: true,
              defaultVibrateTimings: true,
            },
          },
          apns: {
            payload: {
              aps: {
                alert: { title, body },
                sound: 'default',
              },
            },
          },
        });

        result.successCount += multicast.successCount;
        result.failureCount += multicast.failureCount;

        multicast.responses.forEach((resp, idx) => {
          if (resp.success) return;
          const err = resp.error;
          const code = err?.code;
          const userId = batch[idx].userId;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            User.findByIdAndUpdate(userId, { fcmToken: null }).catch(() => {});
          }
        });
      } catch (batchErr) {
        console.error('[leadVendorNotification] multicast batch failed:', batchErr);
        result.failureCount += batch.length;
      }
    }

    result.notifiedUsers = recipients.length;
    return result;
  } catch (e) {
    console.error('[leadVendorNotification]', e);
    result.success = false;
    result.error = e.message || String(e);
    return result;
  }
}
