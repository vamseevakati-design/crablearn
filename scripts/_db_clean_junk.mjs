import pg from '../node_modules/pg/lib/index.js';
const pool = new pg.Pool({ host:'127.0.0.1', port:5432, user:'crablearn', password:'crablearn123', database:'crablearn' });
const del = await pool.query(`DELETE FROM account_entries WHERE student_name ~* 'tutor salary|compensated with'`);
console.log('Junk rows deleted:', del.rowCount);
const total = await pool.query('SELECT COUNT(*) FROM account_entries');
console.log('Total rows:', total.rows[0].count);
await pool.end();
