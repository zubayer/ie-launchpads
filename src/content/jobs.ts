import type { Concept, DomainId, RolePath } from '../types'
import { ROLES } from './roles'
import type { ConceptIndex } from './assemble'

// Real job-board titles that ask for each area. Sub-area lists are more specific and come first.
export const DOMAIN_ROLES: Record<DomainId, string[]> = {
  stats: ['Quality Engineer', 'Data Analyst', 'Process Engineer', 'Six Sigma Black Belt', 'Reliability Engineer', 'Manufacturing Engineer'],
  quality: ['Quality Engineer', 'Supplier Quality Engineer', 'Quality Assurance Specialist', 'Six Sigma Black Belt', 'Process Engineer', 'Continuous Improvement Engineer'],
  doe: ['Process Engineer', 'Process Development Engineer', 'Quality Engineer', 'R&D Engineer', 'Yield Engineer', 'Data Scientist'],
  or: ['Operations Research Analyst', 'Supply Chain Analyst', 'Industrial Engineer', 'Optimization Engineer', 'Data Scientist', 'Logistics Engineer'],
  simulation: ['Simulation Engineer', 'Industrial Engineer', 'Operations Research Analyst', 'Manufacturing Systems Engineer', 'Digital Twin Engineer'],
  datasci: ['Data Analyst', 'Data Scientist', 'Machine Learning Engineer', 'Business Intelligence Analyst', 'Manufacturing Data Analyst', 'Yield Engineer'],
  manufacturing: ['Manufacturing Engineer', 'Production Planner', 'Process Engineer', 'Industrial Engineer', 'Production Supervisor', 'Quality Engineer'],
  lean: ['Continuous Improvement Engineer', 'Lean Manufacturing Engineer', 'Industrial Engineer', 'Operational Excellence Manager', 'Production Supervisor'],
  semiconductor: ['Process Engineer (Semiconductor)', 'Equipment Engineer', 'Yield Engineer', 'Process Integration Engineer', 'Metrology Engineer', 'Fab Industrial Engineer'],
  automation: ['Controls Engineer', 'Automation Engineer', 'Manufacturing Engineer', 'Mechanical Design Engineer', 'Robotics Engineer', 'CNC Programmer'],
  systems: ['Systems Engineer', 'Requirements Engineer', 'Verification & Validation Engineer', 'Integration Engineer', 'Systems Safety Engineer'],
  safety: ['Systems Safety Engineer', 'EHS Engineer', 'Process Safety Engineer', 'Functional Safety Engineer', 'Safety Specialist', 'Reliability Engineer'],
  reliability: ['Reliability Engineer', 'Maintenance Engineer', 'Asset Integrity Engineer', 'Quality Engineer', 'Field Reliability Engineer'],
  pm: ['Project Engineer', 'Project Manager', 'Program Manager', 'Project Controls Specialist', 'Construction Project Engineer'],
  scm: ['Supply Chain Analyst', 'Demand Planner', 'Procurement Specialist', 'Inventory Analyst', 'Logistics Analyst', 'Materials Manager'],
  engecon: ['Cost Engineer', 'Industrial Engineer', 'Financial Analyst', 'Project Engineer', 'Capital Planning Analyst'],
  work: ['Industrial Engineer', 'Methods Engineer', 'Labor Standards Engineer', 'Continuous Improvement Engineer'],
  ergo: ['Human Factors Engineer', 'Ergonomist', 'EHS Engineer', 'UX Researcher', 'Industrial Engineer'],
  facilities: ['Facilities Planning Engineer', 'Industrial Engineer', 'Material Handling Engineer', 'Warehouse Design Engineer', 'Logistics Engineer'],
  service: ['Operations Engineer', 'Healthcare Systems Engineer', 'Operations Analyst', 'Process Improvement Specialist', 'Data Center Operations Engineer'],
  sustain: ['Sustainability Engineer', 'EHS Engineer', 'Energy Engineer', 'Environmental Compliance Specialist'],
  career: ['Industrial Engineer', 'Manufacturing Engineer', 'Quality Engineer', 'Operations Engineer', 'Supply Chain Analyst'],
}

export const SUB_ROLES: Record<string, string[]> = {
  'quality/Measurement systems': ['Metrology Engineer', 'Quality Lab Engineer'],
  'quality/Quality systems': ['Quality Systems Engineer', 'Quality Auditor', 'Regulatory Compliance Specialist'],
  'quality/Six Sigma & DMAIC': ['Six Sigma Black Belt', 'Process Improvement Manager'],
  'or/Inventory models': ['Inventory Analyst', 'Demand Planner'],
  'or/Networks & routing': ['Transportation Analyst', 'Logistics Engineer'],
  'or/Queueing': ['Capacity Planning Analyst', 'Healthcare Operations Analyst'],
  'or/Solvers & software': ['Optimization Engineer', 'Operations Research Scientist'],
  'datasci/Forecasting': ['Demand Planner', 'Forecast Analyst'],
  'datasci/Data tools': ['Business Intelligence Analyst', 'Analytics Engineer'],
  'manufacturing/Production planning': ['Production Planner', 'Master Scheduler', 'Materials Planner'],
  'manufacturing/Scheduling': ['Production Scheduler', 'Master Scheduler'],
  'manufacturing/Metrology & GD&T': ['Metrology Engineer', 'Mechanical Design Engineer'],
  'semiconductor/Wafer & cleanroom': ['Contamination Control Engineer', 'Cleanroom Facilities Engineer'],
  'semiconductor/Lithography': ['Lithography Process Engineer', 'Photolithography Equipment Engineer'],
  'semiconductor/Etching': ['Etch Process Engineer', 'Plasma Etch Equipment Engineer'],
  'semiconductor/Deposition': ['Thin Film Process Engineer', 'CVD/ALD Process Engineer'],
  'semiconductor/Doping & thermal': ['Diffusion and Implant Process Engineer'],
  'semiconductor/Planarization & interconnect': ['CMP Process Engineer', 'Process Integration Engineer'],
  'semiconductor/Metrology, yield & test': ['Yield Engineer', 'Product Test Engineer', 'Failure Analysis Engineer'],
  'semiconductor/Fab operations': ['Fab Industrial Engineer', 'Manufacturing Operations Engineer', 'Capacity Planning Engineer'],
  'automation/CAD & SolidWorks': ['Mechanical Design Engineer', 'CAD Designer', 'Tooling Engineer'],
  'automation/CAM & CNC': ['CNC Programmer', 'CAM Programmer'],
  'automation/PLC & controls': ['Controls Engineer', 'PLC Programmer', 'Automation Technician'],
  'automation/Industry 4.0': ['Smart Manufacturing Engineer', 'MES Engineer', 'IIoT Engineer'],
  'systems/Requirements': ['Requirements Engineer'],
  'systems/Architecture & MBSE': ['MBSE Engineer', 'Systems Architect'],
  'systems/Verification & validation': ['Test Engineer', 'Verification & Validation Engineer'],
  'safety/Occupational safety': ['EHS Specialist', 'Safety Manager', 'Industrial Hygienist'],
  'safety/Standards & regulation': ['Compliance Engineer', 'Functional Safety Engineer'],
  'safety/Root cause analysis': ['Quality Engineer', 'Incident Investigator'],
  'reliability/Maintenance strategy': ['Maintenance Planner', 'Maintenance Manager'],
  'pm/Agile': ['Scrum Master', 'Agile Project Manager'],
  'pm/Cost & earned value': ['Project Controls Engineer', 'Cost Engineer'],
  'scm/Sourcing & procurement': ['Buyer', 'Strategic Sourcing Analyst', 'Category Manager'],
  'scm/Warehousing': ['Warehouse Operations Manager', 'Distribution Center Engineer'],
  'scm/Transportation & logistics': ['Transportation Analyst', 'Logistics Coordinator'],
  'scm/Inventory': ['Inventory Analyst', 'Inventory Control Manager'],
  'service/Healthcare': ['Healthcare Systems Engineer', 'Hospital Management Engineer'],
  'service/Critical facilities': ['Data Center Operations Engineer', 'Critical Facilities Engineer'],
  'ergo/Cognitive ergonomics': ['UX Researcher', 'Human Factors Engineer'],
}

/** Job titles that have a full guided path inside the app. */
export const TITLE_PATH: Record<string, string> = {
  'Industrial Engineer': 'industrial-engineer', 'Manufacturing Engineer': 'manufacturing-engineer',
  'Process Engineer (Semiconductor)': 'process-engineer-semi', 'Quality Engineer': 'quality-engineer',
  'Continuous Improvement Engineer': 'ci-engineer', 'Lean Manufacturing Engineer': 'ci-engineer', 'Operations Engineer': 'operations-engineer',
  'Operations Analyst': 'operations-engineer', 'Production Planner': 'production-planner', 'Production Scheduler': 'production-planner',
  'Reliability Engineer': 'reliability-engineer', 'Maintenance Engineer': 'reliability-engineer', 'Systems Safety Engineer': 'systems-safety-engineer',
  'Supply Chain Analyst': 'supply-chain-analyst', 'Operations Research Analyst': 'or-analyst', 'Data Analyst': 'data-analyst',
  'Project Engineer': 'project-engineer', 'Logistics Engineer': 'logistics-engineer', 'Human Factors Engineer': 'human-factors-engineer',
}

export interface RoleHit { role: RolePath; step: number; of: number }
export interface Jobs { paths: RoleHit[]; titles: string[] }

const uniq = (xs: string[]) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))]

/** Roles that need a concept: guided paths where it is a core step, then job-board titles. */
export function jobsFor(c: ConceptIndex): Jobs {
  const paths = ROLES.filter((r) => r.concepts.includes(c.id)).map((role) => ({ role, step: role.concepts.indexOf(c.id) + 1, of: role.concepts.length }))
  const titles = uniq([...(c.used?.roles || []), ...(SUB_ROLES[`${c.domain}/${c.sub}`] || []), ...DOMAIN_ROLES[c.domain]]).slice(0, 8)
  return { paths, titles }
}

const q = encodeURIComponent
export const jobLinks = (title: string, where = '') => ({
  indeed: `https://www.indeed.com/jobs?q=${q(title)}&l=${q(where)}`,
  linkedin: `https://www.linkedin.com/jobs/search/?keywords=${q(title)}${where ? `&location=${q(where)}` : ''}`,
  google: `https://www.google.com/search?q=${q(`${title} jobs ${where}`.trim())}&ibp=htl;jobs`,
})
/** Postings that mention the skill itself, e.g. "FMEA". */
export const skillJobLinks = (term: string, where = '') => jobLinks(`"${term.replace(/\s*\(.*?\)\s*/g, ' ').trim()}"`, where)
