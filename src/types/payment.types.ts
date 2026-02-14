export type PaymentStatus = 'created' | 'pending' | 'success' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'netbanking' | 'upi' | 'wallet' | 'emi';
export type RefundStatus = 'pending' | 'processed' | 'failed';

export interface CreateOrderDTO {
  packageId: string;
  offerCode?: string;
}

export interface VerifyPaymentDTO {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  credits: number;
  razorpayKey: string;
  package: {
    id: string;
    name: string;
    price: number;
  };
  discount: {
    applied: boolean;
    amount: number;
    code: string | null;
  };
}

export interface PaymentWebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        method: string;
        status: string;
        error_description?: string;
      };
    };
  };
}

export interface RefundRequestDTO {
  paymentId: string;
  reason: string;
  amount?: number;
}