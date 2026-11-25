// Link from V2 to the matching page of the original V1 site. V1 is read-only: this only links out to it.
// Override the address at build time with VITE_V1_URL (e.g. the GitHub Pages copy at https://zubayer.github.io/ie-launchpad/).
export const V1_URL: string = (import.meta.env?.VITE_V1_URL as string | undefined) || 'https://ie-launchpad.vercel.app/'

// Routes that exist in V1 (same hash routes and concept ids). V2-only pages fall back to the V1 home page.
const V1_ROUTES = [/^\/$/, /^\/directory$/, /^\/domains$/, /^\/d\/[\w-]+(\/cheatsheet)?$/, /^\/c\/[\w.-]+$/, /^\/review$/, /^\/practice$/, /^\/lab(\/[\w-]+)?$/, /^\/roles(\/[\w-]+)?$/, /^\/interview$/, /^\/plan$/, /^\/graph$/, /^\/progress$/, /^\/method$/]

/** The V1 address for a V2 route path, keeping the same topic or page where V1 has it. */
export function v1Href(path: string, base = V1_URL): string {
  const root = base.endsWith('/') ? base : base + '/'
  return V1_ROUTES.some((r) => r.test(path)) ? `${root}#${path}` : `${root}#/`
}
