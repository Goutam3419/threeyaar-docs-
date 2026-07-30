import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit as fsLimit,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { COLLECTIONS } from '@/types/firestore';
import type { NotificationDoc } from '@/types/firestore';

const COL = COLLECTIONS.NOTIFICATIONS;

export function subscribeToNotifications(
  workspaceId: string,
  callback: (notifications: NotificationDoc[]) => void,
  onError: (err: Error) => void,
  max = 100
): Unsubscribe {
  const q = query(collection(db, COL), where('workspaceId', '==', workspaceId), orderBy('createdAt', 'desc'), fsLimit(max));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as NotificationDoc)),
    (err) => onError(err as Error)
  );
}

export interface CreateNotificationInput {
  workspaceId: string;
  userId: string;
  title: string;
  description: string;
  category: NotificationDoc['category'];
}

/** Every other module (billing, team, marketplace...) calls this to raise a real notification. */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const ref = doc(collection(db, COL));
  const record: NotificationDoc = {
    id: ref.id,
    workspaceId: input.workspaceId,
    userId: input.userId,
    title: input.title,
    description: input.description,
    category: input.category,
    unread: true,
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, record);
}

export async function markAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, COL, notificationId), { unread: false });
}

export async function markAllAsRead(notifications: NotificationDoc[]): Promise<void> {
  const unread = notifications.filter((n) => n.unread);
  if (unread.length === 0) return;
  const batch = writeBatch(db);
  unread.forEach((n) => batch.update(doc(db, COL, n.id), { unread: false }));
  await batch.commit();
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await deleteDoc(doc(db, COL, notificationId));
}

export function getUnreadCount(notifications: NotificationDoc[]): number {
  return notifications.filter((n) => n.unread).length;
}
