import { useEffect, useId, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { TEXT_SIZES, THEMES, applyDisplay, resolveTheme, type TextSize, type ThemeId } from '../lib/display'

/** Applies the saved theme and text size to <html>, following the device when the theme is "Match device". */
export function useDisplay() {
  const theme = useStore((s) => s.settings.theme)
  const size = useStore((s) => s.settings.textSize ?? 'standard')
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => applyDisplay(theme, size, mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme, size])
}

function Swatch({ colors, device }: { colors?: [string, string, string]; device?: boolean }) {
  if (device || !colors) {
    return (
      <span aria-hidden className="flex h-8 w-11 shrink-0 overflow-hidden rounded border border-line">
        <span className="flex flex-1 items-center justify-center bg-[#f4f6fa] text-[0.7rem] font-bold text-[#172033]">A</span>
        <span className="flex flex-1 items-center justify-center bg-[#0f1522] text-[0.7rem] font-bold text-[#e7ecf4]">A</span>
      </span>
    )
  }
  const [bg, fg, accent] = colors
  return (
    <span aria-hidden className="flex h-8 w-11 shrink-0 flex-col justify-center gap-1 rounded border border-line px-1.5" style={{ background: bg }}>
      <span className="text-[0.7rem] font-bold leading-none" style={{ color: fg }}>Aa</span>
      <span className="block h-1 w-6 rounded-full" style={{ background: accent }} />
    </span>
  )
}

/** Top-bar button that opens colour theme and text size choices. */
export default function DisplayMenu() {
  const theme = useStore((s) => s.settings.theme)
  const size = useStore((s) => s.settings.textSize ?? 'standard')
  const setSettings = useStore((s) => s.setSettings)
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()
  const dark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  const shown = THEMES.find((t) => t.id === resolveTheme(theme, dark))!

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus() } }
    const onDown = (e: PointerEvent) => { if (!panel.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    // Start on the chosen theme, so arrow keys move through the choices.
    panel.current?.querySelector<HTMLInputElement>('input[name$="-theme"]:checked')?.focus()
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onDown) }
  }, [open])

  return (
    <div className="relative shrink-0">
      <button ref={btn} type="button" className="btn btn-ghost !px-3 !py-1.5" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}
        title="Colour theme and text size">
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" /></svg>
        <span className="hidden md:inline">Display</span>
        <span className="sr-only md:hidden">Display</span>
        <span className="sr-only">: {shown.label}{theme === 'system' ? ' (matching device)' : ''}, {TEXT_SIZES.find((t) => t.id === size)!.label.toLowerCase()} text</span>
      </button>
      {open && (
        <div ref={panel} id={id} role="group" aria-label="Display settings"
          className="sheet absolute right-0 top-full z-50 mt-2 max-h-[calc(100dvh-4.5rem)] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain rounded-lg p-4 shadow-xl">
          <fieldset>
            <legend className="text-sm font-bold">Colour theme</legend>
            <div className="mt-2 space-y-1">
              {THEMES.map((t) => (
                <label key={t.id} className={`flex cursor-pointer items-center gap-3 rounded-md border px-2.5 py-2 ${theme === t.id ? 'border-sblue bg-sblue/10' : 'border-transparent hover:bg-grid'}`}>
                  <input type="radio" name={`${id}-theme`} className="sr-only" checked={theme === t.id} onChange={() => setSettings({ theme: t.id as ThemeId })} />
                  <Swatch colors={t.swatch} device={t.base === 'device'} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{t.label}</span>
                    <span className="block text-xs text-ink-2">{t.hint}</span>
                  </span>
                  {theme === t.id && <span aria-hidden className="ml-auto text-sblue">✓</span>}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-4">
            <legend className="text-sm font-bold">Text size</legend>
            <div className="mt-2 grid grid-cols-3 gap-1">
              {TEXT_SIZES.map((t, i) => (
                <label key={t.id} className={`flex cursor-pointer flex-col items-center rounded-md border px-2 py-1.5 ${size === t.id ? 'border-sblue bg-sblue/10 font-semibold' : 'border-line hover:bg-grid'}`}>
                  <input type="radio" name={`${id}-size`} className="sr-only" checked={size === t.id} onChange={() => setSettings({ textSize: t.id as TextSize })} />
                  <span aria-hidden className="font-bold leading-none" style={{ fontSize: `${0.9 + i * 0.2}rem` }}>A</span>
                  <span className="mt-1 text-xs">{t.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="mt-3 text-xs text-ink-2">Saved in this browser. Every theme meets WCAG contrast for text; the high-contrast ones go further.</p>
        </div>
      )}
    </div>
  )
}
