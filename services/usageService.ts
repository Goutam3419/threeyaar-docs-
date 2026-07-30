import { collection, doc, getDocs, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { COLLECTIONS } from '@/types/firestore';
import type { WorkspaceDoc, WorkspaceUsage, WorkspaceLimits } from '@/types/firestore';

export interface UsageSummary {
  installedAgentsCount: number;
  connectionsCount: number;
  aiRequestsThisMonth: number;
  storageUsedMb: number;
  apiCallsToday: number;
  limits: WorkspaceLimits;
  remaining: {
    members: number;
    installedAgents: number;
    connections: number;
    aiRequests: number;
    storageMb: number;
  };
}

export async function getUsageSummary(workspaceId: string, currentMemberCount: number): Promise<UsageSummary | null> {
  const workspaceSnap = await getDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId));
  if (!workspaceSnap.exists()) return null;
  const workspace = workspaceSnap.data() as WorkspaceDoc;

  const [installedSnap, connectionsSnap] = await Promise.all([
    getDocs(query(collection(db, COLLECTIONS.INSTALLED_AGENTS), where('workspaceId', '==', workspaceId))),
    getDocs(query(collection(db, COLLECTIONS.CONNECTIONS), where('workspaceId', '==', workspaceId))),
  ]);

  const installedAgentsCount = installedSnap.size;
  const connectionsCount = connectionsSnap.docs.filter((d) => d.data().status === 'CONNECTED').length;
  const { usage, limits } = workspace;

  return {
    installedAgentsCount,
    connectionsCount,
    aiRequestsThisMonth: usage.aiRequestsThisMonth,
    storageUsedMb: usage.storageUsedMb,
    apiCallsToday: usage.apiCallsToday,
    limits,
    remaining: {
      members: Math.max(0, limits.maxMembers - currentMemberCount),
      installedAgents: Math.max(0, limits.maxInstalledAgents - installedAgentsCount),
      connections: Math.max(0, limits.maxConnections - connectionsCount),
      aiRequests: Math.max(0, limits.maxAiRequestsPerMonth - usage.aiRequestsThisMonth),
      storageMb: Math.max(0, limits.maxStorageMb - usage.storageUsedMb),
    },
  };
}

/** Increments a usage counter — for future systems (agent execution, file uploads) to call. Not invoked anywhere yet. */
export async function incrementUsage(workspaceId: string, field: keyof WorkspaceUsage, amount: number): Promise<void> {
  const snap = await getDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId));
  if (!snap.exists()) return;
  const current = (snap.data() as WorkspaceDoc).usage;
  const currentValue = typeof current[field] === 'number' ? (current[field] as number) : 0;
  await updateDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId), {
    [`usage.${field}`]: currentValue + amount,
    updatedAt: new Date().toISOString(),
  });
}

const PLAN_LIMITS: Record<string, WorkspaceLimits> = {
  free: { maxMembers: 3, maxInstalledAgents: 5, maxConnections: 5, maxAiRequestsPerMonth: 1000, maxStorageMb: 500 },
  starter: { maxMembers: 3, maxInstalledAgents: 5, maxConnections: 5, maxAiRequestsPerMonth: 1000, maxStorageMb: 500 },
  growth: { maxMembers: 10, maxInstalledAgents: 20, maxConnections: 15, maxAiRequestsPerMonth: 10000, maxStorageMb: 5000 },
  enterprise: { maxMembers: 1000, maxInstalledAgents: 1000, maxConnections: 23, maxAiRequestsPerMonth: 1000000, maxStorageMb: 500000 },
};

export async function applyPlanLimits(workspaceId: string, planId: string): Promise<void> {
  const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;
  await updateDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId), { limits, updatedAt: new Date().toISOString() });
}
