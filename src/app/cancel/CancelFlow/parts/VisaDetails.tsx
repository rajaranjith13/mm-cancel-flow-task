import { TEXT } from '../text';
import { HeaderRow } from '@/app/cancel/shared/HeaderRow';

export function VisaDetails({
  foundViaMM, companyLawyer, visaType, setVisaType, disabled, onComplete,
}: {
  foundViaMM: boolean;
  companyLawyer: boolean;
  visaType: string;
  setVisaType: (v: string) => void;
  disabled: boolean;
  onComplete: () => Promise<void> | void;
}) {
  return (
    <>
      <HeaderRow title={foundViaMM ? TEXT.visa_mm_h1 : TEXT.visa_nom_h1} />
      {!foundViaMM && <p className="mb-2 text-gray-700">{TEXT.visa_nom_sub}</p>}
      {!companyLawyer && <p className="mt-1 text-gray-700">{TEXT.visa_partner_help}</p>}
      <label className="mt-3 block text-sm text-gray-700">
        {companyLawyer ? TEXT.visa_type_q_yes : TEXT.visa_type_q_no}
        <sup className="text-red-500">*</sup>
      </label>
      <input
        value={visaType}
        onChange={(e) => setVisaType(e.target.value)}
        placeholder="Enter visa type…"
        className="mt-2 w-full rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-violet-600"
      />
      <button
        disabled={disabled}
        onClick={onComplete}
        className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {TEXT.complete_cancel}
      </button>
    </>
  );
}
