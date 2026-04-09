# BTC Quantum Check — _STATUS.md

## Project Overview
Single-page tool that classifies Bitcoin addresses by type and determines quantum vulnerability. Built as a top-of-funnel acquisition tool for 10AMPRO — shareable, zero-friction, no sign-up required.

**Live URL:** btcquantum.10am.pro (CNAME → btc-quantum-check.vercel.app)
**Repo:** 10amalpha/btc-quantum-check
**Stack:** Next.js (App Router), JSX with styled-jsx, static export
**Backend:** None — all classification is client-side

## What It Does
1. User pastes a BTC address (or raw public key hex)
2. Client-side regex classifies the address type (P2PK, P2PKH, P2SH, P2WPKH, P2WSH, P2TR)
3. Shows verdict: PROTEGIDA or VULNERABLE
4. Explains the diagnosis and recommended action in Spanish
5. Reference table of all 6 address types always visible
6. Luma event embed for Alpha 64 (quantum computing AMA with Camilo Gómez)
7. CTA → 10am.pro

## Address Type Classification Logic
| Type | Prefix/Pattern | Quantum Risk | Why |
|------|---------------|-------------|-----|
| P2PK | 04... (65B) or 02/03... (33B) hex | VULNERABLE | Raw public key exposed on-chain |
| P2PKH | 1... | Protected | Public key hashed, hidden until spend |
| P2SH | 3... | Protected | Script hashed, keys hidden until execution |
| P2WPKH | bc1q... (42 chars) | Protected | Native SegWit, key hashed |
| P2WSH | bc1q... (62 chars) | Protected | SegWit multisig, script hashed |
| P2TR | bc1p... (62 chars) | VULNERABLE | Taproot exposes tweaked public key on-chain |

**Key nuance:** "Protected" addresses become vulnerable if reused after spending (public key revealed in the spending transaction). The tool warns about this.

## Current Embeds
- **Luma event:** `https://lu.ma/embed/event/9limvw4n/simple` — Alpha 64: Google Quantum Computing paper AMA with Camilo Gómez
- **Future:** Substack AMA post embed when it goes live

## Custom Domain Setup
- GoDaddy CNAME: `btcquantum` → `btc-quantum-check.vercel.app`
- Vercel project domains: add `btcquantum.10am.pro`
- SSL: auto via Vercel

## Branding
Standard 10AMPRO: Space Grotesk 800 (10=gold, AM=green, PRO=gray), JetBrains Mono for mono elements, dark terminal aesthetic. Logo from `/public/logo.jpg` (44px circle).

## Deployment
- Push to `main` → Vercel auto-deploys
- Static site (no API routes, no ISR, no dynamic)
- Build: `npx next build`

## Mobile Responsive
- Breakpoint at 640px
- Luma iframe: 450px desktop → 350px mobile
- Input font, ref table, result card all scale down
- Single column, max-width 680px, 20px horizontal padding

## Lessons Learned
- Address classification is 100% deterministic from the prefix/encoding — no blockchain API needed for type detection
- Luma embeds work fine in standalone web apps (unlike Substack where iframes are blocked)
- The `lu.ma/embed/event/{id}/simple` format gives a clean minimal embed

## Future Ideas
- Add batch check (paste multiple addresses)
- On-chain lookup via public API to check if address has spent (revealing public key) — would upgrade "Protected" → "Protected but public key already exposed" for reused addresses
- Share result card as image (for social sharing)
- Track usage with simple Supabase counter
- Link directly to Cerebro / Alpha 64 recording when available

## Session Log
- **Apr 8, 2026:** Initial build and deploy. Classification logic for all 6 BTC address types. Luma Alpha 64 event embed added. Mobile responsive. Custom domain btcquantum.10am.pro configured.
