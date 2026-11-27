// Certifications for industrial engineers (owner request, 2026-11-27).
// Rules: every fact links to the page it came from, with the date it was read. Syllabus headings are the
// short official headings only (the full bodies of knowledge are copyrighted, so we link to them instead of
// copying them). Fees are never shown: they change, so the official page is the place to check.
// Each heading maps to existing lesson ids; `src/content/certs.test.ts` fails if a lesson id disappears.

export type Eligible = 'yes' | 'no' | 'check'

export interface CertFact { label: string; value: string; src: string }
export interface CertTopic { code: string; title: string; lessons: string[] }
export interface CertSection { code: string; title: string; weight?: string; topics: CertTopic[] }

export interface Cert {
  id: string
  short: string
  name: string
  body: string
  field: string
  level: string
  /** Official programme page. */
  url: string
  /** Where the syllabus headings below come from. */
  outline: { label: string; url: string; kind: 'official' | 'partner'; version: string }
  asOf: string
  facts: CertFact[]
  /** Can a student with no full-time work experience sit it? */
  student: Eligible
  studentWhy: string
  /** Keys that job postings use for this credential (see JOB_SNAPSHOT). */
  demandKeys: DemandKey[]
  sections: CertSection[]
}

const t = (code: string, title: string, lessons: string[]): CertTopic => ({ code, title, lessons })

const IISE_FAQ = 'https://iise.org/trainingcenter/faq'

export const CERTS: Cert[] = [
  {
    id: 'iise-lean-green-belt',
    short: 'IISE Lean GB',
    name: 'Lean Green Belt',
    body: 'IISE (Institute of Industrial and Systems Engineers)',
    field: 'Lean',
    level: 'Green belt',
    url: 'https://iise.org/IIETrainingCenter/details.aspx?id=53066',
    outline: { label: 'Course topics as listed by IISE course partners (USC Viterbi with IISE; IISE student chapters). IISE publishes no exam outline.', url: 'https://viterbiexeced.usc.edu/engineering-program-areas/industrial-systems-engineering/lean-green-belt/', kind: 'partner', version: 'Course topics, no published exam outline' },
    asOf: '2026-11-27',
    facts: [
      { label: 'How you earn it', value: 'Pass IISE’s exam after the course. IISE uses an examination instead of a green belt project.', src: IISE_FAQ },
      { label: 'Prerequisites', value: 'For green belt courses, IISE expects a basic understanding of algebra.', src: IISE_FAQ },
      { label: 'Belt levels at IISE', value: 'Yellow, green, black and master black belt, in Lean, Six Sigma and Lean Six Sigma.', src: 'https://iise.org/IIETrainingCenter/details.aspx?id=53066' },
      { label: 'Valid for', value: 'Three years, as IISE student chapters state for IISE Lean and Six Sigma certificates.', src: 'https://www.tamuiise.com/certifications' },
    ],
    student: 'yes',
    studentWhy: 'No work experience is required; IISE student chapters run it for students.',
    demandKeys: ['lean'],
    sections: [
      {
        code: 'L', title: 'Lean Green Belt course topics', topics: [
          t('1', '5S and muda (the wastes)', ['lean.five-s', 'lean.eight-wastes']),
          t('2', 'Value-added and non-value-added work', ['lean.value-added']),
          t('3', 'Value stream mapping', ['lean.vsm', 'lean.lead-time', 'lean.takt-time']),
          t('4', 'Pull production', ['lean.pull', 'lean.kanban', 'lean.jit']),
          t('5', 'Point of use', []),
          t('6', 'Setup reduction (SMED)', ['lean.smed']),
          t('7', 'Visual workplace', ['lean.andon', 'lean.five-s']),
          t('8', 'Kaizen events', ['lean.kaizen', 'lean.pdca', 'lean.a3']),
          t('9', 'Voice of the customer', ['quality.voc', 'quality.ctq']),
        ],
      },
    ],
  },
  {
    id: 'iise-six-sigma-green-belt',
    short: 'IISE SS GB',
    name: 'Six Sigma Green Belt',
    body: 'IISE (Institute of Industrial and Systems Engineers)',
    field: 'Six Sigma',
    level: 'Green belt',
    url: 'https://www.iise.org/trainingcenter/details.aspx?id=36353',
    outline: { label: 'The 13 units of IISE’s online Six Sigma Green Belt course', url: 'https://www.iise.org/trainingcenter/details.aspx?id=36353', kind: 'official', version: 'Online course units' },
    asOf: '2026-11-27',
    facts: [
      { label: 'How you earn it', value: 'Pass IISE’s green belt exam, which is included in the course fee. IISE uses an examination instead of a project.', src: 'https://www.iise.org/trainingcenter/details.aspx?id=36353' },
      { label: 'Prerequisites', value: 'For green belt courses, IISE expects a basic understanding of algebra.', src: IISE_FAQ },
      { label: 'Valid for', value: 'Three years; renew by emailing IISE customer service.', src: 'https://www.iise.org/trainingcenter/details.aspx?id=36353' },
      { label: 'Who sets Six Sigma standards', value: 'No single body: IISE says there is no universally recognized standard-setter, so belts differ by awarding body.', src: IISE_FAQ },
    ],
    student: 'yes',
    studentWhy: 'No work experience is required; the exam replaces a project.',
    demandKeys: ['six-sigma'],
    sections: [
      {
        code: 'U', title: 'Course units', topics: [
          t('2', 'What is Lean Six Sigma?', ['quality.six-sigma', 'lean.tps']),
          t('3', 'The DMAIIC process', ['quality.dmaic']),
          t('4', 'Roles and responsibilities', ['quality.six-sigma']),
          t('5', 'Variation', ['quality.common-special', 'stats.std-dev']),
          t('6', 'Describing data', ['stats.mean-median', 'stats.std-dev', 'stats.boxplot-iqr', 'stats.normal']),
          t('7', 'Control charts', ['quality.control-chart', 'quality.xbar-r', 'quality.imr', 'quality.p-chart', 'quality.c-u-chart']),
          t('8', 'Interpreting control charts', ['quality.we-rules', 'quality.common-special']),
          t('9', 'Process capability', ['quality.cp', 'quality.cpk', 'quality.ppk']),
          t('10', 'Design for Six Sigma', []),
          t('11', 'Root cause analysis', ['quality.fishbone', 'lean.five-whys', 'quality.pareto', 'safety.rca']),
          t('12', 'Implementation strategy', []),
          t('13', 'Lean enterprise', ['lean.tps', 'lean.vsm', 'lean.eight-wastes']),
        ],
      },
    ],
  },
  {
    id: 'asq-cssgb',
    short: 'ASQ CSSGB',
    name: 'Certified Six Sigma Green Belt',
    body: 'ASQ (American Society for Quality)',
    field: 'Six Sigma',
    level: 'Green belt',
    url: 'https://asq.org/cert/six-sigma-green-belt',
    outline: { label: '2022 Certified Six Sigma Green Belt Body of Knowledge', url: 'https://asq.org/cert/resource/pdf/certification/2022-SSGB-BoK.pdf', kind: 'official', version: '2022 BoK' },
    asOf: '2026-11-27',
    facts: [
      { label: 'Experience', value: 'Three years of full-time, paid work in one or more areas of the body of knowledge. No education waivers.', src: 'https://asq.org/cert/six-sigma-green-belt' },
      { label: 'Exam (computer)', value: '110 questions (100 scored), 4 hours 18 minutes, open book.', src: 'https://asq.org/cert/six-sigma-green-belt' },
    ],
    student: 'no',
    studentWhy: 'Needs three years of full-time, paid work in the body-of-knowledge areas; internships don’t count.',
    demandKeys: ['six-sigma', 'asq-any'],
    sections: [
      { code: 'I', title: 'Overview: Six Sigma and the organization', weight: '11 questions', topics: [
        t('A', 'Six Sigma and organizational goals', ['quality.six-sigma', 'quality.copq']),
        t('B', 'Lean principles in the organization', ['lean.tps', 'lean.eight-wastes', 'lean.value-added']),
        t('C', 'Design for Six Sigma (DFSS) methodologies', []),
      ] },
      { code: 'II', title: 'Define phase', weight: '20 questions', topics: [
        t('A', 'Project identification', ['quality.sipoc', 'quality.pareto']),
        t('B', 'Voice of the customer', ['quality.voc', 'quality.ctq']),
        t('C', 'Project management basics', ['pm.charter', 'pm.scope', 'pm.wbs', 'pm.gantt']),
        t('D', 'Management and planning tools', []),
        t('E', 'Business results for projects', ['quality.dpmo', 'quality.copq']),
        t('F', 'Team dynamics and performance', ['pm.raci', 'pm.stakeholder']),
      ] },
      { code: 'III', title: 'Measure phase', weight: '20 questions', topics: [
        t('A', 'Process analysis and documentation', ['quality.sipoc', 'work.process-chart', 'lean.vsm']),
        t('B', 'Probability and statistics', ['stats.sampling', 'stats.clt']),
        t('C', 'Statistical distributions', ['stats.normal', 'stats.binomial', 'stats.poisson', 'stats.exponential-dist']),
        t('D', 'Collecting and summarizing data', ['stats.mean-median', 'stats.std-dev', 'stats.boxplot-iqr']),
        t('E', 'Measurement system analysis', ['quality.gage-rr']),
        t('F', 'Process and performance capability', ['quality.cp', 'quality.cpk', 'quality.ppk', 'quality.dpmo']),
      ] },
      { code: 'IV', title: 'Analyze phase', weight: '18 questions', topics: [
        t('A', 'Exploratory data analysis', ['stats.correlation', 'stats.regression', 'stats.r-squared']),
        t('B', 'Hypothesis testing', ['stats.hypothesis-test', 'stats.p-value', 'stats.type-errors', 'stats.power', 'stats.t-test', 'stats.anova', 'stats.chi-square']),
        t('C', 'Additional analysis methods', ['safety.fmea', 'safety.rca', 'lean.eight-wastes']),
      ] },
      { code: 'V', title: 'Improve phase', weight: '16 questions', topics: [
        t('A', 'Design of experiments', ['doe.basics', 'doe.full-factorial', 'doe.main-effect', 'doe.interaction']),
        t('B', 'Implementation planning', ['pm.risk-register']),
        t('C', 'Lean tools', ['lean.five-s', 'lean.kaizen', 'lean.smed', 'lean.poka-yoke', 'lean.kanban']),
      ] },
      { code: 'VI', title: 'Control phase', weight: '15 questions', topics: [
        t('A', 'Statistical process control', ['quality.control-chart', 'quality.xbar-r', 'quality.imr', 'quality.p-chart', 'quality.c-u-chart', 'quality.we-rules']),
        t('B', 'Sustain improvements', ['quality.control-plan', 'lean.standard-work', 'pm.lessons-learned']),
        t('C', 'Lean tools for process control', ['reliability.tpm', 'lean.andon', 'lean.poka-yoke']),
      ] },
    ],
  },
  {
    id: 'asq-cqe',
    short: 'ASQ CQE',
    name: 'Certified Quality Engineer',
    body: 'ASQ (American Society for Quality)',
    field: 'Quality',
    level: 'Professional',
    url: 'https://asq.org/cert/quality-engineer',
    outline: { label: 'Certified Quality Engineer Body of Knowledge (2015)', url: 'https://asq.org/cert/resource/pdf/certification/CQE-BOK-2015.pdf', kind: 'official', version: '2015 BoK' },
    asOf: '2026-11-27',
    facts: [
      { label: 'Experience', value: 'Eight years in the body-of-knowledge areas, three of them in a decision-making position, full-time and paid.', src: 'https://asq.org/cert/quality-engineer' },
      { label: 'Degree waivers (one only)', value: 'Bachelor’s degree waives 4 years; master’s or doctorate waives 5.', src: 'https://asq.org/cert/quality-engineer' },
      { label: 'Exam (computer)', value: '175 questions (160 scored), 5 hours 18 minutes, open book.', src: 'https://asq.org/cert/quality-engineer' },
    ],
    student: 'no',
    studentWhy: 'Even with a master’s waiver, it needs three years of full-time work, in a decision-making role.',
    demandKeys: ['cqe', 'asq-any'],
    sections: [
      { code: 'I', title: 'Management and leadership', weight: '18 questions', topics: [
        t('A', 'Quality philosophies and foundations', ['quality.six-sigma', 'lean.pdca']),
        t('B', 'The quality management system', ['quality.iso9001']),
        t('C', 'ASQ code of ethics', ['career.ethics']),
        t('D', 'Leadership principles and techniques', []),
        t('E', 'Facilitation principles and techniques', []),
        t('F', 'Communication skills', ['career.technical-communication']),
        t('G', 'Customer relations', ['quality.voc']),
        t('H', 'Supplier management', ['scm.supplier-scorecard', 'scm.strategic-sourcing']),
        t('I', 'Barriers to quality improvement', []),
      ] },
      { code: 'II', title: 'The quality system', weight: '16 questions', topics: [
        t('A', 'Elements of the quality system', ['quality.iso9001']),
        t('B', 'Documentation of the quality system', ['quality.iso9001', 'quality.control-plan']),
        t('C', 'Quality standards and other guidelines', ['quality.iso9001', 'manufacturing.iatf', 'manufacturing.as9100']),
        t('D', 'Quality audits', []),
        t('E', 'Cost of quality', ['quality.copq']),
        t('F', 'Quality training', []),
      ] },
      { code: 'III', title: 'Product, process and service design', weight: '23 questions', topics: [
        t('A', 'Classification of quality characteristics', ['quality.ctq']),
        t('B', 'Design inputs and review', ['systems.requirements', 'systems.design-reviews']),
        t('C', 'Technical drawings and specifications', ['manufacturing.gdt', 'manufacturing.tolerance-stack']),
        t('D', 'Verification and validation', ['systems.verification-validation']),
        t('E', 'Reliability and maintainability', ['reliability.reliability-fn', 'reliability.mtbf', 'reliability.availability', 'reliability.bathtub', 'reliability.weibull']),
      ] },
      { code: 'IV', title: 'Product and process control', weight: '25 questions', topics: [
        t('A', 'Methods', ['quality.control-plan', 'manufacturing.apqp', 'manufacturing.ppap']),
        t('B', 'Material control', ['manufacturing.ncr', 'manufacturing.fai']),
        t('C', 'Acceptance sampling', ['quality.aql']),
        t('D', 'Measurement and test', ['manufacturing.cmm']),
        t('E', 'Metrology', ['manufacturing.measurement-uncertainty', 'manufacturing.cmm']),
        t('F', 'Measurement system analysis', ['quality.gage-rr']),
      ] },
      { code: 'V', title: 'Continuous improvement', weight: '27 questions', topics: [
        t('A', 'Quality control tools', ['quality.seven-tools', 'quality.pareto', 'quality.fishbone']),
        t('B', 'Quality management and planning tools', []),
        t('C', 'Continuous improvement methodologies', ['quality.dmaic', 'lean.pdca', 'lean.kaizen']),
        t('D', 'Lean tools', ['lean.five-s', 'lean.vsm', 'lean.smed', 'lean.poka-yoke', 'lean.standard-work']),
        t('E', 'Corrective action', ['quality.capa', 'safety.eight-d', 'safety.rca']),
        t('F', 'Preventive action', ['quality.capa', 'safety.fmea']),
      ] },
      { code: 'VI', title: 'Quantitative methods and tools', weight: '36 questions', topics: [
        t('A', 'Collecting and summarizing data', ['stats.mean-median', 'stats.std-dev', 'stats.boxplot-iqr']),
        t('B', 'Quantitative concepts', ['stats.sampling', 'stats.clt']),
        t('C', 'Probability distributions', ['stats.normal', 'stats.binomial', 'stats.poisson', 'stats.exponential-dist']),
        t('D', 'Statistical decision-making', ['stats.confidence-interval', 'stats.hypothesis-test', 'stats.t-test', 'stats.anova', 'stats.chi-square']),
        t('E', 'Relationships between variables', ['stats.correlation', 'stats.regression', 'stats.r-squared']),
        t('F', 'Statistical process control', ['quality.control-chart', 'quality.xbar-r', 'quality.p-chart', 'quality.we-rules', 'quality.ewma-cusum']),
        t('G', 'Process and performance capability', ['quality.cp', 'quality.cpk', 'quality.ppk']),
        t('H', 'Design and analysis of experiments', ['doe.basics', 'doe.full-factorial', 'doe.fractional-factorial', 'doe.interaction']),
      ] },
      { code: 'VII', title: 'Risk management', weight: '15 questions', topics: [
        t('A', 'Risk oversight', ['safety.hazard-risk', 'safety.risk-matrix']),
        t('B', 'Risk assessment', ['safety.fmea', 'safety.fta', 'safety.pha']),
        t('C', 'Risk control', ['safety.hierarchy-controls', 'safety.barrier']),
      ] },
    ],
  },
  {
    id: 'ncees-fe-industrial',
    short: 'FE Industrial',
    name: 'FE Industrial and Systems',
    body: 'NCEES (National Council of Examiners for Engineering and Surveying)',
    field: 'Licensure',
    level: 'Licensure, first step',
    url: 'https://ncees.org/engineering/fe/',
    outline: { label: 'FE Industrial and Systems CBT exam specifications', url: 'https://ncees.org/wp-content/uploads/2022/09/FE-Industrial-and-Systems-CBT-specs.pdf', kind: 'official', version: 'Effective July 2020' },
    asOf: '2026-11-27',
    facts: [
      { label: 'Exam', value: '110 questions, 6 hours including a tutorial and an optional break; computer-based, closed book with an electronic reference.', src: 'https://ncees.org/wp-content/uploads/2022/09/FE-Industrial-and-Systems-CBT-specs.pdf' },
      { label: 'Eligibility', value: 'Set by each state licensing board. In Texas, per Texas A&M, graduate students enrolled in an engineering master’s or PhD may take it.', src: 'https://engineering.tamu.edu/academics/fe-exam' },
      { label: 'What it leads to', value: 'After the FE, licensure needs about four years of accepted experience and the PE exam.', src: 'https://web.uri.edu/engineering/fe-faqs/' },
    ],
    student: 'check',
    studentWhy: 'Students can usually take it near graduation, but your state board decides; check before registering.',
    demandKeys: ['eit'],
    sections: [
      { code: '1', title: 'Mathematics', weight: '6–9 questions', topics: [t('A', 'Analytic geometry', []), t('B', 'Calculus', []), t('C', 'Linear algebra', [])] },
      { code: '2', title: 'Engineering sciences', weight: '4–6 questions', topics: [t('A', 'Thermodynamics and fluid mechanics', []), t('B', 'Statics, dynamics and materials', []), t('C', 'Electricity and electrical circuits', [])] },
      { code: '3', title: 'Ethics and professional practice', weight: '4–6 questions', topics: [
        t('A', 'Codes of ethics and licensure', ['career.ethics', 'career.fe-exam']), t('B', 'Agreements and contracts', []),
        t('C', 'Professional, ethical and legal responsibility', ['career.ethics']), t('D', 'Public protection and regulatory issues', ['career.ethics']),
      ] },
      { code: '4', title: 'Engineering economics', weight: '9–14 questions', topics: [
        t('A', 'Discounted cash flows', ['engecon.tvm', 'engecon.factors', 'engecon.cash-flow-diagram', 'engecon.npv']),
        t('B', 'Evaluation of alternatives', ['engecon.annual-worth', 'engecon.irr', 'engecon.incremental', 'engecon.bc-ratio', 'engecon.payback']),
        t('C', 'Cost analyses', ['engecon.break-even', 'engecon.cost-estimation', 'engecon.replacement']),
        t('D', 'Depreciation and taxes', ['engecon.depreciation', 'engecon.macrs', 'engecon.after-tax']),
      ] },
      { code: '5', title: 'Probability and statistics', weight: '10–15 questions', topics: [
        t('A', 'Probabilities', ['stats.binomial']), t('B', 'Probability distributions and functions', ['stats.normal', 'stats.binomial', 'stats.poisson', 'stats.exponential-dist']),
        t('C', 'Estimation, confidence intervals and hypothesis testing', ['stats.confidence-interval', 'stats.hypothesis-test', 'stats.t-test']),
        t('D', 'Linear regression', ['stats.regression', 'stats.r-squared']), t('E', 'Design of experiments', ['doe.basics', 'doe.full-factorial']),
      ] },
      { code: '6', title: 'Modeling and quantitative analysis', weight: '9–14 questions', topics: [
        t('A', 'Data, logic development and analytics', ['datasci.sql', 'datasci.excel-modeling']),
        t('B', 'Linear programming and optimization', ['or.lp', 'or.simplex', 'or.ip', 'or.sensitivity']),
        t('C', 'Stochastic models and simulation', ['or.mm1', 'or.mmc', 'or.markov', 'simulation.des', 'simulation.monte-carlo']),
      ] },
      { code: '7', title: 'Engineering management', weight: '8–12 questions', topics: [
        t('A', 'Principles and tools', ['pm.pmbok']), t('B', 'Project management', ['pm.wbs', 'pm.cpm', 'pm.pert', 'pm.evm']),
        t('C', 'Performance measurement', ['lean.oee', 'safety.leading-lagging']), t('D', 'Decision making and risk', ['or.decision-tree', 'systems.trade-study', 'pm.risk-register']),
      ] },
      { code: '8', title: 'Manufacturing, service and other production systems', weight: '9–14 questions', topics: [
        t('A', 'Manufacturing processes', ['manufacturing.machining', 'manufacturing.casting', 'manufacturing.injection-molding', 'manufacturing.welding']),
        t('B', 'Manufacturing and service systems', ['manufacturing.mts-mto', 'service.service-systems']),
        t('C', 'Forecasting', ['scm.forecasting', 'datasci.moving-average', 'datasci.exp-smoothing']),
        t('D', 'Planning and scheduling', ['manufacturing.aggregate-planning', 'manufacturing.mps', 'manufacturing.mrp', 'manufacturing.dispatch-rules', 'manufacturing.johnsons-rule']),
        t('E', 'Process improvements', ['lean.vsm', 'quality.dmaic', 'lean.kaizen']),
      ] },
      { code: '9', title: 'Facilities and supply chain', weight: '9–14 questions', topics: [
        t('A', 'Flow, layout and location analysis', ['facilities.layout-types', 'facilities.slp', 'facilities.from-to', 'facilities.center-gravity', 'or.facility-location']),
        t('B', 'Capacity analysis', ['manufacturing.capacity-planning', 'facilities.capacity-space', 'lean.littles-law']),
        t('C', 'Supply chain management and design', ['scm.network-design', 'scm.safety-stock', 'scm.reorder-point', 'or.eoq', 'scm.bullwhip']),
      ] },
      { code: '10', title: 'Human factors, ergonomics and safety', weight: '8–12 questions', topics: [
        t('A', 'Human factors', ['ergo.cognitive-load', 'ergo.human-error', 'ergo.display-control', 'ergo.fitts', 'ergo.hick']),
        t('B', 'Safety and industrial hygiene', ['safety.osha', 'safety.hierarchy-controls', 'ergo.environment']),
        t('C', 'Ergonomics', ['ergo.niosh', 'ergo.rula-reba', 'ergo.anthropometry', 'ergo.workstation-design']),
      ] },
      { code: '11', title: 'Work design', weight: '7–11 questions', topics: [
        t('A', 'Methods analysis', ['work.methods-engineering', 'work.process-chart', 'work.motion-economy']),
        t('B', 'Work measurement', ['work.time-study', 'work.standard-time', 'work.work-sampling', 'work.pmts']),
        t('C', 'Learning curves', ['work.learning-curve']),
      ] },
      { code: '12', title: 'Quality', weight: '9–14 questions', topics: [
        t('A', 'Quality management, planning, assurance and systems', ['quality.iso9001', 'quality.six-sigma', 'quality.copq']),
        t('B', 'Quality control', ['quality.control-chart', 'quality.cp', 'quality.cpk', 'quality.aql']),
      ] },
      { code: '13', title: 'Systems engineering, analysis and design', weight: '8–12 questions', topics: [
        t('A', 'Requirements analysis and system design', ['systems.stakeholder-needs', 'systems.requirements', 'systems.conops']),
        t('B', 'Functional analysis and configuration management', ['systems.functional-decomposition', 'systems.config-management']),
        t('C', 'Risk management', ['safety.risk-matrix', 'pm.risk-register']),
        t('D', 'Life-cycle engineering', ['systems.lifecycle', 'systems.v-model']),
        t('E', 'Reliability engineering', ['reliability.reliability-fn', 'reliability.rbd', 'reliability.mtbf']),
      ] },
    ],
  },
  {
    id: 'ascm-cpim',
    short: 'ASCM CPIM',
    name: 'Certified in Planning and Inventory Management',
    body: 'ASCM (Association for Supply Chain Management, formerly APICS)',
    field: 'Planning and supply chain',
    level: 'Professional',
    url: 'https://www.ascm.org/learning-development/certifications-credentials/cpim/',
    outline: { label: 'CPIM 2026 module content outline (Exam Content Manual 9.0)', url: 'https://www.ascm.org/globalassets/ascm_website_assets/docs/credentials/2026-cpim-module-content-outline.pdf', kind: 'official', version: 'ECM 9.0, nine modules' },
    asOf: '2026-11-27',
    facts: [
      { label: 'Version', value: 'Nine modules apply to bundles and learning systems bought from 3 February 2026; the older eight-module exam sunset on 31 May 2026.', src: 'https://www.ascm.org/learning-development/certifications-credentials/exam-details' },
      { label: 'Eligibility', value: 'No eligibility requirements; one exam earns the designation (per an ASCM chapter).', src: 'https://sctx.ascm.org/CPIM' },
      { label: 'Exam format', value: 'See ASCM’s exam details page (not copied here, so it can’t go stale).', src: 'https://www.ascm.org/learning-development/certifications-credentials/exam-details' },
    ],
    student: 'yes',
    studentWhy: 'No degree or experience is required to sit it.',
    demandKeys: ['apics'],
    sections: [
      { code: '1', title: 'Supply chains and strategy', topics: [
        t('A', 'Supply chains, the environment and strategy', ['scm.scor', 'scm.efficient-responsive']), t('B', 'Environment analysis and strategic scope', []),
        t('C', 'Developing and managing organizational strategy', ['lean.hoshin']), t('D', 'Performance monitoring and KPIs', ['scm.inventory-turns', 'lean.oee']),
      ] },
      { code: '2', title: 'Sales and operations planning', topics: [
        t('A', 'S&OP purpose and process', ['scm.sop']), t('B', 'Aggregate demand and supply plans', ['manufacturing.aggregate-planning']), t('C', 'Reconciling S&OP plans', ['scm.sop']),
      ] },
      { code: '3', title: 'Demand', topics: [
        t('A', 'Demand management', ['scm.forecasting']), t('B', 'Sources of demand and forecasting', ['scm.forecasting', 'datasci.moving-average', 'datasci.exp-smoothing', 'datasci.arima']),
        t('C', 'Forecast performance', ['datasci.mape', 'datasci.rmse-mae']),
      ] },
      { code: '4', title: 'Internal supply', topics: [
        t('A', 'Functional and operational strategies', ['manufacturing.mts-mto']), t('B', 'Environments, types and layouts', ['facilities.layout-types', 'lean.cellular']),
        t('C', 'Creating the master schedule', ['manufacturing.mps']), t('D', 'Rough-cut capacity planning and MPS validation', ['manufacturing.capacity-planning']),
        t('E', 'Using and maintaining the master schedule', ['manufacturing.mps']), t('F', 'Material requirements planning', ['manufacturing.mrp', 'manufacturing.bom']),
        t('G', 'Capacity requirements planning, order promising and final assembly scheduling', ['manufacturing.capacity-planning']), t('H', 'Changes and supply disruptions', ['scm.resilience']),
      ] },
      { code: '5', title: 'External supply and key support functions', topics: [
        t('A', 'Suppliers and procurement', ['scm.procurement', 'scm.strategic-sourcing', 'scm.make-buy']), t('B', 'Purchasing and maintenance', ['scm.supplier-scorecard', 'reliability.pm']),
        t('C', 'Risk management', ['scm.resilience', 'scm.risk-pooling']), t('D', 'Sustainability strategies', ['sustain.circular-economy', 'sustain.esg']),
        t('E', 'Waste hierarchy and reverse logistics', ['scm.reverse-logistics']),
      ] },
      { code: '6', title: 'Inventory', topics: [
        t('A', 'Inventory planning', ['scm.safety-stock', 'scm.reorder-point', 'or.eoq']), t('B', 'Inventory costs, basic accounting, costing and metrics', ['scm.inventory-turns', 'scm.tco']),
        t('C', 'Inventory management', ['scm.abc', 'scm.vmi']), t('D', 'Inventory control', ['scm.abc']),
      ] },
      { code: '7', title: 'Detailed schedules', topics: [
        t('A', 'Planning detailed schedules', ['manufacturing.routing', 'manufacturing.dispatch-rules']), t('B', 'Scheduling and production activity control methods', ['manufacturing.dispatch-rules', 'manufacturing.johnsons-rule', 'manufacturing.mes']),
        t('C', 'Creating production and service schedules', ['lean.heijunka', 'service.staffing']), t('D', 'Managing detailed schedules and scheduling materials', ['lean.kanban']),
      ] },
      { code: '8', title: 'Distribution', topics: [
        t('A', 'Planning distribution', ['scm.network-design', 'scm.warehouse']), t('B', 'Replenishment', ['scm.reorder-point', 'scm.vmi']), t('C', 'Order management, trace and track, and KPIs', ['scm.wms', 'scm.tms']),
      ] },
      { code: '9', title: 'Quality, business investments and continuous improvement', topics: [
        t('A', 'Quality', ['quality.six-sigma', 'quality.control-chart']), t('B', 'Capital equipment and facilities', ['engecon.npv', 'engecon.replacement']),
        t('C', 'Technology', ['automation.industry40', 'manufacturing.erp']), t('D', 'Continuous improvement', ['lean.kaizen', 'quality.dmaic', 'lean.tps']),
      ] },
    ],
  },
]

export const CERT_MAP: Record<string, Cert> = Object.fromEntries(CERTS.map((c) => [c.id, c]))

/** Other credentials worth knowing, with only facts we have read on the official (or cited) page. */
export const OTHER_CERTS: { name: string; body: string; note: string; url: string }[] = [
  { name: 'PE Industrial and Systems', body: 'NCEES', note: 'For engineers with about four years of post-college experience; 85 questions, 9.5 hours. NCEES surveyed engineers in 2026 to revise the specifications.', url: 'https://ncees.org/wp-content/uploads/2026/01/PE-Ind-Oct-2020_updated-2025.pdf' },
  { name: 'Certified Six Sigma Yellow Belt (CSSYB)', body: 'ASQ', note: 'Requires no education or work experience.', url: 'https://asq.org/cert/resource/pdf/certification/cssyb-cert-insert.pdf' },
  { name: 'Certified Six Sigma Black Belt (CSSBB)', body: 'ASQ', note: 'Requires at least one completed Six Sigma project with a signed affidavit.', url: 'https://asq.org/cert/six-sigma-black-belt' },
  { name: 'Certified Reliability Engineer (CRE)', body: 'ASQ', note: 'New body of knowledge tested from January 2025.', url: 'https://asq.org/cert/reliability-engineer' },
  { name: 'Certified Manufacturing Technologist (CMfgT)', body: 'SME', note: 'Entry level: four years of combined manufacturing-related education and/or work.', url: 'https://www.sme.org/training/technical-certification/' },
  { name: 'Certified Manufacturing Engineer (CMfgE)', body: 'SME', note: 'Eight years of combined education and work, at least four of them work; recertify every three years.', url: 'https://www.sme.org/training/technical-certification/' },
  { name: 'Lean Bronze, Silver and Gold', body: 'SME with AME and the Shingo Institute', note: 'Lean certification in three levels.', url: 'https://www.sme.org/training/certifications' },
]

/* ---------- What employers ask for: a small, dated sample of real postings ---------- */

export type DemandKey = 'six-sigma' | 'lean' | 'asq-any' | 'cqe' | 'cqa' | 'apics' | 'pmp' | 'eit' | 'iso-auditor' | 'ipc' | 'quality-generic'
export type Family = 'quality' | 'ci-lean' | 'ie-mfg' | 'planning-scm'
export const FAMILY_LABEL: Record<Family, string> = { quality: 'Quality engineering', 'ci-lean': 'Continuous improvement / Lean', 'ie-mfg': 'Industrial / manufacturing / operations', 'planning-scm': 'Planning and supply chain' }
export const DEMAND_LABEL: Record<DemandKey, string> = {
  'six-sigma': 'Six Sigma or Lean Six Sigma belt', lean: 'Lean certification', 'asq-any': 'Any ASQ certification', cqe: 'ASQ CQE', cqa: 'ASQ CQA', apics: 'APICS/ASCM (CPIM, CSCP, CLTD)',
  pmp: 'PMP', eit: 'EIT (passed the FE)', 'iso-auditor': 'ISO 9001 internal auditor', ipc: 'IPC specialist', 'quality-generic': '“Professional quality certifications”',
}

export interface Posting { title: string; company: string; posted: string; family: Family; url: string; names: DemandKey[]; how?: string }

/**
 * 16 US full-time postings read in full on 2026-11-27 through the Indeed connector. Searches: “industrial engineer” (US),
 * “quality engineer certification” (US), “manufacturing engineer lean six sigma” (Texas), “production planner supply chain
 * analyst APICS” (US). Three of the four searches named a certification or method, so the sample leans towards postings
 * that mention one. Counted only when the posting names the credential, not when it only asks for the skill.
 */
export const JOB_SNAPSHOT = {
  read: '2026-11-27',
  postings: [
    { title: 'Industrial Engineer', company: 'Amphenol NPI Solutions', posted: '2026-11-18', family: 'ie-mfg', url: 'https://to.indeed.com/aafbx6jtjhg4', names: [] },
    { title: 'Industrial Engineer', company: 'Covercraft Industries', posted: '2026-11-27', family: 'ie-mfg', url: 'https://to.indeed.com/aasclpn8tq6d', names: [] },
    { title: 'Continuous Improvement Engineer', company: 'Desco Corporation', posted: '2026-04-28', family: 'ci-lean', url: 'https://to.indeed.com/aajnqhw7d48k', names: [], how: 'Asks for a basic understanding of Six Sigma, not a certificate' },
    { title: 'Quality Engineer', company: 'Platinum Engineering', posted: '2026-11-12', family: 'quality', url: 'https://to.indeed.com/aalv6fnw6fhq', names: [] },
    { title: 'Quality Engineer', company: 'Cleveland Controls', posted: '2026-11-09', family: 'quality', url: 'https://to.indeed.com/aaq4rfqjyx9s', names: ['cqe', 'asq-any', 'six-sigma', 'iso-auditor'], how: 'Preferred' },
    { title: 'Quality Engineer', company: 'Caterpillar', posted: '2026-11-23', family: 'quality', url: 'https://to.indeed.com/aan8jkqqgwxq', names: ['cqe', 'cqa', 'asq-any', 'six-sigma', 'ipc'], how: '“What will set you apart”' },
    { title: 'Quality Engineer 2', company: 'Emerson', posted: '2026-11-24', family: 'quality', url: 'https://to.indeed.com/aafjdt6p68hj', names: ['pmp', 'lean', 'six-sigma', 'asq-any'], how: 'Preferred, “or progress toward certification”' },
    { title: 'Supplier Quality Engineer', company: 'AAON', posted: '2026-11-25', family: 'quality', url: 'https://to.indeed.com/aarckrr7f2zv', names: ['eit', 'quality-generic'], how: 'Preferred; the posting also contains a mechanical engineer description' },
    { title: 'Continuous Improvement Engineer', company: 'CFAN', posted: '2026-11-06', family: 'ci-lean', url: 'https://to.indeed.com/aa24cvnphqf8', names: ['six-sigma'], how: 'Lean Six Sigma Green Belt listed as required, Black Belt preferred' },
    { title: 'Manufacturing Engineer, Continuous Improvement', company: 'Labrie Enviroquip', posted: '2026-08-12', family: 'ci-lean', url: 'https://to.indeed.com/aa6dgmz87pn7', names: ['six-sigma', 'lean'], how: 'Preferred' },
    { title: 'Manufacturing Engineer', company: 'Precision Advanced Manufacturing', posted: '2026-10-27', family: 'ie-mfg', url: 'https://to.indeed.com/aaxfmf727ckm', names: [] },
    { title: 'Operations Engineer', company: 'Amazon', posted: '2026-11-24', family: 'ie-mfg', url: 'https://to.indeed.com/aa48nsd9s9ds', names: [], how: 'Asks for experience with Six Sigma and Lean, not a certificate' },
    { title: 'Industrial Engineer, Contract Logistics', company: 'Forward Air', posted: '2026-11-03', family: 'ie-mfg', url: 'https://to.indeed.com/aadpgymrgrb9', names: ['six-sigma', 'apics', 'pmp'], how: 'Preferred, not required' },
    { title: 'Manufacturing Engineer', company: 'Johnson Controls', posted: '2026-11-14', family: 'ie-mfg', url: 'https://to.indeed.com/aasvmxzkmmrz', names: [], how: 'Lists Lean and Six Sigma as preferred skills' },
    { title: 'Production Scheduler and Material Planner', company: 'Jorgensen Conveyor', posted: '2026-11-18', family: 'planning-scm', url: 'https://to.indeed.com/aalvldkjgknk', names: ['apics'], how: 'CPIM or CSCP preferred' },
    { title: 'Aerospace Production Planner', company: 'Moog', posted: '2026-11-24', family: 'planning-scm', url: 'https://to.indeed.com/aa22vrwhhczy', names: ['apics'], how: 'An APICS certification can replace two to three years of experience' },
  ] satisfies Posting[] as Posting[],
}

/** How many postings (optionally of one family) name any of the given credentials. */
export function demand(keys: DemandKey[], family?: Family): { hits: number; of: number } {
  const pool = JOB_SNAPSHOT.postings.filter((p) => !family || p.family === family)
  return { hits: pool.filter((p) => p.names.some((k) => keys.includes(k))).length, of: pool.length }
}

/* ---------- Which certification next? ---------- */

export type Experience = 'none' | '1-2' | '3-7' | '8+'
export const EXPERIENCE_LABEL: Record<Experience, string> = { none: 'Student or no full-time work yet', '1-2': '1–2 years full-time', '3-7': '3–7 years full-time', '8+': '8 or more years' }

/** Whether you can sit it now, from the official eligibility facts above. 'check' means a board or the details decide. */
export function eligibleNow(cert: Cert, exp: Experience): Eligible {
  switch (cert.id) {
    case 'asq-cssgb': return exp === '3-7' || exp === '8+' ? 'check' : 'no' // years must be in BoK areas
    case 'asq-cqe': return exp === '3-7' || exp === '8+' ? 'check' : 'no' // 8 years minus one degree waiver, 3 of them decision-making
    case 'ncees-fe-industrial': return 'check'
    default: return cert.student
  }
}

export interface Pick { cert: Cert; eligible: Eligible; hits: number; of: number; reasons: string[] }

export function rankNext(opts: { family?: Family; exp: Experience; held: string[]; coverage: (c: Cert) => number }): Pick[] {
  const order: Record<Eligible, number> = { yes: 0, check: 1, no: 2 }
  return CERTS.filter((c) => !opts.held.includes(c.id)).map((cert) => {
    const eligible = eligibleNow(cert, opts.exp)
    const { hits, of } = demand(cert.demandKeys, opts.family)
    const cov = opts.coverage(cert)
    const reasons = [
      `Named in ${hits} of ${of} ${opts.family ? FAMILY_LABEL[opts.family].toLowerCase() + ' ' : ''}postings in our sample`,
      eligible === 'yes' ? 'You can sit it now' : eligible === 'check' ? 'You may qualify; check the eligibility rule' : 'Not yet: see the eligibility rule',
      `We teach ${cov}% of its syllabus headings`,
    ]
    return { cert, eligible, hits, of, reasons }
  }).sort((a, b) => order[a.eligible] - order[b.eligible] || b.hits - a.hits || opts.coverage(b.cert) - opts.coverage(a.cert))
}

/** Reverse index: lesson id → certifications whose syllabus maps to it. */
export function certsForLesson(id: string): Cert[] {
  return CERTS.filter((c) => c.sections.some((s) => s.topics.some((tp) => tp.lessons.includes(id))))
}

export function coverage(cert: Cert): { covered: number; total: number; pct: number; lessons: string[] } {
  const topics = cert.sections.flatMap((s) => s.topics)
  const covered = topics.filter((tp) => tp.lessons.length > 0).length
  const lessons = [...new Set(topics.flatMap((tp) => tp.lessons))]
  return { covered, total: topics.length, pct: Math.round((covered / topics.length) * 100), lessons }
}
