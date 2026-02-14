import mongoose, { Schema, Document } from 'mongoose';

export interface IOffer {
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'flat' | 'festival' | 'birthday' | 'weekend';
  discountPercentage?: number;
  discountAmount?: number;
  maxDiscountAmount?: number;
  minPurchaseAmount?: number;
  applicablePackages: mongoose.Types.ObjectId[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  totalUsageLimit?: number;
  currentUsageCount: number;
  perUserLimit: number;
  termsAndConditions: string[];
  eligibilityCriteria?: {
    newUsersOnly?: boolean;
    minTestsTaken?: number;
    specificExams?: mongoose.Types.ObjectId[];
  };
}

export interface IOfferDocument extends IOffer, Document {
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOfferDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'flat', 'festival', 'birthday', 'weekend'],
      required: true,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      min: 0,
    },
    maxDiscountAmount: Number,
    minPurchaseAmount: {
      type: Number,
      default: 0,
    },
    applicablePackages: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Package' }],
      default: [],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalUsageLimit: Number,
    currentUsageCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },
    termsAndConditions: {
      type: [String],
      default: [],
    },
    eligibilityCriteria: {
      newUsersOnly: Boolean,
      minTestsTaken: Number,
      specificExams: [{ type: Schema.Types.ObjectId, ref: 'Exam' }],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
offerSchema.index({ code: 1 });
offerSchema.index({ isActive: 1 });
offerSchema.index({ startDate: 1, endDate: 1 });
offerSchema.index({ type: 1 });

// Method to check if offer is valid
offerSchema.methods.isValid = function (): boolean {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (!this.totalUsageLimit || this.currentUsageCount < this.totalUsageLimit)
  );
};

const Offer = mongoose.model<IOfferDocument>('Offer', offerSchema);

export default Offer;