import type { Concept, ReviewStatus } from '../types'
import { SOURCES, TIER_LABEL } from '../content/sources'

export const STATUS_INFO: Record<ReviewStatus, { label: string; meaning: string; color: string }> = {
  draft: { label: 'Draft', meaning: 'Not yet checked against authoritative sources. Use it to learn, and verify before quoting.', color: 'var(--color-ink-2)' },
  'source-identified': { label: 'Sources identified', meaning: 'Authoritative sources are listed, but not every claim has been compared with them yet.', color: 'var(--color-sorange)' },
  'source-checked': { label: 'Source-checked', meaning: 'Key definitions and formulas were compared with the cited sections.', color: 'var(--color-sblue)' },
  'math-validated': { label: 'Math validated', meaning: 'Formulas and numbers were independently recomputed.', color: 'var(--color-sblue)' },
  'expert-reviewed': { label: 'Expert reviewed', meaning: 'Reviewed by a named subject-matter expert.', color: 'var(--color-sgreen)' },
  'update-required': { label: 'Update required', meaning: 'Part of this lesson is known to be out of date.', color: 'var(--color-sred)' },
}

const REPO = 'https://github.com/zubayer/ie-launchpads'
export const reportUrl = (c: Concept) => {
  const title = `Content issue: ${c.term} (${c.id})`
  const body = [`**Lesson:** ${c.term} — \`${c.id}\``, '', '**What looks wrong?**', '', '**What should it say? (link a source if you can)**', ''].join('\n')
  return `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
}

export function ReviewChip({ c }: { c: Concept }) {
  const s = STATUS_INFO[c.review?.status ?? 'draft']
  return (
    <a href="#sources" onClick={(e) => { e.preventDefault(); document.getElementById('sources')?.scrollIntoView({ behavior: 'smooth' }) }}
      className="chip hover:underline" style={{ borderColor: s.color, color: s.color }} title={s.meaning}>
      {s.label}
    </a>
  )
}

export function SourcesBlock({ c }: { c: Concept }) {
  const r = c.review
  const s = STATUS_INFO[r?.status ?? 'draft']
  return (
    <div className="space-y-4">
      <div className="rounded-lg border-l-4 p-4" style={{ borderColor: s.color, background: 'color-mix(in srgb, var(--color-paper) 70%, transparent)' }}>
        <p className="font-semibold" style={{ color: s.color }}>Review status: {s.label}</p>
        <p className="mt-1 text-[0.95rem]">{s.meaning}</p>
        {r && <p className="mt-1 text-sm text-ink-2">{r.by} · {r.on}{r.note ? ` · ${r.note}` : ''}</p>}
        {c.example?.check && <p className="mt-1 text-sm text-sgreen">✓ The worked example’s answer is recomputed by an automated test.</p>}
      </div>

      {c.cites?.length ? (
        <ol className="space-y-3">
          {c.cites.map((ct, i) => {
            const src = SOURCES[ct.src]
            return (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-xs font-semibold">{i + 1}</span>
                <div className="min-w-0">
                  <a className="font-semibold text-sblue hover:underline" href={ct.url || src.url} target="_blank" rel="noopener noreferrer">{ct.section || src.title} ↗</a>
                  <p className="text-sm text-ink-2">{src.authors ? `${src.authors}. ` : ''}{src.title}{src.year ? ` (${src.year})` : ''} — {src.publisher}{src.doi ? ` · DOI ${src.doi}` : ''}</p>
                  <p className="mt-0.5 text-sm"><span className="text-ink-2">Supports:</span> {ct.supports}</p>
                  <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
                    <span className="chip !py-0">{TIER_LABEL[src.tier]}</span>
                    <span className="chip !py-0">{src.access === 'open' ? 'Free to read' : src.access === 'paywalled' ? 'Paywalled' : 'Free account'}</span>
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="text-sm text-ink-2">No verified sources are attached to this lesson yet. The “Live from the web” section has starting points, but those are not checked references.</p>
      )}

      <p className="text-sm">
        Spotted something wrong or outdated? <a className="font-semibold text-sblue underline" href={reportUrl(c)} target="_blank" rel="noopener noreferrer">Report an error ↗</a>
        <span className="text-ink-2"> (opens a pre-filled GitHub issue)</span>
      </p>
    </div>
  )
}
