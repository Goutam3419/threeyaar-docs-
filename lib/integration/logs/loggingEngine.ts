import { adminDb } from '@/lib/firebase/admin';
import type { IntegrationLogEntry } from '../types';

const LOGS_COLLECTION = 'integrationLogs';

// Defense in depth: even though callers should never pass token/secret
// fields into a log entry, strip any key that looks credential-like before
// writing, so a future coding mistake elsewhere can't leak one into logs.
const SENSITIVE_KEY_PATTERN = /token|secret|password|apikey|api_key|credential/i;

function sanitize<T extends Record<string, unknown>>(obj: T): T {
  const clean = { ...obj };
  for (const key of Object.keys(clean)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) delete (clean as any)[key];
  }
  return clean;
}

export interface LogOperationInput {
  provider: string;
  workspaceId: string;
  userId: string;
  operation: string;
  startedAt: string;
  durationMs: number;
  result: 'success' | 'failure';
  status?: number | null;
  error?: string | null;
  retryCount?: number;
}

export async function logOperation(input: LogOperationInput): Promise<void> {
  if (!adminDb) return; // logging must never block/throw and break the caller's actual operation
  try {
    const clean = sanitize(input as unknown as Record<string, unknown>);
    const ref = adminDb.collection(LOGS_COLLECTION).doc();
    const entry: IntegrationLogEntry = {
      id: ref.id,
      provider: String(clean.provider),
      workspaceId: String(clean.workspaceId),
      userId: String(clean.userId),
      operation: String(clean.operation),
      startedAt: String(clean.startedAt),
      durationMs: Number(clean.durationMs) || 0,
      result: (clean.result as 'success' | 'failure') || 'failure',
      status: (clean.status as number) ?? null,
      error: (clean.error as string) ?? null,
      retryCount: Number(clean.retryCount) || 0,
    };
    await ref.set(entry);
  } catch {
    // Logging failures must never surface to the caller.
  }
}

export async function getRecentLogs(workspaceId: string, max = 50): Promise<IntegrationLogEntry[]> {
  if (!adminDb) return [];
  const snap = await adminDb
    .collection(LOGS_COLLECTION)
    .where('workspaceId', '==', workspaceId)
    .orderBy('startedAt', 'desc')
    .limit(max)
    .get();
  return snap.docs.map((d) => d.data() as IntegrationLogEntry);
}

export async function getErrorLogs(workspaceId: string, max = 50): Promise<IntegrationLogEntry[]> {
  if (!adminDb) return [];
  const snap = await adminDb
    .collection(LOGS_COLLECTION)
    .where('workspaceId', '==', workspaceId)
    .where('result', '==', 'failure')
    .orderBy('startedAt', 'desc')
    .limit(max)
    .get();
  return snap.docs.map((d) => d.data() as IntegrationLogEntry);
}
