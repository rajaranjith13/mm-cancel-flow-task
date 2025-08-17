import { TEXT } from '../text';

export function FinishCard({ onBackToJobs }: { onBackToJobs: () => void }) {
  return (
    <>
      <div className="mb-2 text-2xl font-semibold text-gray-900 md:text-3xl">{TEXT.finishH1}</div>
      <div className="mt-2 max-w-prose text-gray-700">
        <p className="font-semibold text-lg md:text-xl">{TEXT.finishBody1}</p>
        <p className="mt-3">{TEXT.finishBody2}</p>
        <p className="mt-3 text-sm text-gray-500">{TEXT.finishFoot}</p>
      </div>
      <button onClick={onBackToJobs} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700">
        {TEXT.backToJobs}
      </button>
    </>
  );
}
