import { TEXT } from '../text';
import { Header } from './Header';

export function AcceptedConfirm({ onNext }: { onNext: () => void }) {
  return (
    <>
      <Header title={TEXT.acceptedH1} />
      <p className="mt-2 font-semibold text-gray-900 text-lg md:text-xl">
        You’re still on the path to your dream role.{' '}
        <span className="text-violet-700">Let’s make it happen together!</span>
      </p>
      <p className="mt-4 text-sm text-gray-600">
        You’ve got XX days left on your current plan. Starting from XX date, your monthly payment will be $12.50.
      </p>
      <p className="mt-1 text-xs text-gray-500">You can cancel anytime before then.</p>
      <button
        onClick={onNext}
        className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700"
      >
        {TEXT.acceptedCTA}
      </button>
    </>
  );
}
