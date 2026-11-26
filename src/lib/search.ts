import Fuse from 'fuse.js'
import { CONCEPTS } from '../content'

export const fuse = new Fuse(CONCEPTS, {
  keys: [
    { name: 'term', weight: 4 },
    { name: 'aka', weight: 3 },
    { name: 'full', weight: 3 },
    { name: 'one', weight: 1 },
    { name: 'sub', weight: 0.5 },
  ],
  threshold: 0.33,
  ignoreLocation: true,
  minMatchCharLength: 2,
})

export const search = (q: string, limit = 12) => (q.trim() ? fuse.search(q.trim(), { limit }).map((r) => r.item) : [])
