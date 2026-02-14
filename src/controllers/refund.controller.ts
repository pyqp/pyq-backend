import { Response } from 'express';
import Refund from '../models/Refund.model';
import Payment from '../models/Payment.model';
import User from '../models/User.model';
import CreditTransaction from '../models/CreditTransaction.model';
import PaymentService from '../services/payment.service';
import NotificationService from '../services/notification.service';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

/**
 * @route POST /api/v1/refunds/request
 * @access Private
 */
export const requestRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { paymentId, reason, amount } = req.body;
  const userId = req.user!._id;

  const payment = await Payment.findOne({ _id: paymentId, user: userId });
  if (!payment)                      throw new ApiError('Payment not found', 404);
  if (payment.status !== 'success')  throw new ApiError('Only successful payments can be refunded', 400);

  const existing = await Refund.findOne({ payment: paymentId, status: { $in: ['pending', 'processing'] } });
  if (existing) throw new ApiError('A refund request already exists for this payment', 409);

  const refundAmount = amount ?? payment.amount;
  if (refundAmount > payment.amount) throw new ApiError('Refund amount cannot exceed payment amount', 400);

  const refund = await Refund.create({
    user: userId, payment: paymentId,
    amount: refundAmount, reason,
    status: 'pending', creditsRevoked: 0,
  });

  ApiResponse.success(res, {
    refundId: refund._id,
    status:   refund.status,
    amount:   refund.amount,
    message:  'Refund request submitted. We will process it within 5–7 business days.',
  }, 'Refund requested successfully', 201);
});

/**
 * @route GET /api/v1/refunds/my-refunds
 * @access Private
 */
export const getMyRefunds = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refunds = await Refund.find({ user: req.user!._id })
    .populate('payment', 'amount orderId createdAt')
    .sort('-createdAt');
  ApiResponse.success(res, refunds, 'Refunds fetched successfully');
});

/**
 * @route GET /api/v1/refunds (Admin)
 */
export const getAllRefunds = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const query: any = {};
  if (status) query.status = status;

  const [refunds, total] = await Promise.all([
    Refund.find(query)
      .populate('user', 'name email')
      .populate('payment', 'amount orderId')
      .sort({ status: 1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum).limit(limitNum),
    Refund.countDocuments(query),
  ]);

  ApiResponse.paginated(res, refunds, pageNum, limitNum, total, 'Refunds fetched');
});

/**
 * @route PATCH /api/v1/refunds/:id/process (Admin)
 */
export const processRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { action, adminNote } = req.body; // action: 'approve' | 'reject'
  const refund = await Refund.findById(req.params.id).populate('payment');
  if (!refund) throw new ApiError('Refund not found', 404);
  if (refund.status !== 'pending') throw new ApiError('Refund is not pending', 400);

  if (action === 'reject') {
    refund.status = 'rejected';
    refund.rejectedAt = new Date();
    refund.rejectionReason = adminNote;
    refund.processedBy = req.user!._id as any;
    await refund.save();
    return ApiResponse.success(res, refund, 'Refund rejected');
  }

  // Approve — initiate Razorpay refund
  refund.status = 'processing';
  refund.adminNote = adminNote;
  refund.processedBy = req.user!._id as any;
  await refund.save();

  try {
    const rzRefund = await PaymentService.initiateRefund(
      refund.payment._id.toString(), refund.amount
    );
    refund.razorpayRefundId = rzRefund.id;
    refund.status = 'processed';
    refund.processedAt = new Date();

    // Revoke credits
    const payment = await Payment.findById(refund.payment._id);
    if (payment) {
      const user = await User.findById(refund.user);
      if (user) {
        const before = user.credits.total;
        await user.deductCredits(payment.creditsAwarded);
        refund.creditsRevoked = payment.creditsAwarded;
        await CreditTransaction.create({
          user: refund.user, type: 'debit',
          amount: payment.creditsAwarded,
          balanceBefore: before, balanceAfter: user.credits.total,
          source: 'refund', description: `Credits revoked for refund`,
        });
      }
      payment.status = 'refunded';
      await payment.save();
    }
    await refund.save();
    await NotificationService.send(
      refund.user.toString(),
      'Refund Processed',
      `Your refund of ₹${refund.amount} has been processed. Credits revoked: ${refund.creditsRevoked}`,
      'payment'
    );
  } catch (err: any) {
    refund.status = 'failed';
    await refund.save();
    throw new ApiError(`Refund processing failed: ${err.message}`, 500);
  }

  ApiResponse.success(res, refund, 'Refund processed successfully');
});

export default { requestRefund, getMyRefunds, getAllRefunds, processRefund };