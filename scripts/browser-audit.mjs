// Browser smoke test + WCAG 2.2 AA scan (axe-core) over every route, topic samples and all simulators.
// Usage: npm run build && npx vite preview --port 4174 & CHROME_PATH=/path/to/chrome npm run audit
// External requests are blocked so the run checks that core lessons work offline.
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const BASE = process.env.AUDIT_BASE || 'http://localhost:4174/'
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome'
const axe = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8')
const registry = readFileSync(new URL('../src/sims/registry.ts', import.meta.url), 'utf8')
const sims = [...registry.matchAll(/id: '([a-z0-9-]+)'/g)].map((m) => `lab/${m[1]}`)

const routes = [
  '', 'directory', 'domains', 'd/lean', 'd/lean/cheatsheet', 'c/quality.cpk', 'c/quality.cp', 'c/or.newton-raphson', 'c/engecon.npv', 'c/lean.takt-time', 'c/lean.takt-time?mode=quick', 'c/or.lp', 'c/or.branch-bound', 'c/or.mmc?mode=interview', 'formulas/mmc', 'formulas/newsvendor', 'c/safety.fmea',
  'review', 'practice', 'lab', 'roles', 'roles/quality-engineer', 'interview', 'plan', 'graph', 'progress', 'academy',
  'curriculum', 'formulas', 'notebook', 'table', 'table?el=engecon.npv', 'chains', 'chains?chain=safety-case&step=2', 'sheets/engecon', 'method', 'formulas/oee', 'formulas/mm1', 'formulas/irr-newton', 'formulas/calibration?x=2', 'formulas/nope', 'paths', 'paths/lean-throughput', 'studio/sql', 'studio/sql/select', 'studio/sql/joins', 'studio/sql/windows', 'studio/sql/design', 'c/datasci.sql-joins', 'studio/plc', 'studio/plc/scan', 'studio/plc/nonc', 'studio/plc/sealin', 'studio/plc/timers', 'studio/plc/sequence', 'studio/plc/debug', 'studio/plc/safety', 'studio/plc/nope', 'studio/cad', 'studio/cad/sketch', 'studio/cad/intent', 'studio/cad/features', 'studio/cad/mates', 'studio/cad/drawings', 'studio/cad/analysis', 'studio/cad/dfx', 'c/automation.ladder-logic', 'c/automation.solidworks', 'guide', 'guide?path=root,flow,l-capacity', 'pairs', 'compare', 'compare?concepts=lean.takt-time%2Clean.cycle-time%2Clean.lead-time', 'dictionary', 'dictionary?concept=quality.cpk', 'mysteries', 'mysteries?case=beats-takt', 'subway', 'tools', 'spot-waste', 'no-such-page', ...sims,
]

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
let failures = 0
for (const theme of ['light', 'dark']) {
  // Reduced motion: check finished states, not frames of an opening animation (which made results flaky).
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`))
  await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort())
  await page.addInitScript((t) => {
    try { const k = 'ie-launchpads-v2'; const s = JSON.parse(localStorage.getItem(k) || '{"state":{}}'); s.state.settings = { ...(s.state.settings || {}), theme: t }; localStorage.setItem(k, JSON.stringify(s)) } catch { /* first run */ }
  }, theme)
  for (const [i, r] of routes.entries()) {
    // A query change forces a full page load, so one crashing route can't blank the routes after it.
    await page.goto(`${BASE}?n=${i}#/${r}`)
    // Lazy pages (e.g. the curriculum matrix) can take a moment: wait for the heading rather than a fixed delay.
    await page.waitForSelector('h1', { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(300)
    const h1 = await page.locator('h1').count()
    await page.addScriptTag({ content: axe })
    const v = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] })).violations.map((x) => `${x.id} (${x.nodes.length}) ${x.nodes[0]?.target?.join(' ')}`))
    if (!h1 || v.length) { failures++; console.log(`✗ [${theme}] /${r}${h1 ? '' : ' — no <h1>'}${v.length ? '\n    ' + v.join('\n    ') : ''}`) }
  }
  // Exercise the new studio, not merely the default route. External requests remain blocked.
  try {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(BASE + '?studio=1#/c/lean.takt-time?mode=full')
    const studio = page.getByRole('region', { name: 'Topic Intelligence Studio' })
    await studio.getByRole('button', { name: 'Experiment', exact: true }).click()
    await studio.getByRole('button', { name: 'Reset experiment' }).click()
    if (!(await studio.getByText('60.0 s/unit', { exact: true }).isVisible())) throw new Error('Takt reference result not visible')
    await studio.getByRole('button', { name: 'Master', exact: true }).click()
    await studio.getByRole('radio', { name: 'It halves' }).check()
    await studio.getByRole('button', { name: 'Check my answer' }).click()
    if (!(await studio.getByText('Correct.', { exact: false }).first().isVisible())) throw new Error('Pilot feedback missing')
    await studio.getByRole('button', { name: 'Explore sources', exact: true }).click()
    await studio.getByRole('button', { name: 'Find relevant research' }).click()
    await studio.getByText('Research service unavailable.', { exact: false }).waitFor({ timeout: 12000 })
    await page.addScriptTag({ content: axe })
    const problems = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] })).violations.map(v=>v.id))
    if (problems.length) throw new Error('Opened mobile studio accessibility: ' + problems.join(', '))
  } catch (e) { failures++; console.log('✗ ['+theme+'] topic studio interaction: '+e.message) }
  // Compare cards, full-term search, and mobile layout (both themes).
  try {
    await page.goto(BASE + '?comparison=1#/pairs')
    const search = page.getByRole('textbox', { name: 'Find a comparison' })
    await search.fill('Cpk')
    const card = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Cp vs. Cpk', exact: true }) })
    await card.waitFor()
    await card.getByText('Definition, analogy & formula', { exact: true }).first().click()
    await card.getByText('When to use each · interview practice', { exact: true }).click()
    await card.getByText('You need one number that drops when the mean drifts toward a spec limit.', { exact: true }).click()
    if (!(await card.getByText('Process capability index adjusted for centering', { exact: true }).isVisible())) throw new Error('Cpk meaning missing')
    await search.fill('unmatched-comparison-xyz')
    await page.getByText('No matching comparisons.', { exact: false }).waitFor()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await page.goto(BASE + '?comparison=2#/pairs?concept=quality.cpk')
    await page.getByRole('heading', { name: 'Cp vs. Cpk', exact: true }).waitFor()
    await page.addScriptTag({ content: axe })
    const problems = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] })).violations.map(v=>v.id))
    if (problems.length) throw new Error('Mobile comparisons accessibility: '+problems.join(', '))
    if (await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2)) throw new Error('Mobile comparison horizontal overflow')
  } catch (e) { failures++; console.log('✗ ['+theme+'] comparison interaction: '+e.message) }
  // Dictionary is offline and uses context-specific meanings.
  try {
    await page.setViewportSize({width:390,height:844})
    await page.goto(BASE+'?dictionary=1#/dictionary?q=PV&kind=acronym')
    await page.getByRole('heading',{name:'Engineering abbreviation dictionary',exact:true}).waitFor()
    await page.getByText('Planned value',{exact:true}).first().waitFor()
    await page.getByText('Present value',{exact:true}).first().waitFor()
    await page.getByRole('textbox',{name:'Search abbreviation, symbol or meaning'}).fill('xyz-no-such-entry')
    await page.getByText('No matching entries.',{exact:false}).waitFor()
    await page.getByRole('button',{name:'Clear filters'}).click()
    await page.goto(BASE+'?dictionary=2#/dictionary?concept=quality.cpk')
    await page.getByText('Process capability index adjusted for centering',{exact:true}).first().waitFor()
    await page.addScriptTag({content:axe})
    const violations=await page.evaluate(async()=>(await window.axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21aa','wcag22aa']})).violations.map(v=>v.id))
    if(violations.length)throw new Error('Dictionary accessibility: '+violations.join(', '))
    if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2))throw new Error('Dictionary horizontal overflow')
    await page.getByRole('link',{name:'Lesson: Cpk',exact:true}).first().click()
    await page.getByRole('heading',{name:'Cpk',exact:true}).first().waitFor()
    await page.getByRole('link',{name:'Terminology & symbols',exact:true}).click()
    await page.getByRole('heading',{name:'Engineering abbreviation dictionary',exact:true}).waitFor()
  } catch(e) { failures++; console.log('✗ ['+theme+'] dictionary: '+e.message) }
  // Contextual terminology, Equation X-Ray and comparison interactions.
  try {
    await page.setViewportSize({width:390,height:844})
    await page.goto(BASE+'?terms=1#/c/quality.cpk?mode=full')
    const usl=page.getByRole('button',{name:'USL',exact:true}).first()
    await usl.click()
    const pop=page.getByRole('dialog',{name:'Terminology: USL',exact:true})
    await pop.getByText('Upper specification limit',{exact:true}).first().waitFor()
    await pop.getByRole('button',{name:'Close',exact:true}).click()
    await pop.waitFor({state:'hidden'})
    await page.getByText('Equation X-Ray — explore the symbols',{exact:true}).click()
    await page.getByRole('button',{name:'Explain μ: Process mean',exact:true}).click()
    await page.getByText('μ — Process mean',{exact:true}).waitFor()
    await page.goto(BASE+'?compare=1#/compare')
    await page.getByRole('heading',{name:'Advanced comparison studio',exact:true}).waitFor()
    await page.getByRole('heading',{name:'Shared interactive laboratory',exact:true}).waitFor()
    await page.getByRole('slider',{name:/Mean/}).fill('54')
    await page.getByText('1.00',{exact:true}).first().waitFor()
    await page.getByRole('button',{name:'Takt, cycle and lead time',exact:true}).click()
    await page.getByText('84 units short of demand.',{exact:false}).waitFor()
    await page.getByRole('button',{name:'Investment decision methods',exact:true}).click()
    await page.getByText('$1,372.36',{exact:true}).waitFor()
    await page.getByRole('button',{name:'Clear comparison',exact:true}).click()
    await page.getByRole('textbox',{name:'Find a topic',exact:true}).fill('takt')
    await page.getByRole('combobox',{name:'Choose concept',exact:true}).selectOption('lean.takt-time')
    await page.getByRole('button',{name:'Add concept',exact:true}).click()
    await page.getByRole('textbox',{name:'Find a topic',exact:true}).fill('cycle time')
    await page.getByRole('combobox',{name:'Choose concept',exact:true}).selectOption('lean.cycle-time')
    await page.getByRole('button',{name:'Add concept',exact:true}).click()
    await page.getByRole('heading',{name:'Takt time',exact:true}).waitFor()
    await page.getByRole('button',{name:'Equations',exact:true}).click()
    await page.addScriptTag({content:axe})
    const violations=await page.evaluate(async()=>(await window.axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21aa','wcag22aa']})).violations.map(v=>v.id))
    if(violations.length)throw new Error('Advanced comparison accessibility: '+violations.join(', '))
    if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2))throw new Error('Advanced comparison horizontal overflow')
  }catch(e){failures++;console.log('✗ ['+theme+'] contextual terminology and comparison: '+e.message)}
  // Lesson content loads on demand: an empty or unknown lesson must not keep the page busy (render loop guard).
  if (theme === 'light') {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Performance.enable')
    const busy = async () => (await cdp.send('Performance.getMetrics')).metrics.find((m) => m.name === 'TaskDuration').value
    for (const r of ['review', 'c/no-such.lesson', 'c/or.not-a-lesson']) {
      await page.goto(`${BASE}?idle=${r}#/${r}`)
      await page.waitForSelector('h1', { timeout: 5000 }).catch(() => {})
      await page.waitForTimeout(400)
      const a = await busy(); await page.waitForTimeout(1000); const ms = (await busy() - a) * 1000
      if (ms > 300) { failures++; console.log(`✗ [${theme}] /${r} kept the page busy for ${ms.toFixed(0)} ms of 1000 while idle`) }
    }
  }
  if (errors.length) { failures += errors.length; console.log(`✗ [${theme}] script errors:\n  ${errors.join('\n  ')}`) }
  await page.close()
}
await browser.close()
console.log(failures ? `\n${failures} problem(s) across ${routes.length} routes × 2 themes` : `✓ ${routes.length} routes × 2 themes: no script errors, no axe WCAG 2.2 AA violations`)
process.exit(failures ? 1 : 0)
