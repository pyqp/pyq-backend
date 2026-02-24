import { Response } from 'express';
import User from '../models/User.model';
import MockTest from '../models/MockTest.model';
import Result from '../models/Result.model';
import Payment from '../models/Payment.model';
import Exam from '../models/Exam.model';
import Question from '../models/Question.model';
import CreditTransaction from '../models/CreditTransaction.model';
import Referral from '../models/Referral.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * @desc    Admin overview dashboard
 * @route   GET /api/v1/admin/dashboard
 * @access  Private/Admin
 */
export const getDashboard = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const now      = new Date();
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalUsers, newUsersToday, newUsersThisMonth, newUsersLastMonth,
    totalTests, totalQuestions, totalExams,
    totalPayments, revenueThisMonth, revenueLastMonth,
    activeAttempts,
    totalResults,
    pendingReferrals,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', createdAt: { $gte: today } }),
    User.countDocuments({ role: 'user', createdAt: { $gte: thisMonth } }),
    User.countDocuments({ role: 'user', createdAt: { $gte: lastMonth, $lte: lastMonthEnd } }),
    MockTest.countDocuments({ isActive: true }),
    Question.countDocuments({ isActive: true }),
    Exam.countDocuments({ isActive: true }),
    Payment.countDocuments({ status: 'success' }),
    Payment.aggregate([
      { $match: { status: 'success', createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'success', createdAt: { $gte: lastMonth, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    User.countDocuments({ 'credits.total': { $gt: 0 } }),
    Result.countDocuments(),
    Referral.countDocuments({ status: 'pending' }),
  ]);

  const revThisMonth = revenueThisMonth[0]?.total ?? 0;
  const revLastMonth = revenueLastMonth[0]?.total ?? 0;
  const revenueGrowth = revLastMonth > 0
    ? Math.round(((revThisMonth - revLastMonth) / revLastMonth) * 100)
    : 100;
  const userGrowth = newUsersLastMonth > 0
    ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
    : 100;

  ApiResponse.success(res, {
    users: {
      total: totalUsers,
      today: newUsersToday,
      thisMonth: newUsersThisMonth,
      lastMonth: newUsersLastMonth,
      growth: userGrowth,
    },
    content: {
      exams: totalExams,
      mockTests: totalTests,
      questions: totalQuestions,
    },
    revenue: {
      totalPayments,
      thisMonth: revThisMonth,
      lastMonth: revLastMonth,
      growth: revenueGrowth,
    },
    activity: {
      activeUsers:    activeAttempts,
      totalResults,
      pendingReferrals,
    },
  }, 'Dashboard data fetched successfully');
});

// ─── Revenue Analytics ────────────────────────────────────────────────────────

/**
 * @desc    Revenue chart — monthly
 * @route   GET /api/v1/admin/analytics/revenue?period=monthly&months=6
 * @access  Private/Admin
 */
export const getRevenueAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const months = parseInt((req.query.months as string) || '6', 10);

  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const revenue = await Payment.aggregate([
    { $match: { status: 'success', createdAt: { $gte: since } } },
    { $group: {
      _id: {
        year:  { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      },
      revenue: { $sum: '$amount' },
      total:   { $sum: '$amount' },
      transactions: { $sum: 1 },
    }},
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $project: {
      _id: 0,
      month: {
        $let: {
          vars: {
            monthsInYear: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          },
          in: { $arrayElemAt: ['$$monthsInYear', '$_id.month'] }
        }
      },
      period: {
        $concat: [
          { $toString: '$_id.year' },
          '-',
          { $cond: {
            if: { $lt: ['$_id.month', 10] },
            then: { $concat: ['0', { $toString: '$_id.month' }] },
            else: { $toString: '$_id.month' }
          }}
        ]
      },
      revenue: 1,
      total: 1,
    }},
  ]);

  ApiResponse.success(res, revenue, 'Revenue analytics fetched successfully');
});

/**
 * @desc    User growth analytics
 * @route   GET /api/v1/admin/analytics/users?months=6
 * @access  Private/Admin
 */
export const getUserAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const months = parseInt((req.query.months as string) || '6', 10);
  const since  = new Date();
  since.setMonth(since.getMonth() - months);

  const signups = await User.aggregate([
    { $match: { createdAt: { $gte: since }, role: 'user' } },
    { $group: {
      _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
      newUsers: { $sum: 1 },
      count: { $sum: 1 },
    }},
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $project: {
      _id: 0,
      month: {
        $let: {
          vars: {
            monthsInYear: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          },
          in: { $arrayElemAt: ['$$monthsInYear', '$_id.month'] }
        }
      },
      period: {
        $concat: [
          { $toString: '$_id.year' },
          '-',
          { $cond: {
            if: { $lt: ['$_id.month', 10] },
            then: { $concat: ['0', { $toString: '$_id.month' }] },
            else: { $toString: '$_id.month' }
          }}
        ]
      },
      newUsers: 1,
      count: 1,
    }},
  ]);

  ApiResponse.success(res, signups, 'User analytics fetched successfully');
});

/**
 * @desc    Test performance analytics
 * @route   GET /api/v1/admin/analytics/tests
 * @access  Private/Admin
 */
export const getTestAnalytics = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [topTests, hardestTests, mostAttempted, avgByDifficulty] = await Promise.all([
    // Top tests by attempt count
    MockTest.find({ isActive: true })
      .sort('-attemptCount')
      .limit(10)
      .populate('exam', 'name shortName')
      .select('name slug attemptCount averageScore difficulty exam'),

    // Tests with lowest average score (hardest)
    Result.aggregate([
      { $group: {
        _id:      '$mockTest',
        avgScore:   { $avg: '$percentage' },
        attempts:   { $sum: 1 },
        avgAccuracy: { $avg: '$accuracy' },
      }},
      { $match: { attempts: { $gte: 5 } } },
      { $sort: { avgScore: 1 } },
      { $limit: 5 },
      { $lookup: { from: 'mocktests', localField: '_id', foreignField: '_id', as: 'test' } },
      { $unwind: '$test' },
      { $project: { 'test.name': 1, 'test.slug': 1, avgScore: 1, attempts: 1, avgAccuracy: 1 } },
    ]),

    // Most attempted this month
    Result.aggregate([
      { $match: { createdAt: { $gte: new Date(new Date().setDate(1)) } } },
      { $group: { _id: '$mockTest', attempts: { $sum: 1 } } },
      { $sort: { attempts: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'mocktests', localField: '_id', foreignField: '_id', as: 'test' } },
      { $unwind: '$test' },
      { $project: { 'test.name': 1, attempts: 1 } },
    ]),

    // Average score by difficulty
    Result.aggregate([
      { $lookup: { from: 'mocktests', localField: 'mockTest', foreignField: '_id', as: 'test' } },
      { $unwind: '$test' },
      { $group: {
        _id:        '$test.difficulty',
        avgScore:   { $avg: '$percentage' },
        avgAccuracy: { $avg: '$accuracy' },
        attempts:   { $sum: 1 },
      }},
    ]),
  ]);

  ApiResponse.success(res, {
    topTests,
    hardestTests,
    mostAttemptedThisMonth: mostAttempted,
    avgByDifficulty,
  }, 'Test analytics fetched successfully');
});

// ─── User Management ──────────────────────────────────────────────────────────

/**
 * @desc    List all users (paginated + search)
 * @route   GET /api/v1/admin/users?search=&role=&page=&limit=
 * @access  Private/Admin
 */
export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, role, isActive, page = '1', limit = '15', sort = '-createdAt' } = req.query;
  const pageNum  = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip     = (pageNum - 1) * limitNum;

  const query: any = {};
  if (role)     query.role     = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .sort(sort as string)
    .skip(skip)
    .limit(limitNum)
    .select('-password -emailVerificationToken -passwordResetToken -__v');

  const total = await User.countDocuments(query);

  ApiResponse.paginated(res, users, pageNum, limitNum, total, 'Users fetched successfully');
});

/**
 * @desc    Get single user details (admin view)
 * @route   GET /api/v1/admin/users/:id
 * @access  Private/Admin
 */
export const getUserDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.params.id)
    .select('-password -emailVerificationToken -passwordResetToken');
  if (!user) throw new ApiError('User not found', 404);

  const [payments, results, creditTxns] = await Promise.all([
    Payment.find({ user: user._id, status: 'success' })
      .populate('package', 'name credits')
      .sort('-createdAt')
      .limit(10)
      .select('amount status createdAt package creditsAwarded'),
    Result.find({ user: user._id })
      .populate('mockTest', 'name')
      .sort('-createdAt')
      .limit(10)
      .select('finalScore percentage rank timeTaken mockTest createdAt'),
    CreditTransaction.find({ user: user._id })
      .sort('-createdAt')
      .limit(10)
      .select('type amount source description createdAt'),
  ]);

  ApiResponse.success(res, {
    user,
    recentPayments:      payments,
    recentResults:       results,
    recentCreditHistory: creditTxns,
  }, 'User details fetched successfully');
});

/**
 * @desc    Toggle user active status (ban/unban)
 * @route   PATCH /api/v1/admin/users/:id/toggle-status
 * @access  Private/Admin
 */
export const toggleUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError('User not found', 404);
  if (user.role === 'admin') throw new ApiError('Cannot modify admin users', 403);

  user.isActive = !user.isActive;
  await user.save();

  ApiResponse.success(res, {
    userId:   user._id,
    isActive: user.isActive,
    message:  user.isActive ? 'User activated' : 'User banned',
  }, `User ${user.isActive ? 'activated' : 'banned'} successfully`);
});

/**
 * @desc    Grant credits to a user manually
 * @route   POST /api/v1/admin/users/:id/grant-credits
 * @access  Private/Admin
 */
export const grantCredits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { credits, reason, validityDays = 365 } = req.body;
  if (!credits || credits < 1) throw new ApiError('Credits must be at least 1', 400);
  if (!reason)                 throw new ApiError('Reason is required', 400);

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError('User not found', 404);

  const creditsBefore = user.credits.total;
  
  // Add credits to user
  user.credits.total += credits;
  
  // Add to credit batches
  user.credits.batches.push({
    packageName: `Admin Grant: ${reason}`,
    creditsInitial: credits,
    creditsRemaining: credits,
    expiresAt: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000),
  } as any);
  
  await user.save();

  // Create credit transaction record
  await CreditTransaction.create({
    user:          user._id,
    type:          'credit',
    amount:        credits,
    balanceBefore: creditsBefore,
    balanceAfter:  user.credits.total,
    source:        'admin',
    description:   `Admin grant: ${reason}`,
    expiryDate:    new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000),
  });

  ApiResponse.success(res, {
    userId:       user._id,
    creditsAdded: credits,
    newBalance:   user.credits.total,
    reason,
  }, `${credits} credit(s) granted successfully`);
});

// ─── Question Management ──────────────────────────────────────────────────────

/**
 * @desc    Bulk upload questions from JSON array
 * @route   POST /api/v1/admin/questions/bulk
 * @access  Private/Admin
 */
export const bulkUploadQuestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('🚀 BULK UPLOAD STARTED');
  console.log('📦 Received questions:', req.body.questions?.length);
  
  const { examId, questions } = req.body;

  if (!examId || !questions || !Array.isArray(questions)) {
    throw new ApiError('examId and questions array are required', 400);
  }

  const exam = await Exam.findById(examId);
  if (!exam) throw new ApiError('Exam not found', 404);

  const prepared = questions.map((q: any) => ({
    exam: examId,
    questionText: q.questionText,
    questionImage: q.questionImage || null,
    options: q.options,
    correctOption: q.correctOption,
    solution: q.solution,
    explanation: q.explanation,
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty,
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    timeEstimate: q.timeEstimate || 60,
    examType: q.examType || 'mock',
    language: q.language || 'english',
    tags: q.tags || [],
    isActive: true,
  }));

  console.log('📝 Prepared questions:', prepared.length);
  console.log('📝 First question sample:', JSON.stringify(prepared[0], null, 2));

  let created: any[] = [];
  const errors: any[] = [];

  try {
    created = await Question.insertMany(prepared, { ordered: false });
    console.log('✅ Successfully inserted:', created.length);
  } catch (err: any) {
    console.error('❌ Raw error:', err);
    console.error('❌ Error name:', err.name);
    console.error('❌ Error message:', err.message);
    
    if (err.insertedDocs) {
      created = err.insertedDocs;
      console.log('✅ Partial success - inserted:', created.length);
    }
    
    if (err.writeErrors) {
      err.writeErrors.forEach((e: any) => {
        console.error('❌ Write error:', {
          index: e.index,
          code: e.code,
          errmsg: e.errmsg,
          err: e.err
        });
        
        errors.push({
          index: e.index,
          message: e.errmsg || e.err?.errmsg || 'Validation failed',
          document: prepared[e.index]
        });
      });
    } else if (err.errors) {
      Object.keys(err.errors).forEach((key: string) => {
        console.error('❌ Validation error:', key, err.errors[key].message);
        errors.push({
          field: key,
          message: err.errors[key].message
        });
      });
    }
    
    console.error('❌ Total errors:', errors.length);
    console.error('❌ Error details:', JSON.stringify(errors, null, 2));
  }

  const responseData: any = {
    uploaded: created.length,
    total: questions.length,
    examId,
    exam: exam.name,
  };

  if (errors.length > 0) {
    responseData.errors = errors.slice(0, 5);
    responseData.failedCount = questions.length - created.length;
  }

  if (created.length === 0) {
    const firstError = errors[0]?.message || 'Unknown validation error';
    throw new ApiError(`All questions failed validation. First error: ${firstError}`, 400);
  }

  ApiResponse.success(res, responseData, 
    created.length === questions.length 
      ? 'All questions uploaded successfully'
      : `Uploaded ${created.length}/${questions.length} questions. ${errors.length} failed.`,
    201
  );
});

/**
 * @desc    Get all questions for an exam (paginated)
 * @route   GET /api/v1/admin/questions?examId=&subject=&difficulty=&page=
 * @access  Private/Admin
 */
export const listQuestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examId, subject, difficulty, examType, page = '1', limit = '50' } = req.query;
  const pageNum  = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip     = (pageNum - 1) * limitNum;

  const query: any = { isActive: true };
  if (examId)     query.exam       = examId;
  if (subject)    query.subject    = subject;
  if (difficulty) query.difficulty = difficulty;
  if (examType)   query.examType   = examType;

  const questions = await Question.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(limitNum)
    .select('-solution.steps -explanation -__v');

  const total = await Question.countDocuments(query);

  ApiResponse.paginated(res, questions, pageNum, limitNum, total, 'Questions fetched successfully');
});

/**
 * @desc    Delete question
 * @route   DELETE /api/v1/admin/questions/:id
 * @access  Private/Admin
 */
export const deleteQuestion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = await Question.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!q) throw new ApiError('Question not found', 404);
  ApiResponse.success(res, null, 'Question deactivated successfully');
});

// ─── Content Overview ─────────────────────────────────────────────────────────

/**
 * @desc    Get question bank stats per exam
 * @route   GET /api/v1/admin/questions/stats
 * @access  Private/Admin
 */
export const getQuestionStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const stats = await Question.aggregate([
    { $match: { isActive: true } },
    { $group: {
      _id:      '$exam',
      total:    { $sum: 1 },
      pyq:      { $sum: { $cond: [{ $eq: ['$examType', 'pyq'] },      1, 0] } },
      mock:     { $sum: { $cond: [{ $eq: ['$examType', 'mock'] },     1, 0] } },
      practice: { $sum: { $cond: [{ $eq: ['$examType', 'practice'] }, 1, 0] } },
      easy:     { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] },   1, 0] } },
      medium:   { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } },
      hard:     { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] },   1, 0] } },
    }},
    { $lookup: { from: 'exams', localField: '_id', foreignField: '_id', as: 'exam' } },
    { $unwind: '$exam' },
    { $project: {
      _id: 0,
      examId: '$_id',
      examName:  '$exam.name',
      examShortName: '$exam.shortName',
      category:  '$exam.category',
      total: 1, pyq: 1, mock: 1, practice: 1, easy: 1, medium: 1, hard: 1,
    }},
    { $sort: { total: -1 } },
  ]);

  ApiResponse.success(res, stats, 'Question stats fetched successfully');
});

export default {
  getDashboard,
  getRevenueAnalytics,
  getUserAnalytics,
  getTestAnalytics,
  listUsers,
  getUserDetails,
  toggleUserStatus,
  grantCredits,
  bulkUploadQuestions,
  listQuestions,
  deleteQuestion,
  getQuestionStats,
};