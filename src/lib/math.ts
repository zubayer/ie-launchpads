// Small, dependency-free numerics used by simulators and by the example checks.

export const sum = (a: number[]) => a.reduce((s, x) => s + x, 0)
export const mean = (a: number[]) => (a.length ? sum(a) / a.length : NaN)
export function sd(a: number[], sample = true) {
  const m = mean(a)
  return Math.sqrt(sum(a.map((x) => (x - m) ** 2)) / (a.length - (sample ? 1 : 0)))
}
export const round = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d
export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

/** Standard normal pdf / cdf (Abramowitz–Stegun 7.1.26 erf approximation, |err| < 1.5e-7). */
export const phi = (z: number) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI)
export function erf(x: number) {
  const s = Math.sign(x)
  x = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * x)
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return s * y
}
export const Phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2))
/** Inverse standard normal (Acklam's algorithm). */
export function PhiInv(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239]
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572]
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416]
  const pl = 0.02425
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p > 1 - pl) return -PhiInv(1 - p)
  const q = p - 0.5
  const r = q * q
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}

/** Seeded random + normal draws so simulations are reproducible. */
export function makeRng(seed = 42) {
  let t = seed >>> 0
  const u = () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
  const normal = (m = 0, s = 1) => {
    let a = 0
    while (a === 0) a = u()
    return m + s * Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * u())
  }
  const expo = (rate: number) => -Math.log(1 - u()) / rate
  return { u, normal, expo }
}

export function linreg(x: number[], y: number[]) {
  const mx = mean(x), my = mean(y)
  const sxy = sum(x.map((xi, i) => (xi - mx) * (y[i] - my)))
  const sxx = sum(x.map((xi) => (xi - mx) ** 2))
  const b1 = sxy / sxx
  const b0 = my - b1 * mx
  const ssTot = sum(y.map((yi) => (yi - my) ** 2))
  const ssRes = sum(y.map((yi, i) => (yi - (b0 + b1 * x[i])) ** 2))
  return { b0, b1, r2: 1 - ssRes / ssTot }
}

export const npv = (rate: number, flows: number[]) => sum(flows.map((f, t) => f / (1 + rate) ** t))
export function irr(flows: number[]) {
  let lo = -0.99, hi = 10
  const f = (r: number) => npv(r, flows)
  if (f(lo) * f(hi) > 0) return NaN
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (f(lo) * f(mid) <= 0) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

/** Erlang C: probability an arrival waits in an M/M/c queue. */
export function erlangC(lambda: number, mu: number, c: number) {
  const a = lambda / mu
  const rho = a / c
  if (rho >= 1) return 1
  let s = 0
  let term = 1
  for (let k = 0; k < c; k++) {
    if (k > 0) term *= a / k
    s += term
  }
  const last = (term * a) / c // a^c / c!
  const top = last / (1 - rho)
  return top / (s + top)
}

export function mmc(lambda: number, mu: number, c: number) {
  const rho = lambda / (c * mu)
  if (rho >= 1) return { rho, pw: 1, wq: Infinity, lq: Infinity, w: Infinity, l: Infinity }
  const pw = erlangC(lambda, mu, c)
  const wq = pw / (c * mu - lambda)
  const lq = lambda * wq
  const w = wq + 1 / mu
  return { rho, pw, wq, lq, w, l: lambda * w }
}
