import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { QuizItem } from '../lib/quiz'
import { useStore } from '../lib/store'
import { Tex } from './ui'

export function QuestionCard({ item, n, total, onDone }: { item: QuizItem; n?: number; total?: number; onDone?: (correct: boolean) => void }) {
  const [pick, setPick] = useState<number | null>(null)
  const quizResult = useStore((s) => s.quizResult)
  const logMistake = useStore((s) => s.logMistake)
  const answered = pick !== null
  const choose = (i: number) => {
    if (answered) return
    setPick(i)
    quizResult(item.conceptId, i === item.answer)
    if (i !== item.answer) logMistake({ concept: item.conceptId, prompt: item.prompt + (item.promptTex ? ` [${item.promptTex}]` : ''), given: item.options[i], correct: item.options[item.answer], explain: item.explain })
  }
  return (
    <div className="sheet rounded-lg p-5">
      {n !== undefined && <div className="mb-2 text-sm text-ink-2">Question {n} of {total}</div>}
      <p className="whitespace-pre-line font-medium">{item.prompt}</p>
      {item.promptTex && <div className="my-3"><Tex tex={item.promptTex} block /></div>}
      <div className="mt-4 grid gap-2">
        {item.options.map((o, i) => {
          const state = !answered ? '' : i === item.answer ? 'border-sgreen bg-sgreen/10' : i === pick ? 'border-sred bg-sred/10' : 'opacity-60'
          return (
            <button key={i} onClick={() => choose(i)} disabled={answered && i !== pick && i !== item.answer}
              className={`rounded-md border border-line px-3 py-2.5 text-left hover:border-ink ${state}`}>
              <span className="mr-2 font-semibold text-ink-2">{String.fromCharCode(65 + i)}</span>{o}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <p className="text-[0.95rem]">
            <strong className={pick === item.answer ? 'text-sgreen' : 'text-sred'}>{pick === item.answer ? 'Correct.' : 'Not quite.'}</strong>{' '}
            {item.explain} <Link className="underline" to={`/c/${item.conceptId}`}>Open card</Link>
          </p>
          {onDone && <button className="btn" onClick={() => onDone(pick === item.answer)}>Next question</button>}
        </div>
      )}
    </div>
  )
}

export function QuizRunner({ items, onFinish }: { items: QuizItem[]; onFinish?: (score: number) => void }) {
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [log, setLog] = useState<{ item: QuizItem; ok: boolean }[]>([])
  if (!items.length) return <p className="text-ink-2">No questions available for this selection.</p>
  if (i >= items.length) {
    const wrong = log.filter((l) => !l.ok)
    return (
      <div className="sheet rounded-lg p-6">
        <p className="display text-4xl">{score} / {items.length}</p>
        <p className="mt-1 text-ink-2">{score / items.length >= 0.8 ? 'Strong. These concepts move toward mastered.' : 'Missed items are scheduled for review — that is where the learning happens.'}</p>
        {wrong.length > 0 && (
          <div className="mt-4">
            <p className="label mb-1">Revisit</p>
            <ul className="flex flex-wrap gap-2">
              {wrong.map((w, k) => (
                <li key={k}><Link className="chip hover:border-ink" to={`/c/${w.item.conceptId}`}>{w.item.explain.split(':')[0]}</Link></li>
              ))}
            </ul>
          </div>
        )}
        {onFinish && <button className="btn mt-5" onClick={() => onFinish(score)}>Start another round</button>}
      </div>
    )
  }
  return (
    <QuestionCard
      key={i}
      item={items[i]}
      n={i + 1}
      total={items.length}
      onDone={(ok) => {
        setScore((s) => s + (ok ? 1 : 0))
        setLog((l) => [...l, { item: items[i], ok }])
        setI((x) => x + 1)
      }}
    />
  )
}
