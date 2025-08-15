'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
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

type Step =
  | 'intro'
  // YES branch
  | 'yes_survey'        // Screen 2
  | 'yes_text'          // Screen 3
  | 'visa_gate'         // Screen 4/5
  | 'visa_company_yes'  // Screen 6/8
  | 'visa_company_no'   // Screen 7/9
  | 'finish_mm'         // Screen 10
  | 'finish_nom'        // Screen 11
  // NO branch
  | 'offer'
  | 'accepted'
  | 'reasons'

const TEXT = {
  modalTitle: 'Subscription Cancellation',
  introHeaderL1: 'Hey mate,',
  introHeaderL2: 'Quick one before you go.',
  introQuestion: 'Have you found a job yet?',
  introBody:
    'Whatever your answer, we just want to help you take the next step. With visa support, or by hearing how we can do better.',
  yesBtn: "Yes, I’ve found a job",
  noBtn: "Not yet — I’m still looking",

  yes_survey_title: 'Congrats on the new role! 🎉',
  yes_survey_q1: 'Did you find this job with MigrateMate?*',
  yes_survey_q2: 'How many roles did you apply for through Migrate Mate?*',
  yes_survey_q3: 'How many companies did you email directly?*',
  yes_survey_q4: 'How many different companies did you interview with?*',
  continue: 'Continue',

  yes_text_title: 'What’s one thing you wish we could’ve helped you with?',
  yes_text_hint:
    'We’re always looking to improve; your thoughts can help us make Migrate Mate more useful for others.*',
  yes_text_placeholder: 'Min 25 characters…',

  visa_mm_h1: 'We helped you land the job, now let’s help you secure your visa.',
  visa_nom_h1: 'You landed the job! That’s what we live for.',
  visa_nom_sub: 'Even if it wasn’t through Migrate Mate, let us help get your visa sorted.',
  visa_q: 'Is your company providing an immigration lawyer to help with your visa?*',

  visa_type_q: 'Which visa would you like to apply for?*',
  complete_cancel: 'Complete cancellation',

  finish_mm_title: 'All done, your cancellation’s been processed.',
  finish_mm_body:
    'We’re stoked to hear you’ve landed a job and sorted your visa. Big congrats from the team.🙌',
  finish_nom_title: 'Your cancellation’s all sorted, mate, no more charges.',
  finish: 'Finish',

  offerTitle: 'We built this to help you land the job, this makes it a little easier.',
  offerBody: 'We’ve been there and we’re here to help you.',
  offerAcceptA: 'Stick around (standard pricing)',
  offerAcceptB: 'Get $10 off until you find a job',
  offerDecline: 'No thanks',
  acceptedTitle: 'Great choice, mate!',
  acceptedBody: 'You’re still on the path to your dream role. Let’s make it happen together!',
  acceptedCta: 'Let’s keep this going',
  reasonTitle: "What's the main reason for canceling?",
}

const RANGE = ['0', '1–5', '6–20', '20+'] as const
type Range = typeof RANGE[number]

export default function CancelFlow(p: Props) {
  const [step, setStep] = useState<Step>('intro')

  const [csrfToken, setCsrfToken] = useState('')
  useEffect(() => {
    let done = false
    fetch('/api/csrf')
      .then((r) => r.json())
      .then((j) => { if (!done) setCsrfToken(j.token || '') })
      .catch(() => {})
    return () => { done = true }
  }, [])

  // YES branch
  const [foundViaMM, setFoundViaMM] = useState<boolean | null>(null)
  const [appliedRange, setAppliedRange] = useState<Range | null>(null)
  const [emailedRange, setEmailedRange] = useState<Range | null>(null)
  const [interviewedRange, setInterviewedRange] = useState<Range | null>(null)
  const canContinueSurvey = useMemo(
    () => foundViaMM !== null && appliedRange && emailedRange && interviewedRange,
    [foundViaMM, appliedRange, emailedRange, interviewedRange]
  )

  const [freeText, setFreeText] = useState('')
  const freeTextOK = freeText.trim().length >= 25

  const [companyLawyer, setCompanyLawyer] = useState<boolean | null>(null)
  const [visaType, setVisaType] = useState('')
  const visaOK = visaType.trim().length > 0

  // NO branch
  const [reasonKey, setReasonKey] = useState('too_expensive')
  const [reasonText, setReasonText] = useState('')
  const [loading, setLoading] = useState(false)
  const isVariantB = p.variant === 'B'
  const prices = isVariantB ? p.prices.b : p.prices.control

  /** Header stepper + Back logic */
  const YES_HEADER_STEPS: Step[] = ['yes_survey','yes_text','visa_gate','visa_company_yes','visa_company_no']
  const headerStepIndex = useMemo(() => {
    if (step === 'yes_survey') return 1
    if (step === 'yes_text') return 2
    if (step === 'visa_gate' || step === 'visa_company_yes' || step === 'visa_company_no') return 3
    return 0
  }, [step])
  const showHeaderStepper = YES_HEADER_STEPS.includes(step)
  const showBack = !(step === 'intro' || step === 'finish_mm' || step === 'finish_nom')

  function stepBack(s: Step): Step {
    switch (s) {
      case 'yes_survey':       return 'intro'
      case 'yes_text':         return 'yes_survey'
      case 'visa_gate':        return 'yes_text'
      case 'visa_company_yes':
      case 'visa_company_no':  return 'visa_gate'
      case 'reasons':          return 'offer'
      case 'accepted':         return 'offer'
      case 'offer':            return 'intro'
      default:                 return 'intro'
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-3 md:p-8">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">

        {/* Header */}
        <div className="relative flex items-center justify-center border-b px-6 py-3 md:px-8">
          {/* Left: Back */}
          {showBack ? (
            <button
              onClick={() => setStep(stepBack(step))}
              className="absolute left-6 text-sm text-gray-600 hover:text-gray-900"
              aria-label="Back"
            >
              ← Back
            </button>
          ) : (
            <span className="absolute left-6 w-[56px]" aria-hidden="true" />
          )}

          {/* Center: Title + Stepper */}
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-800">{TEXT.modalTitle}</div>
            {showHeaderStepper && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((n) => {
                    const cls =
                      n < headerStepIndex ? 'bg-emerald-500'
                      : n === headerStepIndex ? 'bg-gray-400'
                      : 'bg-gray-300'
                    return <span key={n} className={`h-1.5 w-6 rounded-full ${cls}`} />
                  })}
                </div>
                <span>Step {headerStepIndex} of 3</span>
              </div>
            )}
          </div>

          {/* Right: Close */}
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
          <div className="flex flex-col">
            {step === 'intro' && (
              <IntroCard onYes={() => setStep('yes_survey')} onNo={() => setStep('offer')} />
            )}

            {step === 'yes_survey' && (
              <YesSurvey
                foundViaMM={foundViaMM}
                setFoundViaMM={setFoundViaMM}
                appliedRange={appliedRange}
                setAppliedRange={setAppliedRange}
                emailedRange={emailedRange}
                setEmailedRange={setEmailedRange}
                interviewedRange={interviewedRange}
                setInterviewedRange={setInterviewedRange}
                disabled={!canContinueSurvey || !csrfToken}
                onNext={() => setStep('yes_text')}
              />
            )}

            {step === 'yes_text' && (
              <YesText
                value={freeText}
                setValue={setFreeText}
                disabled={!freeTextOK || !csrfToken}
                onNext={() => setStep('visa_gate')}
              />
            )}

            {step === 'visa_gate' && (
              <VisaGate
                foundViaMM={!!foundViaMM}
                companyLawyer={companyLawyer}
                setCompanyLawyer={setCompanyLawyer}
                onContinue={() => {
                  if (companyLawyer === null) return
                  setStep(companyLawyer ? 'visa_company_yes' : 'visa_company_no')
                }}
              />
            )}

            {step === 'visa_company_yes' && (
              <VisaDetails
                foundViaMM={!!foundViaMM}
                companyLawyer
                visaType={visaType}
                setVisaType={setVisaType}
                disabled={!visaOK || !csrfToken}
                onComplete={async () => {
                  await finalizeYes('company_yes')
                  setStep(foundViaMM ? 'finish_mm' : 'finish_nom')
                }}
              />
            )}

            {step === 'visa_company_no' && (
              <VisaDetails
                foundViaMM={!!foundViaMM}
                companyLawyer={false}
                visaType={visaType}
                setVisaType={setVisaType}
                disabled={!visaOK || !csrfToken}
                onComplete={async () => {
                  await finalizeYes('company_no')
                  setStep(foundViaMM ? 'finish_mm' : 'finish_nom')
                }}
              />
            )}

            {step === 'finish_mm' && (
              <FinishCongrats
                title={TEXT.finish_mm_title}
                body={TEXT.finish_mm_body}
                onFinish={() => (window.location.href = '/?canceled=1')}
              />
            )}

            {step === 'finish_nom' && (
              <FinishMihailo onFinish={() => (window.location.href = '/?canceled=1')} />
            )}

            {step === 'offer' && (
              <OfferCard
                isB={isVariantB}
                prices={prices}
                onAccept={async () => {
                  setLoading(true)
                  await acceptDownsell({ reasonKey, reasonText })
                  setLoading(false)
                  setStep('accepted')
                }}
                onDecline={() => setStep('reasons')}
              />
            )}

            {step === 'accepted' && (
              <AcceptedCard onFinish={() => (window.location.href = '/?kept=1')} />
            )}

            {step === 'reasons' && (
              <ReasonForm
                reasonKey={reasonKey}
                setReasonKey={setReasonKey}
                reasonText={reasonText}
                setReasonText={setReasonText}
                isB={isVariantB}
                loading={loading}
                onKeep={async () => {
                  setLoading(true)
                  await acceptDownsell({ reasonKey, reasonText })
                  setLoading(false)
                  window.location.href = '/?kept=1'
                }}
                onCancel={async () => {
                  setLoading(true)
                  await finalizeNoBranch()
                  setLoading(false)
                  window.location.href = '/?canceled=1'
                }}
              />
            )}
          </div>

          {/* Right image */}
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

  /** API helpers */
  async function finalizeYes(visaContext: 'company_yes' | 'company_no') {
    setLoading(true)
    const payload = {
      cancellationId: p.cancellationId,
      csrfToken,
      reasonKey: `job_found_${foundViaMM ? 'with_mm' : 'without_mm'}_${visaContext}`,
      reasonText: JSON.stringify({
        foundViaMM,
        appliedRange,
        emailedRange,
        interviewedRange,
        feedback: freeText.trim(),
        companyLawyer: visaContext === 'company_yes',
        visaType: visaType.trim(),
      }),
    }
    const parsed = finalizeSchema.safeParse(payload)
    if (!parsed.success) { setLoading(false); alert('Invalid input.'); return }
    const res = await fetch('/api/cancel/submit', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(parsed.data),
    })
    setLoading(false)
    if (!res.ok) alert('Something went wrong. Please retry.')
  }

  async function finalizeNoBranch() {
    const body = { cancellationId: p.cancellationId, csrfToken, reasonKey, reasonText }
    const parsed = finalizeSchema.safeParse(body)
    if (!parsed.success) { alert('Invalid input.'); return }
    const res = await fetch('/api/cancel/submit', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(parsed.data),
    })
    if (!res.ok) alert('Something went wrong. Please retry.')
  }

  async function acceptDownsell(extra: { reasonKey: string; reasonText?: string }) {
    const body = { cancellationId: p.cancellationId, csrfToken, reasonKey: extra.reasonKey, reasonText: extra.reasonText ?? '' }
    const parsed = downsellSchema.safeParse(body)
    if (!parsed.success) { alert('Invalid input.'); return }
    const res = await fetch('/api/cancel/downsell', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(parsed.data),
    })
    if (!res.ok) alert('Could not apply the offer. Try again.')
  }
}

/* ===== Subcomponents ===== */

function HeaderRow({ title }: { title: string }) {
  return <div className="mb-4 text-2xl font-semibold text-gray-900 md:text-3xl">{title}</div>
}

function IntroCard({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <>
      <h1 className="text-2xl font-extrabold leading-tight text-gray-900 md:text-3xl">
        <span className="block">Hey mate,</span>
        <span className="block">Quick one before you go.</span>
      </h1>
      <p className="mt-3 text-xl italic text-gray-900 md:text-2xl">Have you found a job yet?</p>
      <p className="mt-3 max-w-prose text-gray-600">
        Whatever your answer, we just want to help you take the next step. With visa support, or by hearing how we can do better.
      </p>
      <div className="mt-6 space-y-3">
        <button onClick={onYes} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center hover:bg-gray-50">
          Yes, I’ve found a job
        </button>
        <button onClick={onNo} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center hover:bg-gray-50">
          Not yet — I’m still looking
        </button>
      </div>
    </>
  )
}

function YesSurvey(props: {
  foundViaMM: boolean | null
  setFoundViaMM: (b: boolean) => void
  appliedRange: Range | null
  setAppliedRange: (r: Range) => void
  emailedRange: Range | null
  setEmailedRange: (r: Range) => void
  interviewedRange: Range | null
  setInterviewedRange: (r: Range) => void
  disabled: boolean
  onNext: () => void
}) {
  const {
    foundViaMM, setFoundViaMM,
    appliedRange, setAppliedRange,
    emailedRange, setEmailedRange,
    interviewedRange, setInterviewedRange,
    disabled, onNext,
  } = props

  return (
    <>
      <HeaderRow title={TEXT.yes_survey_title} />

      {/* Q1 (pills are fine here as per fig) */}
      <label className="mt-1 block text-sm text-gray-700">{TEXT.yes_survey_q1}</label>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <button
          onClick={() => setFoundViaMM(true)}
          className={`rounded-xl border px-4 py-3 ${foundViaMM === true ? 'border-violet-600 ring-2 ring-violet-200' : 'border-gray-300 hover:bg-gray-50'}`}
        >Yes</button>
        <button
          onClick={() => setFoundViaMM(false)}
          className={`rounded-xl border px-4 py-3 ${foundViaMM === false ? 'border-violet-600 ring-2 ring-violet-200' : 'border-gray-300 hover:bg-gray-50'}`}
        >No</button>
      </div>

      <QRange label={TEXT.yes_survey_q2} value={appliedRange} onPick={setAppliedRange} />
      <QRange label={TEXT.yes_survey_q3} value={emailedRange}  onPick={setEmailedRange} />
      <QRange label={TEXT.yes_survey_q4} value={interviewedRange} onPick={setInterviewedRange} />

      <button
        disabled={disabled}
        onClick={onNext}
        className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {TEXT.continue}
      </button>
    </>
  )
}

function QRange({ label, value, onPick }: { label: string; value: Range | null; onPick: (r: Range) => void }) {
  return (
    <div className="mt-5">
      <label className="block text-sm text-gray-700">{label}</label>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {RANGE.map((r) => (
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

function YesText({ value, setValue, disabled, onNext }: { value: string; setValue: (s: string) => void; disabled: boolean; onNext: () => void }) {
  const count = value.trim().length
  return (
    <>
      <HeaderRow title={TEXT.yes_text_title} />
      <p className="text-gray-600">{TEXT.yes_text_hint}</p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={TEXT.yes_text_placeholder}
        className="mt-4 h-28 w-full resize-none rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-violet-600"
      />
      <div className="mt-1 text-right text-xs text-gray-500">Min 25 characters ({count}/25)</div>
      <button
        disabled={disabled}
        onClick={onNext}
        className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {TEXT.continue}
      </button>
    </>
  )
}

/** Visa gate — radio circles + Continue */
function VisaGate({
  foundViaMM,
  companyLawyer,
  setCompanyLawyer,
  onContinue,
}: {
  foundViaMM: boolean
  companyLawyer: boolean | null
  setCompanyLawyer: (b: boolean) => void
  onContinue: () => void
}) {
  return (
    <>
      <HeaderRow title={foundViaMM ? TEXT.visa_mm_h1 : TEXT.visa_nom_h1} />
      {!foundViaMM && <p className="mb-2 text-gray-700">{TEXT.visa_nom_sub}</p>}

      <label className="block text-sm text-gray-700">{TEXT.visa_q}</label>
      <div className="mt-3 space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="companyLawyer"
            checked={companyLawyer === true}
            onChange={() => setCompanyLawyer(true)}
          />
          <span>Yes</span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="companyLawyer"
            checked={companyLawyer === false}
            onChange={() => setCompanyLawyer(false)}
          />
          <span>No</span>
        </label>
      </div>

      <button
        disabled={companyLawyer === null}
        onClick={onContinue}
        className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {TEXT.continue}
      </button>
    </>
  )
}

function VisaDetails({
  foundViaMM,
  companyLawyer,
  visaType,
  setVisaType,
  disabled,
  onComplete,
}: {
  foundViaMM: boolean
  companyLawyer: boolean
  visaType: string
  setVisaType: (v: string) => void
  disabled: boolean
  onComplete: () => Promise<void> | void
}) {
  return (
    <>
      <HeaderRow title={foundViaMM ? TEXT.visa_mm_h1 : TEXT.visa_nom_h1} />
      {!foundViaMM && <p className="mb-2 text-gray-700">{TEXT.visa_nom_sub}</p>}

      <div className="mb-3 text-sm text-gray-700">
        {TEXT.visa_q} <strong>{companyLawyer ? 'Yes' : 'No'}</strong>
      </div>

      <label className="block text-sm text-gray-700">{TEXT.visa_type_q}</label>
      <input
        value={visaType}
        onChange={(e) => setVisaType(e.target.value)}
        placeholder="Enter visa type…"
        className="mt-2 w-full rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-violet-600"
      />

      <button
        disabled={disabled}
        onClick={onComplete}
        className="mt-6 w-full rounded-xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {TEXT.complete_cancel}
      </button>
    </>
  )
}

function FinishCongrats({ title, body, onFinish }: { title: string; body: string; onFinish: () => void }) {
  return (
    <>
      <div className="mb-2 text-2xl font-semibold text-gray-900 md:text-3xl">{title}</div>
      <p className="mt-2 max-w-prose text-gray-700">{body}</p>
      <button onClick={onFinish} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700">
        {TEXT.finish}
      </button>
    </>
  )
}

function FinishMihailo({ onFinish }: { onFinish: () => void }) {
  return (
    <>
      <div className="mb-2 text-2xl font-semibold text-gray-900 md:text-3xl">
        {TEXT.finish_nom_title}
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <img src="/mihailo.jpg" alt="Mihailo Bozic" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <div className="font-medium">Mihailo Bozic</div>
            <div className="text-xs text-gray-500">&lt;mihailo@migratemate.co&gt;</div>
          </div>
        </div>
        <div className="mt-3 space-y-2 text-gray-700">
          <p>I’ll be reaching out soon to help with the visa side of things.</p>
          <p>We’ve got your back, whether it’s questions, paperwork, or just figuring out your options.</p>
          <p>Keep an eye on your inbox, I’ll be in touch shortly.</p>
        </div>
      </div>

      <button onClick={onFinish} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700">
        {TEXT.finish}
      </button>
    </>
  )
}

function OfferCard({
  isB,
  prices,
  onAccept,
  onDecline,
}: {
  isB: boolean
  prices: { monthly: number; annual: number }
  onAccept: () => Promise<void> | void
  onDecline: () => void
}) {
  return (
    <>
      <button onClick={onDecline} className="mb-4 w-fit text-sm text-gray-500 hover:text-gray-900">← Back</button>
      <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">{TEXT.offerTitle}</h2>
      <p className="mt-2 text-gray-600">{TEXT.offerBody}</p>
      <div className="mt-5 space-y-3">
        <button onClick={onAccept} className="w-full rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700">
          {isVariantB ? `Get $10 off until you find a job — $${prices.monthly}/mo (was $25) / $${prices.annual}/mo (was $29)` : TEXT.offerAcceptA}
        </button>
        <button onClick={onDecline} className="w-full rounded-xl border border-gray-300 px-4 py-3 hover:bg-gray-50">
          {TEXT.offerDecline}
        </button>
      </div>
    </>
  )
}

function AcceptedCard({ onFinish }: { onFinish: () => void }) {
  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">{TEXT.acceptedTitle}</h2>
      <p className="mt-2 text-gray-600">{TEXT.acceptedBody}</p>
      <button onClick={onFinish} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700">
        {TEXT.acceptedCta}
      </button>
    </>
  )
}

function ReasonForm({
  reasonKey,
  setReasonKey,
  reasonText,
  setReasonText,
  isB,
  loading,
  onKeep,
  onCancel,
}: {
  reasonKey: string
  setReasonKey: (v: string) => void
  reasonText: string
  setReasonText: (v: string) => void
  isB: boolean
  loading: boolean
  onKeep: () => Promise<void> | void
  onCancel: () => Promise<void> | void
}) {
  const REASONS = [
    { key: 'too_expensive', label: 'It’s too expensive' },
    { key: 'not_using', label: 'I don’t use it enough' },
    { key: 'missing_features', label: 'Missing a feature I need' },
    { key: 'technical_issues', label: 'Technical issues' },
    { key: 'other', label: 'Other' },
  ]
  return (
    <>
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
      <textarea
        value={reasonText}
        onChange={(e) => setReasonText(e.target.value)}
        placeholder="Anything else you’d like to share? (optional)"
        maxLength={500}
        className="mt-4 h-28 w-full resize-none rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-violet-600"
      />
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {isB && (
          <button onClick={onKeep} className="rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700">
            OK I’ll stay ($ off)
          </button>
        )}
        <button disabled={loading} onClick={onCancel} className="rounded-xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-60">
          {loading ? 'Canceling…' : 'Complete cancellation'}
        </button>
      </div>
    </>
  )
}
