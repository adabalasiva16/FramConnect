import { PaymentMethod } from '../types';

export interface PaymentIntent {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  upiId?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
  timestamp: string;
}

export const paymentService = {
  async processPayment(intent: PaymentIntent): Promise<PaymentResult> {
    // Simulate real gateway processing with slight network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const txnId = `TXN-${intent.paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`;

    if (intent.paymentMethod === 'cod') {
      return {
        success: true,
        transactionId: txnId,
        message: 'Order placed with Cash on Delivery. Pay the farmer/delivery partner on delivery.',
        timestamp: new Date().toISOString(),
      };
    }

    if (intent.paymentMethod === 'upi') {
      return {
        success: true,
        transactionId: txnId,
        message: `UPI Payment verified via ${intent.upiId || 'Direct UPI Gateway'}. Direct credit initiated to farmer account.`,
        timestamp: new Date().toISOString(),
      };
    }

    if (intent.paymentMethod === 'razorpay') {
      return {
        success: true,
        transactionId: txnId,
        message: 'Razorpay Sandbox Payment Authorized successfully.',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      transactionId: txnId,
      message: 'Card payment processed securely via encrypted gateway.',
      timestamp: new Date().toISOString(),
    };
  },
};
