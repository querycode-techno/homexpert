import { NextResponse } from 'next/server'
import { connect } from '@/lib/platform/mongo'
import { verifyToken } from '@/lib/platform/auth'
import { renderInvoice } from '@/lib/domain/invoice'

/** Serves the invoice PDF for a valid, unexpired link token (the token is the credential; see invoiceLink). */
export async function GET(req, { params }) {
  const { token } = await params
  let requestId
  try {
    requestId = verifyToken(token, { audience: 'hx-invoice' }).sub
  } catch {
    return NextResponse.json({ success: false, error: { code: 'LINK_EXPIRED', message: 'This invoice link has expired. Open the booking and try again.' } }, { status: 401 })
  }
  await connect()
  try {
    const { pdf, filename } = await renderInvoice(requestId)
    return new NextResponse(pdf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${filename}"`, 'Cache-Control': 'private, no-store' } })
  } catch (e) {
    return NextResponse.json({ success: false, error: { code: e.code || 'INTERNAL_ERROR', message: e.message } }, { status: e.status || 500 })
  }
}
