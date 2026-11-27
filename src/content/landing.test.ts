import { describe, expect, it } from 'vitest'
import { CONCEPT_MAP } from './full'
import { DOMAIN_MAP } from './domains'
import { HERO_CARDS, LANDING_DOMAINS } from './landing'

describe('landing page content', () => {
  it.each(HERO_CARDS)('$title card matches its lesson', (card) => {
    expect(CONCEPT_MAP[card.id], card.id).toBeTruthy()
    for (const m of card.mustMatch) {
      const ex = CONCEPT_MAP[m.id]?.example
      expect(ex?.check, `${m.id} needs a recomputed worked example`).toBeTruthy()
      expect(ex?.a).toContain(m.text)
    }
  })
  it('lists twelve real domains once each', () => {
    expect(LANDING_DOMAINS).toHaveLength(12)
    expect(new Set(LANDING_DOMAINS).size).toBe(12)
    for (const d of LANDING_DOMAINS) expect(DOMAIN_MAP[d], d).toBeTruthy()
  })
})
