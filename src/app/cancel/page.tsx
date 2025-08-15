import CancelFlow from './CancelFlow'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { secureAB, type Variant } from '@/lib/ab'

const MOCK_USER_ID = process.env.MOCK_USER_ID! // seeded user id

async function ensureSession(userId: string) {
  // get the user’s latest active/pending subscription
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

  // do we already have a cancellation row for this subscription?
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
    // assign variant and persist once
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

    // mark subscription pending cancellation when entering the flow
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'pending_cancellation' })
      .eq('id', sub.id)
  }

  return { sub, variant, cancellationId }
}

export default async function Page() {
  const { sub, variant, cancellationId } = await ensureSession(MOCK_USER_ID)

  // Prices for the UI text ($25/$29 → show $15/$19 for B)
  const controlMonthly = sub.monthly_price / 100 // 25 or 29
  const prices = {
    control: { monthly: controlMonthly, annual: 29 }, // annual label only; UI shows both
    b: {
      monthly: controlMonthly === 25 ? 15 : 19,
      annual: controlMonthly === 25 ? 15 : 19, // shown in label as “was $29”
    },
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      <CancelFlow
        variant={variant}
        cancellationId={cancellationId}
        plan="pro"
        priceCents={sub.monthly_price}
        pending={sub.status === 'pending_cancellation'}
        prices={prices}
      />
    </div>
  )
}
