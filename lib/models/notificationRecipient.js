import mongoose, { Schema } from "mongoose";  

const notificationRecipientSchema = new Schema(
  {
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: "Notification",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userType: {
      type: String,
      enum: [
        "vendor",
        "customer",
        "admin",
        "support_team",
        "user",
        "helpline",
        "telecaller",
      ],
      required: true,
    },

    read: {
      type: Boolean,
      default: false,
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed", "opened"],
      default: "pending",
    },
    deliveryAttempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

notificationRecipientSchema.index({ userId: 1, userType: 1 });
notificationRecipientSchema.index({ notificationId: 1 });

const NotificationRecipient =
  mongoose.models.NotificationRecipient ||
  mongoose.model("NotificationRecipient", notificationRecipientSchema);

export default NotificationRecipient;