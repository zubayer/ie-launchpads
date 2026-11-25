// Initial JavaScript a first visit downloads: the entry script plus every <link rel="modulepreload">.
// Usage: npm run build && node scripts/bundle-size.mjs [distDir]
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'
const dist = process.argv[2] || 'dist'
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const files = [...html.matchAll(/(?:src|href)="\.?\/?(assets\/[^"]+\.js)"/g)].map((m) => m[1])
let raw = 0, gz = 0
for (const f of new Set(files)) { const b = readFileSync(join(dist, f)); raw += b.length; gz += gzipSync(b, { level: 9 }).length }
console.log(JSON.stringify({ files: new Set(files).size, rawKB: +(raw / 1024).toFixed(1), gzipKB: +(gz / 1024).toFixed(1) }))
