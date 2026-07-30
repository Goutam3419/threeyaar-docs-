import { adminDb } from '@/lib/firebase/admin';
import { getOAuthProvider } from '../registry';
import { getValidAccessToken } from '../token/tokenManager';
import { classifyHttpStatus, IntegrationError } from '../errors/IntegrationError';
import type { ConnectionDoc } from '@/types/connections';
import type { HealthResult, HealthStatus } from '../types';

function scoreFor(status: HealthStatus): number {
  switch (status) {
    case 'online': return 100;
    case 'rate_limited': return 60;
    case 'maintenance': return 40;
    case 'expired_token': return 20;
    case 'auth_failed': return 10;
    case 'offline': return 0;
    default: return 50;
  }
}

/** Performs a real, live health check against the provider's API. */
export async function checkHealth(provider: string, workspaceId: string): Promise<HealthResult> {
  const now = new Date().toISOString();
  const providerConfig = getOAuthProvider(provider);
  const base: Omit<HealthResult, 'status' | 'score' | 'latencyMs' | 'message'> = { provider, workspaceId, lastCheck: now };

  if (!providerConfig?.testEndpoint) {
    const result: HealthResult = { ...base, status: 'unknown', score: scoreFor('unknown'), latencyMs: null, message: 'No health check endpoint configured.' };
    return result;
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(provider, workspaceId);
  } catch (err) {
    const status: HealthStatus = err instanceof IntegrationError && err.code === 'expired_token' ? 'expired_token' : 'auth_failed';
    return { ...base, status, score: scoreFor(status), latencyMs: null, message: err instanceof Error ? err.message : 'Not connected.' };
  }

  const started = Date.now();
  try {
    const res = await fetch(providerConfig.testEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - started;

    if (res.ok) {
      return { ...base, status: 'online', score: scoreFor('online'), latencyMs };
    }

    const errorCode = classifyHttpStatus(res.status);
    const status: HealthStatus =
      errorCode === 'rate_limit' ? 'rate_limited' :
      errorCode === 'unauthorized' ? 'auth_failed' :
      errorCode === 'provider_offline' ? 'offline' : 'unknown';
    return { ...base, status, score: scoreFor(status), latencyMs, message: `HTTP ${res.status}` };
  } catch (err: any) {
    const latencyMs = Date.now() - started;
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    const status: HealthStatus = isTimeout ? 'offline' : 'offline';
    return { ...base, status, score: scoreFor(status), latencyMs, message: isTimeout ? 'Request timed out.' : 'Network error.' };
  }
}

/** Persists the result onto the connection doc so the admin dashboard can read it without a live check. */
export async function checkAndPersistHealth(provider: string, workspaceId: string): Promise<HealthResult> {
  const result = await checkHealth(provider, workspaceId);
  if (adminDb) {
    const connectionId = `${workspaceId}_${provider}`;
    await adminDb.collection('connections').doc(connectionId).update({
      status: result.status === 'online' ? 'CONNECTED' : result.status === 'expired_token' ? 'EXPIRED' : 'ERROR',
      lastSynced: result.lastCheck,
      lastError: result.status === 'online' ? null : result.status,
      updatedAt: result.lastCheck,
    }).catch(() => {});
  }
  return result;
}

/** Aggregate health across every connection in a workspace — for the admin dashboard. */
export async function getHealthSummary(workspaceId: string): Promise<{ healthy: number; unhealthy: number; total: number }> {
  if (!adminDb) return { healthy: 0, unhealthy: 0, total: 0 };
  const snap = await adminDb.collection('connections').where('workspaceId', '==', workspaceId).get();
  const docs = snap.docs.map((d) => d.data() as ConnectionDoc);
  const healthy = docs.filter((d) => d.status === 'CONNECTED').length;
  return { healthy, unhealthy: docs.length - healthy, total: docs.length };
}
