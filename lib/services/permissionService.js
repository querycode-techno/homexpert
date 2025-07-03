import { database } from '@/lib/db'
import { ObjectId } from 'mongodb'

export class PermissionService {
  static async getUserPermissions(roleId) {
    try {
      const db = await database.getDb()
      
      const role = await db.collection('roles').findOne({ 
        _id: new ObjectId(roleId) 
      }, { projection: { permissions: 1 } })
      
      if (!role?.permissions || role.permissions.length === 0) {
        return []
      }

      const permissions = await db.collection('permissions').find({
        _id: { $in: role.permissions }
      }, { projection: { module: 1, action: 1, resource: 1 } }).toArray()
      
      return permissions
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      return []
    }
  }

  static async refreshUserPermissions(userId) {
    try {
      const db = await database.getDb()
      
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { role: 1 } }
      )
      
      if (!user?.role) {
        return []
      }

      return await this.getUserPermissions(user.role.toString())
    } catch (error) {
      console.error('Error refreshing user permissions:', error)
      return []
    }
  }
} 