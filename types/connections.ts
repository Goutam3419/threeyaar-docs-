export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED' | 'ERROR';

/**
 * Client-safe fields only. This is what the browser is allowed to read.
 * accessToken / refreshToken are intentionally NOT part of this type —
 * they live in a server-only subcollection. See lib/providers/registry.ts
 * and services/connectionsService.ts for the full explanation.
 */
export interface ConnectionDoc {
  id: string; // `${workspaceId}_${provider}`
  userId: string;
  workspaceId: string;
  provider: string;
  providerAccountId: string; // the connected account's id/email/handle on the provider's side
  status: ConnectionStatus;
  tokenExpiry: string | null; // ISO timestamp, null if the provider issues non-expiring tokens
  permissions: string[]; // human-readable permission labels shown in the UI
  scopes: string[]; // raw OAuth scope strings actually granted
  connectedAt: string | null;
  lastSynced: string | null;
  createdAt: string;
  updatedAt: string;
  lastError: string | null; // last known OAuth/health error code, if any
}

/**
 * Server-only document. Lives at connections/{id}/secret/tokens.
 * Firestore rules deny ALL client access to this subcollection — only the
 * Admin SDK (used exclusively in app/api/connections/** route handlers)
 * can read or write it.
 */
export interface ConnectionSecretDoc {
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  updatedAt: string;
}

export type OAuthErrorCode =
  | 'oauth_cancelled'
  | 'permission_denied'
  | 'expired_token'
  | 'invalid_token'
  | 'network_error'
  | 'rate_limited'
  | 'provider_offline'
  | 'invalid_state'
  | 'missing_config'
  | 'unknown_error';

export const OAUTH_ERROR_MESSAGES: Record<OAuthErrorCode, string> = {
  oauth_cancelled: 'You cancelled the authorization request.',
  permission_denied: 'Permission was denied by the provider.',
  expired_token: 'This connection has expired. Please reconnect.',
  invalid_token: 'This connection is no longer valid. Please reconnect.',
  network_error: 'A network error occurred while contacting the provider.',
  rate_limited: 'The provider is rate-limiting requests. Please try again shortly.',
  provider_offline: 'The provider appears to be unavailable right now.',
  invalid_state: 'The authorization request could not be verified (state mismatch). Please try again.',
  missing_config: 'This connection is not configured on the server yet.',
  unknown_error: 'Something went wrong while connecting.',
};
