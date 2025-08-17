# Overview

This project implements a complete subscription cancellation flow for **Migrate Mate** with two branches:

- **Yes, I’ve found a job →** `CancelFlow.tsx`  
- **Not yet — I’m still looking →** `NoJobFlow.tsx`

The modal UI is pixel-aligned to the provided Figma screenshots on mobile and desktop, with progressive steps, deterministic A/B testing for a downsell offer, CSRF-protected API calls, and input validation.

---

## Architecture

**src/app/cancel/**
- `page.tsx` — Server: assigns A/B once, creates cancellation, marks sub pending  
- `CancellationRoot.tsx` — Client: intro screen, routes to Yes/No branches  
- `CancelFlow.tsx` — Client: YES branch (visa gate + finish screens)  
- `NoJobFlow.tsx` — Client: NO branch (offer → usage → reasons → finish)  

**lib/**
- `ab.ts` — secure 50/50 RNG (persisted), `Variant` type  
- `validation.ts` — Zod schemas for finalize/downsell payloads  
- `supabaseServer.ts` — server-side Supabase admin client  

**api/**
- `/api/csrf` — returns CSRF token  
- `/api/cancel/submit` — finalize cancellation payload  
- `/api/cancel/downsell` — logs downsell acceptance  

---

## Flow Entry / Persistence (Server)

**`page.tsx`:**
- Fetches the user’s latest active/pending subscription.  
- Deterministically assigns variant with `secureAB()` only on first entry.  
- Persists `cancellations.downsell_variant` and sets subscription status = `pending_cancellation`.  
- Computes UI prices:  
  - **Control:** $25 / $29  
  - **Variant B:** 50% off ($12.50 / $14.50)  

---

## Routing (Client)

`CancellationRoot.tsx` renders the intro screen (single place).  

On click:  
- **Yes →** `<CancelFlow initialStep="yes_survey" … />`  
- **Not yet →** `<NoJobFlow … />`  

*Intro is only in `CancellationRoot` to avoid duplicate first-screen bug.*

---

## YES Branch (`CancelFlow.tsx`)

**Steps**
1. Survey (applied / emailed / interviewed + “found via MM”).  
2. Free-text feedback (min 25 chars).  
3. Visa gate → company lawyer (yes/no) → collect visa type.  
4. Finish: either standard congratulations or Mihailo card.  

**On complete → POST** `/api/cancel/submit` **with:**
```json
{
  "reasonKey": "job_found_with_mm_company_yes|no",
  "reasonText": { "survey": "...", "feedback": "...", "visa": "..." }
}
```
## NO Branch (`NoJobFlow.tsx`)

### Variants
- **Variant A:** skips **Offer** → starts at **Usage**.
- **Variant B:** starts at **Offer** (50% off).

### Steps
1. **Offer (B only)**
   - “Get 50% off” → `POST /api/cancel/downsell` → light confirmation → curated jobs screen → exit to profile.
2. **Usage**
   - required: applied / emailed / interviewed.
3. **Reasons**
   - choose one, then reason-specific follow-up:
     - **Too expensive** → numeric max price  
     - **Platform not helpful / Not enough relevant jobs / Decided not to move / Other** → min 25-char text
4. **Finish**
   - confirms cancellation; redirects with `?canceled=1`.

**On complete → POST** `/api/cancel/submit` **with:**
```json
{
  "reasonKey": "selected_reason",
  "reasonText": { "usage": "...", "detail": "..." }
}
```
## A/B Testing (Deterministic 50/50)

- First entry only: `secureAB()` (crypto RNG) picks **A** or **B**.  
- Persisted to `cancellations.downsell_variant`; never re-randomized.  
- **Variant A:** no downsell.  
- **Variant B:** 50% off UI; acceptance only logs & returns to profile (no billing).

---

## Security

- **RLS:** enforced on `subscriptions` and `cancellations`.  
- **Validation:** all client submissions use Zod (`validation.ts`).  
- **CSRF:** `/api/csrf` token required on all POSTs.  
- **XSS:** free-text is sent as JSON; never injected raw.

---

## Running Locally

```bash
npm install
npm run db:setup   # starts Supabase containers + seeds database from seed.sql
npm run dev
# open http://localhost:3000/cancel
```
## Test Checklist

- [x] A/B persists across reloads  
- [x] Variant A: Offer skipped → usage → reasons → finish  
- [x] Variant B: Offer shows → accept logs & exits; decline continues  
- [x] YES branch: back buttons, min-length validation, visa gate paths  
- [x] All POSTs require CSRF and pass Zod validation  

---

## Notes

- Tailwind classes mirror Figma spacing, weight, and line-height.  
- All headers include the 3-dot stepper or “Completed” bars like in design.
