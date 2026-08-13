import pg from '../node_modules/pg/lib/index.js';
const pool = new pg.Pool({ host:'127.0.0.1', port:5432, user:'crablearn', password:'crablearn123', database:'crablearn' });
const client = await pool.connect();

try {
  await client.query('BEGIN');

  // ── Step 1: Normalize name casing / spelling (same student, same ID) ─────────

  // Ian / IAN → Ian
  await client.query(`UPDATE account_entries SET student_name='Ian' WHERE student_name='IAN'`);

  // Vihan / Vihaun → Vihan
  await client.query(`UPDATE account_entries SET student_name='Vihan' WHERE student_name='Vihaun'`);

  // Manaswhini / Manaswini → Manaswini
  await client.query(`UPDATE account_entries SET student_name='Manaswini' WHERE student_name='Manaswhini'`);

  // Kately / KATELYN → Katelyn
  await client.query(`UPDATE account_entries SET student_name='Katelyn' WHERE student_name IN ('Kately','KATELYN')`);

  // ILA JAS / Ila Jas Kabilan → Ila Jas Kabilan
  await client.query(`UPDATE account_entries SET student_name='Ila Jas Kabilan' WHERE student_name='ILA JAS'`);

  // All-caps name normalizations
  await client.query(`UPDATE account_entries SET student_name='Kirthika'       WHERE student_name='KIRTHIKA'`);
  await client.query(`UPDATE account_entries SET student_name='Dharani Krishnan' WHERE student_name='DHARANI'`);
  await client.query(`UPDATE account_entries SET student_name='Dharani Krishnan' WHERE student_name='Dharani'`);
  await client.query(`UPDATE account_entries SET student_name='Tharun'         WHERE student_name='THARUN'`);
  await client.query(`UPDATE account_entries SET student_name='Aarav'          WHERE student_name='AARAV'`);
  await client.query(`UPDATE account_entries SET student_name='Ananya'         WHERE student_name='ANANYA'`);
  await client.query(`UPDATE account_entries SET student_name='English Batch 4'    WHERE student_name='ENGLISH BATCH 4'`);
  await client.query(`UPDATE account_entries SET student_name='English Juniors 4'  WHERE student_name='ENGLISH JUNIORS 4'`);
  await client.query(`UPDATE account_entries SET student_name='Lokesh'         WHERE student_name='lokesh'`);
  await client.query(`UPDATE account_entries SET student_name='Sashish'        WHERE student_name='Sashish'`);

  // 2025 workbook name variants
  await client.query(`UPDATE account_entries SET student_name='Ian'            WHERE student_name ~ '^Ian[- ]'`);
  await client.query(`UPDATE account_entries SET student_name='Giana'          WHERE student_name='GIANA'`);
  await client.query(`UPDATE account_entries SET student_name='Sashish'        WHERE student_name='SASHISH'`);
  await client.query(`UPDATE account_entries SET student_name='Dheer'          WHERE student_name='DHEER'`);

  // Normalize teacher names (2026 and 2025)
  await client.query(`UPDATE account_entries SET teacher_name='Lakshmi Priya'  WHERE LOWER(teacher_name)='lakshmi priya'`);
  await client.query(`UPDATE account_entries SET teacher_name='Della'          WHERE teacher_name IN ('DELLA','Della')`);
  await client.query(`UPDATE account_entries SET teacher_name='Surekha'        WHERE teacher_name IN ('SUREKHA','Surekha ')`);
  await client.query(`UPDATE account_entries SET teacher_name='Jagan'          WHERE teacher_name='JAGAN'`);
  await client.query(`UPDATE account_entries SET teacher_name='Mahalakshmi'    WHERE teacher_name='MAHALAKSHMI'`);
  await client.query(`UPDATE account_entries SET teacher_name='Soniya'         WHERE teacher_name IN ('SONIYA','Soniya ')`);
  await client.query(`UPDATE account_entries SET teacher_name='Chithra'        WHERE teacher_name='CHITHRA'`);
  await client.query(`UPDATE account_entries SET teacher_name='Pavithra'       WHERE teacher_name='PAVITHRA'`);
  await client.query(`UPDATE account_entries SET teacher_name='Gaurav Prateek' WHERE teacher_name='GAURAV PRATEEK'`);
  await client.query(`UPDATE account_entries SET teacher_name='Clement Vivian' WHERE teacher_name IN ('CLEMENT VIVIAN','CLEMENT','Clement')`);
  await client.query(`UPDATE account_entries SET teacher_name='Padmaja'        WHERE teacher_name IN ('PADMAJA M','Padmaja M','PADMAJA','Padmaja ')`);
  await client.query(`UPDATE account_entries SET teacher_name='Janani'         WHERE teacher_name IN ('JANANI','Janani ')`);
  await client.query(`UPDATE account_entries SET teacher_name='Reginald'       WHERE teacher_name IN ('REGINALD','Reginald')`);
  await client.query(`UPDATE account_entries SET teacher_name='Soniya'         WHERE teacher_name='Soniya'`);

  // ── Step 2: Consolidate same student split across two IDs ────────────────────

  // Orietta: merge CLS-0008 → CLS-0001
  await client.query(`UPDATE account_entries SET student_id='CLS-0001' WHERE student_name='Orietta' AND student_id='CLS-0008'`);

  // Dheer: merge CLS-0039 → CLS-0012
  await client.query(`UPDATE account_entries SET student_id='CLS-0012' WHERE student_name='Dheer' AND student_id='CLS-0039'`);

  // Nandhitha: consolidate CLS-0032 rows → CLS-0030
  await client.query(`UPDATE account_entries SET student_id='CLS-0030' WHERE student_name='Nandhitha' AND student_id='CLS-0032'`);

  // ── Step 3: Assign new IDs to students wrongly sharing another student's ID ──

  // Nihith was sharing CLS-0001 with Orietta → new CLS-0052
  await client.query(`UPDATE account_entries SET student_id='CLS-0052' WHERE student_name='Nihith'`);

  // Saina was sharing CLS-0023 with Nizma → new CLS-0053
  await client.query(`UPDATE account_entries SET student_id='CLS-0053' WHERE student_name='Saina'`);

  // VARUN was sharing CLS-0031 with Shashank → normalize name + new CLS-0054
  await client.query(`UPDATE account_entries SET student_name='Varun', student_id='CLS-0054' WHERE student_name='VARUN'`);

  // Dhiyasharini G was sharing CLS-0032 with Akil → new CLS-0055
  await client.query(`UPDATE account_entries SET student_id='CLS-0055' WHERE student_name='Dhiyasharini G'`);

  // Vallavan was sharing CLS-0034 with Ila Jas Kabilan → new CLS-0056
  await client.query(`UPDATE account_entries SET student_id='CLS-0056' WHERE student_name='Vallavan'`);

  // JAYANTH was sharing CLS-0037 with Tharun → normalize name + new CLS-0057
  await client.query(`UPDATE account_entries SET student_name='Jayanth', student_id='CLS-0057' WHERE student_name='JAYANTH'`);

  await client.query('COMMIT');
  console.log('All data issues fixed successfully.');

  // Verify: check if any ID still has multiple distinct names
  const remaining = await pool.query(`
    SELECT student_id, array_agg(DISTINCT student_name ORDER BY student_name) AS names
    FROM account_entries
    WHERE student_id IS NOT NULL AND COALESCE(student_name,'') <> ''
    GROUP BY student_id HAVING COUNT(DISTINCT student_name) > 1
    ORDER BY student_id
  `);
  if (remaining.rows.length === 0) {
    console.log('Verification: No ID conflicts remain.');
  } else {
    console.log('Remaining conflicts:');
    remaining.rows.forEach(r => console.log(`  ${r.student_id}: ${r.names.join(' | ')}`));
  }

  // Show new student summary
  const summary = await pool.query(`
    SELECT COUNT(DISTINCT student_id) AS unique_ids, COUNT(DISTINCT student_name) AS unique_names, COUNT(*) AS total_rows
    FROM account_entries WHERE COALESCE(student_name,'') <> ''
  `);
  console.log(`Summary: ${summary.rows[0].unique_ids} unique IDs, ${summary.rows[0].unique_names} unique names, ${summary.rows[0].total_rows} total rows`);

} catch (err) {
  await client.query('ROLLBACK');
  console.error('ROLLBACK — error:', err.message);
} finally {
  client.release();
  await pool.end();
}
