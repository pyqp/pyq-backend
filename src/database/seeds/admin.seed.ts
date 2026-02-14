import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../../models/User.model';
import logger from '../../utils/logger';

dotenv.config();

const seedAdmin = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  const existing = await User.findOne({ email: 'admin@pyqpb.com' });
  if (existing) {
    logger.info('Admin already exists — skipping');
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name:            'PYQPB Admin',
    email:           'admin@pyqpb.com',
    password:        process.env.ADMIN_PASSWORD || 'Admin@123456',
    role:            'admin',
    isEmailVerified: true,
    isActive:        true,
    referralCode:    'ADMIN0000',
    credits:         { total: 0, batches: [], lastUpdated: new Date() },
    loyaltyPoints:   { total: 0, earnedAllTime: 0, redeemedAllTime: 0, level: 'platinum', levelName: 'Platinum', pointsToNextLevel: 0, dailyLoginClaimed: false },
    referralStats:   { totalReferred: 0, totalPurchased: 0, creditsEarned: 0, bonusCreditsEarned: 0, totalValue: 0, milestone10Claimed: false, milestone50Claimed: false },
    preferences:     { targetExams: [], language: 'english', emailNotifications: true, smsNotifications: false },
    stats:           { totalTestsTaken: 0, totalTimeSpent: 0, averageScore: 0, bestScore: 0 },
  });

  logger.info('✅ Admin user seeded: admin@pyqpb.com');
  await mongoose.disconnect();
};

seedAdmin().catch(err => { console.error(err); process.exit(1); });