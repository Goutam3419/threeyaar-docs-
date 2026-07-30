import { collection, doc, setDoc, query, where, orderBy, limit as fsLimit, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { AuditLogDoc } from '@/types/logs';

const COL = 'auditLogs';

let cachedIp: string | null | undefined; // undefined = not fetched yet this session

async function getClientIp(): Promise<string | null> {
  if (cachedIp !== undefined) return cachedIp;
  try {
    const res = await fetch('/api/audit/ip');
    const data = await res.json();
    cachedIp = data.ip ?? null;
  } catch {
    cachedIp = null;
  }
  return cachedIp ?? null;
}

export interface RecordAuditInput {
  action: string;
  userId: string;
  userName: string;
  workspaceId: string;
  beforeValue?: Record<string, unknown> | null;
  afterValue?: Record<string, unknown> | null;
}

export async function recordAuditLog(input: RecordAuditInput): Promise<void> {
  try {
    const ip = await getClientIp();
    const ref = doc(collection(db, COL));
    const record: AuditLogDoc = {
      id: ref.id,
      action: input.action,
      userId: input.userId,
      userName: input.userName,
      workspaceId: input.workspaceId,
      beforeValue: input.beforeValue ?? null,
      afterValue: input.afterValue ?? null,
      ip,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, record);
  } catch {
    // Audit logging must never block the action it's recording.
  }
}

/** Admin-only — Firestore rules enforce this server-side too. */
export function subscribeToAuditLogs(callback: (logs: AuditLogDoc[]) => void, max = 100): Unsubscribe {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'), fsLimit(max));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => d.data() as AuditLogDoc)), () => {});
}
