import { Response } from 'express';
import AnalyticsService from '../services/analytics.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

export const getMyPerformanceTrend = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit  = parseInt((req.query.limit as string) || '10', 10);
  const data   = await AnalyticsService.getUserPerformanceTrend(req.user!._id.toString(), limit);
  ApiResponse.success(res, data, 'Performance trend fetched');
});

export const getMySubjectStrengths = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await AnalyticsService.getUserSubjectStrengths(req.user!._id.toString());
  ApiResponse.success(res, data, 'Subject strengths fetched');
});

export const getScoreDistribution = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await AnalyticsService.getScoreDistribution(req.params.mockTestId);
  ApiResponse.success(res, data, 'Score distribution fetched');
});

export const getPlatformOverview = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const data = await AnalyticsService.getPlatformOverview();
  ApiResponse.success(res, data, 'Platform overview fetched');
});

export default {
  getMyPerformanceTrend,
  getMySubjectStrengths,
  getScoreDistribution,
  getPlatformOverview,
};