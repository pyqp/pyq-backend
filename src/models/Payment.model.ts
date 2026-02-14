import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment {
  user: mongoose.Types.ObjectId;
  package: mongoose.Types.ObjectId;
  orderId: string; // Razorpay order ID
  paymentId?: string; // Razorpay payment ID
  signature?: string; // Razorpay signature for verification
  amount: number;
  currency: string;
  status: 'created' | 'pending' | 'success' | 'failed' | 'refunded';
  creditsAwarded: number;
  validityDays: number;
  method?: string; // card, netbanking, upi, wallet
  notes?: string;
  failureReason?: string;
  refundId?: string;
  refundAmount?: number;
  refundStatus?: 'pending' | 'processed' | 'failed';
  metadata: {
    ip?: string;
    userAgent?: string;
    referralCode?: string;
    offerCode?: string;
  };
}

export interface IPaymentDocument extends IPayment, Document {
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPaymentDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    package: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymentId: {
      type: String,
      index: true,
    },
    signature: String,
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['created', 'pending', 'success', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    creditsAwarded: {
      type: Number,
      required: true,
      min: 0,
    },
    validityDays: {
      type: Number,
      required: true,
      default: 365,
    },
    method: String,
    notes: String,
    failureReason: String,
    refundId: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
    },
    metadata: {
      ip: String,
      userAgent: String,
      referralCode: String,
      offerCode: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model<IPaymentDocument>('Payment', paymentSchema);

export default Payment;