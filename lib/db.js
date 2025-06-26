// This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb
import { MongoClient, ServerApiVersion } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}

let client
let clientPromise

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options)
  }
  client = globalWithMongo._mongoClient
  
  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Database name
const DB_NAME = 'homexpert'

// Database connection utility
class Database {
  constructor() {
    this.client = null
    this.db = null
  }

  async connect() {
    if (!this.client) {
      this.client = await clientPromise
      this.db = this.client.db(DB_NAME)
    }
    return this.db
  }

  async getDb() {
    if (!this.db) {
      await this.connect()
    }
    return this.db
  }

  // Collection getters
  async getRolesCollection() {
    const db = await this.getDb()
    return db.collection('roles')
  }

  async getPermissionsCollection() {
    const db = await this.getDb()
    return db.collection('permissions')
  }

  async getUsersCollection() {
    const db = await this.getDb()
    return db.collection('users')
  }

  async getSubscriptionsCollection() {
    const db = await this.getDb()
    return db.collection('subscriptions')
  }

  async getSubscriptionPlansCollection() {
    const db = await this.getDb()
    return db.collection('subscriptionplans')
  }

  async getSubscriptionHistoryCollection() {
    const db = await this.getDb()
    return db.collection('subscriptionhistories')
  }

  async getBookingsCollection() {
    const db = await this.getDb()
    return db.collection('bookings')
  }

  async getVendorsCollection() {
    const db = await this.getDb()
    return db.collection('vendors')
  }

  async getEmployeesCollection() {
    const db = await this.getDb()
    return db.collection('employees')
  }

  async getLeadsCollection() {
    const db = await this.getDb()
    return db.collection('leads')
  }

  async getPaymentsCollection() {
    const db = await this.getDb()
    return db.collection('payments')
  }

  async getNotificationsCollection() {
    const db = await this.getDb()
    return db.collection('notifications')
  }

  // Generic collection getter
  async getCollection(name) {
    const db = await this.getDb()
    return db.collection(name)
  }

  // Transaction helper
  async withTransaction(callback) {
    const session = this.client.startSession()
    try {
      return await session.withTransaction(callback)
    } finally {
      await session.endSession()
    }
  }

  // Health check
  async ping() {
    try {
      const db = await this.getDb()
      await db.admin().ping()
      return true
    } catch (error) {
      console.error('Database ping failed:', error)
      return false
    }
  }

  // Close connection (for cleanup in tests or graceful shutdown)
  async close() {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.db = null
    }
  }
}

// Create singleton instance
const database = new Database()

// Export both the singleton instance and the original client
export default client // Keep original export for backward compatibility
export { database, clientPromise } 