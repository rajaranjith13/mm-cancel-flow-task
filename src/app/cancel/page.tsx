// src/app/cancel/page.tsx
import CancellationRoot from './CancellationRoot'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { secureAB, type Variant } from '@/lib/ab'

const MOCK_USER_ID = process.env.MOCK_USER_ID! // seeded user id

async function ensureSession(userId: string, variantOverride?: Variant) {
  // 1) get latest active/pending subscription
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

  // 2) existing cancellation for this sub?
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
    // Respect persisted variant unless an explicit override is used.
    variant = variantOverride ?? (existing.downsell_variant as Variant)
    cancellationId = existing.id

    if (variantOverride && variantOverride !== existing.downsell_variant) {
      await supabaseAdmin
        .from('cancellations')
        .update({ downsell_variant: variantOverride })
        .eq('id', existing.id)
        .eq('user_id', userId)
    }
  } else {
    variant = variantOverride ?? secureAB()
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

    // mark pending when entering flow (your original behavior)
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'pending_cancellation' })
      .eq('id', sub.id)
  }

  return { sub, variant, cancellationId }
}

// Add searchParams so we can accept /cancel?force=A|B in dev.
export default async function Page({
  searchParams,
}: {
  searchParams?: { force?: 'A' | 'B' }
}) {
  const force = searchParams?.force
  const variantOverride = force === 'A' || force === 'B' ? force : undefined

  const { sub, variant, cancellationId } = await ensureSession(MOCK_USER_ID, variantOverride)

  const controlMonthly = sub.monthly_price / 100 // 25 or 29
  const prices = {
    control: { monthly: controlMonthly, annual: 29 },
    b: {
      monthly: controlMonthly === 25 ? 15 : 19,
      annual: controlMonthly === 25 ? 15 : 19, // label shows “was $29”
    },
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      <CancellationRoot
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
