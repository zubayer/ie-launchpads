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
  '', 'directory', 'domains', 'd/lean', 'd/lean/cheatsheet', 'c/quality.cpk', 'c/quality.cp', 'c/automation.ladder-logic', 'c/or.newton-raphson', 'c/engecon.npv', 'c/lean.takt-time', 'c/lean.takt-time?mode=quick', 'c/or.lp', 'c/safety.fmea',
  'review', 'practice', 'lab', 'roles', 'roles/quality-engineer', 'interview', 'plan', 'graph', 'progress', 'academy',
  'curriculum', 'formulas', 'notebook', 'table', 'table?el=engecon.npv', 'chains', 'chains?chain=safety-case&step=2', 'sheets/engecon', 'method', 'formulas/oee', 'formulas/mm1', 'formulas/irr-newton', 'formulas/calibration?x=2', 'formulas/nope', 'paths', 'paths/lean-throughput', 'studio/sql', 'studio/sql/select', 'studio/sql/joins', 'studio/sql/windows', 'studio/sql/design', 'c/datasci.sql-joins', 'studio/plc', 'studio/plc/scan', 'studio/plc/nonc', 'studio/plc/sealin', 'studio/plc/timers', 'studio/plc/sequence', 'studio/plc/debug', 'studio/plc/safety', 'studio/plc/nope', 'studio/cad', 'studio/cad/sketch', 'studio/cad/intent', 'studio/cad/features', 'studio/cad/mates', 'studio/cad/drawings', 'studio/cad/analysis', 'studio/cad/dfx', 'c/automation.ladder-logic', 'c/automation.solidworks', 'guide', 'guide?path=root,flow,l-capacity', 'pairs', 'mysteries', 'mysteries?case=beats-takt', 'subway', 'tools', 'spot-waste', 'no-such-page', ...sims,
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
  if (errors.length) { failures += errors.length; console.log(`✗ [${theme}] script errors:\n  ${errors.join('\n  ')}`) }
  await page.close()
}
await browser.close()
console.log(failures ? `\n${failures} problem(s) across ${routes.length} routes × 2 themes` : `✓ ${routes.length} routes × 2 themes: no script errors, no axe WCAG 2.2 AA violations`)
process.exit(failures ? 1 : 0)
