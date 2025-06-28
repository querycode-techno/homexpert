import { NextResponse } from 'next/server';
import lead from '@/lib/models/lead';
import subscriptionHistory from '@/lib/models/SubscriptionHistory';
import vendor from '@/lib/models/vendor';
import connectDB from '@/lib/connnectDB';

export async function GET(req) {
    try {
        await connectDB();
        // Get all stats in parallel using Promise.all
        const [leadStats, revenueStats, vendorStats] = await Promise.all([
            // Lead statistics
            lead.aggregate([
                {
                    $facet: {
                        totalLeads: [{ $count: "count" }],
                        activeLeads: [
                            {
                                $match: {
                                    status: {
                                        $in: [
                                            'available',
                                            'assigned', 
                                            'unassigned',
                                            'taken',
                                            'contacted',
                                            'interested',
                                            'not_interested',
                                            'scheduled',
                                            'in_progress'
                                        ]
                                    }
                                }
                            },
                            { $count: "count" }
                        ]
                    }
                }
            ]),
            
            // Revenue statistics
            subscriptionHistory.aggregate([
                {
                    $match: {
                        "payment.paymentStatus": "completed"
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$payment.amount" },
                        count: { $sum: 1 }
                    }
                }
            ]),
            
            // Vendor statistics
            vendor.aggregate([
                {
                    $match: { status: 'active' }
                },
                {
                    $count: "count"
                }
            ])
        ]);

        // Extract values from aggregation results
        const totalLeads = leadStats[0]?.totalLeads[0]?.count || 0;
        const totalActiveLeads = leadStats[0]?.activeLeads[0]?.count || 0;
        const totalRevenue = revenueStats[0]?.totalAmount || 0;
        const totalActiveVendors = vendorStats[0]?.count || 0;

        return NextResponse.json({
            totalLeads,
            totalActiveLeads,
            totalRevenue,
            totalActiveVendors
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json(
            { error: 'Error fetching dashboard stats' }, 
            { status: 500 }
        );
    }
}