import { TEXT } from '../text';

export function FinishCongrats({ title, body, onFinish }: { title: string; body: string; onFinish: () => void }) {
  return (
    <>
      <div className="mb-2 text-2xl font-semibold text-gray-900 md:text-3xl">{title}</div>
      <p className="mt-2 max-w-prose text-gray-700">{body}</p>
      <button onClick={onFinish} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700">
        {TEXT.finish}
      </button>
    </>
  );
}
