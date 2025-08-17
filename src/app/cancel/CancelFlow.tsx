'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState, ReactNode } from 'react'
import { finalizeSchema } from '@/lib/validation'

type Step =
  | 'yes_survey'        // Step 1
  | 'yes_text'          // Step 2
  | 'visa_gate'         // Step 3 (gate)
  | 'visa_company_yes'  // Step 3 (details after gate)
  | 'visa_company_no'   // Step 3 (details after gate)
  | 'finish_mm'
  | 'finish_nom'

type Props = {
  variant: 'A' | 'B'
  cancellationId: string
  plan: string
  priceCents: number
  renewsAt?: string
  pending: boolean
  prices: { control: { monthly: number; annual: number }; b: { monthly: number; annual: number } }
  initialStep?: Step
}

const TEXT = {
  modalTitle: 'Subscription Cancellation',

  // YES branch
  yes_survey_title: 'Congrats on the new role! 🎉',
  yes_survey_q1: 'Did you find this job with MigrateMate?',
  continue: 'Continue',

  yes_text_title: 'What’s one thing you wish we could’ve helped you with?',
  yes_text_hint:
    'We’re always looking to improve; your thoughts can help us make Migrate Mate more useful for others.',
  yes_text_placeholder: 'Min 25 characters…',

  visa_mm_h1: 'We helped you land the job, now let’s help you secure your visa.',
  visa_nom_h1: 'You landed the job! That’s what we live for.',
  visa_nom_sub: 'Even if it wasn’t through Migrate Mate, let us help get your visa sorted.',
  visa_q: 'Is your company providing an immigration lawyer to help with your visa?',
  visa_partner_help: 'We can connect you with one of our trusted partners.',
  visa_type_q_yes: 'What visa will you be applying for?',
  visa_type_q_no: 'Which visa would you like to apply for?',
  complete_cancel: 'Complete cancellation',

  finish_mm_title: 'All done, your cancellation’s been processed.',
  finish_mm_body:
    'We’re stoked to hear you’ve landed a job and sorted your visa. Big congrats from the team.🙌',
  finish_nom_title: 'Your cancellation’s all sorted, mate, no more charges.',
  finish: 'Finish',
}

type Range = string
const RANGE_DEFAULT: Range[]   = ['0', '1–5', '6–20', '20+']
const RANGE_INTERVIEW: Range[] = ['0', '1–2', '3–5', '5+']

export default function CancelFlow(p: Props) {
  const [step, setStep] = useState<Step>(p.initialStep ?? 'yes_survey')
  const [csrfToken, setCsrfToken] = useState('')

  useEffect(() => {
    let done = false
    fetch('/api/csrf')
      .then((r) => r.json())
      .then((j) => { if (!done) setCsrfToken(j.token || '') })
      .catch(() => {})
    return () => { done = true }
  }, [])

  // YES branch state
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

  const [loading, setLoading] = useState(false)

  /** Header stepper */
  const YES_HEADER_STEPS: Step[] = ['yes_survey','yes_text','visa_gate','visa_company_yes','visa_company_no']
  const headerStepIndex = useMemo(() => {
    if (step === 'yes_survey') return 1
    if (step === 'yes_text') return 2
    if (['visa_gate','visa_company_yes','visa_company_no'].includes(step)) return 3
    return 0
  }, [step])
  const showHeaderStepper = YES_HEADER_STEPS.includes(step)
  const isFinished = step === 'finish_mm' || step === 'finish_nom'
  const showBack = !isFinished

  function stepBack(s: Step): Step {
    switch (s) {
      case 'yes_text':         return 'yes_survey'
      case 'visa_gate':        return 'yes_text'
      case 'visa_company_yes':
      case 'visa_company_no':  return 'visa_gate'
      case 'yes_survey':       window.location.reload(); return 'yes_survey'
      default:                 return 'yes_survey'
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-3 md:p-8">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">

        {/* Header */}
        <div className="relative flex items-center justify-center border-b px-6 py-3 md:px-8">
          {showBack ? (
            <button
              onClick={() => setStep(stepBack(step))}
              className="absolute left-6 text-sm text-gray-600 hover:text-gray-900"
              aria-label="Back"
            >
              {'<'} Back
            </button>
          ) : (
            <span className="absolute left-6 w-[56px]" aria-hidden="true" />
          )}

          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-800">{TEXT.modalTitle}</div>
            {isFinished ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((n) => (
                    <span key={n} className="h-1.5 w-6 rounded-full bg-emerald-500" />
                  ))}
                </div>
                <span>Completed</span>
              </div>
            ) : showHeaderStepper && (
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
                  setStep('finish_mm')
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
                  setStep('finish_nom')
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
    if (!parsed.success) { setLoading(false); return }
    const res = await fetch('/api/cancel/submit', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(parsed.data),
    })
    setLoading(false)
    if (!res.ok) alert('Something went wrong. Please retry.')
  }
}

/* ===== Subcomponents ===== */

function HeaderRow({ title }: { title: string }) {
  return <div className="mb-4 text-2xl font-semibold text-gray-900 md:text-3xl">{title}</div>
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
  const { foundViaMM, setFoundViaMM, appliedRange, setAppliedRange, emailedRange, setEmailedRange, interviewedRange, setInterviewedRange, disabled, onNext } = props
  return (
    <>
      <HeaderRow title={TEXT.yes_survey_title} />
      <label className="mt-1 block text-sm text-gray-700">
        {TEXT.yes_survey_q1}<sup className="text-red-500">*</sup>
      </label>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <button onClick={() => setFoundViaMM(true)} className={`rounded-xl border px-4 py-3 ${foundViaMM === true ? 'border-violet-600 ring-2 ring-violet-200' : 'border-gray-300 hover:bg-gray-50'}`}>Yes</button>
        <button onClick={() => setFoundViaMM(false)} className={`rounded-xl border px-4 py-3 ${foundViaMM === false ? 'border-violet-600 ring-2 ring-violet-200' : 'border-gray-300 hover:bg-gray-50'}`}>No</button>
      </div>
      <QRange label={<span>How many roles did you <u>apply</u> for through Migrate Mate?<sup className="text-red-500">*</sup></span>} value={appliedRange} onPick={setAppliedRange} />
      <QRange label={<span>How many companies did you <u>email</u> directly?<sup className="text-red-500">*</sup></span>} value={emailedRange} onPick={setEmailedRange} />
      <QRange label={<span>How many different companies did you <u>interview</u> with?<sup className="text-red-500">*</sup></span>} value={interviewedRange} onPick={setInterviewedRange} options={RANGE_INTERVIEW} />
      <button disabled={disabled} onClick={onNext} className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-60">{TEXT.continue}</button>
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
          <button key={r} onClick={() => onPick(r)} className={`rounded-xl border px-4 py-2 text-sm ${value === r ? 'border-violet-600 ring-2 ring-violet-200' : 'border-gray-300 hover:bg-gray-50'}`}>{r}</button>
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
      <p className="text-gray-600">{TEXT.yes_text_hint}<sup className="text-red-500">*</sup></p>
      <textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder={TEXT.yes_text_placeholder} className="mt-4 h-28 w-full resize-none rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-violet-600" />
      <div className="mt-1 text-right text-xs text-gray-500">Min 25 characters ({count}/25)</div>
      <button disabled={disabled} onClick={onNext} className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-60">{TEXT.continue}</button>
    </>
  )
}

function VisaGate({ foundViaMM, companyLawyer, setCompanyLawyer, onContinue }: { foundViaMM: boolean; companyLawyer: boolean | null; setCompanyLawyer: (b: boolean) => void; onContinue: () => void }) {
  return (
    <>
      <HeaderRow title={foundViaMM ? TEXT.visa_mm_h1 : TEXT.visa_nom_h1} />
      {!foundViaMM && <p className="mb-2 text-gray-700">{TEXT.visa_nom_sub}</p>}
      <label className="block text-sm text-gray-700">{TEXT.visa_q}<sup className="text-red-500">*</sup></label>
      <div className="mt-3 space-y-3">
        <label className="flex items-center gap-3">
          <input type="radio" name="companyLawyer" checked={companyLawyer === true} onChange={() => setCompanyLawyer(true)} />
          <span>Yes</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="radio" name="companyLawyer" checked={companyLawyer === false} onChange={() => setCompanyLawyer(false)} />
          <span>No</span>
        </label>
      </div>
      <button disabled={companyLawyer === null} onClick={onContinue} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-60">{TEXT.complete_cancel}</button>
    </>
  )
}

function VisaDetails({ foundViaMM, companyLawyer, visaType, setVisaType, disabled, onComplete }: { foundViaMM: boolean; companyLawyer: boolean; visaType: string; setVisaType: (v: string) => void; disabled: boolean; onComplete: () => Promise<void> | void }) {
  return (
    <>
      <HeaderRow title={foundViaMM ? TEXT.visa_mm_h1 : TEXT.visa_nom_h1} />
      {!foundViaMM && <p className="mb-2 text-gray-700">{TEXT.visa_nom_sub}</p>}
      {!companyLawyer && <p className="mt-1 text-gray-700">{TEXT.visa_partner_help}</p>}
      <label className="mt-3 block text-sm text-gray-700">{companyLawyer ? TEXT.visa_type_q_yes : TEXT.visa_type_q_no}<sup className="text-red-500">*</sup></label>
      <input value={visaType} onChange={(e) => setVisaType(e.target.value)} placeholder="Enter visa type…" className="mt-2 w-full rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-violet-600" />
      <button disabled={disabled} onClick={onComplete} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-60">{TEXT.complete_cancel}</button>
    </>
  )
}

function FinishCongrats({ title, body, onFinish }: { title: string; body: string; onFinish: () => void }) {
  return (
    <>
      <div className="mb-2 text-2xl font-semibold text-gray-900 md:text-3xl">{title}</div>
      <p className="mt-2 max-w-prose text-gray-700">{body}</p>
      <button onClick={onFinish} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700">{TEXT.finish}</button>
    </>
  )
}

function FinishMihailo({ onFinish }: { onFinish: () => void }) {
  return (
    <>
      <div className="mb-2 text-2xl font-semibold text-gray-900 md:text-3xl">{TEXT.finish_nom_title}</div>
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
      <button onClick={onFinish} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700">{TEXT.finish}</button>
    </>
  )
}