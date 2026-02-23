import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import { generateReferralCode, generateBatchId, addDays } from '../utils/helpers';

// User Interface
export interface IUser {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: Date;
  role: 'user' | 'admin' | 'partner';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpire?: Date;
  passwordResetToken?: string;
  passwordResetExpire?: Date;
  referralCode: string;
  referredBy?: mongoose.Types.ObjectId;
  googleId?: string;
  
  credits: {
    total: number;
    batches: Array<{
      batchId: string;
      packageName: string;
      creditsReceived: number;
      creditsUsed: number;
      creditsRemaining: number;
      purchaseDate: Date;
      expiryDate: Date;
      status: 'active' | 'expired';
    }>;
    lastUpdated: Date;
  };
  
  referralStats: {
    totalReferred: number;
    totalPurchased: number;
    creditsEarned: number;
    bonusCreditsEarned: number;
    totalValue: number;
    lastReferralDate?: Date;
    milestone10Claimed: boolean;
    milestone50Claimed: boolean;
  };
  
  loyaltyPoints: {
    total: number;
    earnedAllTime: number;
    redeemedAllTime: number;
    level: 'bronze' | 'silver' | 'gold' | 'platinum';
    levelName: string;
    pointsToNextLevel: number;
    lastEarnedDate?: Date;
    lastRedeemedDate?: Date;
    lastLoginDate?: Date;
    dailyLoginClaimed: boolean;
  };
  
  preferences: {
    targetExams: string[];
    language: 'english' | 'hindi';
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  
  stats: {
    totalTestsTaken: number;
    totalTimeSpent: number;
    averageScore: number;
    bestScore: number;
  };
  
  isActive: boolean;
  lastLogin?: Date;
}

// Extend Document with timestamps
interface IUserMethods {
  matchPassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
  getRefreshToken(): string;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
  addCredits(credits: number, validityDays: number, packageName?: string): Promise<void>;
  deductCredits(credits: number): Promise<boolean>;
  hasValidCredits(required: number): boolean;
}

export interface IUserDocument extends IUser, IUserMethods, Document {
  createdAt: Date;
  updatedAt: Date;
}

// User Schema
const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    avatar: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian phone number'],
      sparse: true,
    },
    dateOfBirth: {
      type: Date,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'partner'],
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    passwordResetToken: String,
    passwordResetExpire: Date,
    referralCode: {
      type: String,
      unique: true,
      uppercase: true,
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    
    // Credits
    credits: {
      total: {
        type: Number,
        default: 0,
        min: 0,
      },
      batches: [
        {
          batchId: String,
          packageName: String,
          creditsReceived: Number,
          creditsUsed: {
            type: Number,
            default: 0,
          },
          creditsRemaining: Number,
          purchaseDate: Date,
          expiryDate: Date,
          status: {
            type: String,
            enum: ['active', 'expired'],
            default: 'active',
          },
        },
      ],
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    
    // Referral Stats
    referralStats: {
      totalReferred: {
        type: Number,
        default: 0,
      },
      totalPurchased: {
        type: Number,
        default: 0,
      },
      creditsEarned: {
        type: Number,
        default: 0,
      },
      bonusCreditsEarned: {
        type: Number,
        default: 0,
      },
      totalValue: {
        type: Number,
        default: 0,
      },
      lastReferralDate: Date,
      milestone10Claimed: {
        type: Boolean,
        default: false,
      },
      milestone50Claimed: {
        type: Boolean,
        default: false,
      },
    },
    
    // Loyalty Points
    loyaltyPoints: {
      total: {
        type: Number,
        default: 0,
        min: 0,
      },
      earnedAllTime: {
        type: Number,
        default: 0,
      },
      redeemedAllTime: {
        type: Number,
        default: 0,
      },
      level: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
        default: 'bronze',
      },
      levelName: {
        type: String,
        default: 'Bronze Member',
      },
      pointsToNextLevel: {
        type: Number,
        default: 1000,
      },
      lastEarnedDate: Date,
      lastRedeemedDate: Date,
      lastLoginDate: Date,
      dailyLoginClaimed: {
        type: Boolean,
        default: false,
      },
    },
    
    // Preferences
    preferences: {
      targetExams: {
        type: [String],
        default: [],
      },
      language: {
        type: String,
        enum: ['english', 'hindi'],
        default: 'english',
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
    },
    
    // Statistics
    stats: {
      totalTestsTaken: {
        type: Number,
        default: 0,
      },
      totalTimeSpent: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      bestScore: {
        type: Number,
        default: 0,
      },
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware - Hash password & generate referral code
userSchema.pre('save', async function (next) {
  // Hash password if modified
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  // Generate referral code if new user
  if (this.isNew && !this.referralCode) {
    this.referralCode = generateReferralCode(this.name);
  }
  
  next();
});

// Method: Match password
userSchema.methods.matchPassword = async function (
  enteredPassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method: Generate JWT access token
userSchema.methods.getSignedJwtToken = function (): string {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRE || '7d' } as SignOptions
  );
};

// Method: Generate JWT refresh token
userSchema.methods.getRefreshToken = function (): string {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' } as SignOptions
  );
};

// Method: Generate email verification token
userSchema.methods.generateEmailVerificationToken = function (): string {
  const token = randomBytes(32).toString('hex');
  
  this.emailVerificationToken = createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.emailVerificationExpire = addDays(new Date(), 1); // 24 hours
  
  return token;
};

// Method: Generate password reset token
userSchema.methods.generatePasswordResetToken = function (): string {
  const token = randomBytes(32).toString('hex');
  
  this.passwordResetToken = createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.passwordResetExpire = addDays(new Date(), 0.04167); // 1 hour
  
  return token;
};

// Method: Add credits
userSchema.methods.addCredits = async function (
  credits: number,
  validityDays: number,
  packageName: string = 'Package'
): Promise<void> {
  const batchId = generateBatchId();
  const purchaseDate = new Date();
  const expiryDate = addDays(purchaseDate, validityDays);
  
  this.credits.batches.push({
    batchId,
    packageName,
    creditsReceived: credits,
    creditsUsed: 0,
    creditsRemaining: credits,
    purchaseDate,
    expiryDate,
    status: 'active',
  });
  
  this.credits.total += credits;
  this.credits.lastUpdated = new Date();
  
  await this.save();
};

// Method: Deduct credits (FIFO)
userSchema.methods.deductCredits = async function (
  required: number
): Promise<boolean> {
  if (!this.hasValidCredits(required)) {
    return false;
  }
  
  let remaining = required;
  
  // Sort batches by purchase date (FIFO - oldest first)
  const activeBatches = this.credits.batches
    .filter((batch: any) => batch.status === 'active' && batch.creditsRemaining > 0)
    .sort((a: any, b: any) => a.purchaseDate.getTime() - b.purchaseDate.getTime());
  
  for (const batch of activeBatches) {
    if (remaining === 0) break;
    
    const toDeduct = Math.min(batch.creditsRemaining, remaining);
    batch.creditsUsed += toDeduct;
    batch.creditsRemaining -= toDeduct;
    remaining -= toDeduct;
    
    if (batch.creditsRemaining === 0) {
      batch.status = 'expired';
    }
  }
  
  this.credits.total -= required;
  this.credits.lastUpdated = new Date();
  
  await this.save();
  return true;
};

// Method: Check if user has valid credits
userSchema.methods.hasValidCredits = function (required: number): boolean {
  if (this.credits.total < required) {
    return false;
  }
  
  const now = new Date();
  const validCredits = this.credits.batches
    .filter((batch: any) => {
      return (
        batch.status === 'active' &&
        batch.creditsRemaining > 0 &&
        new Date(batch.expiryDate) > now
      );
    })
    .reduce((sum: number, batch: any) => sum + batch.creditsRemaining, 0);
  
  return validCredits >= required;
};

const User = mongoose.model<IUserDocument>('User', userSchema);

export default User;