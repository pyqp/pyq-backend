import { Response } from 'express';
import MockTest from '../models/MockTest.model';
import TestAttempt from '../models/TestAttempt.model';
import Result from '../models/Result.model';
import Ranking from '../models/Ranking.model';
import Question from '../models/Question.model';
import User from '../models/User.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

// ─── Helper: Compute result from attempt ─────────────────────────────────────

const computeResult = async (attempt: any, mockTest: any) => {
  const questions = await Question.find({
    _id: { $in: mockTest.questions },
  }).select('subject topic difficulty marks negativeMarks');

  const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

  let finalScore = 0;
  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;
  let totalTimeSpent = 0;

  // Subject tracking
  const subjectMap: Record<string, any> = {};
  const difficultyMap: Record<string, any> = {
    easy:   { total: 0, attempted: 0, correct: 0 },
    medium: { total: 0, attempted: 0, correct: 0 },
    hard:   { total: 0, attempted: 0, correct: 0 },
  };

  const questionAnalysis: any[] = [];

  for (const response of attempt.responses) {
    const q = questionMap.get(response.question.toString());
    if (!q) continue;

    const subject = q.subject;
    const topic   = q.topic;
    const diff    = q.difficulty;

    // Init subject
    if (!subjectMap[subject]) {
      subjectMap[subject] = {
        subject,
        totalQuestions: 0,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        score: 0,
        timeSpent: 0,
        topics: {},
      };
    }
    if (!subjectMap[subject].topics[topic]) {
      subjectMap[subject].topics[topic] = { topic, total: 0, correct: 0 };
    }

    subjectMap[subject].totalQuestions++;
    difficultyMap[diff].total++;
    totalTimeSpent += response.timeSpent || 0;

    if (response.userAnswer === undefined || response.userAnswer === null) {
      unattempted++;
      subjectMap[subject].unattempted++;
      subjectMap[subject].topics[topic].total++;
    } else {
      difficultyMap[diff].attempted++;
      subjectMap[subject].topics[topic].total++;

      if (response.isCorrect) {
        correct++;
        finalScore += q.marks;
        subjectMap[subject].correct++;
        subjectMap[subject].score += q.marks;
        subjectMap[subject].timeSpent += response.timeSpent || 0;
        difficultyMap[diff].correct++;
        subjectMap[subject].topics[topic].correct++;
      } else {
        incorrect++;
        finalScore -= q.negativeMarks || 0;
        subjectMap[subject].incorrect++;
        subjectMap[subject].timeSpent += response.timeSpent || 0;
      }
    }

    questionAnalysis.push({
      questionNumber: response.questionNumber,
      subject,
      topic,
      difficulty: diff,
      userAnswer: response.userAnswer,
      correctAnswer: response.correctAnswer,
      isCorrect: response.isCorrect ?? false,
      timeSpent: response.timeSpent || 0,
      markedForReview: response.markedForReview,
    });
  }

  // Compute subject performance array
  const subjectPerformance = Object.values(subjectMap).map((s: any) => {
    const acc = s.totalQuestions > 0
      ? Math.round(((s.correct) / (s.correct + s.incorrect || 1)) * 100)
      : 0;
    const pct = mockTest.totalMarks > 0
      ? Math.round((s.score / mockTest.totalMarks) * 100)
      : 0;
    const avgTime = (s.correct + s.incorrect) > 0
      ? Math.round(s.timeSpent / (s.correct + s.incorrect))
      : 0;
    const status =
      acc >= 80 ? 'excellent' :
      acc >= 60 ? 'good' :
      acc >= 40 ? 'average' : 'weak';

    const topics = Object.values(s.topics).map((t: any) => ({
      topic: t.topic,
      total: t.total,
      correct: t.correct,
      percentage: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
      status: t.total > 0 && (t.correct / t.total) >= 0.8 ? 'excellent' :
              t.total > 0 && (t.correct / t.total) >= 0.6 ? 'good' :
              t.total > 0 && (t.correct / t.total) >= 0.4 ? 'average' : 'weak',
    }));

    return {
      subject: s.subject,
      totalQuestions: s.totalQuestions,
      correct: s.correct,
      incorrect: s.incorrect,
      unattempted: s.unattempted,
      score: s.score,
      percentage: pct,
      accuracy: acc,
      timeSpent: s.timeSpent,
      avgTimePerQuestion: avgTime,
      status,
      topics,
    };
  });

  // Difficulty accuracy
  ['easy', 'medium', 'hard'].forEach(d => {
    const entry = difficultyMap[d];
    entry.accuracy = entry.attempted > 0
      ? Math.round((entry.correct / entry.attempted) * 100)
      : 0;
  });

  // Strengths & weaknesses
  const strengths: string[] = [];
  const weaknesses: any[] = [];
  subjectPerformance.forEach(s => {
    if (s.status === 'excellent' || s.status === 'good') {
      strengths.push(s.subject);
    } else {
      weaknesses.push({
        area: s.subject,
        currentAccuracy: s.accuracy,
        priority: s.accuracy < 40 ? 'high' : 'medium',
        recommendation: `Focus on ${s.subject} — practice more ${
          s.topics.filter((t: any) => t.status === 'weak').map((t: any) => t.topic).join(', ') || 'topics'
        }`,
      });
    }
  });

  const timeTaken     = attempt.timeTaken || Math.ceil(totalTimeSpent / 60);
  const percentage    = Math.round((Math.max(0, finalScore) / mockTest.totalMarks) * 100);
  const accuracy      = (correct + incorrect) > 0
    ? Math.round((correct / (correct + incorrect)) * 100) : 0;
  const timeEfficiency = mockTest.duration > 0
    ? Math.round((timeTaken / mockTest.duration) * 100) : 0;
  const avgTimePerQ   = (correct + incorrect) > 0
    ? Math.round((timeTaken * 60) / (correct + incorrect)) : 0;

  return {
    finalScore: Math.max(0, finalScore),
    totalMarks: mockTest.totalMarks,
    percentage,
    correct,
    incorrect,
    unattempted,
    accuracy,
    timeTaken,
    totalTime: mockTest.duration,
    timeEfficiency,
    avgTimePerQuestion: avgTimePerQ,
    subjectPerformance,
    difficultyPerformance: difficultyMap,
    strengths,
    weaknesses,
    questionAnalysis,
  };
};

// ─── Helper: Compute rank & percentile ───────────────────────────────────────

const computeRank = async (mockTestId: string, score: number, timeTaken: number) => {
  // Count users who scored strictly higher, or same score in less time
  const betterCount = await Ranking.countDocuments({
    mockTest: mockTestId,
    $or: [
      { score: { $gt: score } },
      { score, timeTaken: { $lt: timeTaken } },
    ],
  });
  const totalParticipants = await Ranking.countDocuments({ mockTest: mockTestId });
  const rank      = betterCount + 1;
  const percentile = totalParticipants > 0
    ? Math.round(((totalParticipants - betterCount) / totalParticipants) * 100)
    : 100;
  return { rank, percentile, totalParticipants: totalParticipants + 1 };
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Get all mock tests for an exam
 * @route   GET /api/v1/mock-tests?examId=...
 * @access  Public
 */
export const getAllMockTests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examId, difficulty, isPaid, page = '1', limit = '10' } = req.query;

  const query: any = { isActive: true };
  if (examId)     query.exam       = examId;
  if (difficulty) query.difficulty = difficulty;
  if (isPaid !== undefined) query.isPaid = isPaid === 'true';

  const pageNum  = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip     = (pageNum - 1) * limitNum;

  const tests = await MockTest.find(query)
    .populate('exam', 'name shortName category')
    .sort('-createdAt')
    .skip(skip)
    .limit(limitNum)
    .select('-questions -__v');

  const total = await MockTest.countDocuments(query);

  ApiResponse.paginated(res, tests, pageNum, limitNum, total, 'Mock tests fetched successfully');
});

/**
 * @desc    Get single mock test details (no questions)
 * @route   GET /api/v1/mock-tests/:id
 * @access  Public
 */
export const getMockTestById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const test = await MockTest.findById(req.params.id)
    .populate('exam', 'name shortName category')
    .select('-questions -__v');

  if (!test) throw new ApiError('Mock test not found', 404);

  ApiResponse.success(res, test, 'Mock test fetched successfully');
});

/**
 * @desc    Start a mock test — deducts credit, creates TestAttempt, returns questions
 * @route   POST /api/v1/mock-tests/:id/start
 * @access  Private
 */
export const startMockTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId     = req.user!._id;
  const mockTestId = req.params.id;

  const test = await MockTest.findById(mockTestId).populate('questions');
  if (!test || !test.isActive) throw new ApiError('Mock test not found', 404);

  // Check for existing ongoing attempt
  const ongoing = await TestAttempt.findOne({
    user: userId,
    mockTest: mockTestId,
    status: 'ongoing',
  });
  if (ongoing) {
    // Resume: return existing attempt with questions
    const questions = await Question.find({ _id: { $in: test.questions } })
      .select('questionText questionImage options difficulty subject topic marks negativeMarks timeEstimate');
    return ApiResponse.success(res, { attempt: ongoing, questions, isResumed: true }, 'Test resumed');
  }

  // Deduct credit if test is paid
  if (test.isPaid && test.creditsRequired > 0) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError('User not found', 404);
    if (!user.hasValidCredits(test.creditsRequired)) {
      throw new ApiError('Insufficient credits. Please purchase a package.', 402);
    }
    const deducted = await user.deductCredits(test.creditsRequired);
    if (!deducted) throw new ApiError('Failed to deduct credits', 500);
  }

  // Count prior attempts
  const priorAttempts = await TestAttempt.countDocuments({ user: userId, mockTest: mockTestId });

  // Build blank response array
  const questions = await Question.find({ _id: { $in: test.questions } })
    .select('questionText questionImage options difficulty subject topic marks negativeMarks timeEstimate');

  const responses = questions.map((q, i) => ({
    questionNumber: i + 1,
    question:       q._id,
    correctAnswer:  q.correctOption ?? 0,
    timeSpent:      0,
    markedForReview: false,
    marks:          0,
  }));

  const attempt = await TestAttempt.create({
    user:          userId,
    mockTest:      mockTestId,
    attemptNumber: priorAttempts + 1,
    startTime:     new Date(),
    status:        'ongoing',
    responses,
  });

  // Increment attemptCount on MockTest
  await MockTest.findByIdAndUpdate(mockTestId, { $inc: { attemptCount: 1 } });

  // Strip correct answers before sending to client
  const questionsForClient = questions.map(q => ({
    _id:          q._id,
    questionText: q.questionText,
    questionImage: q.questionImage,
    options:      q.options,
    difficulty:   q.difficulty,
    subject:      q.subject,
    topic:        q.topic,
    marks:        q.marks,
    negativeMarks: q.negativeMarks,
    timeEstimate: q.timeEstimate,
  }));

  ApiResponse.success(res, {
    attempt: {
      _id:           attempt._id,
      attemptNumber: attempt.attemptNumber,
      startTime:     attempt.startTime,
      duration:      test.duration,
      totalQuestions: test.totalQuestions,
      totalMarks:    test.totalMarks,
    },
    questions: questionsForClient,
    instructions: test.instructions,
    isResumed: false,
  }, 'Test started successfully', 201);
});

/**
 * @desc    Save answer during test (auto-save)
 * @route   PATCH /api/v1/mock-tests/:id/save-answer
 * @access  Private
 */
export const saveAnswer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { attemptId, questionNumber, userAnswer, timeSpent, markedForReview } = req.body;

  const attempt = await TestAttempt.findOne({
    _id:     attemptId,
    user:    req.user!._id,
    status:  'ongoing',
  });

  if (!attempt) throw new ApiError('Active attempt not found', 404);

  // Find the response entry
  const responseIndex = attempt.responses.findIndex(
    r => r.questionNumber === questionNumber
  );
  if (responseIndex === -1) throw new ApiError('Question not found in attempt', 404);

  // Fetch correct answer
  const question = await Question.findById(attempt.responses[responseIndex].question)
    .select('correctOption marks negativeMarks');

  if (!question) throw new ApiError('Question not found', 404);

  const isCorrect = userAnswer !== undefined && userAnswer !== null
    ? userAnswer === question.correctOption
    : undefined;

  attempt.responses[responseIndex].userAnswer      = userAnswer;
  attempt.responses[responseIndex].isCorrect       = isCorrect;
  attempt.responses[responseIndex].timeSpent       = timeSpent || 0;
  attempt.responses[responseIndex].markedForReview = markedForReview ?? false;
  attempt.responses[responseIndex].marks           = isCorrect
    ? question.marks
    : (userAnswer !== undefined ? -(question.negativeMarks || 0) : 0);

  await attempt.save();

  ApiResponse.success(res, { saved: true }, 'Answer saved');
});

/**
 * @desc    Submit test — compute result, assign rank
 * @route   POST /api/v1/mock-tests/:id/submit
 * @access  Private
 */
export const submitMockTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { attemptId, timeTaken } = req.body;
  const userId = req.user!._id;

  const attempt = await TestAttempt.findOne({
    _id:    attemptId,
    user:   userId,
    status: 'ongoing',
  });
  if (!attempt) throw new ApiError('Active attempt not found', 404);

  const mockTest = await MockTest.findById(attempt.mockTest);
  if (!mockTest) throw new ApiError('Mock test not found', 404);

  // Mark attempt submitted
  attempt.status    = 'submitted';
  attempt.endTime   = new Date();
  attempt.timeTaken = timeTaken || Math.ceil(
    (Date.now() - attempt.startTime.getTime()) / 60000
  );

  // Recalculate totals
  attempt.totalCorrect     = attempt.responses.filter(r => r.isCorrect).length;
  attempt.totalIncorrect   = attempt.responses.filter(r => r.userAnswer !== undefined && !r.isCorrect).length;
  attempt.totalUnattempted = attempt.responses.filter(r => r.userAnswer === undefined).length;
  attempt.totalScore       = attempt.responses.reduce((sum, r) => sum + (r.marks || 0), 0);
  attempt.accuracy         = (attempt.totalCorrect + attempt.totalIncorrect) > 0
    ? Math.round((attempt.totalCorrect / (attempt.totalCorrect + attempt.totalIncorrect)) * 100)
    : 0;

  await attempt.save();

  // ── Compute full result ──
  const computed = await computeResult(attempt, mockTest);

  // ── Get comparison data from existing results ──
  const allResults = await Result.find({ mockTest: attempt.mockTest })
    .select('finalScore timeTaken')
    .sort('-finalScore');

  const scores         = allResults.map(r => r.finalScore);
  const averageScore   = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const topScore       = scores[0] || 0;
  const top10Index     = Math.ceil(scores.length * 0.1) - 1;
  const top10Cutoff    = scores[top10Index] || 0;
  const aboveAverage   = scores.filter(s => s > averageScore).length;
  const gapToTop10     = Math.max(0, top10Cutoff - computed.finalScore);

  // ── Rank ──
  const isFirstAttempt = attempt.attemptNumber === 1;
  const { rank, percentile, totalParticipants } = await computeRank(
    attempt.mockTest.toString(),
    computed.finalScore,
    attempt.timeTaken ?? 0
  );

  // ── Save Result ──
  const result = await Result.create({
    user:          userId,
    mockTest:      attempt.mockTest,
    testAttempt:   attempt._id,
    attemptNumber: attempt.attemptNumber,
    ...computed,
    rank,
    isFirstAttempt,
    rankLocked:       isFirstAttempt,
    totalParticipants,
    percentile,
    comparison: { averageScore, topScore, top10Cutoff, aboveAverage, gapToTop10 },
  });

  // ── Upsert Ranking (only on first attempt) ──
  if (isFirstAttempt) {
    await Ranking.findOneAndUpdate(
      { user: userId, mockTest: attempt.mockTest },
      {
        result:        result._id,
        rank,
        score:         computed.finalScore,
        percentage:    computed.percentage,
        percentile,
        timeTaken:     attempt.timeTaken,
        attemptNumber: 1,
        isLocked:      true,
        lockedAt:      new Date(),
      },
      { upsert: true, new: true }
    );

    // Recompute all ranks for this test (shifting after new entry)
    const allRankings = await Ranking.find({ mockTest: attempt.mockTest })
      .sort({ score: -1, timeTaken: 1 });

    const bulkOps = allRankings.map((r, i) => ({
      updateOne: {
        filter: { _id: r._id },
        update: { $set: { rank: i + 1 } },
      },
    }));
    if (bulkOps.length > 0) await Ranking.bulkWrite(bulkOps);
  }

  // ── Update user stats ──
  await User.findByIdAndUpdate(userId, {
    $inc: {
      'stats.totalTestsTaken': 1,
      'stats.totalTimeSpent':  attempt.timeTaken,
    },
  });

  ApiResponse.success(res, {
    resultId:       result._id,
    attemptId:      attempt._id,
    score:          computed.finalScore,
    totalMarks:     mockTest.totalMarks,
    percentage:     computed.percentage,
    rank,
    percentile,
    totalParticipants,
    correct:        computed.correct,
    incorrect:      computed.incorrect,
    unattempted:    computed.unattempted,
    accuracy:       computed.accuracy,
    timeTaken:      attempt.timeTaken,
  }, 'Test submitted successfully');
});

/**
 * @desc    Get all attempts for a test by the current user
 * @route   GET /api/v1/mock-tests/:id/my-attempts
 * @access  Private
 */
export const getMyAttempts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attempts = await TestAttempt.find({
    user:     req.user!._id,
    mockTest: req.params.id,
    status:   { $ne: 'ongoing' },
  }).sort('-createdAt').select('-responses');

  ApiResponse.success(res, attempts, 'Attempts fetched successfully');
});

/**
 * @desc    Create mock test (Admin)
 * @route   POST /api/v1/mock-tests
 * @access  Private/Admin
 */
export const createMockTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const test = await MockTest.create(req.body);
  ApiResponse.success(res, test, 'Mock test created successfully', 201);
});

/**
 * @desc    Update mock test (Admin)
 * @route   PUT /api/v1/mock-tests/:id
 * @access  Private/Admin
 */
export const updateMockTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const test = await MockTest.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!test) throw new ApiError('Mock test not found', 404);
  ApiResponse.success(res, test, 'Mock test updated successfully');
});

/**
 * @desc    Delete mock test (Admin)
 * @route   DELETE /api/v1/mock-tests/:id
 * @access  Private/Admin
 */
export const deleteMockTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const test = await MockTest.findByIdAndDelete(req.params.id);
  if (!test) throw new ApiError('Mock test not found', 404);
  ApiResponse.success(res, null, 'Mock test deleted successfully');
});

export default {
  getAllMockTests, getMockTestById, startMockTest,
  saveAnswer, submitMockTest, getMyAttempts,
  createMockTest, updateMockTest, deleteMockTest,
};