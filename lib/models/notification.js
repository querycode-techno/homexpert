import mongoose from "mongoose";
import { Schema } from "mongoose";
import User from "./user";

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      default: new Date().toISOString().split("T")[0],
    },
    time:{
        type: String,
        default: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
    read: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["Info", "Warning", "Alert", "Success", "Urgent"],
      default: "Info",
    },
    link: {
      type: String,
      required: false,
    },

    target: {
        type: String,
        enum: ["vendor", "support_team", "customer", "admin", "user"],
    },

    // datafields for specific notification and field
    dataFields: {
      type: Object,
      required: false,
    },

    // Bulk notification fields
    isBulkNotification: {
      type: Boolean,
      default: false,
    },
    
    // for bulk notification
    // bulkNotificationTarget: {
    //   type: String,
    //   enum: ["Vendors", "All Users", "Admin", "Support Team", "Customers"],
    // },

    bulkRecipients: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: function () {
            return this.isBulkNotification;
          },
        },
        userType: {
          type: String,
          enum: ["vendor", "customer", "admin", "support_team", "user"],
          required: function () {
            return this.isBulkNotification;
          },
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
    ],

    // Single recipient fields (for individual notifications)
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    //   required: function () {
    //     return !this.isBulkNotification;
    //   },
    },

    recipientType: {
      type: String,
      enum: ["user", "vendor", "admin", "support_team"],
    //   required: function () {
    //     return !this.isBulkNotification;
    //   },
    },

    // Created by (references User model)
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
notificationSchema.index({ recipientId: 1, read: 1 });
notificationSchema.index({ recipientType: 1, createdAt: -1 });
notificationSchema.index({ "bulkRecipients.userId": 1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;






