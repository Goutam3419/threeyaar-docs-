'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Bot, Activity, Award, Check, UserPlus, Trash2, Megaphone, Download, 
  DollarSign, LayoutTemplate, Tags, ShoppingBag, Plus, Save, X, Pencil, Eye, EyeOff, Star, Upload, Info
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { CATEGORIES, PRICING_PLANS, PricingPlan, FAQS, FAQItem } from '@/data/mockData';
import { PROVIDERS } from '@/lib/providers/registry';
import { INTEGRATION_REGISTRY } from '@/lib/integration/registry';
import type { IntegrationLogEntry, QueueItem } from '@/lib/integration/types';
import type { ConnectionDoc } from '@/types/connections';
import { collection, onSnapshot, query, where, orderBy, limit as fsLimit, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/firebase';
import type { AgentDoc, AgentPricingType, WorkspaceDoc } from '@/types/firestore';
import type { WorkspaceMemberDoc, WorkspaceRole } from '@/types/workspace';
import { ASSIGNABLE_ROLES } from '@/types/workspace';
import type { SubscriptionDoc } from '@/types/billing';
import type { NotificationDoc } from '@/types/firestore';
import type { AuditLogDoc } from '@/types/logs';
import { subscribeToWorkspace, updateWorkspaceProfile, updateWorkspaceStatus } from '@/services/workspaceService';
import { subscribeToMembers, inviteMember, removeMember, changeMemberRole } from '@/services/teamService';
import { subscribeToSubscription } from '@/services/billingService';
import { getUsageSummary, type UsageSummary } from '@/services/usageService';
import { subscribeToAuditLogs } from '@/services/auditLogService';
import { recordAuditLog } from '@/services/auditLogService';
import {
  subscribeToAllAgentsForAdmin,
  createAgentDoc,
  updateAgentDoc,
  deleteAgentDoc,
  setAgentStatus,
  setAgentFeatured,
  setAgentIcon,
  setAgentCoverImage,
  addAgentScreenshot,
} from '@/services/agentService';

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP'];

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'team', label: 'Team & Access' },
  { id: 'billing-dashboard', label: 'Billing Dashboard' },
  { id: 'usage-analytics', label: 'Usage Analytics' },
  { id: 'pricing', label: 'Pricing & Currency' },
  { id: 'content', label: 'Homepage Content' },
  { id: 'categories', label: 'Categories' },
  { id: 'marketplace', label: 'Marketplace Agents' },
  { id: 'connections', label: 'Connections' },
  { id: 'integration-engine', label: 'Integration Engine' },
  { id: 'notifications-dashboard', label: 'Notifications' },
  { id: 'audit-log', label: 'Audit Log' },
  { id: 'announcements', label: 'Announcements' },
];

export default function AdminView({ 
  toast, ownerName, ownerEmail, companyName, workspaceId, userId 
}: { 
  toast: any; 
  ownerName?: string; 
  ownerEmail?: string; 
  companyName?: string; 
  workspaceId?: string;
  userId?: string;
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [members, setMembers] = useState<WorkspaceMemberDoc[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    const unsub = subscribeToMembers(workspaceId, (list) => { setMembers(list); setMembersLoading(false); }, () => setMembersLoading(false));
    return () => unsub();
  }, [workspaceId]);
  
  // Invite form state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('Member');
  const [isInviting, setIsInviting] = useState(false);

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Pricing & currency state (local only — will be persisted via the database once backend is connected)
  const [plans, setPlans] = useState<PricingPlan[]>(PRICING_PLANS);
  const [defaultCurrency, setDefaultCurrency] = useState<string>('USD');

  // Homepage content state (local only)
  const [heroHeadline, setHeroHeadline] = useState('Autonomous agents, catalogued and deployed on live pipelines.');
  const [heroSubheadline, setHeroSubheadline] = useState('Discover, secure, and instant-deploy AI agents to handle support, sales, finance, and marketing for your business.');
  const [features, setFeatures] = useState([
    { id: 'f-1', title: 'Verified Agents', description: 'Every agent listed on the marketplace is reviewed before it goes live.' },
    { id: 'f-2', title: 'Secure by Default', description: 'Your business data and connected tools stay protected at every step.' },
    { id: 'f-3', title: 'Human Support', description: 'A real team is available to help you set up and troubleshoot agents.' },
  ]);
  const [faqs, setFaqs] = useState<FAQItem[]>(FAQS);

  // Categories state (local only)
  const [categories, setCategories] = useState<string[]>(CATEGORIES.filter(c => c !== 'All Categories'));
  const [newCategory, setNewCategory] = useState('');

  // Marketplace agents state (local only)
  const [agents, setAgents] = useState<AgentDoc[]>([]);

  // ---------- Connections (platform-wide, admin view) ----------
  const [allConnections, setAllConnections] = useState<ConnectionDoc[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [disabledProviders, setDisabledProviders] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'connections'),
      (snap) => { setAllConnections(snap.docs.map((d) => d.data() as ConnectionDoc)); setConnectionsLoading(false); },
      () => setConnectionsLoading(false)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'providers')).then((snap) => {
      if (snap.exists()) setDisabledProviders(snap.data().disabled || []);
    }).catch(() => {});
  }, []);

  const handleToggleProviderEnabled = async (providerId: string) => {
    const next = disabledProviders.includes(providerId)
      ? disabledProviders.filter((id) => id !== providerId)
      : [...disabledProviders, providerId];
    setDisabledProviders(next);
    try {
      await setDoc(doc(db, 'settings', 'providers'), { disabled: next, updatedAt: new Date().toISOString() }, { merge: true });
      toast(`${providerId} ${next.includes(providerId) ? 'disabled' : 'enabled'} platform-wide`, { type: 'success' });
    } catch {
      toast('Could not update provider status', { type: 'error' });
    }
  };

  // ---------- Integration Engine dashboard ----------
  const [integrationLogs, setIntegrationLogs] = useState<IntegrationLogEntry[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [diagnosticProvider, setDiagnosticProvider] = useState(PROVIDERS[0]?.id || '');
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'integrationLogs'), orderBy('startedAt', 'desc'), fsLimit(30)),
      (snap) => setIntegrationLogs(snap.docs.map((d) => d.data() as IntegrationLogEntry)),
      () => {}
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'integrationQueue'),
      (snap) => setQueueItems(snap.docs.map((d) => d.data() as QueueItem)),
      () => {}
    );
    return () => unsub();
  }, []);

  const handleRunDiagnostic = async () => {
    const user = auth.currentUser;
    if (!user || !diagnosticProvider) return;
    setRunningDiagnostic(true);
    setDiagnosticReport(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/integration/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ provider: diagnosticProvider, workspaceId: user.uid }),
      });
      const report = await res.json();
      setDiagnosticReport(report);
    } catch {
      toast('Diagnostic failed to run', { type: 'error' });
    } finally {
      setRunningDiagnostic(false);
    }
  };
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentCategory, setNewAgentCategory] = useState(categories[0] || '');
  const [newAgentDescription, setNewAgentDescription] = useState('');
  const [newAgentPricingType, setNewAgentPricingType] = useState<AgentPricingType>('Free');
  const [newAgentPrice, setNewAgentPrice] = useState('');
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [uploadingAssetFor, setUploadingAssetFor] = useState<string | null>(null);

  useEffect(() => {
    setAgentsLoading(true);
    const unsub = subscribeToAllAgentsForAdmin(
      (list) => { setAgents(list); setAgentsLoading(false); },
      () => setAgentsLoading(false)
    );
    return () => unsub();
  }, []);

  const notConnected = () => toast('Backend not connected yet', { description: 'This change is saved locally only. It will sync to the database once backend integration is live.', type: 'info' });

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) {
      toast('Incomplete Invitation', { description: 'Please fill in a name and email address.', type: 'error' });
      return;
    }
    try {
      await inviteMember({ workspaceId: workspaceId || '', email: inviteEmail, name: inviteName, role: inviteRole, invitedBy: userId || '' });
      await recordAuditLog({
        action: 'team.member_invited', userId: userId || '', userName: ownerName || '', workspaceId: workspaceId || '',
        beforeValue: null, afterValue: { email: inviteEmail, role: inviteRole },
      });
      setInviteName('');
      setInviteEmail('');
      setIsInviting(false);
      toast('Invitation Sent', { description: `${inviteName} (${inviteEmail}) added as ${inviteRole}.`, type: 'success' });
    } catch (err: any) {
      if (err?.message === 'ALREADY_INVITED') {
        toast('Already Invited', { description: 'This email already has a pending invitation or is a member.', type: 'error' });
      } else {
        toast('Could Not Invite', { type: 'error' });
      }
    }
  };

  const handleRemoveUser = async (memberDocId: string, name: string) => {
    try {
      await removeMember(memberDocId);
      await recordAuditLog({
        action: 'team.member_removed', userId: userId || '', userName: ownerName || '', workspaceId: workspaceId || '',
        beforeValue: { name }, afterValue: null,
      });
      toast('Access Removed', { description: `Removed ${name} from the workspace.`, type: 'info' });
    } catch {
      toast('Could Not Remove Member', { type: 'error' });
    }
  };

  const handleChangeRole = async (memberDocId: string, role: WorkspaceRole) => {
    try {
      await changeMemberRole(memberDocId, role);
      toast('Role Updated', { type: 'success' });
    } catch {
      toast('Could Not Update Role', { type: 'error' });
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage) {
      toast('Empty Message', { description: 'Please enter a message to broadcast.', type: 'error' });
      return;
    }
    setBroadcastMessage('');
    notConnected();
  };

  const updatePlanPrice = (id: string, amount: string) => {
    const parsed = amount === '' ? null : Number(amount);
    setPlans(prev => prev.map(p => p.id === id ? { ...p, priceAmount: Number.isNaN(parsed) ? p.priceAmount : parsed } : p));
  };

  const handleSavePricing = () => {
    notConnected();
  };

  const handleSaveContent = () => {
    notConnected();
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    setCategories(prev => [...prev, newCategory.trim()]);
    setNewCategory('');
    notConnected();
  };

  const handleRemoveCategory = (name: string) => {
    setCategories(prev => prev.filter(c => c !== name));
    notConnected();
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) {
      toast('Missing agent name', { type: 'error' });
      return;
    }
    try {
      await createAgentDoc({
        name: newAgentName,
        description: newAgentDescription,
        shortDescription: newAgentDescription.slice(0, 120),
        category: newAgentCategory,
        developer: companyName || 'Unknown',
        developerId: '',
        version: '1.0.0',
        price: newAgentPricingType === 'Free' ? null : (newAgentPrice ? Number(newAgentPrice) : null),
        currency: newAgentPricingType === 'Free' ? null : defaultCurrency,
        pricingType: newAgentPricingType,
        tags: [],
        features: [],
        requirements: [],
      });
      toast('Agent Created', { description: `${newAgentName} was added as a draft. Publish it when ready.`, type: 'success' });
      setNewAgentName('');
      setNewAgentDescription('');
      setNewAgentPrice('');
      setIsAddingAgent(false);
    } catch {
      toast('Could not create agent', { type: 'error' });
    }
  };

  const handleDeleteAgent = async (id: string, name: string) => {
    try {
      await deleteAgentDoc(id);
      toast('Agent Deleted', { description: `${name} was removed from the catalog.`, type: 'error' });
    } catch {
      toast('Could not delete agent', { type: 'error' });
    }
  };

  const handleTogglePublish = async (agent: AgentDoc) => {
    const next = agent.status === 'published' ? 'hidden' : 'published';
    try {
      await setAgentStatus(agent.id, next);
      toast(next === 'published' ? 'Agent Published' : 'Agent Hidden', {
        description: `${agent.name} is now ${next}.`,
        type: 'success',
      });
    } catch {
      toast('Could not update status', { type: 'error' });
    }
  };

  const handleToggleFeatured = async (agent: AgentDoc) => {
    try {
      await setAgentFeatured(agent.id, !agent.featured);
    } catch {
      toast('Could not update featured flag', { type: 'error' });
    }
  };

  const handleEditField = async (id: string, updates: Partial<AgentDoc>) => {
    try {
      await updateAgentDoc(id, updates);
    } catch {
      toast('Could not save changes', { type: 'error' });
    }
  };

  const handleUploadIcon = async (agent: AgentDoc, file: File) => {
    setUploadingAssetFor(agent.id);
    try {
      await setAgentIcon(agent.id, file);
      toast('Icon Uploaded', { type: 'success' });
    } catch {
      toast('Upload Failed', { type: 'error' });
    } finally {
      setUploadingAssetFor(null);
    }
  };

  const handleUploadCover = async (agent: AgentDoc, file: File) => {
    setUploadingAssetFor(agent.id);
    try {
      await setAgentCoverImage(agent.id, file);
      toast('Cover Image Uploaded', { type: 'success' });
    } catch {
      toast('Upload Failed', { type: 'error' });
    } finally {
      setUploadingAssetFor(null);
    }
  };

  const handleUploadScreenshot = async (agent: AgentDoc, file: File) => {
    setUploadingAssetFor(agent.id);
    try {
      await addAgentScreenshot(agent.id, file, agent.screenshots);
      toast('Screenshot Uploaded', { type: 'success' });
    } catch {
      toast('Upload Failed', { type: 'error' });
    } finally {
      setUploadingAssetFor(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-medium text-white tracking-tight">Workspace Administration</h2>
          <p className="text-sm text-zinc-400 mt-1 font-sans font-medium">Manage your team, pricing, homepage content, and marketplace catalog.</p>
        </div>
        <div className="flex gap-2 select-none">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 border-zinc-800 text-xs font-bold text-zinc-300"
            onClick={notConnected}
            id="admin-export-btn"
          >
            <Download className="h-4 w-4 mr-1.5" /> Export Data
          </Button>
        </div>
      </div>

      <Tabs
        tabs={ADMIN_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="pills"
        className="overflow-x-auto no-scrollbar"
      />

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-800/70 border border-zinc-800/70">
          <div className="p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Tasks Executed</span>
              <Activity className="h-3.5 w-3.5 text-brass-500" />
            </div>
            <div>
              <p className="font-mono font-tabular text-2xl font-medium text-white leading-tight">0</p>
              <span className="text-[10px] text-zinc-500 font-mono block mt-1">No data yet</span>
            </div>
          </div>
          <div className="p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Listed Agents</span>
              <Bot className="h-3.5 w-3.5 text-brass-500" />
            </div>
            <div>
              <p className="font-mono font-tabular text-2xl font-medium text-white leading-tight">{agents.length}</p>
              <span className="text-[10px] text-zinc-500 font-mono block mt-1">In marketplace catalog</span>
            </div>
          </div>
          <div className="p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Team Seats</span>
              <Award className="h-3.5 w-3.5 text-brass-500" />
            </div>
            <div>
              <p className="font-mono font-tabular text-2xl font-medium text-white leading-tight">{members.filter(m => m.status === 'active').length + 1}</p>
              <span className="text-[10px] text-zinc-500 font-mono block mt-1">Active workspace members</span>
            </div>
          </div>
          <div className="p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Success Rate</span>
              <Check className="h-3.5 w-3.5 text-brass-500" />
            </div>
            <div>
              <p className="font-mono font-tabular text-2xl font-medium text-white leading-tight">—</p>
              <span className="text-[10px] text-zinc-500 font-mono block mt-1">No data yet</span>
            </div>
          </div>
        </div>
      )}

      {/* TEAM & ACCESS */}
      {activeTab === 'team' && (
        <Card className="glass-elevated p-6">
          <div className="flex justify-between items-center mb-5 select-none">
            <div>
              <h3 className="font-display text-base font-semibold text-white">Authorized Workspace Seats</h3>
              <p className="text-xs text-zinc-400 mt-1">Audit active logins, invite coworkers, or modify administrative roles.</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-zinc-800 text-zinc-300 text-xs font-bold"
              onClick={() => setIsInviting(!isInviting)}
              id="invite-user-toggle"
            >
              <UserPlus className="h-4 w-4 mr-1" /> Invite Member
            </Button>
          </div>

          {isInviting && (
            <form onSubmit={handleInviteUser} className="mb-6 p-4 bg-zinc-950 rounded-xl border border-zinc-800 max-w-lg space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Invite Coworker</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Name</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2 focus:border-brass-600 outline-none"
                    id="invite-user-name"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2 focus:border-brass-600 outline-none"
                    id="invite-user-email"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Access Role</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2 focus:border-brass-600 outline-none"
                  id="invite-user-role"
                >
                  {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 select-none">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsInviting(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-brass-700 hover:bg-brass-600 text-white font-semibold text-xs rounded-lg">
                  Send Invite
                </Button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-900/40 select-none">
                <TableRow className="border-zinc-800/30">
                  <TableHead className="text-xs text-zinc-400">Team Member</TableHead>
                  <TableHead className="text-xs text-zinc-400">Email Address</TableHead>
                  <TableHead className="text-xs text-zinc-400">Role</TableHead>
                  <TableHead className="text-xs text-zinc-400">Status</TableHead>
                  <TableHead className="text-xs text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-zinc-800/20 hover:bg-zinc-900/20">
                  <TableCell className="font-extrabold text-xs text-white">{ownerName || 'Workspace Owner'}</TableCell>
                  <TableCell className="text-xs text-zinc-400 font-mono">{ownerEmail || '—'}</TableCell>
                  <TableCell><Badge className="bg-zinc-800 text-zinc-300 border-none text-[9px] font-mono select-none uppercase">Owner</Badge></TableCell>
                  <TableCell><Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px]">Active</Badge></TableCell>
                  <TableCell className="text-right"><span className="text-[10px] text-zinc-500 italic block font-mono pr-2">Workspace creator</span></TableCell>
                </TableRow>
                {membersLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-xs text-zinc-500 py-4">Loading team...</TableCell></TableRow>
                ) : members.map((m) => (
                  <TableRow key={m.id} className="border-zinc-800/20 hover:bg-zinc-900/20">
                    <TableCell className="font-extrabold text-xs text-white">{m.name}</TableCell>
                    <TableCell className="text-xs text-zinc-400 font-mono">{m.email}</TableCell>
                    <TableCell>
                      <select
                        value={m.role}
                        onChange={(e) => handleChangeRole(m.id, e.target.value as WorkspaceRole)}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-mono uppercase rounded-md px-1.5 py-1 focus:border-brass-600 outline-none"
                        id={`role-select-${m.id}`}
                      >
                        {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Badge className={m.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px]' : m.invitationStatus === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px]' : 'bg-zinc-800 text-zinc-500 border border-zinc-800 text-[9px]'}>
                        {m.status === 'invited' ? m.invitationStatus : m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right select-none">
                      <button 
                        onClick={() => handleRemoveUser(m.id, m.name)}
                        className="p-1 hover:bg-zinc-900 rounded-lg text-red-400 hover:text-red-300 transition-all ml-auto block"
                        id={`remove-user-btn-${m.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* WORKSPACE MANAGEMENT */}
      {activeTab === 'workspace' && <AdminWorkspaceTab workspaceId={workspaceId} toast={toast} />}

      {/* BILLING DASHBOARD */}
      {activeTab === 'billing-dashboard' && <AdminBillingTab workspaceId={workspaceId} />}

      {/* USAGE ANALYTICS */}
      {activeTab === 'usage-analytics' && <AdminUsageTab workspaceId={workspaceId} memberCount={members.filter(m => m.status === 'active').length + 1} />}

      {/* NOTIFICATIONS DASHBOARD */}
      {activeTab === 'notifications-dashboard' && <AdminNotificationsTab workspaceId={workspaceId} />}

      {/* AUDIT LOG */}
      {activeTab === 'audit-log' && <AdminAuditLogTab />}

      {/* PRICING & CURRENCY */}
      {activeTab === 'pricing' && (
        <Card className="glass-elevated p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-semibold text-white flex items-center gap-2"><DollarSign className="h-4.5 w-4.5 text-brass-500" /> Pricing Plans & Currency</h3>
              <p className="text-xs text-zinc-400 mt-1">Prices are unset until configured here. Nothing is hardcoded in the app.</p>
            </div>
            <div className="flex items-center gap-2 select-none">
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Default Currency</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2 focus:border-brass-600 outline-none"
                id="admin-default-currency"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="p-4 border border-zinc-800 bg-zinc-950">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                  {plan.popular && <Badge className="bg-brass-600/10 text-brass-500 border border-brass-600/20 text-[9px]">Popular</Badge>}
                </div>
                <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">{plan.description}</p>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Price ({defaultCurrency})</label>
                <input
                  type="number"
                  placeholder="Not set"
                  value={plan.priceAmount ?? ''}
                  onChange={(e) => updatePlanPrice(plan.id, e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg p-2 focus:border-brass-600 outline-none font-mono"
                  id={`plan-price-${plan.id}`}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="primary" size="sm" className="bg-brass-700 hover:bg-brass-600 text-white font-semibold text-xs" onClick={handleSavePricing} id="save-pricing-btn">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save Pricing
            </Button>
          </div>
        </Card>
      )}

      {/* HOMEPAGE CONTENT */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <Card className="glass-elevated p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-white flex items-center gap-2"><LayoutTemplate className="h-4.5 w-4.5 text-brass-500" /> Hero Section</h3>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Headline</label>
              <textarea
                value={heroHeadline}
                onChange={(e) => setHeroHeadline(e.target.value)}
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm p-3 rounded-xl focus:border-brass-600 outline-none resize-none"
                id="admin-hero-headline"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Subheadline</label>
              <textarea
                value={heroSubheadline}
                onChange={(e) => setHeroSubheadline(e.target.value)}
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm p-3 rounded-xl focus:border-brass-600 outline-none resize-none"
                id="admin-hero-subheadline"
              />
            </div>
          </Card>

          <Card className="glass-elevated p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-white">Features</h3>
            <div className="space-y-3">
              {features.map((f, i) => (
                <div key={f.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 border border-zinc-800">
                  <input
                    type="text"
                    value={f.title}
                    onChange={(e) => setFeatures(prev => prev.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg p-2 focus:border-brass-600 outline-none font-semibold"
                    id={`feature-title-${f.id}`}
                  />
                  <input
                    type="text"
                    value={f.description}
                    onChange={(e) => setFeatures(prev => prev.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))}
                    className="sm:col-span-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg p-2 focus:border-brass-600 outline-none"
                    id={`feature-desc-${f.id}`}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass-elevated p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-white">FAQ</h3>
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <div key={f.id} className="p-3 border border-zinc-800 space-y-2">
                  <input
                    type="text"
                    value={f.question}
                    onChange={(e) => setFaqs(prev => prev.map((x, idx) => idx === i ? { ...x, question: e.target.value } : x))}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg p-2 focus:border-brass-600 outline-none font-semibold"
                    id={`faq-q-${f.id}`}
                  />
                  <textarea
                    value={f.answer}
                    onChange={(e) => setFaqs(prev => prev.map((x, idx) => idx === i ? { ...x, answer: e.target.value } : x))}
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg p-2 focus:border-brass-600 outline-none resize-none"
                    id={`faq-a-${f.id}`}
                  />
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button variant="primary" size="sm" className="bg-brass-700 hover:bg-brass-600 text-white font-semibold text-xs" onClick={handleSaveContent} id="save-content-btn">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save Homepage Content
            </Button>
          </div>
        </div>
      )}

      {/* CATEGORIES */}
      {activeTab === 'categories' && (
        <Card className="glass-elevated p-6 space-y-4">
          <h3 className="font-display text-base font-semibold text-white flex items-center gap-2"><Tags className="h-4.5 w-4.5 text-brass-500" /> Marketplace Categories</h3>
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="Add a new category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl p-2.5 focus:border-brass-600 outline-none"
              id="admin-new-category"
            />
            <Button variant="secondary" size="sm" onClick={handleAddCategory} id="admin-add-category-btn">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span key={cat} className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-2.5 py-1.5">
                {cat}
                <button onClick={() => handleRemoveCategory(cat)} id={`remove-category-${cat}`}>
                  <X className="h-3 w-3 text-zinc-500 hover:text-red-400" />
                </button>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* MARKETPLACE AGENTS */}
      {activeTab === 'marketplace' && (
        <Card className="glass-elevated p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white flex items-center gap-2"><ShoppingBag className="h-4.5 w-4.5 text-brass-500" /> Marketplace Agents</h3>
            <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-300 text-xs font-bold" onClick={() => setIsAddingAgent(!isAddingAgent)} id="admin-add-agent-toggle">
              <Plus className="h-4 w-4 mr-1" /> Create Agent
            </Button>
          </div>

          {isAddingAgent && (
            <form onSubmit={handleAddAgent} className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
              <input
                type="text"
                placeholder="Agent name"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg p-2 focus:border-brass-600 outline-none"
                id="new-agent-name"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newAgentCategory}
                  onChange={(e) => setNewAgentCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2 focus:border-brass-600 outline-none"
                  id="new-agent-category"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={newAgentPricingType}
                  onChange={(e) => setNewAgentPricingType(e.target.value as AgentPricingType)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2 focus:border-brass-600 outline-none"
                  id="new-agent-pricing-type"
                >
                  <option value="Free">Free</option>
                  <option value="Subscription">Subscription</option>
                  <option value="Usage-based">Usage-based</option>
                </select>
              </div>
              {newAgentPricingType !== 'Free' && (
                <input
                  type="number"
                  placeholder={`Price (${defaultCurrency})`}
                  value={newAgentPrice}
                  onChange={(e) => setNewAgentPrice(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg p-2 focus:border-brass-600 outline-none font-mono"
                  id="new-agent-price"
                />
              )}
              <textarea
                placeholder="Short description"
                value={newAgentDescription}
                onChange={(e) => setNewAgentDescription(e.target.value)}
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg p-2 focus:border-brass-600 outline-none resize-none"
                id="new-agent-description"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsAddingAgent(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" className="bg-brass-700 hover:bg-brass-600 text-white font-semibold text-xs">Create as Draft</Button>
              </div>
            </form>
          )}

          {agentsLoading ? (
            <p className="text-xs text-zinc-500 py-6 text-center">Loading catalog...</p>
          ) : agents.length === 0 ? (
            <EmptyState
              title="No Agents in Catalog"
              description="Create your first agent to populate the marketplace."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-900/40 select-none">
                  <TableRow className="border-zinc-800/30">
                    <TableHead className="text-xs text-zinc-400">Agent</TableHead>
                    <TableHead className="text-xs text-zinc-400">Category</TableHead>
                    <TableHead className="text-xs text-zinc-400">Pricing</TableHead>
                    <TableHead className="text-xs text-zinc-400">Status</TableHead>
                    <TableHead className="text-xs text-zinc-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((a) => (
                    <React.Fragment key={a.id}>
                      <TableRow className="border-zinc-800/20 hover:bg-zinc-900/20">
                        <TableCell className="font-extrabold text-xs text-white">
                          <div className="flex items-center gap-2">
                            {a.icon ? <img src={a.icon} alt="" className="h-6 w-6 rounded object-contain" /> : <Bot className="h-4 w-4 text-brass-500" />}
                            {a.name}
                            {a.featured && <Star className="h-3 w-3 fill-brass-500 text-brass-500" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-400">{a.category}</TableCell>
                        <TableCell className="text-xs text-zinc-400 font-mono">
                          {a.pricingType === 'Free' ? 'Free' : `${a.currency ?? ''}${a.price ?? '—'}`}
                        </TableCell>
                        <TableCell>
                          <Badge className={a.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px]' : a.status === 'draft' ? 'bg-zinc-800 text-zinc-500 border border-zinc-800 text-[9px]' : 'bg-red-500/10 text-red-400 border border-red-500/20 text-[9px]'}>
                            {a.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => handleTogglePublish(a)} title={a.status === 'published' ? 'Hide' : 'Publish'} className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white" id={`toggle-publish-${a.id}`}>
                              {a.status === 'published' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={() => handleToggleFeatured(a)} title={a.featured ? 'Unfeature' : 'Feature'} className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-brass-400" id={`toggle-featured-${a.id}`}>
                              <Star className={`h-3.5 w-3.5 ${a.featured ? 'fill-brass-500 text-brass-500' : ''}`} />
                            </button>
                            <button onClick={() => setEditingAgentId(editingAgentId === a.id ? null : a.id)} title="Edit" className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white" id={`edit-agent-${a.id}`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteAgent(a.id, a.name)} title="Delete" className="p-1.5 hover:bg-zinc-900 rounded-lg text-red-400 hover:text-red-300" id={`delete-agent-${a.id}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {editingAgentId === a.id && (
                        <TableRow className="border-zinc-800/20">
                          <TableCell colSpan={5} className="bg-zinc-950/60 p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Name</label>
                                <input
                                  type="text"
                                  defaultValue={a.name}
                                  onBlur={(e) => handleEditField(a.id, { name: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg p-2 focus:border-brass-600 outline-none"
                                  id={`edit-name-${a.id}`}
                                />
                                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Category</label>
                                <select
                                  defaultValue={a.category}
                                  onChange={(e) => handleEditField(a.id, { category: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2 focus:border-brass-600 outline-none"
                                  id={`edit-category-${a.id}`}
                                >
                                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Description</label>
                                <textarea
                                  defaultValue={a.description}
                                  onBlur={(e) => handleEditField(a.id, { description: e.target.value, shortDescription: e.target.value.slice(0, 120) })}
                                  rows={2}
                                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2 focus:border-brass-600 outline-none resize-none"
                                  id={`edit-description-${a.id}`}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Pricing Type</label>
                                <select
                                  defaultValue={a.pricingType}
                                  onChange={(e) => handleEditField(a.id, { pricingType: e.target.value as AgentPricingType, price: e.target.value === 'Free' ? null : a.price, currency: e.target.value === 'Free' ? null : defaultCurrency })}
                                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2 focus:border-brass-600 outline-none"
                                  id={`edit-pricing-type-${a.id}`}
                                >
                                  <option value="Free">Free</option>
                                  <option value="Subscription">Subscription</option>
                                  <option value="Usage-based">Usage-based</option>
                                </select>
                                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Price ({defaultCurrency})</label>
                                <input
                                  type="number"
                                  defaultValue={a.price ?? ''}
                                  onBlur={(e) => handleEditField(a.id, { price: e.target.value ? Number(e.target.value) : null })}
                                  disabled={a.pricingType === 'Free'}
                                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg p-2 focus:border-brass-600 outline-none font-mono disabled:opacity-40"
                                  id={`edit-price-${a.id}`}
                                />

                                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block pt-1">Assets</label>
                                <div className="flex flex-wrap gap-2">
                                  <label className="text-[10px] bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 cursor-pointer text-zinc-300 hover:border-brass-600 flex items-center gap-1">
                                    <Upload className="h-3 w-3" /> Icon
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUploadIcon(a, e.target.files[0])} id={`upload-icon-${a.id}`} />
                                  </label>
                                  <label className="text-[10px] bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 cursor-pointer text-zinc-300 hover:border-brass-600 flex items-center gap-1">
                                    <Upload className="h-3 w-3" /> Cover
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUploadCover(a, e.target.files[0])} id={`upload-cover-${a.id}`} />
                                  </label>
                                  <label className="text-[10px] bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 cursor-pointer text-zinc-300 hover:border-brass-600 flex items-center gap-1">
                                    <Upload className="h-3 w-3" /> Screenshot
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUploadScreenshot(a, e.target.files[0])} id={`upload-screenshot-${a.id}`} />
                                  </label>
                                </div>
                                {uploadingAssetFor === a.id && <p className="text-[10px] text-brass-400">Uploading...</p>}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}

      {/* CONNECTIONS (Admin) */}
      {activeTab === 'connections' && (
        <div className="space-y-6">
          {/* Usage stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {PROVIDERS.slice(0, 12).map((p) => {
              const count = allConnections.filter((c) => c.provider === p.id && c.status === 'CONNECTED').length;
              return (
                <div key={p.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold truncate">{p.name}</p>
                  <p className="font-mono font-tabular text-lg text-white mt-1">{count}</p>
                </div>
              );
            })}
          </div>

          {/* Provider enable/disable */}
          <Card className="glass-elevated p-6">
            <h3 className="font-display text-base font-semibold text-white mb-1">Provider Availability</h3>
            <p className="text-xs text-zinc-500 mb-4">Disabling a provider hides its Connect button platform-wide without deleting existing connections.</p>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((p) => {
                const isDisabled = disabledProviders.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleToggleProviderEnabled(p.id)}
                    className={`text-xs font-semibold rounded-lg px-3 py-1.5 border ${isDisabled ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}
                    id={`toggle-provider-${p.id}`}
                  >
                    {p.name} — {isDisabled ? 'Disabled' : 'Enabled'}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* All platform connections + OAuth errors */}
          <Card className="glass-elevated p-6">
            <h3 className="font-display text-base font-semibold text-white mb-4">All Platform Connections</h3>
            {connectionsLoading ? (
              <p className="text-xs text-zinc-500 py-6 text-center">Loading...</p>
            ) : allConnections.length === 0 ? (
              <EmptyState title="No Connections Yet" description="Once users connect providers, they'll show up here." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-900/40 select-none">
                    <TableRow className="border-zinc-800/30">
                      <TableHead className="text-xs text-zinc-400">Provider</TableHead>
                      <TableHead className="text-xs text-zinc-400">Workspace</TableHead>
                      <TableHead className="text-xs text-zinc-400">Status</TableHead>
                      <TableHead className="text-xs text-zinc-400">Last Synced</TableHead>
                      <TableHead className="text-xs text-zinc-400">Last Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allConnections.map((c) => (
                      <TableRow key={c.id} className="border-zinc-800/20 hover:bg-zinc-900/20">
                        <TableCell className="font-extrabold text-xs text-white">{PROVIDERS.find(p => p.id === c.provider)?.name || c.provider}</TableCell>
                        <TableCell className="text-xs text-zinc-400 font-mono">{c.workspaceId}</TableCell>
                        <TableCell>
                          <Badge className={c.status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px]' : c.status === 'EXPIRED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px]' : 'bg-red-500/10 text-red-400 border border-red-500/20 text-[9px]'}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-400">{c.lastSynced ? new Date(c.lastSynced).toLocaleString() : '—'}</TableCell>
                        <TableCell className="text-xs text-red-400">{c.lastError || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>

          <div className="flex items-start gap-2 p-3 glass-inset rounded-xl">
            <Users className="h-4 w-4 text-brass-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-400">Access tokens are never visible here or anywhere in the admin UI — they're encrypted and stored server-side only.</p>
          </div>
        </div>
      )}

      {/* INTEGRATION ENGINE */}
      {activeTab === 'integration-engine' && (
        <div className="space-y-6">
          {/* Registry stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Registered Providers</p>
              <p className="font-mono font-tabular text-2xl text-white mt-1">{INTEGRATION_REGISTRY.length}</p>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Total Operations Logged</p>
              <p className="font-mono font-tabular text-2xl text-white mt-1">{integrationLogs.length}</p>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Queue: Pending</p>
              <p className="font-mono font-tabular text-2xl text-white mt-1">{queueItems.filter(q => q.status === 'pending').length}</p>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Recent Failures</p>
              <p className="font-mono font-tabular text-2xl text-red-400 mt-1">{integrationLogs.filter(l => l.result === 'failure').length}</p>
            </div>
          </div>

          {/* Test Center */}
          <Card className="glass-elevated p-6">
            <h3 className="font-display text-base font-semibold text-white mb-1">Integration Test Center</h3>
            <p className="text-xs text-zinc-500 mb-4">Run a live diagnostic — connection, permission, health, latency, and operation validation.</p>
            <div className="flex gap-2 mb-4">
              <select
                value={diagnosticProvider}
                onChange={(e) => setDiagnosticProvider(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2 focus:border-brass-600 outline-none flex-1"
                id="diagnostic-provider-select"
              >
                {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Button variant="primary" size="sm" className="bg-brass-700 hover:bg-brass-600 text-white text-xs" isLoading={runningDiagnostic} onClick={handleRunDiagnostic} id="run-diagnostic-btn">
                Run Diagnostic
              </Button>
            </div>

            {diagnosticReport && (
              <div className="space-y-2 p-4 glass-inset">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{diagnosticReport.provider}</span>
                  <Badge className={diagnosticReport.overallPass ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px]' : 'bg-red-500/10 text-red-400 border border-red-500/20 text-[9px]'}>
                    {diagnosticReport.overallPass ? 'ALL PASS' : 'ISSUES FOUND'}
                  </Badge>
                </div>
                {diagnosticReport.results?.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-t border-zinc-800/30">
                    <span className={r.pass ? 'text-zinc-300' : 'text-red-400'}>{r.pass ? '✓' : '✗'} {r.name}</span>
                    <span className="text-zinc-500 font-mono text-[10px]">{r.message}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Registry table */}
          <Card className="glass-elevated p-6">
            <h3 className="font-display text-base font-semibold text-white mb-4">Provider Registry</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-900/40 select-none">
                  <TableRow className="border-zinc-800/30">
                    <TableHead className="text-xs text-zinc-400">Provider</TableHead>
                    <TableHead className="text-xs text-zinc-400">Type</TableHead>
                    <TableHead className="text-xs text-zinc-400">Auth</TableHead>
                    <TableHead className="text-xs text-zinc-400">Capabilities</TableHead>
                    <TableHead className="text-xs text-zinc-400">Version</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INTEGRATION_REGISTRY.map((entry) => (
                    <TableRow key={entry.id} className="border-zinc-800/20 hover:bg-zinc-900/20">
                      <TableCell className="font-extrabold text-xs text-white">{entry.name}</TableCell>
                      <TableCell className="text-xs text-zinc-400">{entry.type}</TableCell>
                      <TableCell className="text-xs text-zinc-400 font-mono">{entry.authType}</TableCell>
                      <TableCell className="text-xs text-zinc-400">{entry.capabilities.join(', ')}</TableCell>
                      <TableCell className="text-xs text-zinc-500 font-mono">v{entry.version}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Recent activity / errors log */}
          <Card className="glass-elevated p-6">
            <h3 className="font-display text-base font-semibold text-white mb-4">Recent Activity</h3>
            {integrationLogs.length === 0 ? (
              <EmptyState title="No Activity Yet" description="Operation logs will appear here once agents start using the Integration Engine." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-900/40 select-none">
                    <TableRow className="border-zinc-800/30">
                      <TableHead className="text-xs text-zinc-400">Provider</TableHead>
                      <TableHead className="text-xs text-zinc-400">Operation</TableHead>
                      <TableHead className="text-xs text-zinc-400">Result</TableHead>
                      <TableHead className="text-xs text-zinc-400">Duration</TableHead>
                      <TableHead className="text-xs text-zinc-400">Retries</TableHead>
                      <TableHead className="text-xs text-zinc-400">Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {integrationLogs.map((log) => (
                      <TableRow key={log.id} className="border-zinc-800/20 hover:bg-zinc-900/20">
                        <TableCell className="font-extrabold text-xs text-white">{log.provider}</TableCell>
                        <TableCell className="text-xs text-zinc-400 font-mono">{log.operation}</TableCell>
                        <TableCell>
                          <Badge className={log.result === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px]' : 'bg-red-500/10 text-red-400 border border-red-500/20 text-[9px]'}>
                            {log.result}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-400 font-mono">{log.durationMs}ms</TableCell>
                        <TableCell className="text-xs text-zinc-400">{log.retryCount}</TableCell>
                        <TableCell className="text-xs text-red-400">{log.error || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ANNOUNCEMENTS & NOTIFICATIONS */}
      {activeTab === 'announcements' && (
        <Card className="glass-elevated p-6 flex flex-col justify-between max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-2">
              <Megaphone className="h-4.5 w-4.5 text-brass-500" /> Broadcast Announcement
            </h3>
            <p className="text-xs text-zinc-400 mb-4">Send a notification to every user's Notifications tab once backend delivery is connected.</p>
            <form onSubmit={handleBroadcast}>
              <textarea
                placeholder="Type your announcement message..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs p-3 rounded-xl focus:border-brass-600 outline-none resize-none"
                id="broadcast-message-input"
              />
              <div className="mt-4 flex justify-end select-none">
                <Button type="submit" variant="primary" className="bg-brass-700 hover:bg-brass-600 text-white font-bold text-xs rounded-xl px-4 py-2">
                  Send Announcement
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

    </div>
  );
}

// ============================================================
// WORKSPACE MANAGEMENT
// ============================================================
function AdminWorkspaceTab({ workspaceId, toast }: { workspaceId?: string; toast: any }) {
  const [workspace, setWorkspace] = useState<WorkspaceDoc | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    const unsub = subscribeToWorkspace(workspaceId, (w) => {
      setWorkspace(w);
      if (w) { setName(w.name); setDescription(w.description); setLogoUrl(w.logoUrl); }
    });
    return () => unsub();
  }, [workspaceId]);

  const handleSave = async () => {
    if (!workspaceId) return;
    setSaving(true);
    try {
      await updateWorkspaceProfile(workspaceId, { name, description, logoUrl });
      toast('Workspace Updated', { type: 'success' });
    } catch {
      toast('Could Not Save', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!workspaceId || !workspace) return;
    const next = workspace.status === 'active' ? 'suspended' : 'active';
    try {
      await updateWorkspaceStatus(workspaceId, next);
      toast(`Workspace ${next}`, { type: next === 'active' ? 'success' : 'error' });
    } catch {
      toast('Could Not Update Status', { type: 'error' });
    }
  };

  if (!workspace) return <p className="text-xs text-zinc-500 py-6 text-center">Loading workspace...</p>;

  return (
    <div className="space-y-6">
      <Card className="glass-elevated p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-white">Workspace Profile</h3>
          <Badge className={workspace.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px]' : 'bg-red-500/10 text-red-400 border border-red-500/20 text-[9px]'}>
            {workspace.status}
          </Badge>
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Workspace Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-lg p-2.5 focus:border-brass-600 outline-none" id="workspace-name-input" />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Logo URL</label>
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-lg p-2.5 focus:border-brass-600 outline-none" id="workspace-logo-input" />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-lg p-2.5 focus:border-brass-600 outline-none resize-none" id="workspace-description-input" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Button variant="outline" size="sm" className={workspace.status === 'active' ? 'border-red-500/20 text-red-400' : 'border-emerald-500/20 text-emerald-400'} onClick={handleToggleStatus} id="toggle-workspace-status-btn">
            {workspace.status === 'active' ? 'Suspend Workspace' : 'Reactivate Workspace'}
          </Button>
          <Button variant="primary" size="sm" className="bg-brass-700 hover:bg-brass-600 text-white" isLoading={saving} onClick={handleSave} id="save-workspace-btn">
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save Changes
          </Button>
        </div>
      </Card>

      <Card className="glass-elevated p-6">
        <h3 className="font-display text-base font-semibold text-white mb-4">Workspace Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 glass-inset">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Plan</p>
            <p className="text-white font-bold mt-1 capitalize">{workspace.plan}</p>
          </div>
          <div className="p-3 glass-inset">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Created</p>
            <p className="text-white font-bold mt-1">{new Date(workspace.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="p-3 glass-inset">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Updated</p>
            <p className="text-white font-bold mt-1">{new Date(workspace.updatedAt).toLocaleDateString()}</p>
          </div>
          <div className="p-3 glass-inset">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Currency</p>
            <p className="text-white font-bold mt-1">{workspace.settings.defaultCurrency}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// BILLING DASHBOARD (admin view of the workspace's subscription)
// ============================================================
function AdminBillingTab({ workspaceId }: { workspaceId?: string }) {
  const [subscription, setSubscription] = useState<SubscriptionDoc | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    const unsub = subscribeToSubscription(workspaceId, setSubscription);
    return () => unsub();
  }, [workspaceId]);

  return (
    <Card className="glass-elevated p-6 space-y-4">
      <h3 className="font-display text-base font-semibold text-white">Billing Overview</h3>
      {!subscription ? (
        <p className="text-xs text-zinc-500">No subscription record yet — it's created the first time billing is viewed.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 glass-inset">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Plan</p>
            <p className="text-white font-bold mt-1 capitalize">{subscription.planId}</p>
          </div>
          <div className="p-3 glass-inset">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Status</p>
            <Badge className={subscription.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] mt-1' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] mt-1'}>{subscription.status}</Badge>
          </div>
          <div className="p-3 glass-inset">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Period Ends</p>
            <p className="text-white font-bold mt-1">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
          </div>
          <div className="p-3 glass-inset">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Auto-Renew</p>
            <p className="text-white font-bold mt-1">{subscription.cancelAtPeriodEnd ? 'No' : 'Yes'}</p>
          </div>
        </div>
      )}
      <div className="flex items-start gap-2 p-3 glass-inset rounded-xl">
        <Info className="h-4 w-4 text-brass-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-zinc-400">Live payment processing isn't connected yet — this reflects the real subscription record without charging a card.</p>
      </div>
    </Card>
  );
}

// ============================================================
// USAGE ANALYTICS
// ============================================================
function AdminUsageTab({ workspaceId, memberCount }: { workspaceId?: string; memberCount: number }) {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    getUsageSummary(workspaceId, memberCount).then((u) => { setUsage(u); setLoading(false); }).catch(() => setLoading(false));
  }, [workspaceId, memberCount]);

  if (loading) return <p className="text-xs text-zinc-500 py-6 text-center">Loading usage analytics...</p>;
  if (!usage) return <EmptyState title="No Usage Data" description="Usage analytics will appear once the workspace is active." />;

  const rows = [
    { label: 'Active Members', value: memberCount, limit: usage.limits.maxMembers },
    { label: 'Installed Agents', value: usage.installedAgentsCount, limit: usage.limits.maxInstalledAgents },
    { label: 'Connected Services', value: usage.connectionsCount, limit: usage.limits.maxConnections },
    { label: 'AI Requests (Month)', value: usage.aiRequestsThisMonth, limit: usage.limits.maxAiRequestsPerMonth },
    { label: 'Storage (MB)', value: usage.storageUsedMb, limit: usage.limits.maxStorageMb },
    { label: 'API Calls (Today)', value: usage.apiCallsToday, limit: null },
  ];

  return (
    <Card className="glass-elevated p-6">
      <h3 className="font-display text-base font-semibold text-white mb-4">Workspace Usage Analytics</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {rows.map((r) => (
          <div key={r.label} className="p-4 glass-inset">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">{r.label}</p>
            <p className="font-mono font-tabular text-xl text-white mt-1">{r.value}{r.limit !== null ? ` / ${r.limit}` : ''}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============================================================
// NOTIFICATIONS DASHBOARD (admin oversight)
// ============================================================
function AdminNotificationsTab({ workspaceId }: { workspaceId?: string }) {
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);

  useEffect(() => {
    if (!workspaceId) return;
    const q = query(collection(db, 'notifications'), where('workspaceId', '==', workspaceId), orderBy('createdAt', 'desc'), fsLimit(20));
    const unsub = onSnapshot(q, (snap) => setNotifications(snap.docs.map(d => d.data() as NotificationDoc)));
    return () => unsub();
  }, [workspaceId]);

  const unreadCount = notifications.filter(n => n.unread).length;
  const byCategory = notifications.reduce((acc, n) => { acc[n.category] = (acc[n.category] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <Card className="glass-elevated p-6 space-y-4">
      <h3 className="font-display text-base font-semibold text-white">Notification Dashboard</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 glass-inset">
          <p className="text-[10px] text-zinc-500 uppercase font-bold">Total</p>
          <p className="font-mono text-xl text-white mt-1">{notifications.length}</p>
        </div>
        <div className="p-3 glass-inset">
          <p className="text-[10px] text-zinc-500 uppercase font-bold">Unread</p>
          <p className="font-mono text-xl text-brass-500 mt-1">{unreadCount}</p>
        </div>
        {Object.entries(byCategory).slice(0, 2).map(([cat, count]) => (
          <div key={cat} className="p-3 glass-inset">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">{cat}</p>
            <p className="font-mono text-xl text-white mt-1">{count}</p>
          </div>
        ))}
      </div>
      {notifications.length === 0 ? (
        <EmptyState title="No Notifications" description="Notifications will appear here as they're generated across the workspace." />
      ) : (
        <div className="space-y-2">
          {notifications.slice(0, 10).map((n) => (
            <div key={n.id} className="flex items-center justify-between p-2.5 glass-inset rounded-lg text-xs">
              <span className="text-zinc-300 font-semibold">{n.title}</span>
              <span className="text-zinc-500 font-mono">{new Date(n.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ============================================================
// AUDIT LOG VIEWER (admin-only)
// ============================================================
function AdminAuditLogTab() {
  const [logs, setLogs] = useState<AuditLogDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAuditLogs((list) => { setLogs(list); setLoading(false); });
    return () => unsub();
  }, []);

  return (
    <Card className="glass-elevated p-6">
      <h3 className="font-display text-base font-semibold text-white mb-1">Audit Log</h3>
      <p className="text-xs text-zinc-500 mb-4">Immutable record of sensitive actions — role changes, billing changes, workspace edits. Admin-only.</p>
      {loading ? (
        <p className="text-xs text-zinc-500 py-6 text-center">Loading audit log...</p>
      ) : logs.length === 0 ? (
        <EmptyState title="No Audit Entries" description="Sensitive actions will be recorded here as they happen." />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-900/40 select-none">
              <TableRow className="border-zinc-800/30">
                <TableHead className="text-xs text-zinc-400">Action</TableHead>
                <TableHead className="text-xs text-zinc-400">User</TableHead>
                <TableHead className="text-xs text-zinc-400">Before</TableHead>
                <TableHead className="text-xs text-zinc-400">After</TableHead>
                <TableHead className="text-xs text-zinc-400">IP</TableHead>
                <TableHead className="text-xs text-zinc-400">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="border-zinc-800/20 hover:bg-zinc-900/20">
                  <TableCell className="font-mono text-xs text-white">{log.action}</TableCell>
                  <TableCell className="text-xs text-zinc-400">{log.userName || log.userId}</TableCell>
                  <TableCell className="text-[10px] text-zinc-500 font-mono max-w-[150px] truncate">{log.beforeValue ? JSON.stringify(log.beforeValue) : '—'}</TableCell>
                  <TableCell className="text-[10px] text-zinc-500 font-mono max-w-[150px] truncate">{log.afterValue ? JSON.stringify(log.afterValue) : '—'}</TableCell>
                  <TableCell className="text-[10px] text-zinc-500 font-mono">{log.ip || '—'}</TableCell>
                  <TableCell className="text-[10px] text-zinc-500">{new Date(log.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
