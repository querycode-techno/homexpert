

import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    date: {
      type: Date,
      default: () => new Date().toISOString().split("T")[0],
    },
    time: {
      type: String,
      default: () =>
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
    messageType: {
      type: String,
      enum: ["Info", "Warning", "Alert", "Success", "Urgent"],
      default: "Info",
    },
    link: { type: String },
    dataFields: { type: Object },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    target: {
      type: String,
    },
  },
  { timestamps: true }
);

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;




