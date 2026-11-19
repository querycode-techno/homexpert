import mongoose from 'mongoose'

const uri = process.env.MONGODB_URI

/** One cached Mongoose connection per server instance (survives Next.js hot reload and serverless warm starts). */
let cached = globalThis.__hxMongo
if (!cached) {
  cached = globalThis.__hxMongo = { conn: null, promise: null }
}

export async function connect() {
  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }
  if (cached.conn) {
    return cached.conn
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { maxPoolSize: 20, serverSelectionTimeoutMS: 8000 }).then((m) => m)
  }
  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }
  return cached.conn
}

/** Run `fn(session)` in a transaction (requires a replica set; Atlas provides one). */
export async function withTransaction(fn) {
  await connect()
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      result = await fn(session)
    })
    return result
  } finally {
    await session.endSession()
  }
}
