import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from '@/types/firestore';
import type { UserProfile } from '@/types/user';
import type { WorkspaceDoc } from '@/types/firestore';

export { COLLECTIONS };

// ---------- Users ----------

export async function createUserProfileDoc(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.USERS, profile.uid), profile);
}

export async function getUserProfileDoc(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfileDoc(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function touchLastLogin(uid: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    lastLogin: new Date().toISOString(),
  });
}

/**
 * Live-subscribes to a user's profile document, so role/subscription/company
 * changes made elsewhere (e.g. by an admin) reflect immediately in the UI.
 */
export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.USERS, uid), (snap) => {
    callback(snap.exists() ? (snap.data() as UserProfile) : null);
  });
}

// ---------- Workspaces ----------

export async function createWorkspaceDoc(workspace: WorkspaceDoc): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.WORKSPACES, workspace.id), workspace);
}

export async function getWorkspaceDoc(id: string): Promise<WorkspaceDoc | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.WORKSPACES, id));
  return snap.exists() ? (snap.data() as WorkspaceDoc) : null;
}
