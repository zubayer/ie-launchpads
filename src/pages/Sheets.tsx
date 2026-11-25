import { Link, useParams } from 'react-router-dom'
import { CONCEPT_MAP } from '../content'
import { SHEETS } from '../content/sheets'
import { PageHead } from '../components/ui'

export function Sheet() {
  const { id = '' } = useParams()
  const s = SHEETS[id]
  if (!s) return (
    <div>
      <PageHead title="Sheet not found" sub="This cheat sheet doesn’t exist yet." />
      <ul className="list-disc pl-5">{Object.values(SHEETS).map((x) => <li key={x.id}><Link className="underline" to={`/sheets/${x.id}`}>{x.title}</Link></li>)}</ul>
    </div>
  )
  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <button className="btn" onClick={() => window.print()}>Print or save as PDF</button>
        <Link className="btn-ghost btn" to="/formulas">All formulas</Link>
        <span className="text-sm text-ink-2">Prints on one A4 or Letter page.</span>
      </div>
      <article className="sheet-print sheet mx-auto max-w-[52rem] rounded-lg p-6 sm:p-10">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b-4 border-tape pb-3">
          <div>
            <p className="text-xs font-bold text-ink-2">IE LAUNCHPAD V2 · CHEAT SHEET</p>
            <h1 className="display text-3xl">{s.title}</h1>
            <p className="mt-1 text-[0.95rem] text-ink-2">{s.sub}</p>
          </div>
          <p className="text-right text-xs text-ink-2">FE exam · interviews<br />Python: {s.python}</p>
        </header>
        <div className="mt-5 overflow-x-auto" tabIndex={0} role="region" aria-label="Formulas with Excel and Python equivalents">
          <table className="w-full min-w-[40rem] border-collapse text-[0.95rem] leading-snug">
            <thead>
              <tr className="border-b-2 border-ink text-left text-xs text-ink-2">
                <th scope="col" className="w-[44%] py-2 pr-2">What you want · formula</th>
                <th scope="col" className="w-[26%] px-2 py-2">Excel</th>
                <th scope="col" className="w-[30%] py-2 pl-2">Python</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {s.rows.map((r) => (
                <tr key={r.want} className="border-b border-line">
                  <td className="py-2.5 pr-2"><Link className="font-bold hover:text-sblue hover:underline" to={`/c/${r.concept}`}>{r.want}</Link>{r.tag && <span className="text-ink-2"> ({r.tag})</span>}<br />{r.formula}</td>
                  <td className="px-2 py-2.5 font-mono text-[0.85rem]">{r.excel}</td>
                  <td className="py-2.5 pl-2 font-mono text-[0.85rem]">{r.python}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <section className="rounded-md border border-line p-4">
            <h2 className="text-xs font-extrabold text-sblue">WORKED EXAMPLE</h2>
            <p className="mt-1">{s.example.setup}</p>
            <p className="mt-1">{s.example.work.split('=').slice(0, -1).join('=')}= <strong>{s.example.work.split('=').pop()!.trim()}</strong></p>
            <p className="mt-1 font-mono text-[0.85rem]">{s.example.excel}</p>
          </section>
          <section className="rounded-md border border-line p-4">
            <h2 className="text-xs font-extrabold text-sgreen">KEY RULES</h2>
            {s.rules.map((r) => <p key={r} className="mt-1">{r}</p>)}
          </section>
        </div>
        <section className="mt-4 rounded-md border-2 border-sorange bg-sorange/5 p-4">
          <h2 className="text-xs font-extrabold text-sorange">EXAM AND INTERVIEW TRAPS</h2>
          {s.traps.map((t) => <p key={t.title} className="mt-1"><strong>{t.title}</strong> {t.text}</p>)}
        </section>
        <footer className="mt-5 flex flex-wrap justify-between gap-2 border-t border-line pt-2 text-xs text-ink-2">
          <span>Each row links to its lesson: {s.rows.map((r) => CONCEPT_MAP[r.concept]?.term).filter((x, i, a) => x && a.indexOf(x) === i).join(' · ')}</span>
          <span>Every number on this sheet is recomputed by the test suite</span>
        </footer>
      </article>
    </div>
  )
}
