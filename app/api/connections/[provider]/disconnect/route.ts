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

    // Best-effort real revocation where the provider supports it.
    if (provider.revokeUrl) {
      try {
        const secretSnap = await connRef.collection('secret').doc('tokens').get();
        if (secretSnap.exists) {
          const accessToken = decryptToken(secretSnap.data()!.accessTokenEncrypted);
          await fetch(provider.revokeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ token: accessToken }).toString(),
          });
        }
      } catch {
        // non-fatal — we still remove our local record even if revocation fails
      }
    }

    await connRef.collection('secret').doc('tokens').delete();
    await connRef.delete();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'unknown_error' }, { status: 401 });
  }
}
