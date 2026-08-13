import pg from '../node_modules/pg/lib/index.js';
const pool = new pg.Pool({ host:'127.0.0.1', port:5432, user:'crablearn', password:'crablearn123', database:'crablearn' });

const students = await pool.query(`
  SELECT student_name, student_id, COUNT(*) as rows
  FROM account_entries
  WHERE COALESCE(student_name,'') <> ''
  GROUP BY student_name, student_id ORDER BY student_id NULLS LAST, student_name`);
console.log('\nStudents:');
students.rows.forEach(r => console.log(`  ${r.student_id || 'NULL'} | ${r.student_name} | ${r.rows} rows`));

const teachers = await pool.query(`
  SELECT teacher_name, clt_id, COUNT(*) as rows
  FROM account_entries
  WHERE COALESCE(teacher_name,'') <> ''
  GROUP BY teacher_name, clt_id ORDER BY clt_id NULLS LAST, teacher_name`);
console.log('\nTeachers:');
teachers.rows.forEach(r => console.log(`  ${r.clt_id || 'NULL'} | ${r.teacher_name} | ${r.rows} rows`));

await pool.end();
