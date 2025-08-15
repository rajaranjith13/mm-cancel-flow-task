import { NextResponse } from 'next/server'
import { makeToken } from '@/lib/csrf'

export async function GET() {
  const { token, cookieValue } = makeToken()
  const res = NextResponse.json({ token })
  res.cookies.set({
    name: 'csrfToken',
    value: cookieValue,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  })
  return res
}
