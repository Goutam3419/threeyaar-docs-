export type ActivityEventType =
  | 'login'
  | 'workspace_updated'
  | 'connection_event'
  | 'billing_event'
  | 'marketplace_event'
  | 'agent_installed'
  | 'agent_uninstalled'
  | 'role_changed'
  | 'admin_action';

export interface ActivityLogDoc {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  type: ActivityEventType;
  description: string;
  createdAt: string;
}

export interface AuditLogDoc {
  id: string;
  action: string;
  userId: string;
  userName: string;
  workspaceId: string;
  beforeValue: Record<string, unknown> | null;
  afterValue: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}
