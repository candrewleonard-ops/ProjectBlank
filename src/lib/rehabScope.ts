// The standard rehab scope every project starts from. Bathrooms are expanded
// into one item per bath so each can be tracked and noted on its own.
export const SCOPE_ITEMS = [
  'Kitchen',
  'Floors',
  'Trim',
  'Paint',
  'Roof',
  'HVAC',
  'Vent, light switch & outlet covers',
] as const

// Optional scope that only appears when it applies, each with its own note.
export const OPTIONAL_SCOPE = [
  { key: 'plumbing', label: 'Plumbing work?', title: 'Plumbing work' },
  { key: 'foundation', label: 'Foundation work?', title: 'Foundation work' },
] as const

export type OptionalScopeKey = (typeof OPTIONAL_SCOPE)[number]['key']

/** Builds the ordered task titles for a deal's rehab scope. */
export function buildScopeTitles(fullBaths: number, halfBaths: number): string[] {
  const baths: string[] = []
  for (let i = 1; i <= fullBaths; i++) {
    baths.push(fullBaths === 1 ? 'Bathroom' : `Bathroom ${i}`)
  }
  for (let i = 1; i <= halfBaths; i++) {
    baths.push(halfBaths === 1 ? 'Half bath' : `Half bath ${i}`)
  }
  // Kitchen first, then each bath, then the rest of the standard scope.
  return [SCOPE_ITEMS[0], ...baths, ...SCOPE_ITEMS.slice(1)]
}
