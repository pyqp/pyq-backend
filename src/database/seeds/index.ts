import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../../config/database.config';
import Exam     from '../../models/Exam.model';
import Package  from '../../models/Package.model';
import MockTest from '../../models/MockTest.model';
import Question from '../../models/Question.model';
import Blog     from '../../models/BlogPost.model';
import PYQ      from '../../models/PYQ.model';
import User     from '../../models/User.model';
import logger   from '../../utils/logger';
import { execSync } from 'child_process';

const run = (script: string) =>
  execSync(`npx ts-node src/database/seeds/${script}`, { stdio: 'inherit' });

const runAllSeeds = async () => {
  try {
    await connectDB();
    logger.info('🌱 Starting database seeding...\n');

    // 1. Admin User
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      logger.info('Seeding admin user...');
      run('admin.seed.ts');
    } else {
      logger.info(`⏭️  Admin: ${adminCount} exist, skipping.`);
    }

    // 2. Packages
    const pkgCount = await Package.countDocuments();
    if (pkgCount === 0) {
      logger.info('Seeding packages...');
      run('packages.seed.ts');
    } else {
      logger.info(`⏭️  Packages: ${pkgCount} exist, skipping.`);
    }

    // 3. Exams
    const examCount = await Exam.countDocuments();
    if (examCount === 0) {
      logger.info('Seeding exams...');
      run('exams.seed.ts');
    } else {
      logger.info(`⏭️  Exams: ${examCount} exist, skipping.`);
    }

    // 4. Mock Tests
    const mockCount = await MockTest.countDocuments();
    if (mockCount === 0) {
      logger.info('Seeding mock tests...');
      run('mockTests.seed.ts');
    } else {
      logger.info(`⏭️  MockTests: ${mockCount} exist, skipping.`);
    }

    // 5. Questions — always check because questions link to mock tests
    const qCount = await Question.countDocuments({ examType: 'mock' });
    if (qCount < 50) {
      logger.info('Seeding questions and linking to mock tests...');
      run('questions.seed.ts');
    } else {
      logger.info(`⏭️  Questions: ${qCount} mock questions exist, skipping.`);
    }

    // 6. Blog Posts
    const blogCount = await Blog.countDocuments();
    if (blogCount === 0) {
      logger.info('Seeding blog posts...');
      run('blog.seed.ts');
    } else {
      logger.info(`⏭️  Blog: ${blogCount} posts exist, skipping.`);
    }

    // 7. PYQs
    const pyqCount = await PYQ.countDocuments();
    if (pyqCount === 0) {
      logger.info('Seeding PYQs...');
      run('pyqs.seed.ts');
    } else {
      logger.info(`⏭️  PYQs: ${pyqCount} exist, skipping.`);
    }

    logger.info('\n✅ All seeds completed!');
    logger.info('📊 Summary:');
    logger.info(`   - Admin users: ${await User.countDocuments({ role: 'admin' })}`);
    logger.info(`   - Packages: ${await Package.countDocuments()}`);
    logger.info(`   - Exams: ${await Exam.countDocuments()}`);
    logger.info(`   - Mock Tests: ${await MockTest.countDocuments()}`);
    logger.info(`   - Questions: ${await Question.countDocuments()}`);
    logger.info(`   - Blog Posts: ${await Blog.countDocuments()}`);
    logger.info(`   - PYQs: ${await PYQ.countDocuments()}`);
    logger.info('\nYou can now start the server and test the full flow.');
    process.exit(0);
  } catch (error: any) {
    logger.error(`Seed error: ${error.message}`);
    process.exit(1);
  }
};

runAllSeeds();