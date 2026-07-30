// Shared types for the Universal Integration Engine.
// Server-only — this whole lib/integration/** tree touches decrypted tokens
// transitively and must never be imported from a client component.

export type HealthStatus =
  | 'online'
  | 'offline'
  | 'rate_limited'
  | 'auth_failed'
  | 'expired_token'
  | 'maintenance'
  | 'unknown';

export interface HealthResult {
  provider: string;
  workspaceId: string;
  status: HealthStatus;
  score: number; // 0-100
  lastCheck: string; // ISO timestamp
  latencyMs: number | null;
  message?: string;
}

export type QueueItemStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface QueueItem {
  id: string;
  workspaceId: string;
  userId: string;
  provider: string;
  operation: string;
  payload: Record<string, unknown>;
  status: QueueItemStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  result: unknown | null;
  error: string | null;
}

export interface IntegrationLogEntry {
  id: string;
  provider: string;
  workspaceId: string;
  userId: string;
  operation: string;
  startedAt: string;
  durationMs: number;
  result: 'success' | 'failure';
  status: number | null; // HTTP status if applicable
  error: string | null; // standardized error code, never a raw credential
  retryCount: number;
}

export interface PermissionCheckInput {
  provider: string;
  workspaceId: string;
  requiredScopes?: string[];
}

export interface PermissionResult {
  allowed: boolean;
  reason?: 'no_connection' | 'provider_disabled' | 'missing_scopes' | 'not_connected' | 'workspace_mismatch';
  missingScopes?: string[];
}

export interface OperationDefinition {
  id: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  requiredScopes: string[];
}

export interface IntegrationRegistryEntry {
  id: string;
  name: string;
  type: string; // category, from the provider registry
  authType: string;
  capabilities: string[];
  operations: OperationDefinition[];
  version: string;
}

export interface ExecuteOperationInput {
  provider: string;
  workspaceId: string;
  userId: string;
  operation: string; // human-readable operation name, for logging
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string; // relative to the provider's API base, or an absolute URL
  body?: Record<string, unknown>;
  requiredScopes?: string[];
  baseUrlOverride?: string;
}

export interface ExecuteOperationResult<T = unknown> {
  ok: true;
  data: T;
  status: number;
  durationMs: number;
}
