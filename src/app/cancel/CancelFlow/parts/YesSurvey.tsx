import { ReactNode } from 'react';
import { TEXT } from '../text';
import { QRange } from '@/app/cancel/shared/QRange';
import type { Range } from '@/app/cancel/shared/types';
import { HeaderRow } from '@/app/cancel/shared/HeaderRow';

export function YesSurvey(props: {
  foundViaMM: boolean | null;
  setFoundViaMM: (b: boolean) => void;
  appliedRange: Range | null;
  setAppliedRange: (r: Range) => void;
  emailedRange: Range | null;
  setEmailedRange: (r: Range) => void;
  interviewedRange: Range | null;
  setInterviewedRange: (r: Range) => void;
  disabled: boolean;
  onNext: () => void;
}) {
  const {
    foundViaMM, setFoundViaMM,
    appliedRange, setAppliedRange,
    emailedRange, setEmailedRange,
    interviewedRange, setInterviewedRange,
    disabled, onNext
  } = props;

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

      <QRange
        label={<span>How many roles did you <u>apply</u> for through Migrate Mate?<sup className="text-red-500">*</sup></span>}
        value={appliedRange}
        onPick={setAppliedRange}
      />
      <QRange
        label={<span>How many companies did you <u>email</u> directly?<sup className="text-red-500">*</sup></span>}
        value={emailedRange}
        onPick={setEmailedRange}
      />
      <QRange
        label={<span>How many different companies did you <u>interview</u> with?<sup className="text-red-500">*</sup></span>}
        value={interviewedRange}
        onPick={setInterviewedRange}
        options={['0','1–2','3–5','5+']}
      />

      <button
        disabled={disabled}
        onClick={onNext}
        className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {TEXT.continue}
      </button>
    </>
  );
}
