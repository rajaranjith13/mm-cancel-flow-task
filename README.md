Overview

This project implements a complete subscription cancellation flow for Migrate Mate with two branches:

Yes, I’ve found a job → CancelFlow.tsx

Not yet — I’m still looking → NoJobFlow.tsx

The modal UI is pixel-aligned to the provided Figma screenshots on mobile and desktop, with progressive steps, deterministic A/B testing for a downsell offer, CSRF-protected API calls, and input validation.

Architecture
src/app/cancel/
  page.tsx              // Server: assigns A/B once, creates cancellation, marks sub pending
  CancellationRoot.tsx  // Client: intro screen, routes to Yes/No branches
  CancelFlow.tsx        // Client: YES branch (visa gate + finish screens)
  NoJobFlow.tsx         // Client: NO branch (offer → usage → reasons → finish)

lib/
  ab.ts                 // secure 50/50 RNG (persisted), Variant type
  validation.ts         // zod schemas for finalize/downsell payloads
  supabaseServer.ts     // server-side supabase admin client

api/
  /api/csrf             // returns CSRF token
  /api/cancel/submit    // finalize cancellation payload
  /api/cancel/downsell  // logs downsell acceptance

Flow Entry / Persistence (server)

page.tsx:

Fetches the user’s latest active/pending subscription.

Deterministically assigns variant with secureAB() only on first entry.

Persists cancellations.downsell_variant and sets subscription status = 'pending_cancellation'.

Computes UI prices:

Control: $25 / $29

Variant B: 50% off ($12.50 / $14.50)

Routing (client)

CancellationRoot.tsx renders the intro screen (single place).

On click:

Yes → <CancelFlow initialStep="yes_survey" … />

Not yet → <NoJobFlow … />

(Intro is only in CancellationRoot to avoid duplicate first screen bug.)

YES Branch (CancelFlow.tsx)

Steps:

Survey (applied/emailed/interviewed + “found via MM”).

Free-text feedback (min 25 chars).

Visa gate → company lawyer (yes/no) → collect visa type.

Finish: either standard congratulations or Mihailo card.

On complete:
POST /api/cancel/submit with validated body:

{
  "reasonKey": "job_found_with_mm_company_yes|no",
  "reasonText": { "survey": "...", "feedback": "...", "visa": "..." }
}

NO Branch (NoJobFlow.tsx)

Variant logic:

Variant A: skips offer → starts at Usage.

Variant B: starts at Offer (50% off).

Steps:

Offer (B only):

“Get 50% off” → POST /api/cancel/downsell → light confirmation → curated jobs screen → back to profile.

Usage: applied/emailed/interviewed (required).

Reasons: choose one, then reason-specific follow-up:

Too expensive → numeric max price.

Platform not helpful / Not enough relevant jobs / Decided not to move / Other → 25-char min text.

Finish: confirms cancellation; routes back with ?canceled=1.

On complete:
POST /api/cancel/submit with:

{
  "reasonKey": "selected_reason",
  "reasonText": { "usage": "...", "detail": "..." }
}

A/B Testing (Deterministic 50/50)

First entry only: secureAB() (crypto RNG) picks A or B.

Persisted to cancellations.downsell_variant.

Never re-randomized; reused on every return visit.

Variant A: no downsell.

Variant B: 50% off UI; acceptance only logs & returns to profile (no billing).

Security

RLS: enforced on subscriptions and cancellations.

Validation: all client submissions use Zod (validation.ts).

CSRF: /api/csrf token required in all POSTs.

XSS: free-text sent as JSON; never injected raw.

Running Locally
npm install
npm run db:setup   # seeds database from seed.sql
npm run dev


Open: http://localhost:3000/cancel

Test Checklist

 A/B persists across reloads

 Variant A: Offer skipped → usage → reasons → finish

 Variant B: Offer shows → accept logs & exits; decline continues

 YES branch: back buttons, min-length validation, visa gate paths

 All POSTs require CSRF + pass Zod validation

Notes

Tailwind classes mirror Figma spacing/weight/line-height.

All headers include the 3-dot stepper or “Completed” bars like in design.
