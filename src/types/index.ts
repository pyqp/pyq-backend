import { Request } from 'express';
import { Document } from 'mongoose';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: IUserDocument;
}

// User Interface
export interface IUser {
  name: string;
  email: string;
  password: string;
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
  referredBy?: string;
  googleId?: string;
  
  // Credits
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
  
  // Referral Stats
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
  
  // Loyalty Points
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
  
  // Preferences
  preferences: {
    targetExams: string[];
    language: 'english' | 'hindi';
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  
  // Statistics
  stats: {
    totalTestsTaken: number;
    totalTimeSpent: number;
    averageScore: number;
    bestScore: number;
  };
  
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  matchPassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
  getRefreshToken(): string;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
  addCredits(credits: number, validityDays: number, packageName?: string): Promise<void>;
  deductCredits(credits: number): Promise<boolean>;
  hasValidCredits(required: number): boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode: number;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Mock Test Types
export interface IQuestion {
  questionNumber: number;
  questionText: string;
  options: string[];
  correctOption: number;
  solution: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  marks: number;
  negativeMarks: number;
}

// Test Attempt
export interface ITestAttempt {
  user: string;
  mockTest: string;
  attemptNumber: number;
  startTime: Date;
  endTime?: Date;
  timeTaken?: number;
  status: 'ongoing' | 'submitted' | 'reviewed';
  responses: Array<{
    questionNumber: number;
    userAnswer?: number;
    timeSpent: number;
    markedForReview: boolean;
  }>;
  score?: number;
  rank?: number;
  percentile?: number;
}

// Payment
export interface IPayment {
  user: string;
  package: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  creditsAwarded: number;
  createdAt: Date;
}

// Offer/Discount
export interface IOffer {
  code: string;
  name: string;
  description: string;
  type: 'festival' | 'birthday' | 'weekend';
  discountPercentage: number;
  maxDiscountAmount: number;
  applicablePackages: string[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  totalUsageLimit: number;
  currentUsageCount: number;
  perUserLimit: number;
}

// Referral
export interface IReferral {
  referrer: string;
  referred: string;
  referralCode: string;
  signupDate: Date;
  purchaseDate?: Date;
  purchaseCompleted: boolean;
  creditAwarded: boolean;
  status: 'pending' | 'completed' | 'expired';
}

// Partner Referral
export interface IPartnerReferral {
  partnerName: string;
  partnerEmail: string;
  partnerType: 'youtuber' | 'influencer' | 'affiliate' | 'company';
  referralCode: string;
  isActive: boolean;
  stats: {
    totalSignups: number;
    totalPurchases: number;
    conversionRate: number;
    totalRevenue: number;
  };
  commissionType: 'percentage' | 'fixed' | 'none';
  commissionValue: number;
  expiryDate?: Date;
}

// Environment Variables
export interface IEnv {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  FRONTEND_URL: string;
  EMAIL_USERNAME: string;
  EMAIL_PASSWORD: string;
}

export type UserRole = 'user' | 'admin' | 'partner';
export type TestStatus = 'ongoing' | 'submitted' | 'reviewed';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';