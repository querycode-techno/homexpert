import { database } from './db'
import { ObjectId } from 'mongodb'

/**
 * Database utility functions using centralized database connection
 * This demonstrates the benefits of the centralized approach
 */

// Example: Generic CRUD operations
export class DatabaseService {
  
  // Generic find with pagination
  static async findWithPagination(collectionName, query = {}, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      projection = {}
    } = options

    const collection = await database.getCollection(collectionName)
    
    const total = await collection.countDocuments(query)
    const items = await collection
      .find(query, { projection })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Generic find by ID
  static async findById(collectionName, id) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid ID format')
    }

    const collection = await database.getCollection(collectionName)
    return await collection.findOne({ _id: new ObjectId(String(id)) })
  }

  // Generic create
  static async create(collectionName, data) {
    const collection = await database.getCollection(collectionName)
    const result = await collection.insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return await collection.findOne({ _id: result.insertedId })
  }

  // Generic update
  static async updateById(collectionName, id, updateData) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid ID format')
    }

    const collection = await database.getCollection(collectionName)
    await collection.updateOne(
      { _id: new ObjectId(String(id)) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    )

    return await collection.findOne({ _id: new ObjectId(String(id)) })
  }

  // Generic delete
  static async deleteById(collectionName, id) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid ID format')
    }

    const collection = await database.getCollection(collectionName)
    const result = await collection.deleteOne({ _id: new ObjectId(String(id)) })
    return result.deletedCount > 0
  }
}

// Specific service classes for different entities
export class RoleService {
  static async getRoleWithPermissions(roleId) {
    const rolesCollection = await database.getRolesCollection()
    const permissionsCollection = await database.getPermissionsCollection()
    
    const role = await rolesCollection.findOne({ _id: new ObjectId(String(roleId)) })
    
    if (!role) return null

    if (role.permissions && role.permissions.length > 0) {
      role.permissions = await permissionsCollection
        .find({ _id: { $in: role.permissions } })
        .toArray()
    } else {
      role.permissions = []
    }

    return role
  }

  static async getRoleUserCount(roleId) {
    const usersCollection = await database.getUsersCollection()
    return await usersCollection.countDocuments({ role: new ObjectId(String(roleId)) })
  }

  static async checkRoleNameExists(name, excludeId = null) {
    const rolesCollection = await database.getRolesCollection()
    const query = { name: name.trim().toLowerCase() }
    
    if (excludeId) {
      query._id = { $ne: new ObjectId(String(excludeId)) }
    }

    const existing = await rolesCollection.findOne(query)
    return !!existing
  }
}

export class UserService {
  static async getUserWithRole(userId) {
    const usersCollection = await database.getUsersCollection()
    const rolesCollection = await database.getRolesCollection()
    
    const user = await usersCollection.findOne({ _id: new ObjectId(String(userId)) })
    
    if (!user) return null

    if (user.role) {
      user.roleDetails = await rolesCollection.findOne({ _id: user.role })
    }

    return user
  }
}

// Transaction helper example
export class TransactionService {
  static async transferUserRole(userId, newRoleId) {
    return await database.withTransaction(async (session) => {
      const usersCollection = await database.getUsersCollection()
      const rolesCollection = await database.getRolesCollection()

      // Verify new role exists
      const newRole = await rolesCollection.findOne(
        { _id: new ObjectId(String(newRoleId)) },
        { session }
      )
      
      if (!newRole) {
        throw new Error('New role not found')
      }

      // Update user role
      await usersCollection.updateOne(
        { _id: new ObjectId(String(userId)) },
        { 
          $set: { 
            role: new ObjectId(String(newRoleId)),
            updatedAt: new Date()
          }
        },
        { session }
      )

      return { success: true, newRole: newRole.name }
    })
  }
}

// Health check utilities
export class HealthService {
  static async checkDatabaseHealth() {
    try {
      const isHealthy = await database.ping()
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: isHealthy ? 'connected' : 'disconnected'
      }
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  }
} 