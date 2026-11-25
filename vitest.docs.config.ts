import { defineConfig } from 'vitest/config'

// Separate config so doc generators never run as part of `npm test`.
export default defineConfig({ test: { environment: 'node', include: ['scripts/*.gen.ts'] } })
