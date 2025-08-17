import { QRange } from '@/app/cancel/shared/QRange';
import type { Range } from '@/app/cancel/shared/types';
import { TEXT } from '../text';
import { Header } from './Header';
import { RANGE_INTERVIEW } from '@/app/cancel/shared/types';

export function UsageScreen(props: {
  title: string;
  coachLine: string;
  appliedRange: Range | null; setAppliedRange: (r: Range) => void;
  emailedRange: Range | null; setEmailedRange: (r: Range) => void;
  interviewedRange: Range | null; setInterviewedRange: (r: Range) => void;
  tried: boolean;
  priceNow: string;
  was: number;
  onOfferClick: () => void;
  onContinue: () => void;
}) {
  const invalid = props.tried && !(props.appliedRange && props.emailedRange && props.interviewedRange);

  return (
    <>
      <Header title={props.title} />
      <p className="mb-2 text-sm text-gray-600">{props.coachLine}</p>

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

      <div className="mt-5 flex flex-col gap-3">
        <button onClick={props.onOfferClick} className="rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700">
          <span className="mr-1">Get 50% off |</span>
          <span className="mr-1">${props.priceNow}</span>
          <span className="line-through">${props.was}</span>
        </button>
        <button onClick={props.onContinue} className="rounded-xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700">
          Continue
        </button>
      </div>
    </>
  );
}
