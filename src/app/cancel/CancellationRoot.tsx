'use client';

import { useState } from 'react';
import CancelFlow from './CancelFlow/CancelFlow';
import NoJobFlow from './NoJobFlow/NoJobFlow';

export type CancelCommonProps = {
  variant: 'A' | 'B';
  cancellationId: string;
  plan: string;
  priceCents: number;
  renewsAt?: string;
  pending: boolean;
  prices: { control: { monthly: number; annual: number }; b: { monthly: number; annual: number } };
};

export default function CancellationRoot(props: CancelCommonProps) {
  const [branch, setBranch] = useState<'none' | 'got_job' | 'no_job'>('none');

  if (branch === 'got_job') return <CancelFlow {...props} />;
  if (branch === 'no_job') return <NoJobFlow {...props} />;

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-3 md:p-8">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="relative flex items-center justify-center border-b px-6 py-3 md:px-8">
          <span className="absolute left-6 w-[56px]" aria-hidden="true" />
          <div className="text-sm font-medium text-gray-800">Subscription Cancellation</div>
          <button
            className="absolute right-6 rounded-full p-1 text-gray-500 hover:bg-gray-100"
            onClick={() => (window.location.href = '/')}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2 md:p-8">
          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold leading-tight text-gray-900 md:text-3xl">
              <span className="block">Hey mate,</span>
              <span className="block">Quick one before you go.</span>
            </h1>
            <p className="mt-3 text-xl italic text-gray-900 md:text-2xl">Have you found a job yet?</p>
            <p className="mt-3 max-w-prose text-gray-600">
              Whatever your answer, we just want to help you take the next step. With visa support, or by
              hearing how we can do better.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => setBranch('got_job')}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center hover:bg-gray-50"
              >
                Yes, I’ve found a job
              </button>
              <button
                onClick={() => setBranch('no_job')}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center hover:bg-gray-50"
              >
                Not yet — I’m still looking
              </button>
            </div>
          </div>

          <div className="order-first overflow-hidden rounded-xl md:order-none">
            <img
              src="/hero-main.jpg"
              alt="City skyline"
              className="h-56 w-full rounded-xl object-cover md:h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
