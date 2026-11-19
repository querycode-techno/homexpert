import PDFDocument from 'pdfkit'
import Lead from '@/lib/models/lead'
import { ServiceRequest } from '@/lib/models/booking'
import { Customer } from '@/lib/models/customerAccount'
import { E } from '@/lib/platform/errors'
import { signInvoiceToken } from '@/lib/platform/auth'
import { money } from '@/lib/platform/money'
import { loadConfig } from './config'
import { oid } from './catalog'
import { statusOf } from './booking'

const inr = (paise) => `Rs. ${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

async function loadInvoiceData(requestId) {
  const req = await ServiceRequest.findById(requestId).lean()
  if (!req) throw E.notFound('We could not find that booking.')
  const lead = await Lead.findById(req.leadId).lean()
  const finalPaise = lead?.finalAmountPaise ?? req.payment?.finalAmountPaise ?? (lead?.actualServiceCost ? Math.round(lead.actualServiceCost * 100) : null)
  if (!lead || statusOf(lead) !== 'completed' || finalPaise == null || lead.quotePending) {
    throw E.notFound('Your invoice is not ready yet. It is available once the service is completed.', 'INVOICE_NOT_READY')
  }
  return { req, lead, finalPaise }
}

/** Link to the invoice for this customer's booking (valid 10 minutes). */
export async function invoiceLink(customerId, bookingId, origin) {
  const req = await ServiceRequest.findOne({ _id: oid(bookingId, 'booking'), customerId }).select('_id')
  if (!req) throw E.notFound('We could not find that booking.')
  await loadInvoiceData(req._id)
  return { url: `${origin}/api/v1/invoices/${signInvoiceToken(req._id)}`, expiresAt: new Date(Date.now() + 600_000).toISOString() }
}

/** Render the GST invoice / receipt PDF to a Buffer. */
export async function renderInvoice(requestId) {
  const { req, lead, finalPaise } = await loadInvoiceData(requestId)
  const cfg = await loadConfig()
  const customer = await Customer.findById(req.customerId).select('name phone').lean()
  const taxPct = req.pricing?.tax?.pct ?? 18
  const taxPaise = req.pricing?.tax?.inclusive === false ? 0 : Math.floor((finalPaise * taxPct) / (100 + taxPct) + 0.5)
  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Invoice HXI-${req.displayId}`, Author: cfg.invoice.legalName } })
  const chunks = []
  doc.on('data', (c) => chunks.push(c))
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  doc.fontSize(20).text(cfg.invoice.legalName, { continued: false })
  doc.fontSize(9).fillColor('#555').text([cfg.invoice.address, cfg.invoice.gstin ? `GSTIN: ${cfg.invoice.gstin}` : '', cfg.invoice.pan ? `PAN: ${cfg.invoice.pan}` : ''].filter(Boolean).join('\n'))
  doc.moveDown().fillColor('#000').fontSize(14).text('TAX INVOICE / RECEIPT')
  doc.fontSize(10).moveDown(0.5)
  doc.text(`Invoice no: HXI-${req.displayId}`).text(`Booking ID: ${req.displayId}`).text(`Date: ${new Date(lead.completedAt || lead.updatedAt || Date.now()).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
  doc.moveDown().text('Billed to', { underline: true }).text(`${req.addressSnapshot?.contactName || customer?.name || ''}  ${customer?.phone || ''}`).text(`${req.addressSnapshot?.line1 || ''}, ${req.addressSnapshot?.city || ''} ${req.addressSnapshot?.pincode || ''}`)
  doc.moveDown().text('Service', { underline: true })
  req.lines.forEach((l) => doc.text(`${req.service?.name} - ${l.name}  x ${l.quantity}   (estimate ${inr(l.lineTotalPaise)})`))
  if (req.promo?.discountPaise) doc.text(`Promo ${req.promo.code}: -${inr(req.promo.discountPaise)}`)
  doc.moveDown().fontSize(11).text(`Final amount charged: ${inr(finalPaise)}`)
  doc.fontSize(10).text(`Includes GST @ ${taxPct}%: ${inr(taxPaise)}`)
  doc.text(`Payment: paid directly to your Xpert after service (${lead.paymentMethod || 'cash/UPI'}).`)
  doc.moveDown(2).fontSize(8).fillColor('#777').text('This is a computer-generated document and does not require a signature. Prices include applicable taxes unless stated.')
  doc.end()
  return { pdf: await done, filename: `HXI-${req.displayId}.pdf`, total: money(finalPaise) }
}
