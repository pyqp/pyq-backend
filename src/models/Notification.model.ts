import mongoose, { Schema, Document } from 'mongoose';

export interface INotification {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'payment' | 'result' | 'credit' | 'referral';
  isRead: boolean;
  link?: string;
  metadata?: Record<string, any>;
}

export interface INotificationDocument extends INotification, Document {
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    user:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:   { type: String, required: true, maxlength: 100 },
    message: { type: String, required: true, maxlength: 500 },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'payment', 'result', 'credit', 'referral'],
      default: 'info',
    },
    isRead:   { type: Boolean, default: false, index: true },
    link:     { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model<INotificationDocument>('Notification', notificationSchema);
export default Notification;