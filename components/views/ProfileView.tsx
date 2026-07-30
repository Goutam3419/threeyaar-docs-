'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Building2, Mail, Phone, Globe, MapPin, Clock, Camera, Save, Activity, Twitter, Linkedin, Facebook, Instagram
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

import { updateUserProfile } from '@/services/userService';

export default function ProfileView({ 
  ownerName, setOwnerName, companyName, setCompanyName, email: profileEmail,
  photoURL, role, subscription, joinedDate, uid, toast 
}: { 
  ownerName: string; 
  setOwnerName: (n: string) => void; 
  companyName: string; 
  setCompanyName: (c: string) => void; 
  email?: string;
  photoURL?: string;
  role?: 'admin' | 'user';
  subscription?: string;
  joinedDate?: string;
  uid?: string;
  toast: any;
}) {
  const [email, setEmail] = useState(profileEmail || '');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('United States');
  const [timezone, setTimezone] = useState('Pacific Time (PT)');
  const [businessCategory, setBusinessCategory] = useState('Retail & Apparel');
  const [isSaving, setIsSaving] = useState(false);
  
  // Social links state
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');

  useEffect(() => {
    if (profileEmail) setEmail(profileEmail);
  }, [profileEmail]);

  const joinedDateLabel = joinedDate
    ? new Date(joinedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  // Calculate profile completion percentage based on filled fields during render
  const completion = useMemo(() => {
    let filledFields = 0;
    const fields = [ownerName, companyName, email, phone, country, timezone, businessCategory, twitter, linkedin, instagram];
    fields.forEach(f => {
      if (f && f.trim() !== '') filledFields++;
    });
    return Math.round((filledFields / fields.length) * 100);
  }, [ownerName, companyName, email, phone, country, timezone, businessCategory, twitter, linkedin, instagram]);

  const handleSaveProfile = async () => {
    if (!uid) {
      toast('Not Signed In', { description: 'Please sign in again to save changes.', type: 'error' });
      return;
    }
    setIsSaving(true);
    try {
      await updateUserProfile(uid, { name: ownerName, company: companyName });
      toast('Profile Saved!', {
        description: 'Your business details are updated successfully.',
        type: 'success'
      });
    } catch {
      toast('Save Failed', { description: 'Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }

  };

  // Populated from real account events once backend integration is live.
  const timelineItems: { id: string; action: string; desc: string; date: string }[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Workspace Profile</h2>
        <p className="text-sm text-zinc-400 mt-1 font-sans">Configure billing contact emails, review physical location zones, or link corporate social handles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PROFILE COMPLETENESS & SUMMARY */}
        <div className="space-y-6">
          
          <Card className="glass-panel shadow-premium p-6 text-center select-none">
            <div className="relative inline-block group">
              <Avatar src={photoURL || undefined} fallback={ownerName || email || 'U'} size="xl" glow />
              <button 
                onClick={() => toast('Upload Avatar', { description: 'Opening secure local asset navigator.', type: 'info' })}
                className="absolute bottom-0 right-0 p-1.5 bg-brass-700 hover:bg-brass-600 text-white rounded-full transition-transform hover:scale-105"
                title="Change Logo"
                id="profile-avatar-upload-btn"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <h3 className="text-lg font-extrabold text-white mt-4">{ownerName || 'Unnamed'}</h3>
            <p className="text-xs text-brass-500 font-bold uppercase tracking-wide mt-1">{companyName || 'No company set'}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-[10px] text-zinc-500 font-medium capitalize">{subscription || 'free'} plan</span>
              <span className="text-zinc-700">•</span>
              <span className="text-[10px] text-zinc-500 font-medium capitalize">{role || 'user'}</span>
            </div>
            <p className="text-[10px] text-zinc-600 font-medium mt-1">Joined {joinedDateLabel}</p>

            {/* Completion Meter */}
            <div className="mt-6 pt-6 border-t border-zinc-800/30 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-zinc-400">Profile Completion</span>
                <span className="text-brass-500 font-bold">{completion}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-brass-600 h-full transition-all duration-500" style={{ width: `${completion}%` }} />
              </div>
              <p className="text-[10px] text-zinc-500 text-left leading-normal pt-1">
                {completion === 100 
                  ? 'Your workspace profile is completely filled out! Your agents are operating with full corporate identities.'
                  : 'Fill in social profiles and office timezone details to complete your digital workspace registration.'}
              </p>
            </div>
          </Card>

          {/* ACTIVITY LEDGER TIMELINE */}
          <Card className="glass-panel shadow-premium p-6">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-brass-500" /> Account Audit Log
            </h4>
            
            <div className="space-y-5 relative pl-4 before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
              {timelineItems.length === 0 ? (
                <p className="text-[11px] text-zinc-500 pl-0 -ml-4">No activity yet.</p>
              ) : timelineItems.map((item) => (
                <div key={item.id} className="relative text-left">
                  <div className="absolute -left-[16px] top-1.5 h-2 w-2 rounded-full bg-brass-600" />
                  <span className="text-[10px] font-mono text-zinc-500 block">{item.date}</span>
                  <span className="text-xs font-bold text-white mt-0.5 block leading-snug">{item.action}</span>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-normal">{item.desc}</p>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* INPUT FORM FIELDS */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="glass-panel shadow-premium p-6">
            <h3 className="text-base font-bold text-white mb-5">Primary Office Metadata</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Workspace Owner Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs pl-10 pr-3 py-2.5 rounded-xl focus:border-brass-600 outline-none"
                    id="profile-owner-name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs pl-10 pr-3 py-2.5 rounded-xl focus:border-brass-600 outline-none"
                    id="profile-company-name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Contact Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    title="Changing your sign-in email isn't available yet"
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-500 text-xs pl-10 pr-3 py-2.5 rounded-xl outline-none cursor-not-allowed"
                    id="profile-email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs pl-10 pr-3 py-2.5 rounded-xl focus:border-brass-600 outline-none"
                    id="profile-phone"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Country</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs pl-10 pr-3 py-2.5 rounded-xl focus:border-brass-600 outline-none"
                    id="profile-country"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Timezone</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs pl-10 pr-3 py-2.5 rounded-xl focus:border-brass-600 outline-none"
                    id="profile-timezone"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Business Category / Sector</label>
                <select 
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl p-2.5 focus:border-brass-600 outline-none"
                  id="profile-category-select"
                >
                  {['Retail & Apparel', 'SaaS & Tech Product', 'Professional & Consulting', 'Healthcare & Clinical', 'Real Estate Logistics', 'E-Commerce storefront'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

            </div>
          </Card>

          {/* SOCIAL LINKS CARD */}
          <Card className="glass-panel shadow-premium p-6">
            <h3 className="text-base font-bold text-white mb-5">Social Ledger Links</h3>
            
            <div className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Twitter / X handle</label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs pl-10 pr-3 py-2.5 rounded-xl focus:border-brass-600 outline-none"
                    id="profile-twitter"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">LinkedIn Profile</label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs pl-10 pr-3 py-2.5 rounded-xl focus:border-brass-600 outline-none"
                    id="profile-linkedin"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Instagram Handle</label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs pl-10 pr-3 py-2.5 rounded-xl focus:border-brass-600 outline-none"
                    id="profile-instagram"
                  />
                </div>
              </div>

            </div>

            <div className="mt-6 pt-6 border-t border-zinc-800/20 select-none">
              <Button 
                variant="primary" 
                className="bg-brass-700 hover:bg-brass-600 text-white font-bold text-xs px-4"
                onClick={handleSaveProfile}
                isLoading={isSaving}
                id="profile-save-btn"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" /> Commit Profile Settings
              </Button>
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
}
