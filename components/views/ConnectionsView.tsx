'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Shield, Power, RefreshCcw, Activity, X, ArrowLeft, 
  CheckCircle2, XCircle, AlertTriangle, Clock, Key
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PROVIDERS, PROVIDER_CATEGORIES, type ProviderConfig } from '@/lib/providers/registry';
import { OAUTH_ERROR_MESSAGES } from '@/types/connections';
import type { ConnectionDoc } from '@/types/connections';
import {
  subscribeToConnections,
  initiateConnect,
  saveApiKeyConnection,
  disconnectConnection,
  testConnection,
  refreshConnection,
} from '@/services/connectionsService';

const CATEGORY_COLORS: Record<string, string> = {
  'Developer Tools': 'bg-zinc-800 text-zinc-300',
  'Social Media': 'bg-pink-500/10 text-pink-400',
  'E-commerce': 'bg-emerald-500/10 text-emerald-400',
  'Productivity': 'bg-blue-500/10 text-blue-400',
  'Communication': 'bg-purple-500/10 text-purple-400',
  'Payments': 'bg-brass-600/10 text-brass-500',
  'AI Models': 'bg-cyan-500/10 text-cyan-400',
};

export default function ConnectionsView({ toast, workspaceId }: { toast: any; workspaceId: string }) {
  const [connections, setConnections] = useState<ConnectionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Connected' | 'Not Connected'>('All');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [shopModalProvider, setShopModalProvider] = useState<ProviderConfig | null>(null);
  const [shopDomainInput, setShopDomainInput] = useState('');
  const [apiKeyModalProvider, setApiKeyModalProvider] = useState<ProviderConfig | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    if (!workspaceId) return;
    const unsub = subscribeToConnections(
      workspaceId,
      (list) => { setConnections(list); setLoading(false); },
      () => setLoading(false)
    );
    return () => unsub();
  }, [workspaceId]);

  const getConnection = (providerId: string) => connections.find((c) => c.provider === providerId) || null;

  const handleConnectClick = (provider: ProviderConfig) => {
    if (provider.authType === 'apikey') {
      setApiKeyModalProvider(provider);
      return;
    }
    if (provider.authType === 'oauth2-shop-domain') {
      setShopModalProvider(provider);
      return;
    }
    startOAuth(provider);
  };

  const startOAuth = async (provider: ProviderConfig, shopDomain?: string) => {
    setConnectingId(provider.id);
    try {
      await initiateConnect(provider.id, workspaceId, shopDomain);
      // Browser navigates away here — nothing else to do.
    } catch (err: any) {
      toast('Could Not Start Connection', {
        description: OAUTH_ERROR_MESSAGES[err?.message as keyof typeof OAUTH_ERROR_MESSAGES] || 'Please try again.',
        type: 'error',
      });
      setConnectingId(null);
    }
  };

  const handleShopSubmit = () => {
    if (!shopModalProvider) return;
    let shop = shopDomainInput.trim().toLowerCase();
    if (!shop) {
      toast('Enter your shop domain', { type: 'error' });
      return;
    }
    if (!shop.includes('.myshopify.com')) shop = `${shop}.myshopify.com`;
    setShopModalProvider(null);
    setShopDomainInput('');
    startOAuth(shopModalProvider, shop);
  };

  const handleApiKeySubmit = async () => {
    if (!apiKeyModalProvider) return;
    if (!apiKeyInput.trim()) {
      toast('Enter an API key', { type: 'error' });
      return;
    }
    setConnectingId(apiKeyModalProvider.id);
    try {
      await saveApiKeyConnection(apiKeyModalProvider.id, workspaceId, apiKeyInput.trim());
      toast('Connected!', { description: `${apiKeyModalProvider.name} was connected successfully.`, type: 'success' });
      setApiKeyModalProvider(null);
      setApiKeyInput('');
    } catch (err: any) {
      toast('Invalid API Key', {
        description: OAUTH_ERROR_MESSAGES[err?.message as keyof typeof OAUTH_ERROR_MESSAGES] || 'Please check your key and try again.',
        type: 'error',
      });
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (provider: ProviderConfig) => {
    setConnectingId(provider.id);
    try {
      await disconnectConnection(provider.id, workspaceId);
      toast('Disconnected', { description: `${provider.name} has been disconnected.`, type: 'info' });
    } catch {
      toast('Could Not Disconnect', { type: 'error' });
    } finally {
      setConnectingId(null);
    }
  };

  const handleTest = async (provider: ProviderConfig) => {
    setTestingId(provider.id);
    try {
      const result = await testConnection(provider.id, workspaceId);
      if (result.healthy) {
        toast('Connection Healthy', { description: `${provider.name} is working correctly.`, type: 'success' });
      } else {
        toast('Connection Issue', {
          description: OAUTH_ERROR_MESSAGES[result.error as keyof typeof OAUTH_ERROR_MESSAGES] || 'This connection needs attention.',
          type: 'error',
        });
      }
    } catch {
      toast('Test Failed', { type: 'error' });
    } finally {
      setTestingId(null);
    }
  };

  const handleReconnect = async (provider: ProviderConfig) => {
    const conn = getConnection(provider.id);
    if (conn?.status === 'EXPIRED') {
      try {
        await refreshConnection(provider.id, workspaceId);
        toast('Reconnected', { description: `${provider.name} token was refreshed.`, type: 'success' });
        return;
      } catch {
        // fall through to full reconnect
      }
    }
    handleConnectClick(provider);
  };

  const filtered = PROVIDERS.filter((provider) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || provider.name.toLowerCase().includes(q) || provider.description.toLowerCase().includes(q);
    const matchesCategory = activeCategory === 'All' || provider.category === activeCategory;
    const conn = getConnection(provider.id);
    const isConnected = conn?.status === 'CONNECTED';
    const matchesStatus = statusFilter === 'All' || (statusFilter === 'Connected' ? isConnected : !isConnected);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const connectedCount = PROVIDERS.filter((p) => getConnection(p.id)?.status === 'CONNECTED').length;
  const notConnectedCount = PROVIDERS.length - connectedCount;

  const selectedProvider = selectedProviderId ? PROVIDERS.find((p) => p.id === selectedProviderId) : null;
  const selectedConnection = selectedProviderId ? getConnection(selectedProviderId) : null;

  const statusBadge = (conn: ConnectionDoc | null) => {
    if (!conn || conn.status === 'DISCONNECTED') return <Badge className="bg-zinc-800 text-zinc-500 border border-zinc-800">Not Connected</Badge>;
    if (conn.status === 'CONNECTED') return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Connected</Badge>;
    if (conn.status === 'EXPIRED') return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">Expired</Badge>;
    return <Badge className="bg-red-500/10 text-red-400 border border-red-500/20">Error</Badge>;
  };

  // ======================= CONNECTION DETAILS PANEL =======================
  if (selectedProvider) {
    const isConnected = selectedConnection?.status === 'CONNECTED';
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedProviderId(null)}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold select-none group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Connections
        </button>

        <Card className="glass-elevated p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg font-black text-brass-500">
                {selectedProvider.name[0]}
              </div>
              <div>
                <h2 className="text-xl font-black text-white">{selectedProvider.name}</h2>
                <Badge className={`${CATEGORY_COLORS[selectedProvider.category]} border-none text-[10px] mt-1`}>{selectedProvider.category}</Badge>
              </div>
            </div>
            {statusBadge(selectedConnection)}
          </div>

          <p className="text-sm text-zinc-400 mb-6">{selectedProvider.description}</p>
          {selectedProvider.caveat && (
            <div className="flex items-start gap-2 p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl mb-6">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-400">{selectedProvider.caveat}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 glass-inset">
              <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1.5"><Clock className="h-3 w-3" /> Connected Date</span>
              <p className="text-sm text-zinc-200 font-semibold mt-1.5">
                {selectedConnection?.connectedAt ? new Date(selectedConnection.connectedAt).toLocaleString() : '—'}
              </p>
            </div>
            <div className="p-4 glass-inset">
              <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1.5"><Activity className="h-3 w-3" /> Last Synced</span>
              <p className="text-sm text-zinc-200 font-semibold mt-1.5">
                {selectedConnection?.lastSynced ? new Date(selectedConnection.lastSynced).toLocaleString() : '—'}
              </p>
            </div>
          </div>

          {selectedConnection && selectedConnection.scopes.length > 0 && (
            <div className="mb-6">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Scopes Granted</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedConnection.scopes.map((scope, i) => (
                  <span key={i} className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-full px-2.5 py-1">{scope}</span>
                ))}
              </div>
            </div>
          )}

          {selectedConnection?.lastError && (
            <div className="flex items-start gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl mb-6">
              <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{OAUTH_ERROR_MESSAGES[selectedConnection.lastError as keyof typeof OAUTH_ERROR_MESSAGES] || selectedConnection.lastError}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-800/40">
            {isConnected ? (
              <>
                <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-300" isLoading={testingId === selectedProvider.id} onClick={() => handleTest(selectedProvider)} id="details-test-btn">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Test Connection
                </Button>
                <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-300" isLoading={connectingId === selectedProvider.id} onClick={() => handleReconnect(selectedProvider)} id="details-reconnect-btn">
                  <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> Reconnect
                </Button>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/5" isLoading={connectingId === selectedProvider.id} onClick={() => handleDisconnect(selectedProvider)} id="details-disconnect-btn">
                  <Power className="h-3.5 w-3.5 mr-1.5" /> Disconnect
                </Button>
              </>
            ) : (
              <Button variant="primary" size="sm" className="bg-brass-700 hover:bg-brass-600 text-white" isLoading={connectingId === selectedProvider.id} onClick={() => handleConnectClick(selectedProvider)} id="details-connect-btn">
                Connect {selectedProvider.name}
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ======================= MAIN LIST VIEW =======================
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans">Connections</h2>
          <p className="text-sm text-zinc-400 mt-1 font-sans">Authorize real OAuth connections so your agents can read/write data on your behalf.</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 text-xs">{connectedCount} Connected</Badge>
          <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-800 px-3 py-1.5 text-xs">{notConnectedCount} Not Connected</Badge>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-brass-600 text-zinc-200 text-sm pl-10 pr-4 py-2 rounded-xl transition-all outline-none"
            id="connections-search-input"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 px-3 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-brass-600 font-medium"
            id="connections-status-filter"
          >
            <option value="All">Status: All</option>
            <option value="Connected">Status: Connected</option>
            <option value="Not Connected">Status: Not Connected</option>
          </select>

          <div className="flex flex-wrap gap-1.5 p-1 glass-inset">
            {PROVIDER_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-brass-700 text-white shadow-xs' : 'text-zinc-400 hover:text-white'}`}
                id={`filter-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GRID */}
      {loading ? (
        <p className="text-xs text-zinc-500 text-center py-10">Loading connections...</p>
      ) : filtered.length === 0 ? (
        <EmptyState title="No Connections Found" description="No providers match your search or filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((provider) => {
            const conn = getConnection(provider.id);
            const isConnected = conn?.status === 'CONNECTED';
            const isBusy = connectingId === provider.id;

            return (
              <Card key={provider.id} className="glass-elevated p-6 flex flex-col justify-between" id={`connection-card-${provider.id}`}>
                <div>
                  <div className="flex items-center justify-between mb-4 select-none">
                    <Badge className={`${CATEGORY_COLORS[provider.category]} border-none text-[10px] uppercase font-bold`}>{provider.category}</Badge>
                    {statusBadge(conn)}
                  </div>

                  <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => setSelectedProviderId(provider.id)}>
                    <div className="h-10 w-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center shrink-0 font-black text-brass-500 text-sm">
                      {provider.name[0]}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white hover:text-brass-500">{provider.name}</h3>
                      <p className="text-[10px] text-zinc-500 font-mono">{provider.authType === 'apikey' ? 'API Key' : 'OAuth 2.0'}</p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed min-h-[48px]">{provider.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-800/30 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 select-none">
                    <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-brass-500" /> AES encrypted</span>
                    <span>Sync: {conn?.lastSynced ? new Date(conn.lastSynced).toLocaleDateString() : 'Never'}</span>
                  </div>

                  <div className="flex gap-2 select-none">
                    {isConnected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8.5 font-semibold text-xs border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                          isLoading={testingId === provider.id}
                          onClick={() => handleTest(provider)}
                          id={`test-btn-${provider.id}`}
                        >
                          Test
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8.5 text-red-400 hover:text-red-300 hover:bg-red-500/5 px-2.5 rounded-xl"
                          isLoading={isBusy}
                          onClick={() => handleDisconnect(provider)}
                          id={`disconnect-btn-${provider.id}`}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </>
                    ) : conn?.status === 'EXPIRED' || conn?.status === 'ERROR' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full h-8.5 font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white border-none rounded-xl"
                        isLoading={isBusy}
                        onClick={() => handleReconnect(provider)}
                        id={`reconnect-btn-${provider.id}`}
                      >
                        <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> Reconnect
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full h-8.5 font-bold text-xs bg-brass-700 hover:bg-brass-600 text-white border-none rounded-xl"
                        isLoading={isBusy}
                        onClick={() => handleConnectClick(provider)}
                        id={`connect-btn-${provider.id}`}
                      >
                        {provider.authType === 'apikey' ? <><Key className="h-3.5 w-3.5 mr-1.5" /> Add API Key</> : 'Connect Account'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* SHOPIFY SHOP-DOMAIN MODAL */}
      {shopModalProvider && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={() => setShopModalProvider(null)}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Connect Shopify</h3>
              <button onClick={() => setShopModalProvider(null)}><X className="h-4 w-4 text-zinc-400" /></button>
            </div>
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1.5">Shop Domain</label>
            <input
              type="text"
              placeholder="mystore.myshopify.com"
              value={shopDomainInput}
              onChange={(e) => setShopDomainInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-lg p-2.5 focus:border-brass-600 outline-none mb-4"
              id="shopify-domain-input"
            />
            <Button variant="primary" className="w-full bg-brass-700 hover:bg-brass-600 text-white" onClick={handleShopSubmit} id="shopify-domain-submit">
              Continue to Shopify
            </Button>
          </div>
        </div>
      )}

      {/* API KEY MODAL */}
      {apiKeyModalProvider && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={() => setApiKeyModalProvider(null)}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Connect {apiKeyModalProvider.name}</h3>
              <button onClick={() => setApiKeyModalProvider(null)}><X className="h-4 w-4 text-zinc-400" /></button>
            </div>
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1.5">API Key</label>
            <input
              type="password"
              placeholder="Paste your API key"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-lg p-2.5 focus:border-brass-600 outline-none mb-2 font-mono"
              id="api-key-input"
            />
            <p className="text-[10px] text-zinc-500 mb-4">Your key is validated, encrypted, and stored securely. It's never shown again after this.</p>
            <Button
              variant="primary"
              className="w-full bg-brass-700 hover:bg-brass-600 text-white"
              isLoading={connectingId === apiKeyModalProvider.id}
              onClick={handleApiKeySubmit}
              id="api-key-submit"
            >
              Connect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
