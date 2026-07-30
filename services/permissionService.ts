import { roleHasPermission, type PermissionScope, type WorkspaceRole } from '@/types/workspace';
import type { WorkspaceMemberDoc } from '@/types/workspace';
import type { WorkspaceDoc } from '@/types/firestore';

/**
 * Resolves a user's effective role in a workspace. The workspace owner is
 * always 'Owner' even if there's no separate workspaceMembers doc for them
 * (they're implicit, per how workspaces are created in models/workspaceModel.ts).
 */
export function resolveRole(uid: string, workspace: WorkspaceDoc | null, members: WorkspaceMemberDoc[]): WorkspaceRole | null {
  if (workspace?.ownerId === uid) return 'Owner';
  const member = members.find((m) => m.uid === uid && m.status === 'active');
  return member?.role ?? null;
}

export function can(role: WorkspaceRole | null, scope: PermissionScope): boolean {
  if (!role) return false;
  return roleHasPermission(role, scope);
}

export function canManageMember(actingRole: WorkspaceRole | null, targetRole: WorkspaceRole): boolean {
  if (actingRole === 'Owner') return true;
  if (actingRole === 'Admin') return targetRole !== 'Owner';
  return false;
}
