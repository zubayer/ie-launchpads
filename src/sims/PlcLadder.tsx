import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Predict } from './kit'
import { LadderRunner } from '../components/Ladder'
import { PLC_LESSONS } from '../content/plc/course'
import type { Device } from '../lib/ladder'

// The lab runs the same engine as the PLC studio (src/lib/ladder.ts), with the classic circuits ready to edit.
const START: Device = { tag: 'Start_PB', label: 'Start (NO)', kind: 'push' }
const STOP: Device = { tag: 'Stop_PB', label: 'Stop (NC)', kind: 'push', wiring: 'NC' }
const PRESETS: { id: string; name: string; goal: string; program: string; devices: Device[] }[] = [
  { id: 'seal', name: 'Start/stop with seal-in', goal: 'Press Start briefly: the motor keeps running. Stop (wired NC) drops it out. Try cutting the stop wire.',
    program: '// Seal-in: the Motor contact holds the rung after Start is released\n[XIC(Start_PB), XIC(Motor)] XIC(Stop_PB) OTE(Motor)', devices: [START, STOP] },
  { id: 'interlock', name: 'Forward/reverse interlock', goal: 'Run forward, then try reverse: the interlock blocks it until you stop.',
    program: '[XIC(Fwd_PB), XIC(Motor_Fwd)] XIC(Stop_PB) XIO(Motor_Rev) OTE(Motor_Fwd)\n[XIC(Rev_PB), XIC(Motor_Rev)] XIC(Stop_PB) XIO(Motor_Fwd) OTE(Motor_Rev)',
    devices: [{ tag: 'Fwd_PB', label: 'Forward', kind: 'push' }, { tag: 'Rev_PB', label: 'Reverse', kind: 'push' }, STOP] },
  { id: 'timer', name: 'Jam detection (TON)', goal: 'Block the photo-eye: after 3 s the jam alarm comes on. Clear it sooner and the timer resets.',
    program: '// Photo-eye blocked for 3 s means a jam\nXIC(PE_Blocked) TON(Jam_T, 3000)\nXIC(Jam_T.DN) OTE(Jam_Alarm)', devices: [{ tag: 'PE_Blocked', label: 'Photo-eye blocked', kind: 'toggle' }] },
  { id: 'counter', name: 'Box count (CTU)', goal: 'Pass 5 parts through the sensor to fill the box; Reset clears the count. Hold the sensor: it counts once.',
    program: 'XIC(Part_PE) CTU(Box_C, 5)\nXIC(Box_C.DN) OTE(Box_Full)\nXIC(Box_Reset) RES(Box_C)', devices: [{ tag: 'Part_PE', label: 'Part passes sensor', kind: 'push' }, { tag: 'Box_Reset', label: 'Reset count', kind: 'push' }] },
  { id: 'sequence', name: 'Fill, mix, drain sequence', goal: 'Start, then raise the level: watch the step number move from 1 to 3 and back to 0.',
    program: 'EQU(Step, 0) XIC(Start_PB) MOV(1, Step)\nEQU(Step, 1) XIC(Level_High) MOV(2, Step)\nEQU(Step, 2) TON(Mix_T, 3000)\nEQU(Step, 2) XIC(Mix_T.DN) MOV(3, Step)\nEQU(Step, 3) XIO(Level_Low) MOV(0, Step)\nXIO(Stop_PB) MOV(0, Step)\nEQU(Step, 1) OTE(Fill_Valve)\nEQU(Step, 2) OTE(Mixer)\nEQU(Step, 3) OTE(Drain_Valve)',
    devices: [START, STOP, { tag: 'Level_Low', label: 'Level above low switch', kind: 'toggle' }, { tag: 'Level_High', label: 'Level at high switch', kind: 'toggle' }] },
]

export default function PlcLadder() {
  const { id } = useParams()
  const [pid, setPid] = useState(id === 'automation.plc-timer' ? 'timer' : id === 'automation.plc-counter' ? 'counter' : id === 'automation.plc' ? 'sequence' : 'seal')
  const p = PRESETS.find((x) => x.id === pid)!
  const lesson = PLC_LESSONS.find((l) => l.concept === id) ?? PLC_LESSONS[0]
  return (
    <div className="space-y-4">
      <Predict prompt="In the seal-in circuit, what happens if the wire to the Stop button breaks? Is that safe? (Hint: the stop is wired normally closed.)" />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Example programs">
        {PRESETS.map((x) => <button key={x.id} type="button" onClick={() => setPid(x.id)} aria-pressed={pid === x.id} className={`chip !text-sm ${pid === x.id ? '!border-ink !text-ink bg-paper font-semibold' : ''}`}>{x.name}</button>)}
      </div>
      <p className="text-sm"><strong>Goal:</strong> {p.goal}</p>
      <LadderRunner key={p.id} initial={p.program} devices={p.devices} title="Program" />
      <p className="text-sm">Step-by-step lessons with scenarios, common mistakes and graded practice: <Link className="font-semibold underline" to={`/studio/plc/${lesson.id}`}>PLC studio: {lesson.title}</Link> · <Link className="underline" to="/studio/plc">all {PLC_LESSONS.length} lessons</Link></p>
    </div>
  )
}
