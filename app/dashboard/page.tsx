'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Search, Bell, Menu, X, ChevronRight, 
  LayoutDashboard, ShoppingBag, Cable, CreditCard, 
  Settings, User, HelpCircle, ShieldCheck, LogOut, 
  Play, Square, Trash2, Check, ArrowUpRight, Info, 
  RefreshCcw, Star, Grid, List, SlidersHorizontal, 
  ArrowLeft, MessageSquare, TrendingUp, DollarSign, 
  Megaphone, Users, Video, Image as ImageIcon, Globe, 
  Sparkles, BookOpen, Briefcase, ExternalLink, ArrowRight,
  Heart, AlertCircle
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { TiltCard } from '@/components/ui/TiltCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Progress } from '@/components/ui/Progress';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORIES, PRICING_PLANS } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/services/authService';
import { Loader } from '@/components/ui/Loader';
import type { AgentDoc, InstalledAgentDoc } from '@/types/firestore';
import {
  subscribeToAgents,
  fetchNextAgentsPage,
  fetchAgentById,
  fetchRelatedAgents,
  type AgentsPage,
  type SortOption,
} from '@/services/agentService';
import {
  installAgent as installAgentDoc,
  uninstallAgent as uninstallAgentDoc,
  updateInstalledAgentStatus,
  subscribeToInstalledAgents,
} from '@/services/installService';
import { OAUTH_ERROR_MESSAGES } from '@/types/connections';
import { subscribeToMembers } from '@/services/teamService';
import { subscribeToNotifications, markAllAsRead as markAllNotificationsRead } from '@/services/notificationService';
import {
  addFavorite,
  removeFavorite,
  subscribeToFavorites,
} from '@/services/favoritesService';

// Modular Views
import ConnectionsView from '@/components/views/ConnectionsView';
import BillingView from '@/components/views/BillingView';
import NotificationsView from '@/components/views/NotificationsView';
import SettingsView from '@/components/views/SettingsView';
import ProfileView from '@/components/views/ProfileView';
import HelpCenterView from '@/components/views/HelpCenterView';
import AdminView from '@/components/views/AdminView';

type View = 
  | 'dashboard' 
  | 'marketplace' 
  | 'installed-agents' 
  | 'favorites'
  | 'connections' 
  | 'billing' 
  | 'notifications' 
  | 'settings' 
  | 'profile' 
  | 'help-center' 
  | 'admin';

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, loading: authLoading, isAdmin } = useAuth();

  // Route protection: guests are redirected to Login.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [authLoading, user, router]);
  
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [priceFilter, setPriceFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Popular');
  const [isGridView, setIsGridView] = useState(true);
  const [installedSearchQuery, setInstalledSearchQuery] = useState('');
  const [installedStatusFilter, setInstalledStatusFilter] = useState('All');
  const [installedSortBy, setInstalledSortBy] = useState('Recent');

  // Business owner name and profile info — sourced from the real Firestore
  // user profile once it loads. Falls back to the name typed at signup while
  // the profile document is still being created/fetched.
  const [ownerName, setOwnerName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('temp_signup_name') || '';
    }
    return '';
  });
  const [companyName, setCompanyName] = useState('');

  // Sync local display state once the real Firestore profile loads/changes.
  useEffect(() => {
    if (profile) {
      if (profile.name) setOwnerName(profile.name);
      setCompanyName(profile.company || '');
    }
  }, [profile]);

  const [activePlan, setActivePlan] = useState('Business Growth');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState('Business Growth');

  const workspaceId = profile?.workspaceId || user?.uid || '';

  // ---------- Marketplace (real Firestore, paginated + live first page) ----------
  const [marketplaceAgents, setMarketplaceAgents] = useState<AgentDoc[]>([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(true);
  const [marketplaceError, setMarketplaceError] = useState<string | null>(null);
  const [agentsLastDoc, setAgentsLastDoc] = useState<any>(null);
  const [agentsHasMore, setAgentsHasMore] = useState(false);
  const [loadingMoreAgents, setLoadingMoreAgents] = useState(false);

  // A local cache of agent docs by id, so Installed Agents / Favorites can
  // display agent name/icon/category even if that agent isn't on the current
  // marketplace page.
  const [agentCache, setAgentCache] = useState<Record<string, AgentDoc>>({});

  const sortOptionFromSortBy = (s: string): SortOption => {
    if (s === 'Rating') return 'rating';
    if (s === 'Newest') return 'newest';
    if (s === 'Featured') return 'featured';
    return 'popular';
  };

  useEffect(() => {
    setMarketplaceLoading(true);
    setMarketplaceError(null);
    const filters = {
      category: selectedCategory,
      pricingType: priceFilter as any,
      sort: sortOptionFromSortBy(sortBy),
    };
    const unsub = subscribeToAgents(
      filters,
      (page) => {
        setMarketplaceAgents(page.agents);
        setAgentsLastDoc(page.lastDoc);
        setAgentsHasMore(page.hasMore);
        setMarketplaceLoading(false);
        setAgentCache((prev) => {
          const next = { ...prev };
          page.agents.forEach((a) => { next[a.id] = a; });
          return next;
        });
      },
      (err) => {
        setMarketplaceError(err.message || 'Failed to load the marketplace. Please try again.');
        setMarketplaceLoading(false);
      }
    );
    return () => unsub();
  }, [selectedCategory, priceFilter, sortBy]);

  const handleLoadMoreAgents = async () => {
    if (!agentsLastDoc) return;
    setLoadingMoreAgents(true);
    try {
      const page = await fetchNextAgentsPage(
        { category: selectedCategory, pricingType: priceFilter as any, sort: sortOptionFromSortBy(sortBy) },
        agentsLastDoc
      );
      setMarketplaceAgents((prev) => [...prev, ...page.agents]);
      setAgentsLastDoc(page.lastDoc);
      setAgentsHasMore(page.hasMore);
      setAgentCache((prev) => {
        const next = { ...prev };
        page.agents.forEach((a) => { next[a.id] = a; });
        return next;
      });
    } catch {
      toast('Failed to load more agents', { type: 'error' });
    } finally {
      setLoadingMoreAgents(false);
    }
  };

  // Search + rating filter run client-side over the loaded page(s) —
  // Firestore doesn't support full-text search natively.
  const filteredAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return marketplaceAgents;
    return marketplaceAgents.filter((agent) =>
      agent.name.toLowerCase().includes(q) ||
      agent.shortDescription.toLowerCase().includes(q) ||
      agent.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [marketplaceAgents, searchQuery]);

  // ---------- Team Members (real Firestore, realtime) ----------
  const [teamMembers, setTeamMembers] = useState<import('@/types/workspace').WorkspaceMemberDoc[]>([]);

  useEffect(() => {
    if (!workspaceId) return;
    const unsub = subscribeToMembers(workspaceId, setTeamMembers, () => {});
    return () => unsub();
  }, [workspaceId]);

  // ---------- Favorites (real Firestore, realtime) ----------
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToFavorites(
      user.uid,
      (favs) => setFavoriteIds(favs.map((f) => f.agentId)),
      () => {}
    );
    return () => unsub();
  }, [user]);

  const handleToggleFavorite = async (agentId: string) => {
    if (!user) return;
    try {
      if (favoriteIds.includes(agentId)) {
        await removeFavorite(user.uid, agentId);
      } else {
        await addFavorite(user.uid, agentId);
      }
    } catch {
      toast('Could not update favorites', { type: 'error' });
    }
  };

  // ---------- Installed Agents (real Firestore, realtime) ----------
  const [installedAgents, setInstalledAgents] = useState<InstalledAgentDoc[]>([]);
  const [installedAgentsLoading, setInstalledAgentsLoading] = useState(true);
  const [installingIds, setInstallingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!workspaceId) return;
    setInstalledAgentsLoading(true);
    const unsub = subscribeToInstalledAgents(
      workspaceId,
      (installs) => {
        setInstalledAgents(installs);
        setInstalledAgentsLoading(false);
      },
      () => setInstalledAgentsLoading(false)
    );
    return () => unsub();
  }, [workspaceId]);

  // Fetch full agent docs for any installed/favorited agent not already cached
  // (e.g. loaded on a marketplace page the user never visited).
  useEffect(() => {
    const neededIds = new Set<string>();
    installedAgents.forEach((i) => { if (!agentCache[i.agentId]) neededIds.add(i.agentId); });
    favoriteIds.forEach((id) => { if (!agentCache[id]) neededIds.add(id); });
    if (neededIds.size === 0) return;
    Promise.all(Array.from(neededIds).map((id) => fetchAgentById(id))).then((results) => {
      setAgentCache((prev) => {
        const next = { ...prev };
        results.forEach((a) => { if (a) next[a.id] = a; });
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installedAgents, favoriteIds]);

  const handleToggleAgentStatus = async (installId: string, currentStatus: 'RUNNING' | 'SLEEPING') => {
    const nextStatus = currentStatus === 'RUNNING' ? 'SLEEPING' : 'RUNNING';
    try {
      await updateInstalledAgentStatus(installId, nextStatus);
    } catch {
      toast('Could not update agent status', { type: 'error' });
    }
  };

  const handleInstallAgent = async (agent: AgentDoc) => {
    if (!user || !workspaceId) {
      toast('Please sign in again', { type: 'error' });
      return;
    }
    setInstallingIds((prev) => [...prev, agent.id]);
    try {
      await installAgentDoc({ userId: user.uid, workspaceId, agentId: agent.id, version: agent.version });
      toast('Agent Installed!', {
        description: `${agent.name} is now active in your installed fleet.`,
        type: 'success',
      });
    } catch (err: any) {
      if (err?.message === 'ALREADY_INSTALLED') {
        toast('Already Installed', { description: `${agent.name} is already in your fleet.`, type: 'info' });
      } else {
        toast('Install Failed', { description: 'Please try again.', type: 'error' });
      }
    } finally {
      setInstallingIds((prev) => prev.filter((id) => id !== agent.id));
    }
  };

  const handleUninstallAgent = async (installId: string, agentName: string) => {
    try {
      await uninstallAgentDoc(installId);
      toast('Agent Uninstalled', { description: `${agentName} has been removed from your active fleet.`, type: 'error' });
    } catch {
      toast('Could not uninstall', { type: 'error' });
    }
  };

  // ---------- Agent Details (real Firestore) ----------
  const [selectedAgentDetails, setSelectedAgentDetails] = useState<AgentDoc | null>(null);
  const [selectedAgentLoading, setSelectedAgentLoading] = useState(false);
  const [relatedAgents, setRelatedAgents] = useState<AgentDoc[]>([]);

  useEffect(() => {
    if (!selectedAgentId) {
      setSelectedAgentDetails(null);
      setRelatedAgents([]);
      return;
    }
    // Fast paint from cache, then confirm/refresh from Firestore.
    if (agentCache[selectedAgentId]) setSelectedAgentDetails(agentCache[selectedAgentId]);
    setSelectedAgentLoading(true);
    fetchAgentById(selectedAgentId)
      .then(async (agent) => {
        setSelectedAgentDetails(agent);
        if (agent) {
          setAgentCache((prev) => ({ ...prev, [agent.id]: agent }));
          const related = await fetchRelatedAgents(agent.category, agent.id);
          setRelatedAgents(related);
        }
      })
      .catch(() => toast('Could not load agent details', { type: 'error' }))
      .finally(() => setSelectedAgentLoading(false));
  }, [selectedAgentId]);

  // Renders an agent's uploaded icon image, or a generic fallback if none
  // has been uploaded yet (never fabricate a per-agent icon).
  const renderAgentIcon = (agent: AgentDoc | null, sizeClass = 'h-5 w-5') => {
    if (agent?.icon) {
      return <img src={agent.icon} alt="" className={`${sizeClass} object-contain rounded`} />;
    }
    return <Bot className={`${sizeClass} text-brass-600`} />;
  };

  const formatAgentPrice = (agent: AgentDoc): string => {
    if (agent.pricingType === 'Free') return 'Free';
    if (agent.price === null || agent.price === undefined) return 'Contact for pricing';
    return `${agent.currency ?? ''}${agent.price}${agent.pricingType === 'Subscription' ? '/mo' : ''}`;
  };

  // Activity log — populated from real agent runs once backend integration is live.
  const [activities, setActivities] = useState<{ id: string; text: string; time: string; badge: string; status: string }[]>([]);

  // Notifications — populated from real account events once backend integration is live.
  const [alerts, setAlerts] = useState<import('@/types/firestore').NotificationDoc[]>([]);

  useEffect(() => {
    if (!workspaceId) return;
    const unsub = subscribeToNotifications(
      workspaceId,
      (list) => setAlerts(list),
      () => {}
    );
    return () => unsub();
  }, [workspaceId]);

  const handleLogout = async () => {
    toast('Logging out...', { description: 'Ending your session securely.', type: 'info' });
    try {
      await logoutUser();
    } finally {
      router.push('/');
    }
  };

  // Sidebar Menu Items

  const MENU_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, badge: 'New' },
    { id: 'installed-agents', label: 'Installed Agents', icon: Bot, badge: installedAgents.length > 0 ? installedAgents.length.toString() : undefined },
    { id: 'favorites', label: 'Favorites', icon: Heart, badge: favoriteIds.length > 0 ? favoriteIds.length.toString() : undefined },
    { id: 'connections', label: 'Connections', icon: Cable },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: alerts.filter(a => a.unread).length > 0 ? alerts.filter(a => a.unread).length.toString() : undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'help-center', label: 'Help Center', icon: HelpCircle },
    // RBAC: role comes from the authenticated Firestore user profile.
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: ShieldCheck }] : []),
  ];

  const getBreadcrumbLabel = () => {
    if (selectedAgentId) return 'Marketplace / Agent Details';
    const active = MENU_ITEMS.find(m => m.id === activeView);
    return active ? active.label : 'Dashboard';
  };

  // While Firebase resolves the session, or if we're mid-redirect to Login,
  // show a simple loading state instead of flashing dashboard content.
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-zinc-100 flex relative font-sans">
      
      <Suspense fallback={null}>
        <ConnectionsOAuthParamsHandler onSwitchView={setActiveView} toast={toast} />
      </Suspense>

      {/* Sidebar background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/40 via-zinc-950 to-brass-950/10 pointer-events-none z-0" />

      {/* --- SIDEBAR (DESKTOP) --- */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/8 bg-[#0A0B0F]/90 backdrop-blur-2xl shrink-0 relative z-25 select-none">
        <div className="h-16 flex items-center px-6 border-b border-white/8 justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brass-500 to-brass-700 flex items-center justify-center text-white font-bold text-base shadow-glow-primary">
              N
            </div>
            <span className="font-display text-base font-semibold tracking-tight text-white">
              NexCart AI
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] py-0 font-mono border-brass-600/30 text-brass-500 bg-brass-600/5">{activePlan === 'Business Growth' ? 'Growth' : activePlan}</Badge>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-0.5">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id && !selectedAgentId;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedAgentId(null);
                  setActiveView(item.id as View);
                }}
                className={`relative w-full flex items-center justify-between pl-3.5 pr-3 py-2.5 text-sm font-medium transition-all ${isActive ? 'text-brass-500 bg-brass-500/[0.06]' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'}`}
                id={`sidebar-item-${item.id}`}
              >
                {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-brass-500 rounded-full" />}
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono bg-zinc-800 text-zinc-300 border-none">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Workspace Info at Bottom */}
        <div className="p-4 border-t border-zinc-800/50 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar src={profile?.photoURL || undefined} fallback={ownerName || "U"} size="sm" glow={activePlan === 'Business Growth'} />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-zinc-100 truncate">{ownerName}</p>
              <p className="text-[10px] text-zinc-500 truncate">{companyName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full text-zinc-400 hover:text-red-400 justify-start gap-2 h-9 hover:bg-transparent" onClick={handleLogout} id="sidebar-logout">
            <LogOut className="h-4 w-4" />
            <span>Sign Out Workspace</span>
          </Button>
        </div>
      </aside>

      {/* --- MAIN INTERFACE AREA --- */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 overflow-hidden">
        
        {/* --- TOP HEADER NAVIGATION --- */}
        <header className="h-16 border-b border-white/8 bg-[#0A0B0F]/60 backdrop-blur-2xl flex items-center justify-between px-6 shrink-0 relative z-20 select-none">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-xl border border-zinc-800 text-zinc-400 lg:hidden shrink-0 hover:text-white hover:bg-zinc-900"
              id="mobile-sidebar-toggle"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <Breadcrumb items={[{ label: getBreadcrumbLabel(), active: true }]} />
          </div>

          {/* Right Header Panel */}
          <div className="flex items-center gap-4">
            
            <div className="relative hidden sm:block w-48 md:w-64">
              <Input
                placeholder="Search marketplace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-zinc-400" />}
                className="h-9 pr-8 glass-panel shadow-premium text-zinc-200"
                id="header-search-input"
              />
            </div>

            {/* Notifications Trigger dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white relative bg-zinc-950/50"
                id="notifications-dropdown-trigger"
              >
                <Bell className="h-4 w-4" />
                {alerts.some(a => a.unread) && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brass-600 animate-pulse" />
                )}
              </button>
              
              <AnimatePresence>
                {notificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-4 z-50 text-xs"
                    id="notifications-dropdown-box"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-2">
                      <span className="font-bold text-white">Business Activity Alerts</span>
                      <button 
                        onClick={async () => {
                          try {
                            await markAllNotificationsRead(alerts);
                            toast('Alerts marked as read', { type: 'success' });
                          } catch {
                            toast('Could not update alerts', { type: 'error' });
                          }
                        }} 
                        className="text-[10px] font-semibold text-brass-500 hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="space-y-2.5 max-h-60 overflow-y-auto">
                      {alerts.length === 0 ? (
                        <p className="text-zinc-500 text-[11px] text-center py-6">No notifications yet.</p>
                      ) : alerts.map((al) => (
                        <div key={al.id} className={`p-2 rounded-lg flex flex-col gap-0.5 ${al.unread ? 'bg-brass-600/5' : ''}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-100">{al.title}</span>
                            <span className="text-[9px] text-zinc-500">{new Date(al.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-zinc-400 text-[11px] leading-relaxed">{al.description}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Profile action */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 cursor-pointer focus:outline-none"
                id="user-menu-trigger"
              >
                <Avatar src={profile?.photoURL || undefined} fallback={ownerName || "U"} size="sm" />
              </button>
              
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-1.5 z-50 text-sm"
                    id="user-menu-box"
                  >
                    <div className="px-3 py-2.5 border-b border-zinc-800 mb-1.5">
                      <p className="font-bold text-white truncate">{ownerName}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{profile?.email || user?.email || ''}</p>
                    </div>
                    <button 
                      onClick={() => { setActiveView('profile'); setUserMenuOpen(false); }} 
                      className="w-full text-left px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all flex items-center gap-2"
                    >
                      <User className="h-4 w-4 text-brass-500" /> My Workspace Profile
                    </button>
                    <button 
                      onClick={() => { setActiveView('settings'); setUserMenuOpen(false); }} 
                      className="w-full text-left px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4 text-brass-500" /> Workspace Settings
                    </button>
                    <div className="h-px bg-zinc-800 my-1.5" />
                    <button 
                      onClick={handleLogout} 
                      className="w-full text-left px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/5 transition-all flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out Workspace
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* --- MAIN PAGE VIEW CONTENT --- */}
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          
          {/* ======================================= */}
          {/* VIEW: OVERVIEW DASHBOARD */}
          {/* ======================================= */}
          {activeView === 'dashboard' && !selectedAgentId && (
            <div className="space-y-6">
              
              {/* Bento Welcome Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <Card className="lg:col-span-2 bg-gradient-to-br from-brass-950/40 via-brass-900/10 to-transparent border-brass-600/20 relative overflow-hidden p-6" id="dashboard-welcome-card">
                  <div className="absolute top-0 right-0 h-48 w-48 bg-brass-700/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <Badge className="bg-brass-600/10 text-brass-500 border border-brass-600/20 mb-3 text-[10px] font-mono uppercase tracking-wider">Workforce Running</Badge>
                      <h2 className="font-display text-2xl sm:text-3xl font-medium text-white tracking-tight">
                        Welcome back, {ownerName}!
                      </h2>
                      <p className="text-zinc-400 text-sm mt-2 leading-relaxed max-w-xl">
                        Your autonomous business agents are running smoothly. In the last 24 hours, they have successfully resolved <span className="text-brass-500 font-bold"> Shopify refund requests</span>, published <span className="text-brass-500 font-bold">1 organic SEO post</span>, and tracked transactions.
                      </p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button variant="primary" className="bg-brass-700 hover:bg-brass-600 shadow-lg shadow-brass-700/10" onClick={() => setActiveView('marketplace')}>
                        <ShoppingBag className="h-4 w-4 mr-2" /> Browse AI Marketplace
                      </Button>
                      <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900" onClick={() => setActiveView('installed-agents')}>
                        <Bot className="h-4 w-4 mr-2" /> View Installed Fleet ({installedAgents.length})
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Subscription Overview Card */}
                <Card className="glass-panel shadow-premium/80 p-6 flex flex-col justify-between" id="dashboard-subscription-card">
                  <div>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Subscription Plan</span>
                    <h3 className="text-xl font-bold text-white mt-1">{activePlan}</h3>
                    <p className="text-xs text-zinc-400 mt-2">Perfect for automated bookkeeping, copywriting, and multi-channel customer success.</p>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-400">Monthly Usage (Completed Tasks)</span>
                        <span className="text-zinc-200">1,420 / 50,000 runs</span>
                      </div>
                      <Progress value={2.8} color="brass" />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-6 border-brass-600/30 text-brass-500 hover:bg-brass-600/5" onClick={() => { setSelectedPlanToUpgrade('Business Growth'); setIsUpgradeModalOpen(true); }}>
                    Manage Plan
                  </Button>
                </Card>

              </div>

              {/* Registry Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/70 border border-zinc-800/70">

                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Installed Fleet</p>
                    <Bot className="h-3.5 w-3.5 text-brass-500" />
                  </div>
                  <h3 className="font-mono font-tabular text-3xl font-medium text-white mt-2">{installedAgents.length}</h3>
                  <p className="text-[11px] text-pine-400 mt-2 font-mono">{installedAgents.filter(a => a.status === 'RUNNING').length} active</p>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Leads Captured</p>
                    <TrendingUp className="h-3.5 w-3.5 text-pine-400" />
                  </div>
                  <h3 className="font-mono font-tabular text-3xl font-medium text-white mt-2">—</h3>
                  <p className="text-[11px] text-zinc-500 mt-2 font-mono">No data yet</p>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Satisfaction</p>
                    <MessageSquare className="h-3.5 w-3.5 text-brass-400" />
                  </div>
                  <h3 className="font-mono font-tabular text-3xl font-medium text-white mt-2">—</h3>
                  <p className="text-[11px] text-zinc-500 mt-2 font-mono">No conversations yet</p>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Connections</p>
                    <Cable className="h-3.5 w-3.5 text-brass-300" />
                  </div>
                  <h3 className="font-mono font-tabular text-3xl font-medium text-white mt-2">0</h3>
                  <p className="text-[11px] text-zinc-500 mt-2 font-mono truncate">No connections yet</p>
                </div>

              </div>


              {/* Dashboard Content Row (Installed Agents + Live Activities + Business Tips) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Installed Agents Widget */}
                <Card className="lg:col-span-2 glass-panel shadow-premium-sm/60" id="dashboard-installed-widget">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-base font-bold text-white">Active Workforce</CardTitle>
                      <CardDescription className="text-xs text-zinc-400">Instantly activate, sleep, or configure your deployed team.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-300" onClick={() => setActiveView('installed-agents')}>
                      Manage Fleet
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="border-zinc-800/40 bg-zinc-900/30">
                        <TableRow className="border-zinc-800/40">
                          <TableHead className="text-zinc-400 text-xs">Agent Name</TableHead>
                          <TableHead className="text-zinc-400 text-xs">Category</TableHead>
                          <TableHead className="text-zinc-400 text-xs">Status</TableHead>
                          <TableHead className="text-zinc-400 text-xs text-right">Quick Control</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {installedAgents.length === 0 ? (
                          <TableRow className="border-zinc-800/20 hover:bg-transparent">
                            <TableCell colSpan={4} className="p-0">
                              <EmptyState
                                title="No Agents Installed"
                                description="Deploy an agent from the marketplace to start automating your business."
                                actionLabel="Browse Marketplace"
                                onAction={() => setActiveView('marketplace')}
                                className="border-none bg-transparent rounded-none"
                              />
                            </TableCell>
                          </TableRow>
                        ) : installedAgents.map((inst) => {
                          const ag = agentCache[inst.agentId];
                          return (
                          <TableRow key={inst.id} className="border-zinc-800/20 hover:bg-zinc-900/20">
                            <TableCell className="font-bold text-zinc-200 flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-zinc-800/50 flex items-center justify-center shrink-0">
                                {renderAgentIcon(ag, 'h-3.5 w-3.5')}
                              </div>
                              {ag?.name || 'Loading…'}
                            </TableCell>
                            <TableCell className="text-zinc-400 text-xs font-medium">{ag?.category || ''}</TableCell>
                            <TableCell>
                              <Badge className={inst.status === 'RUNNING' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-800'}>
                                {inst.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost"
                                size="sm"
                                className="h-8 hover:bg-brass-700/10 text-brass-500 hover:text-brass-300 rounded-lg gap-1.5"
                                onClick={() => handleToggleAgentStatus(inst.id, inst.status)}
                              >
                                {inst.status === 'RUNNING' ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
                                {inst.status === 'RUNNING' ? 'Pause' : 'Activate'}
                              </Button>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Business Tips & Actions */}
                <div className="space-y-6">
                  
                  {/* Quick Actions Bento Card */}
                  <Card className="glass-panel shadow-premium/80 p-5">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="justify-start border-zinc-800 text-zinc-300 hover:bg-zinc-900 h-9" onClick={() => setActiveView('marketplace')}>
                        <ShoppingBag className="h-3.5 w-3.5 mr-2 text-brass-500" /> + Add Agent
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start border-zinc-800 text-zinc-300 hover:bg-zinc-900 h-9" onClick={() => setActiveView('connections')}>
                        <Cable className="h-3.5 w-3.5 mr-2 text-brass-500" /> Connect Tools
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start border-zinc-800 text-zinc-300 hover:bg-zinc-900 h-9" onClick={() => setActiveView('billing')}>
                        <CreditCard className="h-3.5 w-3.5 mr-2 text-brass-500" /> View Invoice
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start border-zinc-800 text-zinc-300 hover:bg-zinc-900 h-9" onClick={() => setActiveView('help-center')}>
                        <BookOpen className="h-3.5 w-3.5 mr-2 text-brass-500" /> Help Center
                      </Button>
                    </div>
                  </Card>

                  {/* Business Tips */}
                  <Card className="bg-brass-950/20 border-brass-600/15 p-5">
                    <div className="flex items-center gap-2 mb-2 text-brass-500">
                      <Sparkles className="h-4.5 w-4.5" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Automate & Scale Tip</h4>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Tip: Connect your business tools and deploy your first agent to start automating repetitive tasks like support replies, bookkeeping, or lead follow-ups.
                    </p>
                  </Card>

                </div>

              </div>

              {/* Recent Activity Feed */}
              <Card className="bg-zinc-950/60 border-zinc-800/60 p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base font-bold text-white">Live Workforce Activity Log</CardTitle>
                  <CardDescription className="text-xs text-zinc-400">Chronological history of tasks completed by your active business agents.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-3.5">
                  {activities.length === 0 ? (
                    <EmptyState
                      title="No Activity"
                      description="Task history from your active agents will appear here once they start running."
                      className="border-none bg-transparent p-4"
                    />
                  ) : activities.map((act) => (
                    <div key={act.id} className="flex items-center justify-between py-2 border-b border-zinc-800/20 last:border-0 hover:bg-zinc-900/10 rounded-lg px-2">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-brass-600/10 text-brass-500 border border-brass-600/20 text-[10px] uppercase font-bold py-0.5 px-2">
                          {act.badge}
                        </Badge>
                        <p className="text-xs font-semibold text-zinc-200">{act.text}</p>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{act.time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

            </div>
          )}

          {/* ======================================= */}
          {/* VIEW: MARKETPLACE HUB */}
          {/* ======================================= */}
          {activeView === 'marketplace' && !selectedAgentId && (
            <div className="space-y-6">
              
              {/* Marketplace Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">AI Agent Marketplace</h2>
                  <p className="text-sm text-zinc-400 mt-1">Hire autonomous virtual specialists to automate support, design, sales, marketing, and copywriting.</p>
                </div>
                
                {/* Search / Sort controls */}
                <div className="flex flex-wrap gap-2.5 items-center w-full sm:w-auto">
                  <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl p-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-7 px-2 rounded-lg ${isGridView ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                      onClick={() => setIsGridView(true)}
                      id="marketplace-grid-view-btn"
                    >
                      <Grid className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-7 px-2 rounded-lg ${!isGridView ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                      onClick={() => setIsGridView(false)}
                      id="marketplace-list-view-btn"
                    >
                      <List className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-9 px-3 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-brass-600 shrink-0 font-medium"
                    id="marketplace-sort-select"
                  >
                    <option value="Popular">Sort: Popular</option>
                    <option value="Rating">Sort: Rating</option>
                    <option value="Newest">Sort: Newest</option>
                    <option value="Featured">Sort: Featured</option>
                  </select>

                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="h-9 px-3 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-brass-600 shrink-0 font-medium"
                    id="marketplace-price-select"
                  >
                    <option value="All">Price: All</option>
                    <option value="Free">Price: Free</option>
                    <option value="Subscription">Price: Subscription</option>
                    <option value="Usage-based">Price: Usage-based</option>
                  </select>
                </div>
              </div>

              {/* Horizontal Category Pills */}
              <div className="overflow-x-auto py-1 scrollbar-none flex items-center gap-2 select-none border-b border-zinc-800/30 pb-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${cat === selectedCategory ? 'bg-brass-700 border-brass-600 text-white shadow-lg shadow-brass-700/10' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Loading state */}
              {marketplaceLoading && marketplaceAgents.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="glass-panel rounded-2xl overflow-hidden h-[430px] flex flex-col">
                      <Skeleton className="h-36 w-full rounded-none" />
                      <div className="p-5 space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <Skeleton variant="circle" className="h-11 w-11" />
                          <div className="space-y-2 flex-1">
                            <Skeleton variant="text" className="w-2/3" />
                            <Skeleton variant="text" className="w-1/3 h-3" />
                          </div>
                        </div>
                        <Skeleton variant="text" className="w-full" />
                        <Skeleton variant="text" className="w-4/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : marketplaceError ? (
                /* Error state */
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <p className="text-sm text-zinc-300 font-semibold">{marketplaceError}</p>
                  <Button variant="outline" size="sm" className="border-zinc-800" onClick={() => setSelectedCategory((c) => c)}>
                    <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> Retry
                  </Button>
                </div>
              ) : filteredAgents.length === 0 ? (
                /* Empty state if nothing matches */
                <EmptyState
                  title="No Agents Available"
                  description="We couldn't find any business agents matching those filters. Try a broader search."
                  actionLabel="Reset Filters"
                  onAction={() => {
                    setSearchQuery('');
                    setSelectedCategory('All Categories');
                    setPriceFilter('All');
                  }}
                />
              ) : (
                <>
                  {/* Grid vs List View conditional */}
                  <div className={isGridView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                    <AnimatePresence mode="popLayout">
                    {filteredAgents.map((agent) => {
                      const isInstalled = installedAgents.some((a) => a.agentId === agent.id);
                      const isInstalling = installingIds.includes(agent.id);
                      const isFavorite = favoriteIds.includes(agent.id);
                      
                      return (
                        <motion.div
                          key={agent.id}
                          layout
                          initial={{ opacity: 0, scale: 0.94 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.94 }}
                          transition={{ duration: 0.25 }}
                        >
                        <TiltCard maxTilt={5}>
                        <Card 
                          hoverEffect 
                          id={`market-agent-card-${agent.id}`} 
                          className={`glass-panel shadow-premium overflow-hidden flex flex-col justify-between ${!isGridView ? 'flex-row items-center p-4' : 'h-[430px]'}`}
                        >
                          {/* Cover image & Floating badge (for Grid View) */}
                          {isGridView && (
                            <div className="h-36 relative w-full overflow-hidden border-b border-zinc-800/40 shrink-0 bg-zinc-900">
                              {agent.coverImage && (
                                <Image 
                                  src={agent.coverImage} 
                                  alt={agent.name} 
                                  fill
                                  className="object-cover brightness-90 hover:scale-105 transition-all duration-500" 
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              {agent.featured && (
                                <Badge className="absolute top-3 right-3 bg-brass-600 text-white font-bold text-[9px] border-none">
                                  Featured
                                </Badge>
                              )}
                              <button
                                onClick={() => handleToggleFavorite(agent.id)}
                                className="absolute top-3 left-3 h-7 w-7 rounded-full bg-zinc-950/70 flex items-center justify-center text-white hover:scale-105 transition-transform"
                                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                id={`favorite-btn-${agent.id}`}
                              >
                                <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-brass-500 text-brass-500' : 'text-white'}`} />
                              </button>
                            </div>
                          )}

                          {/* Card body */}
                          <div className={`p-5 flex-1 flex flex-col justify-between ${!isGridView ? 'p-1' : ''}`}>
                            
                            <div>
                              {/* Logo + Name block */}
                              <div className="flex items-start gap-3.5 select-none mb-3">
                                <div className="relative h-11 w-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                                  {renderAgentIcon(agent)}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="flex items-center gap-1">
                                    <h3 className="font-extrabold text-zinc-100 truncate text-sm sm:text-base leading-tight hover:text-brass-500 cursor-pointer" onClick={() => setSelectedAgentId(agent.id)}>
                                      {agent.name}
                                    </h3>
                                  </div>
                                  <span className="text-[10px] text-brass-500 font-bold bg-brass-600/5 px-2 py-0.5 rounded-full border border-brass-600/15 mt-1 inline-block">
                                    {agent.category}
                                  </span>
                                </div>
                              </div>

                              <CardDescription className="text-zinc-400 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                                {agent.shortDescription}
                              </CardDescription>
                            </div>

                            {/* Stats footer (Rating, Installs, Price, Install trigger) */}
                            <div className="mt-5">
                              <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 pb-3.5 border-b border-zinc-800/40 mb-3.5">
                                <div className="flex items-center gap-1 text-zinc-300">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 border-none" />
                                  <span>{agent.rating || 0}</span>
                                </div>
                                <div>{agent.downloads || 0} installs</div>
                              </div>

                              <div className="flex items-center justify-between select-none">
                                <div>
                                  <span className="text-zinc-500 text-[10px] block uppercase font-bold leading-none mb-1">Pricing</span>
                                  <span className="text-sm font-extrabold text-white">{formatAgentPrice(agent)}</span>
                                </div>

                                <div className="flex gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-9 px-2 text-brass-500 hover:bg-brass-600/5 hover:text-brass-300"
                                    onClick={() => setSelectedAgentId(agent.id)}
                                  >
                                    Details
                                  </Button>

                                  {isInstalled ? (
                                    <Button variant="outline" size="sm" className="h-9 border-zinc-800 text-zinc-400 hover:bg-transparent" disabled>
                                      Installed ✓
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="primary" 
                                      size="sm" 
                                      className="h-9 bg-brass-700 hover:bg-brass-600 text-white font-semibold text-xs shadow-md shadow-brass-700/10 px-3.5"
                                      isLoading={isInstalling}
                                      onClick={() => handleInstallAgent(agent)}
                                      id={`install-btn-${agent.id}`}
                                    >
                                      {isInstalling ? 'Installing...' : 'Deploy'}
                                    </Button>
                                  )}
                                </div>
                              </div>

                            </div>

                          </div>
                        </Card>
                        </TiltCard>
                        </motion.div>
                      );
                    })}
                    </AnimatePresence>
                  </div>

                  {/* Pagination */}
                  {agentsHasMore && !searchQuery && (
                    <div className="flex justify-center pt-2">
                      <Button 
                        variant="outline" 
                        className="border-zinc-800 text-zinc-300"
                        isLoading={loadingMoreAgents}
                        onClick={handleLoadMoreAgents}
                        id="marketplace-load-more-btn"
                      >
                        Load More Agents
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ======================================= */}
          {/* VIEW: AGENT DETAILS PAGE */}
          {/* ======================================= */}
          {selectedAgentId && selectedAgentLoading && !selectedAgentDetails && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader size="lg" />
              <p className="text-xs text-zinc-500">Loading agent details...</p>
            </div>
          )}

          {selectedAgentId && !selectedAgentLoading && !selectedAgentDetails && (
            <div className="space-y-6">
              <button 
                onClick={() => setSelectedAgentId(null)} 
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold select-none group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Marketplace Hub
              </button>
              <EmptyState title="Agent Not Found" description="This agent may have been removed or is no longer published." />
            </div>
          )}

          {selectedAgentId && selectedAgentDetails && (
            <div className="space-y-6">
              
              {/* Back to Marketplace Button */}
              <button 
                onClick={() => setSelectedAgentId(null)} 
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold select-none group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Marketplace Hub
              </button>

              {/* Cover Banner Card */}
              <div className="relative h-60 w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                {selectedAgentDetails.coverImage && (
                  <Image 
                    src={selectedAgentDetails.coverImage} 
                    alt={selectedAgentDetails.name} 
                    fill
                    className="object-cover brightness-50"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                
                {/* Floating identity content */}
                <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-brass-500 shadow-2xl">
                      {renderAgentIcon(selectedAgentDetails, 'h-7 w-7')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-black text-white">{selectedAgentDetails.name}</h2>
                        {selectedAgentDetails.featured && (
                          <Badge className="bg-brass-700 text-white text-[9px] py-0 border-none font-bold">Featured</Badge>
                        )}
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] py-0 font-bold capitalize">
                          {selectedAgentDetails.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1">Published by <span className="font-semibold text-brass-500">{selectedAgentDetails.developer}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleFavorite(selectedAgentDetails.id)}
                      className="h-9 w-9 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center hover:scale-105 transition-transform"
                      title={favoriteIds.includes(selectedAgentDetails.id) ? 'Remove from favorites' : 'Add to favorites'}
                      id="agent-details-favorite-btn"
                    >
                      <Heart className={`h-4 w-4 ${favoriteIds.includes(selectedAgentDetails.id) ? 'fill-brass-500 text-brass-500' : 'text-zinc-300'}`} />
                    </button>
                    <Badge className="bg-zinc-800 text-zinc-300 border-none px-2.5 py-1 text-xs">⭐ {selectedAgentDetails.rating || 0} Rating</Badge>
                    <Badge className="bg-zinc-800 text-zinc-300 border-none px-2.5 py-1 text-xs">{selectedAgentDetails.downloads || 0} Downloads</Badge>
                  </div>
                </div>
              </div>

              {/* Core Details Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Left Column details */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Detailed summary */}
                  <Card className="glass-panel shadow-premium-sm p-6">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Overview Description</h3>
                    <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                      {selectedAgentDetails.description}
                    </p>
                    {selectedAgentDetails.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {selectedAgentDetails.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-full px-2.5 py-1">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Core Features */}
                  {selectedAgentDetails.features.length > 0 && (
                    <Card className="glass-panel shadow-premium-sm p-6">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Capabilities & Key Features</h3>
                      <ul className="space-y-3">
                        {selectedAgentDetails.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300">
                            <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Screenshots */}
                  {selectedAgentDetails.screenshots.length > 0 && (
                    <Card className="glass-panel shadow-premium-sm p-6">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Screenshots & Dashboard Preview</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedAgentDetails.screenshots.map((src, i) => (
                          <div key={i} className="rounded-xl overflow-hidden border border-zinc-800 h-40 relative">
                            <Image src={src} alt="Preview screenshot" fill className="object-cover brightness-90 hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Reviews */}
                  <Card className="glass-panel shadow-premium-sm p-6">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 font-sans">Verified Reviews ({selectedAgentDetails.reviews.length})</h3>
                    {selectedAgentDetails.reviews.length === 0 ? (
                      <p className="text-xs text-zinc-500">No reviews yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {selectedAgentDetails.reviews.map((rev) => (
                          <div key={rev.id} className="p-4 rounded-xl glass-inset flex flex-col justify-between gap-2">
                            <div className="flex justify-between items-start">
                              <p className="font-extrabold text-xs sm:text-sm text-zinc-100">{rev.userName}</p>
                              <div className="flex items-center gap-0.5 text-xs text-amber-400 font-bold">
                                <Star className="h-3 w-3 fill-amber-400 border-none" /> {rev.rating}.0
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-zinc-300 italic leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
                            <span className="text-[10px] text-zinc-500 font-mono mt-1 text-right block">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Related Agents */}
                  {relatedAgents.length > 0 && (
                    <Card className="glass-panel shadow-premium-sm p-6">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Related Agents</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {relatedAgents.map((rel) => (
                          <button
                            key={rel.id}
                            onClick={() => setSelectedAgentId(rel.id)}
                            className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-brass-600/40 transition-colors text-left"
                            id={`related-agent-${rel.id}`}
                          >
                            <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                              {renderAgentIcon(rel, 'h-4 w-4')}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-zinc-100 truncate">{rel.name}</p>
                              <p className="text-[10px] text-zinc-500 truncate">{rel.category}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </Card>
                  )}

                </div>

                {/* Right Metadata Column details */}
                <div className="space-y-6">
                  
                  {/* Pricing / Install Action box */}
                  <Card className="bg-brass-950/10 border-brass-600/20 p-6 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Pricing Plan</span>
                      <h4 className="text-xl font-black text-white mt-1">{formatAgentPrice(selectedAgentDetails)}</h4>
                    </div>

                    <div className="mt-6 space-y-2">
                      {installedAgents.some(a => a.agentId === selectedAgentDetails.id) ? (
                        <Button variant="outline" className="w-full border-zinc-800 text-zinc-400" disabled>
                          Already Deployed
                        </Button>
                      ) : (
                        <Button 
                          variant="primary" 
                          className="w-full bg-brass-700 hover:bg-brass-600 text-white font-bold"
                          isLoading={installingIds.includes(selectedAgentDetails.id)}
                          onClick={() => handleInstallAgent(selectedAgentDetails)}
                          id="agent-details-install-btn"
                        >
                          {installingIds.includes(selectedAgentDetails.id) ? 'Installing...' : 'Deploy to Workspace'}
                        </Button>
                      )}
                    </div>
                  </Card>

                  {/* Requirements Box */}
                  {selectedAgentDetails.requirements.length > 0 && (
                    <Card className="glass-panel shadow-premium p-6">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Requirements</h3>
                      <ul className="space-y-2">
                        {selectedAgentDetails.requirements.map((req, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                            <div className="h-1.5 w-1.5 rounded-full bg-brass-600" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Meta facts */}
                  <Card className="glass-panel shadow-premium p-6 space-y-3.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-bold uppercase">Version</span>
                      <span className="font-mono text-zinc-300 font-semibold">{selectedAgentDetails.version}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-bold uppercase">Last Updated</span>
                      <span className="text-zinc-300 font-semibold">{new Date(selectedAgentDetails.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </Card>

                </div>

              </div>

            </div>
          )}

          {/* ======================================= */}
          {/* VIEW: INSTALLED AGENTS FULL PAGE */}
          {/* ======================================= */}
          {activeView === 'installed-agents' && !selectedAgentId && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans">Your Installed AI Fleet</h2>
                  <p className="text-sm text-zinc-400 mt-1">Audit, activate, sleep, or completely remove autonomous agents inside your workspace.</p>
                </div>

                {installedAgents.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 items-center w-full sm:w-auto">
                    <Input
                      placeholder="Search installed agents..."
                      value={installedSearchQuery}
                      onChange={(e) => setInstalledSearchQuery(e.target.value)}
                      leftIcon={<Search className="h-3.5 w-3.5" />}
                      className="h-9 bg-zinc-950 border-zinc-800 text-zinc-200 w-full sm:w-52"
                      id="installed-search-input"
                    />
                    <select
                      value={installedStatusFilter}
                      onChange={(e) => setInstalledStatusFilter(e.target.value)}
                      className="h-9 px-3 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-brass-600 shrink-0 font-medium"
                      id="installed-status-filter"
                    >
                      <option value="All">Status: All</option>
                      <option value="RUNNING">Status: Running</option>
                      <option value="SLEEPING">Status: Sleeping</option>
                    </select>
                    <select
                      value={installedSortBy}
                      onChange={(e) => setInstalledSortBy(e.target.value)}
                      className="h-9 px-3 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-brass-600 shrink-0 font-medium"
                      id="installed-sort-select"
                    >
                      <option value="Recent">Sort: Recently Installed</option>
                      <option value="Name">Sort: Name</option>
                    </select>
                  </div>
                )}
              </div>

              {installedAgentsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader size="lg" />
                  <p className="text-xs text-zinc-500">Loading your installed agents...</p>
                </div>
              ) : installedAgents.length === 0 ? (
                <EmptyState
                  title="No Installed Agents"
                  description="Your business workspace does not have any active AI staff. Explore the marketplace to hire virtual support, sales, content, or bookkeeping operators."
                  actionLabel="Go to Marketplace"
                  onAction={() => setActiveView('marketplace')}
                />
              ) : (() => {
                const joined = installedAgents
                  .map((inst) => ({ inst, agent: agentCache[inst.agentId] || null }))
                  .filter(({ inst, agent }) => {
                    if (installedStatusFilter !== 'All' && inst.status !== installedStatusFilter) return false;
                    if (installedSearchQuery.trim()) {
                      const q = installedSearchQuery.toLowerCase();
                      if (!agent || !agent.name.toLowerCase().includes(q)) return false;
                    }
                    return true;
                  })
                  .sort((a, b) => {
                    if (installedSortBy === 'Name') return (a.agent?.name || '').localeCompare(b.agent?.name || '');
                    return new Date(b.inst.installedAt).getTime() - new Date(a.inst.installedAt).getTime();
                  });

                if (joined.length === 0) {
                  return (
                    <EmptyState
                      title="No Matching Agents"
                      description="No installed agents match your search or filter."
                      actionLabel="Reset"
                      onAction={() => { setInstalledSearchQuery(''); setInstalledStatusFilter('All'); }}
                    />
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {joined.map(({ inst, agent }) => (
                      <Card key={inst.id} className="glass-panel shadow-premium p-6 relative" id={`installed-card-${inst.id}`}>
                        
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                              {renderAgentIcon(agent)}
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold text-white leading-tight">{agent?.name || 'Loading…'}</h3>
                              <p className="text-[10px] text-brass-500 font-bold mt-1 uppercase">{agent?.category || ''}</p>
                            </div>
                          </div>
                          <Badge className={inst.status === 'RUNNING' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-800'}>
                            {inst.status}
                          </Badge>
                        </div>

                        <p className="text-xs text-zinc-400 mb-4 leading-relaxed line-clamp-2">
                          {agent?.shortDescription}
                        </p>

                        <div className="space-y-2.5 font-sans pb-4 border-b border-zinc-800/40 text-xs text-zinc-400">
                          <div className="flex justify-between font-semibold">
                            <span>Status</span>
                            <span className={inst.status === 'RUNNING' ? 'text-emerald-400' : 'text-zinc-500'}>
                              {inst.status === 'RUNNING' ? 'Active & monitoring events' : 'Paused'}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Installed Date</span>
                            <span className="text-zinc-300">{new Date(inst.installedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Version</span>
                            <span className="font-mono text-zinc-300">{inst.version}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              variant="secondary" 
                              size="sm"
                              className="h-9 py-0 font-bold text-xs bg-zinc-800 hover:bg-[#323235] text-zinc-200 border-none px-3"
                              onClick={() => handleToggleAgentStatus(inst.id, inst.status)}
                              id={`toggle-status-btn-${inst.id}`}
                            >
                              {inst.status === 'RUNNING' ? <Square className="h-3 w-3 mr-1.5 fill-current" /> : <Play className="h-3 w-3 mr-1.5 fill-current" />}
                              {inst.status === 'RUNNING' ? 'Pause Agent' : 'Activate Agent'}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-9 py-0 font-bold text-xs text-zinc-300 hover:text-white px-3"
                              onClick={() => toast(`${agent?.name || 'Agent'} is ${inst.status === 'RUNNING' ? 'running' : 'sleeping'}`, { description: 'Live execution features are coming soon.', type: 'info' })}
                              id={`launch-btn-${inst.id}`}
                            >
                              <ExternalLink className="h-3 w-3 mr-1.5" /> Launch
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-9 py-0 font-bold text-xs text-zinc-300 hover:text-white px-3"
                              onClick={() => setSelectedAgentId(inst.agentId)}
                              id={`configure-btn-${inst.id}`}
                            >
                              <Settings className="h-3 w-3 mr-1.5" /> Configure
                            </Button>
                          </div>

                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-9 py-0 text-red-400 hover:text-red-300 hover:bg-red-500/5 px-2"
                            onClick={() => handleUninstallAgent(inst.id, agent?.name || 'Agent')}
                            id={`uninstall-btn-${inst.id}`}
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        </div>

                      </Card>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ======================================= */}
          {/* VIEW: FAVORITES FULL PAGE */}
          {/* ======================================= */}
          {activeView === 'favorites' && !selectedAgentId && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans">Favorites</h2>
                <p className="text-sm text-zinc-400 mt-1">Agents you've saved for later.</p>
              </div>

              {favoriteIds.length === 0 ? (
                <EmptyState
                  title="No Favorites Yet"
                  description="Tap the heart icon on any agent in the marketplace to save it here."
                  actionLabel="Go to Marketplace"
                  onAction={() => setActiveView('marketplace')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteIds.map((agentId) => {
                    const agent = agentCache[agentId];
                    const isInstalled = installedAgents.some((a) => a.agentId === agentId);
                    return (
                      <Card key={agentId} className="glass-panel shadow-premium p-5" id={`favorite-card-${agentId}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                              {renderAgentIcon(agent)}
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-white cursor-pointer hover:text-brass-500" onClick={() => setSelectedAgentId(agentId)}>
                                {agent?.name || 'Loading…'}
                              </h3>
                              <p className="text-[10px] text-brass-500 font-bold uppercase mt-1">{agent?.category || ''}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleFavorite(agentId)}
                            className="text-brass-500 hover:scale-110 transition-transform"
                            id={`unfavorite-btn-${agentId}`}
                          >
                            <Heart className="h-4 w-4 fill-brass-500" />
                          </button>
                        </div>
                        <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{agent?.shortDescription}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{agent ? formatAgentPrice(agent) : ''}</span>
                          {isInstalled ? (
                            <Button variant="outline" size="sm" className="h-8 border-zinc-800 text-zinc-400" disabled>Installed ✓</Button>
                          ) : (
                            <Button 
                              variant="primary" 
                              size="sm" 
                              className="h-8 bg-brass-700 hover:bg-brass-600 text-white text-xs"
                              isLoading={agent ? installingIds.includes(agent.id) : false}
                              onClick={() => agent && handleInstallAgent(agent)}
                              id={`favorite-install-btn-${agentId}`}
                            >
                              Deploy
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================= */}
          {/* MODULAR SUBVIEWS */}
          {/* ======================================= */}
          {activeView === 'connections' && !selectedAgentId && (
            <ConnectionsView toast={toast} workspaceId={workspaceId} />
          )}

          {activeView === 'billing' && !selectedAgentId && (
            <BillingView toast={toast} workspaceId={workspaceId} userId={user?.uid || ''} userName={ownerName} memberCount={teamMembers.filter(m => m.status === 'active').length + 1} />
          )}

          {activeView === 'notifications' && !selectedAgentId && (
            <NotificationsView toast={toast} workspaceId={workspaceId} />
          )}

          {activeView === 'settings' && !selectedAgentId && (
            <SettingsView toast={toast} />
          )}

          {activeView === 'profile' && !selectedAgentId && (
            <ProfileView 
              ownerName={ownerName} 
              setOwnerName={setOwnerName} 
              companyName={companyName} 
              setCompanyName={setCompanyName} 
              email={profile?.email || user?.email || ''}
              photoURL={profile?.photoURL || ''}
              role={profile?.role || 'user'}
              subscription={profile?.subscription || 'free'}
              joinedDate={profile?.createdAt || ''}
              uid={user?.uid || ''}
              toast={toast} 
            />
          )}

          {activeView === 'help-center' && !selectedAgentId && (
            <HelpCenterView toast={toast} />
          )}

          {activeView === 'admin' && !selectedAgentId && isAdmin && (
            <AdminView toast={toast} ownerName={ownerName} ownerEmail={profile?.email || user?.email || ''} companyName={companyName} workspaceId={workspaceId} userId={user?.uid} />
          )}

        </main>
      </div>

      {/* --- SIDEBAR DRAWER (MOBILE) --- */}
      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="NexCart AI"
        description="Business AI Agent Workspace Navigation."
        side="left"
        size="sm"
      >
        <div className="flex flex-col h-full justify-between bg-zinc-950 text-zinc-100 p-4 select-none">
          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id && !selectedAgentId;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedAgentId(null);
                    setActiveView(item.id as View);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-brass-700/10 text-brass-500 border border-brass-600/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'}`}
                  id={`mobile-sidebar-item-${item.id}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-zinc-800 text-zinc-300 border-none">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
          
          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-3 font-sans">
            <div className="flex items-center gap-3">
              <Avatar src={profile?.photoURL || undefined} fallback={ownerName || "U"} size="sm" />
              <div>
                <p className="text-xs font-bold text-white">{ownerName}</p>
                <p className="text-[10px] text-zinc-500">{companyName}</p>
              </div>
            </div>
            <Button variant="ghost" className="text-zinc-400 hover:text-red-400 justify-start gap-2 h-9 text-xs" onClick={handleLogout} id="mobile-sidebar-logout">
              <LogOut className="h-4 w-4" />
              <span>Sign Out Session</span>
            </Button>
          </div>
        </div>
      </Drawer>

      {/* --- UPGRADE LICENSE MODAL --- */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Modify Subscription Tier"
        description="Upgrade your automated workforce capacity to unlock higher run capacities and team collaboration."
        size="md"
      >
        <div className="space-y-4 font-sans text-zinc-200">
          <p className="text-sm text-zinc-300 leading-relaxed">
            Expand active corporate parameters by selecting the premium tier:
          </p>
          <div className="grid grid-cols-1 gap-3">
            {PRICING_PLANS.filter(p => p.name !== 'Starter Workspace').map(plan => (
              <div 
                key={plan.name}
                onClick={() => setSelectedPlanToUpgrade(plan.name)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPlanToUpgrade === plan.name ? 'bg-brass-700/10 border-brass-600' : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-extrabold text-sm text-white">{plan.name}</h4>
                  <span className="text-xs font-bold text-brass-500 font-mono">
                    {plan.priceAmount === null ? 'Contact for pricing' : `${plan.currency ?? ''}${plan.priceAmount}`}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">{plan.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-800/40 select-none">
            <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900" onClick={() => setIsUpgradeModalOpen(false)} id="upgrade-cancel">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              className="bg-brass-700 hover:bg-brass-600 text-white font-bold"
              onClick={() => {
                setActivePlan(selectedPlanToUpgrade);
                setIsUpgradeModalOpen(false);
                toast('Plan Updated Successfully!', {
                  description: `Your workspace has been transitioned onto the ${selectedPlanToUpgrade} model.`,
                  type: 'success'
                });
              }} 
              id="upgrade-confirm"
            >
              Confirm Subscription Update
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

/**
 * Reads the ?view=connections&connected=github / &error=... query params that
 * the OAuth callback route redirects back with, switches to the right view,
 * shows a toast, then strips the params from the URL. Wrapped in Suspense
 * per Next.js's requirement for useSearchParams().
 */
function ConnectionsOAuthParamsHandler({
  onSwitchView,
  toast,
}: {
  onSwitchView: (view: View) => void;
  toast: any;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const view = searchParams.get('view');
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    const provider = searchParams.get('provider');

    if (view === 'connections') onSwitchView('connections' as View);

    if (connected) {
      toast('Connected!', { description: `${connected} was connected successfully.`, type: 'success' });
    } else if (error) {
      const message = OAUTH_ERROR_MESSAGES[error as keyof typeof OAUTH_ERROR_MESSAGES] || 'Something went wrong while connecting.';
      toast('Connection Failed', { description: provider ? `${provider}: ${message}` : message, type: 'error' });
    }

    if (view || connected || error) {
      router.replace('/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

