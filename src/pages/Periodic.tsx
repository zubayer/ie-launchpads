import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CONCEPT_MAP, neighbors } from '../content'
import { ELEMENTS, ELEMENT_IO, FAMILIES, type Element, type FamilyId } from '../content/periodic'
import { CHAINS } from '../content/chains'
import { SIM_META } from '../sims/registry'
import { EXTRA_SIM } from '../content/visuals'
import { LEVEL_NAME, type Concept } from '../types'
import { PageHead, Tex } from '../components/ui'
import type { ConceptIndex } from '../content/assemble'
import { useConcept } from '../content/load'

const FAM = Object.fromEntries(FAMILIES.map((f) => [f.id, f])) as Record<FamilyId, (typeof FAMILIES)[number]>
const simOf = (c: ConceptIndex) => SIM_META.find((s) => s.id === (c.sim || EXTRA_SIM[c.id])) || SIM_META.find((s) => s.concepts.includes(c.id))
const famStyle = (f: FamilyId, level = 1) => ({ '--fam-l': FAM[f].light, '--fam-d': FAM[f].dark, '--tint': `${[0, 6, 11, 17, 24][level]}%`, '--tint-d': `${[0, 9, 15, 22, 30][level]}%` }) as CSSProperties
const BY_SYM = Object.fromEntries(ELEMENTS.map((e) => [e.id, e]))

function Tile({ e, big = false, marks = '' }: { e: Element; big?: boolean; marks?: string }) {
  return (
    <span className={`el-tile ${big ? 'el-big' : ''}`} style={famStyle(e.family, e.c.level)} aria-hidden>
      <span className="flex justify-between text-[10px] text-ink"><span>{e.n}</span><span>L{e.c.level}</span></span>
      <span className="el-sym">{e.sym}</span>
      <span className="flex items-end gap-1"><span className="el-name min-w-0 flex-1">{big ? FAM[e.family].name : e.c.term}</span>{marks && <span className="el-marks">{marks}</span>}</span>
    </span>
  )
}

function Detail({ e }: { e: Element }) {
  const c = e.c
  const io = ELEMENT_IO[e.id]
  const full = useConcept(c.id).data // mistakes and worked numbers come with the lesson text
  const traps: string[] = io?.traps || full?.mistakes || []
  const example = io?.example || full?.example?.a
  const sim = simOf(c)
  const near = neighbors(c).slice(0, 6)
  return (
    <div>
      <div className="flex items-center gap-4 pr-10">
        <Tile e={e} big />
        <div className="min-w-0">
          <h2 id="el-title" className="text-2xl font-extrabold leading-tight">{c.term}</h2>
          <p className="text-sm text-ink-2">{FAM[e.family].long} · {LEVEL_NAME[c.level]}</p>
        </div>
      </div>
      <p className="mt-4 text-[1.02rem] leading-relaxed">{c.one}</p>
      {c.formula && <div className="mt-4 rounded-md border border-line bg-paper/60 px-3 py-1"><Tex tex={c.formula.tex} block /></div>}
      {io && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div><p className="label mb-1">Goes in</p><ul className="space-y-1.5">{io.ins.map((x) => <li key={x} className="rounded-md bg-paper px-3 py-2 text-sm">{x}</li>)}</ul></div>
          <div><p className="label mb-1">Comes out</p><p className="el-out rounded-md bg-paper px-3 py-2 text-sm" style={famStyle(e.family)}>{io.out}</p></div>
        </div>
      )}
      {example && <p className="mt-4 text-sm leading-relaxed"><strong>Worked numbers:</strong> {example}</p>}
      {traps.length > 0 && (
        <div className="mt-4">
          <p className="label mb-1 !text-sorange">How it misleads you</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">{traps.slice(0, 3).map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
      {near.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="label mr-1">Reacts with</span>
          {near.map((n) => (BY_SYM[n.id]
            ? <Link key={n.id} to={`?el=${n.id}`} className="chip hover:border-ink">{BY_SYM[n.id].sym} · {n.term}</Link>
            : <Link key={n.id} to={`/c/${n.id}`} className="chip hover:border-ink">{n.term}</Link>))}
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <Link className="btn" to={`/c/${c.id}`}>Open the lesson</Link>
        {sim && <Link className="btn-tape btn" to={`/lab/${sim.id}`}>Run the lab: {sim.name}</Link>}
      </div>
    </div>
  )
}

export function Periodic() {
  const [params, setParams] = useSearchParams()
  const [fam, setFam] = useState<FamilyId | ''>('')
  const [q, setQ] = useState('')
  const sel: Element | undefined = BY_SYM[params.get('el') || '']
  const dlg = useRef<HTMLDialogElement>(null)
  // The pop-up follows the URL (?el=…), so an element can be linked to and the browser Back button closes it.
  useEffect(() => {
    const d = dlg.current
    if (!d) return
    if (sel && !d.open) d.showModal()
    if (!sel && d.open) d.close()
  }, [sel])
  const ql = q.trim().toLowerCase()
  const match = (e: Element) => (!fam || e.family === fam) && (!ql || e.sym.toLowerCase() === ql || e.c.term.toLowerCase().includes(ql) || (e.c.aka || []).some((a) => a.toLowerCase().includes(ql)))
  const cols = useMemo(() => FAMILIES.map((f) => ({ f, els: ELEMENTS.filter((e) => e.family === f.id) })), [])
  const hits = ELEMENTS.filter(match).length
  const pick = (id: string) => setParams({ el: id }, { replace: true })
  const close = () => { if (params.get('el')) { const p = new URLSearchParams(params); p.delete('el'); setParams(p, { replace: true }) } }
  const step = (d: number) => { if (sel) pick(ELEMENTS[(sel.n - 1 + d + ELEMENTS.length) % ELEMENTS.length].id) }
  return (
    <div>
      <PageHead title="Periodic Table of Industrial Engineering" sub={`${ELEMENTS.length} core methods in ${FAMILIES.length} families. Inside each family, elements run from Foundation at the top to Advanced at the bottom. Pick one to see what goes in, what comes out, and how it misleads you.`}>
        <div className="no-print mt-4 flex flex-wrap items-end gap-3">
          <label className="block"><span className="label">Find an element</span><input className="input mt-1 !w-60" type="search" value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Try takt, Cpk, EOQ…" /></label>
          <button className="btn-ghost btn" onClick={() => window.print()}>Print poster</button>
          <Link className="btn-ghost btn" to="/chains">Reaction chains →</Link>
          {(ql || fam) && <span className="pb-2 text-sm text-ink-2" aria-live="polite">{hits} of {ELEMENTS.length} match</span>}
        </div>
      </PageHead>
      <div className="no-print mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by family">
        <button className={`pop-btn !py-1.5 ${!fam ? '!border-sblue !text-sblue' : ''}`} aria-pressed={!fam} onClick={() => setFam('')}>All families</button>
        {FAMILIES.map((f) => (
          <button key={f.id} className={`pop-btn !py-1.5 ${fam === f.id ? '!border-sblue !text-sblue' : ''}`} aria-pressed={fam === f.id} onClick={() => setFam(fam === f.id ? '' : f.id)} style={famStyle(f.id)}>
            <span aria-hidden className="el-swatch" />{f.name}
          </button>
        ))}
        <span className="ml-auto text-xs text-ink-2">ƒ has a formula · ▸ has a lab · L1 Foundation → L4 Advanced</span>
      </div>
      <div>
        <div className="overflow-x-auto pb-2" tabIndex={0} role="region" aria-label="The periodic table; scroll sideways on small screens">
          <div className="grid min-w-[52rem] grid-cols-10 gap-2">
            {cols.map(({ f, els }) => (
              <div key={f.id} className="flex flex-col gap-1.5">
                <div className="el-head" style={famStyle(f.id)}><span className="font-bold">{f.name}</span><span className="block text-[11px] font-normal text-ink-2">{els.length} elements</span></div>
                {els.map((e) => {
                  const on = e.id === sel?.id
                  const marks = `${e.c.formula ? 'ƒ' : ''}${simOf(e.c) ? '▸' : ''}`
                  return (
                    <button key={e.id} onClick={() => pick(e.id)} aria-pressed={on} title={e.c.term}
                      aria-label={`${e.c.term}: ${f.name}, level ${e.c.level}${e.c.formula ? ', has a formula' : ''}${simOf(e.c) ? ', has a lab' : ''}`}
                      className={`el-btn ${on ? 'el-on' : ''} ${match(e) ? '' : 'el-dim'}`}>
                      <Tile e={e} marks={marks} />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <dialog ref={dlg} className="el-dialog" aria-labelledby="el-title" onClose={close}
        onClick={(ev) => { if (ev.target === ev.currentTarget) dlg.current?.close() }}>
        {sel && (
          <div className="el-dialog-body">
            <button className="el-x" onClick={() => dlg.current?.close()} aria-label="Close">×</button>
            <Detail e={sel} />
            <div className="mt-5 flex items-center justify-between gap-2 border-t border-line pt-4 text-sm">
              <button className="pop-btn !py-1.5" onClick={() => step(-1)}>← {ELEMENTS[(sel.n - 2 + ELEMENTS.length) % ELEMENTS.length].c.term}</button>
              <span className="text-ink-2">{sel.n} of {ELEMENTS.length}</span>
              <button className="pop-btn !py-1.5" onClick={() => step(1)}>{ELEMENTS[sel.n % ELEMENTS.length].c.term} →</button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  )
}

export function Chains() {
  const [params, setParams] = useSearchParams()
  const chain = CHAINS.find((c) => c.id === params.get('chain')) || CHAINS[0]
  const step = Math.min(Math.max(0, Number(params.get('step')) || 0), chain.steps.length - 1)
  const go = (chainId: string, s: number) => setParams({ chain: chainId, step: String(s) }, { replace: true })
  const cur = chain.steps[step]
  const c = CONCEPT_MAP[cur.id]
  const el = BY_SYM[cur.id]
  return (
    <div>
      <PageHead title="Reaction chains" sub="Real projects chain several methods. Pick a chain and step through it: what each step does, what it hands to the next, and how to say the whole thing in an interview." />
      <div className="no-print mb-5 flex flex-wrap gap-2" role="group" aria-label="Choose a chain">
        {CHAINS.map((ch) => <button key={ch.id} className={`pop-btn !py-2 !text-sm ${ch.id === chain.id ? '!border-sblue !text-sblue' : ''}`} aria-pressed={ch.id === chain.id} onClick={() => go(ch.id, 0)}>{ch.name}</button>)}
      </div>
      <ol className="mb-6 flex flex-wrap items-center gap-y-3" aria-label={`${chain.name} steps`}>
        {chain.steps.map((s, i) => {
          const e = BY_SYM[s.id]; const cc = CONCEPT_MAP[s.id]
          return (
            <li key={s.id} className="flex items-center">
              <button onClick={() => go(chain.id, i)} aria-current={i === step ? 'step' : undefined} className={`el-step ${i === step ? 'el-on' : ''}`} style={e ? famStyle(e.family, cc.level) : undefined}>
                <span className="text-[11px] font-bold text-ink-2">{s.phase}</span>
                <span className="el-sym">{e?.sym || '•'}</span>
                <span className="text-xs leading-tight">{cc.term}</span>
              </button>
              {i < chain.steps.length - 1 && <svg aria-hidden width="30" height="18" viewBox="0 0 30 18" className="shrink-0 text-ink-2"><path d="M2 9h22M18 3l7 6-7 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </li>
          )
        })}
      </ol>
      <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        <section className="sheet rounded-lg p-5" aria-live="polite">
          <p className="text-sm text-ink-2">Step {step + 1} of {chain.steps.length} · {cur.phase}</p>
          <h2 className="mt-1 text-2xl font-extrabold">{el && <span className="el-sym-inline" style={famStyle(el.family)}>{el.sym}</span>} {c.term}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-line bg-paper/60 p-4"><p className="label mb-1">What it does here</p><p>{cur.does}</p></div>
            <div className="rounded-md border border-sblue/50 bg-paper/60 p-4"><p className="label mb-1">Hands to the next step</p><p>{cur.hands}</p></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-ghost btn" onClick={() => go(chain.id, step - 1)} disabled={step === 0}>← Previous</button>
            <button className="btn" onClick={() => go(chain.id, step + 1)} disabled={step === chain.steps.length - 1}>Next step →</button>
            <Link className="btn-ghost btn" to={`/c/${c.id}`}>Open the {c.term} lesson</Link>
          </div>
        </section>
        <section className="rounded-lg border border-tape/50 bg-tape/10 p-5">
          <p className="label mb-2">The whole chain in one interview answer</p>
          <p className="text-lg leading-relaxed">“{chain.answer}”</p>
          <p className="mt-3 text-sm text-ink-2">Say it out loud, then swap in a project of your own. See every element on the <Link className="underline" to="/table">Periodic Table</Link>.</p>
        </section>
      </div>
    </div>
  )
}
