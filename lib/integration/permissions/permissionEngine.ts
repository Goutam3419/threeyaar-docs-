import { adminDb } from '@/lib/firebase/admin';
import type { ConnectionDoc } from '@/types/connections';
import type { PermissionCheckInput, PermissionResult } from '../types';

/**
 * Reads the admin's platform-wide provider enable/disable list, written by
 * the Connections Hub's Admin Panel (settings/providers doc). Read-only
 * reuse — this file never writes to that collection.
 */
async function isProviderEnabled(provider: string): Promise<boolean> {
  if (!adminDb) return true; // fail-open only for the "enabled" toggle; token/connection checks below still gate access
  const snap = await adminDb.collection('settings').doc('providers').get();
  const disabled: string[] = snap.exists ? snap.data()?.disabled || [] : [];
  return !disabled.includes(provider);
}

export async function checkPermission(input: PermissionCheckInput): Promise<PermissionResult> {
  const { provider, workspaceId, requiredScopes = [] } = input;

  if (!(await isProviderEnabled(provider))) {
    return { allowed: false, reason: 'provider_disabled' };
  }

  if (!adminDb) {
    return { allowed: false, reason: 'no_connection' };
  }

  const connectionId = `${workspaceId}_${provider}`;
  const snap = await adminDb.collection('connections').doc(connectionId).get();
  if (!snap.exists) {
    return { allowed: false, reason: 'no_connection' };
  }

  const connection = snap.data() as ConnectionDoc;

  if (connection.workspaceId !== workspaceId) {
    return { allowed: false, reason: 'workspace_mismatch' };
  }

  if (connection.status === 'DISCONNECTED') {
    return { allowed: false, reason: 'not_connected' };
  }

  if (requiredScopes.length > 0) {
    const granted = new Set(connection.scopes || []);
    const missing = requiredScopes.filter((s) => !granted.has(s));
    if (missing.length > 0) {
      return { allowed: false, reason: 'missing_scopes', missingScopes: missing };
    }
  }

  return { allowed: true };
}

/** Throws if not allowed — convenient for use inside executeOperation(). */
export async function assertPermission(input: PermissionCheckInput): Promise<void> {
  const result = await checkPermission(input);
  if (!result.allowed) {
    const { IntegrationError } = await import('../errors/IntegrationError');
    const messages: Record<string, string> = {
      no_connection: 'No connection found for this provider.',
      provider_disabled: 'This provider is currently disabled platform-wide.',
      missing_scopes: `Missing required scopes: ${(result.missingScopes || []).join(', ')}`,
      not_connected: 'This provider is not connected.',
      workspace_mismatch: 'This connection does not belong to the requesting workspace.',
    };
    throw new IntegrationError(
      result.reason === 'missing_scopes' ? 'forbidden' : 'unauthorized',
      input.provider,
      messages[result.reason || ''] || 'Permission denied.'
    );
  }
}
