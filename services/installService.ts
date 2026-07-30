import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { COLLECTIONS, type InstalledAgentDoc } from '@/types/firestore';
import { updateAgentDoc, fetchAgentById } from './agentService';

const INSTALLED_COL = COLLECTIONS.INSTALLED_AGENTS;

export type InstallState = 'not-installed' | 'installing' | 'installed';

function installDocId(workspaceId: string, agentId: string): string {
  // Deterministic id — the natural way to prevent duplicate installs:
  // trying to install twice just overwrites the same document instead of
  // creating a second one.
  return `${workspaceId}_${agentId}`;
}

export async function isAgentInstalled(workspaceId: string, agentId: string): Promise<boolean> {
  const q = query(
    collection(db, INSTALLED_COL),
    where('workspaceId', '==', workspaceId),
    where('agentId', '==', agentId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export interface InstallInput {
  userId: string;
  workspaceId: string;
  agentId: string;
  version: string;
}

export async function installAgent(input: InstallInput): Promise<InstalledAgentDoc> {
  const id = installDocId(input.workspaceId, input.agentId);
  const already = await isAgentInstalled(input.workspaceId, input.agentId);
  if (already) {
    throw new Error('ALREADY_INSTALLED');
  }

  const record: InstalledAgentDoc = {
    id,
    userId: input.userId,
    agentId: input.agentId,
    workspaceId: input.workspaceId,
    installedAt: new Date().toISOString(),
    status: 'RUNNING',
    version: input.version,
    configuration: {},
  };
  await setDoc(doc(db, INSTALLED_COL, id), record);

  // Best-effort download counter bump — not critical if it fails.
  try {
    const agent = await fetchAgentById(input.agentId);
    if (agent) await updateAgentDoc(input.agentId, { downloads: (agent.downloads || 0) + 1 });
  } catch {
    // non-fatal
  }

  return record;
}

export async function uninstallAgent(installId: string): Promise<void> {
  await deleteDoc(doc(db, INSTALLED_COL, installId));
}

export async function updateInstalledAgentStatus(
  installId: string,
  status: InstalledAgentDoc['status']
): Promise<void> {
  await updateDoc(doc(db, INSTALLED_COL, installId), { status });
}

export function subscribeToInstalledAgents(
  workspaceId: string,
  callback: (installs: InstalledAgentDoc[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, INSTALLED_COL), where('workspaceId', '==', workspaceId));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as InstalledAgentDoc)),
    (err) => onError(err as Error)
  );
}
