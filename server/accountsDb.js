import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import XLSX from "xlsx";

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");

const monthNames = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12
};

let pool;

function getPool() {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    host: process.env.PGHOST || "127.0.0.1",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "crablearn",
    password: process.env.PGPASSWORD || "crablearn123",
    database: process.env.PGDATABASE || "crablearn"
  });

  return pool;
}

function toNumber(value) {
  const normalized = String(value ?? "")
    .replace(/[\u20b9$,]/g, "")
    .replace(/\s+/g, "")
    .trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeKey(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeSheetRows(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
  if (!rows.length) {
    return [];
  }

  const firstRow = rows[0];
  const keys = Object.keys(firstRow);
  const hasSyntheticKeys = keys.every((key) => key.startsWith("__EMPTY"));

  if (!hasSyntheticKeys) {
    return rows
      .map((row, index) => ({ ...row, __sourceRowIndex: index + 2 }))
      .filter((row) => Object.values(row).some((cell) => String(cell || "").trim() !== ""));
  }

  const headerMap = {};
  for (const key of keys) {
    const headerName = normalizeKey(firstRow[key]);
    if (headerName) {
      headerMap[key] = headerName;
    }
  }

  return rows
    .slice(1)
    .map((row, index) => {
      const mapped = { __sourceRowIndex: index + 3 };
      for (const key of keys) {
        const targetKey = headerMap[key];
        if (targetKey) {
          mapped[targetKey] = row[key];
        }
      }
      return mapped;
    })
    .filter((row) => {
      const values = Object.entries(row)
        .filter(([key]) => key !== "__sourceRowIndex")
        .map(([, value]) => String(value || "").trim());
      return values.some((value) => value);
    });
}

function parseMonth(sheetName) {
  // Strip trailing punctuation/spaces (e.g. "022026.")
  const normalized = String(sheetName || "").trim().replace(/[.\s]+$/, "");

  const mmYYYY = normalized.match(/^(\d{2})(\d{4})$/);
  if (mmYYYY) {
    const month = Number(mmYYYY[1]);
    const year = Number(mmYYYY[2]);
    if (month >= 1 && month <= 12) {
      const monthKey = `${year}-${String(month).padStart(2, "0")}`;
      return {
        monthKey,
        monthLabel: new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC"
        }),
        monthDate: `${monthKey}-01`
      };
    }
  }

  const words = normalized.toLowerCase().match(/([a-z]+)\s+(\d{4})/);
  if (words) {
    const month = monthNames[words[1]];
    const year = Number(words[2]);
    if (month && Number.isFinite(year)) {
      const monthKey = `${year}-${String(month).padStart(2, "0")}`;
      return {
        monthKey,
        monthLabel: new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC"
        }),
        monthDate: `${monthKey}-01`
      };
    }
  }

  return null;
}

function pick(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined) {
      return row[key];
    }
  }
  return "";
}

function mapEntry(row, monthMeta, sheetName) {
  const sno = normalizeKey(pick(row, ["S No"]));
  const studentName = normalizeKey(pick(row, ["Student Name", "Student Name ", "Student Name"]));
  const studentId = normalizeKey(pick(row, ["Student ID"]));
  const teacherName = normalizeKey(pick(row, ["CLT NAME"]));
  const classTypeCode = normalizeKey(pick(row, ["Class Type Code"]));
  const subClassTypeCode = normalizeKey(pick(row, ["Sub Class Type Code"]));

  // Skip tutor payment section rows — CLT ID in S No column (col-0 layout in most months).
  if (/^CLT-/i.test(sno)) return null;

  // Ignore repeated header rows and payment-section header rows.
  const snl = studentName.toLowerCase();
  const sidl = studentId.toLowerCase();
  if (snl === "student name" || snl === "tutor name" || snl === "tutor code"
      || sidl === "student name" || sidl === "tutor name" || sidl === "tutor code"
      || teacherName.toLowerCase() === "clt name") {
    return null;
  }

  // Skip tutor payment section rows — CLT IDs or person-names bleeding into student columns (col-2 layout).
  if (/^CLT-/i.test(studentId) || /^CLT-/i.test(studentName)) return null;

  // Skip summary/metadata rows (carry-overs, totals, notes, and long free-text entries).
  if (/^(carry over|ffg-|fit for growth|expenses|total$)/i.test(studentName)) return null;
  if (/tutor salary|compensated with/i.test(studentName)) return null;

  // Accept 2025 workbook column aliases alongside the standard 2026 names.
  const fees = toNumber(pick(row, ["Fees/month", "Fees Paid", "FeesPerMonth", "FeesPaid"]));
  const tutorSalaryPaid = toNumber(pick(row, ["Tutor Salary Paid"]));
  const profit = toNumber(pick(row, ["Profit"]));

  const hasData =
    studentName ||
    studentId ||
    teacherName ||
    classTypeCode ||
    subClassTypeCode ||
    fees !== null ||
    tutorSalaryPaid !== null ||
    profit !== null;

  if (!hasData) {
    return null;
  }

  // Skip rows that have only a name with no ID and no financial/class data (free-text notes).
  const cltId = normalizeKey(pick(row, ["CLT ID"]));
  if (studentName && !studentId && !cltId && !classTypeCode && fees === null && tutorSalaryPaid === null && profit === null) {
    return null;
  }

  return {
    monthKey: monthMeta.monthKey,
    monthLabel: monthMeta.monthLabel,
    monthDate: monthMeta.monthDate,
    sheetName,
    sourceRowIndex: Number(row.__sourceRowIndex || 0),
    studentName: studentName || null,
    studentId: studentId || null,
    classTypeCode: classTypeCode || null,
    subClassTypeCode: subClassTypeCode || null,
    subjectName: normalizeKey(pick(row, ["Subject Name", "CM FEES"])) || null,
    feesMonth: fees,
    carryOverTutorFees: toNumber(pick(row, ["Carry Over Tutor Fees"])),
    paymentDate: normalizeKey(pick(row, ["Payment date", "PaymentDate"])) || null,
    tutorSalaryHr: toNumber(pick(row, ["Tutor salary/hr", "TutorSalaryPerHr"])),
    cmc: toNumber(pick(row, ["CMC"])),
    coc: toNumber(pick(row, ["COC"])),
    tec: toNumber(pick(row, ["TEC", "TEClasses"])),
    additionalClass: toNumber(pick(row, ["Additinal Class", "AdditinalClass"])),
    cmcCompleted: toNumber(pick(row, ["CMC completed", "CMCCompleted", "TCCompleted"])),
    pendingClasses: toNumber(pick(row, ["Pending Classes", "PendingClasses"])),
    cltId: normalizeKey(pick(row, ["CLT ID"])) || null,
    teacherName: teacherName || null,
    tutorSalaryPaid,
    allotedSalaryBalance: toNumber(pick(row, ["Alloted Salary Balance"])),
    profit,
    jananiShare: toNumber(pick(row, ["Janani", "Janani "])),
    padmajaShare: toNumber(pick(row, ["Padmaja"])),
    crablearnShare: toNumber(pick(row, ["Crablearn"])),
    accumulatedProfit: toNumber(pick(row, ["Crablearn-Accumulated Profit"])),
    expensesDec: toNumber(pick(row, ["EXPENSES DEC"])),
    rawRow: row
  };
}

export async function ensureAccountsSchema() {
  const sql = `
    CREATE TABLE IF NOT EXISTS account_entries (
      id BIGSERIAL PRIMARY KEY,
      month_key TEXT NOT NULL,
      month_label TEXT NOT NULL,
      month_date DATE NOT NULL,
      sheet_name TEXT NOT NULL,
      source_row_index INTEGER NOT NULL,
      student_name TEXT,
      student_id TEXT,
      class_type_code TEXT,
      sub_class_type_code TEXT,
      subject_name TEXT,
      fees_month NUMERIC(12,2),
      carry_over_tutor_fees NUMERIC(12,2),
      payment_date TEXT,
      tutor_salary_hr NUMERIC(12,2),
      cmc NUMERIC(12,2),
      coc NUMERIC(12,2),
      tec NUMERIC(12,2),
      additional_class NUMERIC(12,2),
      cmc_completed NUMERIC(12,2),
      pending_classes NUMERIC(12,2),
      clt_id TEXT,
      teacher_name TEXT,
      tutor_salary_paid NUMERIC(12,2),
      alloted_salary_balance NUMERIC(12,2),
      profit NUMERIC(12,2),
      janani_share NUMERIC(12,2),
      padmaja_share NUMERIC(12,2),
      crablearn_share NUMERIC(12,2),
      accumulated_profit NUMERIC(12,2),
      expenses_dec NUMERIC(12,2),
      raw_row JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (month_key, sheet_name, source_row_index)
    );
  `;

  await getPool().query(sql);
}

function resolveWorkbookPath(workbookPath) {
  const input = String(workbookPath || "").trim() || "reference/Accounts 2026.xlsx";
  return path.isAbsolute(input) ? input : path.resolve(workspaceRoot, input);
}

export async function importWorkbookToAccounts(workbookPath, { skipSheets = [] } = {}) {
  const absolutePath = resolveWorkbookPath(workbookPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Workbook not found at ${absolutePath}`);
  }

  await ensureAccountsSchema();

  const workbook = XLSX.readFile(absolutePath);
  const entries = [];
  const skipSet = new Set((skipSheets || []).map(s => String(s).trim()));

  for (const sheetName of workbook.SheetNames) {
    if (skipSet.has(sheetName)) continue;
    const monthMeta = parseMonth(sheetName);
    if (!monthMeta) {
      continue;
    }

    const normalizedRows = normalizeSheetRows(workbook.Sheets[sheetName]);

    // Propagate CLT ID/NAME from each S-No batch header to its blank sub-rows.
    let batchCltId = "";
    let batchCltName = "";
    for (const row of normalizedRows) {
      const sno = normalizeKey(pick(row, ["S No"]));
      const cltId = normalizeKey(pick(row, ["CLT ID"]));
      const cltName = normalizeKey(pick(row, ["CLT NAME"]));
      // Rows where S No holds a CLT ID belong to the payment section — stop propagating.
      if (/^CLT-/i.test(sno)) { batchCltId = ""; batchCltName = ""; continue; }
      if (sno) {
        batchCltId = cltId;
        batchCltName = cltName;
      } else if (!cltId && batchCltId) {
        row["CLT ID"] = batchCltId;
        row["CLT NAME"] = batchCltName;
      }
    }

    for (const row of normalizedRows) {
      const entry = mapEntry(row, monthMeta, sheetName);
      if (entry) {
        entries.push(entry);
      }
    }
  }

  const client = await getPool().connect();
  try {
    // Delete only the months being imported so multiple workbooks can coexist.
    const monthKeys = [...new Set(entries.map(e => e.monthKey))];
    await client.query("BEGIN");
    if (monthKeys.length > 0) {
      await client.query(`DELETE FROM account_entries WHERE month_key = ANY($1::text[])`, [monthKeys]);
    }

    const insertSql = `
      INSERT INTO account_entries (
        month_key, month_label, month_date, sheet_name, source_row_index,
        student_name, student_id, class_type_code, sub_class_type_code, subject_name,
        fees_month, carry_over_tutor_fees, payment_date, tutor_salary_hr,
        cmc, coc, tec, additional_class, cmc_completed, pending_classes,
        clt_id, teacher_name, tutor_salary_paid, alloted_salary_balance, profit,
        janani_share, padmaja_share, crablearn_share, accumulated_profit, expenses_dec,
        raw_row
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,$13,$14,
        $15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,
        $26,$27,$28,$29,$30,
        $31
      )
    `;

    for (const entry of entries) {
      await client.query(insertSql, [
        entry.monthKey,
        entry.monthLabel,
        entry.monthDate,
        entry.sheetName,
        entry.sourceRowIndex,
        entry.studentName,
        entry.studentId,
        entry.classTypeCode,
        entry.subClassTypeCode,
        entry.subjectName,
        entry.feesMonth,
        entry.carryOverTutorFees,
        entry.paymentDate,
        entry.tutorSalaryHr,
        entry.cmc,
        entry.coc,
        entry.tec,
        entry.additionalClass,
        entry.cmcCompleted,
        entry.pendingClasses,
        entry.cltId,
        entry.teacherName,
        entry.tutorSalaryPaid,
        entry.allotedSalaryBalance,
        entry.profit,
        entry.jananiShare,
        entry.padmajaShare,
        entry.crablearnShare,
        entry.accumulatedProfit,
        entry.expensesDec,
        JSON.stringify(entry.rawRow)
      ]);
    }

    // Back-fill teacher for batch sub-rows using the most recent known teacher for the same student.
    await client.query(`
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

    // Rename student IDs: CL-XXXX → CLS-XXXX (any case).
    await client.query(`
      UPDATE account_entries
      SET student_id = 'CLS-' || SUBSTRING(student_id FROM 4)
      WHERE student_id ~* '^cl-'
    `);

    // Auto-assign CLS IDs to students that still have no student_id.
    await client.query(`
      WITH max_num AS (
        SELECT COALESCE(MAX(CAST(SUBSTRING(student_id FROM 5) AS INTEGER)), 0) AS n
        FROM account_entries
        WHERE student_id ~* '^cls-[0-9]+'
      ),
      uniq AS (
        SELECT DISTINCT student_name,
          ROW_NUMBER() OVER (ORDER BY student_name) AS rn
        FROM account_entries
        WHERE student_id IS NULL
          AND COALESCE(student_name, '') <> ''
          AND student_name !~* '^(total|tutor|student name|tutor name)'
      ),
      new_ids AS (
        SELECT u.student_name,
          'CLS-' || LPAD(CAST(m.n + u.rn AS TEXT), 4, '0') AS new_id
        FROM uniq u, max_num m
      )
      UPDATE account_entries ae
      SET student_id = ni.new_id
      FROM new_ids ni
      WHERE ae.student_name = ni.student_name
        AND ae.student_id IS NULL
    `);

    // Auto-assign CLT IDs to teachers that have no clt_id.
    await client.query(`
      WITH max_num AS (
        SELECT COALESCE(MAX(CAST(SUBSTRING(clt_id FROM 5) AS INTEGER)), 0) AS n
        FROM account_entries
        WHERE clt_id ~* '^clt-[0-9]+'
      ),
      uniq AS (
        SELECT DISTINCT teacher_name,
          ROW_NUMBER() OVER (ORDER BY teacher_name) AS rn
        FROM account_entries
        WHERE clt_id IS NULL
          AND COALESCE(teacher_name, '') <> ''
      ),
      new_ids AS (
        SELECT u.teacher_name,
          'CLT-' || LPAD(CAST(m.n + u.rn AS TEXT), 4, '0') AS new_id
        FROM uniq u, max_num m
      )
      UPDATE account_entries ae
      SET clt_id = ni.new_id
      FROM new_ids ni
      WHERE ae.teacher_name = ni.teacher_name
        AND ae.clt_id IS NULL
    `);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return {
    workbookPath: absolutePath,
    sheetsScanned: workbook.SheetNames.length,
    rowsImported: entries.length
  };
}

function monthLabelToKeys(label) {
  const months = { january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12 };
  const m = String(label || "").trim().toLowerCase().match(/([a-z]+)\s+(\d{4})/);
  if (!m) return null;
  const monthNum = months[m[1]];
  const year = Number(m[2]);
  if (!monthNum || !year) return null;
  const monthKey = `${year}-${String(monthNum).padStart(2, "0")}`;
  const monthLabel = String(label).trim();
  return { monthKey, monthDate: `${monthKey}-01`, monthLabel };
}

export async function getRosterStudents() {
  await ensureAccountsSchema();
  const result = await getPool().query(`
    SELECT DISTINCT ON (student_id) student_id, student_name
    FROM account_entries
    WHERE student_id IS NOT NULL AND COALESCE(student_name,'') <> ''
    ORDER BY student_id ASC, student_name ASC
  `);
  return result.rows;
}

export async function getRosterTeachers() {
  await ensureAccountsSchema();
  const result = await getPool().query(`
    SELECT DISTINCT ON (clt_id) clt_id, teacher_name
    FROM account_entries
    WHERE clt_id IS NOT NULL AND COALESCE(teacher_name,'') <> ''
    ORDER BY clt_id ASC, teacher_name ASC
  `);
  return result.rows;
}

export async function getRosterSubjects() {
  await ensureAccountsSchema();
  // Filter out rows that are currency totals or clearly not subject/sub-type names.
  const [subjects, subTypes] = await Promise.all([
    getPool().query(`
      SELECT DISTINCT subject_name AS value
      FROM account_entries
      WHERE COALESCE(subject_name,'') <> ''
        AND subject_name !~ E'^[\\u20B9\\$0-9]'
        AND LENGTH(subject_name) > 1
      ORDER BY subject_name ASC
    `),
    getPool().query(`
      SELECT DISTINCT sub_class_type_code AS value
      FROM account_entries
      WHERE COALESCE(sub_class_type_code,'') <> ''
        AND sub_class_type_code !~ E'^[\\u20B9\\$0-9]'
        AND LENGTH(sub_class_type_code) > 1
        AND sub_class_type_code NOT IN ('O2O','N2N')
      ORDER BY sub_class_type_code ASC
    `)
  ]);
  return {
    subjects: subjects.rows.map(r => r.value),
    subTypes: subTypes.rows.map(r => r.value)
  };
}

export async function createAccountEntry(entry) {
  await ensureAccountsSchema();
  const pool = getPool();

  // Coerce empty strings to null for all numeric fields.
  const num = (v) => (v === "" || v === null || v === undefined) ? null : Number(v);

  // Resolve or auto-assign student_id
  let studentId = (entry.studentId || "").trim();
  if (!studentId && entry.studentName) {
    const existing = await pool.query(
      `SELECT student_id FROM account_entries WHERE LOWER(student_name)=LOWER($1) AND student_id IS NOT NULL LIMIT 1`,
      [entry.studentName]
    );
    if (existing.rows.length) {
      studentId = existing.rows[0].student_id;
    } else {
      const max = await pool.query(`SELECT COALESCE(MAX(CAST(SUBSTRING(student_id FROM 5) AS INTEGER)),0) AS n FROM account_entries WHERE student_id ~* '^cls-[0-9]+'`);
      studentId = `CLS-${String(max.rows[0].n + 1).padStart(4, "0")}`;
    }
  }

  // Resolve or auto-assign clt_id
  let cltId = (entry.cltId || "").trim();
  if (!cltId && entry.teacherName) {
    const existing = await pool.query(
      `SELECT clt_id FROM account_entries WHERE LOWER(teacher_name)=LOWER($1) AND clt_id IS NOT NULL LIMIT 1`,
      [entry.teacherName]
    );
    if (existing.rows.length) {
      cltId = existing.rows[0].clt_id;
    } else {
      const max = await pool.query(`SELECT COALESCE(MAX(CAST(SUBSTRING(clt_id FROM 5) AS INTEGER)),0) AS n FROM account_entries WHERE clt_id ~* '^clt-[0-9]+'`);
      cltId = `CLT-${String(max.rows[0].n + 1).padStart(4, "0")}`;
    }
  }

  const keys = monthLabelToKeys(entry.monthLabel);
  if (!keys) throw new Error(`Cannot parse month: "${entry.monthLabel}". Use format "Month YYYY".`);

  const result = await pool.query(`
    INSERT INTO account_entries
      (month_key, month_label, month_date, sheet_name, source_row_index,
       student_name, student_id, class_type_code, sub_class_type_code, subject_name,
       fees_month, carry_over_tutor_fees, payment_date, tutor_salary_hr,
       clt_id, teacher_name, tutor_salary_paid, alloted_salary_balance, profit,
       janani_share, padmaja_share, crablearn_share)
    VALUES
      ($1,$2,$3,'manual',0,
       $4,$5,$6,$7,$8,
       $9,$10,$11,$12,
       $13,$14,$15,$16,$17,
       $18,$19,$20)
    RETURNING *
  `, [
    keys.monthKey, keys.monthLabel, keys.monthDate,
    entry.studentName || null, studentId || null,
    entry.classTypeCode || null, entry.subClassTypeCode || null, entry.subjectName || null,
    num(entry.feesMonth), num(entry.carryOverTutorFees), entry.paymentDate || null, num(entry.tutorSalaryHr),
    cltId || null, entry.teacherName || null,
    num(entry.tutorSalaryPaid), num(entry.allotedSalaryBalance), num(entry.profit),
    num(entry.jananiShare), num(entry.padmajaShare), num(entry.crablearnShare)
  ]);
  return result.rows[0];
}

export async function updateAccountEntry(id, fields) {
  await ensureAccountsSchema();
  const allowed = ["student_name","student_id","teacher_name","clt_id","class_type_code","sub_class_type_code",
    "subject_name","fees_month","carry_over_tutor_fees","payment_date","tutor_salary_hr",
    "tutor_salary_paid","alloted_salary_balance","profit","janani_share","padmaja_share","crablearn_share"];
  const sets = [];
  const vals = [];
  let i = 1;
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${i++}`);
      vals.push(fields[key] === "" ? null : fields[key]);
    }
  }
  if (!sets.length) throw new Error("No valid fields to update.");
  vals.push(id);
  const result = await getPool().query(
    `UPDATE account_entries SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    vals
  );
  if (!result.rows.length) throw new Error("Entry not found.");
  return result.rows[0];
}

export async function deleteAccountEntry(id) {
  await ensureAccountsSchema();
  const result = await getPool().query(`DELETE FROM account_entries WHERE id = $1 RETURNING id`, [id]);
  if (!result.rows.length) throw new Error("Entry not found.");
  return result.rows[0];
}

export async function listStudentAccounts(monthKey) {
  await ensureAccountsSchema();

  const sql = `
    SELECT
      id,
      month_key,
      month_label,
      student_name,
      student_id,
      class_type_code,
      sub_class_type_code,
      subject_name,
      fees_month,
      tutor_salary_hr,
      payment_date,
      clt_id,
      teacher_name,
      tutor_salary_paid,
      profit
    FROM account_entries
    WHERE COALESCE(student_name, '') <> ''
      AND ($1::TEXT IS NULL OR month_key = $1)
    ORDER BY month_date DESC, student_name ASC
  `;

  const result = await getPool().query(sql, [monthKey || null]);
  return result.rows;
}

export async function listTeacherAccounts(monthKey) {
  await ensureAccountsSchema();

  const sql = `
    SELECT
      month_key,
      month_label,
      teacher_name,
      clt_id,
      COUNT(*) FILTER (WHERE COALESCE(student_name, '') <> '') AS student_rows,
      COALESCE(SUM(tutor_salary_paid), 0) AS tutor_salary_paid,
      COALESCE(SUM(profit), 0) AS profit
    FROM account_entries
    WHERE COALESCE(teacher_name, '') <> ''
      AND ($1::TEXT IS NULL OR month_key = $1)
    GROUP BY month_key, month_label, month_date, teacher_name, clt_id
    ORDER BY month_date DESC, teacher_name ASC
  `;

  const result = await getPool().query(sql, [monthKey || null]);
  return result.rows;
}

export async function getMonthlyAccountReports() {
  await ensureAccountsSchema();

  const sql = `
    SELECT
      month_key,
      month_label,
      COUNT(DISTINCT CONCAT(COALESCE(student_name, ''), '|', COALESCE(student_id, ''))) FILTER (WHERE COALESCE(student_name, '') <> '') AS student_count,
      COUNT(DISTINCT teacher_name) FILTER (WHERE COALESCE(teacher_name, '') <> '') AS teacher_count,
      COALESCE(SUM(fees_month), 0) AS total_fees,
      COALESCE(SUM(tutor_salary_paid), 0) AS total_tutor_salary_paid,
      COALESCE(SUM(profit), 0) AS total_profit
    FROM account_entries
    GROUP BY month_key, month_label, month_date
    ORDER BY month_date DESC
  `;

  const result = await getPool().query(sql);
  return result.rows;
}

export async function getAnalyticsTrends() {
  await ensureAccountsSchema();
  const sql = `
    SELECT
      month_key,
      month_label,
      COALESCE(SUM(fees_month), 0) AS total_fees,
      COALESCE(SUM(tutor_salary_paid), 0) AS total_tutor_paid,
      COALESCE(SUM(profit), 0) AS total_profit
    FROM account_entries
    GROUP BY month_key, month_label, month_date
    ORDER BY month_date ASC
  `;
  const result = await getPool().query(sql);
  return result.rows;
}

export async function getAnalyticsTopTeachers() {
  await ensureAccountsSchema();
  const sql = `
    SELECT
      teacher_name,
      clt_id,
      COUNT(DISTINCT month_key) AS months_active,
      COUNT(*) FILTER (WHERE COALESCE(student_name, '') <> '') AS student_rows,
      COALESCE(SUM(fees_month), 0) AS total_fees,
      COALESCE(SUM(tutor_salary_paid), 0) AS total_tutor_paid,
      COALESCE(SUM(profit), 0) AS total_profit
    FROM account_entries
    WHERE COALESCE(teacher_name, '') <> ''
    GROUP BY teacher_name, clt_id
    ORDER BY student_rows DESC
    LIMIT 15
  `;
  const result = await getPool().query(sql);
  return result.rows;
}

export async function getAnalyticsSubjects() {
  await ensureAccountsSchema();
  const sql = `
    SELECT
      COALESCE(NULLIF(TRIM(subject_name), ''), 'Unknown') AS subject,
      COUNT(*) AS student_rows,
      COALESCE(SUM(fees_month), 0) AS total_fees
    FROM account_entries
    WHERE COALESCE(student_name, '') <> ''
    GROUP BY subject
    ORDER BY total_fees DESC
    LIMIT 15
  `;
  const result = await getPool().query(sql);
  return result.rows;
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function getReportPnL() {
  await ensureAccountsSchema();
  const sql = `
    SELECT
      month_key,
      month_label,
      COUNT(*) AS total_entries,
      COUNT(DISTINCT student_name) FILTER (WHERE COALESCE(student_name,'') <> '') AS unique_students,
      COUNT(DISTINCT teacher_name) FILTER (WHERE COALESCE(teacher_name,'') <> '') AS unique_teachers,
      COALESCE(SUM(fees_month), 0)          AS total_fees,
      COALESCE(SUM(tutor_salary_paid), 0)   AS total_tutor_paid,
      COALESCE(SUM(profit), 0)              AS total_profit,
      COALESCE(SUM(janani_share), 0)        AS janani_share,
      COALESCE(SUM(padmaja_share), 0)       AS padmaja_share,
      COALESCE(SUM(crablearn_share), 0)     AS crablearn_share,
      COALESCE(SUM(carry_over_tutor_fees), 0) AS carry_over,
      CASE WHEN COALESCE(SUM(fees_month),0) > 0
        THEN ROUND(COALESCE(SUM(profit),0) / NULLIF(SUM(fees_month),0) * 100, 1)
        ELSE 0
      END AS profit_margin_pct
    FROM account_entries
    GROUP BY month_key, month_label, month_date
    ORDER BY month_date ASC
  `;
  const result = await getPool().query(sql);
  return result.rows;
}

export async function getReportStudentLedger() {
  await ensureAccountsSchema();
  const sql = `
    SELECT
      COALESCE(student_id, '') AS student_id,
      student_name,
      month_key,
      month_label,
      COALESCE(SUM(fees_month), 0)        AS fees,
      COALESCE(SUM(tutor_salary_paid), 0) AS tutor_paid,
      COALESCE(SUM(profit), 0)            AS profit,
      MAX(teacher_name) AS teacher_name,
      MAX(clt_id) AS teacher_clt_id
    FROM account_entries
    WHERE COALESCE(student_name, '') <> ''
    GROUP BY student_id, student_name, month_key, month_label, month_date
    ORDER BY student_id ASC NULLS LAST, student_name ASC, month_date ASC
  `;
  const result = await getPool().query(sql);
  const byStudent = new Map();
  for (const row of result.rows) {
    const key = (row.student_id || '') + '|' + row.student_name;
    if (!byStudent.has(key)) {
      byStudent.set(key, { student_id: row.student_id, student_name: row.student_name, teacher_name: row.teacher_name, teacher_clt_id: row.teacher_clt_id, months: [] });
    }
    byStudent.get(key).months.push({ month_key: row.month_key, month_label: row.month_label, fees: row.fees, tutor_paid: row.tutor_paid, profit: row.profit });
  }
  return [...byStudent.values()];
}

export async function getReportTeacherPayout() {
  await ensureAccountsSchema();
  const sql = `
    SELECT
      COALESCE(clt_id, '') AS clt_id,
      teacher_name,
      month_key,
      month_label,
      COUNT(*) FILTER (WHERE COALESCE(student_name,'') <> '') AS student_count,
      COALESCE(SUM(tutor_salary_paid), 0) AS tutor_paid,
      COALESCE(SUM(fees_month), 0)        AS fees_generated,
      COALESCE(SUM(profit), 0)            AS profit_generated
    FROM account_entries
    WHERE COALESCE(teacher_name, '') <> ''
    GROUP BY clt_id, teacher_name, month_key, month_label, month_date
    ORDER BY teacher_name ASC, month_date ASC
  `;
  const result = await getPool().query(sql);
  const byTeacher = new Map();
  for (const row of result.rows) {
    const key = (row.clt_id || '') + '|' + row.teacher_name;
    if (!byTeacher.has(key)) {
      byTeacher.set(key, { clt_id: row.clt_id, teacher_name: row.teacher_name, months: [] });
    }
    byTeacher.get(key).months.push({
      month_key: row.month_key,
      month_label: row.month_label,
      student_count: row.student_count,
      tutor_paid: row.tutor_paid,
      fees_generated: row.fees_generated,
      profit_generated: row.profit_generated
    });
  }
  return [...byTeacher.values()];
}

export async function getReportClassTypes() {
  await ensureAccountsSchema();
  const sql = `
    SELECT
      COALESCE(NULLIF(TRIM(class_type_code),''), 'Unknown')     AS class_type,
      COALESCE(NULLIF(TRIM(sub_class_type_code),''), 'Unknown') AS sub_class_type,
      COUNT(DISTINCT student_name) FILTER (WHERE COALESCE(student_name,'') <> '') AS students,
      COUNT(*)                     AS entries,
      COALESCE(SUM(fees_month), 0)        AS total_fees,
      COALESCE(SUM(tutor_salary_paid), 0) AS total_tutor_paid,
      COALESCE(SUM(profit), 0)            AS total_profit
    FROM account_entries
    GROUP BY class_type, sub_class_type
    ORDER BY total_fees DESC
  `;
  const result = await getPool().query(sql);
  return result.rows;
}

export async function getReportProfitShare() {
  await ensureAccountsSchema();
  const sql = `
    SELECT
      month_key,
      month_label,
      COALESCE(SUM(janani_share), 0)    AS janani,
      COALESCE(SUM(padmaja_share), 0)   AS padmaja,
      COALESCE(SUM(crablearn_share), 0) AS crablearn,
      COALESCE(SUM(accumulated_profit), 0) AS accumulated,
      COALESCE(SUM(expenses_dec), 0)    AS expenses,
      COALESCE(SUM(profit), 0)          AS net_profit
    FROM account_entries
    GROUP BY month_key, month_label, month_date
    ORDER BY month_date ASC
  `;
  const result = await getPool().query(sql);
  return result.rows;
}

// ── Rate configuration tables ─────────────────────────────────────────────────

export async function ensureRatesSchema() {
  const pool = getPool();

  // Migrate tutor_rates to temporal schema if old single-row schema exists.
  const hasTutorId = await pool.query(`
    SELECT 1 FROM information_schema.columns WHERE table_name='tutor_rates' AND column_name='id'
  `);
  if (!hasTutorId.rows.length) {
    await pool.query('DROP TABLE IF EXISTS tutor_rates');
  }

  // Add subject_name / class_type_code columns to tutor_rates if missing (v2 migration).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tutor_rates (
      id              SERIAL PRIMARY KEY,
      clt_id          TEXT NOT NULL,
      teacher_name    TEXT NOT NULL,
      subject_name    TEXT NOT NULL DEFAULT '',
      class_type_code TEXT NOT NULL DEFAULT '',
      salary_per_hour NUMERIC(10,2) NOT NULL,
      effective_from  DATE NOT NULL DEFAULT CURRENT_DATE,
      notes           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (clt_id, subject_name, class_type_code, effective_from)
    );
  `);
  // Add new columns to existing table if upgrading from v1 (no subject columns).
  await pool.query(`ALTER TABLE tutor_rates ADD COLUMN IF NOT EXISTS subject_name    TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE tutor_rates ADD COLUMN IF NOT EXISTS class_type_code TEXT NOT NULL DEFAULT ''`);
  // Re-create unique constraint to include subject + class_type columns.
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name='tutor_rates' AND constraint_name='tutor_rates_clt_subject_date_key'
      ) THEN
        ALTER TABLE tutor_rates DROP CONSTRAINT IF EXISTS tutor_rates_clt_id_effective_from_key;
        ALTER TABLE tutor_rates ADD CONSTRAINT tutor_rates_clt_subject_date_key
          UNIQUE (clt_id, subject_name, class_type_code, effective_from);
      END IF;
    END $$;
  `);

  // Migrate subject_fees to temporal schema if effective_from column is missing.
  const hasEffective = await pool.query(`
    SELECT 1 FROM information_schema.columns WHERE table_name='subject_fees' AND column_name='effective_from'
  `);
  if (!hasEffective.rows.length) {
    await pool.query('DROP TABLE IF EXISTS subject_fees');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS subject_fees (
      id                  SERIAL PRIMARY KEY,
      class_type_code     TEXT NOT NULL DEFAULT '',
      sub_class_type_code TEXT NOT NULL DEFAULT '',
      subject_name        TEXT NOT NULL DEFAULT '',
      fees_month          NUMERIC(10,2) NOT NULL,
      effective_from      DATE NOT NULL DEFAULT CURRENT_DATE,
      notes               TEXT,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (class_type_code, sub_class_type_code, subject_name, effective_from)
    );
  `);

  // Seed tutor_rates from earliest known general rate per teacher in account_entries.
  await pool.query(`
    INSERT INTO tutor_rates (clt_id, teacher_name, salary_per_hour, effective_from, subject_name, class_type_code)
    SELECT DISTINCT ON (clt_id) clt_id, teacher_name, tutor_salary_hr,
      MIN(month_date) OVER (PARTITION BY clt_id), '', ''
    FROM account_entries
    WHERE clt_id IS NOT NULL AND tutor_salary_hr IS NOT NULL AND tutor_salary_hr > 0
    ORDER BY clt_id, month_date ASC
    ON CONFLICT (clt_id, subject_name, class_type_code, effective_from) DO NOTHING
  `);

  // Seed subject_fees from account entry history (fee changes over time).
  await pool.query(`
    WITH monthly AS (
      SELECT
        COALESCE(class_type_code, '') AS class_type_code,
        COALESCE(sub_class_type_code, '') AS sub_class_type_code,
        TRIM(subject_name) AS subject_name,
        month_date,
        ROUND(AVG(fees_month)::numeric, 2) AS fees_month
      FROM account_entries
      WHERE fees_month IS NOT NULL
        AND fees_month > 0
        AND TRIM(COALESCE(subject_name, '')) <> ''
        AND TRIM(subject_name) !~ '^[0-9]+$'
        AND UPPER(COALESCE(class_type_code, '')) IN ('', 'O2O', 'N2N')
      GROUP BY 1, 2, 3, 4
    ),
    changes AS (
      SELECT
        class_type_code,
        sub_class_type_code,
        subject_name,
        fees_month,
        month_date AS effective_from,
        LAG(fees_month) OVER (
          PARTITION BY class_type_code, sub_class_type_code, subject_name
          ORDER BY month_date
        ) AS prev_fee
      FROM monthly
    )
    INSERT INTO subject_fees (class_type_code, sub_class_type_code, subject_name, fees_month, effective_from, notes)
    SELECT class_type_code, sub_class_type_code, subject_name, fees_month, effective_from,
           'Seeded from enrollment history'
    FROM changes
    WHERE prev_fee IS NULL OR prev_fee IS DISTINCT FROM fees_month
    ON CONFLICT (class_type_code, sub_class_type_code, subject_name, effective_from) DO NOTHING
  `);
}

export async function getTutorRates() {
  await ensureRatesSchema();
  const result = await getPool().query(`
    SELECT *, effective_from::text AS effective_from_str
    FROM tutor_rates
    ORDER BY clt_id ASC, subject_name ASC, class_type_code ASC, effective_from DESC
  `);
  return result.rows;
}

export async function upsertTutorRate({ cltId, teacherName, subjectName, classTypeCode, salaryPerHour, effectiveFrom, notes }) {
  await ensureRatesSchema();
  await ensureAccountsSchema();
  const pool = getPool();
  const date = effectiveFrom || new Date().toISOString().slice(0, 10);

  // Resolve or auto-assign CLT ID (same pattern as student CLS IDs on enrollment).
  let resolvedCltId = String(cltId || "").trim();
  if (!resolvedCltId && teacherName) {
    const existing = await pool.query(
      `SELECT clt_id FROM tutor_rates WHERE LOWER(teacher_name)=LOWER($1) AND clt_id IS NOT NULL LIMIT 1`,
      [teacherName]
    );
    if (existing.rows.length) {
      resolvedCltId = existing.rows[0].clt_id;
    } else {
      const fromEntries = await pool.query(
        `SELECT clt_id FROM account_entries WHERE LOWER(teacher_name)=LOWER($1) AND clt_id IS NOT NULL LIMIT 1`,
        [teacherName]
      );
      if (fromEntries.rows.length) {
        resolvedCltId = fromEntries.rows[0].clt_id;
      } else {
        const maxRates = await pool.query(
          `SELECT COALESCE(MAX(CAST(SUBSTRING(clt_id FROM 5) AS INTEGER)),0) AS n FROM tutor_rates WHERE clt_id ~* '^clt-[0-9]+'`
        );
        const maxEntries = await pool.query(
          `SELECT COALESCE(MAX(CAST(SUBSTRING(clt_id FROM 5) AS INTEGER)),0) AS n FROM account_entries WHERE clt_id ~* '^clt-[0-9]+'`
        );
        const next = Math.max(Number(maxRates.rows[0].n || 0), Number(maxEntries.rows[0].n || 0)) + 1;
        resolvedCltId = `CLT-${String(next).padStart(4, "0")}`;
      }
    }
  }
  if (!resolvedCltId) {
    throw new Error("CLT ID is required when teacher name is empty.");
  }

  const result = await pool.query(`
    INSERT INTO tutor_rates (clt_id, teacher_name, subject_name, class_type_code, salary_per_hour, effective_from, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (clt_id, subject_name, class_type_code, effective_from) DO UPDATE
      SET teacher_name    = EXCLUDED.teacher_name,
          salary_per_hour = EXCLUDED.salary_per_hour,
          notes           = EXCLUDED.notes
    RETURNING *, effective_from::text AS effective_from_str
  `, [resolvedCltId, teacherName, subjectName || '', classTypeCode || '', salaryPerHour, date, notes || null]);
  return result.rows[0];
}

export async function deleteTutorRate(id) {
  await ensureRatesSchema();
  await getPool().query(`DELETE FROM tutor_rates WHERE id = $1`, [id]);
}

export async function deleteTutorRatesByCltId(cltId) {
  await ensureRatesSchema();
  const safeCltId = String(cltId || "").trim();
  if (!safeCltId) throw new Error("CLT ID is required.");
  const result = await getPool().query(
    `DELETE FROM tutor_rates WHERE clt_id = $1 RETURNING id`,
    [safeCltId]
  );
  if (!result.rows.length) throw new Error("No teacher rates found for that CLT ID.");
  return { deleted: result.rows.length, cltId: safeCltId };
}

export async function getSubjectFees() {
  await ensureRatesSchema();
  const result = await getPool().query(`
    SELECT *, effective_from::text AS effective_from_str
    FROM subject_fees
    ORDER BY class_type_code ASC, subject_name ASC, effective_from DESC
  `);
  return result.rows;
}

export async function upsertSubjectFee({ classTypeCode, subClassTypeCode, subjectName, feesMonth, effectiveFrom, notes }) {
  await ensureRatesSchema();
  const date = effectiveFrom || new Date().toISOString().slice(0, 10);
  const result = await getPool().query(`
    INSERT INTO subject_fees (class_type_code, sub_class_type_code, subject_name, fees_month, effective_from, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (class_type_code, sub_class_type_code, subject_name, effective_from) DO UPDATE
      SET fees_month = EXCLUDED.fees_month,
          notes      = EXCLUDED.notes
    RETURNING *, effective_from::text AS effective_from_str
  `, [classTypeCode || '', subClassTypeCode || '', subjectName || '', feesMonth, date, notes || null]);
  return result.rows[0];
}

export async function deleteSubjectFee(id) {
  await ensureRatesSchema();
  await getPool().query(`DELETE FROM subject_fees WHERE id = $1`, [id]);
}

export async function lookupRates({ cltId, classTypeCode, subClassTypeCode, subjectName, forDate }) {
  await ensureRatesSchema();
  const pool = getPool();
  // forDate is the enrollment month's first day; default to today.
  const date = forDate || new Date().toISOString().slice(0, 10);
  let salaryPerHour = null;
  let feesMonth = null;

  if (cltId) {
    // Most-specific match first: teacher + subject + class type, then fallbacks.
    const tr = await pool.query(`
      SELECT salary_per_hour FROM tutor_rates
      WHERE clt_id = $1 AND effective_from <= $2
        AND (subject_name    = '' OR subject_name    = $3)
        AND (class_type_code = '' OR class_type_code = $4)
      ORDER BY
        (subject_name    = $3)::int +
        (class_type_code = $4)::int DESC,
        effective_from DESC
      LIMIT 1
    `, [cltId, date, subjectName || '', classTypeCode || '']);
    if (tr.rows.length) salaryPerHour = tr.rows[0].salary_per_hour;
  }

  if (subjectName || classTypeCode) {
    const sf = await pool.query(`
      SELECT fees_month FROM subject_fees
      WHERE ($1::text = '' OR class_type_code = $1)
        AND ($2::text = '' OR sub_class_type_code = $2)
        AND ($3::text = '' OR subject_name = $3)
        AND effective_from <= $4
      ORDER BY
        (class_type_code = $1)::int +
        (sub_class_type_code = $2)::int +
        (subject_name = $3)::int DESC,
        effective_from DESC
      LIMIT 1
    `, [classTypeCode || '', subClassTypeCode || '', subjectName || '', date]);
    if (sf.rows.length) feesMonth = sf.rows[0].fees_month;
  }

  return { salaryPerHour, feesMonth };
}

export async function closeAccountsDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
