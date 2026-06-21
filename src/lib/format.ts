const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function formatSalary(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(n) ? currency.format(n) : '—'
}
