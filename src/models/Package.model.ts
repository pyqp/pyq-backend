import mongoose, { Schema, Document } from 'mongoose';

export interface IPackage {
  name: string;
  displayName: string;
  price: number;
  discountedPrice?: number;
  credits: number;
  validityDays: number;
  features: string[];
  description: string;
  isPopular: boolean;
  isActive: boolean;
  savings?: number;
  badge?: string;
  color: string;
  orderPriority: number;
  limitations?: {
    maxTestsPerDay?: number;
    maxDownloadsPerDay?: number;
    solutionsAccess: boolean;
  };
  benefits: string[];
  compareWith?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface IPackageDocument extends IPackage, Document {
  createdAt: Date;
  updatedAt: Date;
}

const packageSchema = new Schema<IPackageDocument>(
  {
    name: {
      type: String,
      required: [true, 'Please provide package name'],
      unique: true,
      trim: true,
      uppercase: true,
      // ── UPDATED: matches new business tiers ─────────────────────────────
      enum: ['STARTER', 'VALUE', 'PRO'],
    },
    displayName: {
      type: String,
      required: [true, 'Please provide display name'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide price'],
      min: [0, 'Price cannot be negative'],
    },
    discountedPrice: {
      type: Number,
      min: [0, 'Discounted price cannot be negative'],
    },
    credits: {
      type: Number,
      required: [true, 'Please provide credits'],
      min: [1, 'Credits must be at least 1'],
    },
    validityDays: {
      type: Number,
      required: [true, 'Please provide validity in days'],
      min: [1, 'Validity must be at least 1 day'],
    },
    features: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v && v.length > 0,
        message: 'Package must have at least one feature',
      },
    },
    description: {
      type: String,
      required: [true, 'Please provide description'],
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    isPopular: { type: Boolean, default: false },
    isActive:  { type: Boolean, default: true  },
    savings:   { type: Number,  default: 0     },
    badge: {
      type: String,
      enum: ['BEST SELLER', 'MOST POPULAR', 'BEST VALUE', 'BEST DEAL', 'RECOMMENDED', ''],
      default: '',
    },
    color:         { type: String, default: '#4F46E5' },
    orderPriority: { type: Number, default: 0 },
    limitations: {
      maxTestsPerDay:      Number,
      maxDownloadsPerDay:  Number,
      solutionsAccess: { type: Boolean, default: false },
    },
    benefits:       { type: [String], default: [] },
    compareWith:    { type: String },
    metaTitle:       String,
    metaDescription: String,
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
packageSchema.index({ name: 1 });
packageSchema.index({ isActive: 1 });
packageSchema.index({ isPopular: -1 });
packageSchema.index({ orderPriority: 1 });
packageSchema.index({ price: 1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
packageSchema.virtual('costPerCredit').get(function () {
  return Math.round((this.discountedPrice || this.price) / this.credits);
});

packageSchema.virtual('validityMonths').get(function () {
  return Math.round(this.validityDays / 30);
});

packageSchema.virtual('discountPercentage').get(function () {
  if (this.discountedPrice && this.price > this.discountedPrice) {
    return Math.round(((this.price - this.discountedPrice) / this.price) * 100);
  }
  return 0;
});

// ── Pre-save: auto-calculate savings ─────────────────────────────────────────
packageSchema.pre('save', function (next) {
  if (this.discountedPrice && this.price > this.discountedPrice) {
    this.savings = this.price - this.discountedPrice;
  }
  next();
});

const Package = mongoose.model<IPackageDocument>('Package', packageSchema);
export default Package;