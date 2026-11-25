export type DomainId =
  | 'systems' | 'safety' | 'reliability' | 'manufacturing' | 'lean' | 'semiconductor'
  | 'stats' | 'quality' | 'doe' | 'or' | 'simulation' | 'datasci' | 'automation'
  | 'pm' | 'scm' | 'engecon' | 'work' | 'ergo' | 'facilities' | 'service'
  | 'sustain' | 'career'

export type Level = 1 | 2 | 3 | 4 // foundation, core, applied, advanced
export const LEVEL_NAME: Record<Level, string> = { 1: 'Foundation', 2: 'Core', 3: 'Applied', 4: 'Advanced' }

export interface Domain {
  id: DomainId
  name: string
  short: string
  blurb: string
  tape: string // accent color (floor-tape inspired)
  group: 'Core IE' | 'Manufacturing & Tech' | 'Analytics & Optimization' | 'Management' | 'People & Places' | 'Career'
  subs: string[]
}

export interface WorkedExample {
  q: string
  steps: string[]
  a: string
  so?: string // interpretation
  /** Optional machine check: compute() must equal value (within tol) — run by `npm test`. */
  check?: { value: number; compute: () => number; tol?: number }
}

export interface InterviewQ {
  q: string
  a: string
  type?: 'screen' | 'technical' | 'case' | 'behavioral'
}

// ---------- Knowledge sources and review (V2) ----------
/** Tier 1: government, standards bodies, professional societies, originators. Tier 2: peer-reviewed, university, textbooks.
 *  Tier 3: industry and practitioner guidance. Tier 4: community, encyclopedias, AI. */
export type SourceTier = 1 | 2 | 3 | 4
export interface SourceRecord {
  id: string
  title: string
  publisher: string
  url: string
  tier: SourceTier
  kind: 'government' | 'standard' | 'professional' | 'academic' | 'industry' | 'community'
  authors?: string
  year?: number
  doi?: string
  access: 'open' | 'free-account' | 'paywalled'
  license?: string
  checkedOn: string // date the URL was last confirmed to exist and match the title (YYYY-MM-DD)
  note?: string
}
/** One citation on a lesson: which source, which section, and the claim it supports. */
export interface Citation { src: string; section?: string; url?: string; supports: string }
export type ReviewStatus = 'draft' | 'source-identified' | 'source-checked' | 'math-validated' | 'expert-reviewed' | 'update-required'
export interface Review { status: ReviewStatus; on: string; by: string; note?: string }


export interface Concept {
  id: string
  term: string
  full?: string
  domain: DomainId
  sub: string
  level: Level
  aka?: string[]
  confused?: [string, string][] // [term, how it differs]
  one: string // one-liner, plain English
  def: string // precise definition
  analogy?: string
  why?: string // intuition: what problem it solves
  formula?: { tex: string; vars?: [string, string][] }
  example?: WorkedExample
  real?: { where: string; story: string; kind?: 'documented' | 'illustrative' } // illustrative unless a cited real event
  used?: { ind?: string[]; roles?: string[]; tools?: string[]; freq?: 'very common' | 'common' | 'niche' }
  sim?: string // simulator id
  iq?: InterviewQ[]
  mistakes?: string[]
  pre?: string[]
  rel?: string[]
  cert?: string[]
  verify?: boolean
  objectives?: string[] // "After this lesson you can…"
  assumptions?: string[] // assumptions and limits of validity
  cites?: Citation[]
  review?: Review
}

export interface RolePath {
  id: string
  title: string
  summary: string
  day: string[] // a day in the job
  concepts: string[] // concept ids, ordered
  tools: string[]
  kpis: string[]
  questions: InterviewQ[]
  project: { title: string; brief: string; steps: string[] }
  certs: string[]
}

export interface CaseInterview {
  id: string
  title: string
  prompt: string
  framework: string[]
  probes: string[]
  strongAnswer: string
  concepts: string[]
}
