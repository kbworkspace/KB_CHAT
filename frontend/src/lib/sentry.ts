/**
 * Sentry error reporting, opt-in via VITE_SENTRY_DSN.
 *
 * A missing DSN is a no-op, so local dev and forks never send anything.
 * PII stays off: chat text, emails and tokens must not leave the device
 * inside error reports — only stack traces and breadcrumbs.
 */
import * as Sentry from '@sentry/react'

let started = false

export function initSentry(): boolean {
  if (started) return true
  const dsn = String(import.meta.env.VITE_SENTRY_DSN || '').trim()
  if (!dsn) return false
  const version = String(import.meta.env.VITE_APP_VERSION || '1.2.2')
  Sentry.init({
    dsn,
    environment: String(import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE),
    release: `kb-chat@${version}`,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    // Browser noise that is not an app bug and would drown real errors.
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
    ],
  })
  started = true
  return true
}
