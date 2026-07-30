'use client';

import React, { useState } from 'react';
import { 
  Settings, Key, Eye, EyeOff, Trash2, Plus, Info, Shield, HelpCircle, AlertTriangle, Save, Globe, Lock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ApiKey {
  id: string;
  name: string;
  token: string;
  scope: 'Full Access' | 'Read Only';
  created: string;
  visible: boolean;
}

// No API keys exist until the user creates one.
const INITIAL_KEYS: ApiKey[] = [];

export default function SettingsView({ toast }: { toast: any }) {
  const [activeTab, setActiveTab] = useState<'general' | 'keys' | 'security' | 'privacy'>('general');
  const [senderDomain, setSenderDomain] = useState('');
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [dataRetentionDays, setDataRetentionDays] = useState(90);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState<'Full Access' | 'Read Only'>('Full Access');

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) {
      toast('Invalid Name', { description: 'Please name your API token.', type: 'error' });
      return;
    }
    const randChars = Array.from({ length: 20 }, () => Math.random().toString(36)[2]).join('');
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      token: `ak_live_${randChars}`,
      scope: newKeyScope,
      created: 'Just now',
      visible: true
    };
    setApiKeys(prev => [newKey, ...prev]);
    setNewKeyName('');
    setIsGeneratingKey(false);
    toast('API Token Minted', {
      description: `A secure credential for "${newKeyName}" was created for your workspace.`,
      type: 'success'
    });
  };

  const handleToggleReveal = (id: string) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, visible: !k.visible } : k));
  };

  const handleDeleteKey = (id: string, name: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    toast('Token Destroyed', { description: `Credentials for ${name} were revoked.`, type: 'info' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Workspace Configuration</h2>
        <p className="text-sm text-zinc-400 mt-1 font-sans">Define corporate brand parameters, update model thresholds, audit api tokens, or grant privacy limits.</p>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-zinc-800/40 pb-px gap-4 select-none">
        {[
          { id: 'general', label: 'General & Brand' },
          { id: 'keys', label: 'Access Tokens (API)' },
          { id: 'security', label: 'Security & 2FA' },
          { id: 'privacy', label: 'Privacy & Retention' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 font-semibold text-xs uppercase tracking-wider transition-all border-b-2 -mb-px ${activeTab === tab.id ? 'text-brass-500 border-brass-600' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
            id={`settings-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: GENERAL & BRAND */}
      {activeTab === 'general' && (
        <div className="space-y-6 max-w-2xl">
          <Card className="glass-panel shadow-premium">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white">Brand Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  Default Sender Email Domain
                </label>
                <input
                  type="text"
                  value={senderDomain}
                  onChange={(e) => setSenderDomain(e.target.value)}
                  placeholder="mail.company.com"
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs px-3.5 py-2.5 rounded-xl focus:border-brass-600 outline-none"
                  id="sender-domain-input"
                />
                <p className="text-[10px] text-zinc-500">Your outbound outreach and bookkeeping summaries will originate from this subdomain ledger.</p>
              </div>

              {/* Confidence Threshold */}
              <div className="space-y-2 select-none">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Agent Confidence Threshold
                  </label>
                  <span className="font-mono text-sm text-brass-500 font-bold">{confidenceThreshold}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="70" 
                    max="95" 
                    value={confidenceThreshold} 
                    onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg cursor-pointer accent-brass-700" 
                    id="settings-confidence-range"
                  />
                </div>
                <p className="text-[10px] text-zinc-500">Support tickets scored with less than {confidenceThreshold}% AI confidence are automatically escalated to your Slack/human channel.</p>
              </div>

              {/* Languages Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  Agent Execution Locale
                </label>
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl p-2.5 focus:border-brass-600 outline-none"
                  id="settings-locale-select"
                >
                  {['English', 'Spanish', 'German', 'Japanese', 'French', 'Portuguese'].map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500">The default copywriting and translation output model for marketing and sales sequences.</p>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t border-zinc-800/20 select-none">
              <Button 
                variant="primary" 
                className="bg-brass-700 hover:bg-brass-600 text-white font-bold text-xs px-4"
                onClick={() => toast('Corporate parameters saved', { type: 'success' })}
                id="save-general-settings"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" /> Save Brand Parameters
              </Button>
            </CardFooter>
          </Card>

          {/* DANGER ZONE */}
          <Card className="border-red-500/20 bg-red-950/5 p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4.5 w-4.5" /> Danger Zone
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Irreversible management actions for deleting files, resetting digital employees, or closing corporate workspaces.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 select-none">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-red-500/20 text-red-400 hover:bg-red-500/5 text-xs font-semibold"
                onClick={() => toast('Workspace Resetted', { description: 'All active agents have been restored to default states.', type: 'info' })}
                id="reset-workspace-btn"
              >
                Reset Default Fleet Settings
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-500 hover:text-red-400 hover:bg-red-500/5 text-xs font-semibold px-3"
                onClick={() => toast('Deletion Restricted', { description: 'Please contact system admin to remove root business workspaces.', type: 'error' })}
                id="delete-workspace-btn"
              >
                Delete Business Workspace
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: API ACCESS TOKENS */}
      {activeTab === 'keys' && (
        <div className="space-y-6 max-w-3xl">
          <Card className="glass-panel shadow-premium p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Workspace API Credentials</h3>
                <p className="text-xs text-zinc-400 mt-1">Authenticate custom CRM tools or webhooks into your workspace.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-zinc-800 text-zinc-300 text-xs font-bold"
                onClick={() => setIsGeneratingKey(!isGeneratingKey)}
                id="create-api-key-toggle"
              >
                <Plus className="h-4 w-4 mr-1" /> Create API Token
              </Button>
            </div>

            {/* Injected form */}
            {isGeneratingKey && (
              <form onSubmit={handleGenerateKey} className="mb-6 p-4 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-4 max-w-md">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Configure Access Token</h4>
                
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Token Identifier (Name)</label>
                  <input
                    type="text"
                    placeholder="e.g. Outbound Campaign Script"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2.5 focus:border-brass-600 outline-none"
                    id="new-key-name"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Token Scope</label>
                  <select 
                    value={newKeyScope}
                    onChange={(e) => setNewKeyScope(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2.5 focus:border-brass-600 outline-none"
                    id="new-key-scope"
                  >
                    <option value="Full Access">Full Access (Read/Write)</option>
                    <option value="Read Only">Read Only</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 select-none">
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsGeneratingKey(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="bg-brass-700 hover:bg-brass-600 text-white font-semibold text-xs rounded-lg">
                    Mint Token
                  </Button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="space-y-4">
              {apiKeys.length === 0 ? (
                <p className="text-xs text-zinc-500">No API keys created yet.</p>
              ) : (
                apiKeys.map((key) => (
                  <div 
                    key={key.id} 
                    className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-950/30 flex items-center justify-between"
                    id={`api-key-row-${key.id}`}
                  >
                    <div>
                      <div className="flex items-center gap-2 select-none">
                        <span className="text-sm font-bold text-white">{key.name}</span>
                        <Badge className="bg-zinc-800 text-zinc-300 border-none text-[8px] font-mono px-1 py-0">{key.scope}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800/30">
                          {key.visible ? key.token : `${key.token.slice(0, 8)}********************`}
                        </span>
                        <button 
                          onClick={() => handleToggleReveal(key.id)}
                          className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition-all"
                          title={key.visible ? 'Hide secret key' : 'Show secret key'}
                          id={`reveal-key-btn-${key.id}`}
                        >
                          {key.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-zinc-500 block mt-1.5 font-mono">Created: {key.created}</span>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/5 px-2 select-none"
                      onClick={() => handleDeleteKey(key.id, key.name)}
                      id={`delete-key-btn-${key.id}`}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: SECURITY */}
      {activeTab === 'security' && (
        <Card className="glass-panel shadow-premium p-6 max-w-2xl space-y-6">
          <div className="flex justify-between items-start border-b border-zinc-800/30 pb-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Lock className="h-4.5 w-4.5 text-brass-500" /> Two-Factor Authentication (2FA)
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Ensure maximum safety for business settings by enabling TOTP verification tokens.</p>
            </div>
            <div className="flex items-center gap-2 select-none">
              <button 
                onClick={() => {
                  setTfaEnabled(!tfaEnabled);
                  toast(tfaEnabled ? '2FA Deactivated' : '2FA Verification Requested', {
                    description: tfaEnabled ? 'Account backup limits restored.' : 'Complete Google Authenticator sync to activate protection.',
                    type: tfaEnabled ? 'info' : 'success'
                  });
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors ${tfaEnabled ? 'bg-brass-700' : 'bg-zinc-800'}`}
                id="tfa-toggle-btn"
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${tfaEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-3">Recent Security Sessions</h4>
            <p className="text-xs text-zinc-500">Session history isn't available yet.</p>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: PRIVACY & RETENTION */}
      {activeTab === 'privacy' && (
        <Card className="glass-panel shadow-premium p-6 max-w-2xl space-y-6">
          <div className="space-y-3 select-none">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Shield className="h-4.5 w-4.5 text-brass-500" /> Lead & Ticket Retention Period
              </h3>
              <span className="font-mono text-sm font-bold text-brass-500">{dataRetentionDays} Days</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Define after how many days completed customer support transcripts, email bodies, and transient PDF records are hard-pruned from our cloud storage.
            </p>
            <div className="pt-3">
              <input 
                type="range" 
                min="30" 
                max="365" 
                step="30"
                value={dataRetentionDays} 
                onChange={(e) => setDataRetentionDays(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg cursor-pointer accent-brass-700" 
                id="data-retention-slider"
              />
            </div>
          </div>

          <div className="pt-5 border-t border-zinc-800/30 space-y-4">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Corporate Compliance Sync</h4>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/50 flex items-start gap-3">
              <Info className="h-4.5 w-4.5 text-brass-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-400 leading-normal">
                By maintaining standard thresholds below 90 days, your business automatically meets standard requirements under GDPR article 17 and CCPA data preservation mandates.
              </p>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}
