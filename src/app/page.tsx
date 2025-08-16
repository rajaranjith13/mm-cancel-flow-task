// src/app/page.tsx
import Link from 'next/link'

export default function Home({
  searchParams,
}: {
  searchParams?: { kept?: string; canceled?: string }
}) {
  const kept = searchParams?.kept === '1'
  const canceled = searchParams?.canceled === '1'

  return (
    <main className="min-h-dvh bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        {/* Status banner */}
        {(kept || canceled) && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              kept
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-violet-300 bg-violet-50 text-violet-800'
            }`}
            role="status"
          >
            {kept ? 'Awesome — your subscription stays active and the discount is applied.' : 'Your subscription has been cancelled successfully.'}
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow ring-1 ring-black/5">
          <h1 className="text-2xl font-semibold text-gray-900">Migrate Mate (Demo)</h1>
          <p className="mt-2 text-gray-600">
            This is the demo home. Use the link below to open the cancellation flow modal.
          </p>
          <div className="mt-6">
            <Link
              href="/cancel"
              className="inline-flex items-center rounded-xl bg-violet-600 px-4 py-3 text-white hover:bg-violet-700"
            >
              Open cancellation flow
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
