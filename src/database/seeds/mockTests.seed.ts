import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MockTest from '../../models/MockTest.model';
import Exam from '../../models/Exam.model';
import logger from '../../utils/logger';

dotenv.config();

const seedMockTests = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  const upscExam = await Exam.findOne({ shortName: 'UPSC CSE' });
  const sscExam  = await Exam.findOne({ shortName: 'SSC CGL' });

  if (!upscExam || !sscExam) {
    logger.error('Exams not found — run exams.seed.ts first');
    await mongoose.disconnect();
    return;
  }

  const mockTests = [
    {
      name: 'UPSC CSE Prelims Full Mock Test 1',
      slug: 'upsc-cse-prelims-full-mock-1',
      exam: upscExam._id,
      description: 'Full-length UPSC CSE Prelims mock test covering all topics.',
      duration: 120, totalMarks: 200, totalQuestions: 100,
      difficulty: 'hard', isPaid: true, creditsRequired: 2,
      sections: [
        { name: 'General Studies Paper I', subjects: ['History', 'Geography', 'Polity', 'Economy', 'Science'], questionsCount: 100, marks: 200, duration: 120 },
      ],
      isFeatured: true, isActive: true,
    },
    {
      name: 'SSC CGL Tier 1 Full Mock Test 1',
      slug: 'ssc-cgl-tier1-full-mock-1',
      exam: sscExam._id,
      description: 'Complete SSC CGL Tier 1 mock with all 4 sections.',
      duration: 60, totalMarks: 200, totalQuestions: 100,
      difficulty: 'medium', isPaid: true, creditsRequired: 1,
      sections: [
        { name: 'General Intelligence',      subjects: ['Reasoning'],    questionsCount: 25, marks: 50, duration: 15 },
        { name: 'General Awareness',         subjects: ['GK'],           questionsCount: 25, marks: 50, duration: 15 },
        { name: 'Quantitative Aptitude',     subjects: ['Maths'],        questionsCount: 25, marks: 50, duration: 15 },
        { name: 'English Comprehension',     subjects: ['English'],      questionsCount: 25, marks: 50, duration: 15 },
      ],
      isFeatured: true, isActive: true,
    },
    {
      name: 'UPSC CSE Free Practice Test',
      slug: 'upsc-cse-free-practice-1',
      exam: upscExam._id,
      description: 'Free 25-question practice test for UPSC aspirants.',
      duration: 30, totalMarks: 50, totalQuestions: 25,
      difficulty: 'medium', isPaid: false, creditsRequired: 0,
      sections: [
        { name: 'General Studies', subjects: ['History', 'Polity', 'Economy'], questionsCount: 25, marks: 50, duration: 30 },
      ],
      isFeatured: false, isActive: true,
    },
  ];

  await MockTest.deleteMany({ slug: { $in: mockTests.map(m => m.slug) } });
  await MockTest.insertMany(mockTests);
  logger.info(`✅ Seeded ${mockTests.length} mock tests`);
  await mongoose.disconnect();
};

seedMockTests().catch(err => { console.error(err); process.exit(1); });