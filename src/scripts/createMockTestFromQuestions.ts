// Auto-create Mock Test from Latest Questions
// Run this script: npx ts-node backend/src/scripts/createMockTestFromQuestions.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from '../models/Question.model';
import MockTest from '../models/MockTest.model';
import Exam from '../models/Exam.model';

dotenv.config();

const createMockTestFromQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    // Get the exam ID (replace with your actual exam ID or fetch by name)
    const examId = '698ff1c8e63af4a3d2eb1621'; // Replace with your exam ID
    const exam = await Exam.findById(examId);
    
    if (!exam) {
      console.error('❌ Exam not found');
      process.exit(1);
    }

    console.log(`📚 Found exam: ${exam.name} (${exam.shortName})`);

    // Get the latest questions for this exam
    const questions = await Question.find({ 
      exam: examId,
      isActive: true 
    })
    .sort({ createdAt: -1 })
    .limit(20); // Get up to 20 latest questions

    if (questions.length === 0) {
      console.error('❌ No questions found for this exam');
      process.exit(1);
    }

    console.log(`📝 Found ${questions.length} questions`);

    // Calculate totals
    const totalQuestions = questions.length;
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const avgTimePerQuestion = 60; // 1 minute per question
    const duration = Math.ceil((totalQuestions * avgTimePerQuestion) / 60); // in minutes

    // Group questions by subject for better organization
    const subjectGroups = questions.reduce((acc: Record<string, any[]>, q) => {
      const subject = q.subject || 'General';
      if (!acc[subject]) {
        acc[subject] = [];
      }
      acc[subject].push(q);
      return acc;
    }, {});

    console.log('📊 Questions by subject:');
    Object.entries(subjectGroups).forEach(([subject, qs]) => {
      console.log(`  - ${subject}: ${qs.length} questions`);
    });

    // Create the mock test
    const mockTestData = {
      name: `${exam.shortName} Practice Test - ${new Date().toLocaleDateString('en-IN')}`,
      slug: `${exam.slug}-practice-${Date.now()}`,
      exam: examId,
      description: `Comprehensive practice test for ${exam.name} covering ${Object.keys(subjectGroups).join(', ')}`,
      duration: duration,
      totalMarks: totalMarks,
      totalQuestions: totalQuestions,
      questions: questions.map(q => q._id),
      difficulty: 'medium' as const,
      creditsRequired: 0,
      isPaid: false,
      isActive: true,
      instructions: [
        `Total time: ${duration} minutes. Timer starts when you click Start Test.`,
        `${totalQuestions} questions for ${totalMarks} marks.`,
        'Each correct answer earns full marks. Wrong answers have negative marking.',
        'You can mark questions for review and revisit them before submitting.',
        'Do not close the browser tab during the test — your progress autosaves.',
        'Submit before time runs out. Test auto-submits when the timer hits zero.',
        'This test is free — no credits required.'
      ],
      attemptCount: 0,
      averageScore: 0
    };

    const mockTest = await MockTest.create(mockTestData);

    console.log('');
    console.log('✅ Mock Test Created Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Name: ${mockTest.name}`);
    console.log(`🆔 ID: ${mockTest._id}`);
    console.log(`🔗 URL: http://localhost:5173/mock-tests/${mockTest._id}`);
    console.log(`📝 Questions: ${mockTest.totalQuestions}`);
    console.log(`⭐ Total Marks: ${mockTest.totalMarks}`);
    console.log(`⏱️  Duration: ${mockTest.duration} minutes`);
    console.log(`🎯 Difficulty: ${mockTest.difficulty}`);
    console.log(`💰 Credits Required: ${mockTest.creditsRequired} (FREE)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createMockTestFromQuestions();