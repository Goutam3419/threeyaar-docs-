import { collection, doc, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/firebase';
import type { ConnectionDoc } from '@/types/connections';

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in.');
  const idToken = await user.getIdToken();
  return { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' };
}

export function subscribeToConnections(
  workspaceId: string,
  callback: (connections: ConnectionDoc[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'connections'), where('workspaceId', '==', workspaceId));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as ConnectionDoc)),
    (err) => onError(err as Error)
  );
}

/**
 * Starts the real OAuth flow: creates a single-use state record server-side,
 * then navigates the browser to our authorize route, which redirects to the
 * real provider. shopDomain is required for Shopify only.
 */
export async function initiateConnect(
  provider: string,
  workspaceId: string,
  shopDomain?: string
): Promise<void> {
  const headers = await authHeader();
  const res = await fetch('/api/connections/state', {
    method: 'POST',
    headers,
    body: JSON.stringify({ workspaceId, provider, shopDomain }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'unknown_error');
  }
  const { state } = await res.json();
  window.location.href = `/api/connections/${provider}/authorize?state=${state}`;
}

export async function saveApiKeyConnection(provider: string, workspaceId: string, apiKey: string): Promise<void> {
  const headers = await authHeader();
  const res = await fetch(`/api/connections/${provider}/save-key`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ workspaceId, apiKey }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'unknown_error');
  }
}

export async function disconnectConnection(provider: string, workspaceId: string): Promise<void> {
  const headers = await authHeader();
  const res = await fetch(`/api/connections/${provider}/disconnect`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ workspaceId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'unknown_error');
  }
}

export async function testConnection(provider: string, workspaceId: string): Promise<{ healthy: boolean; error?: string }> {
  const headers = await authHeader();
  const res = await fetch(`/api/connections/${provider}/test`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ workspaceId }),
  });
  return res.json();
}

export async function refreshConnection(provider: string, workspaceId: string): Promise<void> {
  const headers = await authHeader();
  const res = await fetch(`/api/connections/${provider}/refresh`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ workspaceId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'unknown_error');
  }
}
