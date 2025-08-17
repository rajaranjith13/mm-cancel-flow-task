'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { finalizeSchema, downsellSchema } from '@/lib/validation';

import { TEXT } from './text';
import type { Props, Step, ReasonKey } from './types';

import { Stepper } from '@/app/cancel/shared/Stepper';
import { CompletedBars } from '@/app/cancel/shared/CompletedBars';

import { OfferCard } from './parts/OfferCard';
import { AcceptedConfirm } from './parts/AcceptedConfirm';
import { AcceptedJobs } from './parts/AcceptedJobs';
import { UsageScreen } from './parts/UsageScreen';
import { ReasonsChooser } from './parts/ReasonsChooser';
import { ReasonFollowUp } from './parts/ReasonFollowUp';
import { FinishCard } from './parts/FinishCard';

export default function NoJobFlow(p: Props) {
  const controlMonthly = p.prices.control.monthly;
  const priceNow = (controlMonthly / 2).toFixed(2);

  const [step, setStep] = useState<Step>(p.variant === 'B' ? 'offer' : 'usage_short');
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    let dead = false;
    fetch('/api/csrf')
      .then(r => r.json())
      .then(j => { if (!dead) setCsrfToken(j.token || '') })
      .catch(() => {});
    return () => { dead = true };
  }, []);

  const [appliedRange, setAppliedRange] = useState<string | null>(null);
  const [emailedRange, setEmailedRange] = useState<string | null>(null);
  const [interviewedRange, setInterviewedRange] = useState<string | null>(null);
  const usageValid = useMemo(
    () => !!(appliedRange && emailedRange && interviewedRange),
    [appliedRange, emailedRange, interviewedRange]
  );
  const [usageTried, setUsageTried] = useState(false);

  const [reasonKey, setReasonKey] = useState<ReasonKey | ''>('');
  const [reasonText, setReasonText] = useState('');
  const min25 = reasonText.trim().length >= 25;
  const [reasonsTried, setReasonsTried] = useState(false);
  const [detailTried, setDetailTried] = useState(false);

  const [loading, setLoading] = useState(false);

  const isAccepted = step === 'accepted_confirm' || step === 'accepted_jobs';
  const isFinished = step === 'finish';
  const headerStepIndex =
    step === 'offer' ? 1 :
    step === 'usage_short' ? 2 :
    step === 'reasons' ||
    step === 'reason_too_expensive' ||
    step === 'reason_platform' ||
    step === 'reason_not_relevant' ||
    step === 'reason_decided' ||
    step === 'reason_other' ? 3 : 3;

  function goBack() {
    if (step === 'offer') return window.location.reload();
    if (step === 'usage_short') return setStep(p.variant === 'B' ? 'offer' : 'usage_short');
    if (step === 'reasons') return setStep('usage_short');
    if (
      step === 'reason_too_expensive' ||
      step === 'reason_platform' ||
      step === 'reason_not_relevant' ||
      step === 'reason_decided' ||
      step === 'reason_other'
    ) return setStep('reasons');
    if (isAccepted) return (window.location.href = '/?kept=1');
  }

  async function handleAccept() {
    if (!csrfToken) return;
    setLoading(true);
    const body = { cancellationId: p.cancellationId, csrfToken, reasonKey: 'accepted_downsell', reasonText: '' };
    const parsed = downsellSchema.safeParse(body);
    if (!parsed.success) { setLoading(false); return; }
    await fetch('/api/cancel/downsell', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed.data),
    }).catch(() => {});
    setLoading(false);
    setStep('accepted_confirm');
  }

  function proceedFromReasons() {
    setReasonsTried(true);
    if (!reasonKey) return;
    if (reasonKey === 'too_expensive') return setStep('reason_too_expensive');
    if (reasonKey === 'platform_not_helpful') return setStep('reason_platform');
    if (reasonKey === 'not_enough_relevant_jobs') return setStep('reason_not_relevant');
    if (reasonKey === 'decided_not_to_move') return setStep('reason_decided');
    return setStep('reason_other');
  }

  async function completeCancellation(extraDetail: string, needsMin25: boolean) {
    setDetailTried(true);
    if (needsMin25 && extraDetail.trim().length < 25) return;
    if (!csrfToken) return;

    const payload = {
      cancellationId: p.cancellationId,
      csrfToken,
      reasonKey: reasonKey || 'other',
      reasonText: JSON.stringify({
        usage: { appliedRange, emailedRange, interviewedRange },
        detail: extraDetail.trim(),
      }),
    };
    const parsed = finalizeSchema.safeParse(payload);
    if (!parsed.success) { return; }
    const res = await fetch('/api/cancel/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
    if (res.ok) setStep('finish');
  }

  const showSteps = !isAccepted && !isFinished;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 md:p-8">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">

        <div className="relative flex items-center justify-center border-b px-6 py-3 md:px-8">
          {!isFinished ? (
            <button onClick={goBack} className="absolute left-6 text-sm text-gray-600 hover:text-gray-900">{'<'} Back</button>
          ) : <span className="absolute left-6 w-[56px]" />}

          {!isFinished ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-800">{TEXT.modalTitle}</span>
              {showSteps && <Stepper index={headerStepIndex} />}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-800">Subscription Cancellation</span>
              <CompletedBars />
              <span className="text-xs text-gray-500">Completed</span>
            </div>
          )}

          <button onClick={() => (window.location.href = '/')} className="absolute right-6 rounded-full p-1 text-gray-500 hover:bg-gray-100">×</button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2 md:p-8">
          <div className="flex flex-col">

            {step === 'offer' && (
              <OfferCard
                priceNow={priceNow}
                was={controlMonthly}
                onAccept={handleAccept}
                onDecline={() => setStep('usage_short')}
              />
            )}

            {step === 'accepted_confirm' && (
              <AcceptedConfirm onNext={() => setStep('accepted_jobs')} />
            )}

            {step === 'accepted_jobs' && (
              <AcceptedJobs onExit={() => (window.location.href = '/?kept=1')} />
            )}

            {step === 'usage_short' && (
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
                  if (!usageValid) { setUsageTried(true); return; }
                  setReasonsTried(false);
                  setStep('reasons');
                }}
              />
            )}

            {step === 'reasons' && (
              <ReasonsChooser
                reasonKey={reasonKey}
                setReasonKey={(k) => { setReasonKey(k); setReasonsTried(false); }}
                priceNow={priceNow}
                was={controlMonthly}
                onOfferClick={handleAccept}
                onProceed={proceedFromReasons}
                tried={reasonsTried}
              />
            )}

            {step === 'reason_too_expensive' && (
              <ReasonFollowUp
                heading={TEXT.reasonsH1}
                sub="Please take a minute to let us know why:"
                radioLabel={TEXT.reasonTooExp}
                prompt="What would be the maximum you would be willing to pay?*"
                priceNow={priceNow}
                was={controlMonthly}
                text={reasonText}
                setText={(t) => { setDetailTried(false); setReasonText(t); }}
                showCharCount={false}
                showError={detailTried && !/^\d+(\.\d{1,2})?$/.test(reasonText.trim())}
                errorMsg="Please enter a valid number (e.g., 12 or 12.50)."
                onOfferClick={handleAccept}
                onComplete={() => {
                  setDetailTried(true);
                  const s = reasonText.trim();
                  const ok = /^\d+(\.\d{1,2})?$/.test(s);
                  if (!ok) return;
                  completeCancellation(s, false);
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
                setText={(t) => { setDetailTried(false); setReasonText(t); }}
                showCharCount
                showError={detailTried && !min25}
                errorMsg={TEXT.please25}
                onOfferClick={handleAccept}
                onComplete={() => {
                  setDetailTried(true);
                  if (!min25) return;
                  completeCancellation(reasonText, true);
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
                setText={(t) => { setDetailTried(false); setReasonText(t); }}
                showCharCount
                showError={detailTried && !min25}
                errorMsg={TEXT.please25}
                onOfferClick={handleAccept}
                onComplete={() => {
                  setDetailTried(true);
                  if (!min25) return;
                  completeCancellation(reasonText, true);
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
                setText={(t) => { setDetailTried(false); setReasonText(t); }}
                showCharCount
                showError={detailTried && !min25}
                errorMsg={TEXT.please25}
                onOfferClick={handleAccept}
                onComplete={() => {
                  setDetailTried(true);
                  if (!min25) return;
                  completeCancellation(reasonText, true);
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
                setText={(t) => { setDetailTried(false); setReasonText(t); }}
                showCharCount
                showError={detailTried && !min25}
                errorMsg={TEXT.please25}
                onOfferClick={handleAccept}
                onComplete={() => {
                  setDetailTried(true);
                  if (!min25) return;
                  completeCancellation(reasonText, true);
                }}
                loading={loading}
              />
            )}

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
  );
}
