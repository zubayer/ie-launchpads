import type { SourceRecord } from '../types'

// The verified source registry. Lessons cite these by id plus a section URL and the claim supported.
// `checkedOn` is the date the URL was confirmed to exist with this title; it is not a claim-level review.
const list: SourceRecord[] = [
  {
    id: 'nist-handbook', title: 'NIST/SEMATECH e-Handbook of Statistical Methods', publisher: 'National Institute of Standards and Technology (NIST)',
    url: 'https://www.itl.nist.gov/div898/handbook/', tier: 1, kind: 'government', access: 'open', license: 'U.S. government work', checkedOn: '2026-11-24',
    note: 'Chapter 6 covers SPC, capability and acceptance sampling; chapter 2 covers gauge studies.',
  },
  {
    id: 'lei-lexicon', title: 'Lean Lexicon — online lexicon terms', publisher: 'Lean Enterprise Institute (LEI)',
    url: 'https://www.lean.org/explore-lean/lexicon-terms/', tier: 1, kind: 'professional', access: 'open', checkedOn: '2026-11-24',
    note: 'Online entries from the Lean Lexicon (6th edition in print).',
  },
  {
    id: 'lei-articles', title: 'The Lean Post and LEI workbooks', publisher: 'Lean Enterprise Institute (LEI)',
    url: 'https://www.lean.org/the-lean-post/', tier: 3, kind: 'industry', access: 'open', checkedOn: '2026-11-24',
  },
  {
    id: 'toyota-tps', title: 'Toyota Production System', publisher: 'Toyota Motor Corporation',
    url: 'https://global.toyota/en/company/vision-and-philosophy/production-system/index.html', tier: 1, kind: 'industry', access: 'open', checkedOn: '2026-11-24',
    note: 'The originator’s own description of TPS and its two pillars.',
  },
  {
    id: 'asq-resources', title: 'ASQ Quality Resources', publisher: 'American Society for Quality (ASQ)',
    url: 'https://asq.org/quality-resources', tier: 1, kind: 'professional', access: 'open', checkedOn: '2026-11-24',
  },
  {
    id: 'asq-cssgb-bok', title: 'Certified Six Sigma Green Belt (CSSGB) Body of Knowledge, 2022', publisher: 'American Society for Quality (ASQ)',
    url: 'https://www.asq.org/cert/resource/pdf/certification/2022-CSSGB-BoK.pdf', tier: 1, kind: 'professional', year: 2022, access: 'open', checkedOn: '2026-11-24',
  },
  {
    id: 'asq-careers', title: 'ASQ Careers — on-the-job guides for quality engineers', publisher: 'American Society for Quality (ASQ)',
    url: 'https://careers.asq.org/career-resources/', tier: 3, kind: 'professional', year: 2026, access: 'open', checkedOn: '2026-11-24',
  },
  {
    id: 'iso-9001', title: 'ISO 9001:2015 — Quality management systems — Requirements', publisher: 'International Organization for Standardization (ISO)',
    url: 'https://www.iso.org/standard/62085.html', tier: 1, kind: 'standard', year: 2015, access: 'paywalled', checkedOn: '2026-11-24',
    note: 'ISO’s amendment page lists ISO 9001:2026 as the new version (checked 2026-11-24).',
  },
  {
    id: 'iso-9001-amd1', title: 'ISO 9001:2015/Amd 1:2024 — Climate action changes', publisher: 'International Organization for Standardization (ISO)',
    url: 'https://www.iso.org/standard/88431.html', tier: 1, kind: 'standard', year: 2024, access: 'paywalled', checkedOn: '2026-11-24',
  },
  {
    id: 'little-1961', title: 'A Proof for the Queuing Formula: L = λW', authors: 'John D. C. Little', year: 1961,
    publisher: 'Operations Research 9(3):383–387, INFORMS', doi: '10.1287/opre.9.3.383', url: 'https://doi.org/10.1287/opre.9.3.383',
    tier: 2, kind: 'academic', access: 'paywalled', checkedOn: '2026-11-24',
  },
  {
    id: 'little-2011', title: 'Little’s Law as Viewed on Its 50th Anniversary', authors: 'John D. C. Little', year: 2011,
    publisher: 'Operations Research 59(3):536–549, INFORMS', doi: '10.1287/opre.1110.0940', url: 'https://doi.org/10.1287/opre.1110.0940',
    tier: 2, kind: 'academic', access: 'paywalled', checkedOn: '2026-11-24',
  },
  {
    id: 'toc-institute', title: 'The Five Focusing Steps', publisher: 'Theory of Constraints Institute',
    url: 'https://www.tocinstitute.org/five-focusing-steps.html', tier: 3, kind: 'industry', access: 'open', checkedOn: '2026-11-24',
  },
]

export const SOURCES: Record<string, SourceRecord> = Object.fromEntries(list.map((s) => [s.id, s]))

export const TIER_LABEL: Record<SourceRecord['tier'], string> = {
  1: 'Tier 1 · authoritative', 2: 'Tier 2 · academic', 3: 'Tier 3 · practitioner', 4: 'Tier 4 · exploratory',
}
