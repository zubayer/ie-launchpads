// The SQL studio course: ten lessons on the Riverbend Plant practice database (src/content/sql/plant.ts).
// Every query here runs in the test suite (src/lib/sql.test.ts): examples must return exactly the result
// tables in results.ts, broken queries must fail or differ as described, and practice solutions must run.
// Behaviour notes are about SQLite, the engine in the playground; differences in other databases are flagged.

export interface SqlExample { id: string; title: string; question: string; sql: string; explain: string[]; takeaway: string }
export interface SqlMistake { id: string; title: string; wrong: string; why: string; fix: string; fails?: boolean }
export interface SqlTask { id: string; task: string; hint: string; solution: string; ordered?: boolean }
export interface SqlLesson {
  id: string
  concept: string // the canonical lesson page for this topic
  title: string
  level: 'Foundation' | 'Core' | 'Applied'
  minutes: number
  goal: string
  intuition: string
  analogy: string
  model: string[] // the mental model, as short statements
  syntax: string
  examples: SqlExample[]
  mistakes: SqlMistake[]
  tasks: SqlTask[]
  interview: { q: string; a: string }[]
  onTheJob: string
  dialects?: string[]
}

export const SQL_LESSONS: SqlLesson[] = [
  {
    id: 'select', concept: 'datasci.sql', title: 'Tables, keys and your first SELECT', level: 'Foundation', minutes: 15,
    goal: 'Read a table, choose columns, sort, and limit the rows you get back.',
    intuition: 'A database is a set of tables that agree on IDs. Each table holds one kind of thing: machines, work orders, production runs. SQL lets you describe the table you want back, and the database works out how to build it.',
    analogy: 'Ordering at a counter instead of cooking: you say “two machines, sorted by age, just the names” and the kitchen decides how to make it.',
    model: [
      'A table holds one kind of thing; a row is one of them; a column is one fact about it.',
      'A primary key (machine_id, run_id) identifies each row uniquely, so other tables can point at it.',
      'A foreign key is a column that holds another table’s key: production.machine_id points at machines.',
      'The answer to every query is itself a table, so queries can be built on top of queries.',
      'SQL is declarative: you state what you want, not the steps to get it.',
    ],
    syntax: 'SELECT column1, column2      -- which columns\nFROM table_name               -- from which table\nORDER BY column1 DESC         -- sort (ASC is the default)\nLIMIT 10;                     -- only the first 10 rows',
    examples: [
      { id: 'select-all', title: 'Look before you query', question: 'What machines does the plant have?', sql: 'SELECT *\nFROM machines;', explain: ['* means every column, in table order.', 'Six machines on two lines. M6, the laser, was installed in 2026.'], takeaway: 'Start every new table with a quick look so you know its columns and values. Keep * for exploring; name columns in anything you share.' },
      { id: 'select-sort', title: 'Choose columns and sort', question: 'Which machines are oldest?', sql: 'SELECT machine_id, name, installed\nFROM machines\nORDER BY installed\nLIMIT 3;', explain: ['Only three columns come back, in the order listed.', 'ORDER BY installed sorts oldest first; LIMIT 3 keeps the first three rows.'], takeaway: 'CNC 1 (M3), installed in 2012, is the oldest machine: worth remembering when its scrap shows up later.' },
    ],
    mistakes: [
      { id: 'select-quotes', title: 'Text without quotes', wrong: "SELECT name FROM machines WHERE machine_id = M3;", why: 'Without quotes, M3 is read as a column name, and there is no column called M3.', fix: "SELECT name FROM machines WHERE machine_id = 'M3';", fails: true },
      { id: 'select-order', title: 'Expecting an order you didn’t ask for', wrong: 'SELECT machine_id, installed FROM machines LIMIT 3;', why: 'Without ORDER BY, the database may return rows in any order; “the first three” is then meaningless and can change after an update.', fix: 'SELECT machine_id, installed FROM machines ORDER BY installed LIMIT 3;' },
    ],
    tasks: [
      { id: 'select-t1', task: 'List every product’s name and standard cycle time, fastest (shortest cycle) first.', hint: 'Two columns from products, then ORDER BY std_cycle_s.', solution: 'SELECT name, std_cycle_s FROM products ORDER BY std_cycle_s;', ordered: true },
      { id: 'select-t2', task: 'Show the five most recent work orders by due date, latest first: order ID, product and due date.', hint: 'ORDER BY due_date DESC, then LIMIT.', solution: 'SELECT wo_id, product_id, due_date FROM work_orders ORDER BY due_date DESC LIMIT 5;', ordered: true },
    ],
    interview: [
      { q: 'What is a primary key, and why does a production table need one?', a: 'A column (or set of columns) that is unique and never empty for each row. It lets you update or delete exactly one run, lets other tables point to a run (defects → run_id), and stops the same record being loaded twice.' },
      { q: 'Why avoid SELECT * in a report or application?', a: 'It returns columns you don’t need (slower, more data), and the result changes shape when someone adds a column, which can break the report. Name the columns you use.' },
    ],
    onTheJob: 'MES, ERP and quality systems store their data in SQL databases. An industrial engineer who can query them directly gets a scrap or downtime number in minutes instead of waiting days for an IT report.',
    dialects: ['LIMIT n works in SQLite, PostgreSQL and MySQL. SQL Server uses SELECT TOP n; Oracle and the SQL standard use FETCH FIRST n ROWS ONLY.'],
  },
  {
    id: 'where', concept: 'datasci.sql', title: 'Filtering rows with WHERE', level: 'Foundation', minutes: 20,
    goal: 'Keep only the rows you need with comparisons, AND/OR, IN, BETWEEN and LIKE.',
    intuition: 'WHERE is a test applied to every row. Rows that pass stay; the rest are dropped before anything else happens.',
    analogy: 'A quality gate on a conveyor: each part is checked against the rule, and only passing parts move on.',
    model: [
      'WHERE runs row by row, before grouping and sorting.',
      'AND needs both conditions; OR needs either. AND binds tighter than OR, so use parentheses when you mix them.',
      'IN (a, b, c) is a short way to write several ORs on one column.',
      'BETWEEN a AND b includes both ends.',
      'Dates stored as YYYY-MM-DD text sort and compare correctly as text.',
    ],
    syntax: "SELECT ...\nFROM production\nWHERE machine_id IN ('M1', 'M2')\n  AND run_date BETWEEN '2026-10-03' AND '2026-10-05'\n  AND (shift = 'Night' OR scrap_qty > 30);",
    examples: [
      { id: 'where-and', title: 'Several conditions at once', question: 'Which night-shift runs on CNC 1 (M3) scrapped more than 50 parts?', sql: "SELECT run_id, run_date, scrap_qty\nFROM production\nWHERE machine_id = 'M3'\n  AND shift = 'Night'\n  AND scrap_qty > 50\nORDER BY scrap_qty DESC;", explain: ['All three conditions must hold, so this is AND.', 'Sorting by scrap puts the worst nights first.'], takeaway: 'Only two M3 night shifts crossed that line: 72 parts on October 2 and 56 on October 5. Worth stratifying by shift later.' },
      { id: 'where-in-between', title: 'IN and BETWEEN', question: 'What did the two presses scrap from October 3 to 5?', sql: "SELECT run_date, machine_id, shift, scrap_qty\nFROM production\nWHERE machine_id IN ('M1', 'M2')\n  AND run_date BETWEEN '2026-10-03' AND '2026-10-05'\nORDER BY run_date, machine_id, shift;", explain: ['IN (\'M1\', \'M2\') means machine_id = \'M1\' OR machine_id = \'M2\'.', 'BETWEEN includes both the 3rd and the 5th.'], takeaway: 'Two presses × three days × two shifts = 12 rows. Count the rows you expect before you trust a filter.' },
    ],
    mistakes: [
      { id: 'where-precedence', title: 'Mixing AND and OR without parentheses', wrong: "SELECT COUNT(*) AS runs FROM production\nWHERE machine_id = 'M1' OR machine_id = 'M2' AND shift = 'Night';", why: 'AND is evaluated first, so this counts every M1 run plus only the M2 night runs: 24. The question was night runs on either press, which is 16.', fix: "SELECT COUNT(*) AS runs FROM production\nWHERE machine_id IN ('M1', 'M2') AND shift = 'Night';" },
      { id: 'where-date-format', title: 'A date written in a different format from the data', wrong: "SELECT COUNT(*) AS runs FROM production\nWHERE run_date BETWEEN '10/03/2026' AND '10/05/2026';", why: 'Dates here are stored as YYYY-MM-DD text, so the comparison is alphabetical: \'2026-10-03\' is not between \'10/03/2026\' and \'10/05/2026\', and nothing matches. No error warns you; the count is just 0.', fix: "SELECT COUNT(*) AS runs FROM production\nWHERE run_date BETWEEN '2026-10-03' AND '2026-10-05';" },
    ],
    tasks: [
      { id: 'where-t1', task: 'List the logged downtime events of 60 minutes or more on CNC machines (M3 and M4): event, machine, date and minutes.', hint: "machine_id IN ('M3', 'M4') AND minutes >= 60", solution: "SELECT event_id, machine_id, event_date, minutes FROM downtime WHERE machine_id IN ('M3', 'M4') AND minutes >= 60;" },
      { id: 'where-t2', task: 'Which work orders are due between October 7 and October 10 and are not closed? Show order, product, due date and status.', hint: "BETWEEN for the dates, and status <> 'closed'", solution: "SELECT wo_id, product_id, due_date, status FROM work_orders WHERE due_date BETWEEN '2026-10-07' AND '2026-10-10' AND status <> 'closed';" },
    ],
    interview: [
      { q: 'What does WHERE a = 1 OR b = 2 AND c = 3 return?', a: 'Rows where a = 1, plus rows where both b = 2 and c = 3, because AND binds tighter than OR. Write (a = 1 OR b = 2) AND c = 3 if that is what you mean.' },
      { q: 'How would you select one calendar month of data from a timestamp column?', a: 'Use a half-open range: ts >= \'2026-10-01\' AND ts < \'2026-11-01\'. It catches every time on the last day and lets the database use an index, unlike wrapping the column in a function.' },
    ],
    onTheJob: 'Most plant questions start with a filter: one line, one shift, last week, one product family. Getting the filter right is half the accuracy of the answer.',
    dialects: ['LIKE is case-insensitive for ASCII letters in SQLite and MySQL by default, but case-sensitive in PostgreSQL (use ILIKE there).'],
  },
  {
    id: 'calc', concept: 'datasci.sql', title: 'Calculated columns, CASE and the integer-division trap', level: 'Foundation', minutes: 20,
    goal: 'Compute new columns such as scrap rate, label rows with CASE, and avoid integer division.',
    intuition: 'A SELECT can return expressions, not just stored columns: arithmetic, rounding and if-then labels, computed for each row.',
    analogy: 'Adding a formula column to a spreadsheet: =C2/(B2+C2) filled down every row.',
    model: [
      'An expression in SELECT is computed once per row.',
      'AS gives the result column a name (an alias).',
      'Integer ÷ integer is integer division in SQLite, PostgreSQL and SQL Server: 23 / 516 = 0. Multiply by 100.0 or 1.0 first.',
      'CASE WHEN … THEN … ELSE … END is SQL’s if-then.',
      'In SQLite, dividing by zero gives NULL instead of an error.',
    ],
    syntax: "SELECT run_id,\n       ROUND(100.0 * scrap_qty / (good_qty + scrap_qty), 2) AS scrap_pct,\n       CASE WHEN scrap_qty > 40 THEN 'High' ELSE 'Normal' END AS level\nFROM production;",
    examples: [
      { id: 'calc-rate', title: 'Scrap rate per run', question: 'What was each machine’s scrap rate on the day shift of October 1?', sql: "SELECT run_id, machine_id,\n       good_qty + scrap_qty AS made,\n       ROUND(100.0 * scrap_qty / (good_qty + scrap_qty), 2) AS scrap_pct\nFROM production\nWHERE run_date = '2026-10-01' AND shift = 'Day'\nORDER BY scrap_pct DESC;", explain: ['made adds good and scrapped parts.', '100.0 makes the division decimal; ROUND keeps two decimals.'], takeaway: 'Even on its first day shift, CNC 1 (M3) scrapped 4.46% of what it made, more than any other machine.' },
      { id: 'calc-case', title: 'Labelling rows with CASE', question: 'Label each of M3’s runs on October 2 by how bad the scrap was.', sql: "SELECT run_id, shift, scrap_qty,\n       CASE\n         WHEN 100.0 * scrap_qty / (good_qty + scrap_qty) >= 8 THEN 'Critical'\n         WHEN 100.0 * scrap_qty / (good_qty + scrap_qty) >= 5 THEN 'High'\n         ELSE 'Normal'\n       END AS level\nFROM production\nWHERE machine_id = 'M3' AND run_date = '2026-10-02';", explain: ['CASE checks the WHEN conditions in order and returns the first match.', 'The ELSE catches everything left.'], takeaway: 'CASE turns numbers into categories you can count or colour in a dashboard.' },
    ],
    mistakes: [
      { id: 'calc-intdiv', title: 'Integer division', wrong: "SELECT run_id, scrap_qty / (good_qty + scrap_qty) AS scrap_rate\nFROM production WHERE run_id <= 3;", why: 'Both columns are integers, so the division is integer division and every rate comes out 0.', fix: "SELECT run_id, 1.0 * scrap_qty / (good_qty + scrap_qty) AS scrap_rate\nFROM production WHERE run_id <= 3;" },
      { id: 'calc-round-early', title: 'Rounding before scaling', wrong: "SELECT run_id, ROUND(1.0 * scrap_qty / (good_qty + scrap_qty), 2) * 100 AS scrap_pct\nFROM production WHERE run_id <= 3;", why: 'Rounding the fraction to two decimals first throws away the detail: 0.0446 becomes 0.04, then 4%. Scale to a percentage first, then round.', fix: "SELECT run_id, ROUND(100.0 * scrap_qty / (good_qty + scrap_qty), 2) AS scrap_pct\nFROM production WHERE run_id <= 3;" },
    ],
    tasks: [
      { id: 'calc-t1', task: 'For the night shift of October 8, list each machine and its quality rate (good ÷ made) as a percentage with one decimal, lowest first.', hint: 'ROUND(100.0 * good_qty / (good_qty + scrap_qty), 1)', solution: "SELECT machine_id, ROUND(100.0 * good_qty / (good_qty + scrap_qty), 1) AS quality_pct FROM production WHERE run_date = '2026-10-08' AND shift = 'Night' ORDER BY quality_pct;", ordered: true },
      { id: 'calc-t2', task: 'For every run on October 4, show run ID and its available minutes (run_min minus down_min).', hint: 'run_min - down_min AS available_min', solution: "SELECT run_id, run_min - down_min AS available_min FROM production WHERE run_date = '2026-10-04';" },
    ],
    interview: [
      { q: 'Your scrap-rate column comes back as all zeros. Why?', a: 'Integer division: scrap_qty / total with both integers truncates to 0. Multiply by 1.0 (or CAST to a decimal) before dividing.' },
      { q: 'How do you avoid a division-by-zero error in SQL?', a: 'Use CASE WHEN denominator = 0 THEN NULL ELSE … END, or NULLIF(denominator, 0), which returns NULL instead of dividing by zero.' },
    ],
    onTheJob: 'Scrap rate, OEE factors, yield and utilisation are all ratios. Computing them in SQL, with the right rounding, gives every report the same number.',
  },
  {
    id: 'group', concept: 'datasci.sql-aggregation', title: 'Summaries with GROUP BY and HAVING', level: 'Core', minutes: 25,
    goal: 'Turn thousands of rows into one row per machine, shift or day, and filter those summaries.',
    intuition: 'GROUP BY sorts rows into buckets that share a value, then an aggregate (SUM, COUNT, AVG, MIN, MAX) squashes each bucket into one number.',
    analogy: 'Sorting a pile of inspection tickets into one tray per machine, then writing each tray’s total on a sticky note.',
    model: [
      'The query runs in this order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.',
      'WHERE filters rows before grouping; HAVING filters groups after.',
      'Every selected column must be grouped or aggregated.',
      'A rate for a group is the ratio of totals (SUM ÷ SUM), not the average of row rates.',
    ],
    syntax: 'SELECT machine_id,\n       SUM(scrap_qty) AS scrap,\n       COUNT(*) AS runs\nFROM production\nWHERE run_date >= \'2026-10-01\'   -- rows\nGROUP BY machine_id\nHAVING SUM(scrap_qty) > 200       -- groups\nORDER BY scrap DESC;',
    examples: [
      { id: 'group-machine', title: 'Scrap by machine', question: 'Which machine scraps the most, as a share of what it makes?', sql: 'SELECT machine_id,\n       SUM(good_qty + scrap_qty) AS made,\n       SUM(scrap_qty) AS scrap,\n       ROUND(100.0 * SUM(scrap_qty) / SUM(good_qty + scrap_qty), 2) AS scrap_pct\nFROM production\nGROUP BY machine_id\nORDER BY scrap_pct DESC;', explain: ['One output row per machine.', 'scrap_pct divides the machine’s total scrap by its total made.'], takeaway: 'CNC 1 (M3) scraps 7.41% of what it makes, more than twice any other machine: the Pareto points to one machine.' },
      { id: 'group-having', title: 'Filtering groups with HAVING', question: 'Which machines lost more than 400 minutes to downtime in the eight days?', sql: 'SELECT machine_id, SUM(down_min) AS down_min\nFROM production\nGROUP BY machine_id\nHAVING SUM(down_min) > 400\nORDER BY down_min DESC;', explain: ['The total only exists after grouping, so the filter goes in HAVING.'], takeaway: 'M3 lost 1,161 minutes, more than the other four machines combined.' },
    ],
    mistakes: [
      { id: 'group-where-agg', title: 'An aggregate in WHERE', wrong: 'SELECT machine_id, SUM(down_min) AS down_min\nFROM production\nWHERE SUM(down_min) > 400\nGROUP BY machine_id;', why: 'WHERE runs before rows are grouped, so there is no SUM yet. SQLite reports “misuse of aggregate”.', fix: 'SELECT machine_id, SUM(down_min) AS down_min\nFROM production\nGROUP BY machine_id\nHAVING SUM(down_min) > 400;', fails: true },
      { id: 'group-avg-of-rates', title: 'Averaging rates', wrong: "SELECT ROUND(AVG(100.0 * scrap_qty / (good_qty + scrap_qty)), 2) AS scrap_pct\nFROM production WHERE machine_id IN ('M1', 'M3');", why: 'Every run counts equally, but a press run makes far more parts than a CNC run. Averaging the run rates gives M3’s small, bad runs as much weight as M1’s big, good ones: 4.43% instead of the true 3.66%.', fix: "SELECT ROUND(100.0 * SUM(scrap_qty) / SUM(good_qty + scrap_qty), 2) AS scrap_pct\nFROM production WHERE machine_id IN ('M1', 'M3');" },
    ],
    tasks: [
      { id: 'group-t1', task: 'For the whole plant, show each shift’s total good parts and its scrap percentage (two decimals).', hint: 'GROUP BY shift; scrap % = 100.0 * SUM(scrap) / SUM(good + scrap)', solution: 'SELECT shift, SUM(good_qty) AS good, ROUND(100.0 * SUM(scrap_qty) / SUM(good_qty + scrap_qty), 2) AS scrap_pct FROM production GROUP BY shift;' },
      { id: 'group-t2', task: 'Make a Pareto of defect codes: total parts per code, only codes above 300 parts, largest first.', hint: 'GROUP BY code, HAVING SUM(qty) > 300, ORDER BY the total DESC', solution: 'SELECT code, SUM(qty) AS parts FROM defects GROUP BY code HAVING SUM(qty) > 300 ORDER BY parts DESC;', ordered: true },
    ],
    interview: [
      { q: 'What is the difference between WHERE and HAVING?', a: 'WHERE filters individual rows before grouping; HAVING filters groups after aggregation, so it can use SUM, COUNT and friends. Filter in WHERE whenever you can: fewer rows to group is faster.' },
      { q: 'Machine scrap rates are 2%, 4% and 6%. Is the plant rate 4%?', a: 'Only if the machines made the same number of parts. The plant rate is total scrap ÷ total made, so a high-volume machine weighs more. Compute it from the sums.' },
    ],
    onTheJob: 'Every KPI table (scrap by machine, downtime by reason, output by shift) is a GROUP BY. It is the SQL behind a Pareto chart.',
    dialects: ['SQLite lets you select a column that is neither grouped nor aggregated and returns a value from some row in the group. PostgreSQL and SQL Server reject the query. Don’t rely on it.'],
  },
  {
    id: 'joins', concept: 'datasci.sql-joins', title: 'Combining tables with JOIN', level: 'Core', minutes: 30,
    goal: 'Bring columns from related tables together, keep unmatched rows when you need them, and avoid double counting.',
    intuition: 'Production rows only store machine_id. To report by line or machine name you match each run to its machine row: that match is a join.',
    analogy: 'Matching packing slips to purchase orders by order number: a slip with no matching order is a question, not something to throw away.',
    model: [
      'INNER JOIN keeps only rows that match on both sides.',
      'LEFT JOIN keeps every row from the left table; where nothing matches, the right side’s columns are NULL.',
      'Joining one row to many repeats the one side: one run with two defect rows appears twice.',
      'Join on keys (ON p.machine_id = m.machine_id); a join without a condition pairs every row with every row.',
      'Short table aliases (p, m) keep column names unambiguous.',
    ],
    syntax: 'SELECT m.line, SUM(p.good_qty) AS good\nFROM production AS p\nJOIN machines AS m ON m.machine_id = p.machine_id\nGROUP BY m.line;\n\n-- keep machines with no runs:\nFROM machines AS m\nLEFT JOIN production AS p ON p.machine_id = m.machine_id',
    examples: [
      { id: 'join-line', title: 'Report by a column from another table', question: 'What did each line make, and at what scrap rate?', sql: 'SELECT m.line,\n       SUM(p.good_qty) AS good,\n       ROUND(100.0 * SUM(p.scrap_qty) / SUM(p.good_qty + p.scrap_qty), 2) AS scrap_pct\nFROM production AS p\nJOIN machines AS m ON m.machine_id = p.machine_id\nGROUP BY m.line;', explain: ['line lives in machines, so production is joined to machines on machine_id.', 'Then it is an ordinary GROUP BY.'], takeaway: 'Line L1 scraps 3.51% against 1.6% on L2, and CNC 1 (M3) is on L1.' },
      { id: 'join-left', title: 'Find what has no match', question: 'Which machines have no production recorded?', sql: 'SELECT m.machine_id, m.name, COUNT(p.run_id) AS runs\nFROM machines AS m\nLEFT JOIN production AS p ON p.machine_id = m.machine_id\nGROUP BY m.machine_id, m.name\nHAVING COUNT(p.run_id) = 0;', explain: ['LEFT JOIN keeps Laser 1 even though no run matches it.', 'COUNT(p.run_id) counts matched runs only, so it is 0 for an unmatched machine.'], takeaway: 'Laser 1 (M6) has no runs yet. An inner join would have hidden it entirely.' },
      { id: 'join-progress', title: 'Order progress with LEFT JOIN and COALESCE', question: 'How far along is each open or late work order?', sql: "SELECT w.wo_id, w.product_id, w.qty_ordered,\n       COALESCE(SUM(p.good_qty), 0) AS good_made,\n       ROUND(100.0 * COALESCE(SUM(p.good_qty), 0) / w.qty_ordered, 1) AS pct_done\nFROM work_orders AS w\nLEFT JOIN production AS p ON p.wo_id = w.wo_id\nWHERE w.status <> 'closed'\nGROUP BY w.wo_id, w.product_id, w.qty_ordered\nORDER BY pct_done;", explain: ['LEFT JOIN keeps order 107, which hasn’t started.', 'COALESCE turns its empty sum (NULL) into 0.'], takeaway: 'Order 107 hasn’t started and order 104 is late at 95.7% done: two different conversations with the scheduler.' },
    ],
    mistakes: [
      { id: 'join-fanout', title: 'Double counting after a one-to-many join', wrong: "SELECT SUM(p.good_qty) AS good\nFROM production AS p\nJOIN defects AS d ON d.run_id = p.run_id\nWHERE p.machine_id = 'M3';", why: 'Most runs have two defect rows, so each run’s good_qty is added twice (and runs with no defects drop out). The total is wrong and looks plausible.', fix: "SELECT SUM(good_qty) AS good\nFROM production\nWHERE machine_id = 'M3';" },
      { id: 'join-where-kills-left', title: 'A WHERE on the right table turns LEFT JOIN into INNER', wrong: "SELECT m.machine_id, COUNT(p.run_id) AS night_runs\nFROM machines AS m\nLEFT JOIN production AS p ON p.machine_id = m.machine_id\nWHERE p.shift = 'Night'\nGROUP BY m.machine_id;", why: 'For Laser 1, p.shift is NULL, so WHERE drops it and the machine you wanted to see with 0 disappears.', fix: "SELECT m.machine_id, COUNT(p.run_id) AS night_runs\nFROM machines AS m\nLEFT JOIN production AS p ON p.machine_id = m.machine_id AND p.shift = 'Night'\nGROUP BY m.machine_id;" },
    ],
    tasks: [
      { id: 'join-t1', task: 'Total good parts by product family.', hint: 'production → work_orders (wo_id) → products (product_id), then GROUP BY family.', solution: 'SELECT pr.family, SUM(p.good_qty) AS good FROM production AS p JOIN work_orders AS w ON w.wo_id = p.wo_id JOIN products AS pr ON pr.product_id = w.product_id GROUP BY pr.family;' },
      { id: 'join-t2', task: 'List the products that have no work orders at all: product ID and name.', hint: 'products LEFT JOIN work_orders, keep rows where the work order side is NULL.', solution: 'SELECT pr.product_id, pr.name FROM products AS pr LEFT JOIN work_orders AS w ON w.product_id = pr.product_id WHERE w.wo_id IS NULL;' },
      { id: 'join-t3', task: 'Scrap cost per machine: total scrapped parts × the product’s unit cost, rounded to whole dollars, highest first.', hint: 'production → work_orders → products; SUM(p.scrap_qty * pr.unit_cost)', solution: 'SELECT p.machine_id, ROUND(SUM(p.scrap_qty * pr.unit_cost)) AS scrap_cost FROM production AS p JOIN work_orders AS w ON w.wo_id = p.wo_id JOIN products AS pr ON pr.product_id = w.product_id GROUP BY p.machine_id ORDER BY scrap_cost DESC;', ordered: true },
    ],
    interview: [
      { q: 'INNER JOIN vs LEFT JOIN?', a: 'INNER keeps only matching pairs. LEFT keeps every row of the left table and fills the right side with NULLs where there is no match. Use LEFT when “no match” is itself information: machines with no runs, orders not started.' },
      { q: 'After a join, your total doubled. What happened?', a: 'A one-to-many join repeated rows from the “one” side. Aggregate the many side first (in a subquery or CTE), then join, or sum only columns from the side that is not repeated.' },
    ],
    onTheJob: 'Real questions cross tables: scrap cost needs production, work orders and product cost; OTD needs orders and shipments. Joins are where most reporting errors are born, so check row counts before and after every join.',
  },
  {
    id: 'nulls', concept: 'datasci.sql-nulls', title: 'NULL: the value that isn’t there', level: 'Core', minutes: 20,
    goal: 'Find missing values, count them correctly, and avoid the filters that silently drop them.',
    intuition: 'NULL means “unknown”, not zero and not blank. Anything compared with unknown is unknown, so NULL rows quietly fall out of filters.',
    analogy: 'A checksheet box nobody filled in. You can’t say the machine had zero downtime; you can only say nobody wrote it down.',
    model: [
      'Test for missing values with IS NULL and IS NOT NULL. = NULL is never true.',
      'COUNT(*) counts rows; COUNT(column) counts non-NULL values.',
      'SUM, AVG, MIN and MAX ignore NULLs; AVG divides by the non-NULL count.',
      'A NULL fails both IN (…) and NOT IN (…), so it disappears from both.',
      'COALESCE(x, fallback) returns the first non-NULL value.',
    ],
    syntax: "SELECT COUNT(*) AS rows_, COUNT(down_min) AS with_reading\nFROM production;\n\nSELECT COALESCE(reason, '(not recorded)') AS reason, COUNT(*)\nFROM downtime\nGROUP BY COALESCE(reason, '(not recorded)');",
    examples: [
      { id: 'nulls-count', title: 'COUNT(*) vs COUNT(column)', question: 'How many runs have no downtime reading?', sql: 'SELECT COUNT(*) AS runs,\n       COUNT(down_min) AS with_reading,\n       COUNT(*) - COUNT(down_min) AS missing\nFROM production;', explain: ['COUNT(*) counts every row; COUNT(down_min) skips the NULL.'], takeaway: 'One of 81 runs has no downtime reading. AVG(down_min) silently averages over the other 80.' },
      { id: 'nulls-coalesce', title: 'Make missing reasons visible', question: 'Downtime by reason, including events nobody explained', sql: "SELECT COALESCE(reason, '(not recorded)') AS reason,\n       COUNT(*) AS events,\n       SUM(minutes) AS minutes\nFROM downtime\nGROUP BY COALESCE(reason, '(not recorded)')\nORDER BY minutes DESC;", explain: ['COALESCE gives the NULL reasons a label, so they form their own visible group.'], takeaway: 'Setup is the largest reason with 9 events and 582 minutes; 77 minutes have no reason recorded and need a word with the shift lead.' },
    ],
    mistakes: [
      { id: 'nulls-equals', title: '= NULL', wrong: 'SELECT COUNT(*) AS missing FROM downtime WHERE reason = NULL;', why: 'Comparing anything with NULL gives unknown, never true, so no row passes and you conclude nothing is missing.', fix: 'SELECT COUNT(*) AS missing FROM downtime WHERE reason IS NULL;' },
      { id: 'nulls-not-in', title: 'Rows that vanish from both IN and NOT IN', wrong: "SELECT (SELECT COUNT(*) FROM downtime WHERE reason IN ('Setup', 'Tool change'))\n     + (SELECT COUNT(*) FROM downtime WHERE reason NOT IN ('Setup', 'Tool change')) AS counted,\n       (SELECT COUNT(*) FROM downtime) AS total;", why: 'The two events with a NULL reason are in neither group, so “in the list” plus “not in the list” doesn’t add up to the total.', fix: "SELECT (SELECT COUNT(*) FROM downtime WHERE reason IN ('Setup', 'Tool change'))\n     + (SELECT COUNT(*) FROM downtime WHERE reason NOT IN ('Setup', 'Tool change') OR reason IS NULL) AS counted,\n       (SELECT COUNT(*) FROM downtime) AS total;" },
    ],
    tasks: [
      { id: 'nulls-t1', task: 'For each machine, count its logged downtime events that have no reason. Show only machines with at least one.', hint: 'WHERE reason IS NULL, then GROUP BY machine_id', solution: 'SELECT machine_id, COUNT(*) AS unexplained FROM downtime WHERE reason IS NULL GROUP BY machine_id;' },
      { id: 'nulls-t2', task: 'Show each machine’s average downtime per run in minutes (one decimal), over runs that have a reading.', hint: 'AVG already skips NULLs; GROUP BY machine_id', solution: 'SELECT machine_id, ROUND(AVG(down_min), 1) AS avg_down FROM production GROUP BY machine_id;' },
    ],
    interview: [
      { q: 'What do COUNT(*), COUNT(col) and COUNT(DISTINCT col) return?', a: 'All rows; rows where col is not NULL; and the number of different non-NULL values of col.' },
      { q: 'Why might NOT IN (subquery) return no rows at all?', a: 'If the subquery returns a NULL, x NOT IN (…, NULL) is never true. Use NOT EXISTS, or filter NULLs out of the subquery.' },
    ],
    onTheJob: 'Missing sensor readings and blank reason codes are normal in plant data. Reporting how much is missing is part of the answer, not a footnote.',
  },
  {
    id: 'ctes', concept: 'datasci.sql-subqueries', title: 'Step by step: subqueries and CTEs', level: 'Core', minutes: 25,
    goal: 'Break a hard question into named steps, and compare rows with a total or an average.',
    intuition: 'Because a query returns a table, you can query that table again. A CTE (WITH …) gives each step a name, so a long question reads top to bottom.',
    analogy: 'Showing your working in an exam: first the daily totals, then the average, then the days above it.',
    model: [
      'WITH name AS (SELECT …) defines a temporary named result for the next query.',
      'Several CTEs can be chained with commas; each can use the ones before it.',
      'A subquery in parentheses can stand where a value or a table goes.',
      'Aggregate first, then join, to avoid double counting.',
    ],
    syntax: 'WITH daily AS (\n  SELECT run_date, SUM(good_qty) AS good\n  FROM production\n  GROUP BY run_date\n)\nSELECT run_date, good\nFROM daily\nWHERE good > (SELECT AVG(good) FROM daily);',
    examples: [
      { id: 'cte-daily', title: 'Days above average', question: 'On which days did the plant make more good parts than its daily average?', sql: 'WITH daily AS (\n  SELECT run_date, SUM(good_qty) AS good\n  FROM production\n  GROUP BY run_date\n)\nSELECT run_date, good,\n       (SELECT ROUND(AVG(good)) FROM daily) AS daily_avg\nFROM daily\nWHERE good > (SELECT AVG(good) FROM daily)\nORDER BY run_date;', explain: ['Step 1 (the CTE): one row per day.', 'Step 2: keep the days above the average of step 1.'], takeaway: 'Only October 1 to 3 beat the average of 6,368 good parts a day; output has been below average since.' },
      { id: 'cte-defects-first', title: 'Aggregate first, then join', question: 'For each M3 run, compare logged defects with recorded scrap, without double counting.', sql: "WITH d AS (\n  SELECT run_id, SUM(qty) AS defect_qty\n  FROM defects\n  GROUP BY run_id\n)\nSELECT p.run_id, p.scrap_qty, d.defect_qty\nFROM production AS p\nJOIN d ON d.run_id = p.run_id\nWHERE p.machine_id = 'M3' AND p.run_date = '2026-10-01';", explain: ['The CTE collapses defects to one row per run first.', 'The join is then one-to-one, so nothing repeats.'], takeaway: 'Defects add up to scrap for each run here: the defect log reconciles.' },
    ],
    mistakes: [
      { id: 'cte-scalar', title: 'A subquery that returns more than one row', wrong: "SELECT machine_id FROM production\nWHERE scrap_qty = (SELECT MAX(scrap_qty) FROM production GROUP BY machine_id)\nLIMIT 1;", why: 'The subquery returns one maximum per machine, five values. SQLite quietly uses the first one; PostgreSQL and SQL Server raise an error. Either way the question was ambiguous.', fix: 'SELECT machine_id, MAX(scrap_qty) AS worst_run FROM production GROUP BY machine_id;' },
    ],
    tasks: [
      { id: 'cte-t1', task: 'List machines whose scrap rate is above the plant-wide scrap rate: machine and its rate in percent (two decimals).', hint: 'A CTE per machine, a subquery for the plant rate, then compare.', solution: 'WITH m AS (SELECT machine_id, 100.0 * SUM(scrap_qty) / SUM(good_qty + scrap_qty) AS pct FROM production GROUP BY machine_id) SELECT machine_id, ROUND(pct, 2) AS scrap_pct FROM m WHERE pct > (SELECT 100.0 * SUM(scrap_qty) / SUM(good_qty + scrap_qty) FROM production);' },
      { id: 'cte-t2', task: 'Which products’ total scrap cost (scrapped parts × unit cost) exceeds $3,000? Product ID and cost rounded to whole dollars.', hint: 'Join production → work_orders → products inside a CTE, then filter the CTE.', solution: 'WITH c AS (SELECT w.product_id, SUM(p.scrap_qty * pr.unit_cost) AS cost FROM production AS p JOIN work_orders AS w ON w.wo_id = p.wo_id JOIN products AS pr ON pr.product_id = w.product_id GROUP BY w.product_id) SELECT product_id, ROUND(cost) AS scrap_cost FROM c WHERE cost > 3000;' },
    ],
    interview: [
      { q: 'CTE or subquery?', a: 'They often run the same way. A CTE names each step, can be referenced more than once, and reads top to bottom, so it is easier to review and debug. A short one-off value is fine as a subquery.' },
      { q: 'How would you find each machine’s worst run?', a: 'Either join production to a per-machine MAX in a CTE, or use ROW_NUMBER() OVER (PARTITION BY machine_id ORDER BY scrap_qty DESC) and keep row 1 (see window functions).' },
    ],
    onTheJob: 'Analyses with three or four steps (filter, aggregate, compare with a baseline, rank) become maintainable when each step is a named CTE that a colleague can check.',
  },
  {
    id: 'windows', concept: 'datasci.sql-window-functions', title: 'Window functions: rank, running totals, previous values', level: 'Applied', minutes: 30,
    goal: 'Rank rows, compute running totals and moving averages, and compare a row with the one before it, without collapsing rows.',
    intuition: 'GROUP BY squashes rows into one per group. A window function keeps every row and adds a number computed over a “window” of related rows: its rank, the running total so far, or yesterday’s value.',
    analogy: 'A league table: every team keeps its own row, and each row also shows its position and the gap to the team above.',
    model: [
      'function() OVER (PARTITION BY … ORDER BY …): PARTITION BY restarts the calculation per group; ORDER BY sets the order inside it.',
      'ROW_NUMBER gives 1, 2, 3 even for ties; RANK gives ties the same rank and then skips; DENSE_RANK doesn’t skip.',
      'LAG(x) is the previous row’s x; LEAD(x) the next row’s.',
      'With ORDER BY and no frame, SUM() OVER is a running total up to the current row.',
      'Window functions run after WHERE and GROUP BY, so to filter on one, wrap the query in a CTE.',
    ],
    syntax: 'SELECT run_date, good,\n       SUM(good) OVER (ORDER BY run_date) AS running_total,\n       LAG(good) OVER (ORDER BY run_date) AS prev_day,\n       RANK() OVER (ORDER BY good DESC) AS rank_\nFROM daily;',
    examples: [
      { id: 'win-rank', title: 'Rank machines by scrap rate', question: 'Rank the machines from worst to best scrap rate.', sql: 'WITH m AS (\n  SELECT machine_id,\n         ROUND(100.0 * SUM(scrap_qty) / SUM(good_qty + scrap_qty), 2) AS scrap_pct\n  FROM production\n  GROUP BY machine_id\n)\nSELECT machine_id, scrap_pct,\n       RANK() OVER (ORDER BY scrap_pct DESC) AS rank_\nFROM m\nORDER BY rank_;', explain: ['The CTE makes one row per machine.', 'RANK() numbers them by scrap rate, worst first, without collapsing anything.'], takeaway: 'M3 ranks 1st at 7.41%, M2 2nd at 3.26%.' },
      { id: 'win-running', title: 'Running total against the order quantity', question: 'How did order 104 build up day by day?', sql: 'SELECT run_date,\n       SUM(good_qty) AS good,\n       SUM(SUM(good_qty)) OVER (ORDER BY run_date) AS cumulative\nFROM production\nWHERE wo_id = 104\nGROUP BY run_date\nORDER BY run_date;', explain: ['GROUP BY run_date gives a daily total.', 'SUM(…) OVER (ORDER BY run_date) adds up those daily totals so far.'], takeaway: 'Order 104 (7,000 shafts) reached 6,701 by October 8: still short, which is why it is late.' },
      { id: 'win-lag', title: 'Day-over-day change with LAG', question: 'How did CNC 1’s daily scrap change from one day to the next?', sql: "WITH d AS (\n  SELECT run_date, SUM(scrap_qty) AS scrap\n  FROM production\n  WHERE machine_id = 'M3'\n  GROUP BY run_date\n)\nSELECT run_date, scrap,\n       scrap - LAG(scrap) OVER (ORDER BY run_date) AS change\nFROM d\nORDER BY run_date;", explain: ['LAG(scrap) is the previous day’s scrap; the first day has none, so its change is NULL.'], takeaway: 'Day-to-day swings are large (from −49 to +36 parts), so judge M3 on its trend or a control chart, not on one bad day.' },
    ],
    mistakes: [
      { id: 'win-where', title: 'Filtering on a window function in WHERE', wrong: 'SELECT run_id, machine_id,\n       ROW_NUMBER() OVER (PARTITION BY machine_id ORDER BY scrap_qty DESC) AS rn\nFROM production\nWHERE rn = 1;', why: 'WHERE runs before window functions are computed, so rn doesn’t exist yet.', fix: 'WITH r AS (\n  SELECT run_id, machine_id, scrap_qty,\n         ROW_NUMBER() OVER (PARTITION BY machine_id ORDER BY scrap_qty DESC, run_id) AS rn\n  FROM production\n)\nSELECT run_id, machine_id, scrap_qty FROM r WHERE rn = 1;', fails: true },
    ],
    tasks: [
      { id: 'win-t1', task: 'For each machine, list its two worst runs by scrap: machine, run ID and scrap. Break ties by the lower run ID.', hint: 'ROW_NUMBER() OVER (PARTITION BY machine_id ORDER BY scrap_qty DESC, run_id) in a CTE; keep rn <= 2.', solution: 'WITH r AS (SELECT machine_id, run_id, scrap_qty, ROW_NUMBER() OVER (PARTITION BY machine_id ORDER BY scrap_qty DESC, run_id) AS rn FROM production) SELECT machine_id, run_id, scrap_qty FROM r WHERE rn <= 2;' },
      { id: 'win-t2', task: 'Show each day’s plant total of good parts and its 3-day moving average (today and the two days before), rounded to whole parts, in date order.', hint: 'AVG(good) OVER (ORDER BY run_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) on a daily CTE', solution: 'WITH d AS (SELECT run_date, SUM(good_qty) AS good FROM production GROUP BY run_date) SELECT run_date, good, ROUND(AVG(good) OVER (ORDER BY run_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)) AS avg3 FROM d ORDER BY run_date;', ordered: true },
    ],
    interview: [
      { q: 'ROW_NUMBER, RANK and DENSE_RANK on scores 90, 90, 80?', a: 'ROW_NUMBER: 1, 2, 3. RANK: 1, 1, 3. DENSE_RANK: 1, 1, 2.' },
      { q: 'How do you get the latest reading per sensor?', a: 'ROW_NUMBER() OVER (PARTITION BY sensor_id ORDER BY ts DESC) in a CTE, then keep rn = 1.' },
    ],
    onTheJob: 'Rankings (worst machines), running totals (order progress, cumulative downtime), moving averages (smoothing daily output) and period-over-period change are window functions. They are a favourite live-coding interview topic.',
    dialects: ['SQLite added window functions in version 3.25. SQL Server, PostgreSQL, Oracle and MySQL 8 support the same core syntax.'],
  },
  {
    id: 'quality', concept: 'datasci.sql-data-quality', title: 'Data-quality checks before you trust a number', level: 'Applied', minutes: 25,
    goal: 'Find duplicates, orphan records, missing values and totals that don’t reconcile, before they reach a report.',
    intuition: 'A query always returns an answer, even from bad data. A few standard checks tell you whether the answer deserves trust.',
    analogy: 'Calibrating the gauge before the capability study: you check the measurement system before you believe the measurements.',
    model: [
      'Duplicates: GROUP BY the columns that should be unique, HAVING COUNT(*) > 1.',
      'Orphans: LEFT JOIN child to parent and keep rows where the parent is NULL.',
      'Completeness: COUNT(*) − COUNT(column) per column.',
      'Reconciliation: two systems’ totals for the same thing should agree.',
      'Fix the source, or document the cleaning rule; never silently drop rows in a report.',
    ],
    syntax: '-- duplicates\nSELECT machine_id, run_date, shift, COUNT(*)\nFROM production\nGROUP BY machine_id, run_date, shift\nHAVING COUNT(*) > 1;\n\n-- orphans\nSELECT d.*\nFROM defects AS d\nLEFT JOIN production AS p ON p.run_id = d.run_id\nWHERE p.run_id IS NULL;',
    examples: [
      { id: 'dq-dupes', title: 'Duplicates', question: 'Is any machine-shift recorded twice?', sql: 'SELECT machine_id, run_date, shift,\n       COUNT(*) AS copies,\n       GROUP_CONCAT(run_id) AS run_ids\nFROM production\nGROUP BY machine_id, run_date, shift\nHAVING COUNT(*) > 1;', explain: ['There should be one run per machine per shift, so those three columns should be unique together.'], takeaway: 'Runs 23 and 81 are the same shift loaded twice. Every total in the earlier lessons counted it twice.' },
      { id: 'dq-orphans', title: 'Orphan records', question: 'Do any defect records point at a run that doesn’t exist?', sql: 'SELECT d.defect_id, d.run_id, d.code, d.qty\nFROM defects AS d\nLEFT JOIN production AS p ON p.run_id = d.run_id\nWHERE p.run_id IS NULL;', explain: ['LEFT JOIN keeps every defect; the ones with no matching run have NULL on the production side.'], takeaway: 'One defect row points at run 999, which doesn’t exist: 4 parts in the Pareto with no machine to blame.' },
      { id: 'dq-reconcile', title: 'Reconciliation', question: 'Does the defect log add up to the scrap recorded on each run?', sql: 'WITH d AS (\n  SELECT run_id, SUM(qty) AS defect_qty\n  FROM defects\n  GROUP BY run_id\n)\nSELECT p.run_id, p.scrap_qty, COALESCE(d.defect_qty, 0) AS defect_qty\nFROM production AS p\nLEFT JOIN d ON d.run_id = p.run_id\nWHERE p.scrap_qty <> COALESCE(d.defect_qty, 0);', explain: ['Aggregate defects per run first, then compare with the run’s scrap.'], takeaway: 'Only run 81, the duplicate, fails to reconcile. Fix the load, and the scrap report and the defect Pareto agree.' },
    ],
    mistakes: [
      { id: 'dq-distinct', title: 'Hiding duplicates with DISTINCT', wrong: "SELECT COUNT(DISTINCT run_id) AS runs FROM production WHERE machine_id = 'M3';", why: 'The duplicate has its own run_id, so DISTINCT doesn’t remove it, and on other columns DISTINCT can merge genuinely different rows. Find out why the duplicate exists instead.', fix: "SELECT COUNT(*) AS runs FROM (SELECT DISTINCT machine_id, run_date, shift FROM production WHERE machine_id = 'M3');" },
    ],
    tasks: [
      { id: 'dq-t1', task: 'Show, for the production table, how many rows there are and how many are missing a downtime reading, as two columns.', hint: 'COUNT(*) and COUNT(*) − COUNT(down_min)', solution: 'SELECT COUNT(*) AS rows_, COUNT(*) - COUNT(down_min) AS missing_down FROM production;' },
      { id: 'dq-t2', task: 'Recompute the plant scrap percentage (two decimals) without the duplicate run 81.', hint: 'WHERE run_id <> 81', solution: 'SELECT ROUND(100.0 * SUM(scrap_qty) / SUM(good_qty + scrap_qty), 2) AS scrap_pct FROM production WHERE run_id <> 81;' },
    ],
    interview: [
      { q: 'Before you present a number from a new dataset, what do you check?', a: 'Row counts against expectations, duplicates on the natural key, missing values in key columns, orphans across joins, value ranges, and a reconciliation of totals against a second source. Then I state what I found and how I handled it.' },
      { q: 'How do you find duplicate rows?', a: 'GROUP BY the columns that should be unique together, HAVING COUNT(*) > 1. Then trace why they exist before deleting anything.' },
    ],
    onTheJob: 'Plant data comes from operators, PLCs and interfaces that fail in ordinary ways: double loads, missed readings, codes typed differently. A short set of checks run every week catches them before a manager makes a decision on them.',
  },
  {
    id: 'design', concept: 'datasci.sql-indexes', title: 'Indexes, query plans and table design', level: 'Applied', minutes: 25,
    goal: 'Read a query plan, add an index that turns a scan into a search, and explain why tables are split the way they are.',
    intuition: 'Without an index the database reads every row to find the ones you want (a scan). An index is a sorted lookup that jumps straight to them (a search). Good table design stores each fact once and links tables by keys.',
    analogy: 'A book index versus reading every page: fast to look things up, but every new page means updating the index too.',
    model: [
      'EXPLAIN QUERY PLAN shows how SQLite will run a query: SCAN reads the whole table, SEARCH uses an index.',
      'Index the columns you filter and join on most; each index slows inserts and updates a little.',
      'Wrapping an indexed column in a function, e.g. date(run_date) = …, usually stops the index being used.',
      'Normalisation: store machine names once in machines, not in every production row, so a rename can’t leave two versions.',
      'Reporting databases often use a star schema: a fact table (production) surrounded by dimension tables (machines, products, dates).',
    ],
    syntax: "EXPLAIN QUERY PLAN\nSELECT * FROM production WHERE machine_id = 'M3';\n\nCREATE INDEX idx_production_machine ON production(machine_id);",
    examples: [
      { id: 'design-scan', title: 'A plan without an index', question: 'How does SQLite find M3’s runs today?', sql: "EXPLAIN QUERY PLAN\nSELECT run_id FROM production WHERE machine_id = 'M3';", explain: ['There is no index on machine_id, so every row is read.'], takeaway: 'SCAN production: every row is read to find M3’s runs. Harmless on a week of data; slow on a year of it.' },
      { id: 'design-search', title: 'The same query with an index', question: 'What changes after an index on machine_id?', sql: "CREATE INDEX idx_production_machine ON production(machine_id);\nEXPLAIN QUERY PLAN\nSELECT run_id FROM production WHERE machine_id = 'M3';", explain: ['The plan now searches the index for machine_id = ?.', 'run_id is the table’s key, so SQLite can answer from the index alone (a covering index).'], takeaway: 'SEARCH instead of SCAN: on millions of rows this is the difference between milliseconds and minutes.' },
    ],
    mistakes: [
      { id: 'design-function', title: 'A function on an indexed column', wrong: "CREATE INDEX idx_production_date ON production(run_date);\nEXPLAIN QUERY PLAN\nSELECT run_id FROM production WHERE date(run_date) = '2026-10-03';", why: 'The index is sorted by run_date, not by date(run_date), so SQLite can’t jump to the date: it reads the whole index instead (SCAN rather than SEARCH).', fix: "CREATE INDEX idx_production_date ON production(run_date);\nEXPLAIN QUERY PLAN\nSELECT run_id FROM production WHERE run_date = '2026-10-03';" },
    ],
    tasks: [
      { id: 'design-t1', task: 'Production stores only machine_id. Return each run on October 1 (day shift) with its machine name and line, without changing the tables.', hint: 'Join production to machines.', solution: "SELECT p.run_id, m.name, m.line FROM production AS p JOIN machines AS m ON m.machine_id = p.machine_id WHERE p.run_date = '2026-10-01' AND p.shift = 'Day';" },
      { id: 'design-t2', task: 'List each table in this database with its row count: production, defects, downtime, work_orders, machines, products.', hint: "SELECT 'production', COUNT(*) FROM production UNION ALL …", solution: "SELECT 'production' AS tbl, COUNT(*) AS n FROM production UNION ALL SELECT 'defects', COUNT(*) FROM defects UNION ALL SELECT 'downtime', COUNT(*) FROM downtime UNION ALL SELECT 'work_orders', COUNT(*) FROM work_orders UNION ALL SELECT 'machines', COUNT(*) FROM machines UNION ALL SELECT 'products', COUNT(*) FROM products;" },
    ],
    interview: [
      { q: 'A report query is slow. What do you look at first?', a: 'The query plan: is it scanning a big table where it should search an index? Then whether filters wrap indexed columns in functions, whether joins are on indexed keys, and whether it selects or sorts more data than it needs.' },
      { q: 'Why not index every column?', a: 'Each index takes space and must be updated on every insert, update and delete, so write-heavy tables like production logs slow down. Index what you filter, join and sort on often.' },
    ],
    onTheJob: 'MES and historian tables grow by millions of rows a year. Knowing why a query is slow, and asking for the right index, saves hours of waiting for reports.',
    dialects: ['The plan command differs: EXPLAIN QUERY PLAN (SQLite), EXPLAIN or EXPLAIN ANALYZE (PostgreSQL, MySQL), and the execution plan in SQL Server Management Studio.'],
  },
]

export const SQL_LESSON_MAP: Record<string, SqlLesson> = Object.fromEntries(SQL_LESSONS.map((l) => [l.id, l]))
