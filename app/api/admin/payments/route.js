import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/dal';
import { ObjectId } from 'mongodb';
import connectDB from '@/lib/connnectDB';
import SubscriptionHistory from '@/lib/models/SubscriptionHistory';


// Get all payment transactions history and show on admin payments page
export async function GET(req ) {

  try {
    await connectDB();
    const transactions = await SubscriptionHistory.aggregate([
      {
        $lookup: {
          from: 'users', // collection name in MongoDB (usually lowercase plural)
          localField: 'user',
          foreignField: '_id',
          as: 'vendorInfo'
        }
      },
      { $unwind: { path: '$vendorInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          id: { $ifNull: ['$payment.transactionId', { $toString: '$_id' }] },
          vendor: { $ifNull: ['$vendorInfo.name', 'Unknown'] },
          vendorEmail: '$vendorInfo.email',
          subscriptionName: '$planSnapshot.planName',
          date: { $ifNull: ['$payment.paymentDate', '$createdAt'] },
          amount: '$payment.amount',
          paymentMethod: '$payment.paymentMethod',
          paymentStatus: '$payment.paymentStatus'
        }
      }
    ]);

    return Response.json({ transactions });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch payment transactions' }, { status: 500 });
  }
}
