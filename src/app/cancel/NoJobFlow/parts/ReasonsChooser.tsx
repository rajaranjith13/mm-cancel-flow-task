import { TEXT } from '../text';
import type { ReasonKey } from '../types';

export function ReasonsChooser({
  reasonKey, setReasonKey, priceNow, was, onOfferClick, onProceed, tried,
}: {
  reasonKey: string;
  setReasonKey: (k: ReasonKey) => void;
  priceNow: string;
  was: number;
  onOfferClick: () => void;
  onProceed: () => void;
  tried: boolean;
}) {
  const options: { key: ReasonKey; label: string }[] = [
    { key: 'too_expensive', label: TEXT.reasonTooExp },
    { key: 'platform_not_helpful', label: TEXT.reasonPlatform },
    { key: 'not_enough_relevant_jobs', label: TEXT.reasonNotRelevant },
    { key: 'decided_not_to_move', label: TEXT.reasonDecided },
    { key: 'other', label: TEXT.reasonOther },
  ];

  return (
    <>
      <h2 className="mb-4 text-2xl font-semibold text-gray-900 md:text-3xl">{TEXT.reasonsH1}</h2>
      <p className="text-gray-600">{TEXT.reasonsSub}</p>

      {tried && !reasonKey && (
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

      <div className="mt-6 flex flex-col gap-3">
        <button onClick={onOfferClick} className="rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700">
          <span className="mr-1">Get 50% off |</span>
          <span className="mr-1">${priceNow}</span>
          <span className="line-through">${was}</span>
        </button>
        <button
          onClick={onProceed}
          className="rounded-xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700"
        >
          {TEXT.completeCancel}
        </button>
      </div>
    </>
  );
}
