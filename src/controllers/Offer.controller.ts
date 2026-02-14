import { Response } from 'express';
import Offer from '../models/Offer.model';
import UserOfferUsage from '../models/UserOfferUsage.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

/**
 * @desc    Get all active offers
 * @route   GET /api/v1/offers
 * @access  Public
 */
export const getActiveOffers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const now = new Date();
  const offers = await Offer.find({
    isActive:  true,
    startDate: { $lte: now },
    endDate:   { $gte: now },
  })
    .select('-eligibilityCriteria -currentUsageCount -totalUsageLimit -__v')
    .sort('-createdAt');

  ApiResponse.success(res, offers, 'Active offers fetched successfully');
});

/**
 * @desc    Validate an offer code for a package
 * @route   POST /api/v1/offers/validate
 * @access  Private
 */
export const validateOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code, packageId } = req.body;
  const userId = req.user!._id;

  if (!code) throw new ApiError('Please provide an offer code', 400);

  const offer = await Offer.findOne({ code: code.toUpperCase(), isActive: true });
  if (!offer) throw new ApiError('Invalid offer code', 404);

  const now = new Date();

  // Date validation
  if (now < offer.startDate || now > offer.endDate) {
    throw new ApiError('This offer has expired or not yet started', 400);
  }

  // Usage limit
  if (offer.totalUsageLimit && offer.currentUsageCount >= offer.totalUsageLimit) {
    throw new ApiError('This offer has reached its usage limit', 400);
  }

  // Per-user limit
  const userUsageCount = await UserOfferUsage.countDocuments({
    user:  userId,
    offer: offer._id,
  });
  if (userUsageCount >= offer.perUserLimit) {
    throw new ApiError('You have already used this offer', 400);
  }

  // Package applicability
  if (packageId && offer.applicablePackages.length > 0) {
    const applicable = offer.applicablePackages.some(
      (pid: any) => pid.toString() === packageId
    );
    if (!applicable) {
      throw new ApiError('This offer is not applicable to the selected package', 400);
    }
  }

  ApiResponse.success(res, {
    valid:              true,
    code:               offer.code,
    name:               offer.name,
    description:        offer.description,
    discountPercentage: offer.discountPercentage,
    discountAmount:     offer.discountAmount,
    maxDiscountAmount:  offer.maxDiscountAmount,
    endDate:            offer.endDate,
    termsAndConditions: offer.termsAndConditions,
  }, 'Offer code is valid');
});

/**
 * @desc    Get offer details by code
 * @route   GET /api/v1/offers/:code
 * @access  Public
 */
export const getOfferByCode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const code = (req.params.code as string).toUpperCase();
  const now  = new Date();

  const offer = await Offer.findOne({
    code,
    isActive:  true,
    startDate: { $lte: now },
    endDate:   { $gte: now },
  }).select('-eligibilityCriteria -currentUsageCount -__v');

  if (!offer) throw new ApiError('Offer not found or expired', 404);

  ApiResponse.success(res, offer, 'Offer fetched successfully');
});

/**
 * @desc    Create offer (Admin)
 * @route   POST /api/v1/offers
 * @access  Private/Admin
 */
export const createOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const offer = await Offer.create(req.body);
  ApiResponse.success(res, offer, 'Offer created successfully', 201);
});

/**
 * @desc    Update offer (Admin)
 * @route   PUT /api/v1/offers/:id
 * @access  Private/Admin
 */
export const updateOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!offer) throw new ApiError('Offer not found', 404);
  ApiResponse.success(res, offer, 'Offer updated successfully');
});

/**
 * @desc    Delete offer (Admin)
 * @route   DELETE /api/v1/offers/:id
 * @access  Private/Admin
 */
export const deleteOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const offer = await Offer.findByIdAndDelete(req.params.id);
  if (!offer) throw new ApiError('Offer not found', 404);
  ApiResponse.success(res, null, 'Offer deleted successfully');
});

export default {
  getActiveOffers,
  validateOffer,
  getOfferByCode,
  createOffer,
  updateOffer,
  deleteOffer,
};