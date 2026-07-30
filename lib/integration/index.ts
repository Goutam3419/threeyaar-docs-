// Universal Integration Engine — single entry point.
//
// Server-only. Never import this from a client component; it transitively
// touches decrypted OAuth tokens via the token manager.
//
// Usage from a future AI Agent (server-side code):
//
//   import { createIntegrationSDK } from '@/lib/integration';
//   const integration = createIntegrationSDK({ workspaceId, userId });
//   const { data } = await integration.github.get('/user');
//
export { createIntegrationSDK } from './sdk';
export type { IntegrationSDK, ProviderClient, IntegrationContext } from './sdk';

export { executeOperation } from './core/integrationEngine';
export { INTEGRATION_REGISTRY, getIntegrationProvider, getProviderCapabilities, getProviderOperations, providerSupports } from './registry';
export { getValidAccessToken, validateToken, isConnectionExpired } from './token/tokenManager';
export { checkPermission, assertPermission } from './permissions/permissionEngine';
export { checkHealth, checkAndPersistHealth, getHealthSummary } from './health/healthEngine';
export { withRetry } from './retry/retryEngine';
export { enqueue, updateQueueItemStatus, cancelQueueItem, claimNextQueueItem, getQueueStats } from './queue/queueEngine';
export { logOperation, getRecentLogs, getErrorLogs } from './logs/loggingEngine';
export { IntegrationError, classifyHttpStatus, classifyThrownError } from './errors/IntegrationError';
export { runFullDiagnostic } from './testing/testCenter';
export type * from './types';
