import { PROVIDERS, getProvider as getOAuthProvider, type ProviderConfig } from '@/lib/providers/registry';
import type { IntegrationRegistryEntry, OperationDefinition } from '../types';

// Generic, provider-agnostic standard operations exposed by every provider
// in the registry. These are infrastructure primitives (raw GET/POST against
// the provider's API), not business actions — no future agent logic lives
// here, only the ability for one to call it.
function standardOperations(provider: ProviderConfig): OperationDefinition[] {
  const ops: OperationDefinition[] = [
    { id: 'get', description: `Authenticated GET request to ${provider.name}`, method: 'GET', requiredScopes: [] },
  ];
  if (provider.authType !== 'apikey') {
    ops.push(
      { id: 'post', description: `Authenticated POST request to ${provider.name}`, method: 'POST', requiredScopes: [] },
      { id: 'put', description: `Authenticated PUT request to ${provider.name}`, method: 'PUT', requiredScopes: [] },
      { id: 'delete', description: `Authenticated DELETE request to ${provider.name}`, method: 'DELETE', requiredScopes: [] }
    );
  }
  return ops;
}

function inferCapabilities(provider: ProviderConfig): string[] {
  const caps = ['read'];
  if (provider.authType !== 'apikey') caps.push('write');
  if (provider.scopes.some((s) => /write|publish|send|content_publish/.test(s))) caps.push('publish');
  if (provider.category === 'Payments') caps.push('payments');
  if (provider.category === 'AI Models') caps.push('inference');
  return caps;
}

const ENGINE_VERSION = '1.0.0';

export const INTEGRATION_REGISTRY: IntegrationRegistryEntry[] = PROVIDERS.map((provider) => ({
  id: provider.id,
  name: provider.name,
  type: provider.category,
  authType: provider.authType,
  capabilities: inferCapabilities(provider),
  operations: standardOperations(provider),
  version: ENGINE_VERSION,
}));

export function getIntegrationProvider(id: string): IntegrationRegistryEntry | undefined {
  return INTEGRATION_REGISTRY.find((p) => p.id === id);
}

export function getProviderCapabilities(id: string): string[] {
  return getIntegrationProvider(id)?.capabilities || [];
}

export function getProviderOperations(id: string): OperationDefinition[] {
  return getIntegrationProvider(id)?.operations || [];
}

export function providerSupports(id: string, capability: string): boolean {
  return getProviderCapabilities(id).includes(capability);
}

/** Re-exported so SDK/engine modules only need one import path for provider config. */
export { getOAuthProvider };
