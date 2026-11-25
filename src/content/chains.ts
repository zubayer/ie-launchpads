// Reaction chains: how elements of the Periodic Table combine in real projects.
// Each step names a concept, what it does in this chain, and what it hands to the next step.

export interface ChainStep { phase: string; id: string; does: string; hands: string }
export interface Chain { id: string; name: string; answer: string; steps: ChainStep[] }

export const CHAINS: Chain[] = [
  {
    id: 'dmaic', name: 'DMAIC quality project',
    answer: 'I’d scope it with a SIPOC, Pareto the defects to pick one target, prove the gauge with a Gage R&R before trusting a Cpk baseline, list causes on a fishbone, test the top factors in a factorial DOE, and hold the gain with a control chart.',
    steps: [
      { phase: 'Define', id: 'quality.sipoc', does: 'Scope the process from supplier to customer so the team agrees what is in and out.', hands: 'A bounded process and the outputs customers care about' },
      { phase: 'Define', id: 'quality.pareto', does: 'Rank defect types by cost or count to find the vital few.', hands: 'The one defect worth attacking first' },
      { phase: 'Measure', id: 'quality.gage-rr', does: 'Check that the measurement system can tell good parts from bad before trusting any data.', hands: 'Data you can trust' },
      { phase: 'Measure', id: 'quality.cpk', does: 'Baseline how well today’s process fits inside its spec limits.', hands: 'A capability number to beat' },
      { phase: 'Analyze', id: 'quality.fishbone', does: 'List candidate causes across people, machines, methods, materials, measurement and environment.', hands: 'A short list of causes to test' },
      { phase: 'Improve', id: 'doe.full-factorial', does: 'Test the top factors together, interactions included, to find settings that work.', hands: 'New process settings, with evidence' },
      { phase: 'Control', id: 'quality.control-chart', does: 'Watch the improved process so a drift is caught before it makes scrap.', hands: 'Proof that the gain is holding' },
    ],
  },
  {
    id: 'lean-flow', name: 'Lean flow',
    answer: 'I’d map the value stream to see where lead time hides, set the pace with takt, use Little’s law to show that cutting WIP cuts lead time, cap WIP with kanban, make small batches affordable with SMED, and track what’s left with OEE on the constraint.',
    steps: [
      { phase: 'See', id: 'lean.vsm', does: 'Map material and information flow; find where lead time and inventory pile up.', hands: 'A current-state map with the biggest delays marked' },
      { phase: 'Pace', id: 'lean.takt-time', does: 'Set the production pace from customer demand.', hands: 'The pace each station must match' },
      { phase: 'Explain', id: 'lean.littles-law', does: 'Lead time = WIP ÷ throughput, so cutting WIP shortens lead time.', hands: 'A WIP target' },
      { phase: 'Pull', id: 'lean.kanban', does: 'Replace pushing to a schedule with pull signals that cap WIP.', hands: 'Steady, limited WIP' },
      { phase: 'Shrink', id: 'lean.smed', does: 'Cut changeover time so small batches are affordable.', hands: 'Smaller batches without lost capacity' },
      { phase: 'Sustain', id: 'lean.oee', does: 'Measure the availability, speed and quality losses left on the constraint.', hands: 'The next loss to attack' },
    ],
  },
  {
    id: 'safety-case', name: 'Safety case',
    answer: 'I’d run a HAZOP to find deviations, an FMEA to rank component and step failures, a fault tree to quantify the worst top event, show threats, barriers and consequences on a bow-tie, and use LOPA to check the protection layers meet the tolerable frequency.',
    steps: [
      { phase: 'Identify', id: 'safety.hazop', does: 'Apply guide words such as more, less, no and reverse to each process node to find deviations.', hands: 'A list of hazardous scenarios' },
      { phase: 'Rank', id: 'safety.fmea', does: 'Rate each failure mode’s severity, occurrence and detection; act on the highest priority.', hands: 'Prioritised failure modes and actions' },
      { phase: 'Quantify', id: 'safety.fta', does: 'Work back from the top event through AND/OR gates to the basic failures, and compute its probability.', hands: 'Top-event probability and its main contributors' },
      { phase: 'Communicate', id: 'safety.bowtie', does: 'Show threats, preventive barriers, the top event, mitigating barriers and consequences on one page.', hands: 'A barrier picture everyone understands' },
      { phase: 'Verify', id: 'safety.lopa', does: 'Check that independent protection layers bring the scenario frequency below the tolerable target.', hands: 'A decision: enough protection, or add a layer' },
    ],
  },
  {
    id: 'inventory', name: 'Inventory policy',
    answer: 'I’d ABC-classify items to focus on the high-value ones, size orders with EOQ, set safety stock for the target service level, trigger orders at the reorder point, and share demand data upstream to damp the bullwhip effect.',
    steps: [
      { phase: 'Focus', id: 'scm.abc', does: 'Rank items by annual value and control A items most tightly.', hands: 'Which items get careful policies' },
      { phase: 'Size', id: 'or.eoq', does: 'Pick the order quantity that balances ordering cost against holding cost.', hands: 'An order quantity' },
      { phase: 'Buffer', id: 'scm.safety-stock', does: 'Cover demand variability during lead time for the chosen service level.', hands: 'A buffer in units' },
      { phase: 'Trigger', id: 'scm.reorder-point', does: 'Reorder when stock falls to lead-time demand plus safety stock.', hands: 'When to order' },
      { phase: 'Stabilise', id: 'scm.bullwhip', does: 'Check how order swings grow upstream; share real demand to damp them.', hands: 'Calmer orders across the chain' },
    ],
  },
]
