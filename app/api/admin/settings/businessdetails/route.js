import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { requireAdmin } from '@/lib/dal';

// GET /api/admin/settings/businessdetails - Get business settings
export async function GET(request) {
  try {
    await requireAdmin();

    const businessSettingsCollection = await database.getBusinessSettingsCollection();
    
    // Get the first (and should be only) business settings document
    const settings = await businessSettingsCollection.findOne({});

    if (!settings) {
      // Return default/empty settings if none exist
      return NextResponse.json({
        success: true,
        data: {
          name: '',
          logo: '',
          phone: '',
          whatsapp: '',
          email: '',
          paymentQrCode: ''
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: settings._id.toString(),
        name: settings.name || '',
        logo: settings.logo || '',
        phone: settings.phone || '',
        whatsapp: settings.whatsapp || '',
        email: settings.email || '',
        paymentQrCode: settings.paymentQrCode || '',
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching business settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch business settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/businessdetails - Create business settings
export async function POST(request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { name, logo, phone, whatsapp, email, paymentQrCode } = body;

    // Validate required fields
    if (!name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'Name, phone, and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const businessSettingsCollection = await database.getBusinessSettingsCollection();

    // Check if settings already exist
    const existing = await businessSettingsCollection.findOne({});
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Business settings already exist. Use PUT to update.' },
        { status: 400 }
      );
    }

    // Create new settings
    const result = await businessSettingsCollection.insertOne({
      name,
      logo: logo || '',
      phone,
      whatsapp: whatsapp || '',
      email,
      paymentQrCode: paymentQrCode || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Business settings created successfully',
      data: {
        id: result.insertedId.toString(),
        name,
        logo: logo || '',
        phone,
        whatsapp: whatsapp || '',
        email,
        paymentQrCode: paymentQrCode || ''
      }
    });

  } catch (error) {
    console.error('Error creating business settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create business settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/businessdetails - Update business settings
export async function PUT(request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { name, logo, phone, whatsapp, email, paymentQrCode } = body;

    // Validate required fields
    if (!name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'Name, phone, and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const businessSettingsCollection = await database.getBusinessSettingsCollection();

    // Find existing settings
    const existing = await businessSettingsCollection.findOne({});

    if (!existing) {
      // If no settings exist, create them
      const result = await businessSettingsCollection.insertOne({
        name,
        logo: logo || '',
        phone,
        whatsapp: whatsapp || '',
        email,
        paymentQrCode: paymentQrCode || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return NextResponse.json({
        success: true,
        message: 'Business settings created successfully',
        data: {
          id: result.insertedId.toString(),
          name,
          logo: logo || '',
          phone,
          whatsapp: whatsapp || '',
          email,
          paymentQrCode: paymentQrCode || ''
        }
      });
    }

    // Update existing settings
    const updateResult = await businessSettingsCollection.updateOne(
      { _id: existing._id },
      {
        $set: {
          name,
          logo: logo || '',
          phone,
          whatsapp: whatsapp || '',
          email,
          paymentQrCode: paymentQrCode || '',
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'No changes made' },
        { status: 400 }
      );
    }

    // Get updated document
    const updated = await businessSettingsCollection.findOne({ _id: existing._id });

    return NextResponse.json({
      success: true,
      message: 'Business settings updated successfully',
      data: {
        id: updated._id.toString(),
        name: updated.name,
        logo: updated.logo || '',
        phone: updated.phone,
        whatsapp: updated.whatsapp || '',
        email: updated.email,
        paymentQrCode: updated.paymentQrCode || '',
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating business settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update business settings' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/settings/businessdetails - Delete business settings
export async function DELETE(request) {
  try {
    await requireAdmin();

    const businessSettingsCollection = await database.getBusinessSettingsCollection();

    const result = await businessSettingsCollection.deleteOne({});

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Business settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Business settings deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting business settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete business settings' },
      { status: 500 }
    );
  }
}

