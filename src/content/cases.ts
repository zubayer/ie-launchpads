import type { CaseInterview } from '../types'

export const CASES: CaseInterview[] = [
  {
    id: 'throughput-drop', title: 'Line output dropped 18%', prompt: 'A packaging line that normally ships 12,000 units per shift has averaged 9,800 for the past two weeks. The plant manager asks you to find out why and fix it. How do you approach it?',
    framework: [
      'Clarify: which shifts, products, since exactly when? Did demand or mix change? Is the drop real (counting method unchanged)?',
      'Locate the loss with OEE: is it availability (more downtime), performance (slower or more minor stops) or quality (more rejects)?',
      'Find the bottleneck and what changed around the start date: new material lot, product mix, crew, maintenance, a machine setting.',
      'Pareto downtime and reject codes, then go to the floor to verify — codes are often wrong.',
      'Root cause (5 Whys, is/is-not), quick countermeasure, then permanent fix and control (standard work, PM, SPC).',
    ],
    probes: ['What data would you ask for first?', 'What if OEE components all look normal?', 'How do you know your fix worked?', 'What would you tell the plant manager after day one?'],
    strongAnswer: '“First I’d confirm the drop and when it started, then split OEE by shift for before and after. Suppose availability is flat but performance fell from 88% to 72%: that points to minor stops or speed. I’d watch the bottleneck filler for a few hours — if I see frequent jams starting with a new film supplier, I’d check film specs against the old lot, run a short trial with the old film, and if confirmed, work with purchasing and the supplier on the spec while adjusting settings. I’d track OEE daily to confirm recovery and add the film property to incoming inspection.”',
    concepts: ['lean.oee', 'lean.toc', 'quality.pareto', 'lean.five-whys', 'safety.kepner-tregoe', 'quality.control-chart'],
  },
  {
    id: 'scrap-increase', title: 'Scrap rate doubled on a molding cell', prompt: 'Scrap on an injection molding cell went from 2% to 4% over the last month. Material costs are high. What do you do?',
    framework: ['Contain: are bad parts escaping? Sort if needed.', 'Stratify scrap by defect type, cavity, machine, shift, resin lot, mold.', 'Check what changed: mold maintenance, resin supplier, dryer, settings, operators, ambient conditions.', 'Validate the measurement system for the defect (is it visual? consistent?).', 'Test causes with data (hypothesis tests) or a DOE on process settings; implement controls.'],
    probes: ['How would you prioritize defect types?', 'What if the defect appears only in one cavity?', 'How would you design a DOE here?'],
    strongAnswer: '“A Pareto shows 70% of the extra scrap is short shots, mostly from cavity 3 on the second shift. Cavity-specific points to the mold (a blocked vent or gate); shift-specific points to a setting change or dryer practice. I’d check the process monitoring log for injection pressure and melt temperature by shift and inspect cavity 3’s vent. If both contribute, I’d clean and maintain the vent, lock the validated process window in the controller, and add a cavity-pressure alarm.”',
    concepts: ['quality.pareto', 'manufacturing.injection-molding', 'quality.gage-rr', 'stats.hypothesis-test', 'doe.full-factorial', 'quality.control-plan'],
  },
  {
    id: 'late-deliveries', title: 'On-time delivery fell to 78%', prompt: 'Customer on-time delivery has fallen from 95% to 78% in a quarter. Sales blames production; production blames material shortages. How do you find the truth?',
    framework: ['Define on-time precisely (promise date vs request date) and segment late orders by product, customer, plant and cause.', 'Trace a sample of late orders end to end: order entry, planning, material, production, shipping.', 'Quantify each cause; look for systemic issues (unrealistic promise dates, MRP data errors, bottleneck capacity, supplier lead times).', 'Fix the biggest causes; set up a weekly late-order review with clear owners.'],
    probes: ['How would you show both teams the same facts?', 'What if promise dates are set without checking capacity?', 'Which metric would you put on a dashboard?'],
    strongAnswer: '“I’d build one shared dataset of last quarter’s orders with a cause code for each late order, verified by walking a sample through the system. If 45% were promised inside the standard lead time without a capacity check, 30% waited on two purchased components with inflated lead-time variability, and 25% were bottleneck delays, then the actions are: an available-to-promise check in order entry, safety stock and a supplier review for those two parts, and SMED plus overtime at the bottleneck. A weekly review with sales and production keeps it honest.”',
    concepts: ['manufacturing.mps', 'manufacturing.mrp', 'scm.safety-stock', 'lean.toc', 'datasci.sql', 'quality.pareto'],
  },
  {
    id: 'warehouse-staffing', title: 'Staffing a distribution center for peak', prompt: 'A DC expects order volume to rise 60% for six weeks of peak season. How many temporary workers should it hire, and what else should it do?',
    framework: ['Translate volume into workload by process (receive, put away, pick, pack, ship) using labor standards.', 'Divide by productive hours per person and expected productivity for temps (learning curve).', 'Check physical constraints: dock doors, pack stations, conveyor capacity, aisle congestion.', 'Plan training, slotting changes and shifts; build in a buffer for absenteeism.'],
    probes: ['How do you account for new hires being slower?', 'What if pack stations are the constraint, not people?', 'How would you validate the plan?'],
    strongAnswer: '“At 20,000 lines per day today, peak is 32,000. With 100 lines per picker-hour for experienced pickers but about 70 for temps in their first two weeks, I’d model pick labor by week with a learning curve, add pack and ship similarly, and add about 10% for absenteeism. Then I’d check pack-station capacity — if it caps at 28,000 orders per day, I’d add temporary stations or a second shift. I’d also re-slot peak SKUs to the golden zone before peak starts.”',
    concepts: ['work.workforce-planning', 'work.learning-curve', 'scm.slotting', 'scm.picking', 'lean.toc', 'career.estimation'],
  },
  {
    id: 'layout-redesign', title: 'Redesigning a machine shop layout', prompt: 'A job shop with 40 machines arranged by type has long lead times and lots of forklift traffic. Leadership asks whether to reorganize into cells. How do you evaluate it?',
    framework: ['Analyze product mix and routings; look for part families (product–quantity analysis, group technology).', 'Measure current flow with a from-to chart: load × distance, WIP, lead time.', 'Design candidate cells for high-volume families; keep a functional area for low-volume, odd parts.', 'Estimate benefits (travel, WIP, lead time) and costs (moves, duplicate machines, downtime); simulate if variability matters.'],
    probes: ['What if one machine is needed by several cells?', 'How would you phase the move?', 'How would you measure success?'],
    strongAnswer: '“If 60% of volume comes from three part families with similar routings, I’d design cells for those, sized to their takt, and leave a functional area for the rest. The from-to chart would show the travel we eliminate; simulation would confirm lead-time and WIP reductions under real variability. I’d move one cell first as a pilot during a planned shutdown, measure lead time and quality, then roll out.”',
    concepts: ['facilities.layout-types', 'facilities.from-to', 'lean.cellular', 'simulation.des', 'facilities.slp', 'lean.littles-law'],
  },
  {
    id: 'clinic-waits', title: 'Long waits at an urgent care clinic', prompt: 'Patients at an urgent care clinic wait an average of 70 minutes to see a provider, and many leave without being seen. How would you reduce the wait?',
    framework: ['Map the patient journey (arrival, registration, triage, rooming, provider, discharge) and measure time at each step by hour of day.', 'Compare arrivals by hour with provider capacity; compute utilization by hour.', 'Find the bottleneck (often providers at peak hours, sometimes rooms or registration).', 'Options: match staffing to arrival patterns (Erlang C), split flow for simple cases, parallel tasks, online check-in to shape demand.'],
    probes: ['Why does average utilization of 80% still produce long waits?', 'How would you test a change safely?', 'What metrics would you track?'],
    strongAnswer: '“Arrivals peak at 6–8 pm when only two providers work, so utilization then is about 95%, which explains the long queue even though the daily average looks fine. I’d shift a provider from the quiet mid-afternoon to the evening, add a fast-track path for minor complaints handled by a nurse practitioner, and open online check-in to smooth arrivals. A simulation would size the change before piloting it for a month and tracking door-to-provider time and leave-without-being-seen rates.”',
    concepts: ['or.mmc', 'service.erlang-staffing', 'service.patient-flow', 'service.queue-psychology', 'simulation.des', 'service.staffing'],
  },
  {
    id: 'make-or-buy', title: 'Make or buy a component', prompt: 'Your plant makes a machined bracket in-house at $14.20 per unit; a supplier quotes $11.50 delivered. Volume is 40,000 per year. Should you outsource?',
    framework: ['Separate relevant from irrelevant costs: which in-house costs actually go away (variable labor, material, some overhead) vs fixed overhead that stays.', 'Add the supplier’s hidden costs: quality, inspection, inventory, freight, supplier management, risk.', 'Consider strategy: core competency, capacity freed for other work, IP, supply risk.', 'Compute break-even and run sensitivity on volume and quality.'],
    probes: ['What if half of the $14.20 is allocated fixed overhead?', 'What could the freed capacity be used for?', 'How would you protect against supplier risk?'],
    strongAnswer: '“If $4.00 of the $14.20 is fixed overhead that stays regardless, the true avoidable cost is $10.20 — cheaper than the $11.50 quote, so outsourcing would raise total cost by about $52,000 a year unless the freed machine time goes to higher-margin work. I’d quantify that opportunity, add quality and inventory costs to the quote, and only outsource if the freed capacity or a strategic reason justifies it.”',
    concepts: ['scm.make-buy', 'scm.tco', 'engecon.sunk-cost', 'engecon.break-even', 'engecon.sensitivity'],
  },
  {
    id: 'yield-excursion', title: 'Wafer yield excursion', prompt: 'Sort yield on a high-volume product dropped from 92% to 86% starting three days ago. As a fab IE or yield engineer, how do you respond?',
    framework: ['Confirm the signal and scope: all lots or a subset? Which bins? Spatial pattern on wafer maps?', 'Commonality analysis: which tools, chambers, recipes and reticles did the low-yield lots share, and when?', 'Correlate with inline defect and metrology data and maintenance events.', 'Contain (hold suspect tool, route around it), confirm with split lots, fix, and add monitoring.'],
    probes: ['What does an edge-ring pattern suggest?', 'How do you balance holding a tool against fab output?', 'What would you change so this is caught sooner?'],
    strongAnswer: '“Bin maps show an edge-ring failure pattern on about 40% of lots. Commonality analysis shows all affected lots went through etch chamber B after its PM three days ago. I’d inhibit chamber B, route WIP to matched chambers, have equipment engineering check the edge ring and gas distribution, and run split lots to confirm the fix. Then I’d add a post-PM qualification check for edge uniformity and an FDC limit on the parameter that shifted.”',
    concepts: ['semiconductor.yield', 'semiconductor.wafer-sort', 'semiconductor.metrology', 'semiconductor.apc', 'quality.control-chart', 'safety.rca'],
  },
]
