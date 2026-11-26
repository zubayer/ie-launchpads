// Lesson page → hands-on deep dive (kept small: this file ships with every lesson page).
// Kept in step with the SQL, PLC and CAD courses by src/lib/sql.test.ts, plc.test.ts and cad.test.ts.
export const DEEP_DIVE: Record<string, { to: string; label: string }[]> = {
  'datasci.sql': [
    { to: '/studio/sql/select', label: 'SQL studio 1: tables, keys and SELECT' },
    { to: '/studio/sql/where', label: 'SQL studio 2: filtering with WHERE' },
    { to: '/studio/sql/calc', label: 'SQL studio 3: calculated columns and CASE' },
  ],
  'datasci.sql-aggregation': [{ to: '/studio/sql/group', label: 'SQL studio 4: GROUP BY and HAVING' }],
  'datasci.sql-joins': [{ to: '/studio/sql/joins', label: 'SQL studio 5: joins' }],
  'datasci.sql-nulls': [{ to: '/studio/sql/nulls', label: 'SQL studio 6: NULL' }],
  'datasci.sql-subqueries': [{ to: '/studio/sql/ctes', label: 'SQL studio 7: subqueries and CTEs' }],
  'datasci.sql-window-functions': [{ to: '/studio/sql/windows', label: 'SQL studio 8: window functions' }],
  'datasci.sql-data-quality': [{ to: '/studio/sql/quality', label: 'SQL studio 9: data-quality checks' }],
  'datasci.sql-indexes': [{ to: '/studio/sql/design', label: 'SQL studio 10: indexes, plans and design' }],
  'datasci.data-modeling': [{ to: '/studio/sql/design', label: 'SQL studio 10: indexes, plans and design' }],
  'automation.plc': [
    { to: '/studio/plc/scan', label: 'PLC studio 1: how a PLC runs, the scan' },
    { to: '/studio/plc/sequence', label: 'PLC studio 7: sequences, steps and watchdogs' },
  ],
  'automation.scan-cycle': [{ to: '/studio/plc/scan', label: 'PLC studio 1: how a PLC runs, the scan' }],
  'automation.ladder-logic': [
    { to: '/studio/plc/contacts', label: 'PLC studio 2: contacts and Boolean logic' },
    { to: '/studio/plc/debug', label: 'PLC studio 8: troubleshooting a running program' },
  ],
  'automation.no-nc': [{ to: '/studio/plc/nonc', label: 'PLC studio 3: NO and NC, wiring versus XIC and XIO' }],
  'automation.seal-in': [{ to: '/studio/plc/sealin', label: 'PLC studio 4: seal-in circuits and latches' }],
  'automation.plc-timer': [{ to: '/studio/plc/timers', label: 'PLC studio 5: TON, TOF and RTO' }],
  'automation.plc-counter': [{ to: '/studio/plc/counters', label: 'PLC studio 6: counters, edges and one-shots' }],
  'automation.safety-relay': [{ to: '/studio/plc/safety', label: 'PLC studio 9: what standard PLC logic is not for' }],
  'automation.solidworks': [
    { to: '/studio/cad/sketch', label: 'CAD studio 1: sketches, relations and degrees of freedom' },
    { to: '/studio/cad/intent', label: 'CAD studio 2: design intent, dimension schemes and equations' },
    { to: '/studio/cad/mates', label: 'CAD studio 4: assemblies, mates and degrees of freedom' },
  ],
  'automation.parametric': [
    { to: '/studio/cad/sketch', label: 'CAD studio 1: sketches, relations and degrees of freedom' },
    { to: '/studio/cad/features', label: 'CAD studio 3: features and the feature tree' },
  ],
  'automation.assembly-mates': [{ to: '/studio/cad/mates', label: 'CAD studio 4: assemblies, mates and degrees of freedom' }],
  'automation.drawings': [{ to: '/studio/cad/drawings', label: 'CAD studio 5: drawings, views and projection' }],
  'automation.fea': [{ to: '/studio/cad/analysis', label: 'CAD studio 6: hand calculations and factor of safety' }],
  'automation.dfm': [{ to: '/studio/cad/dfx', label: 'CAD studio 7: DFM and DFA' }],
  'automation.dfa': [{ to: '/studio/cad/dfx', label: 'CAD studio 7: DFM and DFA' }],
}

/** What the linked studio offers, shown under the deep-dive links. */
export const deepDiveNote = (to: string) =>
  to.startsWith('/studio/plc') ? 'Rungs that run scan by scan in your browser, scenarios you can replay, common mistakes and graded practice.'
    : to.startsWith('/studio/cad') ? 'Interactive sketches, mates and features with real constraint checks, common mistakes and graded practice.'
      : 'Worked queries with real results, common mistakes, and graded practice on a plant database.'
