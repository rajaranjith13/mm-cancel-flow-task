// app/cancel/page.tsx
import CancellationRoot from './CancellationRoot'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { secureAB, type Variant } from '@/lib/ab'

const MOCK_USER_ID = process.env.MOCK_USER_ID! // seeded user id

async function ensureSession(userId: string) {
  const { data: sub, error: subErr } = await supabaseAdmin
    .from('subscriptions')
    .select('id, monthly_price, status, created_at')
    .eq('user_id', userId)
    .in('status', ['active', 'pending_cancellation'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (subErr) throw subErr
  if (!sub) throw new Error('No subscription for user')

  const { data: existing } = await supabaseAdmin
    .from('cancellations')
    .select('id, downsell_variant, created_at')
    .eq('user_id', userId)
    .eq('subscription_id', sub.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let cancellationId: string
  let variant: Variant

  if (existing) {
    cancellationId = existing.id
    variant = existing.downsell_variant as Variant
  } else {
    variant = secureAB()
    const ins = await supabaseAdmin
      .from('cancellations')
      .insert({
        user_id: userId,
        subscription_id: sub.id,
        downsell_variant: variant,
      })
      .select('id')
      .single()
    cancellationId = ins.data!.id

    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'pending_cancellation' })
      .eq('id', sub.id)
  }

  return { sub, variant, cancellationId }
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { variant?: 'A' | 'B'; reset?: '1' }
}) {
  // Optional dev reset: wipe old row so AB can run fresh
  if (searchParams?.reset === '1') {
    // delete existing cancellation rows for the mock user, then fall through
    await supabaseAdmin.from('cancellations')
      .delete()
      .eq('user_id', MOCK_USER_ID)
  }

  const { sub, variant: storedVariant, cancellationId } = await ensureSession(MOCK_USER_ID)

  let finalVariant: Variant = storedVariant

  // URL override: /cancel?variant=B (or A)
  const override = searchParams?.variant
  if (override === 'A' || override === 'B') {
    if (override !== storedVariant) {
      await supabaseAdmin
        .from('cancellations')
        .update({ downsell_variant: override })
        .eq('id', cancellationId)
    }
    finalVariant = override
  }

  const controlMonthly = sub.monthly_price / 100 // 25 or 29
  const prices = {
    control: { monthly: controlMonthly, annual: 29 },
    b: {
      monthly: controlMonthly === 25 ? 15 : 19,
      annual: controlMonthly === 25 ? 15 : 19,
    },
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      <CancellationRoot
        variant={finalVariant}
        cancellationId={cancellationId}
        plan="pro"
        priceCents={sub.monthly_price}
        pending={sub.status === 'pending_cancellation'}
        prices={prices}
      />
    </div>
  )
}
