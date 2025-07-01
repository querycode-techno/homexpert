import { NextResponse } from 'next/server'
import connectDB from '@/lib/connnectDB'
import User from '@/lib/models/user'
import Notification from '@/lib/models/notification'
import admin from '@/lib/firebase/admin'

export async function POST(request) {
    try {
        await connectDB();
        const { title, message, type, link, createdBy, date, time } = await request.json();

        // get all admins userId and fcmToken from users collection
        const admins = await User.find({ type: "admin" }).select("_id fcmToken");

        // update notification collection with the data
        const notification = await Notification.create({
            title,
            message,
            type,
            target: "admin",
            link,
            createdBy,
            date,
            time,
        });

        await notification.save();

        // send notification to all admins
        const tokens = admins.map(admin => admin.fcmToken).filter(Boolean);

        const mesg = {
            notification: {
                title,
                body: message,
            },
            data: {
                link: link || "",
                type: type || "",
            },
        };

        let sendResult = null;

        if (tokens.length === 1) {
            // Send to a Single Token
            sendResult = await admin.messaging().send({ ...mesg, token: tokens[0] });
            console.log('Successfully sent message to single token:', sendResult);
        } else if (tokens.length > 1) {
            // Send to Multiple Tokens
            sendResult = await admin.messaging().sendEachForMulticast({ ...mesg, tokens });
            console.log('Sent messages to multiple tokens. Success count:', sendResult.successCount);
            console.log('Failure count:', sendResult.failureCount);
        }

        return NextResponse.json({ success: true, message: "Notification created successfully", users: admins, sendResult }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}