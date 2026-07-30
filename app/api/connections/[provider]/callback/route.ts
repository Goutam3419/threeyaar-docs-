import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getProvider } from '@/lib/providers/registry';
import { encryptToken } from '@/lib/crypto/tokenCrypto';
import type { ConnectionDoc, ConnectionSecretDoc } from '@/types/connections';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerId } = await params;
  const provider = getProvider(providerId);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const redirect = (query: string) => NextResponse.redirect(`${appUrl}/dashboard?view=connections&${query}`);

  if (!provider || !adminDb) return redirect('error=unknown_error');

  if (oauthError) {
    const code = oauthError === 'access_denied' ? 'oauth_cancelled' : 'permission_denied';
    return redirect(`error=${code}&provider=${providerId}`);
  }
  if (!code || !state) return redirect(`error=invalid_state&provider=${providerId}`);

  const stateRef = adminDb.collection('oauthStates').doc(state);
  const stateSnap = await stateRef.get();
  if (!stateSnap.exists) return redirect(`error=invalid_state&provider=${providerId}`);
  const stateData = stateSnap.data() as any;
  if (stateData.used || stateData.expiresAt < Date.now()) {
    return redirect(`error=invalid_state&provider=${providerId}`);
  }
  await stateRef.update({ used: true });

  const { uid, workspaceId, shopDomain } = stateData;
  const redirectUri = `${appUrl}/api/connections/${providerId}/callback`;
  const clientId = provider.clientIdEnv ? process.env[provider.clientIdEnv] : undefined;
  const clientSecret = provider.clientSecretEnv ? process.env[provider.clientSecretEnv] : undefined;

  let tokenUrl = provider.tokenUrl || '';
  if (provider.authType === 'oauth2-shop-domain') {
    if (!shopDomain) return redirect(`error=missing_config&provider=${providerId}`);
    tokenUrl = tokenUrl.replace('{shop}', shopDomain);
  }

  try {
    let accessToken = '';
    let refreshToken: string | null = null;
    let expiresIn: number | null = null;
    let providerAccountId = '';

    if (provider.authType === 'oauth2-pkce' && providerId === 'openrouter') {
      // OpenRouter's public PKCE flow — no client secret, exchanges for an API key.
      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, code_verifier: stateData.pkceVerifier, code_challenge_method: 'S256' }),
      });
      if (!res.ok) throw new Error(res.status === 429 ? 'rate_limited' : 'invalid_token');
      const data = await res.json();
      accessToken = data.key;
    } else {
      if (!clientId || !clientSecret) return redirect(`error=missing_config&provider=${providerId}`);
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      });
      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: body.toString(),
      });
      if (!res.ok) {
        if (res.status === 429) throw new Error('rate_limited');
        if (res.status >= 500) throw new Error('provider_offline');
        throw new Error('invalid_token');
      }
      const data = await res.json();
      accessToken = data.access_token;
      refreshToken = data.refresh_token || null;
      expiresIn = data.expires_in || null;
      if (!accessToken) throw new Error('invalid_token');
    }

    // Best-effort: fetch the connected account's id/handle for display.
    if (provider.testEndpoint) {
      try {
        const testUrl = provider.authType === 'oauth2-shop-domain'
          ? (provider.testEndpoint || '').replace('{shop}', shopDomain)
          : provider.testEndpoint;
        const who = await fetch(testUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (who.ok) {
          const whoData = await who.json();
          providerAccountId = whoData.id || whoData.login || whoData.email || whoData.username || whoData.user_id || '';
        }
      } catch {
        // non-fatal — account id is cosmetic
      }
    }

    const now = new Date().toISOString();
    const connectionId = `${workspaceId}_${providerId}`;
    const tokenExpiry = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    const connectionDoc: ConnectionDoc = {
      id: connectionId,
      userId: uid,
      workspaceId,
      provider: providerId,
      providerAccountId: String(providerAccountId || ''),
      status: 'CONNECTED',
      tokenExpiry,
      permissions: provider.scopes,
      scopes: provider.scopes,
      connectedAt: now,
      lastSynced: now,
      createdAt: now,
      updatedAt: now,
      lastError: null,
    };

    const secretDoc: ConnectionSecretDoc = {
      accessTokenEncrypted: encryptToken(accessToken),
      refreshTokenEncrypted: refreshToken ? encryptToken(refreshToken) : null,
      updatedAt: now,
    };

    await adminDb.collection('connections').doc(connectionId).set(connectionDoc, { merge: true });
    await adminDb
      .collection('connections')
      .doc(connectionId)
      .collection('secret')
      .doc('tokens')
      .set(secretDoc);

    await stateRef.delete();

    return redirect(`connected=${providerId}`);
  } catch (err: any) {
    const code = ['rate_limited', 'provider_offline', 'invalid_token', 'missing_config'].includes(err?.message)
      ? err.message
      : 'unknown_error';
    return redirect(`error=${code}&provider=${providerId}`);
  }
}
