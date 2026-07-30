import { adminDb } from '@/lib/firebase/admin';
import type { QueueItem, QueueItemStatus } from '../types';

const QUEUE_COLLECTION = 'integrationQueue';

export interface EnqueueInput {
  workspaceId: string;
  userId: string;
  provider: string;
  operation: string;
  payload?: Record<string, unknown>;
  maxAttempts?: number;
}

export async function enqueue(input: EnqueueInput): Promise<QueueItem> {
  if (!adminDb) throw new Error('Server database is not configured.');
  const now = new Date().toISOString();
  const ref = adminDb.collection(QUEUE_COLLECTION).doc();
  const item: QueueItem = {
    id: ref.id,
    workspaceId: input.workspaceId,
    userId: input.userId,
    provider: input.provider,
    operation: input.operation,
    payload: input.payload || {},
    status: 'pending',
    attempts: 0,
    maxAttempts: input.maxAttempts ?? 3,
    createdAt: now,
    updatedAt: now,
    result: null,
    error: null,
  };
  await ref.set(item);
  return item;
}

export async function updateQueueItemStatus(
  id: string,
  status: QueueItemStatus,
  updates: Partial<Pick<QueueItem, 'result' | 'error' | 'attempts'>> = {}
): Promise<void> {
  if (!adminDb) throw new Error('Server database is not configured.');
  await adminDb.collection(QUEUE_COLLECTION).doc(id).update({
    status,
    updatedAt: new Date().toISOString(),
    ...updates,
  });
}

export async function cancelQueueItem(id: string): Promise<void> {
  await updateQueueItemStatus(id, 'cancelled');
}

/**
 * Pulls the next pending item for a workspace, marking it 'running'.
 * A future background worker (out of scope for this prompt) would call this
 * in a loop. Nothing in this codebase invokes it automatically — building
 * that worker/processor is deliberately left for the AI Agent execution
 * layer, per this prompt's "no automation" boundary.
 */
export async function claimNextQueueItem(workspaceId: string): Promise<QueueItem | null> {
  if (!adminDb) throw new Error('Server database is not configured.');
  const snap = await adminDb
    .collection(QUEUE_COLLECTION)
    .where('workspaceId', '==', workspaceId)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'asc')
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  await doc.ref.update({ status: 'running', updatedAt: new Date().toISOString() });
  return { ...(doc.data() as QueueItem), status: 'running' };
}

export async function getQueueStats(workspaceId: string): Promise<Record<QueueItemStatus, number>> {
  if (!adminDb) return { pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 };
  const snap = await adminDb.collection(QUEUE_COLLECTION).where('workspaceId', '==', workspaceId).get();
  const stats: Record<QueueItemStatus, number> = { pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 };
  snap.docs.forEach((d) => {
    const status = (d.data() as QueueItem).status;
    stats[status] = (stats[status] || 0) + 1;
  });
  return stats;
}
