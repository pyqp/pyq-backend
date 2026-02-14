import { Response } from 'express';
import Package from '../models/Package.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

/**
 * @desc    Get all packages
 * @route   GET /api/v1/packages
 * @access  Public
 */
export const getAllPackages = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const packages = await Package.find({ isActive: true })
    .sort('orderPriority price')
    .select('-__v');

  ApiResponse.success(res, packages, 'Packages fetched successfully');
});

/**
 * @desc    Get package by ID
 * @route   GET /api/v1/packages/:id
 * @access  Public
 */
export const getPackageById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pkg = await Package.findById(req.params.id).select('-__v');

  if (!pkg) {
    throw new ApiError('Package not found', 404);
  }

  ApiResponse.success(res, pkg, 'Package fetched successfully');
});

/**
 * @desc    Get package by name
 * @route   GET /api/v1/packages/name/:name
 * @access  Public
 */
export const getPackageByName = asyncHandler(async (req: AuthRequest, res: Response) => {
  const name = (req.params.name as string).toUpperCase();

  const pkg = await Package.findOne({ name, isActive: true });

  if (!pkg) {
    throw new ApiError('Package not found', 404);
  }

  ApiResponse.success(res, pkg, 'Package fetched successfully');
});

/**
 * @desc    Get most popular package
 * @route   GET /api/v1/packages/popular
 * @access  Public
 */
export const getPopularPackage = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const pkg = await Package.findOne({ isPopular: true, isActive: true });

  if (!pkg) {
    throw new ApiError('No popular package found', 404);
  }

  ApiResponse.success(res, pkg, 'Popular package fetched successfully');
});

/**
 * @desc    Compare all packages side by side
 * @route   GET /api/v1/packages/compare
 * @access  Public
 */
export const comparePackages = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const packages = await Package.find({ isActive: true })
    .sort('orderPriority')
    .select(
      'name displayName price discountedPrice credits validityDays features benefits badge isPopular color'
    );

  ApiResponse.success(
    res,
    {
      packages,
      recommended: packages.find(p => p.isPopular) || packages[1] || null,
    },
    'Package comparison fetched successfully'
  );
});

/**
 * @desc    Create package (Admin only)
 * @route   POST /api/v1/packages
 * @access  Private/Admin
 */
export const createPackage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pkg = await Package.create(req.body);

  ApiResponse.success(res, pkg, 'Package created successfully', 201);
});

/**
 * @desc    Update package (Admin only)
 * @route   PUT /api/v1/packages/:id
 * @access  Private/Admin
 */
export const updatePackage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!pkg) {
    throw new ApiError('Package not found', 404);
  }

  ApiResponse.success(res, pkg, 'Package updated successfully');
});

/**
 * @desc    Delete package (Admin only)
 * @route   DELETE /api/v1/packages/:id
 * @access  Private/Admin
 */
export const deletePackage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pkg = await Package.findByIdAndDelete(req.params.id);

  if (!pkg) {
    throw new ApiError('Package not found', 404);
  }

  ApiResponse.success(res, null, 'Package deleted successfully');
});

export default {
  getAllPackages,
  getPackageById,
  getPackageByName,
  getPopularPackage,
  comparePackages,
  createPackage,
  updatePackage,
  deletePackage,
};