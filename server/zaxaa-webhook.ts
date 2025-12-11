import { Request, Response } from "express";
import { 
  handleSuccessfulPurchase,
  handleInvoicePaid,
  handlePaymentFailure,
  handleCancellation,
  handleRefund,
  ProductType
} from "./entitlements-utils";

interface ZaxaaWebhookPayload {
  event_type: string;
  transaction_id: string;
  user_id?: string;
  product_type?: string;
  amount?: number;
  currency?: string;
  subscription_id?: string;
  customer_email?: string;
  product_name?: string;
  [key: string]: any;
}

export async function handleZaxaaWebhook(req: Request, res: Response) {
  const payload = req.body as ZaxaaWebhookPayload;
  
  // Verify webhook authenticity (implement according to Zaxaa's documentation)
  const webhookSecret = process.env.ZAXAA_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Zaxaa webhook secret not configured');
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }

  // Add signature verification here based on Zaxaa's requirements
  // This is a placeholder - implement according to Zaxaa documentation
  
  try {
    const { event_type, user_id, product_type } = payload;
    
    if (!user_id || !product_type) {
      console.error('Missing required fields in Zaxaa webhook:', { user_id, product_type });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    switch (event_type) {
      case 'purchase_completed':
      case 'subscription_started': {
        await handleSuccessfulPurchase(
          user_id,
          product_type as ProductType,
          {
            zaxaaSubscriptionId: payload.subscription_id,
            planName: payload.product_name,
            planAmount: payload.amount?.toString(),
            currency: payload.currency?.toUpperCase(),
          }
        );
        
        console.log(`Processed Zaxaa successful purchase for user ${user_id}, type: ${product_type}`);
        break;
      }

      case 'subscription_payment_success':
      case 'recurring_payment_success': {
        await handleInvoicePaid(
          user_id,
          product_type as ProductType
        );
        
        console.log(`Processed Zaxaa invoice payment for user ${user_id}, type: ${product_type}`);
        break;
      }

      case 'subscription_payment_failed':
      case 'recurring_payment_failed': {
        await handlePaymentFailure(
          user_id,
          product_type as ProductType
        );
        
        console.log(`Processed Zaxaa payment failure for user ${user_id}, type: ${product_type}`);
        break;
      }

      case 'subscription_cancelled':
      case 'subscription_ended': {
        await handleCancellation(
          user_id,
          product_type as ProductType
        );
        
        console.log(`Processed Zaxaa cancellation for user ${user_id}, type: ${product_type}`);
        break;
      }

      case 'refund_issued':
      case 'chargeback_created': {
        await handleRefund(
          user_id,
          product_type as ProductType
        );
        
        console.log(`Processed Zaxaa refund for user ${user_id}, type: ${product_type}`);
        break;
      }

      default:
        console.log(`Unhandled Zaxaa event type: ${event_type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing Zaxaa webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}