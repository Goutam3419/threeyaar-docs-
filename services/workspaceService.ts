import { doc, getDoc, updateDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { COLLECTIONS } from '@/types/firestore';
import type { WorkspaceDoc, WorkspaceSettings } from '@/types/firestore';

const COL = COLLECTIONS.WORKSPACES;

export async function fetchWorkspace(workspaceId: string): Promise<WorkspaceDoc | null> {
  const snap = await getDoc(doc(db, COL, workspaceId));
  return snap.exists() ? (snap.data() as WorkspaceDoc) : null;
}

export function subscribeToWorkspace(
  workspaceId: string,
  callback: (workspace: WorkspaceDoc | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, COL, workspaceId), (snap) => {
    callback(snap.exists() ? (snap.data() as WorkspaceDoc) : null);
  });
}

export async function updateWorkspaceProfile(
  workspaceId: string,
  updates: Partial<Pick<WorkspaceDoc, 'name' | 'logoUrl' | 'description'>>
): Promise<void> {
  await updateDoc(doc(db, COL, workspaceId), { ...updates, updatedAt: new Date().toISOString() });
}

export async function updateWorkspaceSettings(workspaceId: string, settings: Partial<WorkspaceSettings>): Promise<void> {
  const current = await fetchWorkspace(workspaceId);
  await updateDoc(doc(db, COL, workspaceId), {
    settings: { ...(current?.settings || {}), ...settings },
    updatedAt: new Date().toISOString(),
  });
}

export async function updateWorkspaceStatus(workspaceId: string, status: WorkspaceDoc['status']): Promise<void> {
  await updateDoc(doc(db, COL, workspaceId), { status, updatedAt: new Date().toISOString() });
}
