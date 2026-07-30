import { assertPermission } from '../permissions/permissionEngine';
import { getValidAccessToken } from '../token/tokenManager';
import { withRetry } from '../retry/retryEngine';
import { logOperation } from '../logs/loggingEngine';
import { getOAuthProvider } from '../registry';
import { IntegrationError, classifyHttpStatus, classifyThrownError } from '../errors/IntegrationError';
import { adminDb } from '@/lib/firebase/admin';
import type { ExecuteOperationInput, ExecuteOperationResult } from '../types';

function resolveUrl(providerId: string, path: string, override?: string): string {
  if (/^https?:\/\//.test(path)) return path;
  if (override) return `${override.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  // Fall back to deriving a base URL from the provider's known test endpoint host.
  const provider = getOAuthProvider(providerId);
  if (provider?.testEndpoint) {
    const base = new URL(provider.testEndpoint);
    return `${base.protocol}//${base.host}${path.startsWith('/') ? path : `/${path}`}`;
  }
  throw new IntegrationError('validation_error', providerId, 'Could not resolve a base URL for this provider — pass baseUrlOverride explicitly.');
}

/**
 * THE single entry point every future AI Agent uses to talk to a connected
 * provider. Handles permission checks, token retrieval/refresh, retries with
 * backoff, and logging — so agent code never touches provider APIs, tokens,
 * or error handling directly.
 *
 * This is infrastructure only: it performs whatever generic HTTP request the
 * caller specifies. It does not implement any provider-specific business
 * action (e.g. "create a repo", "publish a post") — that logic belongs to
 * the future agents that call this engine.
 */
export async function executeOperation<T = unknown>(input: ExecuteOperationInput): Promise<ExecuteOperationResult<T>> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  let retryCount = 0;
  let httpStatus: number | null = null;

  try {
    await assertPermission({
      provider: input.provider,
      workspaceId: input.workspaceId,
      requiredScopes: input.requiredScopes,
    });

    const result = await withRetry<ExecuteOperationResult<T>>(
      async () => {
        const accessToken = await getValidAccessToken(input.provider, input.workspaceId);
        const url = resolveUrl(input.provider, input.path, input.baseUrlOverride);

        const res = await fetch(url, {
          method: input.method,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: input.body ? JSON.stringify(input.body) : undefined,
        });

        httpStatus = res.status;

        if (!res.ok) {
          throw new IntegrationError(classifyHttpStatus(res.status), input.provider, `Request failed with status ${res.status}`, res.status);
        }

        const contentType = res.headers.get('content-type') || '';
        const data = (contentType.includes('application/json') ? await res.json() : await res.text()) as T;

        return { ok: true, data, status: res.status, durationMs: Date.now() - startTime };
      },
      {
        maxRetries: 3,
        onRetry: () => { retryCount += 1; },
      }
    );

    await logOperation({
      provider: input.provider,
      workspaceId: input.workspaceId,
      userId: input.userId,
      operation: input.operation,
      startedAt,
      durationMs: Date.now() - startTime,
      result: 'success',
      status: httpStatus,
      error: null,
      retryCount,
    });

    return result;
  } catch (err) {
    const code = classifyThrownError(err);
    const integrationError = err instanceof IntegrationError ? err : new IntegrationError(code, input.provider, (err as Error)?.message);

    await logOperation({
      provider: input.provider,
      workspaceId: input.workspaceId,
      userId: input.userId,
      operation: input.operation,
      startedAt,
      durationMs: Date.now() - startTime,
      result: 'failure',
      status: httpStatus,
      error: integrationError.code,
      retryCount,
    });

    throw integrationError;
  }
}

/** Convenience re-export so `lib/integration/core` is a one-stop entry point. */
export { adminDb };
