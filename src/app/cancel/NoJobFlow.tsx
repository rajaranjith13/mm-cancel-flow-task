'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState, ReactNode } from 'react'
import { finalizeSchema, downsellSchema } from '@/lib/validation'

type Props = {
  variant: 'A' | 'B'
  cancellationId: string
  plan: string
  priceCents: number
  renewsAt?: string
  pending: boolean
  prices: { control: { monthly: number; annual: number }; b: { monthly: number; annual: number } }
}

type Range = string
const RANGE_DEFAULT: Range[]   = ['0', '1–5', '6–20', '20+']
const RANGE_INTERVIEW: Range[] = ['0', '1–2', '3–5', '5+']

type ReasonKey =
  | 'too_expensive'
  | 'platform_not_helpful'
  | 'not_enough_relevant_jobs'
  | 'decided_not_to_move'
  | 'other'

type Step =
  | 'offer'
  | 'accepted_confirm'
  | 'accepted_jobs'
  | 'usage_short'
  | 'usage_plus_reason'
  | 'reasons'
  | 'reason_too_expensive'
  | 'reason_platform'
  | 'reason_not_relevant'
  | 'reason_decided'
  | 'reason_other'
  | 'finish'

const TEXT = {
  modalTitle: 'Subscription Cancellation',
  continuedTitle: 'Subscription Continued',
  cancelledTitle: 'Subscription Cancelled',

  offerTitle: 'We built this to help you land the job, this makes it a little easier.',
  offerBody: "We’ve been there and we’re here to help you.",
  getOffCTA: 'Get 50% off',
  noThanks: 'No thanks',

  acceptedH1: 'Great choice, mate!',
  acceptedBody: "You’re still on the path to your dream role. Let’s make it happen together!",
  acceptedCTA: 'Land your dream role',

  usageH1: 'Help us understand how you were using Migrate Mate.',
  usageCoach: "Mind letting us know why you’re cancelling? It helps us understand your experience and improve the platform.*",
  usageOfferInline: (priceNow: string, was: number) => `Get 50% off | $${priceNow} $${was}`,

  reasonsH1: "What’s the main reason for cancelling?",
  reasonsSub: 'Please take a minute to let us know why:',
  reasonsNeedSelect: 'To help us understand your experience, please select a reason for cancelling*',

  reasonTooExp: 'Too expensive',
  reasonPlatform: 'Platform not helpful',
  reasonNotRelevant: 'Not enough relevant jobs',
  reasonDecided: 'Decided not to move',
  reasonOther: 'Other',

  min25: 'Min 25 characters',
  please25: 'Please enter at least 25 characters so we can understand your feedback*',
  completeCancel: 'Complete cancellation',

  finishH1: 'Sorry to see you go, mate.',
  finishBody1: "Thanks for being with us, and you’re always welcome back.",
  finishBody2: "Your subscription is set to end on XX date. You’ll still have full access until then. No further charges after that.",
  finishFoot: 'Changed your mind? You can reactivate anytime before your end date.',
  backToJobs: 'Back to Jobs',
}

export default function NoJobFlow(p: Props) {
  const controlMonthly = p.prices.control.monthly
  const priceNow = (controlMonthly / 2).toFixed(2)

  const [step, setStep] = useState<Step>(p.variant === 'B' ? 'offer' : 'usage_short')
  const [csrfToken, setCsrfToken] = useState('')

  useEffect(() => {
    let dead = false
    fetch('/api/csrf')
      .then(r => r.json())
      .then(j => { if (!dead) setCsrfToken(j.token || '') })
      .catch(() => {})
    return () => { dead = true }
  }, [])

  // usage ranges
  const [appliedRange, setAppliedRange] = useState<Range | null>(null)
  const [emailedRange, setEmailedRange] = useState<Range | null>(null)
  const [interviewedRange, setInterviewedRange] = useState<Range | null>(null)
  const usageValid = useMemo(
    () => !!(appliedRange && emailedRange && interviewedRange),
    [appliedRange, emailedRange, interviewedRange]
  )
  const [usageTried, setUsageTried] = useState(false)

  // reasons + details
  const [reasonKey, setReasonKey] = useState<ReasonKey | ''>('')
  const [reasonText, setReasonText] = useState('')
  const min25 = reasonText.trim().length >= 25
  const [loading, setLoading] = useState(false)

  const isAccepted = step === 'accepted_confirm' || step === 'accepted_jobs'
  const isFinished = step === 'finish'
  const headerStepIndex =
    step === 'offer' ? 1 :
    step === 'usage_short' || step === 'usage_plus_reason' ? 2 :
    step === 'reasons' ||
    step === 'reason_too_expensive' ||
    step === 'reason_platform' ||
    step === 'reason_not_relevant' ||
    step === 'reason_decided' ||
    step === 'reason_other' ? 3 : 3

  function goBack() {
    if (step === 'offer') return window.location.reload()
    if (step === 'usage_short') return setStep(p.variant === 'B' ? 'offer' : 'usage_short')
    if (step === 'usage_plus_reason') return setStep('usage_short')
    if (step === 'reasons') return setStep('usage_plus_reason')
    if (
      step === 'reason_too_expensive' ||
      step === 'reason_platform' ||
      step === 'reason_not_relevant' ||
      step === 'reason_decided' ||
      step === 'reason_other'
    ) return setStep('reasons')
    if (isAccepted) return (window.location.href = '/?kept=1')
  }

  async function handleAccept() {
    if (!csrfToken) return
    setLoading(true)
    const body = { cancellationId: p.cancellationId, csrfToken, reasonKey: 'accepted_downsell', reasonText: '' }
    const parsed = downsellSchema.safeParse(body)
    if (!parsed.success) { setLoading(false); return }
    await fetch('/api/cancel/downsell', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed.data),
    }).catch(() => {})
    setLoading(false)
    setStep('accepted_confirm')
  }

  function proceedFromReasons() {
    if (!reasonKey) return
    if (reasonKey === 'too_expensive') return setStep('reason_too_expensive')
    if (reasonKey === 'platform_not_helpful') return setStep('reason_platform')
    if (reasonKey === 'not_enough_relevant_jobs') return setStep('reason_not_relevant')
    if (reasonKey === 'decided_not_to_move') return setStep('reason_decided')
    return setStep('reason_other')
  }

  async function completeCancellation(extraDetail: string) {
    if (!csrfToken) return
    setLoading(true)
    const payload = {
      cancellationId: p.cancellationId,
      csrfToken,
      reasonKey: reasonKey || 'other',
      reasonText: JSON.stringify({
        usage: { appliedRange, emailedRange, interviewedRange },
        detail: extraDetail.trim(),
      }),
    }
    const parsed = finalizeSchema.safeParse(payload)
    if (!parsed.success) { setLoading(false); return }
    const res = await fetch('/api/cancel/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })
    setLoading(false)
    if (res.ok) setStep('finish')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 md:p-8">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="relative flex items-center justify-center border-b px-6 py-3 md:px-8">
          {!isFinished ? (
            <button onClick={goBack} className="absolute left-6 text-sm text-gray-600 hover:text-gray-900">{'<'} Back</button>
          ) : <span className="absolute left-6 w-[56px]" />}

          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-800">
              {isFinished ? TEXT.cancelledTitle : isAccepted ? TEXT.continuedTitle : TEXT.modalTitle}
            </div>

            {isFinished ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {[1,2,3].map(n => <span key={n} className="h-1.5 w-6 rounded-full bg-emerald-500" />)}
                <span>Completed</span>
              </div>
            ) : !isAccepted && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {[1,2,3].map(n => {
                  const cls = n < headerStepIndex ? 'bg-emerald-500' : n === headerStepIndex ? 'bg-gray-400' : 'bg-gray-300'
                  return <span key={n} className={`h-1.5 w-6 rounded-full ${cls}`} />
                })}
                <span>Step {headerStepIndex} of 3</span>
              </div>
            )}
          </div>

          <button onClick={() => (window.location.href = '/')} className="absolute right-6 rounded-full p-1 text-gray-500 hover:bg-gray-100">×</button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2 md:p-8">
          <div className="flex flex-col">

            {/* 1. Offer (Variant B only) */}
            {step === 'offer' && (
              <OfferCard
                priceNow={priceNow}
                was={controlMonthly}
                onAccept={handleAccept}
                onDecline={() => setStep('usage_short')}
              />
            )}

            {/* 2. Offer accepted confirmation */}
            {step === 'accepted_confirm' && (
              <AcceptedConfirm onNext={() => setStep('accepted_jobs')} />
            )}

            {/* 3. Offer accepted – jobs feed */}
            {step === 'accepted_jobs' && (
              <AcceptedJobs onExit={() => (window.location.href = '/?kept=1')} />
            )}

            {/* 4. Usage survey (short) – no coach line */}
            {step === 'usage_short' && (
              <UsageScreen
                title={TEXT.usageH1}
                coachLine=""
                appliedRange={appliedRange} setAppliedRange={setAppliedRange}
                emailedRange={emailedRange} setEmailedRange={setEmailedRange}
                interviewedRange={interviewedRange} setInterviewedRange={setInterviewedRange}
                tried={usageTried}
                priceNow={priceNow}
                was={controlMonthly}
                onOfferClick={handleAccept}
                onContinue={() => {
                  setUsageTried(true)
                  setStep('usage_plus_reason')
                }}
              />
            )}

            {/* 5. Usage survey + coach line */}
            {step === 'usage_plus_reason' && (
              <UsageScreen
                title={TEXT.usageH1}
                coachLine={TEXT.usageCoach}
                appliedRange={appliedRange} setAppliedRange={setAppliedRange}
                emailedRange={emailedRange} setEmailedRange={setEmailedRange}
                interviewedRange={interviewedRange} setInterviewedRange={setInterviewedRange}
                tried={usageTried}
                priceNow={priceNow}
                was={controlMonthly}
                onOfferClick={handleAccept}
                onContinue={() => {
                  if (!usageValid) { setUsageTried(true); return }
                  setStep('reasons')
                }}
              />
            )}

            {/* 6. Choose reason */}
            {step === 'reasons' && (
              <ReasonsChooser
                reasonKey={reasonKey}
                setReasonKey={(k) => setReasonKey(k)}
                priceNow={priceNow}
                was={controlMonthly}
                onOfferClick={handleAccept}
                onProceed={proceedFromReasons}
              />
            )}

            {/* 7–11. Reason detail screens */}
            {step === 'reason_too_expensive' && (
              <ReasonFollowUp
                heading={TEXT.reasonsH1}
                sub="Please take a minute to let us know why:"
                radioLabel={TEXT.reasonTooExp}
                prompt="What would be the maximum you would be willing to pay?*"
                priceNow={priceNow}
                was={controlMonthly}
                text={reasonText}
                setText={setReasonText}
                showCharCount={false}
                error={reasonText.trim() === ''}
                errorMsg="Please add a price so we can understand."
                onOfferClick={handleAccept}
                onComplete={() => {
                  if (!reasonText.trim()) return
                  completeCancellation(reasonText)
                }}
                loading={loading}
                inputKind="money"
              />
            )}

            {step === 'reason_platform' && (
              <ReasonFollowUp
                heading="What’s the main reason?"
                sub="Please take a minute to let us know why:"
                radioLabel={TEXT.reasonPlatform}
                prompt="What can we change to make the platform more helpful?*"
                priceNow={priceNow}
                was={controlMonthly}
                text={reasonText}
                setText={setReasonText}
                showCharCount
                error={!min25}
                errorMsg={TEXT.please25}
                onOfferClick={handleAccept}
                onComplete={() => {
                  if (!min25) return
                  completeCancellation(reasonText)
                }}
                loading={loading}
              />
            )}

            {step === 'reason_not_relevant' && (
              <ReasonFollowUp
                heading="What’s the main reason?"
                sub="Please take a minute to let us know why:"
                radioLabel={TEXT.reasonNotRelevant}
                prompt="In which way can we make the jobs more relevant?*"
                priceNow={priceNow}
                was={controlMonthly}
                text={reasonText}
                setText={setReasonText}
                showCharCount
                error={!min25}
                errorMsg={TEXT.please25}
                onOfferClick={handleAccept}
                onComplete={() => {
                  if (!min25) return
                  completeCancellation(reasonText)
                }}
                loading={loading}
              />
            )}

            {step === 'reason_decided' && (
              <ReasonFollowUp
                heading="What’s the main reason?"
                sub="Please take a minute to let us know why:"
                radioLabel={TEXT.reasonDecided}
                prompt="What changed for you to decide to not move?*"
                priceNow={priceNow}
                was={controlMonthly}
                text={reasonText}
                setText={setReasonText}
                showCharCount
                error={!min25}
                errorMsg={TEXT.please25}
                onOfferClick={handleAccept}
                onComplete={() => {
                  if (!min25) return
                  completeCancellation(reasonText)
                }}
                loading={loading}
              />
            )}

            {step === 'reason_other' && (
              <ReasonFollowUp
                heading="What’s the main reason?"
                sub="Please take a minute to let us know why:"
                radioLabel={TEXT.reasonOther}
                prompt="What would have helped you the most?*"
                priceNow={priceNow}
                was={controlMonthly}
                text={reasonText}
                setText={setReasonText}
                showCharCount
                error={!min25}
                errorMsg={TEXT.please25}
                onOfferClick={handleAccept}
                onComplete={() => {
                  if (!min25) return
                  completeCancellation(reasonText)
                }}
                loading={loading}
              />
            )}

            {/* 12. Finish */}
            {step === 'finish' && (
              <FinishCard onBackToJobs={() => (window.location.href = '/?canceled=1')} />
            )}
          </div>

          <div className="order-first overflow-hidden rounded-xl md:order-none">
            <Image
              src="/hero-main.jpg"
              alt="City skyline"
              width={1200}
              height={900}
              priority
              className="h-56 w-full rounded-xl object-cover md:h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ——— pieces ——— */

function Header({ title }: { title: string }) {
  return <h2 className="mb-4 text-2xl font-semibold text-gray-900 md:text-3xl">{title}</h2>
}

function OfferCard({
  priceNow, was, onAccept, onDecline,
}: { priceNow: string; was: number; onAccept: () => void; onDecline: () => void }) {
  return (
    <>
      <Header title={TEXT.offerTitle} />
      <p className="mt-1 text-gray-600">{TEXT.offerBody}</p>
      <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-100/70 p-4">
        <div className="text-lg">
          Here’s <span className="font-semibold underline">50% off</span> until you find a job.
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <div className="text-xl font-semibold text-violet-700">${priceNow}<span className="text-base font-normal">/month</span></div>
          <div className="text-sm text-gray-500 line-through">${was}/month</div>
        </div>
        <button onClick={onAccept} className="mt-3 w-full rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700">
          {TEXT.getOffCTA}
        </button>
        <div className="mt-2 text-center text-xs text-gray-500">You won’t be charged until your next billing date.</div>
      </div>

      <button onClick={onDecline} className="mt-5 w-full rounded-xl border border-gray-300 px-4 py-3 hover:bg-gray-50">
        {TEXT.noThanks}
      </button>
    </>
  )
}

function AcceptedConfirm({ onNext }: { onNext: () => void }) {
  return (
    <>
      <Header title={TEXT.acceptedH1} />
      <p className="mt-2 text-gray-600">{TEXT.acceptedBody}</p>
      <p className="mt-4 text-sm text-gray-600">
        You’ve got XX days left on your current plan. Starting from XX date, your monthly payment will be $12.50.
      </p>
      <button onClick={onNext} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700">
        {TEXT.acceptedCTA}
      </button>
    </>
  )
}

function AcceptedJobs({ onExit }: { onExit: () => void }) {
  return (
    <>
      <Header title="Awesome — we’ve pulled together a few roles that seem like a great fit for you." />
      <p className="text-gray-600">Take a look and see what sparks your interest.</p>

      <div className="mt-5 rounded-2xl border p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 h-10 w-10 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="text-sm font-medium">Automation Controls Engineer</div>
            <div className="text-xs text-gray-600">Randstad USA • Memphis, Tennessee</div>

            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-700">
              <span className="rounded-full border px-2 py-0.5">Full Time</span>
              <span className="rounded-full border px-2 py-0.5">Associate</span>
              <span className="rounded-full border px-2 py-0.5">Bachelor's</span>
              <span className="rounded-full border px-2 py-0.5">On-site</span>
              <span className="rounded-full border px-2 py-0.5">NEW JOB</span>
            </div>

            <div className="mt-2 text-sm">$150,000/yr – $170,000/yr</div>
            <div className="mt-2 text-[11px] text-gray-600">Visas sponsored by company in the last year • Green Card • H-1B • TN • OPT</div>

            <p className="mt-3 line-clamp-3 text-sm text-gray-700">
              The Electrical Automation Controls Engineer will design, implement, and maintain industrial automation systems,
              specializing in PLC programming using Siemens TIA Portal. The ideal candidate should have a Bachelor's degree in
              Electrical Engineering and at least 4 years of experience. Key benefits include comprehensive healthcare and retirement plans.
            </p>

            <div className="mt-4 flex gap-2">
              <button className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Save Job</button>
              <button className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700">Apply</button>
            </div>
          </div>
        </div>
      </div>

      <button onClick={onExit} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700">
        {TEXT.acceptedCTA}
      </button>
    </>
  )
}

function UsageScreen(props: {
  title: string
  coachLine: string
  appliedRange: Range | null; setAppliedRange: (r: Range) => void
  emailedRange: Range | null; setEmailedRange: (r: Range) => void
  interviewedRange: Range | null; setInterviewedRange: (r: Range) => void
  tried: boolean
  priceNow: string
  was: number
  onOfferClick: () => void
  onContinue: () => void
}) {
  const invalid = props.tried && !(props.appliedRange && props.emailedRange && props.interviewedRange)

  return (
    <>
      <Header title={props.title} />
      {props.coachLine ? (
        <p className="mb-2 text-sm text-red-600">{props.coachLine}</p>
      ) : null}

      <QRange
        label={<span>How many roles did you <u>apply</u> for through Migrate Mate?</span>}
        value={props.appliedRange}
        onPick={props.setAppliedRange}
      />
      <QRange
        label={<span>How many companies did you <u>email</u> directly?</span>}
        value={props.emailedRange}
        onPick={props.setEmailedRange}
      />
      <QRange
        label={<span>How many different companies did you <u>interview</u> with?</span>}
        value={props.interviewedRange}
        onPick={props.setInterviewedRange}
        options={RANGE_INTERVIEW}
      />

      {invalid && (
        <p className="mt-3 text-sm text-red-600">{TEXT.reasonsNeedSelect}</p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <button onClick={props.onOfferClick} className="rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700">
          {TEXT.usageOfferInline(props.priceNow, props.was)}
        </button>
        <button onClick={props.onContinue} className="rounded-xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700">
          Continue
        </button>
      </div>
    </>
  )
}

function QRange({
  label, value, onPick, options = RANGE_DEFAULT,
}: { label: ReactNode; value: Range | null; onPick: (r: Range) => void; options?: Range[] }) {
  return (
    <div className="mt-5">
      <label className="block text-sm text-gray-700">{label}</label>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {options.map((r) => (
          <button
            key={r}
            onClick={() => onPick(r)}
            className={`rounded-xl border px-4 py-2 text-sm ${value === r ? 'border-violet-600 ring-2 ring-violet-200' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  )
}

function ReasonsChooser({
  reasonKey, setReasonKey, priceNow, was, onOfferClick, onProceed,
}: {
  reasonKey: string
  setReasonKey: (k: ReasonKey) => void
  priceNow: string
  was: number
  onOfferClick: () => void
  onProceed: () => void
}) {
  const options: { key: ReasonKey; label: string }[] = [
    { key: 'too_expensive', label: TEXT.reasonTooExp },
    { key: 'platform_not_helpful', label: TEXT.reasonPlatform },
    { key: 'not_enough_relevant_jobs', label: TEXT.reasonNotRelevant },
    { key: 'decided_not_to_move', label: TEXT.reasonDecided },
    { key: 'other', label: TEXT.reasonOther },
  ]

  return (
    <>
      <Header title={TEXT.reasonsH1} />
      <p className="text-gray-600">{TEXT.reasonsSub}</p>

      {!reasonKey && (
        <p className="mt-3 text-sm text-red-600">{TEXT.reasonsNeedSelect}</p>
      )}

      <div className="mt-4 space-y-3">
        {options.map(o => (
          <label key={o.key} className="flex items-center gap-3">
            <input
              type="radio"
              name="reason"
              value={o.key}
              checked={reasonKey === o.key}
              onChange={() => setReasonKey(o.key)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        <button onClick={onOfferClick} className="rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700">
          {TEXT.usageOfferInline(priceNow, was)}
        </button>
        <button
          onClick={onProceed}
          className={`rounded-xl px-4 py-3 font-medium text-white ${reasonKey ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600/50'}`}
        >
          {TEXT.completeCancel}
        </button>
      </div>
    </>
  )
}

function ReasonFollowUp({
  heading, sub, radioLabel, prompt,
  priceNow, was, text, setText, showCharCount, error, errorMsg,
  onOfferClick, onComplete, loading, inputKind,
}: {
  heading: string
  sub: string
  radioLabel: string
  prompt: string
  priceNow: string
  was: number
  text: string
  setText: (s: string) => void
  showCharCount: boolean
  error: boolean
  errorMsg: string
  onOfferClick: () => void
  onComplete: () => void
  loading: boolean
  inputKind?: 'money'
}) {
  return (
    <>
      <Header title={heading} />
      <p className="text-gray-600">{sub}</p>

      <div className="mt-4">
        <label className="flex items-center gap-3 text-gray-900">
          <input type="radio" checked readOnly />
          <span>{radioLabel}</span>
        </label>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm text-gray-700">{prompt}</label>
        {inputKind === 'money' ? (
          <div className="flex items-center rounded-xl border border-gray-300 px-3">
            <span className="text-gray-500">$</span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-10 w-full px-2 outline-none"
              placeholder=""
              inputMode="decimal"
            />
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-28 w-full resize-none rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-violet-600"
          />
        )}

        <div className="mt-1 flex items-center justify-between">
          <div className={`text-sm ${error ? 'text-red-600' : 'text-transparent'}`}>{error ? errorMsg : 'ok'}</div>
          {showCharCount && (
            <div className="text-xs text-gray-500">
              {TEXT.min25} ({text.trim().length}/25)
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        <button onClick={onOfferClick} className="rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700">
          {TEXT.usageOfferInline(priceNow, was)}
        </button>
        <button
          disabled={loading}
          onClick={onComplete}
          className="rounded-xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {TEXT.completeCancel}
        </button>
      </div>
    </>
  )
}

function FinishCard({ onBackToJobs }: { onBackToJobs: () => void }) {
  return (
    <>
      <div className="mb-2 text-2xl font-semibold text-gray-900 md:text-3xl">{TEXT.finishH1}</div>
      <div className="mt-2 max-w-prose text-gray-700">
        <p>{TEXT.finishBody1}</p>
        <p className="mt-3">{TEXT.finishBody2}</p>
        <p className="mt-3 text-sm text-gray-500">{TEXT.finishFoot}</p>
      </div>
      <button onClick={onBackToJobs} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700">
        {TEXT.backToJobs}
      </button>
    </>
  )
}
