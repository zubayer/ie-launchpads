import { describe, expect, it } from 'vitest'
import { THEMES, displayClasses, isTheme, resolveTheme } from './display'

// Read each theme's colours from styles.css, so the test checks what ships. (The app's tsconfig has no Node types,
// so node:fs is loaded through a computed specifier.)
const fs = (await import(/* @vite-ignore */ ['node', 'fs'].join(':'))) as { readFileSync: (p: URL, enc: string) => string }
const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8')
function tokens(selector: string): Record<string, string> {
  const at = css.indexOf(selector + ' {')
  if (at < 0) throw new Error(`no block for ${selector}`)
  const body = css.slice(at, css.indexOf('}', at))
  return Object.fromEntries([...body.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2].toLowerCase()]))
}
const lum = (h: string) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a: string, b: string) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }

const base = tokens('@theme')
const palettes: Record<string, Record<string, string>> = {
  light: base,
  dark: { ...base, ...tokens('.dark') },
  sepia: { ...base, ...tokens('.theme-sepia') },
  contrast: { ...base, ...tokens('.theme-contrast') },
  'contrast-dark': { ...base, ...tokens('.dark'), ...tokens('.theme-contrast-dark') },
}

describe('display themes', () => {
  it('lists every theme once, with Match device first', () => {
    expect(THEMES[0].id).toBe('system')
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length)
    for (const id of Object.keys(palettes)) expect(isTheme(id)).toBe(true)
  })

  it('resolves Match device and sets the right classes', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(displayClasses('contrast-dark', 'standard', false)).toEqual(['theme-contrast-dark', 'dark'])
    expect(displayClasses('sepia', 'larger', true)).toEqual(['theme-sepia', 'text-larger'])
    expect(displayClasses('system', 'large', true)).toEqual(['theme-dark', 'dark', 'text-large'])
  })

  for (const [name, p] of Object.entries(palettes)) {
    const min = name.startsWith('contrast') ? 7 : 4.5
    it(`${name}: body and secondary text reach ${min}:1 on page, card and tint; borders 3:1 in high contrast`, () => {
      for (const fg of ['ink', 'ink-2', 'sblue']) for (const bg of ['paper', 'sheet', 'grid']) {
        expect(ratio(p[fg], p[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(min)
      }
      for (const fg of ['sgreen', 'sred', 'sorange', 'tape-ink']) for (const bg of ['paper', 'sheet']) {
        expect(ratio(p[fg], p[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5)
      }
      if (name.startsWith('contrast')) expect(ratio(p.line, p.sheet), 'border').toBeGreaterThanOrEqual(3)
    })
  }
})
