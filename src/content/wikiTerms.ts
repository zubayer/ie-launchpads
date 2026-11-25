// Important names, organizations, standards and tools that appear in lesson text but are not
// concept cards themselves. Each one is linked straight to its Wikipedia article, and its hover
// card fetches the live summary plus a permalink to the exact revision.
// Keys with a capital letter match case-sensitively; all-lowercase keys match any case.
export const WIKI_TERMS: Record<string, string> = {
  // Pioneers
  Deming: 'W. Edwards Deming', Shewhart: 'Walter A. Shewhart', Juran: 'Joseph M. Juran', 'Kaoru Ishikawa': 'Kaoru Ishikawa',
  'Taiichi Ohno': 'Taiichi Ohno', Ohno: 'Taiichi Ohno', 'Shigeo Shingo': 'Shigeo Shingo', Shingo: 'Shigeo Shingo',
  Goldratt: 'Eliyahu M. Goldratt', Gilbreth: 'Frank Bunker Gilbreth Sr.', Gilbreths: 'Frank Bunker Gilbreth Sr.', Dantzig: 'George Dantzig',
  'Frederick Taylor': 'Frederick Winslow Taylor', 'Taylor’s equation': 'Tool wear', "Taylor's equation": 'Tool wear',
  'Henry Ford': 'Henry Ford', 'Fisher relation': 'Fisher equation', 'Deal-Grove': 'Deal–Grove model', 'Bosch process': 'Deep reactive-ion etching',
  Bayes: "Bayes' theorem",
  // Companies
  Toyota: 'Toyota', Motorola: 'Motorola', NASA: 'NASA', ASML: 'ASML Holding', 'Applied Materials': 'Applied Materials',
  'Lam Research': 'Lam Research', KLA: 'KLA Corporation', 'Tokyo Electron': 'Tokyo Electron', TSMC: 'TSMC', Intel: 'Intel',
  Samsung: 'Samsung Electronics', Micron: 'Micron Technology', NVIDIA: 'Nvidia', Nvidia: 'Nvidia', Rockwell: 'Rockwell Automation',
  'Allen-Bradley': 'Allen-Bradley', Siemens: 'Siemens', FANUC: 'FANUC', Fanuc: 'FANUC', ABB: 'ABB', KUKA: 'KUKA',
  'Universal Robots': 'Universal Robots', Omron: 'Omron', Haas: 'Haas Automation', Amazon: 'Amazon (company)', Walmart: 'Walmart',
  Dell: 'Dell', Zara: 'Zara (retailer)', 'Manhattan Associates': 'Manhattan Associates', 'Blue Yonder': 'Blue Yonder', Kinaxis: 'Kinaxis',
  Infor: 'Infor', Epicor: 'Epicor', 'Microsoft Dynamics': 'Microsoft Dynamics',
  // Agencies, societies and standards
  OSHA: 'Occupational Safety and Health Administration', NIOSH: 'National Institute for Occupational Safety and Health',
  ANSI: 'American National Standards Institute', IEC: 'International Electrotechnical Commission', 'IEC 61508': 'IEC 61508',
  'IEC 61511': 'IEC 61511', 'IATF 16949': 'IATF 16949', AS9100: 'AS9100', 'ISO 13485': 'ISO 13485', 'ISO 45001': 'ISO 45001',
  'ISO 31000': 'ISO 31000', AIAG: 'Automotive Industry Action Group', VDA: 'Verband der Automobilindustrie', ASQ: 'American Society for Quality',
  IISE: 'Institute of Industrial and Systems Engineers', PMI: 'Project Management Institute', PMBOK: 'Project Management Body of Knowledge',
  ASCM: 'Association for Supply Chain Management', APICS: 'Association for Supply Chain Management', INCOSE: 'International Council on Systems Engineering',
  EPA: 'United States Environmental Protection Agency', FDA: 'Food and Drug Administration', FHWA: 'Federal Highway Administration',
  NTSB: 'National Transportation Safety Board', NHTSA: 'National Highway Traffic Safety Administration', 'MIL-STD-882': 'MIL-STD-882',
  'MIL-STD-1629': 'Failure mode, effects, and criticality analysis', SEMI: 'SEMI', NCEES: 'National Council of Examiners for Engineering and Surveying',
  // Software and tools
  Minitab: 'Minitab', JMP: 'JMP (statistical software)', Excel: 'Microsoft Excel', Python: 'Python (programming language)',
  MATLAB: 'MATLAB', Simulink: 'Simulink', Tableau: 'Tableau Software', 'Power BI': 'Microsoft Power BI', 'scikit-learn': 'Scikit-learn',
  Jupyter: 'Project Jupyter', NumPy: 'NumPy', TensorFlow: 'TensorFlow', PyTorch: 'PyTorch', CPLEX: 'CPLEX', Pyomo: 'Pyomo', AMPL: 'AMPL',
  GAMS: 'General algebraic modeling system', Arena: 'Arena (software)', FlexSim: 'FlexSim', AnyLogic: 'AnyLogic', SimPy: 'SimPy',
  'Plant Simulation': 'Plant Simulation', SAP: 'SAP', 'S/4HANA': 'SAP S/4HANA', Oracle: 'Oracle Corporation', NetSuite: 'NetSuite',
  AutoCAD: 'AutoCAD', CATIA: 'CATIA', 'Siemens NX': 'Siemens NX', 'Fusion 360': 'Fusion 360', Creo: 'PTC Creo', 'Autodesk Inventor': 'Autodesk Inventor',
  ANSYS: 'Ansys', Ansys: 'Ansys', Abaqus: 'Abaqus', Mastercam: 'Mastercam', Primavera: 'Primavera (software)', 'Microsoft Project': 'Microsoft Project',
  'MS Project': 'Microsoft Project', Jira: 'Jira (software)', Smartsheet: 'Smartsheet', Visio: 'Microsoft Visio', Lucidchart: 'Lucidchart',
  DOORS: 'Rational DOORS', Spotfire: 'Spotfire', RSLogix: 'RSLogix', 'TIA Portal': 'Totally Integrated Automation', Modbus: 'Modbus',
  'EtherNet/IP': 'EtherNet/IP', PROFINET: 'PROFINET', MQTT: 'MQTT', Git: 'Git', GitHub: 'GitHub',
  // Fab vocabulary
  silicon: 'Silicon', transistor: 'Transistor', transistors: 'Transistor', MOSFET: 'MOSFET', CMOS: 'CMOS', FinFET: 'Fin field-effect transistor',
  'gate-all-around': 'Multigate device', HBM: 'High Bandwidth Memory', DRAM: 'Dynamic random-access memory', NAND: 'Flash memory',
  reticle: 'Photomask', photomask: 'Photomask', stepper: 'Stepper', plasma: 'Plasma (physics)', 'silicon dioxide': 'Silicon dioxide',
  'silicon nitride': 'Silicon nitride', polysilicon: 'Polycrystalline silicon', TSVs: 'Through-silicon via', TSV: 'Through-silicon via',
  interposer: 'Interposer', 'hybrid bonding': 'Hybrid bonding', IIoT: 'Industrial internet of things', 'Moore’s law': "Moore's law", "Moore's law": "Moore's law",
}

/** Bare words that should open an existing concept card rather than Wikipedia. */
export const CONCEPT_ALIAS: Record<string, string> = {
  'Monte Carlo': 'simulation.monte-carlo', Poisson: 'stats.poisson', Weibull: 'reliability.weibull', Pareto: 'quality.pareto',
}

/** Article URL for a Wikipedia title (stable even before the live summary loads). */
export const wikiUrl = (title: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`
