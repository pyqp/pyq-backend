import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PYQ from '../../models/PYQ.model';
import Exam from '../../models/Exam.model';
import logger from '../../utils/logger';

dotenv.config();

const seedPYQs = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  const upscExam = await Exam.findOne({ shortName: 'UPSC CSE' });
  const sscExam  = await Exam.findOne({ shortName: 'SSC CGL' });

  if (!upscExam || !sscExam) {
    logger.error('Exams not found — run exams.seed.ts first');
    await mongoose.disconnect();
    return;
  }

  const pyqs = [
    { exam: upscExam._id, year: 2023, title: 'UPSC CSE Prelims 2023 GS Paper I', slug: 'upsc-cse-prelims-2023-gs1', totalQuestions: 100, duration: 120, subjects: ['History', 'Geography', 'Polity', 'Economy', 'Environment', 'Science'], isPaid: false },
    { exam: upscExam._id, year: 2022, title: 'UPSC CSE Prelims 2022 GS Paper I', slug: 'upsc-cse-prelims-2022-gs1', totalQuestions: 100, duration: 120, subjects: ['History', 'Geography', 'Polity', 'Economy', 'Environment', 'Science'], isPaid: false },
    { exam: upscExam._id, year: 2021, title: 'UPSC CSE Prelims 2021 GS Paper I', slug: 'upsc-cse-prelims-2021-gs1', totalQuestions: 100, duration: 120, subjects: ['History', 'Geography', 'Polity', 'Economy', 'Environment', 'Science'], isPaid: false },
    { exam: sscExam._id,  year: 2023, title: 'SSC CGL Tier 1 2023 Shift 1', slug: 'ssc-cgl-tier1-2023-shift1', shift: 'Morning', totalQuestions: 100, duration: 60, subjects: ['Reasoning', 'GK', 'Maths', 'English'], isPaid: false },
    { exam: sscExam._id,  year: 2023, title: 'SSC CGL Tier 1 2023 Shift 2', slug: 'ssc-cgl-tier1-2023-shift2', shift: 'Afternoon', totalQuestions: 100, duration: 60, subjects: ['Reasoning', 'GK', 'Maths', 'English'], isPaid: false },
    { exam: sscExam._id,  year: 2022, title: 'SSC CGL Tier 1 2022 Shift 1', slug: 'ssc-cgl-tier1-2022-shift1', shift: 'Morning', totalQuestions: 100, duration: 60, subjects: ['Reasoning', 'GK', 'Maths', 'English'], isPaid: false },
  ];

  await PYQ.deleteMany({ slug: { $in: pyqs.map(p => p.slug) } });
  await PYQ.insertMany(pyqs);
  logger.info(`✅ Seeded ${pyqs.length} PYQs`);
  await mongoose.disconnect();
};

seedPYQs().catch(err => { console.error(err); process.exit(1); });