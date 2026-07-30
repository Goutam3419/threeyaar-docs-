import { collection, doc, setDoc, query, where, orderBy, limit as fsLimit, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { ActivityLogDoc, ActivityEventType } from '@/types/logs';

const COL = 'activityLogs';

export interface LogActivityInput {
  workspaceId: string;
  userId: string;
  userName: string;
  type: ActivityEventType;
  description: string;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const ref = doc(collection(db, COL));
    const record: ActivityLogDoc = { ...input, id: ref.id, createdAt: new Date().toISOString() };
    await setDoc(ref, record);
  } catch {
    // Activity logging must never block the action that triggered it.
  }
}

export function subscribeToActivity(
  workspaceId: string,
  callback: (logs: ActivityLogDoc[]) => void,
  max = 50
): Unsubscribe {
  const q = query(collection(db, COL), where('workspaceId', '==', workspaceId), orderBy('createdAt', 'desc'), fsLimit(max));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => d.data() as ActivityLogDoc)), () => {});
}
