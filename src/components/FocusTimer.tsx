import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'

/** Pomodoro: focused blocks with short breaks. */
export function FocusTimer() {
  const focusMin = useStore((s) => s.settings.focusMin)
  const [mode, setMode] = useState<'focus' | 'break'>('focus')
  const [left, setLeft] = useState(focusMin * 60)
  const [running, setRunning] = useState(false)
  const t = useRef<number | null>(null)
  useEffect(() => { if (!running) setLeft((mode === 'focus' ? focusMin : 5) * 60) }, [focusMin, mode]) // eslint-disable-line
  useEffect(() => {
    if (!running) return
    t.current = window.setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          const next = mode === 'focus' ? 'break' : 'focus'
          setMode(next)
          setRunning(false)
          try { new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=').play() } catch { /* ignore */ }
          return (next === 'focus' ? focusMin : 5) * 60
        }
        return l - 1
      })
    }, 1000)
    return () => { if (t.current) clearInterval(t.current) }
  }, [running, mode, focusMin])
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return (
    <div className="sheet rounded-lg p-5">
      <h2 className="wide text-lg">{mode === 'focus' ? 'Focus block' : 'Break'}</h2>
      <p className="display mt-1 text-5xl" aria-live="polite">{mm}:{ss}</p>
      <div className="mt-3 flex gap-2">
        <button className="btn" onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Start'}</button>
        <button className="btn-ghost btn" onClick={() => { setRunning(false); setLeft((mode === 'focus' ? focusMin : 5) * 60) }}>Reset</button>
      </div>
      <p className="mt-2 text-sm text-ink-2">{focusMin} min focus, 5 min break. One concept per block works well.</p>
    </div>
  )
}
