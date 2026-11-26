// Public bibliographic metadata only; no full-text scraping or private learner data.
export interface DiscoveryHit { doi: string; title: string; publisher: string }
export interface DiscoveryResult { hits: DiscoveryHit[]; at: number; cached: boolean }
const TTL = 60 * 60 * 1000
const cache = new Map<string, { hits: DiscoveryHit[]; at: number }>()
export function parseCrossref(input: unknown): DiscoveryHit[] {
  if (!input || typeof input !== 'object') throw new Error('Invalid metadata response')
  const message = (input as { message?: { items?: unknown } }).message
  if (!Array.isArray(message?.items)) throw new Error('Invalid metadata response')
  const out: DiscoveryHit[] = []
  for (const item of message.items) {
    if (!item || typeof item !== 'object') continue
    const { DOI, title, publisher } = item as { DOI?: unknown; title?: unknown; publisher?: unknown }
    if (typeof DOI !== 'string' || !/^10\.\d{4,9}\/\S+$/.test(DOI) || !Array.isArray(title) || typeof title[0] !== 'string' || !title[0].trim()) continue
    if (out.some(h => h.doi.toLowerCase() === DOI.toLowerCase())) continue
    out.push({ doi: DOI, title: title[0].slice(0,500), publisher: typeof publisher === 'string' ? publisher.slice(0,200) : 'Publisher not supplied' })
  }
  return out.slice(0,5)
}
export async function crossrefDiscovery(query: string, signal: AbortSignal): Promise<DiscoveryResult> {
  const key = query.trim()
  if (!key || signal.aborted) throw new Error('Request cancelled')
  const old = cache.get(key)
  if (old && Date.now() - old.at < TTL) return { ...old, cached: true }
  const ctl = new AbortController()
  const abort = () => ctl.abort()
  signal.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(abort, 8000)
  try {
    const params = new URLSearchParams({ 'query.bibliographic': key, rows: '5', select: 'DOI,title,publisher' })
    const response = await fetch('https://api.crossref.org/works?' + params, { signal: ctl.signal })
    if (!response.ok) throw new Error('Metadata provider unavailable')
    const hits = parseCrossref(await response.json())
    const result = { hits, at: Date.now() }
    if (cache.size >= 80) cache.delete(cache.keys().next().value!)
    cache.set(key,result)
    return { ...result, cached: false }
  } finally { clearTimeout(timer); signal.removeEventListener('abort',abort) }
}
