export type WorkspaceRole = 'Owner' | 'Admin' | 'Manager' | 'Member' | 'Viewer';

export type PermissionScope =
  | 'read'
  | 'write'
  | 'manage'
  | 'billing'
  | 'marketplace'
  | 'connections'
  | 'workspace'
  | 'admin'
  | 'integrationEngine'
  | 'agentManagement';

export type MemberStatus = 'active' | 'invited' | 'suspended';
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface WorkspaceMemberDoc {
  id: string; // `${workspaceId}_${uid}` once accepted, or the invite doc id while pending
  workspaceId: string;
  uid: string | null; // null until the invited person actually has/creates an account
  email: string;
  name: string;
  role: WorkspaceRole;
  status: MemberStatus;
  invitationStatus: InvitationStatus;
  invitedBy: string; // uid
  invitedAt: string;
  respondedAt: string | null;
  joinedAt: string | null;
}

/**
 * Role → permission matrix. Owner always has everything. This is the single
 * source of truth for what each role can do across the app.
 */
export const ROLE_PERMISSIONS: Record<WorkspaceRole, PermissionScope[]> = {
  Owner: ['read', 'write', 'manage', 'billing', 'marketplace', 'connections', 'workspace', 'admin', 'integrationEngine', 'agentManagement'],
  Admin: ['read', 'write', 'manage', 'billing', 'marketplace', 'connections', 'workspace', 'integrationEngine', 'agentManagement'],
  Manager: ['read', 'write', 'marketplace', 'connections', 'agentManagement'],
  Member: ['read', 'write', 'marketplace'],
  Viewer: ['read'],
};

export function roleHasPermission(role: WorkspaceRole, scope: PermissionScope): boolean {
  return ROLE_PERMISSIONS[role]?.includes(scope) ?? false;
}

export const ASSIGNABLE_ROLES: WorkspaceRole[] = ['Admin', 'Manager', 'Member', 'Viewer']; // Owner is never assignable — there's exactly one, the workspace creator
