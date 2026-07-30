import { collection, doc, setDoc, getDocs, query, where, orderBy, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { COLLECTIONS } from '@/types/firestore';
import type { PaymentHistoryDoc, InvoiceDoc } from '@/types/billing';

const PAYMENTS_COL = COLLECTIONS.PAYMENT_HISTORY;
const INVOICES_COL = COLLECTIONS.INVOICES;

export function subscribeToPaymentHistory(workspaceId: string, callback: (payments: PaymentHistoryDoc[]) => void): Unsubscribe {
  const q = query(collection(db, PAYMENTS_COL), where('workspaceId', '==', workspaceId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => d.data() as PaymentHistoryDoc)), () => {});
}

export function subscribeToInvoices(workspaceId: string, callback: (invoices: InvoiceDoc[]) => void): Unsubscribe {
  const q = query(collection(db, INVOICES_COL), where('workspaceId', '==', workspaceId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => d.data() as InvoiceDoc)), () => {});
}

/**
 * Records a payment attempt. In production this would be called from a
 * verified Stripe/Razorpay webhook handler (server-side), never from the
 * client directly with a real charge result. This function exists so the
 * billing architecture (history, invoices, receipts) is real and ready —
 * only the actual charge-a-card step is intentionally not built yet.
 */
export async function recordPaymentHistory(entry: Omit<PaymentHistoryDoc, 'id' | 'createdAt'>): Promise<PaymentHistoryDoc> {
  const ref = doc(collection(db, PAYMENTS_COL));
  const record: PaymentHistoryDoc = { ...entry, id: ref.id, createdAt: new Date().toISOString() };
  await setDoc(ref, record);
  return record;
}

export async function recordInvoice(entry: Omit<InvoiceDoc, 'id' | 'createdAt'>): Promise<InvoiceDoc> {
  const ref = doc(collection(db, INVOICES_COL));
  const record: InvoiceDoc = { ...entry, id: ref.id, createdAt: new Date().toISOString() };
  await setDoc(ref, record);
  return record;
}
