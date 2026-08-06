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

// Rehab cash reserve held per deal, as a share of the rehab budget.
export const REHAB_RESERVE_RATE = 0.15

// Interest-only payments are covered in-house, so investors just see that
// they're funded rather than a dollar figure.
export const PAYMENTS_FUNDED_LABEL = '3 months of monthly payments'
export const PAYMENTS_FUNDED_NOTE =
  'Property Interest Only Loan Payments Funded by Reinnovation Homes & ZGH Holdings LLC, each payment'

// The open portfolio raise shown at the bottom of the deals page. Each tier
// unlocks the rehab reserve for another property, in order.
export const RAISE_TOTAL = 25000
export const RAISE_TIERS = [
  { amount: 6500, label: 'Lima, OH', note: 'Operating' },
  { amount: 11500, label: 'Newport News, VA', note: 'Starts rehab' },
  { amount: 18000, label: 'Zanesville, OH', note: 'Starts rehab' },
  { amount: 25000, label: 'Columbus, IN', note: 'Fully running' },
]

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
