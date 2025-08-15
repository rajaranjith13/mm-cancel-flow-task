import { NextRequest, NextResponse } from 'next/server'
import { verifyCsrfToken } from '@/lib/csrf'
import { finalizeSchema } from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabaseServer'

const USER_ID = process.env.MOCK_USER_ID!

export async function POST(req: NextRequest) {
  const json = await req.json()
  const parsed = finalizeSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  if (!verifyCsrfToken(parsed.data.csrfToken)) return NextResponse.json({ error: 'csrf' }, { status: 403 })

  const { cancellationId, reasonKey, reasonText } = parsed.data

  const { data: cancel } = await supabaseAdmin
    .from('cancellations')
    .select('id, subscription_id')
    .eq('id', cancellationId)
    .eq('user_id', USER_ID)
    .single()

  if (!cancel) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  await supabaseAdmin
    .from('cancellations')
    .update({
      accepted_downsell: false,
      reason: reasonText && reasonText.trim()
        ? `${reasonKey}:${reasonText.trim()}`
        : reasonKey,
    })
    .eq('id', cancellationId)
    .eq('user_id', USER_ID)

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'pending_cancellation' })
    .eq('id', cancel.subscription_id)
    .eq('user_id', USER_ID)

  return NextResponse.json({ ok: true })
}
