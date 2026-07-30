'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Info, ArrowUpRight, Check, Plus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PRICING_PLANS } from '@/data/mockData';
import type { SubscriptionDoc } from '@/types/billing';
import type { InvoiceDoc } from '@/types/billing';
import {
  ensureSubscription,
  subscribeToSubscription,
  changePlan,
  cancelSubscription,
  renewSubscription,
} from '@/services/billingService';
import { subscribeToInvoices } from '@/services/paymentService';
import { applyPlanLimits, getUsageSummary, type UsageSummary } from '@/services/usageService';
import { createNotification } from '@/services/notificationService';
import { logActivity } from '@/services/activityLogService';
import { recordAuditLog } from '@/services/auditLogService';

export default function BillingView({
  toast, workspaceId, userId, userName, memberCount = 1,
}: {
  toast: any; workspaceId: string; userId: string; userName: string; memberCount?: number;
}) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [subscription, setSubscription] = useState<SubscriptionDoc | null>(null);
  const [invoices, setInvoices] = useState<InvoiceDoc[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    ensureSubscription(workspaceId).catch(() => {});
    const unsub = subscribeToSubscription(workspaceId, setSubscription);
    return () => unsub();
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    const unsub = subscribeToInvoices(workspaceId, setInvoices);
    return () => unsub();
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    getUsageSummary(workspaceId, memberCount).then(setUsage).catch(() => {});
  }, [workspaceId, memberCount, subscription?.planId]);

  const activePlanId = subscription?.planId || 'free';
  const activePlanName = activePlanId === 'free' ? 'Free Plan' : PRICING_PLANS.find(p => p.id === activePlanId)?.name || 'Free Plan';

  const handleApplyCoupon = () => {
    if (!couponCode) {
      toast('Enter a code', { type: 'error' });
      return;
    }
    toast('Coupon System Not Live', { description: 'Promo code redemption will be wired up alongside live payments.', type: 'info' });
  };

  const handleChangePlan = async (planId: string) => {
    setChangingPlan(planId);
    try {
      const before = { planId: activePlanId };
      await changePlan(workspaceId, planId, billingPeriod);
      await applyPlanLimits(workspaceId, planId);
      const planName = PRICING_PLANS.find(p => p.id === planId)?.name || planId;
      await createNotification({
        workspaceId, userId, category: 'Billing',
        title: 'Plan Updated', description: `Your workspace is now on the ${planName}.`,
      });
      await logActivity({ workspaceId, userId, userName, type: 'billing_event', description: `Changed plan to ${planName}` });
      await recordAuditLog({ action: 'billing.plan_changed', userId, userName, workspaceId, beforeValue: before, afterValue: { planId } });
      toast('Plan Updated', { description: `You're now on the ${planName}.`, type: 'success' });
    } catch {
      toast('Could Not Change Plan', { type: 'error' });
    } finally {
      setChangingPlan(null);
    }
  };

  const handleCancelPlan = async () => {
    try {
      await cancelSubscription(workspaceId);
      await createNotification({ workspaceId, userId, category: 'Billing', title: 'Subscription Cancelled', description: 'Your plan will remain active until the end of the current billing period.' });
      await logActivity({ workspaceId, userId, userName, type: 'billing_event', description: 'Cancelled subscription (active until period end)' });
      toast('Subscription Cancelled', { description: 'It will remain active until the end of this billing period.', type: 'info' });
    } catch {
      toast('Could Not Cancel', { type: 'error' });
    }
  };

  const handleRenew = async () => {
    try {
      await renewSubscription(workspaceId);
      toast('Subscription Renewed', { type: 'success' });
    } catch {
      toast('Could Not Renew', { type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-medium text-white tracking-tight">Billing & Usage</h2>
          <p className="text-sm text-zinc-400 mt-1 font-sans">Review your subscription, usage, and billing history.</p>
        </div>
        <div className="flex bg-zinc-900/60 border border-zinc-800 p-1 rounded-xl">
          <button 
            onClick={() => setBillingPeriod('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${billingPeriod === 'monthly' ? 'bg-brass-700 text-white' : 'text-zinc-400'}`}
            id="billing-monthly-toggle"
          >
            Monthly
          </button>
          <button 
            onClick={() => setBillingPeriod('yearly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${billingPeriod === 'yearly' ? 'bg-brass-700 text-white' : 'text-zinc-400'}`}
            id="billing-yearly-toggle"
          >
            Yearly
          </button>
        </div>
      </div>

      {/* CURRENT PLAN */}
      <Card className="glass-panel shadow-premium p-6">
        <div className="flex items-start justify-between">
          <div>
            <Badge className="bg-brass-600/10 text-brass-500 border border-brass-600/20 text-[10px] uppercase font-bold mb-3 select-none">
              Current Plan
            </Badge>
            <h3 className="text-2xl font-black text-white">{activePlanName}</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              {PRICING_PLANS.find(p => p.id === activePlanId)?.description || 'You are on the free tier. Upgrade below to unlock more agents and connections.'}
            </p>
            {subscription && (
              <p className="text-[11px] text-zinc-500 mt-3 font-mono">
                {subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          {subscription?.cancelAtPeriodEnd && (
            <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-300 text-xs" onClick={handleRenew} id="renew-plan-btn">
              Renew
            </Button>
          )}
        </div>
      </Card>

      {/* USAGE */}
      <Card className="glass-panel shadow-premium p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Usage This Period</h3>
        {usage ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 glass-inset">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Installed Agents</p>
              <p className="font-mono text-lg text-white mt-1">{usage.installedAgentsCount} / {usage.limits.maxInstalledAgents}</p>
            </div>
            <div className="p-3 glass-inset">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Connections</p>
              <p className="font-mono text-lg text-white mt-1">{usage.connectionsCount} / {usage.limits.maxConnections}</p>
            </div>
            <div className="p-3 glass-inset">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">AI Requests</p>
              <p className="font-mono text-lg text-white mt-1">{usage.aiRequestsThisMonth} / {usage.limits.maxAiRequestsPerMonth}</p>
            </div>
            <div className="p-3 glass-inset">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Storage</p>
              <p className="font-mono text-lg text-white mt-1">{usage.storageUsedMb}MB / {usage.limits.maxStorageMb}MB</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Loading usage...</p>
        )}
        <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/30 flex items-start gap-3">
          <Info className="h-4.5 w-4.5 text-brass-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-zinc-400 leading-normal">
            AI request and storage usage will start accumulating once agent execution goes live — these are real counters, currently at zero.
          </p>
        </div>
      </Card>

      {/* PROMO CODE */}
      <Card className="glass-panel shadow-premium p-6">
        <h3 className="text-sm font-bold text-white mb-2">Promo Code</h3>
        <p className="text-xs text-zinc-400">Apply a promotional code to your account.</p>
        <div className="mt-5 flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="Enter promo code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs px-3.5 py-2 rounded-xl focus:border-brass-600 outline-none uppercase font-mono tracking-wider"
            id="billing-coupon-input"
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 border-zinc-800 text-xs font-bold text-zinc-200"
            onClick={handleApplyCoupon}
            id="apply-coupon-btn"
          >
            Apply
          </Button>
        </div>
      </Card>

      {/* PRICING PLANS */}
      <Card className="glass-panel shadow-premium p-6">
        <h3 className="font-display text-base font-semibold text-white mb-1">Subscription Tiers</h3>
        <p className="text-xs text-zinc-500 mb-5">Pricing is configured by the Admin Panel.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING_PLANS.map((p) => {
            const isCurrent = activePlanId === p.id;
            return (
              <div 
                key={p.id}
                className={`p-6 border transition-all flex flex-col justify-between ${isCurrent ? 'bg-brass-500/[0.04] border-brass-600' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2 select-none">
                    <h4 className="font-display font-semibold text-white text-base">{p.name}</h4>
                    {isCurrent && (
                      <Badge className="bg-brass-600/10 text-brass-500 border border-brass-600/20 text-[10px] font-mono uppercase">
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-1 my-3">
                    <span className="font-mono font-tabular text-2xl font-medium text-white">
                      {p.priceAmount === null ? 'Contact for pricing' : `${p.currency ?? ''}${p.priceAmount}`}
                    </span>
                    {p.priceAmount !== null && (
                      <span className="text-xs text-zinc-400 font-mono">
                        / {p.billingPeriod === 'monthly' ? 'mo' : p.billingPeriod === 'yearly' ? 'yr' : ''}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 leading-normal mb-5">{p.description}</p>
                  
                  <ul className="space-y-2 mb-6 border-t border-zinc-800/60 pt-4">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                        <Check className="h-4 w-4 text-brass-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="select-none">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full border-red-500/20 text-red-400 hover:bg-red-500/5 text-xs font-bold" onClick={handleCancelPlan} id={`cancel-plan-${p.id}`}>
                      Cancel Plan
                    </Button>
                  ) : (
                    <Button 
                      variant="primary" 
                      className="w-full bg-brass-600 hover:bg-brass-500 text-zinc-950 text-xs font-bold"
                      isLoading={changingPlan === p.id}
                      onClick={() => handleChangePlan(p.id)}
                      id={`upgrade-plan-${p.id}`}
                    >
                      {p.cta}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* PAYMENT ARCHITECTURE NOTICE */}
      <Card className="glass-panel shadow-premium p-6">
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-brass-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Payment Methods</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Real card capture requires a live Stripe or Razorpay integration (both are already connectable in the Connections Hub). Charging a card is intentionally not wired up yet — plan changes above update your subscription record without billing you.
            </p>
          </div>
        </div>
      </Card>

      {/* BILLING HISTORY */}
      <Card className="glass-panel shadow-premium">
        <CardHeader className="pb-3 border-b border-zinc-800/30">
          <CardTitle className="text-base font-bold text-white">Billing History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <EmptyState
              title="No Billing History"
              description="Your invoices and statements will appear here once billing is active."
              className="border-none rounded-none"
            />
          ) : (
            <Table>
              <TableHeader className="bg-zinc-900/30 select-none">
                <TableRow className="border-zinc-800/30">
                  <TableHead className="text-xs text-zinc-400">Invoice ID</TableHead>
                  <TableHead className="text-xs text-zinc-400">Billing Period</TableHead>
                  <TableHead className="text-xs text-zinc-400">Status</TableHead>
                  <TableHead className="text-xs text-zinc-400">Amount</TableHead>
                  <TableHead className="text-xs text-zinc-400 text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="border-zinc-800/20 hover:bg-zinc-900/20">
                    <TableCell className="font-mono text-xs font-semibold text-zinc-300">{inv.id.slice(0, 10)}</TableCell>
                    <TableCell className="text-xs text-zinc-400 font-medium">
                      {new Date(inv.periodStart).toLocaleDateString()} – {new Date(inv.periodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell><Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">{inv.status}</Badge></TableCell>
                    <TableCell className="text-xs font-extrabold text-white">{inv.currency}{inv.amount}</TableCell>
                    <TableCell className="text-right select-none">
                      {inv.receiptUrl ? (
                        <a href={inv.receiptUrl} target="_blank" rel="noreferrer" className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-all ml-auto block">
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-zinc-600">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
