import { useEffect, useRef, type ReactNode } from 'react'
import katex from 'katex'
import { Link } from 'react-router-dom'
import type { Concept } from '../types'
import { DOMAIN_MAP } from '../content/domains'
import { useStore, statusOf, type Status } from '../lib/store'

export function Tex({ tex, block = false }: { tex: string; block?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (ref.current) katex.render(tex, ref.current, { displayMode: block, throwOnError: false })
  }, [tex, block])
  return <span ref={ref} />
}

/** Render text with inline $math$ segments. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('$') && p.endsWith('$') && p.length > 2 ? <Tex key={i} tex={p.slice(1, -1)} /> : <span key={i}>{p}</span>,
      )}
    </>
  )
}

export function Tape({ color, className = '' }: { color: string; className?: string }) {
  return <div className={`tape ${className}`} style={{ background: color }} aria-hidden />
}

const STATUS_STYLE: Record<Status, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'border-line text-ink-2' },
  learning: { label: 'Learning', cls: 'border-sorange text-sorange' },
  reviewing: { label: 'Reviewing', cls: 'border-sblue text-sblue' },
  mastered: { label: 'Mastered', cls: 'border-sgreen text-sgreen bg-sgreen/10' },
}

export function useStatus(id: string): Status {
  const p = useStore((s) => s.progress[id])
  const c = useStore((s) => s.cards[id])
  return statusOf(p, c)
}

export function StatusBadge({ id }: { id: string }) {
  const st = useStatus(id)
  const s = STATUS_STYLE[st]
  return <span className={`chip ${s.cls}`}>{s.label}</span>
}

export function StatusDot({ id }: { id: string }) {
  const st = useStatus(id)
  const color = { new: 'transparent', learning: 'var(--color-sorange)', reviewing: 'var(--color-sblue)', mastered: 'var(--color-sgreen)' }[st]
  return (
    <span
      title={STATUS_STYLE[st].label}
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-ink-2"
      style={{ background: color, borderColor: st === 'new' ? undefined : color }}
    />
  )
}

export function ConceptRow({ c, showDomain = true }: { c: Concept; showDomain?: boolean }) {
  const d = DOMAIN_MAP[c.domain]
  return (
    <Link
      to={`/c/${c.id}`}
      className="group flex items-start gap-3 border-b border-line px-1 py-2.5 hover:bg-sblue/5 focus-visible:bg-sblue/5"
    >
      <span className="mt-2"><StatusDot id={c.id} /></span>
      <span className="min-w-0 flex-1">
        <span className="font-semibold group-hover:underline">{c.term}</span>
        {c.full && c.full !== c.term && <span className="text-ink-2"> — {c.full}</span>}
        <span className="block text-[0.92rem] text-ink-2">{c.one}</span>
      </span>
      {showDomain && (
        <span className="hidden shrink-0 items-center gap-1.5 text-xs text-ink-2 sm:flex">
          <span className="inline-block h-2 w-4 rounded-sm" style={{ background: d.tape }} />
          {d.short}
        </span>
      )}
    </Link>
  )
}

export function PageHead({ title, sub, tape, children }: { title: string; sub?: ReactNode; tape?: string; children?: ReactNode }) {
  return (
    <header className="mb-6">
      {tape && <Tape color={tape} className="mb-4 w-24" />}
      <h1 className="display text-3xl sm:text-4xl">{title}</h1>
      {sub && <p className="measure mt-2 text-ink-2">{sub}</p>}
      {children}
    </header>
  )
}

export function Bar({ value, color = 'var(--color-sgreen)', label }: { value: number; color?: string; label?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-sm bg-line/60" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-label={label}>
      <div className="h-full rounded-sm" style={{ width: `${Math.min(100, value * 100)}%`, background: color }} />
    </div>
  )
}

export function Section({ title, children, id, right }: { title: string; children: ReactNode; id?: string; right?: ReactNode }) {
  return (
    <section id={id} className="mb-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="wide text-xl">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}
