// src/lib/csrf.ts
import { cookies, headers } from 'next/headers'
import crypto from 'crypto'

const COOKIE_NAME = 'csrfToken'
const SECRET = process.env.CSRF_SECRET || 'dev-secret-only'

export function makeToken() {
  const token = crypto.randomBytes(24).toString('base64url')
  const mac = crypto.createHmac('sha256', SECRET).update(token).digest('base64url')
  return { token, cookieValue: `${token}.${mac}` }
}

/** Verify token from request body against cookie + simple origin check */
export function verifyCsrfToken(formValue: string): boolean {
  const cookie = cookies().get(COOKIE_NAME)?.value
  if (!cookie || !formValue) return false

  const [token, mac] = cookie.split('.')
  if (!token || !mac) return false

  const expected = crypto.createHmac('sha256', SECRET).update(token).digest('base64url')
  const okToken = crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected)) && formValue === token

  const origin = headers().get('origin') || ''
  const referer = headers().get('referer') || ''
  const allowedOrigin =
    origin === '' ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1') ||
    origin.startsWith('https://localhost')
  const okOrigin = allowedOrigin || (referer && origin && referer.startsWith(origin))

  return okToken && okOrigin
}
