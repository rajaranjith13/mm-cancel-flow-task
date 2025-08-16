import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

const USER_ID = process.env.MOCK_USER_ID!

function assignVariant(): 'A' | 'B' {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0] % 2 === 0 ? 'A' : 'B'
}

export async function POST(req: NextRequest) {
  const { subscriptionId } = await req.json()

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('id', subscriptionId)
    .eq('user_id', USER_ID)
    .single()

  if (!subscription) {
    return NextResponse.json({ error: 'subscription_not_found' }, { status: 404 })
  }

  const { data: existing } = await supabaseAdmin
    .from('cancellations')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .eq('user_id', USER_ID)
    .single()

  if (existing) {
    return NextResponse.json({ cancellation: existing })
  }

  const variant = assignVariant()

  const { data: inserted, error } = await supabaseAdmin
    .from('cancellations')
    .insert({
      user_id: USER_ID,
      subscription_id: subscriptionId,
      downsell_variant: variant,
    })
    .select('*')
    .single()

  if (error || !inserted) {
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  }

  return NextResponse.json({ cancellation: inserted })
}
