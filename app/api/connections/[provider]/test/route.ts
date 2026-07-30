import { NextResponse } from 'next/server';
import { adminDb, verifyRequestAuth } from '@/lib/firebase/admin';
import { getProvider } from '@/lib/providers/registry';
import { decryptToken } from '@/lib/crypto/tokenCrypto';

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
    const conn = connSnap.data()!;

    const secretSnap = await connRef.collection('secret').doc('tokens').get();
    if (!secretSnap.exists) {
      await connRef.update({ status: 'ERROR', lastError: 'invalid_token' });
      return NextResponse.json({ healthy: false, error: 'invalid_token' });
    }

    const testUrl = provider.authType === 'oauth2-shop-domain' && conn.providerAccountId
      ? (provider.testEndpoint || '').replace('{shop}', `${conn.providerAccountId}`)
      : provider.testEndpoint;

    if (!testUrl) {
      return NextResponse.json({ healthy: true, note: 'No health check endpoint configured for this provider.' });
    }

    const accessToken = decryptToken(secretSnap.data()!.accessTokenEncrypted);
    const res = await fetch(testUrl, { headers: { Authorization: `Bearer ${accessToken}` } });

    const now = new Date().toISOString();

    if (res.ok) {
      await connRef.update({ status: 'CONNECTED', lastSynced: now, lastError: null, updatedAt: now });
      return NextResponse.json({ healthy: true });
    }

    let errorCode: string = 'unknown_error';
    if (res.status === 401) errorCode = 'expired_token';
    else if (res.status === 403) errorCode = 'permission_denied';
    else if (res.status === 429) errorCode = 'rate_limited';
    else if (res.status >= 500) errorCode = 'provider_offline';

    await connRef.update({
      status: errorCode === 'expired_token' ? 'EXPIRED' : 'ERROR',
      lastError: errorCode,
      updatedAt: now,
    });
    return NextResponse.json({ healthy: false, error: errorCode });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'unknown_error' }, { status: 401 });
  }
}
