import { TEXT } from '../text';
import { Header } from './Header';

export function OfferCard({
  priceNow, was, onAccept, onDecline,
}: { priceNow: string; was: number; onAccept: () => void; onDecline: () => void }) {
  return (
    <>
      <Header title={TEXT.offerTitle} />
      <p className="mt-1 text-gray-600">{TEXT.offerBody}</p>

      <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-100/70 p-6 text-center">
        <div className="text-xl md:text-2xl font-semibold">
          Here’s 50% off until you find a job.
        </div>

        <div className="mt-3 flex items-baseline justify-center gap-2">
          <div className="text-2xl font-semibold text-violet-700">
            ${priceNow}<span className="text-base font-normal">/month</span>
          </div>
          <div className="text-sm text-gray-500">
            <span className="line-through">${was}/month</span>
          </div>
        </div>

        <button
          onClick={onAccept}
          className="mt-4 w-full rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700"
        >
          {TEXT.getOffCTA}
        </button>

        <div className="mt-2 text-center text-xs text-gray-500">
          You won’t be charged until your next billing date.
        </div>
      </div>

      <button
        onClick={onDecline}
        className="mt-5 w-full rounded-xl border border-gray-300 px-4 py-3 hover:bg-gray-50"
      >
        {TEXT.noThanks}
      </button>
    </>
  );
}
