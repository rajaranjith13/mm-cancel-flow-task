import { TEXT } from '../text';

export function ReasonFollowUp({
  heading, sub, radioLabel, prompt,
  priceNow, was, text, setText, showCharCount, showError, errorMsg,
  onOfferClick, onComplete, loading, inputKind,
}: {
  heading: string;
  sub: string;
  radioLabel: string;
  prompt: string;
  priceNow: string;
  was: number;
  text: string;
  setText: (s: string) => void;
  showCharCount: boolean;
  showError: boolean;
  errorMsg: string;
  onOfferClick: () => void;
  onComplete: () => void;
  loading: boolean;
  inputKind?: 'money';
}) {

  const needsSup = prompt.trim().endsWith('*');
  const promptText = needsSup ? prompt.trim().slice(0, -1) : prompt;

  return (
    <>
      <h2 className="mb-4 text-2xl font-semibold text-gray-900 md:text-3xl">{heading}</h2>
      <p className="text-gray-600">{sub}</p>

      <div className="mt-4">
        <label className="flex items-center gap-3 text-gray-900">
          <input type="radio" checked readOnly />
          <span>{radioLabel}</span>
        </label>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm text-gray-700">
          <span>{promptText}</span>
          {needsSup && (
            <span className="ml-0.5 align-text-top text-[10px]">*</span>
          )}
        </label>

        {inputKind === 'money' ? (
          <div className="flex items-center rounded-xl border border-gray-300 px-3">
            <span className="text-gray-500">$</span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-10 w-full px-2 outline-none"
              placeholder=""
              inputMode="decimal"
            />
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-28 w-full resize-none rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-violet-600"
          />
        )}

        <div className="mt-1 flex items-center justify-between">
          <div className={`text-sm ${showError ? 'text-red-600' : 'text-transparent'}`}>{showError ? errorMsg : 'ok'}</div>
          {showCharCount && (
            <div className="text-xs text-gray-500">
              {TEXT.min25} ({text.trim().length}/25)
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button onClick={onOfferClick} className="rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700">
          <span className="mr-1">Get 50% off |</span>
          <span className="mr-1">${priceNow}</span>
          <span className="line-through">${was}</span>
        </button>
        <button
          disabled={loading}
          onClick={onComplete}
          className="rounded-xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {TEXT.completeCancel}
        </button>
      </div>
    </>
  );
}
