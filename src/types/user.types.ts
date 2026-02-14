export type UserRole = 'user' | 'admin' | 'partner';
export type LoyaltyLevel = 'bronze' | 'silver' | 'gold' | 'platinum';
export type Language = 'english' | 'hindi';

export interface CreditBatch {
  batchId: string;
  packageName: string;
  creditsReceived: number;
  creditsUsed: number;
  creditsRemaining: number;
  purchaseDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired';
}

export interface UserCredits {
  total: number;
  batches: CreditBatch[];
  lastUpdated: Date;
}

export interface UserStats {
  totalTestsTaken: number;
  totalTimeSpent: number;
  averageScore: number;
  bestScore: number;
}

export interface UserPreferences {
  targetExams: string[];
  language: Language;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface ReferralStats {
  totalReferred: number;
  totalPurchased: number;
  creditsEarned: number;
  bonusCreditsEarned: number;
  totalValue: number;
  lastReferralDate?: Date;
  milestone10Claimed: boolean;
  milestone50Claimed: boolean;
}

export interface LoyaltyPoints {
  total: number;
  earnedAllTime: number;
  redeemedAllTime: number;
  level: LoyaltyLevel;
  levelName: string;
  pointsToNextLevel: number;
  lastEarnedDate?: Date;
  lastRedeemedDate?: Date;
  lastLoginDate?: Date;
  dailyLoginClaimed: boolean;
}

export interface UpdateProfileDTO {
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  avatar?: string;
}

export interface UpdatePreferencesDTO {
  targetExams?: string[];
  language?: Language;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}