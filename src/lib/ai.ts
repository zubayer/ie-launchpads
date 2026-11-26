// Free AI explanations shown side by side on lesson pages. Every source is free and needs no key in the page:
// - Pollinations (web): the anonymous GPT-class model. The anonymous tier allows about one request every 15 seconds
//   per visitor (shared by all its models, which is why there is one Pollinations card), so requests are queued, and a
//   queued request is skipped if the lesson that asked for it has been left.
// - Chrome's built-in AI (on device): Gemini Nano through the Prompt API, where the browser and hardware support it.
// All output is third-party and unverified; the UI labels it as AI-generated.

/** One prompt for every source, so the cards can be compared fairly. */
export const aiPrompt = (topic: string, context: string) =>
  `In 5 short bullet points, explain "${topic}" (${context}) for an industrial engineering student preparing for job interviews: 1) plain definition, 2) how it works, 3) a real-world example with a number, 4) tools or software used, 5) one likely interview question. Plain text, no markdown headings, under 170 words.`

export interface AiSource {
  id: string
  label: string // shown on the card
  provider: string
  where: 'web' | 'device'
  note: string // what the learner should know about this source
  model?: string // Pollinations model id
}

export const AI_SOURCES: AiSource[] = [
  { id: 'pollinations-openai', label: 'GPT-class model', provider: 'Pollinations', where: 'web', model: 'openai', note: 'Free Pollinations service; the topic name is sent to it.' },
  { id: 'chrome-nano', label: 'Gemini Nano, on this device', provider: 'Chrome built-in AI', where: 'device', note: 'Runs inside Chrome on this computer; nothing is sent anywhere.' },
]

/** Clean the model's text: no bold markers or markdown headings; reject empty or tiny answers. */
export function tidy(text: string): string | null {
  const t = text.trim().replace(/\*\*/g, '').replace(/^#+\s*/gm, '')
  return t.length > 40 ? t : null
}

export const SKIPPED = Symbol('skipped')

/**
 * Run tasks one at a time, each starting at least `gapMs` after the previous one started. A task whose
 * `wanted()` check fails when its turn comes is skipped without using a slot, so requests from pages the
 * learner has already left can't delay the page they are reading. The clock and the wait are injectable so
 * the spacing can be tested without real time passing.
 */
export function createPacer(gapMs: number, now: () => number = Date.now, sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms))) {
  let chain: Promise<unknown> = Promise.resolve()
  let lastStart = -Infinity
  let waiting = 0
  const run = <T>(task: () => Promise<T>, wanted: () => boolean = () => true): Promise<T | typeof SKIPPED> => {
    waiting++
    const p = chain.then(async () => {
      if (!wanted()) { waiting--; return SKIPPED }
      const wait = lastStart + gapMs - now()
      if (wait > 0) await sleep(wait)
      if (!wanted()) { waiting--; return SKIPPED }
      lastStart = now()
      waiting--
      return task()
    })
    chain = p.catch(() => undefined)
    return p
  }
  return Object.assign(run, { queued: () => waiting })
}

const pollinationsPacer = createPacer(15000)

// Answers are cached per browser tab (sessionStorage) and per page load (in memory), keyed by source, topic and attempt.
const memo = new Map<string, Promise<string | null>>()
function cached(key: string, fn: () => Promise<string | null>): Promise<string | null> {
  try { const hit = sessionStorage.getItem(key); if (hit) return Promise.resolve(JSON.parse(hit) as string) } catch { /* storage unavailable */ }
  if (!memo.has(key)) memo.set(key, fn().catch(() => null).then((v) => { try { if (v) sessionStorage.setItem(key, JSON.stringify(v)) } catch { /* full or blocked */ } return v }))
  return memo.get(key)!
}
export const isCached = (key: string) => { try { return !!sessionStorage.getItem(key) } catch { return false } }
export const aiKey = (source: string, topic: string, attempt: number) => `ai:${source}:${topic}:${attempt}`

// Which answers a card on screen is still waiting for. A card registers its key while mounted.
const wanted = new Map<string, number>()
/** Mark an answer as wanted by a mounted card; call the returned function when the card goes away. */
export function want(key: string) {
  wanted.set(key, (wanted.get(key) ?? 0) + 1)
  return () => { const n = (wanted.get(key) ?? 1) - 1; if (n > 0) wanted.set(key, n); else wanted.delete(key) }
}

/** An answer from one Pollinations model. Resolves to null when the service is busy or fails, or when no card wants it any more. */
export function pollinationsSummary(source: AiSource, topic: string, context: string, attempt = 0): Promise<string | null> {
  const key = aiKey(source.id, topic, attempt)
  return cached(key, async () => {
    const out = await pollinationsPacer(async () => {
      const ctl = new AbortController()
      const t = setTimeout(() => ctl.abort(), 30000)
      try {
        const r = await fetch(`https://text.pollinations.ai/${encodeURIComponent(aiPrompt(topic, context))}?model=${source.model}`, { signal: ctl.signal })
        return r.ok ? tidy(await r.text()) : null
      } finally { clearTimeout(t) }
    }, () => wanted.has(key))
    if (out === SKIPPED) { memo.delete(key); return null } // nobody waited for it: ask afresh if the lesson is opened again
    return out
  })
}
/** How many Pollinations requests are waiting for their turn. */
export const pollinationsQueued = () => pollinationsPacer.queued()

// ---- Chrome built-in AI (Prompt API, Gemini Nano) ----
type Availability = 'unavailable' | 'downloadable' | 'downloading' | 'available'
interface LMSession { prompt: (text: string) => Promise<string>; destroy?: () => void }
interface LMStatic {
  availability: (opts?: object) => Promise<Availability>
  create: (opts?: { monitor?: (m: EventTarget) => void; expectedOutputs?: { type: string; languages: string[] }[] }) => Promise<LMSession>
}
const lm = (): LMStatic | null => (typeof globalThis !== 'undefined' && (globalThis as { LanguageModel?: LMStatic }).LanguageModel) || null
const LM_OPTS = { expectedOutputs: [{ type: 'text', languages: ['en'] }] }

/** Whether Chrome's on-device model can be used here: 'available' runs without a click; 'downloadable' needs one. */
export async function deviceAiStatus(): Promise<Availability> {
  const api = lm()
  if (!api) return 'unavailable'
  try { return await api.availability(LM_OPTS) } catch { return 'unavailable' }
}

/** An answer from Chrome's on-device model. Call it from a click when the model still has to download. */
export function deviceSummary(topic: string, context: string, attempt = 0, onProgress?: (fraction: number) => void): Promise<string | null> {
  return cached(aiKey('chrome-nano', topic, attempt), async () => {
    const api = lm()
    if (!api) return null
    const session = await api.create({
      ...LM_OPTS,
      monitor: (m) => m.addEventListener('downloadprogress', (e) => onProgress?.((e as unknown as { loaded: number }).loaded)),
    })
    try { return tidy(await session.prompt(aiPrompt(topic, context))) } finally { session.destroy?.() }
  })
}
