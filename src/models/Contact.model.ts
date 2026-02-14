import mongoose, { Schema, Document } from 'mongoose';

export interface IContact {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  category: 'general' | 'payment' | 'technical' | 'exam' | 'refund' | 'feedback';
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId?: mongoose.Types.ObjectId;
  adminNote?: string;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  attachments?: string[];
}

export interface IContactDocument extends IContact, Document {
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContactDocument>(
  {
    name:    { type: String, required: true, trim: true, maxlength: 100 },
    email:   { type: String, required: true, trim: true, lowercase: true },
    phone:   { type: String, trim: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    category: {
      type: String,
      enum: ['general', 'payment', 'technical', 'exam', 'refund', 'feedback'],
      default: 'general',
    },
    message: { type: String, required: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    userId:      { type: Schema.Types.ObjectId, ref: 'User' },
    adminNote:   { type: String, maxlength: 1000 },
    resolvedAt:  Date,
    resolvedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
    attachments: { type: [String], default: [] },
  },
  { timestamps: true }
);

contactSchema.index({ status: 1, priority: -1 });
contactSchema.index({ email: 1 });
contactSchema.index({ userId: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ category: 1, status: 1 });

const Contact = mongoose.model<IContactDocument>('Contact', contactSchema);
export default Contact;