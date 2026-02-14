import mongoose, { Schema, Document } from 'mongoose';

export interface ICreditTransaction {
  user: mongoose.Types.ObjectId;
  type: 'credit' | 'debit';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  source: 'purchase' | 'referral' | 'bonus' | 'test_usage' | 'admin' | 'refund';
  reference?: mongoose.Types.ObjectId; // Payment ID or Test ID
  referenceModel?: 'Payment' | 'TestAttempt' | 'Referral';
  description: string;
  batchId?: string; // For tracking credit batches
  expiryDate?: Date;
  metadata?: any;
}

export interface ICreditTransactionDocument extends ICreditTransaction, Document {
  createdAt: Date;
  updatedAt: Date;
}

const creditTransactionSchema = new Schema<ICreditTransactionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceBefore: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    source: {
      type: String,
      enum: ['purchase', 'referral', 'bonus', 'test_usage', 'admin', 'refund'],
      required: true,
    },
    reference: {
      type: Schema.Types.ObjectId,
      refPath: 'referenceModel',
    },
    referenceModel: {
      type: String,
      enum: ['Payment', 'TestAttempt', 'Referral'],
    },
    description: {
      type: String,
      required: true,
    },
    batchId: String,
    expiryDate: Date,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
creditTransactionSchema.index({ user: 1, createdAt: -1 });
creditTransactionSchema.index({ type: 1 });
creditTransactionSchema.index({ source: 1 });
creditTransactionSchema.index({ batchId: 1 });

const CreditTransaction = mongoose.model<ICreditTransactionDocument>(
  'CreditTransaction',
  creditTransactionSchema
);

export default CreditTransaction;