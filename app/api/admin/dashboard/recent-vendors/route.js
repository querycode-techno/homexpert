import { NextResponse } from 'next/server';
import vendor from '@/lib/models/vendor';
import connectDB from '@/lib/connnectDB';

export async function GET(req) {
    try {
        await connectDB();

        // Get all vendors with only the specified fields
        const vendors = await vendor.find()
            .select('_id businessName services status')
            .sort({ createdAt: -1 }) // Sort by recent first
            .lean(); // Use lean() for better performance
        
        return NextResponse.json({
            success: true,
            data: vendors
        });
        
    } catch (error) {
        console.error('Error fetching vendors:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Error fetching vendors',
                message: error.message 
            }, 
            { status: 500 }
        );
    }
}