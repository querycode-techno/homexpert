import { NextResponse } from 'next/server';
import connectDB from '@/lib/connnectDB';
import Lead from '@/lib/models/lead';


// GET /api/leads/completed - Calculate revenue percentage by service
export async function GET() {
  try {
    await connectDB();

    // Get all completed leads with service and price
    const completedLeads = await Lead.find({ status: 'completed' })
      .select('service price')
      .lean();

    // Calculate total revenue
    const totalRevenue = completedLeads.reduce((sum, lead) => sum + (lead.price || 0), 0);

    // Group by service and calculate percentages
    const serviceRevenue = {};
    
    completedLeads.forEach(lead => {
      const service = lead.service;
      const price = lead.price || 0;
      
      if (!serviceRevenue[service]) {
        serviceRevenue[service] = {
          service: service,
          revenue: 0,
          count: 0,
          percentage: 0
        };
      }
      
      serviceRevenue[service].revenue += price;
      serviceRevenue[service].count += 1;
    });

    // Calculate percentages
    Object.values(serviceRevenue).forEach(service => {
      service.percentage = totalRevenue > 0 ? ((service.revenue / totalRevenue) * 100).toFixed(2) : 0;
    });

    // Convert to array and sort by revenue
    const revenueByService = Object.values(serviceRevenue).sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        revenueByService
      }
    });

  } catch (error) {
    console.error('Error fetching completed leads:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch completed leads'
      },
      { status: 500 }
    );
  }
}