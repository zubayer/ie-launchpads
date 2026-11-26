// Lesson page → hands-on deep dive (kept small: this file ships with every lesson page).
// Kept in step with the SQL course by src/lib/sql.test.ts.
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
}
