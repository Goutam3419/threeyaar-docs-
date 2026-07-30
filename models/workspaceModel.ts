import { WorkspaceDoc, WorkspaceLimits } from '@/types/firestore';

const FREE_PLAN_LIMITS: WorkspaceLimits = {
  maxMembers: 3,
  maxInstalledAgents: 5,
  maxConnections: 5,
  maxAiRequestsPerMonth: 1000,
  maxStorageMb: 500,
};

/**
 * Builds a brand-new Firestore `workspaces/{id}` document. By default each
 * new user gets their own workspace (id === uid), matching how the rest of
 * the app already scopes agents/connections/notifications per workspace.
 */
export function buildNewWorkspace(ownerId: string, name: string): WorkspaceDoc {
  const now = new Date().toISOString();
  return {
    id: ownerId,
    name: name || 'My Workspace',
    logoUrl: '',
    description: '',
    ownerId,
    status: 'active',
    plan: 'free',
    settings: {
      defaultCurrency: 'USD',
      allowMemberInvites: true,
      requireApprovalForAgentInstall: false,
    },
    usage: {
      aiRequestsThisMonth: 0,
      storageUsedMb: 0,
      apiCallsToday: 0,
      lastResetAt: now,
    },
    limits: FREE_PLAN_LIMITS,
    createdAt: now,
    updatedAt: now,
  };
}
