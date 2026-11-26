import type { Citation, Concept, Review } from '../../types'

// V3 enrichment for PLC, ladder logic and CAD lessons. Merged over the base lessons in src/content/index.ts.
// The PLC and CAD studios (src/content/plc, src/content/cad) hold the hands-on material; these overlays
// give each lesson page its objectives, mistakes, interview questions, sources and an honest review status.
// Scenarios are illustrative (not documented events).
const ON = '2026-11-25'
const BY = 'AI-assisted (Claude); not expert-reviewed'
const checked = (note: string): Review => ({ status: 'source-checked', on: ON, by: BY, note })
const identified = (note: string): Review => ({ status: 'source-identified', on: ON, by: BY, note })
const draft = (note: string): Review => ({ status: 'draft', on: ON, by: BY, note })
const ill = (where: string, story: string) => ({ where, story, kind: 'illustrative' as const })

const RA = 'https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/38-01/contents-ditamap/instruction-set'
const RA2 = 'https://www.rockwellautomation.com/en-pr/docs/studio-5000-logix-designer/38-02/contents-ditamap/instruction-set'
const R = (url: string, section: string, supports: string): Citation => ({ src: 'rockwell-logix-instructions', url, section, supports })
const XIC = R(`${RA2}/bit-instructions1/examine-if-closed--xic-1.html`, 'Examine if Closed (XIC)', 'XIC examines a data bit: true when the bit is 1')
const XIO = R(`${RA2}/bit-instructions1/examine-if-open--xio-1.html`, 'Examine If Open (XIO)', 'XIO examines a data bit: true when the bit is 0')
const OTE = R('https://www.rockwellautomation.com/en-ca/docs/studio-5000-logix-designer/38-02/contents-ditamap/instruction-set/bit-instructions1/output-energize--ote-11.html', 'Output Energize (OTE)', 'OTE sets its bit when the rung is true, clears it when false, and clears it on prescan')
const OTL = R('https://www.rockwellautomation.com/en-id/docs/studio-5000-logix-designer/38-01/contents-ditamap/instruction-set/bit-instructions1/output-latch--otl-1.html', 'Output Latch (OTL)', 'OTL sets the bit and leaves it set when the rung goes false, until something such as OTU clears it')
const TON = R(`${RA}/timer-and-counter-instructions/timer-on-delay--ton-.html`, 'Timer On Delay (TON)', 'TON is non-retentive; DN sets when timing completes; a false rung clears ACC, EN, TT and DN')
const TOF = R(`${RA}/timer-and-counter-instructions/timer-off-delay--tof-.html`, 'Timer Off Delay (TOF)', 'TOF times while the rung is false; DN is on while the rung is true and clears when timing completes')
const RTO = R(`${RA2}/timer-and-counter-instructions/retentive-timer-on--rto-.html`, 'Retentive Timer On (RTO)', 'RTO is retentive; RES clears its status bits and ACC')
const CTU = R(`${RA}/timer-and-counter-instructions/count-up--ctu-.html`, 'Count Up (CTU)', 'CTU counts false-to-true transitions and keeps counting past the preset with DN on')
const ONS = R(`${RA2}/bit-instructions1/one-shot--ons-1.html`, 'One Shot (ONS)', 'ONS makes the rest of the rung true once per false-to-true transition')
const ASYNC: Citation = { src: 'rockwell-clx-um900', section: 'Determine When I/O Data Is Updated', supports: 'ControlLogix controllers update I/O data asynchronously with the execution of logic' }
const LANGS: Citation = { src: 'plcopen-61131-3', section: 'IEC 61131-3 languages', supports: 'IEC 61131-3 (edition 3.0, 2013) defines LD, FBD, ST and IL, plus SFC for structuring programs' }
const ISO: Citation = { src: 'iso-13849-1', section: 'Abstract', supports: 'A methodology for designing and integrating safety-related parts of control systems; it does not set the safety functions or required performance levels for an application' }
const SW = 'https://help.solidworks.com'
const S = (url: string, section: string, supports: string): Citation => ({ src: 'solidworks-help', url, section, supports })
const STATUS = S(`${SW}/2023/english/SolidWorks/sldworks/c_Sketch_Status_Conventions.htm`, 'Sketch Status Conventions (2023)', 'Sketches can be under, fully or over defined; a sketch need not be fully defined to make a feature, but should be before the part is complete')
const COLORS = S(`${SW}/2020/english/SolidWorks/sldworks/c_Sketch_Geometry_Status.htm`, 'Sketch Geometry Status (2020)', 'Under-defined entities appear blue and fully defined black; a redundant dimension can be made driven')
const DOF = S(`${SW}/2020/english/SolidWorks/motionstudies/c_degrees_freedom_motion.htm`, 'Degrees of Freedom (2020)', 'A free rigid body has six degrees of freedom and mates remove them; Motion Analysis can count degrees of freedom and redundancies')
const CONC = S(`${SW}/2012/English/SolidWorks/MotionStudies/Degrees_of_Freedom.htm`, 'Degrees of Freedom (2012)', 'A concentric mate removes two translational and two rotational degrees of freedom; a coincident face mate removes the last translation')
const MATES = S(`${SW}/2017/English/SolidWorks/sldworks/c_Mates_Overview_Assemblies.htm`, 'Mates overview (2017)', 'Mates create geometric relationships between components and define their allowable motion')
const SWNOTE = 'Matched against the search engine’s copy of the SOLIDWORKS help pages; the pages themselves render with JavaScript and could not be opened here.'

export const AUTOMATION_V3: Record<string, Partial<Concept>> = {
  'automation.plc': {
    objectives: ['Explain what a PLC does in one scan', 'Name the IEC 61131-3 languages and when ladder is used', 'Structure a machine sequence with steps, transitions and watchdogs'],
    mistakes: ['Thinking a PLC reacts to events instantly rather than once per scan', 'Writing a sequence with latches per step instead of one step number', 'Treating the standard PLC program as the safety system'],
    real: ill('Case packer', 'A packer stops at random. Logging the sequence step and its watchdog shows step 4 (“wait for flap closed”) timing out after a sensor bracket loosened; the fix is a bracket, not new code.'),
    iq: [
      { q: 'What is a PLC and how is it different from a PC?', a: 'An industrial controller built for harsh environments and deterministic, repeated execution: it scans inputs, solves its program and writes outputs every few milliseconds, with I/O modules wired straight to sensors and actuators. It is programmed in IEC 61131-3 languages such as ladder, function block diagram, structured text and SFC.', type: 'screen' },
      { q: 'How would you structure a machine sequence?', a: 'One step number, a transition rung per step (current step plus exit condition, then move to the next step), outputs driven once each from their steps, a watchdog timer per step that latches a fault, and stop/fault handling after the transitions.', type: 'technical' },
    ],
    cites: [LANGS, ASYNC],
    review: checked('Languages matched against PLCopen’s IEC 61131-3 page; asynchronous I/O matched against Rockwell’s ControlLogix user manual.'),
  },
  'automation.scan-cycle': {
    iq: [{ q: 'Why does rung order matter in a PLC program?', a: 'Rungs are solved top to bottom each scan, so a rung sees bits written earlier in the same scan but bits written further down only on the next scan. One-shots, handshakes and sequences depend on that order.', type: 'technical' }],
    objectives: ['Predict one-scan effects of rung order', 'Explain why a false rung still changes its outputs', 'Know when inputs can change mid-scan (asynchronous I/O)'],
    why: 'Almost every “it works sometimes” PLC problem is a scan problem: rung order, a double coil, or a signal shorter than a scan. Knowing the loop lets you read a program the way the controller runs it.',
    mistakes: ['Assuming a bit written on a lower rung is seen by a rung above in the same scan', 'Thinking false rungs are skipped (their OTEs are cleared, TONs reset)', 'Expecting a pulse shorter than the scan to be seen'],
    assumptions: ['The classic model reads inputs once at the start and writes outputs at the end. ControlLogix updates I/O asynchronously, so programs that need one consistent value buffer inputs first.'],
    real: ill('Bottle line', 'A reject gate fires one bottle late. The reject bit is written on rung 40 and read on rung 12, so it arrives a scan late; moving the logic fixes it without touching the hardware.'),
    cites: [OTE, ASYNC],
    review: checked('OTE behaviour on false rungs and prescan, and asynchronous I/O, matched against Rockwell’s pages.'),
  },
  'automation.ladder-logic': {
    objectives: ['Turn AND, OR and NOT conditions into rungs', 'Read a rung back as logic', 'Find the instruction that blocks a rung online'],
    why: 'Ladder is still the most common language on factory controllers because electricians and engineers can read it online, rung by rung, while the machine runs. Reading it is how you find why a line stopped.',
    def: 'Two vertical rails with horizontal rungs, solved left to right and top to bottom every scan. Input instructions test bits: XIC is true when its bit is 1, XIO when it is 0. Instructions in series are AND; a parallel branch is OR. Output instructions (OTE, OTL/OTU, timers, counters, moves) act on the rung condition that reaches them. A ladder diagram describes logic, not wiring: the contact symbols test bits, whatever the field device is.',
    mistakes: ['Putting alternatives in series (AND) instead of a branch (OR)', 'A branch that lets one leg bypass a permissive', 'Writing the same output with OTE on two rungs (double coil)'],
    real: ill('Packaging conveyor', 'A conveyor that won’t restart after a jam: online, every instruction on the run rung is green except XIO(Jam_Alarm). The alarm is latched and needs a reset once the jam is cleared.'),
    iq: [
      { q: 'How do you implement AND and OR in ladder logic?', a: 'AND: contacts in series on one rung, all must be true. OR: contacts in parallel branches, any one true path energizes the output.', type: 'screen' },
      { q: 'A conveyor won’t start. How would you troubleshoot with the PLC online?', a: 'Go online, find the rung that drives the motor output and see which instruction is false (not highlighted). Check that input’s physical device (E-stop chain, guard switch, overload, photo-eye) with the I/O indicator lights and a meter, then work back through interlocks. Check for forced bits and faults before changing logic.', type: 'case' },
    ],
    cites: [XIC, XIO, OTE],
    review: checked('XIC, XIO and OTE behaviour matched against Rockwell’s instruction pages.'),
  },
  'automation.no-nc': {
    objectives: ['Work out an input bit from the device wiring and its state', 'Choose XIC or XIO for an NC-wired stop', 'Explain why stops are wired to fail safe'],
    why: 'Mixing up the device (NO or NC wiring) with the instruction (XIC or XIO) is the most common ladder mistake, and with stop buttons it decides whether a broken wire stops the machine or silently disables the stop.',
    mistakes: ['Using XIO for an NC-wired stop “because it is a stop”', 'Wiring a stop NO, so a broken wire looks like nobody pressing it', 'Naming a tag for the device (Stop) instead of what bit 1 means (Stop_OK)'],
    real: ill('Pump skid', 'A new technician rewires a stop button NO during a repair. It works on test, but months later a loose terminal leaves the pump unstoppable from that station; the review afterwards finds the wiring change.'),
    iq: [{ q: 'Is XIO a normally closed contact?', a: 'It is drawn like one, but it is an instruction that is true when its bit is 0. The device wiring is a separate question: an NC stop button gives bit 1 when not pressed, so the run rung uses XIC for it.', type: 'technical' }],
    cites: [XIC, XIO],
    review: checked('XIC/XIO bit tests matched against Rockwell’s pages. Fail-safe wiring of stops is general practice, not taken from these pages.'),
  },
  'automation.seal-in': {
    objectives: ['Build a stop-dominant seal-in', 'Interlock two outputs', 'Explain why a latch can restart a motor after a restart'],
    why: 'Momentary push buttons need memory to keep a machine running. Where you put that memory (a seal-in or a latch) decides what happens on a stop, a stuck button and a power loss.',
    mistakes: ['Putting the stop inside the seal branch (start-dominant)', 'Using OTL/OTU for a motor, so it comes back on after a restart', 'Forgetting the interlock between forward and reverse'],
    real: ill('Mixer', 'After a power dip the mixer restarts by itself. Its run bit was latched with OTL; replacing it with a seal-in on OTE makes the mixer wait for a new start.'),
    iq: [{ q: 'Seal-in or latch for a motor?', a: 'A seal-in: OTE bits are cleared on prescan, so the motor needs a deliberate new start after a restart. A latched bit keeps its state.', type: 'technical' }],
    cites: [OTE, OTL],
    review: checked('OTE prescan and OTL behaviour matched against Rockwell’s pages.'),
  },
  'automation.plc-timer': {
    iq: [{ q: 'TON, TOF and RTO: what is the difference?', a: 'TON times while its rung is true and resets on any false scan; TOF keeps its done bit on for the preset after its rung goes false; RTO times like TON but keeps its accumulated value until a RES.', type: 'technical' }],
    objectives: ['Choose TON, TOF or RTO for a delay, a run-on or a running total', 'Use EN, TT and DN bits', 'Build a flasher from two timers'],
    why: 'Timers turn rung states into time: debouncing, jam and stall detection, run-on, warm-up and maintenance hours. Picking the wrong one gives alarms that never fire or fans that stop too soon.',
    mistakes: ['Using TON for a total (it resets on every false scan)', 'Using TON for a run-on (it delays the start instead)', 'Sharing one timer tag between two instructions'],
    real: ill('Spindle maintenance', 'A spindle is serviced every 400 running hours. An RTO on the spindle-running bit, reset by the service sign-off, replaces a paper log that kept being forgotten.'),
    cites: [TON, TOF, RTO],
    review: checked('TON, TOF and RTO behaviour matched against Rockwell’s instruction pages.'),
  },
  'automation.plc-counter': {
    iq: [{ q: 'Why does a counter count edges, not scans?', a: 'An input stays on for many scans. CTU counts only the false-to-true transition, so one part counts once; for arithmetic or step changes you add a one-shot (ONS).', type: 'technical' }],
    objectives: ['Count events, not scans', 'Use a one-shot to make any instruction fire once per event', 'Track a buffer with CTU and CTD on one counter'],
    why: 'An input stays on for many scans, so anything that should happen once per part needs an edge. Counters do it for you; arithmetic and step changes need a one-shot.',
    mistakes: ['An ADD on a plain rung, counting scans instead of parts', 'Using EQU on the accumulator instead of the done bit (the counter keeps counting past the preset)', 'Resetting the counter on the same rung that counts'],
    real: ill('Case packer', 'Case counts drift high on one shift. The count uses an ADD on the photo-eye rung; when the line slows, bottles stay in view longer and add several each. A one-shot fixes it.'),
    cites: [CTU, ONS],
    review: checked('CTU and ONS behaviour matched against Rockwell’s instruction pages.'),
  },
  'automation.safety-relay': {
    iq: [{ q: 'Can you implement an E-stop in standard PLC logic?', a: 'Not as the safety function: it must remove hazardous energy through safety-rated devices designed and validated to the performance level the risk assessment requires (for example with ISO 13849-1). The standard program monitors it, drops its own commands and requires a new start after reset.', type: 'technical' }],
    objectives: ['Explain why safety functions are not standard PLC logic', 'Describe what standard logic should do around safety signals', 'Know that a reset must not restart a machine'],
    why: 'An E-stop or guard interlock must work even when the program is wrong or the controller has failed, so it is designed, built and validated as a separate safety function.',
    mistakes: ['Relying on a standard PLC rung as the emergency stop', 'Letting a maintained selector restart a machine after an E-stop reset', 'Bypassing an interlock in logic to keep production running'],
    real: ill('Robot cell', 'A light-curtain fault keeps stopping a cell. The fix is a better-placed curtain from a new risk assessment, not a logic bypass that would leave operators unprotected.'),
    cites: [ISO],
    review: checked('ISO 13849-1 scope matched against ISO’s abstract only; the standard itself is paywalled and was not read.'),
  },
  'automation.solidworks': {
    objectives: ['Describe the sketch → feature → part → assembly → drawing workflow', 'Capture design intent with dimensions, relations and equations', 'Explain how mates remove degrees of freedom'],
    mistakes: ['Leaving sketches under defined in finished parts', 'Dimensioning in chains when parts locate from one datum', 'Locking every assembly component instead of mating how it locates'],
    real: ill('Fixture family', 'A fixture for five part lengths becomes one file: a global variable for the length, equations for the locator positions and a configuration per variant.'),
    cites: [STATUS, MATES],
    review: identified(SWNOTE),
  },
  'automation.parametric': {
    iq: [{ q: 'What does fully defined mean, and why does it matter?', a: 'Every sketch entity is fixed by dimensions and relations, with nothing redundant, so the geometry only changes when a dimension changes. Under-defined sketches shift when related features are edited.', type: 'technical' }],
    objectives: ['Count degrees of freedom in a sketch', 'Recognise a redundant (over-defining) relation', 'Read the feature tree as parent/child dependencies'],
    why: 'A parametric model is only as good as its constraints: fully defined sketches and stable references let one dimension change ripple correctly instead of breaking the model.',
    mistakes: ['Sizing a sketch without locating it', 'Adding a relation that repeats another (over defined)', 'Referencing fillet edges or faces that change easily'],
    real: ill('Bracket revision', 'A bracket’s height changes and its holes jump to the wrong side. The hole sketch was located from a fillet edge; relocating it from the base plane fixes every future change.'),
    cites: [STATUS, COLORS],
    review: identified(SWNOTE),
  },
  'automation.assembly-mates': {
    iq: [{ q: 'How do you mate a part that should rotate on a shaft?', a: 'Concentric between the bore and the shaft (removes four degrees of freedom) plus a coincident or distance mate on a face (removes the slide), leaving one rotation. Check it by dragging or with a motion study.', type: 'technical' }],
    objectives: ['Predict the freedoms left after each mate', 'Build a hinge and a slide on purpose', 'Recognise redundant mates and why they cause trouble'],
    why: 'Mates are how an assembly records how parts locate and move. Getting them right makes motion, clearance and interference checks meaningful.',
    mistakes: ['Locking parts instead of mating them', 'Two concentric pins with no face mate, expecting a fixed part', 'Mating to cosmetic faces that change'],
    real: ill('Gripper design', 'An end-of-arm gripper shows no interference in the assembly, then collides on the robot. The fingers were locked closed; mating them as slides reveals the collision at full open.'),
    cites: [DOF, CONC, MATES],
    review: identified(SWNOTE),
  },
  'automation.drawings': {
    iq: [{ q: 'How do you tell a first-angle drawing from a third-angle one?', a: 'Check the projection symbol in the title block. In third angle the top view sits above the front view; in first angle it sits below.', type: 'screen' }],
    objectives: ['Read orthographic views', 'Tell first-angle from third-angle projection', 'Know what a drawing must state for manufacture and inspection'],
    why: 'The drawing, not the model, is what most shops quote, make and inspect against. Misreading a view or the projection method produces a mirror-image part.',
    mistakes: ['Not checking the projection symbol', 'Dimensioning the same feature twice', 'Tolerances tighter than the function needs'],
    real: ill('Supplier part', 'A first-angle drawing from an overseas supplier is read as third angle; a slot is machined on the wrong side of 200 parts.'),
    review: draft('No source attached yet for projection conventions (ASME Y14.3, ISO 128).'),
  },
  'automation.fea': {
    iq: [{ q: 'How do you know an FEA result is right?', a: 'Compare with a hand calculation, check reactions against the loads, check units and material data, refine the mesh until results converge, and ignore singularities at sharp corners or point loads.', type: 'technical' }],
    objectives: ['Estimate stress and deflection by hand for a cantilever', 'Compute a factor of safety', 'List the checks that make an FEA result trustworthy'],
    why: 'Simulation always produces a plot. A hand calculation tells you whether that plot is plausible before anyone builds the part.',
    mistakes: ['Mixed units', 'Reporting stress at a sharp-corner singularity', 'Skipping mesh convergence'],
    real: ill('Lifting frame', 'FEA shows 900 MPa in a frame; the hand calculation says 45 MPa. The model had loads in newtons and lengths in metres.'),
    review: draft('Beam formulas are standard and recomputed by tests in the CAD studio; no source page is attached yet.'),
  },
  'automation.dfm': {
    iq: [{ q: 'Give three DFM rules for a machined part.', a: 'Use standard hole sizes and radii the shop has tools for, avoid deep narrow pockets and features the tool can’t reach, and set tolerances only as tight as the function needs.', type: 'technical' }],
    objectives: ['Name DFM rules for machining, molding and sheet metal', 'Bring manufacturing into a design review before tooling'],
    why: 'Most of a part’s cost is decided on the drawing. Changing a radius or a wall thickness on screen is cheap; changing a mold is not.',
    mistakes: ['Tolerances tighter than the function needs', 'Deep narrow pockets and non-standard hole sizes in machined parts', 'Uneven walls and no draft in molded parts'],
    review: draft('General DFM practice; no source attached yet.'),
  },
  'automation.dfa': {
    iq: [{ q: 'How would you reduce assembly cost?', a: 'Ask of each part whether it moves, must be a different material, or must be separate for assembly or service; target the theoretical minimum, replace fasteners with snap fits where service allows, and make parts self-locating and one-way.', type: 'case' }],
    objectives: ['Apply the three questions to find a theoretical minimum part count', 'Propose ways to remove fasteners and make parts self-locating'],
    why: 'Every part adds design, purchasing, inventory, handling and assembly cost. Fewer, easier-to-assemble parts usually beat cheaper parts.',
    mistakes: ['Optimising fastener price instead of removing fasteners', 'Treating the theoretical minimum as an order rather than a target for discussion'],
    real: ill('Sensor housing', 'A DFA review cuts a housing from 12 parts to 7 by molding standoffs into the base, printing the label and replacing four screws with snap fits.'),
    review: draft('The three-question method is the Boothroyd–Dewhurst DFA approach; the original texts haven’t been checked here.'),
  },
}
