import { ReactNode } from 'react';

export function VisaChip({ label, icon }: { label: string; icon?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
      {icon ? <span className="shrink-0">{icon}</span> : null}
      {label}
    </span>
  );
}
