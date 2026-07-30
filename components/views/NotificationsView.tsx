'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, Info, Search, Check, Trash2, ShieldCheck, Mail, CreditCard, Cable, Bot, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { NotificationDoc } from '@/types/firestore';
import {
  subscribeToNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@/services/notificationService';

export default function NotificationsView({ toast, workspaceId }: { toast: any; workspaceId: string }) {
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = ['All', 'Agent', 'Marketplace', 'Billing', 'Connection', 'System', 'Workspace', 'Security'];

  useEffect(() => {
    if (!workspaceId) return;
    const unsub = subscribeToNotifications(
      workspaceId,
      (list) => { setNotifications(list); setLoading(false); },
      () => setLoading(false)
    );
    return () => unsub();
  }, [workspaceId]);

  const getIcon = (category: string) => {
    const p = { className: 'h-4 w-4 text-brass-500' };
    switch (category) {
      case 'Agent': return <Bot {...p} />;
      case 'Marketplace': return <CheckCircle2 {...p} className="h-4 w-4 text-pink-400" />;
      case 'Billing': return <CreditCard {...p} className="h-4 w-4 text-emerald-400" />;
      case 'Connection': return <Cable {...p} className="h-4 w-4 text-sky-400" />;
      case 'Workspace': return <ShieldCheck {...p} className="h-4 w-4 text-purple-400" />;
      case 'Security': return <ShieldCheck {...p} className="h-4 w-4 text-red-400" />;
      case 'System': return <AlertTriangle {...p} className="h-4 w-4 text-amber-400" />;
      default: return <Bell {...p} />;
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch {
      toast('Could not update notification', { type: 'error' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(notifications);
      toast('All notifications marked as read', { type: 'success' });
    } catch {
      toast('Could not update notifications', { type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
    } catch {
      toast('Could not delete notification', { type: 'error' });
    }
  };

  const filtered = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeFilter === 'All' || n.category === activeFilter;
    return matchesSearch && matchesTab;
  });

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Notification Center</h2>
          <p className="text-sm text-zinc-400 mt-1 font-sans">Real-time updates on your agents, billing, team, connections, and workspace activity.</p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex gap-2 select-none">
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-900"
                onClick={handleMarkAllAsRead}
                id="mark-all-read-btn"
              >
                Mark All Read
              </Button>
            )}
          </div>
        )}
      </div>

      {/* FILTERS AND SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-80 select-none">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search notification log..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-brass-600 text-zinc-200 text-sm pl-10 pr-4 py-2 rounded-xl transition-all outline-none"
            id="notifications-search"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 glass-inset">
          {filters.map((f) => {
            const count = f === 'All' ? notifications.length : notifications.filter(n => n.category === f).length;
            const isSelected = activeFilter === f;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${isSelected ? 'bg-brass-700 text-white shadow-xs' : 'text-zinc-400 hover:text-white'}`}
                id={`notif-filter-${f.toLowerCase()}`}
              >
                <span>{f}</span>
                {count > 0 && (
                  <span className={`h-4.5 min-w-4.5 px-1 flex items-center justify-center text-[9px] rounded-full ${isSelected ? 'bg-white text-brass-800 font-bold' : 'bg-zinc-800 text-zinc-400 font-semibold'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT LOGS */}
      {loading ? (
        <p className="text-xs text-zinc-500 text-center py-10">Loading notifications...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Notifications"
          description={notifications.length === 0 ? "You're all caught up. Notifications about your agents, billing, and connections will appear here." : "No notifications match your current filter."}
        />
      ) : (
        <div className="space-y-4 max-w-4xl">
          {filtered.map((al) => (
            <Card 
              key={al.id} 
              className={`glass-panel shadow-premium p-5 flex justify-between items-start md:items-center gap-4 transition-all ${al.unread ? 'border-brass-600/30 bg-brass-600/5' : ''}`}
              id={`notif-card-${al.id}`}
            >
              <div className="flex items-start md:items-center gap-4">
                <div className="h-10 w-10 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                  {getIcon(al.category)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-extrabold text-white leading-snug">{al.title}</h4>
                    <Badge className="bg-zinc-800 text-zinc-300 border-none text-[8px] tracking-wider uppercase px-1 py-0">{al.category}</Badge>
                    {al.unread && <span className="h-2 w-2 rounded-full bg-brass-600" />}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{al.description}</p>
                  <span className="text-[10px] text-zinc-500 font-mono mt-2 block">{new Date(al.createdAt).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="shrink-0 select-none flex items-center gap-2">
                {al.unread && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 border-zinc-800 text-[10px] font-bold text-brass-500 hover:text-brass-300"
                    onClick={() => handleMarkAsRead(al.id)}
                    id={`mark-read-btn-${al.id}`}
                  >
                    <Check className="h-3 w-3 mr-1" /> Mark Read
                  </Button>
                )}
                <button
                  onClick={() => handleDelete(al.id)}
                  className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-600 hover:text-zinc-300 transition-all block"
                  id={`delete-notif-btn-${al.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
