import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'error'],
    default: 'info',
  },
  link: {
    type: String,   
    required: false,
  },
});

const Notification =  mongoose.models.Notification || mongoose.model('Notification', notificationSchema) ;

export default Notification;