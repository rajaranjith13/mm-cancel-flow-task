// src/app/api/csrf/route.ts
import { NextResponse } from 'next/server'
import { makeToken } from '@/lib/csrf'

export async function GET() {
  const { token, cookieValue } = makeToken()
  const res = NextResponse.json({ token })
  res.cookies.set('csrfToken', cookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  return res
}
