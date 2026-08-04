// Minimal CSV parser: handles quoted fields, escaped quotes, commas and
// newlines inside quotes, and CRLF line endings. Returns rows of cells.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      cell = ''
      rows.push(row)
      row = []
    } else {
      cell += ch
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  // Drop fully-empty trailing rows.
  while (rows.length > 0 && rows[rows.length - 1].every((c) => c.trim() === '')) {
    rows.pop()
  }

  return rows
}

export function looksNumeric(value: string): boolean {
  const v = value.trim().replace(/[$,%\s]/g, '')
  return v !== '' && !Number.isNaN(Number(v))
}
