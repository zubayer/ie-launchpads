// The PLC studio course: nine lessons on ladder logic, run on the teaching engine in src/lib/ladder.ts.
// Every program here is checked by src/lib/plc.test.ts: examples must behave exactly as their scenario says,
// each mistake's wrong program must fail its scenario and the fix must pass, practice solutions must pass,
// and starter programs must fail. Instruction behaviour follows the Rockwell (Allen-Bradley) Logix pages cited
// per lesson; other platforms (Siemens, Omron, CODESYS) use different names for the same ideas.
import type { Citation } from '../../types'
import { pulses, type Device, type Op, type Step } from '../../lib/ladder'

export interface PlcExample { id: string; title: string; question: string; program: string; devices: Device[]; script: Step[]; show: string[]; explain: string[]; takeaway: string }
export interface PlcMistake { id: string; title: string; wrong: string; fix: string; devices: Device[]; wrongDevices?: Device[]; script: Step[]; show: string[]; why: string }
export interface PlcTask { id: string; task: string; hint: string; solution: string; devices: Device[]; script: Step[]; show: string[]; starter?: string; forbid?: Op[] }
export interface PlcCheck { id: string; q: string; options: string[]; answer: number; why: string }
/** Run `setup` to reach a state, then ask which instruction on rung `rung` stops the power. */
export interface PlcPuzzle { id: string; story: string; program: string; devices: Device[]; setup: Step[]; rung: number }
export interface PlcLesson {
  id: string
  concept: string
  title: string
  level: 'Foundation' | 'Core' | 'Applied'
  minutes: number
  goal: string
  intuition: string
  analogy: string
  model: string[]
  syntax: string
  examples: PlcExample[]
  mistakes: PlcMistake[]
  tasks: PlcTask[]
  checks: PlcCheck[]
  puzzles?: PlcPuzzle[]
  interview: { q: string; a: string }[]
  onTheJob: string
  safety?: string
  cites: Citation[]
}

const push = (tag: string, label: string, wiring?: 'NO' | 'NC'): Device => ({ tag, label, kind: 'push', wiring })
const toggle = (tag: string, label: string, wiring?: 'NO' | 'NC'): Device => ({ tag, label, kind: 'toggle', wiring })
const START = push('Start_PB', 'Start (NO)')
const STOP = push('Stop_PB', 'Stop (NC)', 'NC')

const RA = 'https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/38-01/contents-ditamap/instruction-set'
const RA2 = 'https://www.rockwellautomation.com/en-pr/docs/studio-5000-logix-designer/38-02/contents-ditamap/instruction-set'
const C = {
  ote: { src: 'rockwell-logix-instructions', url: 'https://www.rockwellautomation.com/en-ca/docs/studio-5000-logix-designer/38-02/contents-ditamap/instruction-set/bit-instructions1/output-energize--ote-11.html', section: 'Output Energize (OTE): Execution', supports: 'OTE sets the bit when the rung is true and clears it when the rung is false; prescan clears it' },
  xic: { src: 'rockwell-logix-instructions', url: `${RA2}/bit-instructions1/examine-if-closed--xic-1.html`, section: 'Examine if Closed (XIC)', supports: 'XIC examines a data bit: rung-condition-out is true when the bit is true' },
  xio: { src: 'rockwell-logix-instructions', url: `${RA2}/bit-instructions1/examine-if-open--xio-1.html`, section: 'Examine If Open (XIO)', supports: 'XIO examines a data bit: rung-condition-out is true when the bit is false' },
  otl: { src: 'rockwell-logix-instructions', url: 'https://www.rockwellautomation.com/en-id/docs/studio-5000-logix-designer/38-01/contents-ditamap/instruction-set/bit-instructions1/output-latch--otl-1.html', section: 'Output Latch (OTL)', supports: 'OTL sets the bit when the rung is true and leaves it unchanged when the rung goes false, until an OTU clears it' },
  ons: { src: 'rockwell-logix-instructions', url: `${RA2}/bit-instructions1/one-shot--ons-1.html`, section: 'One Shot (ONS)', supports: 'ONS makes the rest of the rung true each time rung-condition-in goes from false to true; the storage bit holds the last rung condition' },
  ton: { src: 'rockwell-logix-instructions', url: `${RA}/timer-and-counter-instructions/timer-on-delay--ton-.html`, section: 'Timer On Delay (TON)', supports: 'TON is non-retentive: it accumulates while enabled, sets DN when done, and clears ACC, EN, TT and DN when the rung goes false; PRE and ACC are in milliseconds' },
  tof: { src: 'rockwell-logix-instructions', url: `${RA}/timer-and-counter-instructions/timer-off-delay--tof-.html`, section: 'Timer Off Delay (TOF)', supports: 'TOF accumulates while the rung is false; DN is on while the rung is true and clears when timing completes' },
  rto: { src: 'rockwell-logix-instructions', url: `${RA2}/timer-and-counter-instructions/retentive-timer-on--rto-.html`, section: 'Retentive Timer On (RTO)', supports: 'RTO is a retentive timer; RES clears its status bits and ACC' },
  ctu: { src: 'rockwell-logix-instructions', url: `${RA}/timer-and-counter-instructions/count-up--ctu-.html`, section: 'Count Up (CTU)', supports: 'CTU counts each false-to-true transition, keeps counting past the preset with DN on, and prescan sets CU to prevent a false count' },
  async: { src: 'rockwell-clx-um900', section: 'Determine When I/O Data Is Updated', supports: 'ControlLogix controllers update I/O data asynchronously with the execution of logic; safety input tags are frozen at the start of the safety task' },
  langs: { src: 'plcopen-61131-3', section: 'IEC 61131-3 languages', supports: 'IEC 61131-3 defines Ladder Diagram and Function Block Diagram (graphical), Structured Text and Instruction List (textual), and Sequential Function Chart for structuring programs' },
  iso: { src: 'iso-13849-1', section: 'Abstract', supports: 'ISO 13849-1 gives a methodology for designing safety-related parts of control systems that perform safety functions; it does not set the safety functions or required performance levels for a given application' },
} satisfies Record<string, Citation>

export const PLC_LESSONS: PlcLesson[] = [
  {
    id: 'scan', concept: 'automation.scan-cycle', title: 'How a PLC runs: the scan', level: 'Foundation', minutes: 15,
    goal: 'Predict what the controller does on each scan, and why rung order and false rungs matter.',
    intuition: 'A PLC doesn’t wait for events. It runs the same loop over and over, many times a second: look at the inputs, work through the program from the top, update the outputs. Everything strange about ladder logic, from a light that is one scan late to a motor that never starts, makes sense once you picture that loop.',
    analogy: 'A referee who looks at the whole field, makes every call in a fixed order, then blows the whistle, and does it again a hundred times a second.',
    model: [
      'The scan: read the inputs, solve the logic, update the outputs, then communications and housekeeping. A scan typically takes a few milliseconds.',
      'Logic is solved left to right along a rung and rung by rung from the top.',
      'Every instruction runs on every scan, true or false. A false rung actively turns its OTE bit off and resets its TON.',
      'A rung can use a bit written by an earlier rung in the same scan; a rung above sees the new value one scan later.',
      'This studio uses the classic model: inputs are read at the start of the scan and outputs written at the end. ControlLogix controllers update I/O asynchronously to the logic, so an input can change between two rungs; programs that need one consistent value copy inputs to internal tags first.',
      'A pulse shorter than one scan can be missed altogether. Very fast signals go to high-speed counter inputs instead.',
    ],
    syntax: 'XIC(Start) XIO(Stop) OTE(Motor)    // instructions in a row: AND\n[XIC(A), XIC(B)] OTE(Lamp)         // a branch: OR (BST XIC(A) NXB XIC(B) BND also works)\nXIC(PE) TON(Jam_T, 3000)           // a timer: its tag and preset in milliseconds\nXIC(Jam_T.DN) OTE(Jam_Alarm)       // use the timer’s done bit\n// a comment line describes the rung below it',
    examples: [
      {
        id: 'scan-down', title: 'Rungs in the order the data flows', question: 'Sensor sets an internal bit, and a lamp follows that bit. How quickly does the lamp react?',
        program: '// Rung 0 writes Seen\nXIC(Sensor) OTE(Seen)\n// Rung 1 reads it in the same scan\nXIC(Seen) OTE(Lamp)',
        devices: [toggle('Sensor', 'Sensor')], show: ['Seen', 'Lamp'],
        script: [
          { set: { Sensor: 1 }, expect: { Seen: 1, Lamp: 1 }, say: 'Sensor on, after one scan' },
          { set: { Sensor: 0 }, expect: { Seen: 0, Lamp: 0 }, say: 'Sensor off, after one scan' },
        ],
        explain: ['Rung 0 runs first and sets Seen.', 'Rung 1 runs next in the same scan and already sees Seen = 1.'],
        takeaway: 'With the writing rung above the reading rung, the lamp changes in the same scan as the sensor.',
      },
      {
        id: 'scan-up', title: 'The same rungs, upside down', question: 'What changes if the reading rung comes first?',
        program: '// Rung 0 reads Seen before rung 1 has written it\nXIC(Seen) OTE(Lamp)\nXIC(Sensor) OTE(Seen)',
        devices: [toggle('Sensor', 'Sensor')], show: ['Seen', 'Lamp'],
        script: [
          { set: { Sensor: 1 }, expect: { Seen: 1, Lamp: 0 }, say: 'Scan 1: rung 0 ran while Seen was still 0' },
          { expect: { Seen: 1, Lamp: 1 }, say: 'Scan 2: now the lamp comes on' },
          { set: { Sensor: 0 }, expect: { Seen: 0, Lamp: 1 }, say: 'Sensor off, scan 1: the lamp is still on' },
          { expect: { Lamp: 0 }, say: 'Scan 2: the lamp goes off' },
        ],
        explain: ['In scan 1, rung 0 reads Seen before rung 1 sets it.', 'The lamp follows one scan later, on the way on and on the way off.'],
        takeaway: 'Reordering the rungs delays the lamp by one scan (10 ms here). Nobody would see that, but one-scan effects decide whether one-shots, handshakes and sequences work (lesson 7).',
      },
      {
        id: 'scan-false', title: 'A false rung still runs', question: 'A door must be closed for 2 s before the machine is ready. The door is closed 1.5 s, opens for a moment, then closes again for 1.5 s. Ready?',
        program: '// The timer runs only while the door is closed\nXIC(Door_Closed) TON(Door_T, 2000)\nXIC(Door_T.DN) OTE(Ready)',
        devices: [toggle('Door_Closed', 'Door closed')], show: ['Door_T.ACC', 'Ready'],
        script: [
          { set: { Door_Closed: 1 }, hold: 1500, expect: { 'Door_T.ACC': 1500, Ready: 0 }, say: 'Closed for 1.5 s' },
          { set: { Door_Closed: 0 }, hold: 100, expect: { 'Door_T.ACC': 0, Ready: 0 }, say: 'Opens for 0.1 s: the false rung resets the timer' },
          { set: { Door_Closed: 1 }, hold: 1500, expect: { 'Door_T.ACC': 1500, Ready: 0 }, say: 'Closed again for 1.5 s' },
          { hold: 600, expect: { 'Door_T.ACC': 2000, Ready: 1 }, say: '2.1 s without a break: ready' },
        ],
        explain: ['While the rung is false, the TON still executes and clears its accumulator.', 'Only 2 s without a break counts.'],
        takeaway: '1.5 s plus 1.5 s is not 2 s for a TON. If you want total time, that is a retentive timer (lesson 5).',
      },
    ],
    mistakes: [
      {
        id: 'double-coil', title: 'Two rungs, one output (a “double coil”)',
        wrong: 'XIC(Auto_Run) OTE(Conveyor)\nXIC(Jog_PB) OTE(Conveyor)', fix: '[XIC(Auto_Run), XIC(Jog_PB)] OTE(Conveyor)',
        devices: [toggle('Auto_Run', 'Auto run'), push('Jog_PB', 'Jog')], show: ['Conveyor'],
        script: [
          { set: { Auto_Run: 1 }, expect: { Conveyor: 1 }, say: 'Auto on, nobody jogging' },
          { set: { Jog_PB: 1 }, expect: { Conveyor: 1 }, say: 'Jog held' },
          { set: { Auto_Run: 0, Jog_PB: 0 }, expect: { Conveyor: 0 }, say: 'Both off' },
        ],
        why: 'Both rungs write Conveyor on every scan. In Auto with Jog released, rung 0 sets it and rung 1 clears it in the same scan, so the conveyor never runs in Auto. One OTE per bit: put the conditions in parallel on one rung.',
      },
    ],
    tasks: [
      {
        id: 'scan-t1', task: 'Three rungs: Pump_Cmd is on while Level_Low is on; Pump_Lamp is on while Pump_Cmd is on; Alarm is on while Pump_Lamp and Fault are both on. All three must change in the same scan as the inputs.',
        hint: 'A rung can only use a bit that an earlier rung wrote in this scan, so order the rungs the way the data flows.',
        solution: 'XIC(Level_Low) OTE(Pump_Cmd)\nXIC(Pump_Cmd) OTE(Pump_Lamp)\nXIC(Pump_Lamp) XIC(Fault) OTE(Alarm)',
        devices: [toggle('Level_Low', 'Level low'), toggle('Fault', 'Fault')], show: ['Pump_Cmd', 'Pump_Lamp', 'Alarm'],
        script: [
          { set: { Level_Low: 1 }, expect: { Pump_Cmd: 1, Pump_Lamp: 1, Alarm: 0 }, say: 'Level low, one scan' },
          { set: { Fault: 1 }, expect: { Alarm: 1 }, say: 'Fault on, one scan' },
          { set: { Level_Low: 0 }, expect: { Pump_Cmd: 0, Pump_Lamp: 0, Alarm: 0 }, say: 'Level recovers, one scan' },
        ],
      },
      {
        id: 'scan-t2', task: 'One rung: Horn sounds while Fault_1 or Fault_2 (or both) is on.',
        hint: 'One OTE, two conditions in a branch.', solution: '[XIC(Fault_1), XIC(Fault_2)] OTE(Horn)',
        devices: [toggle('Fault_1', 'Fault 1'), toggle('Fault_2', 'Fault 2')], show: ['Horn'],
        script: [
          { set: { Fault_1: 1 }, expect: { Horn: 1 }, say: 'Fault 1 only' },
          { set: { Fault_1: 0, Fault_2: 1 }, expect: { Horn: 1 }, say: 'Fault 2 only' },
          { set: { Fault_1: 1 }, expect: { Horn: 1 }, say: 'Both' },
          { set: { Fault_1: 0, Fault_2: 0 }, expect: { Horn: 0 }, say: 'Neither' },
        ],
      },
    ],
    checks: [
      { id: 'scan-c1', q: 'Rung 8 turns Valve on with an OTE during scan 100. Rung 3 has XIC(Valve). When does rung 3 first see Valve = 1?', options: ['Scan 100', 'Scan 101', 'Only after the output module confirms it', 'Never: rungs can’t read outputs'], answer: 1, why: 'Rung 3 already ran in scan 100 before rung 8 set Valve, so it sees the new value on the next scan.' },
      { id: 'scan-c2', q: 'A rung is false this scan. What does the OTE at its end do?', options: ['Nothing: the PLC skips false rungs', 'It clears its bit to 0', 'It keeps the last value', 'It toggles the bit'], answer: 1, why: 'Every instruction runs every scan. With the rung false, OTE clears its bit, which is why two OTEs on one bit fight.' },
    ],
    interview: [
      { q: 'Walk me through a PLC scan.', a: 'Read the inputs, solve the program left to right and top to bottom (every instruction runs, true or false), write the outputs, then communications and housekeeping, and repeat, typically every few milliseconds. Rung order matters because later rungs see what earlier rungs wrote in the same scan. On ControlLogix, I/O updates asynchronously, so for consistency you buffer inputs at the start of the routine.' },
      { q: 'What is a double coil, and why is it a problem?', a: 'The same bit written by OTE on two rungs. Both execute every scan, so the last one wins and the first one’s condition is ignored. Combine the conditions on one rung (parallel branch) or use separate internal bits.' },
    ],
    onTheJob: 'When a machine “sometimes” misses a part or a light flickers, the cause is often the scan: a sensor pulse shorter than a scan, two rungs writing one output, or logic that relies on rung order. Reading a program the way the controller executes it is the first troubleshooting skill a controls or manufacturing engineer needs.',
    cites: [C.ote, C.async, C.langs],
  },
  {
    id: 'contacts', concept: 'automation.ladder-logic', title: 'Contacts and Boolean logic', level: 'Foundation', minutes: 15,
    goal: 'Turn AND, OR and NOT conditions into rungs, and read a rung back as logic.',
    intuition: 'A rung is a sentence: “run the conveyor if the guard is closed and either run button is on.” XIC and XIO are the words for “is on” and “is off”; putting them in a row means AND, putting them in parallel means OR. Power flows from the left rail to the output only along a path where every instruction is true.',
    analogy: 'Light switches between a battery and a bulb: switches in a row must all be closed; switches side by side give the current a choice of path.',
    model: [
      'XIC(bit) is true when the bit is 1. XIO(bit) is true when the bit is 0: that is NOT.',
      'Instructions in series are AND: every one must be true.',
      'A branch is OR: power passes if any leg is true. A leg can hold several instructions in series.',
      'Anything that must always hold (a guard, a permissive) goes in series outside the branch, so no leg can bypass it.',
      'De Morgan: NOT (A OR B) is XIO(A) XIO(B) in series; NOT (A AND B) is a branch [XIO(A), XIO(B)].',
      'Write rungs a reviewer can read in one pass: short branches, descriptive tag names, one output.',
    ],
    syntax: 'XIC(A) XIC(B) OTE(Y)                // Y = A AND B\n[XIC(A), XIC(B)] OTE(Y)             // Y = A OR B\nXIO(A) OTE(Y)                       // Y = NOT A\nXIC(G) [XIC(A), XIC(B) XIO(C)] OTE(Y) // Y = G AND (A OR (B AND NOT C))',
    examples: [
      {
        id: 'and-or', title: 'A permissive and two run stations', question: 'The conveyor may run from either station, but only while the guard is closed.',
        program: 'XIC(Guard_Closed) [XIC(Run_Local), XIC(Run_Remote)] OTE(Conveyor)',
        devices: [toggle('Guard_Closed', 'Guard closed'), toggle('Run_Local', 'Run (local)'), toggle('Run_Remote', 'Run (remote)')], show: ['Conveyor'],
        script: [
          { set: { Run_Local: 1 }, expect: { Conveyor: 0 }, say: 'Guard open: neither station can run it' },
          { set: { Guard_Closed: 1 }, expect: { Conveyor: 1 }, say: 'Guard closed, local run on' },
          { set: { Run_Local: 0, Run_Remote: 1 }, expect: { Conveyor: 1 }, say: 'Remote run instead' },
          { set: { Run_Remote: 0 }, expect: { Conveyor: 0 }, say: 'Both run commands off' },
        ],
        explain: ['The guard contact is in series with the whole branch.', 'Either leg of the branch completes the path.'],
        takeaway: 'Guard AND (local OR remote): the permissive sits outside the branch, so neither station can bypass it.',
      },
      {
        id: 'not', title: 'NOT with XIO', question: 'Alarm when the pump is running but there is no flow.',
        program: 'XIC(Pump_Run) XIO(Flow_OK) OTE(No_Flow_Alarm)',
        devices: [toggle('Pump_Run', 'Pump running'), toggle('Flow_OK', 'Flow switch made')], show: ['No_Flow_Alarm'],
        script: [
          { set: { Pump_Run: 1 }, expect: { No_Flow_Alarm: 1 }, say: 'Pump on, no flow' },
          { set: { Flow_OK: 1 }, expect: { No_Flow_Alarm: 0 }, say: 'Flow established' },
          { set: { Pump_Run: 0, Flow_OK: 0 }, expect: { No_Flow_Alarm: 0 }, say: 'Pump off: no flow is expected' },
        ],
        explain: ['XIO(Flow_OK) is true while the flow bit is 0.'],
        takeaway: 'Running AND NOT flowing. A real alarm would also wait a few seconds for flow to build (a TON, lesson 5).',
      },
      {
        id: 'xor', title: 'Exclusive OR from two legs', question: 'A stair light with a switch at the top and the bottom: either switch changes the light.',
        program: '[XIC(Sw_Top) XIO(Sw_Bottom), XIO(Sw_Top) XIC(Sw_Bottom)] OTE(Stair_Light)',
        devices: [toggle('Sw_Top', 'Top switch'), toggle('Sw_Bottom', 'Bottom switch')], show: ['Stair_Light'],
        script: [
          { expect: { Stair_Light: 0 }, say: 'Both down' },
          { set: { Sw_Top: 1 }, expect: { Stair_Light: 1 }, say: 'Top flipped' },
          { set: { Sw_Bottom: 1 }, expect: { Stair_Light: 0 }, say: 'Bottom flipped too' },
          { set: { Sw_Top: 0 }, expect: { Stair_Light: 1 }, say: 'Top flipped back' },
        ],
        explain: ['Each leg is an AND of one switch on and the other off.', 'Two legs in parallel: exactly one switch on.'],
        takeaway: 'Legs can hold series instructions, so any sum of products fits on one rung.',
      },
    ],
    mistakes: [
      {
        id: 'or-in-series', title: 'OR written as AND', wrong: 'XIC(Guard_Closed) XIC(Run_Local) XIC(Run_Remote) OTE(Conveyor)', fix: 'XIC(Guard_Closed) [XIC(Run_Local), XIC(Run_Remote)] OTE(Conveyor)',
        devices: [toggle('Guard_Closed', 'Guard closed'), toggle('Run_Local', 'Run (local)'), toggle('Run_Remote', 'Run (remote)')], show: ['Conveyor'],
        script: [{ set: { Guard_Closed: 1, Run_Local: 1 }, expect: { Conveyor: 1 }, say: 'Guard closed, local run' }],
        why: 'In series, both run commands must be on at once. Alternatives belong in a branch.',
      },
      {
        id: 'branch-too-wide', title: 'A branch that lets one leg skip the guard', wrong: '[XIC(Guard_Closed) XIC(Run_Local), XIC(Run_Remote)] OTE(Conveyor)', fix: 'XIC(Guard_Closed) [XIC(Run_Local), XIC(Run_Remote)] OTE(Conveyor)',
        devices: [toggle('Guard_Closed', 'Guard closed'), toggle('Run_Local', 'Run (local)'), toggle('Run_Remote', 'Run (remote)')], show: ['Conveyor'],
        script: [
          { set: { Run_Remote: 1 }, expect: { Conveyor: 0 }, say: 'Guard open, remote run on' },
          { set: { Run_Remote: 0, Guard_Closed: 1, Run_Local: 1 }, expect: { Conveyor: 1 }, say: 'Guard closed, local run' },
        ],
        why: 'The guard contact sits inside the first leg only, so the remote leg bypasses it. A condition that must always hold goes in series outside the branch.',
      },
    ],
    tasks: [
      {
        id: 'contacts-t1', task: 'Fan runs while Temp_High or Manual_Fan is on, but never while Fan_Fault is on.', hint: 'A branch for the two reasons to run, then the fault as NOT in series.',
        solution: '[XIC(Temp_High), XIC(Manual_Fan)] XIO(Fan_Fault) OTE(Fan)',
        devices: [toggle('Temp_High', 'Temperature high'), toggle('Manual_Fan', 'Manual fan'), toggle('Fan_Fault', 'Fan fault')], show: ['Fan'],
        script: [
          { set: { Temp_High: 1 }, expect: { Fan: 1 }, say: 'Hot' },
          { set: { Fan_Fault: 1 }, expect: { Fan: 0 }, say: 'Hot, but faulted' },
          { set: { Temp_High: 0, Manual_Fan: 1, Fan_Fault: 0 }, expect: { Fan: 1 }, say: 'Manual request' },
          { set: { Fan_Fault: 1 }, expect: { Fan: 0 }, say: 'Manual request, faulted' },
          { set: { Manual_Fan: 0, Fan_Fault: 0 }, expect: { Fan: 0 }, say: 'No reason to run' },
        ],
      },
      {
        id: 'contacts-t2', task: 'Light is on when exactly one of Sw_A and Sw_B is on.', hint: 'Two legs: A and not B, or not A and B.',
        solution: '[XIC(Sw_A) XIO(Sw_B), XIO(Sw_A) XIC(Sw_B)] OTE(Light)',
        devices: [toggle('Sw_A', 'Switch A'), toggle('Sw_B', 'Switch B')], show: ['Light'],
        script: [
          { expect: { Light: 0 }, say: 'Neither' },
          { set: { Sw_A: 1 }, expect: { Light: 1 }, say: 'A only' },
          { set: { Sw_B: 1 }, expect: { Light: 0 }, say: 'Both' },
          { set: { Sw_A: 0 }, expect: { Light: 1 }, say: 'B only' },
        ],
      },
      {
        id: 'contacts-t3', task: 'Y = (A AND NOT B) OR C.', hint: 'A branch: one leg with A and NOT B, one leg with C.',
        solution: '[XIC(A) XIO(B), XIC(C)] OTE(Y)',
        devices: [toggle('A', 'A'), toggle('B', 'B'), toggle('C', 'C')], show: ['Y'],
        script: [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
          const a = k & 1, b = (k >> 1) & 1, c = (k >> 2) & 1
          return { set: { A: a as 0 | 1, B: b as 0 | 1, C: c as 0 | 1 }, expect: { Y: (a && !b) || c ? 1 : 0 }, say: `A=${a} B=${b} C=${c}` }
        }),
      },
    ],
    checks: [
      { id: 'contacts-c1', q: 'XIO(Level_OK) is true when…', options: ['Level_OK is 1', 'Level_OK is 0', 'the level switch is wired normally closed', 'the rung above it is false'], answer: 1, why: 'XIO tests the bit for 0, whatever the device and its wiring.' },
      { id: 'contacts-c2', q: 'How do you write NOT (A OR B)?', options: ['XIO(A) XIO(B) in series', '[XIO(A), XIO(B)] in parallel', 'XIC(A) XIC(B) in series', 'It can’t be done on one rung'], answer: 0, why: 'De Morgan: NOT (A OR B) = NOT A AND NOT B, which is two XIOs in series.' },
    ],
    interview: [
      { q: 'How do you implement AND, OR and NOT in ladder?', a: 'AND: instructions in series. OR: a parallel branch. NOT: XIO, which is true when its bit is 0.' },
      { q: 'Turn “run if the guard is closed and either start is on” into a rung.', a: 'XIC(Guard_Closed) [XIC(Start_1), XIC(Start_2)] OTE(Run). The guard goes in series outside the branch, otherwise one leg could bypass it.' },
    ],
    onTheJob: 'Most rungs in real machines are permissives and interlocks: a long row of conditions that must all be true, with a few alternatives in branches. Reading them quickly, and noticing a condition that only guards one leg, is what makes a review useful.',
    cites: [C.xic, C.xio],
  },
  {
    id: 'nonc', concept: 'automation.no-nc', title: 'NO and NC: field wiring versus XIC and XIO', level: 'Core', minutes: 20,
    goal: 'Keep two questions apart: how a device is wired, and what the instruction tests. Then wire stops so they fail safe.',
    intuition: 'A normally-open (NO) device closes when you actuate it; a normally-closed (NC) device opens when you actuate it. The PLC only sees the result: current at the input terminal or not, a bit of 1 or 0. XIC and XIO then test that bit. The ladder symbol that looks like an NC contact (XIO) has nothing to do with whether the device is NC.',
    analogy: 'A doorbell button (NO: rings only while pressed) versus a fridge-door switch (NC-style: the light is on until the door presses the switch).',
    model: [
      'Input bit = 1 when the field circuit is closed. NO device: 1 while actuated. NC device: 1 while NOT actuated.',
      'XIC tests for 1, XIO tests for 0. The instruction doesn’t know how the device is wired.',
      'Stop buttons and E-stops are wired NC so that a broken wire or loose terminal reads 0, the same as a press: the machine stops. That is failing safe.',
      'With an NC stop, the run rung uses XIC(Stop_PB): “the stop circuit is healthy and nobody is pressing it.”',
      'Name tags for what bit 1 means (Stop_OK, Guard_Closed, Level_High) and the rung reads like a sentence.',
    ],
    syntax: '// NC stop: bit is 1 while nobody presses it\n[XIC(Start_PB), XIC(Motor)] XIC(Stop_PB) OTE(Motor)',
    examples: [
      {
        id: 'nonc-four', title: 'All four combinations', question: 'One NO button and one NC button, each tested with XIC and XIO.',
        program: 'XIC(PB_NO) OTE(L1)\nXIO(PB_NO) OTE(L2)\nXIC(PB_NC) OTE(L3)\nXIO(PB_NC) OTE(L4)',
        devices: [push('PB_NO', 'Button wired NO'), push('PB_NC', 'Button wired NC', 'NC')], show: ['PB_NO', 'PB_NC', 'L1', 'L2', 'L3', 'L4'],
        script: [
          { expect: { PB_NO: 0, PB_NC: 1, L1: 0, L2: 1, L3: 1, L4: 0 }, say: 'Nobody pressing' },
          { set: { PB_NO: 1, PB_NC: 1 }, expect: { PB_NO: 1, PB_NC: 0, L1: 1, L2: 0, L3: 0, L4: 1 }, say: 'Both pressed' },
          { set: { PB_NO: 0, PB_NC: 'broken' }, expect: { PB_NC: 0, L3: 0, L4: 1 }, say: 'NC wire cut: looks exactly like a press' },
        ],
        explain: ['The NC button gives bit 1 at rest, so XIC(PB_NC) lights L3 until it is pressed.', 'A cut wire always reads 0.'],
        takeaway: 'Same symbols, opposite results: the instruction tests the bit, and the wiring decides what the bit means.',
      },
      {
        id: 'nonc-stop', title: 'A fail-safe stop', question: 'Start (NO) and Stop (NC) for a motor. What happens if the stop wire breaks?',
        program: '[XIC(Start_PB), XIC(Motor)] XIC(Stop_PB) OTE(Motor)',
        devices: [START, STOP], show: ['Stop_PB', 'Motor'],
        script: [
          { expect: { Stop_PB: 1, Motor: 0 }, say: 'At rest: the stop bit is 1' },
          { set: { Start_PB: 1 }, hold: 200, expect: { Motor: 1 }, say: 'Press Start' },
          { set: { Start_PB: 0 }, hold: 500, expect: { Motor: 1 }, say: 'Release Start: sealed in' },
          { set: { Stop_PB: 1 }, hold: 200, expect: { Stop_PB: 0, Motor: 0 }, say: 'Press Stop' },
          { set: { Stop_PB: 0, Start_PB: 1 }, hold: 200, expect: { Motor: 1 }, say: 'Release Stop, press Start' },
          { set: { Start_PB: 0, Stop_PB: 'broken' }, expect: { Motor: 0 }, say: 'Stop wire breaks: the motor stops' },
          { set: { Start_PB: 1 }, hold: 200, expect: { Motor: 0 }, say: 'It can’t be started until the wire is fixed' },
        ],
        explain: ['XIC(Stop_PB) is true while the stop circuit is closed.', 'Pressing Stop and breaking the wire look the same to the PLC: both stop the motor.'],
        takeaway: 'Wired NC and tested with XIC, the stop fails safe: a broken wire stops the machine instead of silently disabling the stop.',
      },
    ],
    mistakes: [
      {
        id: 'xio-for-stop', title: 'XIO because “it’s a stop”', wrong: '[XIC(Start_PB), XIC(Motor)] XIO(Stop_PB) OTE(Motor)', fix: '[XIC(Start_PB), XIC(Motor)] XIC(Stop_PB) OTE(Motor)',
        devices: [START, STOP], show: ['Stop_PB', 'Motor'],
        script: [
          { set: { Start_PB: 1 }, hold: 200, expect: { Motor: 1 }, say: 'Press Start' },
          { set: { Start_PB: 0 }, hold: 200, expect: { Motor: 1 }, say: 'Release Start' },
          { set: { Stop_PB: 1 }, hold: 200, expect: { Motor: 0 }, say: 'Press Stop' },
        ],
        why: 'Stop_PB is 1 while nobody presses the NC button, so XIO(Stop_PB) is false in normal operation: the motor can’t start, and it would run only while someone holds Stop. XIO looks like an NC contact, but it tests the bit, not the wiring.',
      },
      {
        id: 'no-wired-stop', title: 'A stop wired NO', wrong: '[XIC(Start_PB), XIC(Motor)] XIO(Stop_PB) OTE(Motor)', fix: '[XIC(Start_PB), XIC(Motor)] XIC(Stop_PB) OTE(Motor)',
        wrongDevices: [START, push('Stop_PB', 'Stop (wired NO)')], devices: [START, STOP], show: ['Stop_PB', 'Motor'],
        script: [
          { set: { Start_PB: 1 }, hold: 200, expect: { Motor: 1 }, say: 'Press Start' },
          { set: { Start_PB: 0 }, hold: 200, expect: { Motor: 1 }, say: 'Release Start' },
          { set: { Stop_PB: 'broken' }, hold: 200, expect: { Motor: 0 }, say: 'Stop wire breaks' },
        ],
        why: 'Wired NO, the stop passes every bench test, but a broken wire reads 0, exactly like “nobody pressing Stop”. The motor keeps running and the stop button no longer works. Wired NC, the same fault stops the machine.',
      },
    ],
    tasks: [
      {
        id: 'nonc-t1', task: 'Stop_PB is wired NC. Run_Lamp is on while Ready is on and nobody is pressing Stop_PB. A broken stop wire must turn the lamp off.',
        hint: 'With NC wiring the bit is 1 at rest, so test it with XIC.', solution: 'XIC(Stop_PB) XIC(Ready) OTE(Run_Lamp)',
        devices: [push('Stop_PB', 'Stop (NC)', 'NC'), toggle('Ready', 'Ready')], show: ['Run_Lamp'],
        script: [
          { set: { Ready: 1 }, expect: { Run_Lamp: 1 }, say: 'Ready' },
          { set: { Stop_PB: 1 }, expect: { Run_Lamp: 0 }, say: 'Stop pressed' },
          { set: { Stop_PB: 0 }, expect: { Run_Lamp: 1 }, say: 'Stop released' },
          { set: { Stop_PB: 'broken' }, expect: { Run_Lamp: 0 }, say: 'Stop wire broken' },
        ],
      },
      {
        id: 'nonc-t2', task: 'High_Level is a float switch wired NC: its contact opens when the tank reaches high level, so a broken wire looks like “full”. Inlet_Valve is open (on) while Fill_Cmd is on and the tank is not at high level.',
        hint: 'Bit 1 means “not high”. Which instruction is true for that?', solution: 'XIC(Fill_Cmd) XIC(High_Level) OTE(Inlet_Valve)',
        devices: [toggle('Fill_Cmd', 'Fill command'), toggle('High_Level', 'Tank at high level (NC)', 'NC')], show: ['High_Level', 'Inlet_Valve'],
        script: [
          { set: { Fill_Cmd: 1 }, expect: { Inlet_Valve: 1 }, say: 'Fill requested, tank not full' },
          { set: { High_Level: 1 }, expect: { High_Level: 0, Inlet_Valve: 0 }, say: 'High level reached' },
          { set: { High_Level: 0 }, expect: { Inlet_Valve: 1 }, say: 'Level drops' },
          { set: { High_Level: 'broken' }, expect: { Inlet_Valve: 0 }, say: 'Float wire broken: stop filling' },
        ],
      },
    ],
    checks: [
      { id: 'nonc-c1', q: 'A stop button is wired NC. Nobody is touching it. What is its input bit?', options: ['0', '1', 'It depends on XIC or XIO', 'Undefined until pressed'], answer: 1, why: 'The NC contact is closed at rest, so current flows and the bit is 1.' },
      { id: 'nonc-c2', q: 'Why wire stop buttons NC?', options: ['They are cheaper', 'A broken wire then reads like a stop press, so the machine stops', 'XIO only works with NC devices', 'NC buttons can’t be pressed by accident'], answer: 1, why: 'Fail-safe: the common fault (a broken wire or loose terminal) produces the safe result.' },
    ],
    interview: [
      { q: 'Is XIO a “normally closed contact”?', a: 'It is drawn like one, but it is an instruction that is true when its bit is 0. Whether the field device is NO or NC is a separate question; with an NC stop button you use XIC, because the bit is 1 when the stop is not pressed.' },
      { q: 'Why are stop buttons and E-stops wired normally closed?', a: 'So that a broken wire, loose terminal or blown fuse reads the same as a press and stops the machine. A normally-open stop fails dangerously: the fault looks like “nobody pressing stop”.' },
    ],
    onTheJob: 'Half the confusion on a controls job comes from mixing up the device and the instruction. When you read a rung, check the electrical drawing for how each input is wired before deciding what the bit means.',
    safety: 'Real emergency stops are safety functions with safety-rated devices and wiring; see lesson 9. The NC examples here show the principle only.',
    cites: [C.xic, C.xio],
  },
  {
    id: 'sealin', concept: 'automation.seal-in', title: 'Start/stop: seal-in circuits and latches', level: 'Core', minutes: 20,
    goal: 'Hold an output on after a momentary start, make stop win, interlock two outputs, and know when a latch is the wrong tool.',
    intuition: 'Start buttons are momentary, so something has to remember “running”. A seal-in uses the output’s own bit as a second path around the start button; the stop condition sits in series with both paths. A latch (OTL/OTU) also remembers, but its memory outlives the conditions that set it, which is exactly why it’s risky for motors.',
    analogy: 'Holding a door open with a doorstop after you push it once; pulling the doorstop (stop) lets it swing shut.',
    model: [
      'Seal-in: [Start, Output] in parallel, then Stop in series, then OTE(Output).',
      'Stop outside the branch is stop-dominant: with Start and Stop both pressed, the output is off.',
      'Interlock: XIO(Motor_Rev) in the forward rung (and the mirror in reverse) stops both directions being on at once. Real reversing starters also have a mechanical and electrical interlock.',
      'OTL sets a bit that stays set when the rung goes false, until an OTU clears it. OTE has a prescan rule (clear the bit); OTL has none.',
      'So after a program restart a seal-in drops out and needs a new Start, while a latched output keeps its last value. On controllers that keep tag values through a power loss, a latched motor comes straight back on.',
      'Use latches for things that should be remembered (an alarm until acknowledged, a completed step), not for running equipment.',
    ],
    syntax: '[XIC(Start_PB), XIC(Motor)] XIC(Stop_PB) OTE(Motor)   // seal-in, NC stop\nXIC(Set_Cond) OTL(Alarm)                               // latch\nXIC(Ack_PB) OTU(Alarm)                                 // unlatch',
    examples: [
      {
        id: 'seal-basic', title: 'Seal-in with stop priority', question: 'Press Start briefly: the motor keeps running. Stop drops it out, and wins if both are pressed.',
        program: '[XIC(Start_PB), XIC(Motor)] XIC(Stop_PB) OTE(Motor)', devices: [START, STOP], show: ['Motor'],
        script: [
          { set: { Start_PB: 1 }, hold: 200, expect: { Motor: 1 }, say: 'Press Start' },
          { set: { Start_PB: 0 }, hold: 500, expect: { Motor: 1 }, say: 'Release Start: the Motor contact holds the rung' },
          { set: { Stop_PB: 1 }, hold: 200, expect: { Motor: 0 }, say: 'Press Stop' },
          { set: { Stop_PB: 0 }, hold: 200, expect: { Motor: 0 }, say: 'Release Stop: stays off' },
          { set: { Start_PB: 1, Stop_PB: 1 }, hold: 200, expect: { Motor: 0 }, say: 'Start and Stop together: stop wins' },
          { set: { Start_PB: 0, Stop_PB: 0 }, expect: { Motor: 0 }, say: 'Both released' },
        ],
        explain: ['The Motor contact in parallel with Start “seals” the rung.', 'Stop is in series with both legs, so it always breaks the rung.'],
        takeaway: 'Three instructions and an output give the classic three-wire start/stop: momentary start, maintained run, stop priority.',
      },
      {
        id: 'interlock', title: 'Forward/reverse with an interlock', question: 'Forward and reverse must never be on together; pressing Reverse while running forward does nothing.',
        program: '// Forward: start, seal, stop, and reverse must be off\n[XIC(Fwd_PB), XIC(Motor_Fwd)] XIC(Stop_PB) XIO(Motor_Rev) OTE(Motor_Fwd)\n// Reverse: the mirror image\n[XIC(Rev_PB), XIC(Motor_Rev)] XIC(Stop_PB) XIO(Motor_Fwd) OTE(Motor_Rev)',
        devices: [push('Fwd_PB', 'Forward'), push('Rev_PB', 'Reverse'), STOP], show: ['Motor_Fwd', 'Motor_Rev'],
        script: [
          { set: { Fwd_PB: 1 }, hold: 200, expect: { Motor_Fwd: 1, Motor_Rev: 0 }, say: 'Press Forward' },
          { set: { Fwd_PB: 0, Rev_PB: 1 }, hold: 200, expect: { Motor_Fwd: 1, Motor_Rev: 0 }, say: 'Press Reverse while forward runs: blocked' },
          { set: { Rev_PB: 0, Stop_PB: 1 }, hold: 200, expect: { Motor_Fwd: 0, Motor_Rev: 0 }, say: 'Stop' },
          { set: { Stop_PB: 0, Rev_PB: 1 }, hold: 200, expect: { Motor_Fwd: 0, Motor_Rev: 1 }, say: 'Now Reverse works' },
          { set: { Rev_PB: 0, Fwd_PB: 1 }, hold: 200, expect: { Motor_Fwd: 0, Motor_Rev: 1 }, say: 'Forward is blocked while reversing' },
        ],
        explain: ['Each rung has the other direction’s bit as an XIO.', 'You must stop before changing direction.'],
        takeaway: 'The interlock is two XIOs. In a real starter it is backed up by mechanically interlocked contactors, because software alone can’t prevent a welded contact.',
      },
    ],
    mistakes: [
      {
        id: 'start-wins', title: 'Stop only in the seal leg', wrong: '[XIC(Start_PB), XIC(Motor) XIC(Stop_PB)] OTE(Motor)', fix: '[XIC(Start_PB), XIC(Motor)] XIC(Stop_PB) OTE(Motor)',
        devices: [START, STOP], show: ['Motor'],
        script: [
          { set: { Start_PB: 1 }, hold: 200, expect: { Motor: 1 }, say: 'Press Start' },
          { set: { Stop_PB: 1 }, hold: 200, expect: { Motor: 0 }, say: 'Start still held, press Stop' },
        ],
        why: 'With Stop inside the seal leg, a held (or stuck) Start button keeps the motor running even while Stop is pressed: start-dominant. Put Stop in series outside the branch.',
      },
      {
        id: 'latch-restart', title: 'A latched motor after a restart', wrong: 'XIC(Start_PB) OTL(Motor)\nXIO(Stop_PB) OTU(Motor)', fix: '[XIC(Start_PB), XIC(Motor)] XIC(Stop_PB) OTE(Motor)',
        devices: [START, STOP], show: ['Motor'],
        script: [
          { set: { Start_PB: 1 }, hold: 200, expect: { Motor: 1 }, say: 'Press Start' },
          { set: { Start_PB: 0 }, hold: 200, expect: { Motor: 1 }, say: 'Release Start' },
          { restart: true, expect: { Motor: 0 }, say: 'The program restarts (after a power outage, say)' },
        ],
        why: 'The prescan clears OTE bits, so a seal-in drops out and waits for a new Start. A latched bit keeps its value, so the motor comes back on by itself: an unexpected restart. Keep latches for things that should survive, like an alarm waiting to be acknowledged.',
      },
    ],
    tasks: [
      {
        id: 'seal-t1', task: 'Pump: Start_PB (NO), Stop_PB (NC). The pump keeps running after Start is released, stops on Stop or a broken stop wire, and stays off after a program restart until Start is pressed again.',
        hint: 'A seal-in with the stop in series; an OTE (not a latch) so the restart drops it out.', solution: '[XIC(Start_PB), XIC(Pump)] XIC(Stop_PB) OTE(Pump)',
        devices: [START, STOP], show: ['Pump'],
        script: [
          { set: { Start_PB: 1 }, hold: 200, expect: { Pump: 1 }, say: 'Press Start' },
          { set: { Start_PB: 0 }, hold: 300, expect: { Pump: 1 }, say: 'Release Start' },
          { set: { Stop_PB: 1 }, hold: 200, expect: { Pump: 0 }, say: 'Press Stop' },
          { set: { Stop_PB: 0, Start_PB: 1 }, hold: 200, expect: { Pump: 1 }, say: 'Release Stop, press Start' },
          { set: { Start_PB: 0 }, hold: 200, expect: { Pump: 1 }, say: 'Release Start' },
          { restart: true, expect: { Pump: 0 }, say: 'Program restart' },
          { set: { Start_PB: 1 }, hold: 200, expect: { Pump: 1 }, say: 'Press Start again' },
          { set: { Start_PB: 0, Stop_PB: 'broken' }, expect: { Pump: 0 }, say: 'Stop wire breaks' },
        ],
      },
      {
        id: 'seal-t2', task: 'Hoist: Up_PB, Down_PB (NO), Stop_PB (NC), and limit switches Up_Limit and Down_Limit wired NC (they open at the end of travel). Motor_Up and Motor_Down seal in, stop at their limit, and can never be on together.',
        hint: 'Two seal-in rungs. Each needs the stop, its own limit (XIC, because NC) and an XIO of the other direction.',
        solution: '[XIC(Up_PB), XIC(Motor_Up)] XIC(Stop_PB) XIC(Up_Limit) XIO(Motor_Down) OTE(Motor_Up)\n[XIC(Down_PB), XIC(Motor_Down)] XIC(Stop_PB) XIC(Down_Limit) XIO(Motor_Up) OTE(Motor_Down)',
        devices: [push('Up_PB', 'Up'), push('Down_PB', 'Down'), STOP, toggle('Up_Limit', 'At top (NC limit)', 'NC'), toggle('Down_Limit', 'At bottom (NC limit)', 'NC')], show: ['Motor_Up', 'Motor_Down'],
        script: [
          { set: { Up_PB: 1 }, hold: 200, expect: { Motor_Up: 1, Motor_Down: 0 }, say: 'Press Up' },
          { set: { Up_PB: 0, Down_PB: 1 }, hold: 200, expect: { Motor_Up: 1, Motor_Down: 0 }, say: 'Press Down while going up: blocked' },
          { set: { Down_PB: 0, Up_Limit: 1 }, hold: 200, expect: { Motor_Up: 0 }, say: 'Reaches the top limit' },
          { set: { Up_PB: 1 }, hold: 200, expect: { Motor_Up: 0 }, say: 'Up pressed at the top: no motion' },
          { set: { Up_PB: 0, Down_PB: 1 }, hold: 200, expect: { Motor_Down: 1 }, say: 'Press Down' },
          { set: { Down_PB: 0, Up_Limit: 0 }, hold: 200, expect: { Motor_Down: 1 }, say: 'Leaves the top limit, still going down' },
          { set: { Stop_PB: 1 }, hold: 200, expect: { Motor_Up: 0, Motor_Down: 0 }, say: 'Stop' },
        ],
      },
    ],
    checks: [
      { id: 'seal-c1', q: 'In [XIC(Start_PB), XIC(Motor)] XIC(Stop_PB) OTE(Motor), Start and Stop are pressed together. What happens?', options: ['Motor on: start wins', 'Motor off: the stop is in series with both paths', 'It toggles every scan', 'It depends on which was pressed first'], answer: 1, why: 'Stop-dominant: with the stop bit at 0 no path reaches the output.' },
      { id: 'seal-c2', q: 'Why does a seal-in drop out after a program restart while an OTL latch doesn’t?', options: ['The prescan clears OTE bits; OTL has no prescan action', 'Latches are stored on the HMI', 'Seal-ins use a timer', 'Both restart by themselves'], answer: 0, why: 'OTE’s prescan clears its bit; OTL leaves the bit as it was.' },
    ],
    interview: [
      { q: 'Seal-in circuit or latch/unlatch: which would you use for a motor, and why?', a: 'A seal-in. It drops out on a program restart or power loss and needs a deliberate new start, which avoids an unexpected restart. Latches keep their state, so they suit things that must be remembered, like an alarm until it is acknowledged.' },
      { q: 'What is stop-dominant?', a: 'With start and stop pressed together the output is off, because the stop is in series with both the start and the seal paths.' },
    ],
    onTheJob: 'Start/stop with a seal-in is on nearly every machine: conveyors, pumps, fans, hydraulic units. When one “won’t stay running”, look at the seal contact and the stop chain; when one “restarted by itself”, look for a latch.',
    cites: [C.otl, C.ote],
  },
  {
    id: 'timers', concept: 'automation.plc-timer', title: 'Timers: TON, TOF and RTO', level: 'Core', minutes: 25,
    goal: 'Pick the right timer for a delay, a run-on or a running total, and use its bits.',
    intuition: 'A timer instruction turns a rung’s state into time. TON asks “has the rung been true long enough?”, TOF asks “has it been false long enough?”, and RTO adds up all the time the rung has been true, keeping the total until you reset it.',
    analogy: 'A microwave countdown (TON), a hallway light that stays on a minute after you leave (TOF), and a stopwatch you can pause (RTO).',
    model: [
      'Every timer has a tag with members: PRE (preset), ACC (accumulated, in milliseconds on Logix), EN (enabled: the rung state), TT (timing) and DN (done).',
      'TON: while the rung is true, ACC counts up; DN turns on when ACC reaches PRE. Any false scan clears ACC and the bits.',
      'TOF: while the rung is true, DN is on and ACC is 0. When the rung goes false it times; DN turns off when ACC reaches PRE. If the rung goes true again first, timing starts over.',
      'RTO: like TON but keeps ACC when the rung goes false; DN stays on. Only RES clears it.',
      'Use the done bit (and sometimes TT) in other rungs: XIC(Jam_T.DN) OTE(Jam_Alarm).',
      'In this engine ACC grows by one scan time (10 ms) on each true scan, so times resolve to one scan.',
    ],
    syntax: 'XIC(In) TON(T1, 3000)      // on-delay: DN 3 s after In turns on\nXIC(In) TOF(T2, 5000)      // off-delay: DN stays on 5 s after In turns off\nXIC(In) RTO(T3, 4000)      // retentive: DN after 4 s in total\nXIC(Reset) RES(T3)         // clear a retentive timer',
    examples: [
      {
        id: 'ton-jam', title: 'On-delay: jam detection', question: 'A photo-eye blocked for 3 s means a jam.',
        program: '// Photo-eye blocked for 3 s means a jam\nXIC(PE_Blocked) TON(Jam_T, 3000)\nXIC(Jam_T.DN) OTE(Jam_Alarm)',
        devices: [toggle('PE_Blocked', 'Photo-eye blocked')], show: ['Jam_T.ACC', 'Jam_T.DN', 'Jam_Alarm'],
        script: [
          { set: { PE_Blocked: 1 }, hold: 2000, expect: { 'Jam_T.ACC': 2000, Jam_Alarm: 0 }, say: 'Blocked 2 s: a long box, not a jam' },
          { set: { PE_Blocked: 0 }, hold: 100, expect: { 'Jam_T.ACC': 0 }, say: 'Clears: the timer resets' },
          { set: { PE_Blocked: 1 }, hold: 3100, expect: { 'Jam_T.ACC': 3000, 'Jam_T.DN': 1, Jam_Alarm: 1 }, say: 'Blocked 3.1 s: jam' },
          { set: { PE_Blocked: 0 }, expect: { Jam_Alarm: 0 }, say: 'Clears: the alarm follows the timer off' },
        ],
        explain: ['The timer only finishes if the eye stays blocked for the full preset.', 'ACC stops at PRE in this engine.'],
        takeaway: 'An on-delay filters out normal short events. Here the alarm drops as soon as the eye clears; latch it (lesson 4) if someone must acknowledge it.',
      },
      {
        id: 'tof-fan', title: 'Off-delay: a cooling fan run-on', question: 'Keep the cooling fan running 5 s after the motor stops.',
        program: '// The fan runs with the motor and 5 s after it stops\nXIC(Motor_Run) TOF(Fan_T, 5000)\nXIC(Fan_T.DN) OTE(Fan)',
        devices: [toggle('Motor_Run', 'Motor running')], show: ['Fan_T.ACC', 'Fan'],
        script: [
          { set: { Motor_Run: 1 }, hold: 1000, expect: { Fan: 1, 'Fan_T.ACC': 0 }, say: 'Motor running' },
          { set: { Motor_Run: 0 }, hold: 3000, expect: { Fan: 1, 'Fan_T.ACC': 3000 }, say: 'Motor stopped 3 s ago' },
          { hold: 2100, expect: { Fan: 0 }, say: '5.1 s after the stop: fan off' },
          { set: { Motor_Run: 1 }, hold: 500, expect: { Fan: 1 }, say: 'Motor on again' },
          { set: { Motor_Run: 0 }, hold: 2000, expect: { Fan: 1, 'Fan_T.ACC': 2000 }, say: 'Stopped 2 s' },
          { set: { Motor_Run: 1 }, expect: { Fan: 1, 'Fan_T.ACC': 0 }, say: 'Restarted before the delay ran out: the delay starts over next time' },
        ],
        explain: ['DN is on whenever the rung is true.', 'The delay begins when the rung goes false.'],
        takeaway: 'TOF gives you “keep going for a while after”: fans, conveyor run-out, lights.',
      },
      {
        id: 'rto-service', title: 'Retentive: total running time', question: 'Flag service after 4 s of total spindle running (think 400 hours).',
        program: '// Total running time, kept while the spindle is stopped\nXIC(Spindle_Run) RTO(Run_T, 4000)\nXIC(Run_T.DN) OTE(Service_Due)\nXIC(Service_Reset) RES(Run_T)',
        devices: [toggle('Spindle_Run', 'Spindle running'), push('Service_Reset', 'Service done (reset)')], show: ['Run_T.ACC', 'Service_Due'],
        script: [
          { set: { Spindle_Run: 1 }, hold: 2500, expect: { 'Run_T.ACC': 2500, Service_Due: 0 }, say: 'Runs 2.5 s' },
          { set: { Spindle_Run: 0 }, hold: 1000, expect: { 'Run_T.ACC': 2500 }, say: 'Stopped 1 s: ACC is kept' },
          { set: { Spindle_Run: 1 }, hold: 1600, expect: { 'Run_T.ACC': 4000, Service_Due: 1 }, say: 'Runs 1.6 s more: 4.1 s in total' },
          { set: { Spindle_Run: 0 }, hold: 500, expect: { Service_Due: 1 }, say: 'Stopped: still due' },
          { set: { Service_Reset: 1 }, hold: 100, expect: { 'Run_T.ACC': 0, Service_Due: 0 }, say: 'Service done: reset' },
          { set: { Service_Reset: 0 }, expect: { Service_Due: 0 }, say: 'Release reset' },
        ],
        explain: ['RTO pauses instead of resetting when the rung goes false.', 'RES is the only way to clear it.'],
        takeaway: 'RTO is a running-hours meter: preventive maintenance by use, not by calendar.',
      },
    ],
    mistakes: [
      {
        id: 'ton-for-total', title: 'TON for a running total', wrong: 'XIC(Spindle_Run) TON(Run_T, 4000)\nXIC(Run_T.DN) OTE(Service_Due)', fix: 'XIC(Spindle_Run) RTO(Run_T, 4000)\nXIC(Run_T.DN) OTE(Service_Due)\nXIC(Service_Reset) RES(Run_T)',
        devices: [toggle('Spindle_Run', 'Spindle running'), push('Service_Reset', 'Service done (reset)')], show: ['Run_T.ACC', 'Service_Due'],
        script: [
          { set: { Spindle_Run: 1 }, hold: 2500, say: 'Runs 2.5 s' },
          { set: { Spindle_Run: 0 }, hold: 1000, say: 'Stopped 1 s' },
          { set: { Spindle_Run: 1 }, hold: 1600, expect: { Service_Due: 1 }, say: 'Runs 1.6 s more: 4.1 s in total' },
        ],
        why: 'Every stop resets a TON, so it measures the longest single run, not the total. A spindle that runs in short cycles would never be flagged for service.',
      },
      {
        id: 'ton-for-runon', title: 'TON for a run-on', wrong: 'XIC(Motor_Run) TON(Fan_T, 5000)\nXIC(Fan_T.DN) OTE(Fan)', fix: 'XIC(Motor_Run) TOF(Fan_T, 5000)\nXIC(Fan_T.DN) OTE(Fan)',
        devices: [toggle('Motor_Run', 'Motor running')], show: ['Fan'],
        script: [
          { set: { Motor_Run: 1 }, hold: 1000, expect: { Fan: 1 }, say: 'Motor running 1 s' },
          { set: { Motor_Run: 0 }, hold: 3000, expect: { Fan: 1 }, say: 'Motor stopped 3 s ago' },
        ],
        why: 'A TON delays the start: the fan would start 5 s after the motor and stop the instant the motor stops, the opposite of a run-on.',
      },
    ],
    tasks: [
      {
        id: 'timers-t1', task: 'Horn sounds if Door_Open stays on for 4 s, and goes quiet as soon as the door closes.', hint: 'An on-delay timer and its done bit.',
        solution: 'XIC(Door_Open) TON(Door_T, 4000)\nXIC(Door_T.DN) OTE(Horn)', devices: [toggle('Door_Open', 'Door open')], show: ['Horn'],
        script: [
          { set: { Door_Open: 1 }, hold: 3500, expect: { Horn: 0 }, say: 'Open 3.5 s' },
          { set: { Door_Open: 0 }, hold: 100, expect: { Horn: 0 }, say: 'Closed briefly' },
          { set: { Door_Open: 1 }, hold: 4100, expect: { Horn: 1 }, say: 'Open 4.1 s' },
          { set: { Door_Open: 0 }, expect: { Horn: 0 }, say: 'Closed' },
        ],
      },
      {
        id: 'timers-t2', task: 'Exhaust runs while Oven_On is on and keeps running 6 s after it turns off.', hint: 'Which timer’s done bit is on while the rung is true and for the preset afterwards?',
        solution: 'XIC(Oven_On) TOF(Exhaust_T, 6000)\nXIC(Exhaust_T.DN) OTE(Exhaust)', devices: [toggle('Oven_On', 'Oven on')], show: ['Exhaust'],
        script: [
          { set: { Oven_On: 1 }, hold: 500, expect: { Exhaust: 1 }, say: 'Oven on' },
          { set: { Oven_On: 0 }, hold: 5500, expect: { Exhaust: 1 }, say: 'Oven off 5.5 s' },
          { hold: 700, expect: { Exhaust: 0 }, say: 'Oven off 6.2 s' },
        ],
      },
      {
        id: 'timers-t3', task: 'While Alarm is on, Beacon flashes: about 0.5 s on, 0.5 s off, starting on. Beacon is off when Alarm is off.', hint: 'Two TONs that reset each other: one times the on part, its done bit starts the second, and the second’s done bit resets the first.',
        solution: 'XIC(Alarm) XIO(Off_T.DN) TON(On_T, 500)\nXIC(On_T.DN) TON(Off_T, 500)\nXIC(Alarm) XIO(On_T.DN) OTE(Beacon)', devices: [toggle('Alarm', 'Alarm active')], show: ['Beacon'],
        script: [
          { set: { Alarm: 1 }, hold: 250, expect: { Beacon: 1 }, say: '0.25 s' },
          { hold: 500, expect: { Beacon: 0 }, say: '0.75 s' },
          { hold: 500, expect: { Beacon: 1 }, say: '1.25 s' },
          { hold: 500, expect: { Beacon: 0 }, say: '1.75 s' },
          { set: { Alarm: 0 }, hold: 100, expect: { Beacon: 0 }, say: 'Alarm cleared' },
        ],
      },
    ],
    checks: [
      { id: 'timers-c1', q: 'TON preset 3000. The rung is true for 2 s, false for one scan, then true for 2 s. Is DN on?', options: ['Yes: 4 s is more than 3 s', 'No: the false scan cleared ACC, so it only reached 2 s', 'Only on controllers with retentive memory', 'The timer faults'], answer: 1, why: 'TON is non-retentive: any false scan clears ACC and the bits.' },
      { id: 'timers-c2', q: 'A fan must keep running 30 s after the motor stops. Which timer?', options: ['TON', 'TOF', 'RTO', 'CTU'], answer: 1, why: 'TOF’s done bit stays on for the preset after its rung goes false.' },
    ],
    interview: [
      { q: 'TON, TOF and RTO: what is the difference?', a: 'TON times while its rung is true and resets on any false scan; TOF keeps DN on for the preset after its rung goes false; RTO times like TON but keeps its accumulated value when the rung goes false, until a RES.' },
      { q: 'How would you make a light flash?', a: 'Two TONs that reset each other (one for the on time, one for the off time), or one self-resetting timer and a comparison on its ACC. Drive the light from the timer bits on one rung with the alarm condition.' },
    ],
    onTheJob: 'Timers are everywhere: jam and stall detection, valve and motor feedback checks (“commanded on but no feedback within 2 s”), purge and warm-up times, run-on, and running hours for maintenance. Most “nuisance” alarms are a missing or too-short on-delay.',
    cites: [C.ton, C.tof, C.rto],
  },
  {
    id: 'counters', concept: 'automation.plc-counter', title: 'Counters, edges and one-shots', level: 'Core', minutes: 20,
    goal: 'Count events (not scans), reset counts, and make any instruction fire once per event.',
    intuition: 'A sensor stays on for as long as a part is in front of it: dozens or hundreds of scans. A counter must count the moment it turns on, the rising edge, once. CTU does that for you; for anything else (adding to a total, starting a step) you put a one-shot in front.',
    analogy: 'A turnstile clicker that ticks once per person, however long they stand in it.',
    model: [
      'CTU adds 1 each time its rung goes from false to true; CTD subtracts 1. They can share one counter tag (in and out of a buffer).',
      'DN is on whenever ACC ≥ PRE. The counter keeps counting past the preset; RES clears ACC and DN.',
      'A plain arithmetic rung (ADD) runs on every true scan, so it counts scans, not parts.',
      'ONS passes power for one scan when its rung goes from false to true, which makes ADD, MOV or a step change happen once per event.',
      'Prescan sets the counter’s CU bit and the one-shot’s storage bit, so an input already on at startup is not counted as an event.',
    ],
    syntax: 'XIC(PE) CTU(Box_C, 6)                     // count up to a preset of 6\nXIC(Box_C.DN) OTE(Box_Full)               // done at 6 or more\nXIC(Reset_PB) RES(Box_C)                  // back to 0\nXIC(PE) ONS(PE_ONS) ADD(Total, 1, Total)  // once per rising edge',
    examples: [
      {
        id: 'ctu-case', title: 'Count up to a preset', question: 'A case holds 6 bottles. Signal when it is full; the packer resets the count.',
        program: '// Count bottles; a case holds 6\nXIC(Bottle_PE) CTU(Case_C, 6)\nXIC(Case_C.DN) OTE(Case_Full)\nXIC(Case_Reset) RES(Case_C)',
        devices: [toggle('Bottle_PE', 'Bottle at photo-eye'), push('Case_Reset', 'Case removed (reset)')], show: ['Case_C.ACC', 'Case_Full'],
        script: [
          ...pulses('Bottle_PE', 5),
          { expect: { 'Case_C.ACC': 5, Case_Full: 0 }, say: 'After 5 bottles (each in view 0.1 s)' },
          ...pulses('Bottle_PE', 1, 400, 100),
          { expect: { 'Case_C.ACC': 6, Case_Full: 1 }, say: 'The 6th bottle stays in view 0.4 s: still counted once' },
          { set: { Case_Reset: 1 }, hold: 100, expect: { 'Case_C.ACC': 0, Case_Full: 0 }, say: 'Case removed: reset' },
          { set: { Case_Reset: 0 }, expect: { 'Case_C.ACC': 0 }, say: 'Release reset' },
        ],
        explain: ['Each bottle is one false-to-true change, however long it stays in view.', 'DN turns on at ACC = PRE.'],
        takeaway: 'CTU counts events, not scans, which is why it can count parts on a slow conveyor.',
      },
      {
        id: 'ons-total', title: 'A one-shot for arithmetic', question: 'Keep a shift total in a number tag.',
        program: '// Add 1 to the shift total on each new part\nXIC(Part_PE) ONS(Part_ONS) ADD(Shift_Total, 1, Shift_Total)',
        devices: [toggle('Part_PE', 'Part at photo-eye')], show: ['Shift_Total'],
        script: [...pulses('Part_PE', 3, 200, 100), { expect: { Shift_Total: 3 }, say: 'Three parts, each in view 0.2 s (20 scans)' }],
        explain: ['ONS lets power through for the first scan only.', 'ADD runs once per part instead of 20 times.'],
        takeaway: 'Any instruction that should happen once per event (ADD, MOV, a step change) needs an edge: a one-shot or a counter.',
      },
      {
        id: 'ctu-ctd', title: 'Up and down on one counter', question: 'Track how many parts are in a buffer between two machines.',
        program: '// Parts in the buffer: up on entry, down on exit\nXIC(In_PE) CTU(Buffer_C, 4)\nXIC(Out_PE) CTD(Buffer_C, 4)\nXIC(Buffer_C.DN) OTE(Buffer_Full)',
        devices: [toggle('In_PE', 'Part enters'), toggle('Out_PE', 'Part leaves')], show: ['Buffer_C.ACC', 'Buffer_Full'],
        script: [
          ...pulses('In_PE', 3), { expect: { 'Buffer_C.ACC': 3, Buffer_Full: 0 }, say: '3 in' },
          ...pulses('Out_PE', 1), { expect: { 'Buffer_C.ACC': 2 }, say: '1 out' },
          ...pulses('In_PE', 2), { expect: { 'Buffer_C.ACC': 4, Buffer_Full: 1 }, say: '2 more in: full' },
        ],
        explain: ['CTU and CTD share Buffer_C.', 'DN means the buffer holds at least the preset.'],
        takeaway: 'A full buffer can stop the upstream machine (blocking), an empty one starves the downstream machine: the counter is the WIP number from the factory-physics lessons.',
      },
    ],
    mistakes: [
      {
        id: 'add-every-scan', title: 'Counting scans instead of parts', wrong: 'XIC(Part_PE) ADD(Shift_Total, 1, Shift_Total)', fix: 'XIC(Part_PE) ONS(Part_ONS) ADD(Shift_Total, 1, Shift_Total)',
        devices: [toggle('Part_PE', 'Part at photo-eye')], show: ['Shift_Total'],
        script: [...pulses('Part_PE', 1, 200, 100), { expect: { Shift_Total: 1 }, say: 'One part in view for 0.2 s' }],
        why: 'The rung is true for every scan the part is in view (20 scans at 10 ms), and ADD runs every one of them: one part adds 20.',
      },
      {
        id: 'equ-for-done', title: 'EQU instead of the done bit', wrong: 'XIC(Bottle_PE) CTU(Case_C, 6)\nEQU(Case_C.ACC, 6) OTE(Case_Full)\nXIC(Case_Reset) RES(Case_C)', fix: 'XIC(Bottle_PE) CTU(Case_C, 6)\nXIC(Case_C.DN) OTE(Case_Full)\nXIC(Case_Reset) RES(Case_C)',
        devices: [toggle('Bottle_PE', 'Bottle at photo-eye'), push('Case_Reset', 'Case removed (reset)')], show: ['Case_C.ACC', 'Case_Full'],
        script: [...pulses('Bottle_PE', 7), { expect: { Case_Full: 1 }, say: 'A 7th bottle arrives before the case is removed' }],
        why: 'The counter keeps counting past its preset. At 7, EQU(…, 6) is false and Case_Full drops while the case is still full. DN stays on for any count at or above the preset.',
      },
    ],
    tasks: [
      {
        id: 'counters-t1', task: 'Count bottles on Bottle_PE. When 12 have passed, turn on Case_Ready. Case_Reset clears the count.', hint: 'CTU with a preset of 12, its done bit, and RES.',
        solution: 'XIC(Bottle_PE) CTU(Case_C, 12)\nXIC(Case_C.DN) OTE(Case_Ready)\nXIC(Case_Reset) RES(Case_C)',
        devices: [toggle('Bottle_PE', 'Bottle at photo-eye'), push('Case_Reset', 'Reset')], show: ['Case_Ready'],
        script: [
          ...pulses('Bottle_PE', 11), { expect: { Case_Ready: 0 }, say: '11 bottles' },
          ...pulses('Bottle_PE', 1), { expect: { Case_Ready: 1 }, say: '12 bottles' },
          { set: { Case_Reset: 1 }, hold: 100, expect: { Case_Ready: 0 }, say: 'Reset' },
          { set: { Case_Reset: 0 }, say: 'Release reset' },
          ...pulses('Bottle_PE', 1), { expect: { Case_Ready: 0 }, say: '1 bottle in the new case' },
        ],
      },
      {
        id: 'counters-t2', task: 'Each time Reject_PE turns on, add 1 to the number tag Reject_Count at that moment (not when the part leaves), however long the part stays in view.', hint: 'ONS in front of ADD.',
        solution: 'XIC(Reject_PE) ONS(Reject_ONS) ADD(Reject_Count, 1, Reject_Count)', devices: [toggle('Reject_PE', 'Reject at photo-eye')], show: ['Reject_Count'],
        // Checked while each reject is in view and after it leaves: the count must rise on the way in, once.
        script: [150, 150, 150, 600].flatMap((on, k): Step[] => [
          { set: { Reject_PE: 1 }, hold: on, expect: { Reject_Count: k + 1 }, say: `Reject ${k + 1} in view for ${on / 1000} s` },
          { set: { Reject_PE: 0 }, hold: 100, expect: { Reject_Count: k + 1 }, say: `Reject ${k + 1} gone` },
        ]),
      },
      {
        id: 'counters-t3', task: 'Batch of 5: Conveyor runs while Run_Cmd is on and fewer than 5 parts have passed Part_PE. Batch_Reset starts a new batch.', hint: 'Count with CTU; run while its done bit is off.',
        solution: 'XIC(Part_PE) CTU(Batch_C, 5)\nXIC(Run_Cmd) XIO(Batch_C.DN) OTE(Conveyor)\nXIC(Batch_Reset) RES(Batch_C)',
        devices: [toggle('Run_Cmd', 'Run command'), toggle('Part_PE', 'Part at photo-eye'), push('Batch_Reset', 'New batch')], show: ['Conveyor'],
        script: [
          { set: { Run_Cmd: 1 }, expect: { Conveyor: 1 }, say: 'Run' },
          ...pulses('Part_PE', 4), { expect: { Conveyor: 1 }, say: '4 parts' },
          ...pulses('Part_PE', 1), { expect: { Conveyor: 0 }, say: '5 parts: batch complete' },
          { set: { Batch_Reset: 1 }, hold: 100, expect: { Conveyor: 1 }, say: 'New batch' },
          { set: { Batch_Reset: 0 }, expect: { Conveyor: 1 }, say: 'Release' },
        ],
      },
    ],
    checks: [
      { id: 'counters-c1', q: 'A part sits in front of the photo-eye for 2 s; the scan is 10 ms. How many does CTU count?', options: ['1', '200', '2', '0'], answer: 0, why: 'CTU counts the false-to-true change, once.' },
      { id: 'counters-c2', q: 'A CTU has preset 6 and the 7th part arrives. What happens?', options: ['ACC stops at 6', 'ACC becomes 7 and DN stays on', 'ACC wraps to 0', 'DN turns off'], answer: 1, why: 'Logix counters keep counting past the preset; DN stays on while ACC ≥ PRE.' },
    ],
    interview: [
      { q: 'Why does a counter count edges and not scans?', a: 'An input stays on for many scans. Counting scans would count one part dozens of times, so CTU counts only the false-to-true transition. For other instructions, use a one-shot (ONS).' },
      { q: 'How would you track parts in a buffer between two machines?', a: 'CTU on the entry sensor and CTD on the exit sensor, sharing one counter; compare ACC with full and empty levels to block or starve the neighbours.' },
    ],
    onTheJob: 'Counters drive batch sizes, case packing, preventive-maintenance cycles and the production counts on an HMI. When a count drifts from reality, look for missed edges (a pulse shorter than the scan), double counting (bounce, two sensors) or a reset at the wrong time.',
    cites: [C.ctu, C.ons],
  },
  {
    id: 'sequence', concept: 'automation.plc', title: 'Sequences: steps, transitions and watchdogs', level: 'Applied', minutes: 30,
    goal: 'Build a machine sequence as numbered steps, make each step change happen once, and catch a step that never finishes.',
    intuition: 'Most machines do things in order: clamp, drill, unclamp; fill, mix, drain. Keep one number tag that says which step you are in. Each step has one exit condition, and every output is simply “on in these steps”. A timer per step catches the step that hangs, which is where most real faults show up.',
    analogy: 'A recipe card with numbered steps and a finger on the current one: you only move the finger when the step is done.',
    model: [
      'One number tag (Step) holds the current step. A transition rung is EQU(Step, n), the exit condition, then MOV(n+1, Step).',
      'Drive each output once, with OTE, from the steps it belongs to: [EQU(Step,1), EQU(Step,2)] OTE(Clamp). Outputs then turn off by themselves when the step changes.',
      'A held input lasts many scans, and rungs run in order within a scan: a step can advance twice in one scan if the next step’s condition is also true. Use one-shots, distinct conditions, or transition rungs in reverse order.',
      'A watchdog TON in each step (“filling should take under 5 s”) latches a fault and sends the sequence to a safe step.',
      'A stop or fault rung placed after the transitions has the last word in the scan.',
      'IEC 61131-3’s Sequential Function Chart (SFC) is a graphical way to write the same structure: steps, transitions and actions.',
    ],
    syntax: 'EQU(Step, 0) XIC(Start_PB) MOV(1, Step)      // transition 0 → 1\nEQU(Step, 1) TON(Step1_WD, 5000)              // watchdog for step 1\nEQU(Step, 1) OTE(Fill_Valve)                  // output for step 1',
    examples: [
      {
        id: 'tank', title: 'Fill, mix, drain', question: 'A mixing tank: fill to high level, mix for 3 s, drain until the low-level switch clears. Stop returns to idle at any time.',
        program: '// Step 0 idle → 1 when Start is pressed\nEQU(Step, 0) XIC(Start_PB) MOV(1, Step)\n// Step 1 fill → 2 at high level\nEQU(Step, 1) XIC(Level_High) MOV(2, Step)\n// Step 2 mix for 3 s → 3\nEQU(Step, 2) TON(Mix_T, 3000)\nEQU(Step, 2) XIC(Mix_T.DN) MOV(3, Step)\n// Step 3 drain → 0 when the low-level switch clears\nEQU(Step, 3) XIO(Level_Low) MOV(0, Step)\n// Stop (NC) returns to idle; after the transitions, so it wins\nXIO(Stop_PB) MOV(0, Step)\n// Outputs: one OTE each, from the step number\nEQU(Step, 1) OTE(Fill_Valve)\nEQU(Step, 2) OTE(Mixer)\nEQU(Step, 3) OTE(Drain_Valve)',
        devices: [START, STOP, toggle('Level_Low', 'Level above low switch'), toggle('Level_High', 'Level at high switch')], show: ['Step', 'Fill_Valve', 'Mixer', 'Drain_Valve'],
        script: [
          { set: { Start_PB: 1 }, hold: 200, expect: { Step: 1, Fill_Valve: 1 }, say: 'Press Start: filling' },
          { set: { Start_PB: 0, Level_Low: 1 }, hold: 500, expect: { Step: 1 }, say: 'Level passes the low switch' },
          { set: { Level_High: 1 }, hold: 100, expect: { Step: 2, Fill_Valve: 0, Mixer: 1 }, say: 'High level: mixing' },
          { hold: 3000, expect: { Step: 3, Mixer: 0, Drain_Valve: 1 }, say: '3 s later: draining' },
          { set: { Level_High: 0 }, hold: 500, expect: { Step: 3 }, say: 'Level drops below high' },
          { set: { Level_Low: 0 }, expect: { Step: 0, Drain_Valve: 0 }, say: 'Low switch clears: idle' },
          { set: { Start_PB: 1 }, hold: 100, expect: { Step: 1, Fill_Valve: 1 }, say: 'Start again' },
          { set: { Start_PB: 0, Stop_PB: 1 }, expect: { Step: 0, Fill_Valve: 0 }, say: 'Stop: back to idle' },
        ],
        explain: ['Each transition rung checks the step number and one condition.', 'Outputs are OTEs driven by the step, so each turns off when its step ends.'],
        takeaway: 'Seven rungs of transitions and three of outputs describe the whole machine, and anyone can see which step it is stuck in from one number.',
      },
      {
        id: 'watchdog', title: 'A watchdog for a step that hangs', question: 'Filling should take under 5 s. If it doesn’t, latch a fault, stop filling, and refuse to start until the fault is reset.',
        program: 'EQU(Step, 0) XIC(Start_PB) MOV(1, Step)\nEQU(Step, 1) XIC(Level_High) MOV(2, Step)\n// Watchdog: filling should take under 5 s\nEQU(Step, 1) TON(Fill_WD, 5000)\nXIC(Fill_WD.DN) OTL(Fill_Fault)\n// A latched fault holds the sequence in step 0\nXIC(Fill_Fault) MOV(0, Step)\nXIC(Fault_Reset) OTU(Fill_Fault)\nEQU(Step, 1) OTE(Fill_Valve)',
        devices: [START, toggle('Level_High', 'Level at high switch'), push('Fault_Reset', 'Fault reset')], show: ['Step', 'Fill_Valve', 'Fill_Fault'],
        script: [
          { set: { Start_PB: 1 }, hold: 200, expect: { Step: 1, Fill_Valve: 1 }, say: 'Start: filling' },
          { set: { Start_PB: 0 }, hold: 5000, expect: { Fill_Fault: 1, Step: 0, Fill_Valve: 0 }, say: 'High level never arrives: 5 s watchdog' },
          { set: { Start_PB: 1 }, hold: 200, expect: { Step: 0 }, say: 'Start pressed: refused while faulted' },
          { set: { Start_PB: 0, Fault_Reset: 1 }, hold: 100, expect: { Fill_Fault: 0 }, say: 'Fault reset' },
          { set: { Fault_Reset: 0, Start_PB: 1 }, hold: 100, expect: { Step: 1, Fill_Valve: 1 }, say: 'Start works again' },
        ],
        explain: ['The watchdog only runs in step 1 and resets when the step changes.', 'The fault is latched, so it stays until someone resets it.'],
        takeaway: 'A watchdog per step turns “the machine just stopped” into “step 1 timed out: high-level switch never made”, which is where a technician starts.',
      },
    ],
    mistakes: [
      {
        id: 'seq-double-jump', title: 'One press, three steps', wrong: 'EQU(Step, 0) XIC(Next_PB) MOV(1, Step)\nEQU(Step, 1) XIC(Next_PB) MOV(2, Step)\nEQU(Step, 2) XIC(Next_PB) MOV(3, Step)',
        fix: 'XIC(Next_PB) ONS(Next_ONS) OTE(Next)\n// Transitions in reverse order, so a step can’t advance twice in one scan\nEQU(Step, 2) XIC(Next) MOV(3, Step)\nEQU(Step, 1) XIC(Next) MOV(2, Step)\nEQU(Step, 0) XIC(Next) MOV(1, Step)',
        devices: [push('Next_PB', 'Next')], show: ['Step'],
        script: [
          { set: { Next_PB: 1 }, hold: 200, expect: { Step: 1 }, say: 'Press Next once (0.2 s)' },
          { set: { Next_PB: 0 }, hold: 200, expect: { Step: 1 }, say: 'Release' },
          { set: { Next_PB: 1 }, hold: 200, expect: { Step: 2 }, say: 'Press again' },
          { set: { Next_PB: 0 }, hold: 200, expect: { Step: 2 }, say: 'Release' },
        ],
        why: 'In the very first scan of the press, rung 0 moves to step 1, then rung 1 sees step 1 with the button still on and moves to step 2, then rung 2 moves to 3. The one-shot limits each press to one scan, and reversing the transition rungs stops a step from advancing twice in that scan.',
      },
      {
        id: 'seq-latched-output', title: 'Latching an output inside a step', wrong: 'EQU(Step, 0) XIC(Start_PB) MOV(1, Step)\nEQU(Step, 1) XIC(Level_High) MOV(2, Step)\nEQU(Step, 1) OTL(Fill_Valve)\nEQU(Step, 2) OTE(Mixer)',
        fix: 'EQU(Step, 0) XIC(Start_PB) MOV(1, Step)\nEQU(Step, 1) XIC(Level_High) MOV(2, Step)\nEQU(Step, 1) OTE(Fill_Valve)\nEQU(Step, 2) OTE(Mixer)',
        devices: [START, toggle('Level_High', 'Level at high switch')], show: ['Step', 'Fill_Valve', 'Mixer'],
        script: [
          { set: { Start_PB: 1 }, hold: 100, expect: { Step: 1, Fill_Valve: 1 }, say: 'Start: filling' },
          { set: { Start_PB: 0, Level_High: 1 }, hold: 100, expect: { Step: 2, Fill_Valve: 0, Mixer: 1 }, say: 'High level: mixing' },
        ],
        why: 'Nothing unlatches the valve when the sequence leaves step 1, so the tank overfills while mixing. With an OTE per output driven by the step number, every output turns off when its step ends, whatever path left the step.',
      },
    ],
    tasks: [
      {
        id: 'seq-t1', task: 'Use a number tag Step. Step 0: idle. Start_PB → step 1: Clamp on. When Clamp_Closed comes on → step 2: Clamp and Drill on for 2 s, then back to step 0.',
        hint: 'Three transitions (one of them needs a TON in step 2), then one OTE per output from the step numbers.',
        solution: 'EQU(Step, 0) XIC(Start_PB) MOV(1, Step)\nEQU(Step, 1) XIC(Clamp_Closed) MOV(2, Step)\nEQU(Step, 2) TON(Drill_T, 2000)\nEQU(Step, 2) XIC(Drill_T.DN) MOV(0, Step)\n[EQU(Step, 1), EQU(Step, 2)] OTE(Clamp)\nEQU(Step, 2) OTE(Drill)',
        devices: [START, toggle('Clamp_Closed', 'Clamp closed')], show: ['Step', 'Clamp', 'Drill'],
        script: [
          { set: { Start_PB: 1 }, hold: 100, expect: { Step: 1, Clamp: 1, Drill: 0 }, say: 'Start' },
          { set: { Start_PB: 0, Clamp_Closed: 1 }, hold: 100, expect: { Step: 2, Clamp: 1, Drill: 1 }, say: 'Clamp closed: drilling' },
          { hold: 1500, expect: { Step: 2, Drill: 1 }, say: '1.6 s into drilling' },
          { hold: 600, expect: { Step: 0, Clamp: 0, Drill: 0 }, say: '2.2 s: done, back to idle' },
          { set: { Clamp_Closed: 0 }, expect: { Step: 0 }, say: 'Clamp opens' },
        ],
      },
      {
        id: 'seq-t2', task: 'Extend the clamp/drill sequence with a watchdog: if Clamp_Closed doesn’t come on within 3 s of entering step 1, latch Clamp_Fault and return to step 0. Start is refused while Clamp_Fault is on; Fault_Reset clears it.',
        hint: 'A TON enabled by EQU(Step, 1), its done bit latches the fault, and a rung sends a faulted sequence to step 0.',
        solution: 'EQU(Step, 0) XIC(Start_PB) XIO(Clamp_Fault) MOV(1, Step)\nEQU(Step, 1) XIC(Clamp_Closed) MOV(2, Step)\nEQU(Step, 1) TON(Clamp_WD, 3000)\nXIC(Clamp_WD.DN) OTL(Clamp_Fault)\nXIC(Clamp_Fault) MOV(0, Step)\nEQU(Step, 2) TON(Drill_T, 2000)\nEQU(Step, 2) XIC(Drill_T.DN) MOV(0, Step)\nXIC(Fault_Reset) OTU(Clamp_Fault)\n[EQU(Step, 1), EQU(Step, 2)] OTE(Clamp)\nEQU(Step, 2) OTE(Drill)',
        devices: [START, toggle('Clamp_Closed', 'Clamp closed'), push('Fault_Reset', 'Fault reset')], show: ['Step', 'Clamp', 'Drill', 'Clamp_Fault'],
        script: [
          { set: { Start_PB: 1 }, hold: 100, expect: { Step: 1, Clamp: 1 }, say: 'Start' },
          { set: { Start_PB: 0 }, hold: 3100, expect: { Clamp_Fault: 1, Step: 0, Clamp: 0 }, say: 'Clamp never closes: fault after 3 s' },
          { set: { Start_PB: 1 }, hold: 100, expect: { Step: 0 }, say: 'Start refused while faulted' },
          { set: { Start_PB: 0, Fault_Reset: 1 }, hold: 100, expect: { Clamp_Fault: 0 }, say: 'Reset the fault' },
          { set: { Fault_Reset: 0, Start_PB: 1 }, hold: 100, expect: { Step: 1, Clamp: 1 }, say: 'Start' },
          { set: { Start_PB: 0, Clamp_Closed: 1 }, hold: 100, expect: { Step: 2, Drill: 1, Clamp_Fault: 0 }, say: 'Clamp closes in time' },
          { hold: 2100, expect: { Step: 0, Drill: 0 }, say: 'Drilling done' },
        ],
      },
    ],
    checks: [
      { id: 'seq-c1', q: 'Why drive outputs with EQU(Step, n) OTE(…) rather than an OTL in each step?', options: ['OTE runs faster', 'An OTE output turns off by itself when the step changes; a latch has to be unlatched on every way out of the step', 'OTL can’t follow a MOV', 'There is no difference'], answer: 1, why: 'One OTE per output, driven by the step number, can’t be left on by an unexpected exit (stop, fault, skipped step).' },
      { id: 'seq-c2', q: 'Transitions 0→1, 1→2 and 2→3 each use XIC(Next_PB), written in that order. Next is held for 0.2 s with a 10 ms scan. Where does the sequence end up?', options: ['Step 1', 'Step 2', 'Step 3', 'Step 20'], answer: 2, why: 'All three transitions fire in the first scan of the press, top to bottom.' },
    ],
    interview: [
      { q: 'How do you structure a machine sequence in ladder?', a: 'One step number; one transition rung per step (current step plus exit condition, MOV the next step); outputs driven once each from the steps they belong to; a watchdog timer per step that latches a fault and sends the sequence to a safe step; stop and fault handling after the transitions. SFC is the graphical equivalent in IEC 61131-3.' },
      { q: 'A sequence occasionally skips a step. What do you check?', a: 'Whether two consecutive exit conditions can be true in the same scan (a held button, a sensor that is already on), so both transitions fire top to bottom in one scan. Use one-shots, reverse the order of transition rungs, or make the conditions distinct.' },
    ],
    onTheJob: 'Sequence logic is where an IE and a controls engineer meet: cycle time is the sum of the steps, and a step that waits for a slow sensor or a long timer is a bottleneck you can measure. Logging step times from the PLC gives a time study for free.',
    cites: [C.langs, C.ons],
  },
  {
    id: 'debug', concept: 'automation.ladder-logic', title: 'Troubleshooting a running program', level: 'Applied', minutes: 25,
    goal: 'Find why an output is off by reading the rung online, and fix the cause instead of bypassing it.',
    intuition: 'Online, the programming software highlights every instruction whose condition is true and shows where power flows. Start at the output that isn’t doing what you expect and walk left: the first instruction that has power coming in but doesn’t pass it on is your lead. Then go and look at the real device that bit comes from.',
    analogy: 'Checking a string of holiday lights by finding the first bulb where the current stops.',
    model: [
      'Is the output instruction true? If yes, the problem is after the PLC: output module, fuse, wiring, contactor, overload, the motor itself.',
      'If not, find the first instruction on the rung that receives power and doesn’t pass it on.',
      'Follow that bit: an input (check the device and its indicator light with the drawings), or an internal bit (cross-reference to find the rung that writes it).',
      'Look for the classic causes: a latched alarm nobody reset, a double coil, a timer that never finishes, a condition waiting in a sequence step.',
      'Don’t remove a condition to “get it running”: it hides the fault and may remove a protection. Fix the cause, then record what you found.',
    ],
    syntax: '// Online view in the studio: green = true instruction or energized wire\n[XIC(Start_PB), XIC(Conveyor)] XIC(Stop_PB) XIO(Jam_Alarm) OTE(Conveyor)',
    examples: [
      {
        id: 'debug-jam', title: 'A conveyor that won’t restart', question: 'A jam was cleared, but the conveyor won’t start. Why?',
        program: '// Conveyor: start/stop, blocked by a latched jam alarm\n[XIC(Start_PB), XIC(Conveyor)] XIC(Stop_PB) XIO(Jam_Alarm) OTE(Conveyor)\n// Jam: photo-eye blocked for 3 s\nXIC(PE_Blocked) TON(Jam_T, 3000)\nXIC(Jam_T.DN) OTL(Jam_Alarm)\n// Reset only works once the jam is cleared\nXIC(Jam_Reset) XIO(PE_Blocked) OTU(Jam_Alarm)',
        devices: [START, STOP, toggle('PE_Blocked', 'Photo-eye blocked'), push('Jam_Reset', 'Jam reset')], show: ['Jam_Alarm', 'Conveyor'],
        script: [
          { set: { Start_PB: 1 }, hold: 200, expect: { Conveyor: 1 }, say: 'Start' },
          { set: { Start_PB: 0, PE_Blocked: 1 }, hold: 3100, expect: { Jam_Alarm: 1, Conveyor: 0 }, say: 'A box jams for 3 s: alarm, conveyor stops' },
          { set: { PE_Blocked: 0 }, hold: 500, expect: { Jam_Alarm: 1 }, say: 'Jam cleared by hand' },
          { set: { Start_PB: 1 }, hold: 200, expect: { Conveyor: 0 }, say: 'Start pressed: nothing' },
          { set: { Start_PB: 0, Jam_Reset: 1 }, hold: 100, expect: { Jam_Alarm: 0 }, say: 'Jam reset' },
          { set: { Jam_Reset: 0, Start_PB: 1 }, hold: 200, expect: { Conveyor: 1 }, say: 'Start works' },
        ],
        explain: ['After the jam is cleared, XIO(Jam_Alarm) is still false: the alarm is latched.', 'Online, every other instruction on rung 0 is highlighted; that one isn’t.'],
        takeaway: 'Latched alarms are deliberate (someone must acknowledge the jam), but they are also the most common reason a machine “won’t start” after a fault.',
      },
    ],
    puzzles: [
      {
        id: 'puz-jam', story: 'The jam has been cleared and the operator is pressing Start. Which instruction on rung 0 stops the power?',
        program: '[XIC(Start_PB), XIC(Conveyor)] XIC(Stop_PB) XIO(Jam_Alarm) OTE(Conveyor)\nXIC(PE_Blocked) TON(Jam_T, 3000)\nXIC(Jam_T.DN) OTL(Jam_Alarm)\nXIC(Jam_Reset) XIO(PE_Blocked) OTU(Jam_Alarm)',
        devices: [START, STOP, toggle('PE_Blocked', 'Photo-eye blocked'), push('Jam_Reset', 'Jam reset')], rung: 0,
        setup: [{ set: { PE_Blocked: 1 }, hold: 3100, say: 'Jam' }, { set: { PE_Blocked: 0 }, hold: 100, say: 'Cleared' }, { set: { Start_PB: 1 }, say: 'Start held' }],
      },
      {
        id: 'puz-pump', story: 'The tank is low and the pump is in Auto, but it isn’t running. The overload relay contact is wired NC (it opens when the overload trips). Which instruction stops the power?',
        program: 'XIC(Auto_Mode) [XIC(Level_Low), XIC(Pump) XIO(Level_High)] XIC(Overload_OK) OTE(Pump)',
        devices: [toggle('Auto_Mode', 'Auto mode'), toggle('Level_Low', 'Level low'), toggle('Level_High', 'Level high'), toggle('Overload_OK', 'Overload tripped (NC)', 'NC')], rung: 0,
        setup: [{ set: { Auto_Mode: 1, Level_Low: 1, Overload_OK: 1 }, say: 'Auto, level low, overload tripped' }],
      },
      {
        id: 'puz-press', story: 'The press door closed half a second ago and the operator is holding Cycle. Which instruction stops the power on rung 1?',
        program: 'XIC(Door_Closed) TON(Door_T, 1000)\nXIC(Door_Closed) XIC(Door_T.DN) XIC(Cycle_PB) OTE(Press_Cycle)',
        devices: [toggle('Door_Closed', 'Door closed'), push('Cycle_PB', 'Cycle')], rung: 1,
        setup: [{ set: { Door_Closed: 1 }, hold: 500, say: 'Door closed 0.5 s' }, { set: { Cycle_PB: 1 }, say: 'Cycle held' }],
      },
    ],
    mistakes: [
      {
        id: 'debug-bypass', title: '“Fixing” it by deleting a condition', wrong: '[XIC(Start_PB), XIC(Conveyor)] XIC(Stop_PB) OTE(Conveyor)', fix: '[XIC(Start_PB), XIC(Conveyor)] XIC(Stop_PB) XIC(Guard_Closed) OTE(Conveyor)',
        devices: [START, STOP, toggle('Guard_Closed', 'Guard closed')], show: ['Conveyor'],
        script: [
          { set: { Start_PB: 1 }, hold: 200, expect: { Conveyor: 0 }, say: 'Guard open, Start pressed' },
          { set: { Start_PB: 0, Guard_Closed: 1 }, hold: 100, say: 'Guard closed' },
          { set: { Start_PB: 1 }, hold: 200, expect: { Conveyor: 1 }, say: 'Start' },
        ],
        why: 'The conveyor wouldn’t start because Guard_Closed was off; deleting the instruction makes it start with the guard open. Find out why the bit is off (the switch, its wiring, or a guard that really is open) and fix that.',
      },
      {
        id: 'debug-ote-latch', title: 'A lamp test that erases a latched fault', wrong: 'XIC(Fault_In) OTL(Fault_Lamp)\nXIC(Ack_PB) OTU(Fault_Lamp)\nXIC(Lamp_Test) OTE(Fault_Lamp)',
        fix: 'XIC(Fault_In) OTL(Fault_Latched)\nXIC(Ack_PB) OTU(Fault_Latched)\n[XIC(Fault_Latched), XIC(Lamp_Test)] OTE(Fault_Lamp)',
        devices: [toggle('Fault_In', 'Fault input'), push('Ack_PB', 'Acknowledge'), push('Lamp_Test', 'Lamp test')], show: ['Fault_Lamp'],
        script: [
          { set: { Fault_In: 1 }, expect: { Fault_Lamp: 1 }, say: 'Fault' },
          { set: { Fault_In: 0 }, hold: 200, expect: { Fault_Lamp: 1 }, say: 'Fault input clears: the lamp should stay on' },
          { set: { Ack_PB: 1 }, expect: { Fault_Lamp: 0 }, say: 'Acknowledge' },
        ],
        why: 'The OTE on the last rung writes Fault_Lamp every scan, so it erases the latch the moment Fault_In clears. Latch an internal bit and drive the lamp from one rung.',
      },
    ],
    tasks: [
      {
        id: 'debug-t1', task: 'This fill valve never opens. Fill_Valve should open on Fill_PB, stay open, and close when Level_High (a NO float switch, 1 at high level) comes on. Fix the rung.',
        hint: 'Which instruction is true when the tank is NOT at high level?', starter: '[XIC(Fill_PB), XIC(Fill_Valve)] XIC(Level_High) OTE(Fill_Valve)', solution: '[XIC(Fill_PB), XIC(Fill_Valve)] XIO(Level_High) OTE(Fill_Valve)',
        devices: [push('Fill_PB', 'Fill'), toggle('Level_High', 'Level at high switch')], show: ['Fill_Valve'],
        script: [
          { set: { Fill_PB: 1 }, hold: 200, expect: { Fill_Valve: 1 }, say: 'Press Fill' },
          { set: { Fill_PB: 0 }, hold: 500, expect: { Fill_Valve: 1 }, say: 'Release: still filling' },
          { set: { Level_High: 1 }, expect: { Fill_Valve: 0 }, say: 'High level: close' },
          { set: { Level_High: 0 }, hold: 200, expect: { Fill_Valve: 0 }, say: 'Level drops: stays closed' },
          { set: { Fill_PB: 1 }, hold: 200, expect: { Fill_Valve: 1 }, say: 'Press Fill again' },
        ],
      },
      {
        id: 'debug-t2', task: 'Fault_Lamp should latch on when Fault_In comes on and stay on after it clears; Ack_PB turns it off, but only once Fault_In has cleared. The starter never turns the lamp off.',
        hint: 'Add an unlatch rung that needs the acknowledge and a cleared fault.', starter: 'XIC(Fault_In) OTL(Fault_Lamp)', solution: 'XIC(Fault_In) OTL(Fault_Lamp)\nXIC(Ack_PB) XIO(Fault_In) OTU(Fault_Lamp)',
        devices: [toggle('Fault_In', 'Fault input'), push('Ack_PB', 'Acknowledge')], show: ['Fault_Lamp'],
        script: [
          { set: { Fault_In: 1 }, expect: { Fault_Lamp: 1 }, say: 'Fault' },
          { set: { Ack_PB: 1 }, hold: 100, expect: { Fault_Lamp: 1 }, say: 'Acknowledge while the fault is active: stays on' },
          { set: { Ack_PB: 0, Fault_In: 0 }, hold: 100, expect: { Fault_Lamp: 1 }, say: 'Fault clears: still on' },
          { set: { Ack_PB: 1 }, expect: { Fault_Lamp: 0 }, say: 'Acknowledge: off' },
        ],
      },
    ],
    checks: [
      { id: 'debug-c1', q: 'Online, OTE(Motor) is highlighted, but the motor doesn’t turn. Where do you look?', options: ['Change the logic', 'Downstream of the PLC: output module, fuse, wiring, contactor, overload, motor', 'The input card', 'Restart the PLC'], answer: 1, why: 'The program is commanding the output; the fault is in the hardware that should carry it out.' },
      { id: 'debug-c2', q: 'The output instruction is false. What is the quickest way to find out why?', options: ['Find the first instruction that has power coming in but doesn’t pass it on', 'Force the output on', 'Delete rungs until it works', 'Download the program again'], answer: 0, why: 'That instruction names the bit to follow, to a device or to the rung that writes it.' },
    ],
    interview: [
      { q: 'A conveyor won’t start. How would you troubleshoot with the PLC online?', a: 'Find the rung that drives the motor output and see which instruction is false. Follow that bit: for an input, check the field device and its I/O light against the drawings; for an internal bit, cross-reference the rung that writes it (often a latched alarm). Check for faults and forced bits. Fix the cause, don’t delete the condition.' },
    ],
    onTheJob: 'Manufacturing engineers often don’t write PLC code, but they are on the floor when a line stops. Reading the rung online, finding the blocking condition and explaining it to maintenance in one sentence shortens downtime more than any spreadsheet.',
    cites: [C.xio, C.otl],
  },
  {
    id: 'safety', concept: 'automation.safety-relay', title: 'What standard PLC logic is not for: safety', level: 'Applied', minutes: 15,
    goal: 'Know where machine safety functions live, why a reset must not restart a machine, and what standard logic should do around them.',
    intuition: 'An emergency stop or a guard interlock has to work even when the program is wrong, the PLC has crashed or someone has edited a rung. That’s why safety functions are designed separately, to a performance level set by a risk assessment, using safety-rated devices. Standard PLC logic still has a job: report the safety status, drop its own run commands, and demand a deliberate new start.',
    analogy: 'A car’s brakes and airbags aren’t controlled by the radio, even though the dashboard tells you when they have a fault.',
    model: [
      'A safety function (E-stop, guard interlock, light curtain) is a safety-related part of the control system. ISO 13849-1 gives a methodology for designing it; the required performance level comes from the risk assessment for the machine.',
      'Safety functions use safety-rated devices: safety relays, or safety controllers that run a separate safety task. On GuardLogix, safety input tags are frozen at the start of each safety task run.',
      'Standard logic monitors and reports: E-stop pressed, guard open, safety circuit not reset. It also drops its own run commands so the machine stays stopped.',
      'Resetting the safety circuit must not restart the machine: motion needs a new, deliberate start command. Seal-ins on momentary starts do this naturally; maintained selectors and latches don’t.',
      'Never put a safety condition only in standard logic, and never bypass one in logic to keep production going.',
    ],
    syntax: '// Status only: the E-stop itself removes power through safety-rated devices\nXIO(EStop_OK) OTE(EStop_Lamp)\n// The run command needs a new Start after the E-stop is reset\n[XIC(Start_PB), XIC(Motor_Cmd)] XIC(Stop_PB) XIC(EStop_OK) OTE(Motor_Cmd)',
    examples: [
      {
        id: 'no-auto-restart', title: 'No restart on reset', question: 'After an E-stop is pressed and released, does the motor command come back?',
        program: '// Status only: the E-stop itself removes power through safety-rated devices\nXIO(EStop_OK) OTE(EStop_Lamp)\n// The run command needs a new Start after the E-stop is reset\n[XIC(Start_PB), XIC(Motor_Cmd)] XIC(Stop_PB) XIC(EStop_OK) OTE(Motor_Cmd)',
        devices: [START, STOP, push('EStop_OK', 'E-stop status (NC)', 'NC')], show: ['EStop_Lamp', 'Motor_Cmd'],
        script: [
          { set: { Start_PB: 1 }, hold: 200, expect: { Motor_Cmd: 1, EStop_Lamp: 0 }, say: 'Start' },
          { set: { Start_PB: 0, EStop_OK: 1 }, hold: 200, expect: { Motor_Cmd: 0, EStop_Lamp: 1 }, say: 'E-stop pressed' },
          { set: { EStop_OK: 0 }, hold: 500, expect: { Motor_Cmd: 0, EStop_Lamp: 0 }, say: 'E-stop released and reset: nothing starts' },
          { set: { Start_PB: 1 }, hold: 200, expect: { Motor_Cmd: 1 }, say: 'A deliberate new Start' },
        ],
        explain: ['The seal-in drops out when EStop_OK goes to 0.', 'When it returns to 1, nothing re-seals the rung: only Start does.'],
        takeaway: 'The standard program reports the E-stop and refuses to restart by itself. Stopping the motor safely is the safety circuit’s job, not this rung’s.',
      },
    ],
    mistakes: [
      {
        id: 'auto-restart', title: 'A maintained selector restarts the machine', wrong: 'XIC(Run_Sel) XIC(EStop_OK) OTE(Motor_Cmd)', fix: '[XIC(Start_PB), XIC(Motor_Cmd)] XIC(Run_Sel) XIC(EStop_OK) OTE(Motor_Cmd)',
        devices: [toggle('Run_Sel', 'Run selector (maintained)'), START, push('EStop_OK', 'E-stop status (NC)', 'NC')], show: ['Motor_Cmd'],
        script: [
          { set: { Run_Sel: 1, Start_PB: 1 }, hold: 200, expect: { Motor_Cmd: 1 }, say: 'Selector on, Start' },
          { set: { Start_PB: 0, EStop_OK: 1 }, hold: 200, expect: { Motor_Cmd: 0 }, say: 'E-stop pressed' },
          { set: { EStop_OK: 0 }, hold: 200, expect: { Motor_Cmd: 0 }, say: 'E-stop reset: must stay stopped' },
        ],
        why: 'The selector is still in Run, so the command comes back the moment the E-stop is reset: the machine moves without anyone deciding it should. A momentary Start with a seal-in makes the restart deliberate.',
      },
    ],
    tasks: [
      {
        id: 'safety-t1', task: 'Spindle_Cmd: Start_PB (NO) and Stop_PB (NC) with a seal-in. It drops out when Guard_Closed goes to 0 (guard opened), and closing the guard again must not restart it.',
        hint: 'The guard bit goes in series with the stop, outside the branch.', solution: '[XIC(Start_PB), XIC(Spindle_Cmd)] XIC(Stop_PB) XIC(Guard_Closed) OTE(Spindle_Cmd)',
        devices: [START, STOP, toggle('Guard_Closed', 'Guard closed')], show: ['Spindle_Cmd'],
        script: [
          { set: { Guard_Closed: 1, Start_PB: 1 }, hold: 200, expect: { Spindle_Cmd: 1 }, say: 'Guard closed, Start' },
          { set: { Start_PB: 0, Guard_Closed: 0 }, hold: 200, expect: { Spindle_Cmd: 0 }, say: 'Guard opened' },
          { set: { Guard_Closed: 1 }, hold: 500, expect: { Spindle_Cmd: 0 }, say: 'Guard closed again: no restart' },
          { set: { Start_PB: 1 }, hold: 200, expect: { Spindle_Cmd: 1 }, say: 'New Start' },
          { set: { Start_PB: 0, Stop_PB: 'broken' }, expect: { Spindle_Cmd: 0 }, say: 'Stop wire breaks' },
        ],
      },
    ],
    checks: [
      { id: 'safety-c1', q: 'Is the rung XIC(EStop_OK) … OTE(Motor_Cmd) the machine’s emergency stop?', options: ['Yes, if the E-stop is wired NC', 'No: the emergency stop is a safety function built from safety-rated devices to the performance level the risk assessment requires; this rung only reports and coordinates', 'Yes, if the scan is fast enough', 'Only with an OTL'], answer: 1, why: 'Standard logic can be edited, can fault and isn’t validated as a safety function.' },
      { id: 'safety-c2', q: 'An E-stop is released and the safety circuit is reset. What should happen?', options: ['The machine carries on where it stopped', 'Nothing moves until an operator gives a new start command', 'The PLC reboots', 'All outputs latch on'], answer: 1, why: 'A reset makes a start possible; it must not cause one.' },
    ],
    interview: [
      { q: 'Can you implement an E-stop in standard PLC logic?', a: 'Not as the safety function. The E-stop has to remove hazardous energy through safety-rated devices (a safety relay or safety controller) designed and validated to the required performance level from the risk assessment, for example with ISO 13849-1. The standard program monitors it, drops its own commands and requires a new start after reset.' },
    ],
    onTheJob: 'Industrial engineers change layouts, add stations and speed up lines. Each of those can change the risk assessment: a new guard opening, a shorter reach distance, an operator closer to motion. Bring the safety engineer in early, and never accept “we bypassed the interlock to hit the rate”.',
    safety: 'Educational only. These rungs illustrate how standard logic behaves around safety signals; they are not a design for a safety function. Real machine safety needs a risk assessment, safety-rated components and validation by competent people under the standards that apply to the machine.',
    cites: [C.iso, C.async],
  },
]

export const PLC_LESSON_MAP: Record<string, PlcLesson> = Object.fromEntries(PLC_LESSONS.map((l) => [l.id, l]))
