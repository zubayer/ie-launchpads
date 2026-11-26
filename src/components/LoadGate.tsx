import type { ReactNode } from 'react'
import type { Loaded } from '../content/load'

/** Renders children once lesson content has loaded; a polite status while it loads and a retry if it fails. */
export function LoadGate<T>({ state, children, what = 'lessons' }: { state: Loaded<T> & { retry: () => void }; children: (data: T) => ReactNode; what?: string }) {
  if (state.data !== undefined) return <>{children(state.data)}</>
  if (state.error) return (
    <div role="alert" className="sheet rounded-lg p-4">
      <p>{state.error}</p>
      <button type="button" className="btn mt-2" onClick={state.retry}>Try again</button>
    </div>
  )
  return <p className="text-sm text-ink-2" role="status">Loading the {what}…</p>
}
