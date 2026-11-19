import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { connect } from '@/lib/platform/mongo'
import { runJobs } from '@/lib/domain/jobs'

/** Triggered by the platform scheduler (every minute). Authenticated with a shared secret, never exposed to apps. */
export async function POST(req) {
  const secret = process.env.CRON_SECRET
  const given = req.headers.get('x-cron-secret') || ''
  const ok = secret && given.length === secret.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(secret))
  if (!ok) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not allowed.' } }, { status: 403 })
  }
  await connect()
  return NextResponse.json({ success: true, data: await runJobs() })
}
