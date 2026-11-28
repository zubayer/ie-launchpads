/*
 * Display settings: colour theme and text size. Every theme is checked against WCAG 2.2 AA (text ≥ 4.5:1 on
 * page, card and tinted backgrounds); the two high-contrast themes aim for AAA (≥ 7:1). Ratios: display.test.ts.
 */

export type ThemeId = 'system' | 'light' | 'dark' | 'sepia' | 'contrast' | 'contrast-dark'
export type TextSize = 'standard' | 'large' | 'larger'

export interface ThemeInfo {
  id: ThemeId
  label: string
  hint: string
  base: 'light' | 'dark' | 'device'
  /** The browser bar colour on phones. */
  bar?: string
  /** Preview chip: page, text, accent. */
  swatch?: [string, string, string]
}

export const THEMES: ThemeInfo[] = [
  { id: 'system', label: 'Match device', hint: 'Day or Night, following your device setting', base: 'device' },
  { id: 'light', label: 'Day', hint: 'Bright and clear', base: 'light', bar: '#f4f6fa', swatch: ['#f4f6fa', '#172033', '#2459d6'] },
  { id: 'dark', label: 'Night', hint: 'Dark page, easier on the eyes in low light', base: 'dark', bar: '#0f1522', swatch: ['#0f1522', '#e7ecf4', '#7aa5ff'] },
  { id: 'sepia', label: 'Paper', hint: 'Warm, low-glare page for long reading', base: 'light', bar: '#f3ead7', swatch: ['#f3ead7', '#33291b', '#1d5596'] },
  { id: 'contrast', label: 'High contrast', hint: 'Black on white with strong edges', base: 'light', bar: '#ffffff', swatch: ['#ffffff', '#000000', '#0037a0'] },
  { id: 'contrast-dark', label: 'High contrast dark', hint: 'White on black with bright accents', base: 'dark', bar: '#000000', swatch: ['#000000', '#ffffff', '#8fc8ff'] },
]

export const TEXT_SIZES: { id: TextSize; label: string; scale: number }[] = [
  { id: 'standard', label: 'Standard', scale: 1 },
  { id: 'large', label: 'Large', scale: 1.125 },
  { id: 'larger', label: 'Larger', scale: 1.25 },
]

export const isTheme = (x: unknown): x is ThemeId => THEMES.some((t) => t.id === x)
export const isTextSize = (x: unknown): x is TextSize => TEXT_SIZES.some((t) => t.id === x)

/** The theme actually shown: "Match device" resolves to Day or Night. */
export function resolveTheme(theme: ThemeId, prefersDark: boolean): Exclude<ThemeId, 'system'> {
  return theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
}

/** Classes for <html>: `dark` for every dark-based theme (Tailwind's dark: styles), plus one theme class. */
export function displayClasses(theme: ThemeId, size: TextSize, prefersDark: boolean): string[] {
  const t = resolveTheme(theme, prefersDark)
  const info = THEMES.find((x) => x.id === t)!
  const out = [`theme-${t}`]
  if (info.base === 'dark') out.push('dark')
  if (size !== 'standard') out.push(`text-${size}`)
  return out
}

export function applyDisplay(theme: ThemeId, size: TextSize, prefersDark: boolean, root = document.documentElement) {
  for (const c of [...root.classList]) if (c === 'dark' || c.startsWith('theme-') || c === 'text-large' || c === 'text-larger') root.classList.remove(c)
  root.classList.add(...displayClasses(theme, size, prefersDark))
  const bar = THEMES.find((x) => x.id === resolveTheme(theme, prefersDark))?.bar
  if (bar) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bar)
}
