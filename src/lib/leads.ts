import { supabase } from './supabase'

const EMAIL_KEY = 'lead-email'

export function getLeadEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_KEY)
  } catch {
    return null
  }
}

export function setLeadEmail(email: string) {
  try {
    localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase())
  } catch {
    /* private browsing — the gate just asks again next visit */
  }
}

// Deliberately strict: must be a real-looking address ending in .com.
export function isValidLeadEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.com$/i.test(value.trim())
}

/** Creates the lead if new, refreshes it if known. Never duplicates. */
export async function upsertLead(
  email: string,
  fields: { name?: string; phone?: string; age_range?: string; wants_partnership?: boolean } = {},
) {
  const clean = email.trim().toLowerCase()
  const payload: Record<string, unknown> = { email: clean, last_seen_at: new Date().toISOString() }
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== '' && v !== null) payload[k] = v
  }
  const { error } = await supabase.from('leads').upsert(payload, { onConflict: 'email' })
  return { error }
}

export async function logLeadEvent(
  eventType: 'signup' | 'deal_view' | 'funding_request' | 'note',
  opts: { dealId?: string | null; detail?: string | null; amount?: number | null } = {},
) {
  const email = getLeadEmail()
  if (!email) return
  await supabase.from('lead_events').insert({
    lead_email: email,
    event_type: eventType,
    deal_id: opts.dealId ?? null,
    detail: opts.detail ?? null,
    amount: opts.amount ?? null,
  })
}
