import { doc, getDoc, setDoc, updateDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { COLLECTIONS } from '@/types/firestore';
import type { SubscriptionDoc, SubscriptionPlanId } from '@/types/billing';

const COL = COLLECTIONS.SUBSCRIPTIONS;

function periodEnd(start: Date, billingPeriod: 'monthly' | 'yearly'): Date {
  const end = new Date(start);
  if (billingPeriod === 'monthly') end.setMonth(end.getMonth() + 1);
  else end.setFullYear(end.getFullYear() + 1);
  return end;
}

export async function fetchSubscription(workspaceId: string): Promise<SubscriptionDoc | null> {
  const snap = await getDoc(doc(db, COL, workspaceId));
  return snap.exists() ? (snap.data() as SubscriptionDoc) : null;
}

export function subscribeToSubscription(workspaceId: string, callback: (sub: SubscriptionDoc | null) => void): Unsubscribe {
  return onSnapshot(doc(db, COL, workspaceId), (snap) => {
    callback(snap.exists() ? (snap.data() as SubscriptionDoc) : null);
  });
}

/**
 * Ensures a workspace has a subscription record — every workspace starts on
 * the Free plan the first time billing is viewed.
 */
export async function ensureSubscription(workspaceId: string): Promise<SubscriptionDoc> {
  const existing = await fetchSubscription(workspaceId);
  if (existing) return existing;

  const now = new Date();
  const record: SubscriptionDoc = {
    id: workspaceId,
    workspaceId,
    planId: 'free',
    status: 'active',
    billingPeriod: 'monthly',
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd(now, 'monthly').toISOString(),
    cancelAtPeriodEnd: false,
    paymentProvider: null,
    providerSubscriptionId: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  await setDoc(doc(db, COL, workspaceId), record);
  return record;
}

/**
 * Changes plan (upgrade or downgrade). No real charge is made — this only
 * updates the subscription record. Wiring this to an actual Stripe/Razorpay
 * charge is explicitly out of scope for this prompt.
 */
export async function changePlan(workspaceId: string, planId: SubscriptionPlanId, billingPeriod: 'monthly' | 'yearly'): Promise<void> {
  const now = new Date();
  await updateDoc(doc(db, COL, workspaceId), {
    planId,
    billingPeriod,
    status: 'active',
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd(now, billingPeriod).toISOString(),
    cancelAtPeriodEnd: false,
    updatedAt: now.toISOString(),
  });
}

export async function cancelSubscription(workspaceId: string): Promise<void> {
  await updateDoc(doc(db, COL, workspaceId), {
    cancelAtPeriodEnd: true,
    updatedAt: new Date().toISOString(),
  });
}

export async function renewSubscription(workspaceId: string): Promise<void> {
  const sub = await fetchSubscription(workspaceId);
  if (!sub) return;
  const now = new Date();
  await updateDoc(doc(db, COL, workspaceId), {
    status: 'active',
    cancelAtPeriodEnd: false,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd(now, sub.billingPeriod).toISOString(),
    updatedAt: now.toISOString(),
  });
}
