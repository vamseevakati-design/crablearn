import pg from '../node_modules/pg/lib/index.js';
const pool = new pg.Pool({ host:'127.0.0.1', port:5432, user:'crablearn', password:'crablearn123', database:'crablearn' });

// Show sample rows to diagnose blank student/teacher and bad IDs
const r1 = await pool.query(`SELECT student_name, student_id, teacher_name, clt_id, month_key FROM account_entries WHERE COALESCE(student_name,'') <> '' LIMIT 10`);
console.log('\n-- Sample student rows:');
r1.rows.forEach(r => console.log(JSON.stringify(r)));

// Count how many have blank student_name despite having a student_id
const r2 = await pool.query(`SELECT COUNT(*) FROM account_entries WHERE COALESCE(student_name,'') = '' AND COALESCE(student_id,'') <> ''`);
console.log('\nBlank student_name but has student_id:', r2.rows[0].count);

// Count how many have blank teacher
const r3 = await pool.query(`SELECT COUNT(*) FROM account_entries WHERE COALESCE(teacher_name,'') = ''`);
console.log('Blank teacher_name:', r3.rows[0].count, 'of', 312);

// Show distinct student_ids to spot malformed ones
const r4 = await pool.query(`SELECT DISTINCT student_id FROM account_entries WHERE COALESCE(student_id,'') <> '' ORDER BY student_id LIMIT 20`);
console.log('\nDistinct student_ids:', r4.rows.map(r=>r.student_id).join(', '));

// Show distinct clt_ids
const r5 = await pool.query(`SELECT DISTINCT clt_id FROM account_entries WHERE COALESCE(clt_id,'') <> '' ORDER BY clt_id LIMIT 20`);
console.log('Distinct clt_ids:', r5.rows.map(r=>r.clt_id).join(', '));

// Show rows where student_name is blank
const r6 = await pool.query(`SELECT student_name, student_id, teacher_name, clt_id, sheet_name, source_row_index FROM account_entries WHERE COALESCE(student_name,'') = '' LIMIT 10`);
console.log('\nRows with blank student_name:');
r6.rows.forEach(r => console.log(JSON.stringify(r)));

await pool.end();
