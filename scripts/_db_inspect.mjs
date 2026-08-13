import pg from '../node_modules/pg/lib/index.js';
const pool = new pg.Pool({ host:'127.0.0.1', port:5432, user:'crablearn', password:'crablearn123', database:'crablearn' });
const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
console.log('Tables:', tables.rows.map(r=>r.tablename).join(', '));
const cnt = await pool.query('SELECT COUNT(*) FROM account_entries');
console.log('account_entries rows:', cnt.rows[0].count);
const months = await pool.query('SELECT month_key,month_label,COUNT(*) as rows FROM account_entries GROUP BY month_key,month_label,month_date ORDER BY month_date');
months.rows.forEach(r => console.log(' ', r.month_label, '-', r.rows, 'rows'));
await pool.end();
