import pg from '../node_modules/pg/lib/index.js';
const pool = new pg.Pool({ host:'127.0.0.1', port:5432, user:'crablearn', password:'crablearn123', database:'crablearn' });
const s = await pool.query(`SELECT DISTINCT subject_name FROM account_entries WHERE COALESCE(subject_name,'') <> '' ORDER BY subject_name`);
console.log('Subjects:', s.rows.map(r => r.subject_name).join(', '));
const st = await pool.query(`SELECT DISTINCT sub_class_type_code FROM account_entries WHERE COALESCE(sub_class_type_code,'') <> '' ORDER BY sub_class_type_code`);
console.log('Sub-types:', st.rows.map(r => r.sub_class_type_code).join(', '));
await pool.end();
