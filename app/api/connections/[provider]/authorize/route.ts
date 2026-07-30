import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase/admin';
import { getProvider } from '@/lib/providers/registry';

export const runtime = 'nodejs';

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerId } = await params;
  const provider = getProvider(providerId);
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const dashboardUrl = (query: string) => NextResponse.redirect(`${appUrl}/dashboard?view=connections&${query}`);

  if (!provider || provider.authType === 'apikey') {
    return dashboardUrl('error=unknown_error');
  }
  if (!state || !adminDb) {
    return dashboardUrl('error=invalid_state');
  }

  const stateDoc = await adminDb.collection('oauthStates').doc(state).get();
  if (!stateDoc.exists) {
    return dashboardUrl('error=invalid_state');
  }
  const stateData = stateDoc.data() as any;
  if (stateData.used || stateData.expiresAt < Date.now()) {
    return dashboardUrl('error=invalid_state');
  }

  const redirectUri = `${appUrl}/api/connections/${providerId}/callback`;
  const clientId = provider.clientIdEnv ? process.env[provider.clientIdEnv] : undefined;

  if (provider.authType !== 'oauth2-pkce' && !clientId && providerId !== 'vercel') {
    return dashboardUrl('error=missing_config');
  }

  let authUrl = provider.authUrl || '';

  if (provider.authType === 'oauth2-shop-domain') {
    const shop = stateData.shopDomain as string | null;
    if (!shop) return dashboardUrl('error=missing_config');
    authUrl = authUrl.replace('{shop}', shop);
  }
  if (providerId === 'vercel') {
    authUrl = authUrl.replace('{integrationSlug}', process.env.VERCEL_INTEGRATION_SLUG || '');
  }

  const url = new URL(authUrl);

  if (provider.authType === 'oauth2-pkce') {
    // Public PKCE client (e.g. OpenRouter) — no client_id/secret needed.
    const verifier = base64url(crypto.randomBytes(32));
    await adminDb.collection('oauthStates').doc(state).update({ pkceVerifier: verifier });
    const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
    url.searchParams.set('callback_url', redirectUri);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    if (providerId === 'x' && clientId) {
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('scope', provider.scopes.join(' '));
      url.searchParams.set('state', state);
    }
  } else {
    url.searchParams.set('client_id', clientId || '');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    if (provider.scopes.length > 0) {
      const separator = providerId === 'linkedin' || providerId === 'stripe' ? ' ' : provider.id === 'facebook' || provider.id === 'instagram' ? ',' : ' ';
      url.searchParams.set('scope', provider.scopes.join(separator));
    }
    url.searchParams.set('state', state);
    if (providerId === 'slack') url.searchParams.set('user_scope', provider.scopes.join(','));
    if (providerId === 'stripe') url.searchParams.set('response_type', 'code');
  }

  return NextResponse.redirect(url.toString());
}
