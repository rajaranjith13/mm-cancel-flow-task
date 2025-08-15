'use client'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { finalizeSchema, downsellSchema } from '@/lib/validation'

type Props = {
  variant: 'A' | 'B'
  cancellationId: string
  plan: string
  priceCents: number
  renewsAt?: string
  pending: boolean
  // ⬇️ csrfToken removed from props
  prices: { control: { monthly: number; annual: number }; b: { monthly: number; annual: number } }
}

const TEXT = {
  modalTitle: 'Subscription Cancellation',
  introHeaderL1: 'Hey mate,',
  introHeaderL2: 'Quick one before you go.',
  introQuestion: 'Have you found a job yet?',
  introBody: 'Whatever your answer, we just want to help you take the next step. With visa support, or by hearing how we can do better.',
  yesBtn: "Yes, I’ve found a job",
  noBtn: "Not yet — I’m still looking",
  yesTitle: 'Congrats on the new role! 🎉',
  yesBody: 'We’re stoked for you. Before you go, what’s one thing you wish we could’ve helped with?',
  yesPlaceholder: 'Type a short note (optional)…',
  yesCta: 'Finish',
  offerTitle: 'We built this to help you land the job, this makes it a little easier.',
  offerBody: 'We’ve been there and we’re here to help you.',
  offerAcceptA: 'Stick around (standard pricing)',
  offerAcceptB: 'Get $10 off until you find a job',
  offerDecline: 'No thanks',
  acceptedTitle: 'Great choice, mate!',
  acceptedBody: 'You’re still on the path to your dream role. Let’s make it happen together!',
  acceptedCta: 'Let’s keep this going',
  reasonTitle: "What's the main reason for canceling?",
  reasonCTA: 'Complete cancellation',
  reasonKeepCTA: 'OK I’ll stay ($ off)',
}

const REASONS = [
  { key: 'too_expensive', label: 'It’s too expensive' },
  { key: 'not_using', label: 'I don’t use it enough' },
  { key: 'missing_features', label: 'Missing a feature I need' },
  { key: 'technical_issues', label: 'Technical issues' },
  { key: 'other', label: 'Other' },
]

type Step = 'intro' | 'yes_congrats' | 'yes_feedback' | 'offer' | 'accepted' | 'reasons' | 'done'

export default function CancelFlow(p: Props) {
  const [step, setStep] = useState<Step>('intro')
  const [reasonKey, setReasonKey] = useState('too_expensive')
  const [reasonText, setReasonText] = useState('')
  const [freeText, setFreeText] = useState('')
  const [loading, setLoading] = useState(false)

  // ⬇️ NEW: fetch CSRF token on mount
  const [csrfToken, setCsrfToken] = useState<string>('')
  useEffect(() => {
    let alive = true
    fetch('/api/csrf')
      .then(r => r.json())
      .then(j => { if (alive) setCsrfToken(j.token) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const isVariantB = p.variant === 'B'
  const prices = isVariantB ? p.prices.b : p.prices.control

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-3 md:p-8">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="border-b px-6 py-3 md:px-8 flex justify-center items-center relative">
          <div className="text-lg font-semibold text-gray-800">{TEXT.modalTitle}</div>
          <button
            className="absolute right-6 rounded-full p-1 text-gray-500 hover:bg-gray-100"
            onClick={() => (window.location.href = '/')}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2 md:p-8">
          {/* Left */}
          <div className="flex flex-col">
            {step === 'intro' && <IntroCard onYes={() => setStep('yes_congrats')} onNo={() => setStep('offer')} />}
            {step === 'yes_congrats' && <YesCongrats onNext={() => setStep('yes_feedback')} />}
            {step === 'yes_feedback' && (
              <YesFeedback
                freeText={freeText}
                setFreeText={setFreeText}
                loading={loading || !csrfToken}
                onSubmit={async () => {
                  if (!csrfToken) return
                  setLoading(true)
                  await acceptDownsell({ reasonKey: 'job_found', reasonText: freeText })
                  setLoading(false)
                  setStep('done')
                  window.location.href='/?kept=1'
                }}
              />
            )}
            {step === 'offer' && (
              <OfferCard
                isB={isVariantB}
                prices={prices}
                onAccept={async () => {
                  if (!csrfToken) return
                  setLoading(true)
                  await acceptDownsell({ reasonKey, reasonText })
                  setLoading(false)
                  setStep('accepted')
                }}
                onDecline={() => setStep('reasons')}
              />
            )}
            {step === 'accepted' && <AcceptedCard onFinish={() => (window.location.href='/?kept=1')} />}
            {step === 'reasons' && (
              <ReasonForm
                reasonKey={reasonKey}
                setReasonKey={setReasonKey}
                reasonText={reasonText}
                setReasonText={setReasonText}
                isB={isVariantB}
                loading={loading || !csrfToken}
                onKeep={async () => {
                  if (!csrfToken) return
                  setLoading(true)
                  await acceptDownsell({ reasonKey, reasonText })
                  setLoading(false)
                  window.location.href='/?kept=1'
                }}
                onCancel={finalize}
              />
            )}
          </div>

          {/* Right: skyline image */}
          <div className="order-first overflow-hidden rounded-xl md:order-none">
            <Image src="/hero-main.jpg" alt="City skyline" width={1200} height={900} priority className="h-56 w-full rounded-xl object-cover md:h-full" />
          </div>
        </div>
      </div>
    </div>
  )

  // --- helpers use the csrfToken from state ---
  async function finalize() {
    if (!csrfToken) return
    setLoading(true)
    const body = { cancellationId: p.cancellationId, csrfToken, reasonKey, reasonText }
    const parsed = finalizeSchema.safeParse(body)
    if (!parsed.success) { setLoading(false); alert('Invalid input.'); return }
    const res = await fetch('/api/cancel/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(parsed.data) })
    setLoading(false)
    if (!res.ok) alert('Something went wrong. Please retry.'); else window.location.href='/?canceled=1'
  }

  async function acceptDownsell(extra: { reasonKey: string; reasonText?: string }) {
    if (!csrfToken) return
    const body = { cancellationId: p.cancellationId, csrfToken, reasonKey: extra.reasonKey, reasonText: extra.reasonText ?? '' }
    const parsed = downsellSchema.safeParse(body)
    if (!parsed.success) { alert('Invalid input.'); return }
    const res = await fetch('/api/cancel/downsell', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(parsed.data) })
    if (!res.ok) alert('Could not apply the offer. Try again.')
  }
}

/* subcomponents */
function IntroCard({ onYes, onNo }: { onYes: () => void; onNo: () => void }) { return (<>
  <h1 className="text-2xl font-extrabold leading-tight text-gray-900 md:text-3xl"><span className="block">Hey mate,</span><span className="block">Quick one before you go.</span></h1>
  <p className="mt-3 text-xl italic text-gray-900 md:text-2xl">{TEXT.introQuestion}</p>
  <p className="mt-3 max-w-prose text-gray-600">{TEXT.introBody}</p>
  <div className="mt-6 space-y-3">
    <button onClick={onYes} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center hover:bg-gray-50">
      {TEXT.yesBtn}
    </button>
    <button onClick={onNo} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center hover:bg-gray-50">
      {TEXT.noBtn}
    </button>
  </div>
</>) }

function YesCongrats({ onNext }: { onNext: () => void }) { return (<>
  <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">{TEXT.yesTitle}</h2>
  <p className="mt-2 text-gray-600">{TEXT.yesBody}</p>
  <div className="mt-6"><button onClick={onNext} className="w-full rounded-xl border border-gray-300 px-4 py-3 hover:bg-gray-50">Continue</button></div>
</>) }

function YesFeedback({ freeText, setFreeText, loading, onSubmit }: { freeText: string; setFreeText: (v: string) => void; loading: boolean; onSubmit: () => Promise<void> | void }) { return (<>
  <h3 className="text-2xl font-semibold text-gray-900 md:text-3xl">{TEXT.yesTitle}</h3>
  <p className="mt-2 text-gray-600">{TEXT.yesBody}</p>
  <textarea value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder={TEXT.yesPlaceholder} maxLength={500} className="mt-4 h-28 w-full resize-none rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-violet-600" />
  <button disabled={loading} onClick={onSubmit} className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-60">{loading ? 'Saving…' : TEXT.yesCta}</button>
</>) }

function OfferCard({ isB, prices, onAccept, onDecline }: { isB: boolean; prices: { monthly: number; annual: number }; onAccept: () => Promise<void> | void; onDecline: () => void }) { return (<>
  <button onClick={onDecline} className="mb-4 w-fit text-sm text-gray-500 hover:text-gray-900">← Back</button>
  <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">{TEXT.offerTitle}</h2>
  <p className="mt-2 text-gray-600">{TEXT.offerBody}</p>
  <div className="mt-5 space-y-3">
    <button onClick={onAccept} className="w-full rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700">
      {isB ? `${TEXT.offerAcceptB} — $${prices.monthly}/mo (was $25) / $${prices.annual}/mo (was $29)` : TEXT.offerAcceptA}
    </button>
    <button onClick={onDecline} className="w-full rounded-xl border border-gray-300 px-4 py-3 hover:bg-gray-50">{TEXT.offerDecline}</button>
  </div>
</>) }

function AcceptedCard({ onFinish }: { onFinish: () => void }) { return (<>
  <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">{TEXT.acceptedTitle}</h2>
  <p className="mt-2 text-gray-600">{TEXT.acceptedBody}</p>
  <button onClick={onFinish} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700">{TEXT.acceptedCta}</button>
</>) }

function ReasonForm({ reasonKey, setReasonKey, reasonText, setReasonText, isB, loading, onKeep, onCancel }:
{ reasonKey: string; setReasonKey: (v: string) => void; reasonText: string; setReasonText: (v: string) => void; isB: boolean; loading: boolean; onKeep: () => Promise<void> | void; onCancel: () => Promise<void> | void }) { return (<>
  <button onClick={() => history.back()} className="mb-4 w-fit text-sm text-gray-500 hover:text-gray-900">← Back</button>
  <h3 className="text-2xl font-semibold text-gray-900 md:text-3xl">{TEXT.reasonTitle}</h3>
  <div className="mt-4 space-y-3">
    {REASONS.map((r) => (
      <label key={r.key} className="flex items-center gap-3">
        <input type="radio" name="reason" value={r.key} checked={reasonKey === r.key} onChange={() => setReasonKey(r.key)} />
        <span>{r.label}</span>
      </label>
    ))}
  </div>
  <textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} placeholder="Anything else you’d like to share? (optional)" maxLength={500} className="mt-4 h-28 w-full resize-none rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-violet-600" />
  <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
    {isB && <button onClick={onKeep} className="rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700">{TEXT.reasonKeepCTA}</button>}
    <button disabled={loading} onClick={onCancel} className="rounded-xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-60">{loading ? 'Canceling…' : TEXT.reasonCTA}</button>
  </div>
</>) }
