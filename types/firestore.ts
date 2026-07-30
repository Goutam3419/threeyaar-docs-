// Structural types for every Firestore collection used by the app.
// These define shape only — no documents are seeded with fake data.

export type AgentStatus = 'draft' | 'published' | 'hidden';
export type AgentPricingType = 'Free' | 'Subscription' | 'Usage-based';

export interface AgentReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AgentDoc {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  icon: string; // Storage download URL
  coverImage: string; // Storage download URL
  category: string;
  developer: string; // display name of the publisher
  developerId: string; // uid of the agent's publisher/admin who created it
  version: string;
  price: number | null;
  currency: string | null;
  pricingType: AgentPricingType;
  rating: number;
  reviews: AgentReview[];
  downloads: number;
  tags: string[];
  screenshots: string[]; // Storage download URLs
  features: string[];
  requirements: string[];
  status: AgentStatus;
  featured: boolean;
  popular: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InstalledAgentDoc {
  id: string;
  userId: string; // uid of who installed it
  agentId: string;
  workspaceId: string;
  installedAt: string;
  status: 'RUNNING' | 'SLEEPING';
  version: string;
  configuration: Record<string, unknown>;
}

export interface FavoriteDoc {
  id: string;
  userId: string;
  agentId: string;
  createdAt: string;
}

export interface ConnectionDoc {
  id: string;
  workspaceId: string;
  provider: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  connectedAt: string | null;
  connectedBy: string | null; // uid
}

export interface NotificationDoc {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  description: string;
  category: 'Agent' | 'Connection' | 'Billing' | 'Marketplace' | 'System' | 'Workspace' | 'Security';
  unread: boolean;
  createdAt: string;
}

export interface PricingPlanDoc {
  id: string;
  name: string;
  priceAmount: number | null;
  currency: string | null;
  billingPeriod: 'monthly' | 'yearly' | 'custom';
  description: string;
  features: string[];
  popular: boolean;
  updatedAt: string;
}

export interface SettingsDoc {
  workspaceId: string;
  defaultCurrency: string;
  senderDomain: string;
  updatedAt: string;
}

export type WorkspaceStatus = 'active' | 'suspended' | 'deleted';
export type WorkspacePlanId = 'free' | string; // 'free' plus PRICING_PLANS ids (starter/growth/enterprise)

export interface WorkspaceLimits {
  maxMembers: number;
  maxInstalledAgents: number;
  maxConnections: number;
  maxAiRequestsPerMonth: number;
  maxStorageMb: number;
}

export interface WorkspaceUsage {
  aiRequestsThisMonth: number;
  storageUsedMb: number;
  apiCallsToday: number;
  lastResetAt: string; // ISO date the monthly counters were last reset
}

export interface WorkspaceSettings {
  defaultCurrency: string;
  allowMemberInvites: boolean;
  requireApprovalForAgentInstall: boolean;
}

export interface WorkspaceDoc {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  ownerId: string; // uid of the workspace creator
  status: WorkspaceStatus;
  plan: WorkspacePlanId;
  settings: WorkspaceSettings;
  usage: WorkspaceUsage;
  limits: WorkspaceLimits;
  createdAt: string;
  updatedAt: string;
}

// Central collection name constants — use these instead of raw strings
// anywhere Firestore collections are referenced, to avoid typos.
export const COLLECTIONS = {
  USERS: 'users',
  AGENTS: 'agents',
  INSTALLED_AGENTS: 'installedAgents',
  FAVORITES: 'favorites',
  CONNECTIONS: 'connections',
  NOTIFICATIONS: 'notifications',
  PRICING_PLANS: 'pricingPlans',
  SETTINGS: 'settings',
  WORKSPACES: 'workspaces',
  WORKSPACE_MEMBERS: 'workspaceMembers',
  SUBSCRIPTIONS: 'subscriptions',
  PAYMENT_HISTORY: 'paymentHistory',
  INVOICES: 'invoices',
  ACTIVITY_LOGS: 'activityLogs',
  AUDIT_LOGS: 'auditLogs',
} as const;
