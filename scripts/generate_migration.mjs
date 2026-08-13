import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = dirname(fileURLToPath(import.meta.url));
const workbookPath = resolve(__dirname, "../reference/Accounts 2026.xlsx");
const outPath = resolve(__dirname, "../reference/migration.sql");

// ── helpers ──────────────────────────────────────────────────────────────────

const MONTH_SHEETS = ["032026", "April 2026", "May 2026", "June 2026", "July 2026", "AUGUST 2026"];

const SHEET_MONTH_LABEL = {
  "032026": "March 2026",
  "April 2026": "April 2026",
  "May 2026": "May 2026",
  "June 2026": "June 2026",
  "July 2026": "July 2026",
  "AUGUST 2026": "August 2026"
};

function toNum(v) {
  const s = String(v ?? "").replace(/[₹,\s]/g, "").trim();
  if (!s) return null;
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}

function sq(v) {
  if (v === null || v === undefined || String(v).trim() === "") return "NULL";
  return "'" + String(v).replace(/'/g, "''").trim() + "'";
}

function sqNum(v) {
  const n = toNum(v);
  return n === null ? "NULL" : String(n.toFixed(2));
}

// Parse payment_date: accepts dd/mm/yyyy, mm/dd/yyyy, text dates → ISO or NULL
function sqDate(v) {
  const s = String(v ?? "").trim();
  if (!s || s.toLowerCase() === "due" || s.toLowerCase() === "nil") return "NULL";
  // dd/mm/yyyy or d/m/yyyy
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `'${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}'`;
  // yyyy-mm-dd already
  const iso = s.match(/^\d{4}-\d{2}-\d{2}$/);
  if (iso) return `'${s}'`;
  return "NULL";
}

function norm(v) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

// ── parse each sheet ──────────────────────────────────────────────────────────

const wb = XLSX.readFile(workbookPath);

const students = new Map(); // student_id → student_name
const tutors = new Map();   // clt_id → tutor_name

const classRows = [];       // all parsed class records
const paymentRows = [];     // all parsed tutor payment rows

for (const sheetName of MONTH_SHEETS) {
  const monthLabel = SHEET_MONTH_LABEL[sheetName];
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "", raw: false, header: 1 });
  const allRows = raw.filter(r => r.some(c => String(c).trim()));

  // Find header row: contains "S No" or "Student Name"
  let headerIdx = -1;
  for (let i = 0; i < allRows.length; i++) {
    const cells = allRows[i].map(c => norm(c).toLowerCase());
    if (cells.includes("s no") || cells.includes("student name") || cells.includes("student name ")) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) continue;

  const headers = allRows[headerIdx].map(c => norm(c).toLowerCase());
  const col = (name) => headers.findIndex(h => h === name.toLowerCase());

  const COL = {
    sno:        col("s no"),
    student:    headers.findIndex(h => h.includes("student name")),
    studentId:  col("student id"),
    classType:  col("class type code"),
    subClass:   col("sub class type code"),
    subject:    col("subject name"),
    fees:       col("fees/month"),
    carryOver:  col("carry over tutor fees"),
    payDate:    col("payment date"),
    tutorHr:    col("tutor salary/hr"),
    cmc:        col("cmc"),
    coc:        col("coc"),
    tec:        col("tec"),
    addlClass:  col("additinal class"),
    cmcDone:    col("cmc completed"),
    pending:    col("pending classes"),
    cltId:      col("clt id"),
    cltName:    col("clt name"),
    tutorPaid:  col("tutor salary paid"),
    salBal:     col("alloted salary balance"),
    profit:     col("profit"),
    janani:     headers.findIndex(h => h.startsWith("janani")),
    padmaja:    col("padmaja"),
    crablearn:  headers.findIndex(h => h === "crablearn"),
    accProfit:  col("crablearn-accumulated profit"),
    expenses:   col("expenses dec")
  };

  // Separate section: tutor payment rows start when col[0] looks like CLT-xxxx and col[1] is a name
  // and there is NO student_id (col 2) that matches CL-xxxx pattern
  let paymentSectionStart = allRows.length;
  for (let i = headerIdx + 1; i < allRows.length; i++) {
    const r = allRows[i];
    const c0 = norm(r[0]);
    const c2 = norm(r[2]);
    if (/^CLT-\d+$/i.test(c0) && !/^CL-\d+$/i.test(c2)) {
      paymentSectionStart = i;
      break;
    }
  }

  // Parse class rows (between header and payment section)
  for (let i = headerIdx + 1; i < paymentSectionStart; i++) {
    const r = allRows[i];
    const studentName = norm(r[COL.student] ?? "");
    const studentId   = norm(r[COL.studentId] ?? "");
    const cltId       = norm(r[COL.cltId] ?? "");
    const cltName     = norm(r[COL.cltName] ?? "");

    // Skip blank rows and totals rows
    if (!studentName && !studentId && !cltId) continue;
    if (!studentName && !studentId) continue;

    if (studentId && /^CL-\d+$/i.test(studentId)) {
      students.set(studentId, studentName || students.get(studentId) || studentId);
    }
    if (cltId && /^CLT-\d+$/i.test(cltId)) {
      tutors.set(cltId, cltName || tutors.get(cltId) || cltId);
    }

    // Skip duplicate carry-forward rows (no S No, no class type)
    const sno = norm(r[COL.sno] ?? "");
    const classType = norm(r[COL.classType] ?? "");
    if (!sno && !classType) continue;

    classRows.push({
      month: monthLabel,
      studentId:   studentId || null,
      studentName: studentName || null,
      cltId:       cltId || null,
      tutorName:   cltName || null,
      classType:   norm(r[COL.classType] ?? "") || null,
      subClass:    norm(r[COL.subClass] ?? "") || null,
      subject:     norm(r[COL.subject] ?? "") || null,
      fees:        toNum(r[COL.fees]),
      carryOver:   toNum(r[COL.carryOver]),
      payDate:     sqDate(r[COL.payDate]),
      tutorHr:     toNum(r[COL.tutorHr]),
      cmc:         toNum(r[COL.cmc]),
      coc:         toNum(r[COL.coc]),
      tec:         toNum(r[COL.tec]),
      addlClass:   toNum(r[COL.addlClass]),
      cmcDone:     toNum(r[COL.cmcDone]),
      pending:     toNum(r[COL.pending]),
      tutorPaid:   toNum(r[COL.tutorPaid]),
      salBal:      toNum(r[COL.salBal]),
      profit:      toNum(r[COL.profit]),
      janani:      toNum(r[COL.janani]),
      padmaja:     toNum(r[COL.padmaja]),
      crablearn:   toNum(r[COL.crablearn]),
      accProfit:   toNum(r[COL.accProfit]),
      expenses:    toNum(r[COL.expenses])
    });
  }

  // Parse tutor payment rows (cols: clt_id, tutor_name, student_name, no_classes, tutor_salary, per_hour, [row_total])
  for (let i = paymentSectionStart; i < allRows.length; i++) {
    const r = allRows[i];
    const cltId    = norm(r[0]);
    const tutorName = norm(r[1]);
    const studentName = norm(r[2]);
    const noClasses   = toNum(r[3]);
    const salary      = toNum(r[4]);
    const perHour     = toNum(r[5]);

    if (!cltId || !tutorName) continue;
    if (/^(total|sum|\s*)$/i.test(cltId)) continue;

    if (/^CLT-\d+$/i.test(cltId)) {
      tutors.set(cltId, tutorName || tutors.get(cltId) || cltId);
    }

    paymentRows.push({ month: monthLabel, cltId, tutorName, studentName, noClasses, salary, perHour });
  }
}

// ── generate SQL ──────────────────────────────────────────────────────────────

const lines = [];

lines.push("-- ============================================================");
lines.push("-- Crablearn Accounts 2026 – Normalized PostgreSQL Migration");
lines.push("-- Generated: " + new Date().toISOString());
lines.push("-- ============================================================");
lines.push("");

// Schema
lines.push("-- ── Schema ──────────────────────────────────────────────────");
lines.push(`
CREATE TABLE IF NOT EXISTS students (
  student_id   VARCHAR(20)  PRIMARY KEY,
  student_name VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS tutors (
  tutor_id        VARCHAR(20)   PRIMARY KEY,
  tutor_name      VARCHAR(120)  NOT NULL,
  salary_per_hour NUMERIC(10,2)
);

CREATE TABLE IF NOT EXISTS classes (
  class_id               SERIAL        PRIMARY KEY,
  student_id             VARCHAR(20)   REFERENCES students(student_id),
  student_name           VARCHAR(120),
  tutor_id               VARCHAR(20)   REFERENCES tutors(tutor_id),
  class_type_code        VARCHAR(30),
  sub_class_type_code    VARCHAR(30),
  subject_name           VARCHAR(120),
  fees_month             NUMERIC(10,2),
  carry_over_tutor_fees  NUMERIC(10,2),
  payment_date           DATE,
  tutor_salary_hr        NUMERIC(10,2),
  cmc                    NUMERIC(10,2),
  coc                    NUMERIC(10,2),
  tec                    NUMERIC(10,2),
  additional_class       NUMERIC(10,2),
  cmc_completed          NUMERIC(10,2),
  pending_classes        NUMERIC(10,2),
  tutor_salary_paid      NUMERIC(10,2),
  allotted_salary_balance NUMERIC(10,2),
  profit                 NUMERIC(10,2),
  janani_share           NUMERIC(10,2),
  padmaja_share          NUMERIC(10,2),
  crablearn_share        NUMERIC(10,2),
  accumulated_profit     NUMERIC(10,2),
  expenses               NUMERIC(10,2),
  month                  VARCHAR(30)   NOT NULL
);

CREATE TABLE IF NOT EXISTS tutor_payments (
  id            SERIAL        PRIMARY KEY,
  tutor_id      VARCHAR(20)   REFERENCES tutors(tutor_id),
  tutor_name    VARCHAR(120),
  student_name  VARCHAR(120),
  no_of_classes INTEGER,
  tutor_salary  NUMERIC(10,2),
  per_hour      NUMERIC(10,2),
  month         VARCHAR(30)   NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts_summary (
  id           SERIAL        PRIMARY KEY,
  month        VARCHAR(30)   NOT NULL,
  student_name VARCHAR(120),
  amount       NUMERIC(10,2),
  notes        TEXT
);
`);

// Students
lines.push("-- ── Students ────────────────────────────────────────────────");
lines.push("INSERT INTO students (student_id, student_name) VALUES");
const studentEntries = [...students.entries()].sort((a, b) => a[0].localeCompare(b[0]));
const studentLines = studentEntries.map(([id, name]) => `  (${sq(id)}, ${sq(name)})`);
lines.push(studentLines.join(",\n") + "\nON CONFLICT (student_id) DO UPDATE SET student_name = EXCLUDED.student_name;");
lines.push("");

// Tutors (salary_per_hour filled from payment rows where available)
const tutorHrMap = new Map();
for (const pr of paymentRows) {
  if (pr.cltId && pr.perHour !== null && !tutorHrMap.has(pr.cltId)) {
    tutorHrMap.set(pr.cltId, pr.perHour);
  }
}
lines.push("-- ── Tutors ──────────────────────────────────────────────────");
lines.push("INSERT INTO tutors (tutor_id, tutor_name, salary_per_hour) VALUES");
const tutorEntries = [...tutors.entries()].sort((a, b) => a[0].localeCompare(b[0]));
const tutorLines = tutorEntries.map(([id, name]) => {
  const hr = tutorHrMap.get(id);
  return `  (${sq(id)}, ${sq(name)}, ${hr !== undefined ? hr.toFixed(2) : "NULL"})`;
});
lines.push(tutorLines.join(",\n") + "\nON CONFLICT (tutor_id) DO UPDATE SET tutor_name = EXCLUDED.tutor_name;");
lines.push("");

// Classes
lines.push("-- ── Classes ─────────────────────────────────────────────────");
lines.push("INSERT INTO classes");
lines.push("  (student_id, student_name, tutor_id, class_type_code, sub_class_type_code, subject_name,");
lines.push("   fees_month, carry_over_tutor_fees, payment_date, tutor_salary_hr, cmc, coc, tec,");
lines.push("   additional_class, cmc_completed, pending_classes, tutor_salary_paid,");
lines.push("   allotted_salary_balance, profit, janani_share, padmaja_share, crablearn_share,");
lines.push("   accumulated_profit, expenses, month)");
lines.push("VALUES");
const classInserts = classRows.map(row => {
  const sid = (row.studentId && /^CL-\d+$/i.test(row.studentId)) ? sq(row.studentId) : "NULL";
  const tid = (row.cltId && /^CLT-\d+$/i.test(row.cltId)) ? sq(row.cltId) : "NULL";
  return (
    `  (${sid}, ${sq(row.studentName)}, ${tid}, ` +
    `${sq(row.classType)}, ${sq(row.subClass)}, ${sq(row.subject)}, ` +
    `${sqNum(row.fees)}, ${sqNum(row.carryOver)}, ${row.payDate}, ${sqNum(row.tutorHr)}, ` +
    `${sqNum(row.cmc)}, ${sqNum(row.coc)}, ${sqNum(row.tec)}, ${sqNum(row.addlClass)}, ` +
    `${sqNum(row.cmcDone)}, ${sqNum(row.pending)}, ${sqNum(row.tutorPaid)}, ` +
    `${sqNum(row.salBal)}, ${sqNum(row.profit)}, ${sqNum(row.janani)}, ` +
    `${sqNum(row.padmaja)}, ${sqNum(row.crablearn)}, ${sqNum(row.accProfit)}, ` +
    `${sqNum(row.expenses)}, ${sq(row.month)})`
  );
});
lines.push(classInserts.join(",\n") + ";");
lines.push("");

// Tutor payments
lines.push("-- ── Tutor Payments ──────────────────────────────────────────");
lines.push("INSERT INTO tutor_payments (tutor_id, tutor_name, student_name, no_of_classes, tutor_salary, per_hour, month)");
lines.push("VALUES");
const payInserts = paymentRows.map(row => {
  const tid = (row.cltId && /^CLT-\d+$/i.test(row.cltId)) ? sq(row.cltId) : "NULL";
  const nc = row.noClasses !== null ? String(Math.round(row.noClasses)) : "NULL";
  return `  (${tid}, ${sq(row.tutorName)}, ${sq(row.studentName)}, ${nc}, ${sqNum(row.salary)}, ${sqNum(row.perHour)}, ${sq(row.month)})`;
});
lines.push(payInserts.join(",\n") + ";");
lines.push("");

// Accounts summary (profit/share rows from class data)
lines.push("-- ── Accounts Summary (monthly profit by student) ────────────");
lines.push("INSERT INTO accounts_summary (month, student_name, amount, notes)");
lines.push("VALUES");
const summaryRows = classRows
  .filter(r => r.profit !== null && r.studentName)
  .map(r => `  (${sq(r.month)}, ${sq(r.studentName)}, ${sqNum(r.profit)}, ${sq("profit")})`);
lines.push(summaryRows.join(",\n") + ";");
lines.push("");

lines.push("-- Migration complete.");

const sql = lines.join("\n");
writeFileSync(outPath, sql, "utf8");
console.log("Written to:", outPath);
console.log("Students:", students.size);
console.log("Tutors:", tutors.size);
console.log("Class rows:", classRows.length);
console.log("Payment rows:", paymentRows.length);
console.log("Summary rows:", summaryRows.length);
