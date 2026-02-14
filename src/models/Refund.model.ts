import mongoose, { Schema, Document } from 'mongoose';

export interface IRefund {
  user: mongoose.Types.ObjectId;
  payment: mongoose.Types.ObjectId;
  razorpayRefundId?: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processing' | 'processed' | 'failed' | 'rejected';
  adminNote?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  creditsRevoked: number;
}

export interface IRefundDocument extends IRefund, Document {
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefundDocument>(
  {
    user:             { type: Schema.Types.ObjectId, ref: 'User',    required: true, index: true },
    payment:          { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    razorpayRefundId: { type: String, index: true },
    amount:           { type: Number, required: true, min: 0 },
    reason:           { type: String, required: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'failed', 'rejected'],
      default: 'pending',
      index: true,
    },
    adminNote:         { type: String, maxlength: 1000 },
    processedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
    processedAt:       Date,
    rejectedAt:        Date,
    rejectionReason:   { type: String, maxlength: 500 },
    creditsRevoked:    { type: Number, default: 0 },
  },
  { timestamps: true }
);

refundSchema.index({ status: 1, createdAt: -1 });

const Refund = mongoose.model<IRefundDocument>('Refund', refundSchema);
export default Refund;