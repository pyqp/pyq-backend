import { Response } from 'express';
import PYQ from '../models/PYQ.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

export const getAllPYQs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examId, year, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const query: any = { isActive: true };
  if (examId) query.exam = examId;
  if (year)   query.year = parseInt(year as string, 10);

  const [pyqs, total] = await Promise.all([
    PYQ.find(query).populate('exam', 'name shortName').sort('-year').skip((pageNum - 1) * limitNum).limit(limitNum),
    PYQ.countDocuments(query),
  ]);
  ApiResponse.paginated(res, pyqs, pageNum, limitNum, total, 'PYQs fetched');
});

export const getPYQById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pyq = await PYQ.findById(req.params.id).populate('exam', 'name shortName category');
  if (!pyq) throw new ApiError('PYQ not found', 404);
  await PYQ.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
  ApiResponse.success(res, pyq, 'PYQ fetched successfully');
});

export const getPYQsByExam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pyqs = await PYQ.find({ exam: req.params.examId, isActive: true })
    .sort('-year shift').lean();
  const byYear = pyqs.reduce((acc: any, p) => {
    if (!acc[p.year]) acc[p.year] = [];
    acc[p.year].push(p);
    return acc;
  }, {});
  ApiResponse.success(res, { byYear, total: pyqs.length }, 'PYQs fetched by exam');
});

export const createPYQ = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pyq = await PYQ.create(req.body);
  ApiResponse.success(res, pyq, 'PYQ created successfully', 201);
});

export const updatePYQ = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pyq = await PYQ.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!pyq) throw new ApiError('PYQ not found', 404);
  ApiResponse.success(res, pyq, 'PYQ updated successfully');
});

export const deletePYQ = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pyq = await PYQ.findByIdAndUpdate(req.params.id, { isActive: false });
  if (!pyq) throw new ApiError('PYQ not found', 404);
  ApiResponse.success(res, null, 'PYQ deleted successfully');
});

export default { getAllPYQs, getPYQById, getPYQsByExam, createPYQ, updatePYQ, deletePYQ };