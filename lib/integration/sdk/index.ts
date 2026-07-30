import { PROVIDERS } from '@/lib/providers/registry';
import { executeOperation } from '../core/integrationEngine';
import { checkHealth } from '../health/healthEngine';
import { checkPermission } from '../permissions/permissionEngine';
import type { ExecuteOperationResult } from '../types';

export interface ProviderClient {
  get<T = unknown>(path: string, requiredScopes?: string[]): Promise<ExecuteOperationResult<T>>;
  post<T = unknown>(path: string, body?: Record<string, unknown>, requiredScopes?: string[]): Promise<ExecuteOperationResult<T>>;
  put<T = unknown>(path: string, body?: Record<string, unknown>, requiredScopes?: string[]): Promise<ExecuteOperationResult<T>>;
  delete<T = unknown>(path: string, requiredScopes?: string[]): Promise<ExecuteOperationResult<T>>;
  testConnection(): ReturnType<typeof checkHealth>;
  hasPermission(requiredScopes?: string[]): ReturnType<typeof checkPermission>;
}

export interface IntegrationContext {
  workspaceId: string;
  userId: string;
}

function buildProviderClient(providerId: string, ctx: IntegrationContext): ProviderClient {
  const call = <T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: Record<string, unknown>, requiredScopes?: string[]) =>
    executeOperation<T>({
      provider: providerId,
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      operation: `${method} ${path}`,
      method,
      path,
      body,
      requiredScopes,
    });

  return {
    get: (path, requiredScopes) => call('GET', path, undefined, requiredScopes),
    post: (path, body, requiredScopes) => call('POST', path, body, requiredScopes),
    put: (path, body, requiredScopes) => call('PUT', path, body, requiredScopes),
    delete: (path, requiredScopes) => call('DELETE', path, undefined, requiredScopes),
    testConnection: () => checkHealth(providerId, ctx.workspaceId),
    hasPermission: (requiredScopes) => checkPermission({ provider: providerId, workspaceId: ctx.workspaceId, requiredScopes }),
  };
}

export type IntegrationSDK = Record<string, ProviderClient>;

/**
 * Creates a scoped `integration` object for one workspace/user — e.g.:
 *
 *   const integration = createIntegrationSDK({ workspaceId, userId });
 *   const { data } = await integration.github.get('/user');
 *   await integration.slack.post('/chat.postMessage', { channel, text });
 *
 * Every future AI Agent should use this instead of calling provider APIs
 * directly — it's the one unified interface for all 23 providers.
 */
export function createIntegrationSDK(ctx: IntegrationContext): IntegrationSDK {
  const sdk = {} as IntegrationSDK;
  for (const provider of PROVIDERS) {
    sdk[provider.id] = buildProviderClient(provider.id, ctx);
  }
  return sdk;
}
