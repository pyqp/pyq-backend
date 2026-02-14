import { Response } from 'express';
import Career from '../models/Career.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

export const getOpenPositions = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const careers = await Career.find({ status: 'open' }).sort('-createdAt');
  ApiResponse.success(res, careers, 'Open positions fetched');
});

export const getPositionBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
  const career = await Career.findOne({ slug: req.params.slug, status: 'open' });
  if (!career) throw new ApiError('Position not found', 404);
  ApiResponse.success(res, career, 'Position fetched');
});

export const createPosition = asyncHandler(async (req: AuthRequest, res: Response) => {
  const career = await Career.create(req.body);
  ApiResponse.success(res, career, 'Position created', 201);
});

export const updatePosition = asyncHandler(async (req: AuthRequest, res: Response) => {
  const career = await Career.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!career) throw new ApiError('Position not found', 404);
  ApiResponse.success(res, career, 'Position updated');
});

export const closePosition = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Career.findByIdAndUpdate(req.params.id, { status: 'closed' });
  ApiResponse.success(res, null, 'Position closed');
});

export default { getOpenPositions, getPositionBySlug, createPosition, updatePosition, closePosition };