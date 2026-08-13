import pg from '../node_modules/pg/lib/index.js';
const pool = new pg.Pool({ host:'127.0.0.1', port:5432, user:'crablearn', password:'crablearn123', database:'crablearn' });

// Find all duplicate student rows in same month (same student_id, same month_key, multiple rows)
const dups = await pool.query(`
  SELECT student_id, student_name, month_key, COUNT(*) AS n,
         array_agg(id ORDER BY fees_month DESC NULLS LAST) AS ids,
         array_agg(COALESCE(fees_month,0) ORDER BY fees_month DESC NULLS LAST) AS fees
  FROM account_entries
  WHERE student_id IS NOT NULL AND COALESCE(student_name,'') <> ''
  GROUP BY student_id, student_name, month_key
  HAVING COUNT(*) > 1
  ORDER BY student_name, month_key
`);
console.log('Duplicate groups:', dups.rows.length);
dups.rows.forEach(r => console.log(`  ${r.student_name} (${r.student_id}) ${r.month_key}: ids=${r.ids} fees=${r.fees}`));

// For each group, delete the row(s) with zero or null fees (keeping the real data row)
let deleted = 0;
for (const row of dups.rows) {
  // Keep the first id (highest fees), delete the rest only if they have 0/null fees
  const [keepId, ...rest] = row.ids;
  for (const id of rest) {
    const entry = await pool.query('SELECT fees_month, tutor_salary_paid, profit, teacher_name FROM account_entries WHERE id=$1', [id]);
    const e = entry.rows[0];
    const isEmpty = !e.teacher_name && (Number(e.fees_month)||0) === 0 && (Number(e.tutor_salary_paid)||0) === 0;
    if (isEmpty) {
      await pool.query('DELETE FROM account_entries WHERE id=$1', [id]);
      console.log(`  Deleted empty duplicate id=${id} for ${row.student_name} ${row.month_key}`);
      deleted++;
    } else {
      console.log(`  KEPT id=${id} (has data) — manual review needed for ${row.student_name} ${row.month_key}`);
    }
  }
}
console.log(`\nDeleted ${deleted} empty duplicate rows.`);
await pool.end();
