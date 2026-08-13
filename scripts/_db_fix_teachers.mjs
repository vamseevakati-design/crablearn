import pg from '../node_modules/pg/lib/index.js';
const pool = new pg.Pool({ host:'127.0.0.1', port:5432, user:'crablearn', password:'crablearn123', database:'crablearn' });

// Fill blank teacher_name for rows that have a student_id where we know the teacher from another row
const fill = await pool.query(`
  UPDATE account_entries t
  SET teacher_name = src.teacher_name,
      clt_id       = src.clt_id
  FROM (
    SELECT DISTINCT ON (student_id) student_id, teacher_name, clt_id
    FROM account_entries
    WHERE student_id IS NOT NULL
      AND COALESCE(teacher_name, '') <> ''
    ORDER BY student_id, month_date DESC
  ) src
  WHERE t.student_id = src.student_id
    AND COALESCE(t.teacher_name, '') = ''
`);
console.log('Rows updated with teacher from same student_id:', fill.rowCount);

// Report remaining blanks
const blanks = await pool.query(`SELECT COUNT(*) FROM account_entries WHERE COALESCE(teacher_name,'') = '' AND COALESCE(student_name,'') <> ''`);
console.log('Remaining blank teacher with non-empty student:', blanks.rows[0].count);

const total = await pool.query('SELECT COUNT(*) FROM account_entries');
console.log('Total rows:', total.rows[0].count);
await pool.end();
