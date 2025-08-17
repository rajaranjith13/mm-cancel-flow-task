import { ReactNode } from 'react';
import { RANGE_DEFAULT, type Range } from './types';

export function QRange({
  label, value, onPick, options = RANGE_DEFAULT,
}: { label: ReactNode; value: Range | null; onPick: (r: Range) => void; options?: Range[] }) {
  return (
    <div className="mt-5">
      <label className="block text-sm text-gray-700">{label}</label>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {options.map((r) => (
          <button
            key={r}
            onClick={() => onPick(r)}
            className={`rounded-xl border px-4 py-2 text-sm ${value === r ? 'border-violet-600 ring-2 ring-violet-200' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
