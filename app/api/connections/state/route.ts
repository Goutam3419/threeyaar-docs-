import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb, verifyRequestAuth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(request: Request) {
  try {
    const { uid } = await verifyRequestAuth(request);
    const body = await request.json().catch(() => ({}));
    const { workspaceId, provider, shopDomain } = body as {
      workspaceId?: string;
      provider?: string;
      shopDomain?: string;
    };

    if (!workspaceId || !provider) {
      return NextResponse.json({ error: 'workspaceId and provider are required' }, { status: 400 });
    }
    if (!adminDb) {
      return NextResponse.json({ error: 'missing_config' }, { status: 500 });
    }

    const state = crypto.randomBytes(24).toString('hex');
    await adminDb.collection('oauthStates').doc(state).set({
      uid,
      workspaceId,
      provider,
      shopDomain: shopDomain || null,
      createdAt: Date.now(),
      expiresAt: Date.now() + STATE_TTL_MS,
      used: false,
    });

    return NextResponse.json({ state });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'unknown_error' }, { status: 401 });
  }
}
