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
  {
    id: 'plcopen-61131-3', title: 'IEC 61131-3: Programming Languages (edition 3.0, 2013)', publisher: 'PLCopen',
    url: 'https://plcopen.org/node/211', tier: 1, kind: 'professional', year: 2013, access: 'open', checkedOn: '2026-11-25',
    note: 'PLCopen’s summary of the standard. The standard itself is sold by IEC.',
  },
  {
    id: 'rockwell-logix-instructions', title: 'Studio 5000 Logix Designer online help: instruction set', publisher: 'Rockwell Automation',
    url: 'https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/38-01/contents-ditamap/instruction-set/timer-and-counter-instructions/timer-on-delay--ton-.html',
    tier: 1, kind: 'industry', access: 'open', checkedOn: '2026-11-25',
    note: 'Each instruction (XIC, XIO, OTE, OTL, ONS, TON, TOF, RTO, CTU) has its own page; citations link the page they rely on. Versions 37–38 read the same for these instructions.',
  },
  {
    id: 'rockwell-clx-um900', title: 'ControlLogix 5590 Controllers User Manual (1756-UM900): Determine When I/O Data Is Updated', publisher: 'Rockwell Automation',
    url: 'https://www.rockwellautomation.com/en-au/docs/technical/logix5000/_online/1756-um900/controllogix-5590-controller-user-manual-ditamap/manage-controller-i-o-connections/determine-when-i-o-data-is-updated.html',
    tier: 1, kind: 'industry', access: 'open', checkedOn: '2026-11-25',
  },
  {
    id: 'iso-13849-1', title: 'ISO 13849-1:2023 — Safety of machinery — Safety-related parts of control systems — Part 1: General principles for design', publisher: 'International Organization for Standardization (ISO)',
    url: 'https://www.iso.org/standard/73481.html', tier: 1, kind: 'standard', year: 2023, access: 'paywalled', checkedOn: '2026-11-25',
    note: 'Abstract checked; the standard itself is paywalled.',
  },
  {
    id: 'solidworks-help', title: 'SOLIDWORKS Help', publisher: 'Dassault Systèmes SolidWorks Corporation',
    url: 'https://help.solidworks.com/', tier: 1, kind: 'industry', access: 'open', checkedOn: '2026-11-25',
    note: 'The help pages build their text with JavaScript, so they could not be opened directly here. Claims were matched against the search engine’s copy of each page, which is why lessons citing them are marked source-identified, not source-checked.',
  },
  {"id":"openstax-break-even","title":"Principles of Accounting, Volume 2: Managerial Accounting — Calculate a Break-Even Point in Units and Dollars","publisher":"OpenStax, Rice University","url":"https://openstax.org/books/principles-managerial-accounting/pages/3-2-calculate-a-break-even-point-in-units-and-dollars","tier":2,"kind":"academic","access":"open","checkedOn":"2026-11-26"},
  {"id":"doe-data-center-pue","title":"Cooling Water Efficiency Opportunities for Federal Data Centers","publisher":"U.S. Department of Energy","url":"https://www.energy.gov/cmei/femp/cooling-water-efficiency-opportunities-federal-data-centers","tier":1,"kind":"government","access":"open","checkedOn":"2026-11-26"},
  {"id":"psu-fitts","title":"FittsLaw Applet — target acquisition","publisher":"Penn State University","url":"https://acs.ist.psu.edu/discrete-math/applets/fittslaw/FittsLawApplet.html","tier":2,"kind":"academic","access":"open","checkedOn":"2026-11-26"},
]

export const SOURCES: Record<string, SourceRecord> = Object.fromEntries(list.map((s) => [s.id, s]))

export const TIER_LABEL: Record<SourceRecord['tier'], string> = {
  1: 'Tier 1 · authoritative', 2: 'Tier 2 · academic', 3: 'Tier 3 · practitioner', 4: 'Tier 4 · exploratory',
}
