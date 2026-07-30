export type SubscriptionPlanId = 'free' | string; // 'free' plus whatever plan ids PRICING_PLANS defines (starter/growth/enterprise)
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';
export type PaymentProvider = 'stripe' | 'razorpay';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface SubscriptionDoc {
  id: string; // == workspaceId, one active subscription per workspace
  workspaceId: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  billingPeriod: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentProvider: PaymentProvider | null;
  /** The provider's own subscription/customer id, once real payments are wired up. Never a secret. */
  providerSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistoryDoc {
  id: string;
  workspaceId: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string;
  invoiceId: string | null;
  createdAt: string;
}

export interface InvoiceDoc {
  id: string;
  workspaceId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  periodStart: string;
  periodEnd: string;
  paymentMethodLabel: string | null; // e.g. "Visa •••• 4242" — display-safe, never a real card number
  receiptUrl: string | null;
  refundStatus: 'none' | 'partial' | 'full';
  createdAt: string;
}

// Display names for plans come from PRICING_PLANS (data/mockData.ts) — the
// same marketing content shown on the landing page and Admin's Pricing tab —
// so there's a single source of truth instead of a duplicated plan list here.
