'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { finalizeSchema } from '@/lib/validation';

import { TEXT } from './text';
import type { Step, Props } from './types';

import { YesSurvey } from './parts/YesSurvey';
import { YesText } from './parts/YesText';
import { VisaGate } from './parts/VisaGate';
import { VisaDetails } from './parts/VisaDetails';
import { FinishCongrats } from './parts/FinishCongrats';
import { FinishMihailo } from './parts/FinishMihailo';

export default function CancelFlow(p: Props) {
  const [step, setStep] = useState<Step>(p.initialStep ?? 'yes_survey');
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    let done = false;
    fetch('/api/csrf')
      .then((r) => r.json())
      .then((j) => { if (!done) setCsrfToken(j.token || '') })
      .catch(() => {});
    return () => { done = true };
  }, []);

  // YES branch state
  const [foundViaMM, setFoundViaMM] = useState<boolean | null>(null);
  const [appliedRange, setAppliedRange] = useState<string | null>(null);
  const [emailedRange, setEmailedRange] = useState<string | null>(null);
  const [interviewedRange, setInterviewedRange] = useState<string | null>(null);
  const canContinueSurvey = useMemo(
    () => foundViaMM !== null && appliedRange && emailedRange && interviewedRange,
    [foundViaMM, appliedRange, emailedRange, interviewedRange]
  );

  const [freeText, setFreeText] = useState('');
  const freeTextOK = freeText.trim().length >= 25;

  const [companyLawyer, setCompanyLawyer] = useState<boolean | null>(null);
  const [visaType, setVisaType] = useState('');
  const visaOK = visaType.trim().length > 0;

  const YES_HEADER_STEPS: Step[] = ['yes_survey','yes_text','visa_gate','visa_company_yes','visa_company_no'];
  const headerStepIndex = useMemo(() => {
    if (step === 'yes_survey') return 1;
    if (step === 'yes_text') return 2;
    if (['visa_gate','visa_company_yes','visa_company_no'].includes(step)) return 3;
    return 0;
  }, [step]);
  const showHeaderStepper = YES_HEADER_STEPS.includes(step);
  const isFinished = step === 'finish_mm' || step === 'finish_nom';
  const showBack = !isFinished;

  function stepBack(s: Step): Step {
    switch (s) {
      case 'yes_text':         return 'yes_survey';
      case 'visa_gate':        return 'yes_text';
      case 'visa_company_yes':
      case 'visa_company_no':  return 'visa_gate';
      case 'yes_survey':       window.location.reload(); return 'yes_survey';
      default:                 return 'yes_survey';
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
                      : 'bg-gray-300';
                    return <span key={n} className={`h-1.5 w-6 rounded-full ${cls}`} />;
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
                  if (companyLawyer === null) return;
                  setStep(companyLawyer ? 'visa_company_yes' : 'visa_company_no');
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
                  await finalizeYes('company_yes');
                  setStep('finish_mm');
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
                  await finalizeYes('company_no');
                  setStep('finish_nom');
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
  );

  async function finalizeYes(visaContext: 'company_yes' | 'company_no') {
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
    };
    const parsed = finalizeSchema.safeParse(payload);
    if (!parsed.success) return;
    const res = await fetch('/api/cancel/submit', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(parsed.data),
    });
    if (!res.ok) alert('Something went wrong. Please retry.');
  }
}
