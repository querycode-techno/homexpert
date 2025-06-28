import { NextResponse } from 'next/server';
import lead from '@/lib/models/lead';
import { requireAdmin } from '@/lib/dal';
import connectDB from '@/lib/connnectDB';

export async function GET(req) {
    try {
        await connectDB();
        // Get all leads with specified fields including timestamps
        const leads = await lead.find()
            .select('_id customerName service price status ')
            .sort({ createdAt: -1 }) // Sort by recent first
            .lean();
        
        return NextResponse.json({
            success: true,
            data: leads
        });
        
    } catch (error) {
        console.error('Error fetching leads:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Error fetching leads',
                message: error.message 
            }, 
            { status: 500 }
        );
    }
}