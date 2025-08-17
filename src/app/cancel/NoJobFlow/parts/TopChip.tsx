import { ReactNode } from 'react';

export function TopChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5">{children}</span>
  );
}
