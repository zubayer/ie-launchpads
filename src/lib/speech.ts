// Optional voice practice. Both features are progressive enhancements: when the browser lacks them the
// buttons are not shown, and nothing else depends on them.
// - Read aloud uses the Web Speech synthesis API and prefers a voice the device provides locally.
// - Dictation uses the browser's speech recognition service, which may send audio to the browser maker's
//   servers; the UI says so before the learner starts it.

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'

export function speak(text: string, rate = 0.9) {
  if (!canSpeak()) return
  const s = window.speechSynthesis
  s.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const lang = document.documentElement.lang || 'en'
  const voices = s.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2)))
  u.voice = voices.find((v) => v.localService) || voices[0] || null
  u.rate = rate
  s.speak(u)
}

export const stopSpeaking = () => { if (canSpeak()) window.speechSynthesis.cancel() }

interface Recog {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
}
type RecogCtor = new () => Recog

function recogCtor(): RecogCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecogCtor; webkitSpeechRecognition?: RecogCtor }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}
export const canDictate = () => !!recogCtor()

/** Start dictation; onText receives each finished phrase. Returns a stop function, or null when unsupported. */
export function dictate(onText: (t: string) => void, onEnd: (error?: string) => void): (() => void) | null {
  const C = recogCtor()
  if (!C) return null
  const r = new C()
  r.lang = document.documentElement.lang || 'en-US'
  r.interimResults = false
  r.continuous = true
  r.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) onText(e.results[i][0].transcript.trim())
  }
  r.onerror = (e) => onEnd(e.error)
  r.onend = () => onEnd()
  try { r.start() } catch { onEnd('not-started'); return null }
  return () => r.stop()
}
