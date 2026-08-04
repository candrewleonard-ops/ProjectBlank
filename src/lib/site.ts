// Change these two lines to re-brand the whole site.
export const SITE_NAME = 'Reinnovation Homes'
export const SITE_TAGLINE = 'Live deal updates for investors & followers'

// Contact details shown to visitors. Change them here and they update
// everywhere they appear on the site.
export const CONTACT_NAME = 'Carson Leonard'
export const CONTACT_PHONE = '812-890-8917'
export const CONTACT_PHONE_HREF = 'tel:+18128908917'
export const CONTACT_EMAIL = 'candrewleonard@gmail.com'
export const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=Interested%20in%20financing%20a%20deal`

// Minimum partnership check size mentioned in investor-facing copy.
export const PARTNER_MINIMUM = '$10,000'

export const FACEBOOK_PAGE_URL = 'https://www.facebook.com/share/1PFnggBkzR/?mibextid=wwXIfr'
export const FACEBOOK_CARSON_URL = 'https://www.facebook.com/carson.leonard.843493/'

export const ADDRESS_ON_REQUEST = 'Address available upon request'

// Realtor fees, interest payments, and closing costs, estimated as a share of
// ARV. Subtracted from ARV - lien to get "projected cash at close".
export const SELLING_COST_RATE = 0.085

// Cash reserves held on every deal: RESERVE_MONTHS months of payments at
// MONTHLY_PAYMENT_RATE of the lien per month, plus REHAB_RESERVE_RATE of the
// rehab budget on hand in cash.
export const RESERVE_MONTHS = 3
export const MONTHLY_PAYMENT_RATE = 0.01
export const REHAB_RESERVE_RATE = 0.15

// The exact street address is never shown publicly. Admins enter the full
// address (e.g. 123 Main St, Indianapolis, IN 46201) and visitors only ever
// see everything after the first comma (Indianapolis, IN 46201).
export function publicLocation(address: string | null | undefined): string | null {
  if (!address) return null
  const comma = address.indexOf(',')
  if (comma === -1) return null
  const rest = address.slice(comma + 1).trim()
  return rest.length > 0 ? rest : null
}
