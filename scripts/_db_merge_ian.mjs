import pg from '../node_modules/pg/lib/index.js';
const pool = new pg.Pool({ host:'127.0.0.1', port:5432, user:'crablearn', password:'crablearn123', database:'crablearn' });
const r = await pool.query('UPDATE account_entries SET student_id=$1 WHERE student_id=$2', ['CLS-0003','CLS-0063']);
console.log('Merged CLS-0063 → CLS-0003, rows updated:', r.rowCount);
const t = await pool.query('SELECT COUNT(DISTINCT student_id) AS ids, COUNT(DISTINCT student_name) AS names FROM account_entries WHERE COALESCE(student_name,\'\') <> \'\'');
console.log('Unique IDs:', t.rows[0].ids, ' Unique names:', t.rows[0].names);
await pool.end();
