import CancelFlow from './CancelFlow'

export default function Page() {
  return (
    <div className="min-h-dvh bg-gray-100 p-6">
      <CancelFlow
        variant="A"
        cancellationId="00000000-0000-0000-0000-000000000111"
        plan="pro"
        priceCents={2900}
        pending={false}
        csrfToken="dev-csrf"
        prices={{ control: { monthly: 25, annual: 29 }, b: { monthly: 15, annual: 19 } }}
      />
    </div>
  )
}
