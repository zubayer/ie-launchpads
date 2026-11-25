// Reading numbers out of displayed text, for numeric QA tests (KNOW-03).
const SUP: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' }
export const half = (dp: number) => (dp >= 20 ? 1e-12 : 0.5 * 10 ** -dp + 1e-9)
/** Every number written in a piece of text, with its displayed precision. Understands 12,000, −3, 1×10⁻⁴ and 80%. */
export function numbersIn(text: string): { x: number; dp: number; pct: boolean }[] {
  const t = text
    .replace(/(\d)[,  ](?=\d{3}\b)/g, '$1')
    .replace(/−/g, '-')
    .replace(/(\d+(?:\.\d+)?)\s*[×x]\s*10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, m, e) => `${m}e${[...e].map((ch: string) => SUP[ch]).join('')}`)
  return [...t.matchAll(/-?\d+(?:\.\d+)?(?:e-?\d+)?(\s*%)?/g)].map((m) => {
    const raw = m[0].replace('%', '').trim()
    const dp = raw.includes('e') ? 20 : (raw.split('.')[1] || '').length
    return { x: Number(raw), dp, pct: !!m[1] }
  })
}
/** True when `v`, rounded to the precision written in the text, appears in it (as a plain number or a percentage). */
export function shows(text: string, v: number) {
  return numbersIn(text).some(({ x, dp, pct }) => (pct ? Math.abs(x - v * 100) <= half(dp) || Math.abs(x - v) <= half(dp) : Math.abs(x - v) <= half(dp) || (dp >= 20 && Math.abs(x - v) <= Math.abs(v) * 1e-9)))
}

