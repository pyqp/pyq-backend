import mongoose, { Schema, Document } from 'mongoose';

export interface IReferral {
  referrer: mongoose.Types.ObjectId; // User who referred
  referred: mongoose.Types.ObjectId; // User who was referred
  referralCode: string;
  status: 'pending' | 'completed' | 'expired';
  signupDate: Date;
  purchaseDate?: Date;
  purchaseAmount?: number;
  creditsAwarded: number;
  bonusCreditsAwarded: number;
  isFirstPurchase: boolean;
}

export interface IReferralDocument extends IReferral, Document {
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferralDocument>(
  {
    referrer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referred: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'expired'],
      default: 'pending',
    },
    signupDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    purchaseDate: Date,
    purchaseAmount: Number,
    creditsAwarded: {
      type: Number,
      default: 0,
    },
    bonusCreditsAwarded: {
      type: Number,
      default: 0,
    },
    isFirstPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referred: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ status: 1, createdAt: -1 });

// Unique index to prevent duplicate referrals
referralSchema.index({ referrer: 1, referred: 1 }, { unique: true });

const Referral = mongoose.model<IReferralDocument>('Referral', referralSchema);

export default Referral;