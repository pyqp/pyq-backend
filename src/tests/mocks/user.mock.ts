import mongoose from 'mongoose';

export const mockUserId  = new mongoose.Types.ObjectId().toString();
export const mockAdminId = new mongoose.Types.ObjectId().toString();

export const mockUserData = {
  _id:             mockUserId,
  name:            'Test User',
  email:           'test@pyqpb.com',
  password:        'Test@12345',
  role:            'user',
  isEmailVerified: true,
  isActive:        true,
  referralCode:    'TESTUSER01',
  credits: {
    total:       5,
    batches:     [{ batchId: 'BATCH_001', packageName: 'Starter', creditsReceived: 5, creditsUsed: 0, creditsRemaining: 5, purchaseDate: new Date(), expiryDate: new Date(Date.now() + 365 * 86400000), status: 'active' }],
    lastUpdated: new Date(),
  },
  loyaltyPoints:  { total: 0, earnedAllTime: 0, redeemedAllTime: 0, level: 'bronze', levelName: 'Bronze', pointsToNextLevel: 100, dailyLoginClaimed: false },
  referralStats:  { totalReferred: 0, totalPurchased: 0, creditsEarned: 0, bonusCreditsEarned: 0, totalValue: 0, milestone10Claimed: false, milestone50Claimed: false },
  preferences:    { targetExams: ['UPSC CSE'], language: 'english', emailNotifications: true, smsNotifications: false },
  stats:          { totalTestsTaken: 0, totalTimeSpent: 0, averageScore: 0, bestScore: 0 },
};

export const mockAdminData = {
  ...mockUserData,
  _id:   mockAdminId,
  name:  'Admin User',
  email: 'admin@pyqpb.com',
  role:  'admin',
};

export const mockLoginBody = {
  email:    'test@pyqpb.com',
  password: 'Test@12345',
};

export const mockRegisterBody = {
  name:     'New User',
  email:    'new@pyqpb.com',
  password: 'NewUser@123',
  phone:    '9876543210',
};