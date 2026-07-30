'use client';

import React, { useState } from 'react';
import { 
  Search, BookOpen, PlayCircle, HelpCircle, Mail, AlertTriangle, MessageSquare, ArrowRight, Heart, Sparkles, Check
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface FaqItem {
  id: string;
  q: string;
  a: string;
  open: boolean;
}

interface FeatureRequest {
  id: string;
  title: string;
  votes: number;
  desc: string;
  upvoted: boolean;
}

const INITIAL_FAQS: FaqItem[] = [
  { id: 'f-1', q: 'How do NexCart AI AI Business Agents operate?', a: 'AI business agents on NexCart AI are secure, task-specific virtual employees trained for specific roles like SEO writing, customer ticket processing, and sales outreach. They connect via OAuth into Shopify, Stripe, Google Calendar, or Salesforce to perform autonomous, background loop operations on your behalf.', open: false },
  { id: 'f-2', q: 'Do I need any technical or coding experience to launch agents?', a: 'Absolutely not. This platform is custom built for non-technical business owners, CEOs, and managers. All configurations are designed in plain English inputs, sliders, and simple toggle indicators.', open: false },
  { id: 'f-3', q: 'Is our corporate or customer database information safe?', a: 'Yes, security is our primary architecture. Every agent runs in an isolated, secure environment, and third-party secrets, keys, and transaction ledgers are shielded with bank-level AES-256 encryption.', open: false },
  { id: 'f-4', q: 'How does human escalation workflow operate when agents get confused?', a: 'You set an agent confidence threshold (e.g., 85%). If the model is less than 85% certain of a support query resolution or email draft, it immediately drafts a ticket summary and pushes it directly into your connected Slack, Discord, or human customer success channel.', open: false }
];

const INITIAL_FEATURES: FeatureRequest[] = [
  { id: 'ft-1', title: 'WhatsApp Business Broadcast Automation', votes: 0, desc: 'An agent that schedules bulk promotional campaigns on whitelisted customer telephone directories.', upvoted: false },
  { id: 'ft-2', title: 'Xero Ledger Direct Feed Integration', votes: 0, desc: 'Allow direct bookkeeping reconciliation with Xero ledger besides standard QuickBooks.', upvoted: false },
  { id: 'ft-3', title: 'PDF Purchase Invoice Bulk OCR Parser', votes: 0, desc: 'Allows bookkeeping agents to ingest raw PDF folders and batch match them to statement lines.', upvoted: false }
];

export default function HelpCenterView({ toast }: { toast: any }) {
  const [faqs, setFaqs] = useState<FaqItem[]>(INITIAL_FAQS);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>(INITIAL_FEATURES);
  const [searchQuery, setSearchQuery] = useState('');

  // Contact support form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketSeverity, setTicketSeverity] = useState('Medium');
  const [ticketMessage, setTicketMessage] = useState('');

  const handleToggleFaq = (id: string) => {
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, open: !f.open } : f));
  };

  const handleUpvoteFeature = (id: string, title: string, currentlyUpvoted: boolean) => {
    setFeatureRequests(prev => prev.map(f => {
      if (f.id === id) {
        return {
          ...f,
          votes: currentlyUpvoted ? f.votes - 1 : f.votes + 1,
          upvoted: !currentlyUpvoted
        };
      }
      return f;
    }));

    toast(currentlyUpvoted ? 'Upvote Removed' : 'Feature Upvoted!', {
      description: currentlyUpvoted 
        ? `Removed upvote for "${title}".`
        : `Successfully cast a vote to expedite development of "${title}".`,
      type: currentlyUpvoted ? 'info' : 'success'
    });
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) {
      toast('Empty Fields Detected', { description: 'Please fill in a subject and message description.', type: 'error' });
      return;
    }
    setTicketSubject('');
    setTicketMessage('');
    toast('Support Case Created', {
      description: `Case logged with ${ticketSeverity} priority. A human manager will respond within 4 hours.`,
      type: 'success'
    });
  };

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Business Owner Guides</h2>
        <p className="text-sm text-zinc-400 mt-1 font-sans">Read plain-English instructions, watch video walkthroughs, request new agent functions, or open support files.</p>
      </div>

      {/* SEARCH AND GETTING STARTED BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Search & Docs card */}
        <Card className="glass-panel shadow-premium p-6 md:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-2">Search Owner Playbooks</h3>
            <p className="text-xs text-zinc-400 mb-4">Query through dozens of quick guides, platform schemas, and whitelisting procedures.</p>
            
            <div className="relative select-none">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search FAQs, video walkthroughs, or support articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs pl-10 pr-4 py-2.5 rounded-xl focus:border-brass-600 outline-none"
                id="faq-search-input"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-4 text-xs font-semibold text-brass-500 select-none">
            <a href="#faqs-anchor" className="hover:text-brass-300 flex items-center gap-1">Browse FAQs <ArrowRight className="h-3 w-3" /></a>
            <a href="#video-tutorials" className="hover:text-brass-300 flex items-center gap-1">Video Courses <ArrowRight className="h-3 w-3" /></a>
          </div>
        </Card>

        {/* 3-Step checklist */}
        <Card className="bg-brass-950/10 border-brass-600/20 p-6 flex flex-col justify-between">
          <div>
            <Badge className="bg-brass-600/10 text-brass-500 border border-brass-600/20 text-[9px] uppercase font-bold mb-3 select-none">
              GETTING STARTED
            </Badge>
            <h3 className="text-sm font-bold text-white mb-3">Setup Checklist</h3>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-xs text-zinc-300">
                <div className="h-3.5 w-3.5 rounded-full border border-zinc-700 shrink-0" />
                <span className="text-zinc-300">Complete your business profile</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-300">
                <div className="h-3.5 w-3.5 rounded-full border border-zinc-700 shrink-0" />
                <span className="text-zinc-300">Connect a business tool</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-300">
                <div className="h-3.5 w-3.5 rounded-full border border-brass-500 shrink-0 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-brass-500" />
                </div>
                <span className="text-zinc-200">Install your first agent</span>
              </li>
            </ul>
          </div>
        </Card>

      </div>

      {/* VIDEO TUTORIALS */}
      <div id="video-tutorials" className="space-y-4">
        <h3 className="text-base font-bold text-white">Video Tutorials</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Shopify Returns Integration', dur: '4:15', desc: 'Securely whitelist return rules so support agents can process refunds autonomously.' },
            { title: 'Cold Outreach Sequencing', dur: '5:40', desc: 'How to supply buyer personas to a sales agent so it can book meetings autonomously.' },
            { title: 'Plaid Statement Reconciliation', dur: '3:50', desc: 'Securely map business bank expenses directly to QuickBooks accounts.' }
          ].map((vid, i) => (
            <Card key={i} className="glass-elevated hover:border-zinc-800 p-5 flex flex-col justify-between">
              <div>
                <div className="relative h-28 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center mb-4 group select-none">
                  <PlayCircle className="h-10 w-10 text-brass-600 group-hover:text-brass-500 transition-colors group-hover:scale-105" />
                  <span className="absolute bottom-2 right-2 text-[9px] font-mono font-bold text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">{vid.dur}</span>
                </div>
                <h4 className="font-extrabold text-white text-sm leading-snug">{vid.title}</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{vid.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/30 flex justify-end select-none">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-zinc-800 text-zinc-300 text-[10px] font-bold h-7 px-2.5"
                  onClick={() => toast('Loading Video Lecture', { type: 'info' })}
                >
                  Watch Walkthrough
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ACCORDION FAQ AND TICKETS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        
        {/* FAQS Accordion */}
        <div id="faqs-anchor" className="space-y-4">
          <h3 className="text-base font-bold text-white">Interactive FAQs</h3>
          <div className="space-y-2.5">
            {filteredFaqs.map((faq) => (
              <div 
                key={faq.id} 
                className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/85"
              >
                <button
                  onClick={() => handleToggleFaq(faq.id)}
                  className="w-full p-4 flex justify-between items-center text-left hover:bg-zinc-900/40 select-none"
                  id={`faq-btn-${faq.id}`}
                >
                  <span className="text-xs font-extrabold text-white leading-snug pr-4">{faq.q}</span>
                  <span className="text-brass-500 font-black shrink-0">{faq.open ? '−' : '+'}</span>
                </button>
                {faq.open && (
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Feature requests upvoting list */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-brass-500" /> Feature Requests
            </h3>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Upvote options</span>
          </div>

          <div className="space-y-3">
            {featureRequests.map((req) => (
              <Card 
                key={req.id} 
                className="glass-elevated p-4 flex items-center justify-between gap-4"
                id={`feature-req-${req.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 select-none">
                    <span className="text-xs font-bold text-white">{req.title}</span>
                    {req.upvoted && <Badge className="bg-brass-600/10 text-brass-500 border border-brass-600/20 text-[8px] font-mono">UPVOTED</Badge>}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-normal">{req.desc}</p>
                </div>

                <button
                  onClick={() => handleUpvoteFeature(req.id, req.title, req.upvoted)}
                  className={`h-11 w-11 shrink-0 rounded-xl border flex flex-col items-center justify-center transition-all select-none ${req.upvoted ? 'bg-brass-700/10 border-brass-600 text-brass-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'}`}
                  title="Upvote Feature"
                  id={`upvote-btn-${req.id}`}
                >
                  <Heart className={`h-3 w-3 ${req.upvoted ? 'fill-current' : ''}`} />
                  <span className="text-[9px] font-mono font-bold mt-1">{req.votes}</span>
                </button>
              </Card>
            ))}
          </div>
        </div>

      </div>

      {/* CONTACT SUPPORT TICKET SUBMISSION FORM */}
      <Card className="glass-elevated p-6 max-w-2xl">
        <h3 className="text-base font-bold text-white mb-2">Escalate Human Support Ticket</h3>
        <p className="text-xs text-zinc-400 mb-5">Have a complex whitelisting question? Open a direct ticket to speak with our human account specialist.</p>
        
        <form onSubmit={handleSubmitTicket} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Case Subject</label>
              <input
                type="text"
                placeholder="e.g. Stripe checkout webhook sync"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs px-3.5 py-2.5 rounded-xl focus:border-brass-600 outline-none"
                id="ticket-subject-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Severity Level</label>
              <select 
                value={ticketSeverity}
                onChange={(e) => setTicketSeverity(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl p-2.5 focus:border-brass-600 outline-none"
                id="ticket-severity-select"
              >
                <option value="Low">Low - Casual query</option>
                <option value="Medium">Medium - Standard deployment</option>
                <option value="High">High - Production blocking</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Message Details</label>
            <textarea
              placeholder="Describe whitelisting limits or integration scopes..."
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs p-3.5 rounded-xl focus:border-brass-600 outline-none resize-none"
              id="ticket-message-input"
            />
          </div>

          <div className="flex justify-end select-none">
            <Button type="submit" variant="primary" className="bg-brass-700 hover:bg-brass-600 text-white font-bold text-xs rounded-xl px-4 py-2">
              Submit Secure Case File
            </Button>
          </div>
        </form>
      </Card>

      {/* COMMUNITY LINKS */}
      <div className="pt-4 select-none text-center">
        <p className="text-[11px] text-zinc-500">Owner community links will be added here soon.</p>
      </div>

    </div>
  );
}
