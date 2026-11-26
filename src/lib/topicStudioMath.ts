export function taktLab(shift: number, breaks: number, demand: number, cycle: number) {
  if (![shift, breaks, demand, cycle].every(Number.isFinite) || breaks < 0 || shift <= breaks || demand <= 0 || cycle <= 0) return null
  const seconds = (shift - breaks) * 60
  return { seconds, takt: seconds / demand, capacity: Math.floor(seconds / cycle) }
}
export const ladderLab = (a: boolean, b: boolean, c: boolean) => (a || !b) && c
export function newtonLab(start: number, steps: number) {
  if (!Number.isFinite(start) || start <= 0 || !Number.isInteger(steps) || steps < 0 || steps > 20) return []
  const values = [start]
  for (let i = 0; i < steps; i++) {
    const x = values[values.length - 1]
    const next = x / 2 + 1 / x
    if (!Number.isFinite(next)) break
    values.push(next)
  }
  return values
}
export function npvLab(cost: number, saving: number, rate: number) {
  if (![cost, saving, rate].every(Number.isFinite) || cost < 0 || rate <= -1) return null
  return Array.from({ length: 5 }, (_, i) => saving / (1 + rate) ** (i + 1)).reduce((a, b) => a + b, -cost)
}
export function capabilityLab(mean: number, sigma: number) {
  if (![mean, sigma].every(Number.isFinite) || sigma <= 0) return null
  return { cp: 20 / (6 * sigma), cpk: Math.min(60 - mean, mean - 40) / (3 * sigma) }
}
