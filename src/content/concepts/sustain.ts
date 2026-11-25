import { mk } from '../helpers'

export default mk('sustain', [
  {
    id: 'lca', term: 'LCA', full: 'Life cycle assessment', sub: 'Assessment', level: 2, aka: ['life cycle assessment', 'cradle to grave', 'cradle to gate', 'ISO 14040', 'ISO 14044', 'functional unit'],
    one: 'Measuring a product’s environmental impact across its whole life, from raw materials to disposal.',
    def: 'ISO 14040/14044 phases: goal and scope (functional unit, system boundary: cradle-to-gate, cradle-to-grave, cradle-to-cradle), life cycle inventory (inputs and emissions), impact assessment (climate change, water, toxicity…), and interpretation. Results depend heavily on scope and data quality.',
    analogy: 'A nutrition label for a product’s whole life story.',
    used: { ind: ['Consumer products', 'Automotive', 'Packaging', 'Electronics'], tools: ['SimaPro', 'GaBi/Sphera', 'openLCA'], freq: 'niche' },
    rel: ['scopes', 'eco-design', 'circular-economy'],
  },
  {
    id: 'scopes', term: 'Scope 1, 2 & 3 emissions', sub: 'Assessment', level: 1, aka: ['GHG Protocol', 'carbon footprint', 'Scope 3', 'CO2e', 'carbon accounting'],
    one: 'The three categories of greenhouse-gas emissions a company reports.',
    def: 'Under the GHG Protocol: Scope 1 — direct emissions from owned sources (boilers, vehicles, process gases); Scope 2 — indirect emissions from purchased electricity, steam, heating and cooling; Scope 3 — all other value-chain emissions (purchased goods, transport, use of sold products, end of life), usually the largest. Reported in tonnes of CO₂-equivalent.',
    analogy: 'Your own car’s exhaust (1), the power plant that charges your phone (2), and everything that went into the food you bought (3).',
    example: {
      q: 'A plant uses 5,000 MWh of grid electricity per year at 0.4 t CO₂e/MWh. What are its Scope 2 emissions?',
      steps: ['5,000 × 0.4 = 2,000 t CO₂e.'],
      a: '2,000 tonnes CO₂e per year (location-based).',
      check: { value: 2000, compute: () => 5000 * 0.4 },
    },
    rel: ['lca', 'energy-efficiency', 'esg'],
  },
  {
    id: 'iso14001', term: 'ISO 14001', sub: 'Practice', level: 1, aka: ['EMS', 'environmental management system'],
    one: 'The international standard for environmental management systems.',
    def: 'Requires identifying environmental aspects and impacts, compliance obligations, objectives, operational controls, emergency preparedness, monitoring and continual improvement in a Plan-Do-Check-Act cycle, using the same structure as ISO 9001 and ISO 45001.',
    analogy: 'ISO 9001’s green sibling.',
    rel: ['quality.iso9001', 'safety.iso45001'],
  },
  {
    id: 'energy-efficiency', term: 'Industrial energy efficiency', sub: 'Practice', level: 2, aka: ['energy audit', 'compressed air leaks', 'ISO 50001', 'motor efficiency', 'demand charges', 'DOE IAC'],
    one: 'Cutting energy per unit produced through audits, better equipment and operating practices.',
    def: 'Common opportunities: compressed-air leaks and pressure reduction, VFDs on pumps and fans, efficient motors and lighting, heat recovery, insulation, boiler tuning, and scheduling to avoid demand peaks. ISO 50001 is the energy management system standard. U.S. DOE Industrial Assessment Centers (often at universities) provide no-cost audits to small and medium manufacturers.',
    analogy: 'Fixing the dripping faucets and turning off lights in empty rooms — at factory scale.',
    example: {
      q: 'Compressed-air leaks waste 40 kW for 6,000 hours a year at $0.10/kWh. Annual cost of the leaks?',
      steps: ['40 × 6,000 = 240,000 kWh.', '× $0.10 = $24,000.'],
      a: '$24,000 per year.',
      check: { value: 24000, compute: () => 40 * 6000 * 0.1, tol: 1e-6 },
    },
    rel: ['automation.vfd', 'scopes', 'service.pue'],
  },
  {
    id: 'circular-economy', term: 'Circular economy', sub: 'Practice', level: 2, aka: ['reduce reuse recycle', 'remanufacturing', 'closed loop', 'design for disassembly', 'cradle to cradle'],
    one: 'Keeping products and materials in use as long as possible instead of “take, make, dispose”.',
    def: 'Strategies in rough order of value retained: reduce, reuse, repair, refurbish, remanufacture, recycle, recover energy. Enabled by design for disassembly, modularity, product-as-a-service models and reverse logistics.',
    analogy: 'Passing down a well-made coat through three siblings instead of buying three cheap ones.',
    rel: ['eco-design', 'scm.reverse-logistics', 'lca'],
  },
  {
    id: 'eco-design', term: 'Eco-design', sub: 'Practice', level: 2, aka: ['design for environment', 'DfE', 'lightweighting', 'material substitution'],
    one: 'Designing products to cut environmental impact across their life.',
    def: 'Use LCA early; reduce material and mass (lightweighting), choose lower-impact or recycled materials, reduce energy in use, avoid hazardous substances (RoHS, REACH), and design for durability, repair and disassembly.',
    analogy: 'Writing the recipe so it uses less, wastes nothing and the leftovers make tomorrow’s lunch.',
    rel: ['lca', 'circular-economy', 'automation.dfm'],
  },
  {
    id: 'green-manufacturing', term: 'Green manufacturing & lean–green', sub: 'Practice', level: 1, aka: ['sustainable manufacturing', 'lean and green', 'waste minimization', 'zero waste to landfill'],
    one: 'Producing with less energy, water, material waste and emissions — often using lean tools.',
    def: 'Lean wastes have environmental twins: overproduction and defects waste materials and energy; transport burns fuel; inventory spoils. Treasure hunts, energy VSMs, water balance studies and zero-waste-to-landfill programs combine cost savings with sustainability.',
    analogy: 'Lean’s “eight wastes” with a carbon footprint attached.',
    rel: ['lean.eight-wastes', 'energy-efficiency'],
  },
  {
    id: 'esg', term: 'ESG reporting', sub: 'Assessment', level: 2, aka: ['ESG', 'sustainability report', 'CSRD', 'SBTi', 'science-based targets', 'net zero'],
    one: 'How companies report environmental, social and governance performance to investors and regulators.',
    def: 'Frameworks and rules include the GHG Protocol, ISSB/IFRS S1–S2, the EU Corporate Sustainability Reporting Directive (CSRD) and Science Based Targets initiative (SBTi) for emissions targets. Requirements and timelines continue to change, so verify current rules.',
    analogy: 'An annual report card on how the company treats the planet, people and its own rulebook.',
    rel: ['scopes'],
    verify: true,
  },
])
