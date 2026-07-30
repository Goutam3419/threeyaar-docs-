import { adminDb } from '@/lib/firebase/admin';
import type { DocumentReference } from 'firebase-admin/firestore';
import { decryptToken, encryptToken } from '@/lib/crypto/tokenCrypto';
import { getOAuthProvider } from '../registry';
import { IntegrationError } from '../errors/IntegrationError';
import type { ConnectionDoc } from '@/types/connections';

// Server-only. Tokens returned by this module must never be sent to the
// client, logged, or stored anywhere other than passed directly into an
// outgoing Authorization header.

function isExpired(connection: ConnectionDoc): boolean {
  if (!connection.tokenExpiry) return false; // non-expiring token
  return new Date(connection.tokenExpiry).getTime() < Date.now() + 30_000; // 30s clock-skew buffer
}

async function getConnection(provider: string, workspaceId: string): Promise<{ ref: DocumentReference; data: ConnectionDoc } | null> {
  if (!adminDb) throw new IntegrationError('unknown_error', provider, 'Server database is not configured.');
  const id = `${workspaceId}_${provider}`;
  const ref = adminDb.collection('connections').doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return { ref, data: snap.data() as ConnectionDoc };
}

async function refreshAccessToken(provider: string, workspaceId: string): Promise<string> {
  if (!adminDb) throw new IntegrationError('unknown_error', provider, 'Server database is not configured.');
  const providerConfig = getOAuthProvider(provider);
  if (!providerConfig?.tokenUrl) {
    throw new IntegrationError('expired_token', provider, 'This connection has expired and cannot be auto-refreshed.');
  }

  const connectionId = `${workspaceId}_${provider}`;
  const secretRef = adminDb.collection('connections').doc(connectionId).collection('secret').doc('tokens');
  const secretSnap = await secretRef.get();
  const refreshTokenEncrypted = secretSnap.data()?.refreshTokenEncrypted;
  if (!refreshTokenEncrypted) {
    throw new IntegrationError('expired_token', provider, 'No refresh token on file for this connection.');
  }

  const clientId = providerConfig.clientIdEnv ? process.env[providerConfig.clientIdEnv] : undefined;
  const clientSecret = providerConfig.clientSecretEnv ? process.env[providerConfig.clientSecretEnv] : undefined;
  if (!clientId || !clientSecret) {
    throw new IntegrationError('unknown_error', provider, 'This provider is not fully configured on the server.');
  }

  const refreshToken = decryptToken(refreshTokenEncrypted);
  const res = await fetch(providerConfig.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!res.ok) {
    const code = res.status === 429 ? 'rate_limit' : 'expired_token';
    await adminDb.collection('connections').doc(connectionId).update({ status: 'EXPIRED', lastError: code, updatedAt: new Date().toISOString() });
    throw new IntegrationError(code, provider, 'Failed to refresh the access token.');
  }

  const data = await res.json();
  const now = new Date().toISOString();
  const tokenExpiry = data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null;

  await secretRef.set(
    {
      accessTokenEncrypted: encryptToken(data.access_token),
      refreshTokenEncrypted: data.refresh_token ? encryptToken(data.refresh_token) : refreshTokenEncrypted,
      updatedAt: now,
    },
    { merge: true }
  );
  await adminDb.collection('connections').doc(connectionId).update({ status: 'CONNECTED', tokenExpiry, lastError: null, updatedAt: now });

  return data.access_token as string;
}

/**
 * Returns a valid, decrypted access token for a provider connection —
 * refreshing it first if it's expired (and refreshable). Throws
 * IntegrationError if there's no connection or the token can't be used.
 */
export async function getValidAccessToken(provider: string, workspaceId: string): Promise<string> {
  const connection = await getConnection(provider, workspaceId);
  if (!connection) {
    throw new IntegrationError('unauthorized', provider, 'No connection found for this provider.');
  }
  if (connection.data.status === 'DISCONNECTED') {
    throw new IntegrationError('unauthorized', provider, 'This provider is not connected.');
  }

  if (isExpired(connection.data)) {
    return refreshAccessToken(provider, workspaceId);
  }

  if (!adminDb) throw new IntegrationError('unknown_error', provider, 'Server database is not configured.');
  const secretSnap = await adminDb.collection('connections').doc(connection.data.id).collection('secret').doc('tokens').get();
  if (!secretSnap.exists) {
    throw new IntegrationError('expired_token', provider, 'No stored credentials for this connection.');
  }
  return decryptToken(secretSnap.data()!.accessTokenEncrypted);
}

export async function validateToken(provider: string, workspaceId: string): Promise<boolean> {
  try {
    await getValidAccessToken(provider, workspaceId);
    return true;
  } catch {
    return false;
  }
}

export async function isConnectionExpired(provider: string, workspaceId: string): Promise<boolean> {
  const connection = await getConnection(provider, workspaceId);
  return connection ? isExpired(connection.data) : true;
}
