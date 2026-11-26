import { it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { CONCEPTS } from '../src/content/full'
import { renderIndex } from '../src/content/indexFile'

// Writes src/content/conceptIndex.generated.ts, the light lesson index that ships with the first page load.
// Run `npm run docs` after changing lesson content; src/content/split.test.ts fails while the file is stale.
it('writes the lesson index', () => {
  writeFileSync(new URL('../src/content/conceptIndex.generated.ts', import.meta.url), renderIndex(CONCEPTS))
})
