import { TEXT } from '../text';
import { HeaderRow } from '@/app/cancel/shared/HeaderRow';

export function VisaGate({
  foundViaMM, companyLawyer, setCompanyLawyer, onContinue,
}: {
  foundViaMM: boolean;
  companyLawyer: boolean | null;
  setCompanyLawyer: (b: boolean) => void;
  onContinue: () => void;
}) {
  return (
    <>
      <HeaderRow title={foundViaMM ? TEXT.visa_mm_h1 : TEXT.visa_nom_h1} />
      {!foundViaMM && <p className="mb-2 text-gray-700">{TEXT.visa_nom_sub}</p>}
      <label className="block text-sm text-gray-700">
        {TEXT.visa_q}<sup className="text-red-500">*</sup>
      </label>
      <div className="mt-3 space-y-3">
        <label className="flex items-center gap-3">
          <input type="radio" name="companyLawyer" checked={companyLawyer === true} onChange={() => setCompanyLawyer(true)} />
          <span>Yes</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="radio" name="companyLawyer" checked={companyLawyer === false} onChange={() => setCompanyLawyer(false)} />
          <span>No</span>
        </label>
      </div>
      <button
        disabled={companyLawyer === null}
        onClick={onContinue}
        className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {TEXT.complete_cancel}
      </button>
    </>
  );
}
