import { NextResponse } from 'next/server';
import { adminDb, verifyRequestAuth } from '@/lib/firebase/admin';
import { getProvider } from '@/lib/providers/registry';
import { decryptToken, encryptToken } from '@/lib/crypto/tokenCrypto';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { uid } = await verifyRequestAuth(request);
    const { provider: providerId } = await params;
    const provider = getProvider(providerId);
    const body = await request.json().catch(() => ({}));
    const { workspaceId } = body as { workspaceId?: string };
    if (!provider || !workspaceId || !adminDb) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    const connectionId = `${workspaceId}_${providerId}`;
    const connRef = adminDb.collection('connections').doc(connectionId);
    const connSnap = await connRef.get();
    if (!connSnap.exists || connSnap.data()?.userId !== uid) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const secretRef = connRef.collection('secret').doc('tokens');
    const secretSnap = await secretRef.get();
    const refreshTokenEncrypted = secretSnap.data()?.refreshTokenEncrypted;
    if (!refreshTokenEncrypted) {
      return NextResponse.json({ error: 'invalid_token', message: 'No refresh token on file for this connection.' }, { status: 400 });
    }

    const clientId = provider.clientIdEnv ? process.env[provider.clientIdEnv] : undefined;
    const clientSecret = provider.clientSecretEnv ? process.env[provider.clientSecretEnv] : undefined;
    if (!clientId || !clientSecret || !provider.tokenUrl) {
      return NextResponse.json({ error: 'missing_config' }, { status: 500 });
    }

    const refreshToken = decryptToken(refreshTokenEncrypted);
    const res = await fetch(provider.tokenUrl, {
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
      const errorCode = res.status === 429 ? 'rate_limited' : 'expired_token';
      await connRef.update({ status: 'EXPIRED', lastError: errorCode, updatedAt: new Date().toISOString() });
      return NextResponse.json({ error: errorCode }, { status: 400 });
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
    await connRef.update({ status: 'CONNECTED', tokenExpiry, lastError: null, updatedAt: now });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'unknown_error' }, { status: 401 });
  }
}
