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

export interface KnowledgeSource {
  title: string
  url: string
  publisher: string
  kind: 'government' | 'academic' | 'professional' | 'vendor' | 'exploratory'
  section?: string
  reviewedOn?: string
}

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
  real?: { where: string; story: string }
  used?: { ind?: string[]; roles?: string[]; tools?: string[]; freq?: 'very common' | 'common' | 'niche' }
  sim?: string // simulator id
  iq?: InterviewQ[]
  mistakes?: string[]
  pre?: string[]
  rel?: string[]
  cert?: string[]
  verify?: boolean
  sources?: KnowledgeSource[]
  reviewStatus?: 'draft' | 'source-checked' | 'expert-reviewed'
  assumptions?: string[]
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
