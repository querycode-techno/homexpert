import { NextResponse } from 'next/server';
import lead from '@/lib/models/lead';
import connectDB from '@/lib/connnectDB';

export async function GET(req) {
    try {
        await connectDB();
        
        // Calculate last 15 days date range
        const now = new Date();
        const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000));
        
        // Get leads with createdAt and status for last 15 days
        const leadsData = await lead.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: fifteenDaysAgo,
                        $lte: now
                    }
                }
            },
            {
                $project: {
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    status: 1
                }
            },
            {
                $sort: { date: 1 }
            }
        ]);
        
        // Calculate stats per day
        const statsByDate = {};
        for (const lead of leadsData) {
            if (!statsByDate[lead.date]) {
                statsByDate[lead.date] = { 
                    name: new Date(lead.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    bookings: 0, 
                    completed: 0 
                };
            }
            statsByDate[lead.date].bookings += 1;
            if (lead.status === 'completed' || lead.status === 'converted') {
                statsByDate[lead.date].completed += 1;
            }
        }
        
        // Generate array for all 15 days
        const statsArray = [];
        for (let i = 0; i < 15; i++) {
            const currentDate = new Date(fifteenDaysAgo);
            currentDate.setDate(fifteenDaysAgo.getDate() + i);
            const dateString = currentDate.toISOString().split('T')[0];
            const formattedName = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            statsArray.push({
                name: formattedName,
                bookings: statsByDate[dateString]?.bookings || 0,
                completed: statsByDate[dateString]?.completed || 0
            });
        }
        
        return NextResponse.json({
            success: true,
            data: statsArray
        });
        
    } catch (error) {
        console.error('Error fetching leads:', error);
        return NextResponse.json({ error: 'Error fetching leads' }, { status: 500 });
    }
}