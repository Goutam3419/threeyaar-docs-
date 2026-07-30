# Aethera — AI Agent Marketplace: Full Project Report

**Stack:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4, Firebase (Auth, Firestore, Storage, Admin SDK), deployed on Vercel.

**Purpose of this document:** a complete, honest account of what has been built across 6 development phases, what is real vs. intentionally not-yet-built, and where the known gaps are — written for external technical review.

---

## 1. High-Level Architecture

```
app/
  page.tsx                 — public landing page (marketing, unauthenticated)
  auth/                    — login, signup, forgot/reset password, email verification, onboarding
  dashboard/page.tsx       — single-page authenticated app shell (all views are client-state tabs, not separate routes)
  api/
    connections/[provider]/ — OAuth authorize/callback/disconnect/refresh/test/save-key route handlers
    integration/diagnostics/ — Integration Engine test-center endpoint
    audit/ip/               — returns caller's real IP (server-side, for audit logging)

components/
  ui/                      — design system primitives (Button, Card, Table, Modal, etc.)
  views/                   — one component per dashboard tab (Marketplace, Billing, Connections, Admin, etc.)

lib/
  firebase/                — client SDK init (firebase.ts), Admin SDK init (admin.ts), auth.ts, firestore.ts, storage.ts
  providers/registry.ts    — metadata for 23 real OAuth/API-key providers
  crypto/tokenCrypto.ts    — AES-256-GCM token encryption (server-only)
  integration/             — the Universal Integration Engine (see §5)

services/                  — one file per domain; all Firestore reads/writes go through these
types/, models/            — shared TypeScript types and Firestore document factories
contexts/AuthContext.tsx   — the only source of truth for auth state app-wide
```

**Key architectural decision throughout:** every feature is built against **real Firebase**, with clearly-labeled exceptions where a genuine external dependency (a live payment charge, a registered OAuth app, a Firebase project) is required from the person deploying it. Nothing simulates data that should come from a database, and nothing fakes a network call.

---

## 2. Authentication & Authorization

- Firebase Auth: email/password + Google OAuth, real email verification (link-based, not a fake OTP), password reset via real `oobCode` verification.
- Session state lives in one place: `contexts/AuthContext.tsx`, subscribed via `onAuthStateChanged` + a live Firestore listener on the user's profile doc.
- Route protection is **client-side** (redirect-on-mount pattern), not middleware/cookie-based. This is the single biggest architectural simplification in the project — see §8.
- RBAC has two independent layers that a reviewer should not conflate:
  1. **Platform role** (`users/{uid}.role`: `admin` | `user`) — gates the Admin Panel.
  2. **Workspace role** (`workspaceMembers` collection: Owner/Admin/Manager/Member/Viewer) — gates team actions within a workspace, added in Phase 6.

---

## 3. Marketplace Engine

- `agents` Firestore collection, fully replacing static mock data. Real fields: pricing, tags, features, screenshots, reviews, status (draft/published/hidden), featured/popular flags.
- Real pagination (Firestore cursor-based `startAfter`), realtime first page, search/category/price/sort filters.
- Install/uninstall writes real `installedAgents` docs, deterministic doc IDs prevent duplicate installs.
- Favorites, Agent Details (with live related-agents query), Admin CRUD + image upload to Firebase Storage — all real.
- **Known gap:** Firestore composite indexes required for the filter/sort combinations are defined in `firestore.indexes.json` but must be deployed (`firebase deploy --only firestore:indexes`) before those queries will work in production — until then Firestore will error with a console link to auto-create them.

---

## 4. Connections Hub (OAuth)

- 23 providers researched against real, current OAuth documentation (endpoints verified via web search during development, not from memory alone).
- Real server-side token exchange (`app/api/connections/[provider]/*`), tokens encrypted (AES-256-GCM) before Firestore storage, split into a client-unreadable subcollection (`connections/{id}/secret/tokens`).
- Two providers (OpenAI, Anthropic) and effectively a third (Gemini) have **no OAuth for third-party apps** — implemented honestly as API-key connections instead of a fabricated OAuth redirect.
- Razorpay's OAuth is real but flagged as requiring Partner Program approval (not self-serve, unlike Stripe Connect) — the code is correct, the availability is gated by Razorpay, not by this app.
- **Known gap:** every provider requires the person deploying this to register a real OAuth app (client ID/secret) with that provider. Zero of these are pre-registered — this is expected and by design, not an oversight.

---

## 5. Universal Integration Engine

A provider-agnostic backend layer (`lib/integration/**`) that any future AI agent will call instead of talking to provider APIs directly:

- **Registry** — capabilities/operations/version per provider, built on top of the Connections registry.
- **Unified SDK** — `integration.github.get('/user')`, `integration.slack.post(...)` — generic HTTP primitives only, no business logic.
- **Token Manager** — auto-refreshes expired tokens, never returns a token outside a request header.
- **Permission Engine** — checks connection exists → provider enabled platform-wide → scopes granted, before every operation.
- **Health Engine** — live checks, 0–100 score, 6 status states.
- **Retry Engine** — exponential backoff, non-retryable errors fail fast.
- **Queue Engine** — Firestore-backed, 5 states tracked. **No worker loop runs anywhere** — deliberately, per the "no automation" boundary of that phase.
- **Logging Engine** — every operation logged, credential-shaped keys stripped defensively even though callers shouldn't pass them.

This is infrastructure with nothing plugged into it yet — no agent has been built that calls it.

---

## 6. Workspace, Billing & Notifications

- `workspaces` extended with plan/limits/usage/settings; `workspaceMembers` for real team invites with a 5-role permission matrix.
- `subscriptions` — real plan upgrade/downgrade/cancel/renew state. **No live payment is ever processed** — explicitly out of scope for this phase. `paymentHistory`/`invoices` collections exist and are ready for a future Stripe/Razorpay webhook handler to write into.
- Usage analytics: installed-agent and connection counts are **real**, derived live from their actual collections. AI-request/storage counters are real zeros, pending an execution layer.
- Notifications: realtime, unread count, mark read/all-read, delete — replacing what was fake local state through Phase 5.
- Audit log: admin-only (enforced in Firestore rules, not just UI), immutable, captures real IP (via a tiny server route, since browsers can't know their own public IP) and real user-agent.
- **Known gap:** login events are not written to the activity log — doing so would require touching `contexts/AuthContext.tsx`, which was out of scope for that phase and deliberately left alone rather than silently modified.

---

## 7. Security Model Summary

- Firestore Security Rules enforce: users can only read/write their own data; only `role: admin` can write agents/pricing/settings; **no client, including admin, can ever read a token** — that subcollection is `allow read, write: if false` for everyone except the Admin SDK.
- All OAuth client secrets, the token-encryption key, and the Firebase service account key are server-only environment variables — never in a client bundle.
- IDs and passwords are never logged; the Integration Engine's logger actively strips any credential-shaped key as a second line of defense.

---

## 8. Known Architectural Simplifications (flagged honestly, not hidden)

1. **Client-side route protection**, not Next.js middleware + server session cookies. Faster to build, weaker than SSR-level protection — a determined client could briefly see a flash of protected UI before the redirect fires, though no data is exposed since all real reads still go through Firestore rules.
2. **No background workers** — the Queue Engine (Phase 5) and any future async job all rely on something invoking them; nothing runs on a timer/cron yet.
3. **No live payments** — by explicit instruction across every phase. Billing is a fully real data model with a deliberately unconnected charge step.
4. **Plan IDs are loosely typed as `string`**, not a strict enum — a pragmatic choice to reuse the same plan list (`starter`/`growth`/`enterprise`) already shown on the public pricing page, rather than maintaining two parallel plan catalogs.
5. **Firestore composite indexes are defined but not deployed** — see §3.
6. **No AI agent has been built yet.** Every phase explicitly excluded AI execution/automation. The marketplace, connections, and integration engine are all real and working, but nothing autonomous runs on top of them yet.

---

## 9. Suggested Questions for an External Reviewer

- Is client-side-only route protection (§8.1) acceptable for this app's actual risk profile, or does it need Next.js middleware + cookie sessions before real users onboard?
- Are the Firestore Security Rules (§7) sufficiently tested against Firestore's actual rule evaluation semantics for `list` vs `get` operations, especially the `isActiveWorkspaceMember()` helper added in Phase 6?
- Does the encrypted-token architecture (§4) — a server-only subcollection rather than a field on the main doc — hold up under a formal threat model, or is there a simpler pattern worth switching to?
- Is the Integration Engine's generic `get/post/put/delete` SDK shape (§5) the right level of abstraction for the first real agent to be built against, or will it need typed, provider-specific methods sooner than expected?
