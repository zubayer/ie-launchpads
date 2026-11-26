import type { Concept, DomainId } from '../types'
import type { ConceptIndex } from '../content/assemble'

// Search hints keep web lookups on-topic ("Etching" alone finds the art technique).
export const DOMAIN_HINT: Record<DomainId, string> = {
  stats: 'statistics', quality: 'quality control', doe: 'design of experiments', or: 'operations research',
  simulation: 'simulation', datasci: 'machine learning', manufacturing: 'manufacturing', lean: 'lean manufacturing',
  semiconductor: 'semiconductor fabrication', automation: 'industrial automation', systems: 'systems engineering',
  safety: 'safety engineering', reliability: 'reliability engineering', pm: 'project management', scm: 'supply chain',
  engecon: 'engineering economics', work: 'work measurement', ergo: 'ergonomics', facilities: 'facility layout',
  service: 'operations management', sustain: 'sustainability', career: 'engineering career',
}

// Exact Wikipedia titles where search alone tends to pick the wrong article.
export const WIKI_TITLE: Record<string, string> = {
  'stats.mean-median': 'Central tendency', 'stats.std-dev': 'Standard deviation', 'stats.boxplot-iqr': 'Box plot',
  'stats.normal': 'Normal distribution', 'stats.clt': 'Central limit theorem', 'stats.p-value': 'P-value', 'stats.t-test': "Student's t-test",
  'stats.type-errors': 'Type I and type II errors', 'stats.power': 'Power (statistics)', 'stats.regression': 'Linear regression',
  'stats.r-squared': 'Coefficient of determination', 'quality.control-chart': 'Control chart', 'quality.xbar-r': 'X-bar chart',
  'quality.we-rules': 'Western Electric rules', 'quality.cp': 'Process capability index', 'quality.cpk': 'Process capability index',
  'quality.ppk': 'Process performance index', 'quality.gage-rr': 'ANOVA gauge R&R', 'quality.six-sigma': 'Six Sigma', 'quality.dmaic': 'DMAIC',
  'quality.sipoc': 'SIPOC', 'quality.pareto': 'Pareto chart', 'quality.fishbone': 'Ishikawa diagram', 'quality.seven-tools': 'Seven basic tools of quality',
  'quality.aql': 'Acceptance sampling', 'quality.iso9001': 'ISO 9000', 'doe.basics': 'Design of experiments', 'doe.full-factorial': 'Factorial experiment',
  'doe.fractional-factorial': 'Fractional factorial design', 'doe.rsm': 'Response surface methodology', 'doe.ccd': 'Central composite design',
  'doe.box-behnken': 'Box–Behnken design', 'doe.taguchi': 'Taguchi methods', 'doe.plackett-burman': 'Plackett–Burman design',
  'or.lp': 'Linear programming', 'or.simplex': 'Simplex algorithm', 'or.ip': 'Integer programming', 'or.branch-bound': 'Branch and bound',
  'or.transportation': 'Transportation theory (mathematics)', 'or.assignment': 'Assignment problem', 'or.tsp': 'Travelling salesman problem',
  'or.vrp': 'Vehicle routing problem', 'or.knapsack': 'Knapsack problem', 'or.mm1': 'M/M/1 queue', 'or.mmc': 'M/M/c queue',
  'or.kendall': "Kendall's notation", 'or.eoq': 'Economic order quantity', 'or.newsvendor': 'Newsvendor model', 'or.markov': 'Markov chain',
  'or.gurobi': 'Gurobi Optimizer', 'or.or-tools': 'OR-Tools', 'simulation.des': 'Discrete-event simulation', 'simulation.monte-carlo': 'Monte Carlo method',
  'simulation.digital-twin': 'Digital twin', 'datasci.random-forest': 'Random forest', 'datasci.kmeans': 'K-means clustering',
  'datasci.knn': 'K-nearest neighbors algorithm', 'datasci.pca': 'Principal component analysis', 'datasci.svm': 'Support vector machine',
  'datasci.decision-tree': 'Decision tree learning', 'datasci.gradient-boosting': 'Gradient boosting', 'datasci.confusion-matrix': 'Confusion matrix',
  'datasci.roc-auc': 'Receiver operating characteristic', 'datasci.overfitting': 'Overfitting', 'datasci.sql': 'SQL', 'datasci.pandas': 'Pandas (software)',
  'manufacturing.machining': 'Machining', 'manufacturing.casting': 'Casting (metalworking)', 'manufacturing.mrp': 'Material requirements planning',
  'manufacturing.erp': 'Enterprise resource planning', 'manufacturing.mes': 'Manufacturing execution system', 'manufacturing.gdt': 'Geometric dimensioning and tolerancing',
  'manufacturing.cmm': 'Coordinate-measuring machine', 'manufacturing.ppap': 'Production part approval process', 'manufacturing.apqp': 'Advanced product quality planning',
  'lean.tps': 'Toyota Production System', 'lean.eight-wastes': 'Muda (Japanese term)', 'lean.vsm': 'Value-stream mapping', 'lean.five-s': '5S (methodology)',
  'lean.kanban': 'Kanban', 'lean.smed': 'Single-minute exchange of die', 'lean.poka-yoke': 'Poka-yoke', 'lean.toc': 'Theory of constraints',
  'lean.oee': 'Overall equipment effectiveness', 'lean.littles-law': "Little's law", 'lean.takt-time': 'Takt time', 'lean.heijunka': 'Heijunka',
  'lean.jidoka': 'Autonomation', 'lean.a3': 'A3 problem solving', 'lean.five-whys': 'Five whys', 'lean.pdca': 'PDCA', 'lean.gemba': 'Gemba',
  'lean.andon': 'Andon (manufacturing)', 'lean.cellular': 'Cellular manufacturing',
  'semiconductor.photolithography': 'Photolithography', 'semiconductor.etching': 'Etching (microfabrication)', 'semiconductor.dry-etch': 'Reactive-ion etching',
  'semiconductor.wet-etch': 'Etching (microfabrication)', 'semiconductor.cvd': 'Chemical vapor deposition', 'semiconductor.ald': 'Atomic layer deposition',
  'semiconductor.pvd': 'Sputter deposition', 'semiconductor.cmp': 'Chemical-mechanical polishing', 'semiconductor.ion-implantation': 'Ion implantation',
  'semiconductor.euv': 'Extreme ultraviolet lithography', 'semiconductor.wafer': 'Wafer (electronics)', 'semiconductor.cleanroom': 'Cleanroom',
  'semiconductor.czochralski': 'Czochralski method', 'semiconductor.yield': 'Semiconductor device fabrication', 'semiconductor.cd': 'Critical dimension',
  'semiconductor.damascene': 'Damascene process', 'semiconductor.oxidation': 'Thermal oxidation', 'semiconductor.epitaxy': 'Epitaxy',
  'semiconductor.photoresist': 'Photoresist', 'semiconductor.packaging': 'Integrated circuit packaging', 'semiconductor.advanced-packaging': 'Chiplet',
  'automation.plc': 'Programmable logic controller', 'automation.ladder-logic': 'Ladder logic', 'automation.scada': 'SCADA',
  'automation.gcode': 'G-code', 'automation.cnc': 'Numerical control', 'automation.solidworks': 'SolidWorks', 'automation.fea': 'Finite element method',
  'automation.hmi': 'User interface', 'automation.vfd': 'Variable-frequency drive', 'automation.cobot': 'Cobot', 'automation.robotics': 'Industrial robot',
  'automation.machine-vision': 'Machine vision', 'automation.opc-ua': 'OPC Unified Architecture', 'automation.industry40': 'Fourth Industrial Revolution',
  'systems.v-model': 'V-model', 'systems.mbse': 'Model-based systems engineering', 'systems.sysml': 'Systems modeling language',
  'systems.trl': 'Technology readiness level', 'systems.pugh': 'Decision-matrix method', 'systems.traceability': 'Requirements traceability',
  'safety.fmea': 'Failure mode and effects analysis', 'safety.fta': 'Fault tree analysis', 'safety.eta': 'Event tree analysis', 'safety.bowtie': 'Bow-tie diagram',
  'safety.hazop': 'Hazard and operability study', 'safety.lopa': 'Layers of protection analysis', 'safety.sil': 'Safety integrity level',
  'safety.alarp': 'ALARP', 'safety.hierarchy-controls': 'Hierarchy of hazard controls', 'safety.swiss-cheese': 'Swiss cheese model',
  'safety.loto': 'Lockout–tagout', 'safety.psm': 'Process safety management', 'safety.iso26262': 'ISO 26262', 'safety.stpa': 'STAMP (accident model)',
  'safety.risk-matrix': 'Risk matrix', 'safety.eight-d': 'Eight disciplines problem solving', 'safety.rca': 'Root cause analysis',
  'safety.cmf': 'Crash modification factor', 'reliability.weibull': 'Weibull distribution', 'reliability.bathtub': 'Bathtub curve',
  'reliability.mtbf': 'Mean time between failures', 'reliability.rbd': 'Reliability block diagram', 'reliability.tpm': 'Total productive maintenance',
  'reliability.rcm': 'Reliability-centered maintenance', 'reliability.pdm': 'Predictive maintenance', 'pm.cpm': 'Critical path method',
  'pm.pert': 'Program evaluation and review technique', 'pm.evm': 'Earned value management', 'pm.wbs': 'Work breakdown structure', 'pm.gantt': 'Gantt chart',
  'pm.raci': 'Responsibility assignment matrix', 'pm.scrum': 'Scrum (software development)', 'pm.triple-constraint': 'Project management triangle',
  'scm.bullwhip': 'Bullwhip effect', 'scm.scor': 'Supply chain operations reference', 'scm.safety-stock': 'Safety stock', 'scm.reorder-point': 'Reorder point',
  'scm.abc': 'ABC analysis', 'scm.vmi': 'Vendor-managed inventory', 'scm.cross-docking': 'Cross-docking', 'scm.incoterms': 'Incoterms',
  'scm.tco': 'Total cost of ownership', 'scm.sop': 'Sales and operations planning', 'scm.wms': 'Warehouse management system',
  'engecon.npv': 'Net present value', 'engecon.irr': 'Internal rate of return', 'engecon.tvm': 'Time value of money', 'engecon.macrs': 'MACRS',
  'engecon.payback': 'Payback period', 'engecon.break-even': 'Break-even (economics)', 'engecon.marr': 'Minimum acceptable rate of return',
  'work.time-study': 'Time and motion study', 'work.learning-curve': 'Experience curve effects', 'work.pmts': 'Methods-time measurement',
  'work.work-sampling': 'Work sampling', 'ergo.niosh': 'NIOSH lifting equation', 'ergo.anthropometry': 'Anthropometry', 'ergo.fitts': "Fitts's law",
  'ergo.hick': "Hick's law", 'ergo.hfacs': 'Human Factors Analysis and Classification System', 'ergo.rula-reba': 'Rapid upper limb assessment',
  'facilities.slp': 'Systematic layout planning', 'facilities.asrs': 'Automated storage and retrieval system', 'facilities.agv-amr': 'Automated guided vehicle',
  'service.pue': 'Power usage effectiveness', 'service.data-center-tier': 'Data center', 'sustain.lca': 'Life-cycle assessment', 'sustain.circular-economy': 'Circular economy',
  'sustain.iso14001': 'ISO 14000 series', 'career.star': 'Situation, task, action, result', 'career.fe-exam': 'Fundamentals of Engineering exam',
}

const q = (s: string) => encodeURIComponent(s)
const cleanTerm = (s: string) => s.replace(/\s*\(.*?\)\s*/g, ' ').trim()
export const searchName = (c: ConceptIndex) => (c.full && c.full.length < 60 ? `${c.term} ${c.full}` : c.term).replace(/[()]/g, '')

export const links = (c: ConceptIndex) => {
  const name = searchName(c)
  const hint = DOMAIN_HINT[c.domain]
  return {
    wikipedia: WIKI_TITLE[c.id]
      ? `https://en.wikipedia.org/wiki/${q(WIKI_TITLE[c.id].replace(/ /g, '_'))}`
      : `https://en.wikipedia.org/w/index.php?search=${q(`${c.full || c.term} ${hint}`)}`,
    google: `https://www.google.com/search?q=${q(`${name} ${hint}`)}`,
    images: `https://www.google.com/search?tbm=isch&q=${q(`${name} ${hint} diagram`)}`,
    youtube: `https://www.youtube.com/results?search_query=${q(`${name} explained`)}`,
    scholar: `https://scholar.google.com/scholar?q=${q(name)}`,
  }
}
export const googleUrl = (s: string) => `https://www.google.com/search?q=${q(s)}`
export const wikiSearchUrl = (s: string) => `https://en.wikipedia.org/w/index.php?search=${q(s)}`

export interface WikiSummary { title: string; extract: string; url: string; thumb?: string; desc?: string; permalink?: string }

const CACHE_KEY = 'ie-wiki-cache-v2'
const mem: Record<string, WikiSummary | null> = (() => {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}') } catch { return {} }
})()
const save = () => { try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(mem)) } catch { /* storage full or blocked */ } }

async function summary(title: string): Promise<WikiSummary | null> {
  const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${q(title.replace(/ /g, '_'))}`)
  if (!r.ok) return null
  const j = await r.json()
  if (j.type === 'disambiguation' || !j.extract) return null
  const url = j.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${q(String(j.title).replace(/ /g, '_'))}`
  const permalink = j.revision ? `https://en.wikipedia.org/w/index.php?title=${q(String(j.title).replace(/ /g, '_'))}&oldid=${j.revision}` : undefined
  return { title: j.title, extract: j.extract, url, thumb: j.thumbnail?.source, desc: j.description, permalink }
}

async function searchTitle(query: string): Promise<string | null> {
  const r = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q(query)}&srlimit=1&format=json&origin=*`)
  if (!r.ok) return null
  const j = await r.json()
  return j?.query?.search?.[0]?.title ?? null
}

/** Wikipedia summary (with lead image) for a title or free-text query. Runs in the learner's browser. */
export async function wiki(opts: { title?: string; query?: string }): Promise<WikiSummary | null> {
  const key = opts.title ? `t:${opts.title}` : `q:${opts.query}`
  if (key in mem) return mem[key]
  let out: WikiSummary | null = null
  try {
    if (opts.title) out = await summary(opts.title)
    if (!out && (opts.query || opts.title)) {
      const t = await searchTitle(opts.query || opts.title!)
      if (t) out = await summary(t)
    }
  } catch { out = null }
  mem[key] = out
  save()
  return out
}

export const wikiFor = (c: ConceptIndex) => wiki(WIKI_TITLE[c.id] ? { title: WIKI_TITLE[c.id] } : { query: `${c.full || c.term} ${DOMAIN_HINT[c.domain]}` })

/* ---------- More live sources (all free, keyless, browser-side) ---------- */

/** One-click "ask" links that open real-time search and AI answer engines in a new tab. */
export const askLinks = (topic: string) => {
  const t = q(topic)
  const prompt = q(`Explain "${topic}" for an industrial engineering student preparing for job interviews: definition, how it works, a real example, tools used, and one common interview question.`)
  return [
    { label: 'Google', href: `https://www.google.com/search?q=${t}` },
    { label: 'Google AI Mode', href: `https://www.google.com/search?udm=50&q=${prompt}` },
    { label: 'Perplexity', href: `https://www.perplexity.ai/search?q=${prompt}` },
    { label: 'ChatGPT', href: `https://chatgpt.com/?q=${prompt}` },
    { label: 'Claude', href: `https://claude.ai/new?q=${prompt}` },
    { label: 'Bing', href: `https://www.bing.com/search?q=${t}` },
    { label: 'DuckDuckGo', href: `https://duckduckgo.com/?q=${t}` },
    { label: 'Google News', href: `https://news.google.com/search?q=${t}` },
    { label: 'YouTube', href: `https://www.youtube.com/results?search_query=${q(topic + ' explained')}` },
  ]
}

const memo = new Map<string, Promise<unknown>>()
function once<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (!memo.has(key)) memo.set(key, fn().catch(() => null as T))
  return memo.get(key) as Promise<T>
}
function store<T>(key: string, fn: () => Promise<T>): Promise<T> {
  try { const hit = sessionStorage.getItem(key); if (hit) return Promise.resolve(JSON.parse(hit) as T) } catch { /* ignore */ }
  return once(key, async () => { const v = await fn(); try { if (v) sessionStorage.setItem(key, JSON.stringify(v)) } catch { /* ignore */ } return v })
}

export interface WikiHit { title: string; snippet: string; url: string }
/** Top Wikipedia search results with snippets (Wikipedia's own live search engine). */
export const wikiSearch = (query: string, n = 6) => store<WikiHit[] | null>(`wsr:${query}`, async () => {
  const r = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q(query)}&srlimit=${n}&format=json&origin=*`)
  if (!r.ok) return null
  const j = await r.json()
  return (j?.query?.search || []).map((h: { title: string; snippet: string }) => ({ title: h.title, snippet: h.snippet.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'), url: `https://en.wikipedia.org/wiki/${q(h.title.replace(/ /g, '_'))}` }))
})

export interface Paper { title: string; year?: number; cites?: number; url: string; venue?: string }
/** Research papers from OpenAlex (open scholarly index): most relevant overall, or most relevant from the last ~2 years. */
export const papers = (query: string, sort: 'relevance' | 'recent' = 'relevance') => store<Paper[] | null>(`oa:${sort}:${query}`, async () => {
  const s = sort === 'recent' ? `&filter=from_publication_date:${new Date().getFullYear() - 2}-01-01` : ''
  const r = await fetch(`https://api.openalex.org/works?search=${q(query)}&per-page=6${s}&select=id,display_name,publication_year,cited_by_count,doi,primary_location`)
  if (!r.ok) return null
  const j = await r.json()
  return (j.results || []).map((w: { id: string; display_name: string; publication_year?: number; cited_by_count?: number; doi?: string; primary_location?: { source?: { display_name?: string } } }) => ({
    title: w.display_name, year: w.publication_year, cites: w.cited_by_count, url: w.doi || w.id, venue: w.primary_location?.source?.display_name,
  }))
})

// Stack Exchange community that best matches each area (all have public, CORS-enabled APIs).
export const SE_SITE: Record<DomainId, { site: string; name: string }> = {
  stats: { site: 'stats', name: 'Cross Validated' }, quality: { site: 'stats', name: 'Cross Validated' }, doe: { site: 'stats', name: 'Cross Validated' },
  or: { site: 'or', name: 'Operations Research SE' }, simulation: { site: 'or', name: 'Operations Research SE' }, scm: { site: 'or', name: 'Operations Research SE' },
  service: { site: 'or', name: 'Operations Research SE' }, datasci: { site: 'datascience', name: 'Data Science SE' },
  manufacturing: { site: 'engineering', name: 'Engineering SE' }, lean: { site: 'engineering', name: 'Engineering SE' },
  semiconductor: { site: 'electronics', name: 'Electrical Engineering SE' }, automation: { site: 'engineering', name: 'Engineering SE' },
  systems: { site: 'engineering', name: 'Engineering SE' }, safety: { site: 'engineering', name: 'Engineering SE' },
  reliability: { site: 'engineering', name: 'Engineering SE' }, pm: { site: 'pm', name: 'Project Management SE' },
  engecon: { site: 'money', name: 'Personal Finance & Money SE' }, work: { site: 'engineering', name: 'Engineering SE' },
  ergo: { site: 'ux', name: 'User Experience SE' }, facilities: { site: 'engineering', name: 'Engineering SE' },
  sustain: { site: 'sustainability', name: 'Sustainable Living SE' }, career: { site: 'workplace', name: 'The Workplace SE' },
}

export interface QA { title: string; url: string; score: number; answers: number; answered: boolean; tags: string[] }
const decode = (s: string) => { try { return new DOMParser().parseFromString(s, 'text/html').documentElement.textContent || s } catch { return s } }
/** Real questions practitioners asked about the topic, most relevant first. */
export const stackQA = (c: ConceptIndex) => store<QA[] | null>(`se:${c.id}`, async () => {
  const { site } = SE_SITE[c.domain]
  const run = async (text: string) => {
    const r = await fetch(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${q(text)}&site=${site}&pagesize=6&filter=default`)
    if (!r.ok) return []
    const j = await r.json()
    return (j.items || []).map((i: { title: string; link: string; score: number; answer_count: number; is_answered: boolean; tags?: string[] }) => ({
      title: decode(i.title), url: i.link, score: i.score, answers: i.answer_count, answered: i.is_answered, tags: (i.tags || []).slice(0, 3),
    })) as QA[]
  }
  let out = await run(cleanTerm(c.term))
  if (out.length < 3 && c.full) out = [...out, ...(await run(c.full))].filter((x, i, a) => a.findIndex((y) => y.url === x.url) === i)
  return out.length ? out.slice(0, 6) : null
})

