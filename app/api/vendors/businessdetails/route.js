import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';

// GET /api/vendors/businessdetails - Get business details (vendor access)
export async function GET(request) {
  try {
    // Verify vendor authentication
    const authResult = verifyVendorToken(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error, authResult.status);
    }

    const businessSettingsCollection = await database.getBusinessSettingsCollection();
    
    // Get the business settings
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
        name: settings.name || '',
        logo: settings.logo || '',
        phone: settings.phone || '',
        whatsapp: settings.whatsapp || '',
        email: settings.email || '',
        paymentQrCode: settings.paymentQrCode || ''
      }
    });

  } catch (error) {
    console.error('Error fetching business details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch business details' },
      { status: 500 }
    );
  }
}

