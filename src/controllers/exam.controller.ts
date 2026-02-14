import { Response } from 'express';
import Exam from '../models/Exam.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

/**
 * @desc    Get all exams
 * @route   GET /api/v1/exams
 * @access  Public
 */
export const getAllExams = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    category,
    examLevel,
    search,
    isActive = 'true',
    page = '1',
    limit = '20',
    sort = '-popularity',
  } = req.query;

  // Build query
  const query: any = {};

  if (category) {
    query.category = category;
  }

  if (examLevel) {
    query.examLevel = examLevel;
  }

  if (isActive !== 'all') {
    query.isActive = isActive === 'true';
  }

  // Text search
  if (search) {
    query.$text = { $search: search as string };
  }

  // Pagination
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const exams = await Exam.find(query)
    .sort(sort as string)
    .skip(skip)
    .limit(limitNum)
    .select('-__v');

  // Get total count
  const total = await Exam.countDocuments(query);

  ApiResponse.paginated(res, exams, pageNum, limitNum, total, 'Exams fetched successfully');
});

/**
 * @desc    Get exam by ID
 * @route   GET /api/v1/exams/:id
 * @access  Public
 */
export const getExamById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const exam = await Exam.findById(id).select('-__v');

  if (!exam) {
    throw new ApiError('Exam not found', 404);
  }

  ApiResponse.success(res, exam, 'Exam fetched successfully');
});

/**
 * @desc    Get exam by slug
 * @route   GET /api/v1/exams/slug/:slug
 * @access  Public
 */
export const getExamBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;

  const exam = await Exam.findOne({ slug }).select('-__v');

  if (!exam) {
    throw new ApiError('Exam not found', 404);
  }

  // Increment popularity
  exam.popularity += 1;
  await exam.save();

  ApiResponse.success(res, exam, 'Exam fetched successfully');
});

/**
 * @desc    Get exams by category
 * @route   GET /api/v1/exams/category/:category
 * @access  Public
 */
export const getExamsByCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category } = req.params;
  const { page = '1', limit = '20' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const exams = await Exam.find({ category, isActive: true })
    .sort('-popularity')
    .skip(skip)
    .limit(limitNum)
    .select('-__v');

  const total = await Exam.countDocuments({ category, isActive: true });

  ApiResponse.paginated(res, exams, pageNum, limitNum, total, 'Exams fetched successfully');
});

/**
 * @desc    Get popular exams
 * @route   GET /api/v1/exams/popular
 * @access  Public
 */
export const getPopularExams = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const exams = await Exam.find({ isActive: true })
    .sort('-popularity')
    .limit(10)
    .select('name shortName category logo popularity mockTestsAvailable slug');

  ApiResponse.success(res, exams, 'Popular exams fetched successfully');
});

/**
 * @desc    Get exam categories
 * @route   GET /api/v1/exams/categories/list
 * @access  Public
 */
export const getCategories = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const categories = await Exam.distinct('category');

  // Get exam count per category
  const categoriesWithCount = await Promise.all(
    categories.map(async category => {
      const count = await Exam.countDocuments({ category, isActive: true });
      return { category, count };
    })
  );

  ApiResponse.success(
    res,
    categoriesWithCount,
    'Exam categories fetched successfully'
  );
});

/**
 * @desc    Search exams
 * @route   GET /api/v1/exams/search
 * @access  Public
 */
export const searchExams = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q } = req.query;

  if (!q) {
    throw new ApiError('Please provide search query', 400);
  }

  const exams = await Exam.find(
    { $text: { $search: q as string }, isActive: true },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(20)
    .select('name shortName category logo slug');

  ApiResponse.success(res, exams, `Found ${exams.length} exams`);
});

/**
 * @desc    Create new exam (Admin only)
 * @route   POST /api/v1/exams
 * @access  Private/Admin
 */
export const createExam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const exam = await Exam.create(req.body);

  ApiResponse.success(res, exam, 'Exam created successfully', 201);
});

/**
 * @desc    Update exam (Admin only)
 * @route   PUT /api/v1/exams/:id
 * @access  Private/Admin
 */
export const updateExam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const exam = await Exam.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!exam) {
    throw new ApiError('Exam not found', 404);
  }

  ApiResponse.success(res, exam, 'Exam updated successfully');
});

/**
 * @desc    Delete exam (Admin only)
 * @route   DELETE /api/v1/exams/:id
 * @access  Private/Admin
 */
export const deleteExam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const exam = await Exam.findByIdAndDelete(id);

  if (!exam) {
    throw new ApiError('Exam not found', 404);
  }

  ApiResponse.success(res, null, 'Exam deleted successfully');
});

export default {
  getAllExams,
  getExamById,
  getExamBySlug,
  getExamsByCategory,
  getPopularExams,
  getCategories,
  searchExams,
  createExam,
  updateExam,
  deleteExam,
};