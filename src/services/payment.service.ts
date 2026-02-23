import razorpay from '../config/razorpay.config';
import { createHmac } from 'crypto';
import Payment from '../models/Payment.model';
import logger from '../utils/logger';

export class PaymentService {
  static verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return expected === signature;
  }

  static verifyWebhookSignature(body: string, signature: string): boolean {
    const expected = createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET as string)
      .update(body)
      .digest('hex');
    return expected === signature;
  }

  static async createRazorpayOrder(
    amount: number,
    receipt: string,
    notes: Record<string, string>
  ): Promise<any> {
    return razorpay.orders.create({
      amount:   amount * 100,  // paise
      currency: 'INR',
      receipt,
      notes,
    } as any);
  }

  static async initiateRefund(
    paymentId: string,
    amount: number,
    notes?: Record<string, string>
  ): Promise<any> {
    const payment = await Payment.findById(paymentId);
    if (!payment || !payment.paymentId) throw new Error('Payment not found or not completed');
    if (payment.status !== 'success')   throw new Error('Only successful payments can be refunded');

    try {
      return await (razorpay.payments as any).refund(payment.paymentId, {
        amount: amount * 100,
        notes,
      });
    } catch (err: any) {
      logger.error(`Refund initiation failed: ${err.message}`);
      throw err;
    }
  }

  static async getPaymentStats(startDate: Date, endDate: Date) {
    const result = await Payment.aggregate([
      { $match: { status: 'success', createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id:          null,
        total:        { $sum: '$amount' },
        count:        { $sum: 1 },
        avgOrder:     { $avg: '$amount' },
        totalCredits: { $sum: '$creditsAwarded' },
      }},
    ]);
    return result[0] ?? { total: 0, count: 0, avgOrder: 0, totalCredits: 0 };
  }
}

export default PaymentService;