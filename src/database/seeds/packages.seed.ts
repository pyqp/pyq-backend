import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../../config/database.config';
import Package from '../../models/Package.model';
import logger from '../../utils/logger';

const packagesData = [
  {
    name: 'BASIC',
    displayName: 'Basic',
    price: 199,
    discountedPrice: 149,
    credits: 1,
    validityDays: 365,
    description: 'Perfect for trying out a single mock test with full analytics.',
    isPopular: false,
    isActive: true,
    badge: '',
    color: '#6B7280',
    orderPriority: 1,
    limitations: { solutionsAccess: false },
    features: [
      '1 Mock Test Credit',
      'Valid for 365 days',
      'All India Rankings',
      'Basic Performance Analytics',
      'Subject-wise Score Breakdown',
      'Email Support',
    ],
    benefits: [
      'Try our platform risk-free',
      'Full mock test experience',
      'Compare with toppers',
    ],
    compareWith: 'Best for first-timers',
    metaTitle: 'PYQPB Basic Package – ₹149 for 1 Mock Test',
    metaDescription: 'Start your exam preparation with 1 mock test credit valid for 1 year.',
  },
  {
    name: 'BEST_VALUE',
    displayName: 'Best Value',
    price: 499,
    discountedPrice: 399,
    credits: 5,
    validityDays: 365,
    description: 'Most popular choice — 5 tests with complete solutions at the best per-test price.',
    isPopular: true,
    isActive: true,
    badge: 'BEST VALUE',
    color: '#10B981',
    orderPriority: 2,
    limitations: { solutionsAccess: true },
    features: [
      '5 Mock Test Credits',
      'Valid for 365 days',
      'All India Rankings',
      'Detailed Performance Analytics',
      'Complete Text Solutions Included',
      'Strength & Weakness Analysis',
      'Time Management Insights',
      'Priority Email Support',
    ],
    benefits: [
      'Only ₹80 per test',
      'Save ₹100 vs 5× Basic',
      'Full solutions for every question',
      'Track improvement over 5 attempts',
    ],
    compareWith: 'Save ₹100 compared to buying 5 Basic packs',
    metaTitle: 'PYQPB Best Value Package – ₹399 for 5 Mock Tests',
    metaDescription: 'Get 5 mock test credits with complete solutions valid for 1 year at just ₹80/test.',
  },
  {
    name: 'PREMIUM',
    displayName: 'Premium',
    price: 799,
    discountedPrice: 649,
    credits: 10,
    validityDays: 365,
    description: 'Ultimate preparation package — 10 tests, detailed analytics, and 24/7 support.',
    isPopular: false,
    isActive: true,
    badge: 'MOST POPULAR',
    color: '#8B5CF6',
    orderPriority: 3,
    limitations: { solutionsAccess: true },
    features: [
      '10 Mock Test Credits',
      'Valid for 365 days',
      'All India Rankings',
      'Advanced Analytics Dashboard',
      'Complete Text Solutions Included',
      'Detailed Strength & Weakness Report',
      'Time Management Deep-Dive',
      'Topic-wise Performance Tracking',
      'Difficulty-wise Analysis',
      'Downloadable PDF Score Card',
      'Priority Support (24/7)',
      'Personalized Weak Area Focus',
    ],
    benefits: [
      'Only ₹65 per test — lowest price',
      'Save ₹300 vs 10× Basic',
      'Most comprehensive analytics',
      'Full test history tracking',
      '24/7 dedicated support',
    ],
    compareWith: 'Save ₹300 compared to buying 10 Basic packs',
    metaTitle: 'PYQPB Premium Package – ₹649 for 10 Mock Tests',
    metaDescription: 'Best value with 10 credits, advanced analytics and 24/7 support valid for 1 year.',
  },
];

const seedPackages = async () => {
  try {
    await connectDB();

    const existingCount = await Package.countDocuments();
    if (existingCount > 0) {
      logger.info(`Skipping — ${existingCount} packages already exist.`);
      process.exit(0);
    }

    const created = await Package.insertMany(packagesData);
    logger.info(`✅ ${created.length} packages seeded successfully!`);
    process.exit(0);
  } catch (error: any) {
    logger.error(`Error seeding packages: ${error.message}`);
    process.exit(1);
  }
};

seedPackages();