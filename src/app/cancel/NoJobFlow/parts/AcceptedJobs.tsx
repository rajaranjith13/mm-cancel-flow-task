import Image from 'next/image';
import { Header } from './Header';
import { TopChip } from './TopChip';
import { VisaChip } from './VisaChip';
import { CapIcon } from './CapIcon';
import { TEXT } from '../text';

export function AcceptedJobs({ onExit }: { onExit: () => void }) {
  return (
    <>
      <Header title="Awesome — we’ve pulled together a few roles that seem like a great fit for you." />
      <p className="text-gray-600">Take a look and see what sparks your interest.</p>

      <div className="mt-5 rounded-2xl border p-4">
        <div className="flex items-start gap-3">
          <Image src="/logos/randstad.png" alt="Randstad" width={40} height={40} className="rounded" />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-5">Automation Controls Engineer</div>
                <div className="text-xs text-gray-600 leading-5">Randstad USA • Memphis, Tennessee</div>
              </div>
              <div className="hidden sm:flex flex-wrap gap-2 text-[11px] text-gray-700">
                <TopChip>Full Time</TopChip>
                <TopChip>Associate</TopChip>
                <TopChip>Bachelor’s</TopChip>
                <TopChip>On-site</TopChip>
                <TopChip>NEW JOB</TopChip>
              </div>
            </div>

            <div className="sm:hidden mt-2 flex flex-wrap gap-2 text-[11px] text-gray-700">
              <TopChip>Full Time</TopChip>
              <TopChip>Associate</TopChip>
              <TopChip>Bachelor’s</TopChip>
              <TopChip>On-site</TopChip>
            </div>

            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">New Job</span>
              <span className="text-sm">$150,000/yr – $170,000/yr</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600">
              <span>Visas sponsored by company in the last year</span>
              <span className="text-gray-400">2025</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-700">
              <VisaChip label="Green Card" icon={<span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />} />
              <VisaChip label="H-1B" />
              <VisaChip label="TN" />
              <VisaChip label="OPT" icon={<CapIcon />} />
            </div>

            <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-700">
              The Electrical Automation Controls Engineer will design, implement, and maintain industrial automation systems,
              specializing in PLC programming using Siemens TIA Portal. The ideal candidate should have a Bachelor’s degree in
              Electrical Engineering and at least 4 years of experience. Key benefits include comprehensive healthcare and retirement plans.
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <a href="mailto:barbara.tuck@randstadusa.com" className="truncate text-xs text-blue-600 hover:underline">
                Company via contact: barbara.tuck@randstadusa.com
              </a>
              <div className="flex gap-2">
                <button className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Save Job</button>
                <button className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700">
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onExit}
        className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700"
      >
        {TEXT.acceptedCTA}
      </button>
    </>
  );
}
