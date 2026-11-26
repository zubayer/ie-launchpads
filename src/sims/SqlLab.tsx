import { Link, useParams } from 'react-router-dom'
import { SQL_LESSONS } from '../content/sql/course'
import { SqlPlayground } from '../components/SqlPlayground'

/** The SQL playground as a lab: on a lesson page it opens with that topic's first example. */
export default function SqlLab() {
  const { id } = useParams()
  const lesson = SQL_LESSONS.find((l) => l.concept === id) ?? SQL_LESSONS[0]
  return (
    <div className="space-y-3">
      <p>Write SQL against <strong>Riverbend Plant</strong>, a small synthetic database: 6 machines, 7 work orders, 81 production runs, defects and downtime from October 1–8, 2026. It runs in your browser; nothing is sent anywhere.</p>
      <SqlPlayground initial={lesson.examples[0].sql} />
      <p className="text-sm">Step-by-step lessons with worked examples, common mistakes and graded practice: <Link className="font-semibold underline" to={`/studio/sql/${lesson.id}`}>SQL studio: {lesson.title}</Link> · <Link className="underline" to="/studio/sql">all {SQL_LESSONS.length} lessons</Link></p>
    </div>
  )
}
