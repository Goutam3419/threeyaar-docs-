import { NextResponse } from 'next/server';
import { adminDb, verifyRequestAuth } from '@/lib/firebase/admin';
import { getProvider } from '@/lib/providers/registry';
import { encryptToken } from '@/lib/crypto/tokenCrypto';
import type { ConnectionDoc, ConnectionSecretDoc } from '@/types/connections';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { uid } = await verifyRequestAuth(request);
    const { provider: providerId } = await params;
    const provider = getProvider(providerId);
    const body = await request.json().catch(() => ({}));
    const { workspaceId, apiKey } = body as { workspaceId?: string; apiKey?: string };

    if (!provider || provider.authType !== 'apikey' || !workspaceId || !apiKey || !adminDb) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    // Validate the key is real by calling a cheap authenticated endpoint.
    if (provider.apiKeyTestEndpoint) {
      const headers: Record<string, string> =
        providerId === 'anthropic'
          ? { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
          : providerId === 'gemini'
          ? {}
          : { Authorization: `Bearer ${apiKey}` };

      const url = providerId === 'gemini' ? `${provider.apiKeyTestEndpoint}?key=${apiKey}` : provider.apiKeyTestEndpoint;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const errorCode = res.status === 401 || res.status === 403 ? 'invalid_token' : res.status === 429 ? 'rate_limited' : 'unknown_error';
        return NextResponse.json({ error: errorCode }, { status: 400 });
      }
    }

    const now = new Date().toISOString();
    const connectionId = `${workspaceId}_${providerId}`;

    const connectionDoc: ConnectionDoc = {
      id: connectionId,
      userId: uid,
      workspaceId,
      provider: providerId,
      providerAccountId: '',
      status: 'CONNECTED',
      tokenExpiry: null,
      permissions: ['api-key'],
      scopes: [],
      connectedAt: now,
      lastSynced: now,
      createdAt: now,
      updatedAt: now,
      lastError: null,
    };
    const secretDoc: ConnectionSecretDoc = {
      accessTokenEncrypted: encryptToken(apiKey),
      refreshTokenEncrypted: null,
      updatedAt: now,
    };

    await adminDb.collection('connections').doc(connectionId).set(connectionDoc, { merge: true });
    await adminDb.collection('connections').doc(connectionId).collection('secret').doc('tokens').set(secretDoc);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'unknown_error' }, { status: 401 });
  }
}
