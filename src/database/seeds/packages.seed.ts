import dotenv from 'dotenv';
dotenv.config();

// ── NOTE: your local file uses 'database.config', not 'database' ─────────────
// If yours is config/database.ts change the import below to match.
import connectDB from '../../config/database.config';
import Package from '../../models/Package.model';
import logger from '../../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
//  Business rules (source of truth — confirmed by owner)
//  ₹199  →  10 credits  ·  30 days   (1 month)
//  ₹499  →  50 credits  · 365 days   (1 year)
//  ₹799  → 100 credits  · 548 days   (1.5 years / 18 months)
// ─────────────────────────────────────────────────────────────────────────────

const packagesData = [
  {
    name:           'STARTER',
    displayName:    'Starter',
    price:          199,
    credits:        10,
    validityDays:   30,
    description:    'Try it out — 10 credits to attempt any 10 mock tests, valid for 1 month.',
    isPopular:      false,
    isActive:       true,
    badge:          '',
    color:          '#0ea5e9',
    orderPriority:  1,
    limitations:    { solutionsAccess: false },
    features: [
      '10 Mock Test Credits',
      'Valid for 1 Month',
      'All India Rankings',
      'Basic Performance Analytics',
      'Subject-wise Score Breakdown',
      'Email Support',
    ],
    benefits: [
      '₹19.90 per test',
      'Try before committing to a bigger plan',
      'Full mock test experience',
    ],
    compareWith:     'Best for first-timers',
    metaTitle:       'PYQPB Starter – ₹199 for 10 Credits',
    metaDescription: '10 mock test credits valid for 1 month.',
  },
  {
    name:           'VALUE',
    displayName:    'Value',
    price:          499,
    credits:        50,
    validityDays:   365,
    description:    'Best for serious aspirants — 50 credits over a full year at the best per-test price.',
    isPopular:      true,
    isActive:       true,
    badge:          'MOST POPULAR',
    color:          '#f59e0b',
    orderPriority:  2,
    limitations:    { solutionsAccess: true },
    features: [
      '50 Mock Test Credits',
      'Valid for 1 Year',
      'All India Rankings',
      'Detailed Performance Analytics',
      'Complete Text Solutions Included',
      'Strength & Weakness Analysis',
      'Time Management Insights',
      'Priority Email Support',
    ],
    benefits: [
      '₹9.98 per test — 50% cheaper than Starter',
      'Prepare comfortably across an entire year',
      'Full solutions for every question',
    ],
    compareWith:     'Save ₹501 compared to 50× Starter credits',
    metaTitle:       'PYQPB Value – ₹499 for 50 Credits',
    metaDescription: '50 mock test credits valid for 1 year at just ₹9.98/test.',
  },
  {
    name:           'PRO',
    displayName:    'Pro',
    price:          799,
    credits:        100,
    validityDays:   548,
    description:    'For the dedicated topper — 100 credits over 18 months with full analytics and priority support.',
    isPopular:      false,
    isActive:       true,
    badge:          'BEST DEAL',
    color:          '#a855f7',
    orderPriority:  3,
    limitations:    { solutionsAccess: true },
    features: [
      '100 Mock Test Credits',
      'Valid for 18 Months',
      'All India Rankings',
      'Advanced Analytics Dashboard',
      'Complete Text Solutions Included',
      'Detailed Strength & Weakness Report',
      'Time Management Deep-Dive',
      'Topic-wise Performance Tracking',
      'Difficulty-wise Analysis',
      'Downloadable PDF Score Card',
      '24/7 Priority Support',
      'Personalized Weak Area Focus',
    ],
    benefits: [
      '₹7.99 per test — lowest price on platform',
      '18 months to prepare at your own pace',
      'Most comprehensive analytics',
    ],
    compareWith:     'Save ₹1201 compared to 100× Starter credits',
    metaTitle:       'PYQPB Pro – ₹799 for 100 Credits',
    metaDescription: '100 mock test credits valid for 18 months with advanced analytics.',
  },
];

const seedPackages = async () => {
  try {
    await connectDB();

    // Wipe stale data and re-seed cleanly
    await Package.deleteMany({});
    const created = await Package.insertMany(packagesData);
    logger.info(`✅ ${created.length} packages seeded: STARTER / VALUE / PRO`);
    logger.info('Prices: ₹199 (10cr/30d) | ₹499 (50cr/365d) | ₹799 (100cr/548d)');
    process.exit(0);
  } catch (error: any) {
    logger.error(`Error seeding packages: ${error.message}`);
    process.exit(1);
  }
};

seedPackages();