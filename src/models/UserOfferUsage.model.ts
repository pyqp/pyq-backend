import mongoose, { Schema, Document } from 'mongoose';

export interface IUserOfferUsage {
  user: mongoose.Types.ObjectId;
  offer: mongoose.Types.ObjectId;
  payment: mongoose.Types.ObjectId;
  discountAmount: number;
  usageDate: Date;
}

export interface IUserOfferUsageDocument extends IUserOfferUsage, Document {
  createdAt: Date;
  updatedAt: Date;
}

const userOfferUsageSchema = new Schema<IUserOfferUsageDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    offer: {
      type: Schema.Types.ObjectId,
      ref: 'Offer',
      required: true,
      index: true,
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    usageDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userOfferUsageSchema.index({ user: 1, offer: 1 });
userOfferUsageSchema.index({ offer: 1, usageDate: -1 });

const UserOfferUsage = mongoose.model<IUserOfferUsageDocument>(
  'UserOfferUsage',
  userOfferUsageSchema
);

export default UserOfferUsage;