import { useEffect, useRef, useState } from 'react'
import { Challenges, Panel, Predict } from './kit'

type El = { t: 'NO' | 'NC'; tag: string }
type Out = { t: 'coil'; tag: string } | { t: 'TON'; tag: string; preset: number } | { t: 'CTU'; tag: string; preset: number } | { t: 'RES'; tag: string }
interface Rung { branches: El[][]; series: El[]; out: Out; note: string }
interface Program { id: string; name: string; inputs: { tag: string; kind: 'push' | 'toggle'; label: string }[]; outputs: string[]; rungs: Rung[]; goal: string }

const PROGRAMS: Program[] = [
  { id: 'seal', name: 'Start/stop with seal-in', goal: 'Press Start briefly: the motor keeps running after you let go. Press Stop to drop it out.',
    inputs: [{ tag: 'Start', kind: 'push', label: 'Start (momentary)' }, { tag: 'Stop', kind: 'push', label: 'Stop (momentary)' }], outputs: ['Motor'],
    rungs: [{ branches: [[{ t: 'NO', tag: 'Start' }], [{ t: 'NO', tag: 'Motor' }]], series: [{ t: 'NC', tag: 'Stop' }], out: { t: 'coil', tag: 'Motor' }, note: 'The Motor contact in parallel with Start “seals in” the rung — it holds the coil on after Start is released.' }] },
  { id: 'interlock', name: 'Forward/reverse with interlock', goal: 'Run forward, then try reverse while forward runs. The interlock blocks it.',
    inputs: [{ tag: 'Fwd', kind: 'push', label: 'Forward' }, { tag: 'Rev', kind: 'push', label: 'Reverse' }, { tag: 'Stop', kind: 'push', label: 'Stop' }], outputs: ['MotorFwd', 'MotorRev'],
    rungs: [
      { branches: [[{ t: 'NO', tag: 'Fwd' }], [{ t: 'NO', tag: 'MotorFwd' }]], series: [{ t: 'NC', tag: 'Stop' }, { t: 'NC', tag: 'MotorRev' }], out: { t: 'coil', tag: 'MotorFwd' }, note: 'NC MotorRev contact: forward cannot energize while reverse is on.' },
      { branches: [[{ t: 'NO', tag: 'Rev' }], [{ t: 'NO', tag: 'MotorRev' }]], series: [{ t: 'NC', tag: 'Stop' }, { t: 'NC', tag: 'MotorFwd' }], out: { t: 'coil', tag: 'MotorRev' }, note: 'Mirror rung. Real starters also use a mechanical interlock.' },
    ] },
  { id: 'timer', name: 'Jam detection with an on-delay timer (TON)', goal: 'Block the photo-eye. If it stays blocked 3 s, the jam alarm turns on. Clear it before 3 s and the timer resets.',
    inputs: [{ tag: 'PhotoEye', kind: 'toggle', label: 'Photo-eye blocked' }], outputs: ['JamAlarm'],
    rungs: [
      { branches: [[{ t: 'NO', tag: 'PhotoEye' }]], series: [], out: { t: 'TON', tag: 'T1', preset: 3 }, note: 'TON accumulates while the rung is true; DN (done) sets when ACC ≥ preset; any false scan resets it.' },
      { branches: [[{ t: 'NO', tag: 'T1.DN' }]], series: [], out: { t: 'coil', tag: 'JamAlarm' }, note: 'Use the timer’s done bit to drive the alarm.' },
    ] },
  { id: 'counter', name: 'Box count with an up-counter (CTU)', goal: 'Pass 5 parts through the sensor to fill the box. Reset clears the count.',
    inputs: [{ tag: 'PartSensor', kind: 'push', label: 'Part passes sensor' }, { tag: 'Reset', kind: 'push', label: 'Reset count' }], outputs: ['BoxFull'],
    rungs: [
      { branches: [[{ t: 'NO', tag: 'PartSensor' }]], series: [], out: { t: 'CTU', tag: 'C1', preset: 5 }, note: 'CTU counts false→true transitions (rising edges), not scans.' },
      { branches: [[{ t: 'NO', tag: 'C1.DN' }]], series: [], out: { t: 'coil', tag: 'BoxFull' }, note: 'Done bit sets when count ≥ preset.' },
      { branches: [[{ t: 'NO', tag: 'Reset' }]], series: [], out: { t: 'RES', tag: 'C1' }, note: 'RES zeroes the accumulator.' },
    ] },
]

interface Mem { bits: Record<string, boolean>; acc: Record<string, number>; prev: Record<string, boolean> }

export function scan(p: Program, m: Mem, dt: number): Mem {
  const bits = { ...m.bits }, acc = { ...m.acc }, prev = { ...m.prev }
  const val = (e: El) => (e.t === 'NO' ? !!bits[e.tag] : !bits[e.tag])
  for (const r of p.rungs) {
    const power = r.branches.some((b) => b.every(val)) && r.series.every(val)
    const o = r.out
    if (o.t === 'coil') bits[o.tag] = power
    else if (o.t === 'TON') {
      acc[o.tag] = power ? Math.min(o.preset, (acc[o.tag] || 0) + dt) : 0
      bits[o.tag + '.DN'] = power && acc[o.tag] >= o.preset
      bits[o.tag + '.EN'] = power
    } else if (o.t === 'CTU') {
      if (power && !prev[o.tag]) acc[o.tag] = (acc[o.tag] || 0) + 1
      prev[o.tag] = power
      bits[o.tag + '.DN'] = (acc[o.tag] || 0) >= o.preset
    } else if (o.t === 'RES' && power) {
      acc[o.tag] = 0
      bits[o.tag + '.DN'] = false
    }
  }
  return { bits, acc, prev }
}

function Contact({ e, on }: { e: El; on: boolean }) {
  return (
    <div className="flex flex-col items-center px-1">
      <svg width="54" height="30" aria-hidden>
        <line x1="0" x2="18" y1="15" y2="15" stroke={on ? 'var(--color-sgreen)' : 'var(--color-ink-2)'} strokeWidth="3" />
        <line x1="36" x2="54" y1="15" y2="15" stroke={on ? 'var(--color-sgreen)' : 'var(--color-ink-2)'} strokeWidth="3" />
        <line x1="18" x2="18" y1="4" y2="26" stroke="var(--color-ink)" strokeWidth="3" />
        <line x1="36" x2="36" y1="4" y2="26" stroke="var(--color-ink)" strokeWidth="3" />
        {e.t === 'NC' && <line x1="16" x2="38" y1="26" y2="4" stroke="var(--color-ink)" strokeWidth="2.5" />}
        {on && <rect x="20" y="8" width="14" height="14" fill="var(--color-sgreen)" opacity="0.35" />}
      </svg>
      <span className="text-[11px]">{e.tag}</span>
    </div>
  )
}

export default function PlcLadder() {
  const [pid, setPid] = useState('seal')
  const p = PROGRAMS.find((x) => x.id === pid)!
  const [inputs, setInputs] = useState<Record<string, boolean>>({})
  const [mem, setMem] = useState<Mem>({ bits: {}, acc: {}, prev: {} })
  const inRef = useRef(inputs)
  inRef.current = inputs
  useEffect(() => { setInputs({}); setMem({ bits: {}, acc: {}, prev: {} }) }, [pid])
  useEffect(() => {
    const iv = window.setInterval(() => setMem((m) => scan(p, { ...m, bits: { ...m.bits, ...inRef.current } }, 0.1)), 100)
    return () => clearInterval(iv)
  }, [p])
  const bits = { ...mem.bits, ...inputs }
  const val = (e: El) => (e.t === 'NO' ? !!bits[e.tag] : !bits[e.tag])
  const press = (tag: string, v: boolean) => setInputs((s) => ({ ...s, [tag]: v }))

  return (
    <div className="space-y-4">
      <Predict prompt="In the seal-in circuit, what happens if the wire to the Stop button breaks? Is that safe? (Hint: think about why real stop buttons are wired normally-closed.)" />
      <div className="flex flex-wrap gap-2">
        {PROGRAMS.map((x) => <button key={x.id} onClick={() => setPid(x.id)} aria-pressed={pid === x.id} className={`chip !text-sm ${pid === x.id ? '!border-ink !text-ink font-semibold bg-paper' : ''}`}>{x.name}</button>)}
      </div>
      <Panel>
        <p className="mb-3 text-sm"><strong>Goal:</strong> {p.goal}</p>
        <div className="overflow-x-auto">
          <div className="relative min-w-[560px] border-x-4 border-ink px-2">
            {p.rungs.map((r, ri) => {
              const branchOn = r.branches.map((b) => b.every(val))
              const power = branchOn.some(Boolean) && r.series.every(val)
              return (
                <div key={ri} className="border-b border-dashed border-line py-3 last:border-b-0">
                  <div className="flex items-center">
                    <span className="mr-2 text-xs text-ink-2">{String(ri).padStart(3, '0')}</span>
                    <div className="flex flex-col border-r-2 border-ink pr-1" style={{ borderColor: branchOn.some(Boolean) ? 'var(--color-sgreen)' : undefined }}>
                      {r.branches.map((b, bi) => (
                        <div key={bi} className="flex items-center">
                          {b.map((e, ei) => <Contact key={ei} e={e} on={b.slice(0, ei + 1).every(val)} />)}
                        </div>
                      ))}
                    </div>
                    {r.series.map((e, ei) => <Contact key={ei} e={e} on={branchOn.some(Boolean) && r.series.slice(0, ei + 1).every(val)} />)}
                    <div className="h-[3px] flex-1" style={{ background: power ? 'var(--color-sgreen)' : 'var(--color-ink-2)' }} />
                    <div className={`ml-1 rounded-full border-[3px] px-3 py-1 text-xs font-semibold ${power ? 'border-sgreen bg-sgreen/20' : 'border-ink'}`}>
                      {r.out.t === 'coil' ? `( ${r.out.tag} )` : r.out.t === 'RES' ? `(RES ${r.out.tag})` : `${r.out.t} ${r.out.tag} · ${r.out.t === 'TON' ? `${(mem.acc[r.out.tag] || 0).toFixed(1)} / ${r.out.preset}.0 s` : `${mem.acc[r.out.tag] || 0} / ${r.out.preset}`}`}
                    </div>
                  </div>
                  <p className="mt-1 pl-8 text-xs text-ink-2">{r.note}</p>
                </div>
              )
            })}
          </div>
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <p className="label mb-2">Field inputs</p>
          <div className="flex flex-wrap gap-2">
            {p.inputs.map((i) => i.kind === 'push' ? (
              <button key={i.tag} className={`btn ${inputs[i.tag] ? '!bg-sgreen !border-sgreen' : ''}`}
                onPointerDown={() => press(i.tag, true)} onPointerUp={() => press(i.tag, false)} onPointerLeave={() => press(i.tag, false)}
                onKeyDown={(e) => e.key === ' ' && press(i.tag, true)} onKeyUp={(e) => e.key === ' ' && press(i.tag, false)}>{i.label}</button>
            ) : (
              <label key={i.tag} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!inputs[i.tag]} onChange={(e) => press(i.tag, e.target.checked)} /> {i.label}</label>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-2">Hold momentary buttons down. The PLC scans every 100 ms: read inputs → solve rungs top to bottom → write outputs.</p>
        </Panel>
        <Panel>
          <p className="label mb-2">Outputs</p>
          <div className="flex flex-wrap gap-4">
            {p.outputs.map((o) => (
              <div key={o} className="flex items-center gap-2">
                <span className={`inline-block h-8 w-8 rounded-full border-2 border-ink ${bits[o] ? 'bg-tape shadow-[0_0_14px_var(--color-tape)]' : 'bg-line/50'}`} />
                <span className="font-semibold">{o}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Challenges items={['Seal-in: remove the Motor contact in your head. What does the circuit become?', 'Timer: change the photo-eye before 3 s. Why does ACC reset to zero? What instruction would keep it (retentive timer, RTO)?', 'Counter: hold the sensor down. Why does the count go up only once?']} />
    </div>
  )
}
