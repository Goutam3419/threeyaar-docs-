import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { COLLECTIONS } from '@/types/firestore';
import type { WorkspaceMemberDoc, WorkspaceRole } from '@/types/workspace';

const COL = COLLECTIONS.WORKSPACE_MEMBERS;

function memberId(workspaceId: string, emailOrUid: string): string {
  return `${workspaceId}_${emailOrUid.toLowerCase()}`;
}

export function subscribeToMembers(
  workspaceId: string,
  callback: (members: WorkspaceMemberDoc[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, COL), where('workspaceId', '==', workspaceId));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as WorkspaceMemberDoc)),
    (err) => onError(err as Error)
  );
}

export interface InviteMemberInput {
  workspaceId: string;
  email: string;
  name: string;
  role: WorkspaceRole;
  invitedBy: string;
}

export async function inviteMember(input: InviteMemberInput): Promise<WorkspaceMemberDoc> {
  const existing = await getDocs(
    query(collection(db, COL), where('workspaceId', '==', input.workspaceId), where('email', '==', input.email.toLowerCase()))
  );
  if (!existing.empty) {
    throw new Error('ALREADY_INVITED');
  }

  const id = memberId(input.workspaceId, input.email);
  const now = new Date().toISOString();
  const record: WorkspaceMemberDoc = {
    id,
    workspaceId: input.workspaceId,
    uid: null,
    email: input.email.toLowerCase(),
    name: input.name,
    role: input.role,
    status: 'invited',
    invitationStatus: 'pending',
    invitedBy: input.invitedBy,
    invitedAt: now,
    respondedAt: null,
    joinedAt: null,
  };
  await setDoc(doc(db, COL, id), record);
  return record;
}

export async function removeMember(memberDocId: string): Promise<void> {
  await deleteDoc(doc(db, COL, memberDocId));
}

export async function changeMemberRole(memberDocId: string, role: WorkspaceRole): Promise<void> {
  await updateDoc(doc(db, COL, memberDocId), { role });
}

export async function acceptInvitation(memberDocId: string, uid: string): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, COL, memberDocId), {
    uid,
    status: 'active',
    invitationStatus: 'accepted',
    respondedAt: now,
    joinedAt: now,
  });
}

export async function rejectInvitation(memberDocId: string): Promise<void> {
  await updateDoc(doc(db, COL, memberDocId), {
    invitationStatus: 'rejected',
    respondedAt: new Date().toISOString(),
  });
}

export async function suspendMember(memberDocId: string): Promise<void> {
  await updateDoc(doc(db, COL, memberDocId), { status: 'suspended' });
}

export async function reactivateMember(memberDocId: string): Promise<void> {
  await updateDoc(doc(db, COL, memberDocId), { status: 'active' });
}

/** Finds pending invitations addressed to a given email — used right after signup/login. */
export async function findPendingInvitations(email: string): Promise<WorkspaceMemberDoc[]> {
  const snap = await getDocs(
    query(collection(db, COL), where('email', '==', email.toLowerCase()), where('invitationStatus', '==', 'pending'))
  );
  return snap.docs.map((d) => d.data() as WorkspaceMemberDoc);
}
