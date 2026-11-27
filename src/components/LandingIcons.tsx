/* Simple line icons for the landing page. Decorative: always aria-hidden. */
const PATHS: Record<string, string> = {
  // domains
  lean: 'M3 17h4l2-4 3 6 2-4h7M4 7h5m6 0h5M9 7l3-3 3 3',
  quality: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM8.5 12l2.5 2.5 4.5-5',
  stats: 'M4 20V10m5 10V4m5 16v-7m5 7V8M3 20h18',
  or: 'M6 6a2 2 0 1 0 0 .01M18 6a2 2 0 1 0 0 .01M12 18a2 2 0 1 0 0 .01M8 6h8M7 8l4 8m6-8l-4 8',
  engecon: 'M4 18l5-5 4 3 7-8M15 8h5v5M4 21h16',
  manufacturing: 'M3 21V11l5 3V11l5 3V8l5 3V4h3v17zM7 18h2m4 0h2',
  automation: 'M5 20h14M8 20v-4l3-5 5-2M16 9l2-3M11 11a1.5 1.5 0 1 0 0 .01M18 6a1.5 1.5 0 1 0 0 .01',
  scm: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01',
  ergo: 'M12 5a2 2 0 1 0 0-.01M12 8v6l-3 6m3-6l3 6M8 10h8',
  reliability: 'M4 4v16h16M7 8c3 0 4 2 6 6s3 4 6 4',
  safety: 'M12 4L3 20h18zM12 10v4m0 3v.01',
  datasci: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  // learning steps
  understand: 'M11 4a7 7 0 1 0 0 14 7 7 0 1 0 0-14M16 16l5 5',
  calculate: 'M5 3h14v18H5zM8 7h8M8 11h2m3 0h3M8 15h2m3 0h3M8 18h2',
  apply: 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18M12 7a5 5 0 1 0 0 10 5 5 0 1 0 0-10M12 11a1 1 0 1 0 0 2',
  prove: 'M4 5h16v10H9l-5 4zM9 10h.01M12 10h.01M15 10h.01',
  // featured tools
  studio: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM16.5 13v7M13 16.5h7',
  compare: 'M12 3v18M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0zM8 21h8',
  equation: 'M7 20c2 0 2-3 3-8s1-8 3-8M8 10h6M14 14l5 5m0-5l-5 5',
  dictionary: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21a2 2 0 0 1 2-2h13M9 8h6',
  interview: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
  cases: 'M3 21V9l6 4V9l6 4V5h6v16zM7 17h2m4 0h2m4 0h.01',
  tools: 'M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3l9-9a4 4 0 0 0-2-2zM14 6l3-3',
  career: 'M4 20l5-6 4 3 7-9M16 4h4v4M4 4v4m0 0h4',
}

export function LandingIcon({ name, className = 'h-7 w-7', color }: { name: keyof typeof PATHS | string; className?: string; color?: string }) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}
