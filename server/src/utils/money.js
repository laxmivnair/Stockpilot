/**
 * Utility helpers to avoid JavaScript floating-point errors (e.g. 0.1 + 0.2 = 0.30000000000000004)
 * when dealing with monetary values and calculations before sending to PostgreSQL NUMERIC columns.
 */

export function toCents(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount)
  if (isNaN(num)) return 0
  return Math.round(num * 100)
}

export function fromCents(cents) {
  return (cents / 100).toFixed(2)
}

export function calculateLineTotal(unitPrice, quantity) {
  const priceInCents = toCents(unitPrice)
  const lineTotalCents = priceInCents * quantity
  return fromCents(lineTotalCents)
}

export function sumAmounts(amounts) {
  const totalCents = amounts.reduce((acc, curr) => acc + toCents(curr), 0)
  return fromCents(totalCents)
}
