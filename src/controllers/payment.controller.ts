import { Response } from 'express';
import { createHmac } from 'crypto';
import razorpay from '../config/razorpay.config';
import Package from '../models/Package.model';
import Payment from '../models/Payment.model';
import User from '../models/User.model';
import CreditTransaction from '../models/CreditTransaction.model';
import Offer from '../models/Offer.model';
import UserOfferUsage from '../models/UserOfferUsage.model';
import { completeReferralOnPurchase } from './Referral.controller';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import logger from '../utils/logger';

/**
 * @desc    Create Razorpay order
 * @route   POST /api/v1/payments/create-order
 * @access  Private
 */
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { packageId, offerCode } = req.body;
  const userId = req.user?._id;

  // Get package
  const package_ = await Package.findById(packageId);
  if (!package_ || !package_.isActive) {
    throw new ApiError('Package not found or inactive', 404);
  }

  let finalAmount = package_.price;
  let discountAmount = 0;
  let appliedOffer = null;

  // Apply offer if provided
  if (offerCode) {
    const offer = await Offer.findOne({ code: offerCode.toUpperCase(), isActive: true });
    
    if (offer) {
      const now = new Date();
      
      // Check if offer is valid
      if (now < offer.startDate || now > offer.endDate) {
        throw new ApiError('Offer has expired or not yet started', 400);
      }
      
      // Check usage limits
      if (offer.totalUsageLimit && offer.currentUsageCount >= offer.totalUsageLimit) {
        throw new ApiError('Offer usage limit reached', 400);
      }
      
      // Check per-user limit
      const userUsageCount = await UserOfferUsage.countDocuments({
        user: userId,
        offer: offer._id,
      });
      
      if (userUsageCount >= offer.perUserLimit) {
        throw new ApiError('You have already used this offer', 400);
      }
      
      // Check if package is applicable
      if (offer.applicablePackages.length > 0) {
        const isApplicable = offer.applicablePackages.some(
          (pkg: any) => pkg.toString() === packageId
        );
        if (!isApplicable) {
          throw new ApiError('Offer not applicable to this package', 400);
        }
      }
      
      // Calculate discount
      if (offer.discountPercentage) {
        discountAmount = Math.round((package_.price * offer.discountPercentage) / 100);
        if (offer.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, offer.maxDiscountAmount);
        }
      } else if (offer.discountAmount) {
        discountAmount = offer.discountAmount;
      }
      
      finalAmount = Math.max(package_.price - discountAmount, 0);
      appliedOffer = offer;
    }
  }

  // Create Razorpay order
  const options = {
    amount: finalAmount * 100, // Razorpay expects amount in paise
    currency: 'INR',
    receipt: `order_${Date.now()}`,
    notes: {
      userId: userId?.toString(),
      packageId: packageId,
      credits: String(package_.credits),
      offerCode: offerCode || '',
    },
  };

  const razorpayOrder = await razorpay.orders.create(options as any) as any;

  // Create payment record
  const payment = await Payment.create({
    user: userId,
    package: packageId,
    orderId: razorpayOrder.id,
    amount: finalAmount,
    currency: 'INR',
    status: 'created',
    creditsAwarded: package_.credits,
    validityDays: package_.validityDays,
    metadata: {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      offerCode: offerCode || null,
    },
  });

  ApiResponse.success(
    res,
    {
      orderId: razorpayOrder.id,
      amount: finalAmount,
      currency: 'INR',
      credits: package_.credits,
      package: {
        id: package_._id,
        name: package_.name,
        price: package_.price,
      },
      discount: {
        applied: !!appliedOffer,
        amount: discountAmount,
        code: offerCode || null,
      },
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    },
    'Order created successfully',
    201
  );
});

/**
 * @desc    Verify payment
 * @route   POST /api/v1/payments/verify
 * @access  Private
 */
export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId, paymentId, signature } = req.body;
  const userId = req.user?._id;

  // Find payment
  const payment = await Payment.findOne({ orderId, user: userId });
  if (!payment) {
    throw new ApiError('Payment not found', 404);
  }

  // Verify signature
  const generatedSignature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (generatedSignature !== signature) {
    payment.status = 'failed';
    payment.failureReason = 'Invalid signature';
    await payment.save();
    throw new ApiError('Payment verification failed', 400);
  }

  // Update payment status
  payment.paymentId = paymentId;
  payment.signature = signature;
  payment.status = 'success';
  await payment.save();

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Award credits to user
  await user.addCredits(payment.creditsAwarded, payment.validityDays, payment.package.toString());

  // Create credit transaction
  await CreditTransaction.create({
    user: userId,
    type: 'credit',
    amount: payment.creditsAwarded,
    balanceBefore: user.credits.total - payment.creditsAwarded,
    balanceAfter: user.credits.total,
    source: 'purchase',
    reference: payment._id,
    referenceModel: 'Payment',
    description: `Purchased ${payment.creditsAwarded} credits`,
    expiryDate: new Date(Date.now() + payment.validityDays * 24 * 60 * 60 * 1000),
  });

  // Complete referral bonus if this is their first purchase
  const priorPayments = await Payment.countDocuments({ user: userId, status: 'success' });
  if (priorPayments === 1) {
    await completeReferralOnPurchase(userId!.toString(), payment.amount).catch(err =>
      logger.warn(`Referral completion failed silently: ${err.message}`)
    );
  }

  // Update offer usage if applicable
  if (payment.metadata.offerCode) {
    const offer = await Offer.findOne({ code: payment.metadata.offerCode });
    if (offer) {
      offer.currentUsageCount += 1;
      await offer.save();

      await UserOfferUsage.create({
        user: userId,
        offer: offer._id,
        payment: payment._id,
        discountAmount: payment.amount,
        usageDate: new Date(),
      });
    }
  }

  logger.info(`Payment successful: ${paymentId} for user ${userId}`);

  ApiResponse.success(
    res,
    {
      payment: {
        id: payment._id,
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        status: payment.status,
      },
      credits: {
        awarded: payment.creditsAwarded,
        total: user.credits.total,
      },
    },
    'Payment verified successfully'
  );
});

/**
 * @desc    Get payment history
 * @route   GET /api/v1/payments/history
 * @access  Private
 */
export const getPaymentHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const payments = await Payment.find({ user: userId })
    .populate('package', 'name credits price')
    .select('-signature -metadata')
    .sort('-createdAt')
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Payment.countDocuments({ user: userId });

  ApiResponse.paginated(
    res,
    payments,
    pageNum,
    limitNum,
    total,
    'Payment history fetched successfully'
  );
});

/**
 * @desc    Get payment by ID
 * @route   GET /api/v1/payments/:id
 * @access  Private
 */
export const getPaymentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?._id;

  const payment = await Payment.findOne({ _id: id, user: userId })
    .populate('package', 'name credits price')
    .select('-signature')
    .lean();

  if (!payment) {
    throw new ApiError('Payment not found', 404);
  }

  ApiResponse.success(res, payment, 'Payment details fetched successfully');
});

/**
 * @desc    Razorpay webhook
 * @route   POST /api/v1/payments/webhook
 * @access  Public (but verified)
 */
export const handleWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
  const webhookSignature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET as string;

  // Verify webhook signature
  const generatedSignature = createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (generatedSignature !== webhookSignature) {
    throw new ApiError('Invalid webhook signature', 400);
  }

  const event = req.body.event;
  const payload = req.body.payload.payment.entity;

  logger.info(`Webhook received: ${event}`);

  // Handle different events
  switch (event) {
    case 'payment.captured':
      // Payment successful
      await Payment.findOneAndUpdate(
        { orderId: payload.order_id },
        {
          paymentId: payload.id,
          status: 'success',
          method: payload.method,
        }
      );
      break;

    case 'payment.failed':
      // Payment failed
      await Payment.findOneAndUpdate(
        { orderId: payload.order_id },
        {
          paymentId: payload.id,
          status: 'failed',
          failureReason: payload.error_description,
        }
      );
      break;

    default:
      logger.info(`Unhandled webhook event: ${event}`);
  }

  res.status(200).json({ status: 'ok' });
});

export default {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentById,
  handleWebhook,
};