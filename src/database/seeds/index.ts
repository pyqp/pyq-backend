import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../../config/database.config';
import Exam from '../../models/Exam.model';
import Package from '../../models/Package.model';
import logger from '../../utils/logger';
import { execSync } from 'child_process';

const runAllSeeds = async () => {
  try {
    await connectDB();
    logger.info('🌱 Starting database seeding...\n');

    // 1. Seed Packages
    const pkgCount = await Package.countDocuments();
    if (pkgCount === 0) {
      logger.info('Seeding packages...');
      execSync('npx ts-node src/database/seeds/packages.seed.ts', { stdio: 'inherit' });
    } else {
      logger.info(`⏭️  Packages: ${pkgCount} already exist, skipping.`);
    }

    // 2. Seed Exams
    const examCount = await Exam.countDocuments();
    if (examCount === 0) {
      logger.info('Seeding exams...');
      execSync('npx ts-node src/database/seeds/exams.seed.ts', { stdio: 'inherit' });
    } else {
      logger.info(`⏭️  Exams: ${examCount} already exist, skipping.`);
    }

    logger.info('\n✅ All seeds completed!');
    process.exit(0);
  } catch (error: any) {
    logger.error(`Seed error: ${error.message}`);
    process.exit(1);
  }
};

runAllSeeds();