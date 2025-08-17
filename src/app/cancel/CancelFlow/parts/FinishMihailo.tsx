import { TEXT } from '../text';

export function FinishMihailo({ onFinish }: { onFinish: () => void }) {
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
      <button onClick={onFinish} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700">
        {TEXT.finish}
      </button>
    </>
  );
}
