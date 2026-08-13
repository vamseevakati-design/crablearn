import pg from '../node_modules/pg/lib/index.js';
const pool = new pg.Pool({ host:'127.0.0.1', port:5432, user:'crablearn', password:'crablearn123', database:'crablearn' });

// Find all IDs that have more than one distinct student_name
const conflicts = await pool.query(`
  SELECT student_id, array_agg(DISTINCT student_name ORDER BY student_name) AS names, COUNT(DISTINCT student_name) AS n
  FROM account_entries
  WHERE student_id IS NOT NULL AND COALESCE(student_name,'') <> ''
  GROUP BY student_id
  HAVING COUNT(DISTINCT student_name) > 1
  ORDER BY student_id
`);
console.log('\n=== Same ID, different names ===');
conflicts.rows.forEach(r => console.log(`  ${r.student_id}: ${r.names.join(' | ')}`));

// Find all student_names that appear under more than one distinct ID
const splitIds = await pool.query(`
  SELECT student_name, array_agg(DISTINCT student_id ORDER BY student_id) AS ids, COUNT(DISTINCT student_id) AS n
  FROM account_entries
  WHERE student_id IS NOT NULL AND COALESCE(student_name,'') <> ''
  GROUP BY student_name
  HAVING COUNT(DISTINCT student_id) > 1
  ORDER BY student_name
`);
console.log('\n=== Same name, different IDs ===');
splitIds.rows.forEach(r => console.log(`  "${r.student_name}": ${r.ids.join(' | ')}`));

// Show each conflict row with teacher and month context for analysis
console.log('\n=== Conflict detail (ID shares) ===');
for (const row of conflicts.rows) {
  const detail = await pool.query(`
    SELECT DISTINCT student_id, student_name, teacher_name, clt_id, class_type_code, subject_name, month_label
    FROM account_entries WHERE student_id = $1 ORDER BY student_name, month_label
  `, [row.student_id]);
  console.log(`\n  ${row.student_id}:`);
  detail.rows.forEach(d => console.log(`    ${d.student_name} | ${d.teacher_name || '-'} | ${d.class_type_code || '-'} | ${d.subject_name || '-'} | ${d.month_label}`));
}

await pool.end();
