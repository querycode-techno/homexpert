import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { phone, newPassword } = await request.json();

    // Validate input
    if (!phone || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Phone number and new password are required'
      }, { status: 400 });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }

    // Get database collections
    const usersCollection = await database.getUsersCollection();
    const vendorsCollection = await database.getVendorsCollection();
    const rolesCollection = await database.getRolesCollection();

    // Find user by phone
    const user = await usersCollection.findOne({ phone: phone.trim() });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No account found with this phone number'
      }, { status: 404 });
    }

    // Get user role
    const role = await rolesCollection.findOne({ _id: user.role });
    
    if (!role || role.name !== 'vendor') {
      return NextResponse.json({
        success: false,
        error: 'This service is only available for vendor accounts'
      }, { status: 403 });
    }

    // Verify vendor exists
    const vendor = await vendorsCollection.findOne({ user: user._id });
    
    if (!vendor) {
      return NextResponse.json({
        success: false,
        error: 'Vendor profile not found'
      }, { status: 404 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );

    // Add password reset entry to vendor history
    await vendorsCollection.updateOne(
      { _id: vendor._id },
      {
        $push: {
          history: {
            action: 'password_reset',
            date: new Date(),
            notes: 'Password reset via mobile app'
          }
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
      data: {
        email: user.email,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 