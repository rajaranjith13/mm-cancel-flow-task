import { TEXT } from '../text';
import { HeaderRow } from '@/app/cancel/shared/HeaderRow';

export function YesText({
  value, setValue, disabled, onNext,
}: { value: string; setValue: (s: string) => void; disabled: boolean; onNext: () => void }) {
  const count = value.trim().length;
  return (
    <>
      <HeaderRow title={TEXT.yes_text_title} />
      <p className="text-gray-600">
        {TEXT.yes_text_hint}<sup className="text-red-500">*</sup>
      </p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={TEXT.yes_text_placeholder}
        className="mt-4 h-28 w-full resize-none rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-violet-600"
      />
      <div className="mt-1 text-right text-xs text-gray-500">Min 25 characters ({count}/25)</div>
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
