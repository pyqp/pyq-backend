import { Response } from 'express';
import Result from '../models/Result.model';
import TestAttempt from '../models/TestAttempt.model';
import MockTest from '../models/MockTest.model';
import Question from '../models/Question.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

/**
 * @desc    Get full result by resultId
 * @route   GET /api/v1/results/:resultId
 * @access  Private
 */
export const getResultById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await Result.findById(req.params.resultId)
    .populate('mockTest', 'name slug exam duration totalMarks totalQuestions')
    .populate('testAttempt', 'startTime endTime timeTaken attemptNumber');

  if (!result) throw new ApiError('Result not found', 404);

  // Only the owner can view their result
  if (result.user.toString() !== req.user!._id.toString()) {
    throw new ApiError('Not authorised to view this result', 403);
  }

  ApiResponse.success(res, result, 'Result fetched successfully');
});

/**
 * @desc    Get all results for current user
 * @route   GET /api/v1/results/my-results
 * @access  Private
 */
export const getMyResults = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10' } = req.query;
  const pageNum  = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip     = (pageNum - 1) * limitNum;

  const results = await Result.find({ user: req.user!._id })
    .populate('mockTest', 'name slug exam difficulty')
    .sort('-createdAt')
    .skip(skip)
    .limit(limitNum)
    .select('-questionAnalysis -subjectPerformance -difficultyPerformance -weaknesses');

  const total = await Result.countDocuments({ user: req.user!._id });

  ApiResponse.paginated(res, results, pageNum, limitNum, total, 'Results fetched successfully');
});

/**
 * @desc    Get full analytics dashboard for a result
 * @route   GET /api/v1/results/:resultId/analytics
 * @access  Private
 */
export const getAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await Result.findById(req.params.resultId)
    .populate('mockTest', 'name totalMarks totalQuestions duration');

  if (!result) throw new ApiError('Result not found', 404);

  if (result.user.toString() !== req.user!._id.toString()) {
    throw new ApiError('Not authorised', 403);
  }

  // ── Section 1: Overview ──────────────────────────────────────────────────
  const overview = {
    score:            result.finalScore,
    totalMarks:       result.totalMarks,
    percentage:       result.percentage,
    rank:             result.rank,
    percentile:       result.percentile,
    totalParticipants: result.totalParticipants,
    correct:          result.correct,
    incorrect:        result.incorrect,
    unattempted:      result.unattempted,
    accuracy:         result.accuracy,
    timeTaken:        result.timeTaken,
    totalTime:        result.totalTime,
    timeEfficiency:   result.timeEfficiency,
    avgTimePerQuestion: result.avgTimePerQuestion,
  };

  // ── Section 2: Comparison ────────────────────────────────────────────────
  const comparison = result.comparison;

  // ── Section 3: Subject Performance ──────────────────────────────────────
  const subjectPerformance = result.subjectPerformance;

  // ── Section 4: Difficulty Breakdown ─────────────────────────────────────
  const difficultyPerformance = result.difficultyPerformance;

  // ── Section 5: Strengths & Weaknesses ───────────────────────────────────
  const strengthsWeaknesses = {
    strengths: result.strengths,
    weaknesses: result.weaknesses,
  };

  // ── Section 6: Question-wise Analysis (enriched with Q text + options) ──
  const rawQA = result.questionAnalysis as any[];

  // Fetch question details for every question referenced in the analysis
  const questionIds = rawQA
    .map((qa: any) => qa.questionId ?? qa._id)
    .filter(Boolean);

  // Also get questions from the mockTest's question list (by questionNumber order)
  const mockTestDoc = await MockTest.findById(result.mockTest).select('questions');
  const orderedIds  = mockTestDoc?.questions ?? [];

  const qDocs = await Question.find({
    _id: { $in: [...questionIds, ...orderedIds] },
  }).select('questionText options solution explanation marks negativeMarks');

  // Build a lookup: _id string → question doc
  const qMap = new Map(qDocs.map(q => [q._id.toString(), q]));

  // Enrich each entry in questionAnalysis
  const questionAnalysis = rawQA.map((qa: any, idx: number) => {
    // Match by stored questionId or fall back to position in ordered list
    const qId = qa.questionId?.toString()
      ?? qa._id?.toString()
      ?? (orderedIds[idx] ? orderedIds[idx].toString() : null);

    const qDoc = qId ? qMap.get(qId) : undefined;

    return {
      ...qa,
      questionText:  qDoc?.questionText  ?? null,
      options:       qDoc?.options       ?? [],
      solution:      qDoc?.solution      ?? null,
      explanation:   qDoc?.explanation   ?? null,
      marks:         qDoc?.marks         ?? qa.marks,
      negativeMarks: qDoc?.negativeMarks ?? qa.negativeMarks,
    };
  });

  // ── Section 7: Progress (compare with past attempts on same test) ────────
  const pastResults = await Result.find({
    user:     result.user,
    mockTest: result.mockTest,
  })
    .sort('createdAt')
    .select('finalScore percentage accuracy timeTaken attemptNumber createdAt');

  const progress = pastResults.map(r => ({
    attemptNumber: r.attemptNumber,
    score:         r.finalScore,
    percentage:    r.percentage,
    accuracy:      r.accuracy,
    timeTaken:     r.timeTaken,
    date:          r.createdAt,
  }));

  ApiResponse.success(res, {
    overview,
    comparison,
    subjectPerformance,
    difficultyPerformance,
    strengthsWeaknesses,
    questionAnalysis,
    progress,
  }, 'Analytics fetched successfully');
});

/**
 * @desc    Get scorecard summary (lightweight for share card)
 * @route   GET /api/v1/results/:resultId/scorecard
 * @access  Private
 */
export const getScorecard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await Result.findById(req.params.resultId)
    .populate('mockTest', 'name exam')
    .populate({ path: 'mockTest', populate: { path: 'exam', select: 'name shortName' } });

  if (!result) throw new ApiError('Result not found', 404);

  if (result.user.toString() !== req.user!._id.toString()) {
    throw new ApiError('Not authorised', 403);
  }

  ApiResponse.success(res, {
    score:       result.finalScore,
    totalMarks:  result.totalMarks,
    percentage:  result.percentage,
    rank:        result.rank,
    percentile:  result.percentile,
    totalParticipants: result.totalParticipants,
    correct:     result.correct,
    incorrect:   result.incorrect,
    unattempted: result.unattempted,
    accuracy:    result.accuracy,
    timeTaken:   result.timeTaken,
    mockTest:    result.mockTest,
    attemptNumber: result.attemptNumber,
    isFirstAttempt: result.isFirstAttempt,
    createdAt:   result.createdAt,
  }, 'Scorecard fetched successfully');
});

/**
 * @desc    Get results for a specific mock test (Admin)
 * @route   GET /api/v1/results/mock-test/:mockTestId
 * @access  Private/Admin
 */
export const getMockTestResults = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20' } = req.query;
  const pageNum  = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip     = (pageNum - 1) * limitNum;

  const results = await Result.find({ mockTest: req.params.mockTestId, isFirstAttempt: true })
    .populate('user', 'name email')
    .sort('-finalScore')
    .skip(skip)
    .limit(limitNum)
    .select('user finalScore percentage rank percentile accuracy timeTaken attemptNumber createdAt');

  const total = await Result.countDocuments({
    mockTest: req.params.mockTestId,
    isFirstAttempt: true,
  });

  ApiResponse.paginated(res, results, pageNum, limitNum, total, 'Results fetched successfully');
});

export default {
  getResultById,
  getMyResults,
  getAnalytics,
  getScorecard,
  getMockTestResults,
};