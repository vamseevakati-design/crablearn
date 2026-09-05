import { useEffect, useMemo, useState } from "react";

function formatCurrency(value) {
  const numeric = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

function formatCurrencyShort(value) {
  const n = Number(value || 0);
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toFixed(0)}`;
}

function SortTh({ label, col, sort, onSort, num }) {
  const active = sort.col === col;
  return (
    <th className={`sort-th${num ? " col-num" : ""}${active ? " sort-active" : ""}`} onClick={() => onSort(col)}>
      {label}<span className="sort-arrow">{active ? (sort.dir === "asc" ? " ▲" : " ▼") : " ⇅"}</span>
    </th>
  );
}

function HBar({ label, sublabel, value, maxValue, displayValue, color }) {
  const pct = maxValue > 0 ? Math.max(2, (Math.abs(value) / maxValue) * 100) : 2;
  return (
    <div className="hbar-row">
      <div className="hbar-labels">
        <span className="hbar-label">{label}</span>
        {sublabel ? <span className="hbar-sublabel">{sublabel}</span> : null}
      </div>
      <div className="hbar-track">
        <div className="hbar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="hbar-value">{displayValue}</span>
    </div>
  );
}

function GroupedMonthBar({ row, maxFees }) {
  const fees = Number(row.total_fees || 0);
  const profit = Number(row.total_profit || 0);
  const tutor = Number(row.total_tutor_paid || 0);
  const feesPct = maxFees > 0 ? Math.max(2, (fees / maxFees) * 100) : 2;
  const tutorPct = maxFees > 0 ? Math.max(2, (tutor / maxFees) * 100) : 2;
  const profitPct = maxFees > 0 ? Math.max(2, (Math.abs(profit) / maxFees) * 100) : 2;
  return (
    <div className="trend-month-row">
      <span className="trend-month-label">{row.month_label}</span>
      <div className="trend-bars">
        <div className="trend-bar-line">
          <span className="trend-bar-key">Fees</span>
          <div className="hbar-track"><div className="hbar-fill" style={{ width: `${feesPct}%`, background: "#4a90d9" }} /></div>
          <span className="hbar-value">{formatCurrencyShort(fees)}</span>
        </div>
        <div className="trend-bar-line">
          <span className="trend-bar-key">Tutor</span>
          <div className="hbar-track"><div className="hbar-fill" style={{ width: `${tutorPct}%`, background: "#e07040" }} /></div>
          <span className="hbar-value">{formatCurrencyShort(tutor)}</span>
        </div>
        <div className="trend-bar-line">
          <span className="trend-bar-key">Profit</span>
          <div className="hbar-track"><div className="hbar-fill" style={{ width: `${profitPct}%`, background: profit >= 0 ? "#1a7a42" : "#b83030" }} /></div>
          <span className={`hbar-value ${profit >= 0 ? "profit-pos" : "profit-neg"}`}>{formatCurrencyShort(profit)}</span>
        </div>
      </div>
    </div>
  );
}

function printSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const win = window.open("", "_blank");
  win.document.write(`<html><head><title>Report</title>
    <style>body{font-family:sans-serif;font-size:12px}table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #ccc;padding:4px 8px;text-align:left}th{background:#f3f0f7}
    .num{text-align:right}.pos{color:#1a7a42}.neg{color:#b83030}</style></head>
    <body>${el.innerHTML}</body></html>`);
  win.document.close();
  win.print();
}

function ReportTable({ id, columns, rows, totals }) {
  return (
    <div className="report-table-wrap" id={id}>
      <table className="report-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} className={c.num ? "col-num" : ""}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key} className={`${c.num ? "col-num" : ""} ${c.color ? c.color(row[c.key]) : ""}`}>
                  {c.format ? c.format(row[c.key], row) : (row[c.key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {totals ? (
          <tfoot>
            <tr className="accounts-totals-row">
              {columns.map((c) => (
                <td key={c.key} className={c.num ? "col-num" : ""}>
                  {totals[c.key] !== undefined ? <strong>{c.format ? c.format(totals[c.key]) : totals[c.key]}</strong> : ""}
                </td>
              ))}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}

function ReportsPanel({ reports, formatCurrency }) {
  const { loading, error, pnl, studentLedger, teacherPayout, classTypes, profitShare } = reports;

  if (loading) return <p style={{ marginTop: "1rem" }}>Loading reports...</p>;
  if (error) return <div className="accounts-feedback error" style={{ marginTop: "1rem" }}>{error}</div>;
  if (!pnl.length) return <p style={{ marginTop: "1rem" }}>No data — import the workbook first.</p>;

  const fc = (v) => formatCurrency(v);
  const pct = (v) => `${Number(v || 0).toFixed(1)}%`;

  // P&L totals row
  const pnlTotals = pnl.reduce((acc, r) => ({
    month_label: "TOTAL",
    unique_students: "",
    unique_teachers: "",
    total_fees: +acc.total_fees + +r.total_fees,
    total_tutor_paid: +acc.total_tutor_paid + +r.total_tutor_paid,
    total_profit: +acc.total_profit + +r.total_profit,
    janani_share: +acc.janani_share + +r.janani_share,
    padmaja_share: +acc.padmaja_share + +r.padmaja_share,
    crablearn_share: +acc.crablearn_share + +r.crablearn_share,
    profit_margin_pct: "",
    total_entries: +acc.total_entries + +r.total_entries
  }), { month_label: "", unique_students: "", unique_teachers: "", total_fees: 0, total_tutor_paid: 0, total_profit: 0, janani_share: 0, padmaja_share: 0, crablearn_share: 0, profit_margin_pct: "", total_entries: 0 });

  // Class type totals
  const ctTotals = classTypes.reduce((acc, r) => ({
    class_type: "TOTAL", sub_class_type: "",
    students: +acc.students + +r.students,
    entries: +acc.entries + +r.entries,
    total_fees: +acc.total_fees + +r.total_fees,
    total_tutor_paid: +acc.total_tutor_paid + +r.total_tutor_paid,
    total_profit: +acc.total_profit + +r.total_profit
  }), { class_type: "", sub_class_type: "", students: 0, entries: 0, total_fees: 0, total_tutor_paid: 0, total_profit: 0 });

  return (
    <div className="reports-panel">

      {/* 1. Monthly P&L */}
      <article className="report-card">
        <div className="report-card-header">
          <div>
            <h3>Monthly Profit &amp; Loss</h3>
            <p className="analytics-desc">Fees collected, tutor payouts, net profit, and owner shares per month.</p>
          </div>
          <button className="report-print-btn" type="button" onClick={() => printSection("rpt-pnl")}>Print</button>
        </div>
        <ReportTable
          id="rpt-pnl"
          columns={[
            { key: "month_label",       label: "Month" },
            { key: "total_entries",     label: "Entries",    num: true },
            { key: "unique_students",   label: "Students",   num: true },
            { key: "unique_teachers",   label: "Teachers",   num: true },
            { key: "total_fees",        label: "Fees",       num: true, format: fc },
            { key: "total_tutor_paid",  label: "Tutor Paid", num: true, format: fc },
            { key: "total_profit",      label: "Net Profit", num: true, format: fc, color: (v) => Number(v) >= 0 ? "profit-pos" : "profit-neg" },
            { key: "profit_margin_pct", label: "Margin %",   num: true, format: pct },
            { key: "janani_share",      label: "Janani",     num: true, format: fc },
            { key: "padmaja_share",     label: "Padmaja",    num: true, format: fc },
            { key: "crablearn_share",   label: "Crablearn",  num: true, format: fc }
          ]}
          rows={pnl}
          totals={pnlTotals}
        />
      </article>

      {/* 2. Profit Share Breakdown */}
      <article className="report-card">
        <div className="report-card-header">
          <div>
            <h3>Owner Profit Share</h3>
            <p className="analytics-desc">Month-wise split between Janani, Padmaja, and Crablearn.</p>
          </div>
          <button className="report-print-btn" type="button" onClick={() => printSection("rpt-share")}>Print</button>
        </div>
        <ReportTable
          id="rpt-share"
          columns={[
            { key: "month_label",  label: "Month" },
            { key: "janani",       label: "Janani Share",   num: true, format: fc },
            { key: "padmaja",      label: "Padmaja Share",  num: true, format: fc },
            { key: "crablearn",    label: "Crablearn Share",num: true, format: fc },
            { key: "accumulated",  label: "Accumulated",    num: true, format: fc },
            { key: "expenses",     label: "Expenses",       num: true, format: fc },
            { key: "net_profit",   label: "Net Profit",     num: true, format: fc, color: (v) => Number(v) >= 0 ? "profit-pos" : "profit-neg" }
          ]}
          rows={profitShare}
        />
      </article>

      {/* 3. Class Type Breakdown */}
      <article className="report-card">
        <div className="report-card-header">
          <div>
            <h3>Revenue by Class Type</h3>
            <p className="analytics-desc">Fees and profit broken down by class format (O2O, N2N, etc.).</p>
          </div>
          <button className="report-print-btn" type="button" onClick={() => printSection("rpt-class")}>Print</button>
        </div>
        <ReportTable
          id="rpt-class"
          columns={[
            { key: "class_type",     label: "Class Type" },
            { key: "sub_class_type", label: "Sub-type" },
            { key: "students",       label: "Students",   num: true },
            { key: "entries",        label: "Entries",    num: true },
            { key: "total_fees",     label: "Total Fees", num: true, format: fc },
            { key: "total_tutor_paid", label: "Tutor Paid", num: true, format: fc },
            { key: "total_profit",   label: "Profit",     num: true, format: fc, color: (v) => Number(v) >= 0 ? "profit-pos" : "profit-neg" }
          ]}
          rows={classTypes}
          totals={ctTotals}
        />
      </article>

      {/* 4. Teacher Payout Ledger */}
      <article className="report-card">
        <div className="report-card-header">
          <div>
            <h3>Teacher Payout Ledger</h3>
            <p className="analytics-desc">Per-teacher monthly student count, salary paid, and profit generated.</p>
          </div>
          <button className="report-print-btn" type="button" onClick={() => printSection("rpt-teacher")}>Print</button>
        </div>
        <div id="rpt-teacher" className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>CLT ID</th>
                {pnl.map((m) => (
                  <th key={m.month_key} className="col-num" colSpan={3}>{m.month_label.split(" ")[0]}</th>
                ))}
                <th className="col-num">Total Paid</th>
                <th className="col-num">Total Profit</th>
              </tr>
              <tr>
                <th colSpan={2}></th>
                {pnl.map((m) => (
                  <>
                    <th key={m.month_key + "s"} className="col-num rpt-sub">Students</th>
                    <th key={m.month_key + "p"} className="col-num rpt-sub">Paid</th>
                    <th key={m.month_key + "pr"} className="col-num rpt-sub">Profit</th>
                  </>
                ))}
                <th></th><th></th>
              </tr>
            </thead>
            <tbody>
              {teacherPayout.map((teacher) => {
                const monthMap = Object.fromEntries(teacher.months.map((m) => [m.month_key, m]));
                const totalPaid = teacher.months.reduce((s, m) => s + Number(m.tutor_paid || 0), 0);
                const totalProfit = teacher.months.reduce((s, m) => s + Number(m.profit_generated || 0), 0);
                return (
                  <tr key={teacher.clt_id + teacher.teacher_name}>
                    <td><strong>{teacher.teacher_name}</strong></td>
                    <td className="col-muted">{teacher.clt_id || "-"}</td>
                    {pnl.map((m) => {
                      const md = monthMap[m.month_key];
                      return (
                        <>
                          <td key={m.month_key + "s"} className="col-num">{md ? md.student_count : "-"}</td>
                          <td key={m.month_key + "p"} className="col-num">{md ? formatCurrency(md.tutor_paid) : "-"}</td>
                          <td key={m.month_key + "pr"} className={`col-num ${md && Number(md.profit_generated) >= 0 ? "profit-pos" : "profit-neg"}`}>{md ? formatCurrency(md.profit_generated) : "-"}</td>
                        </>
                      );
                    })}
                    <td className="col-num"><strong>{formatCurrency(totalPaid)}</strong></td>
                    <td className={`col-num ${totalProfit >= 0 ? "profit-pos" : "profit-neg"}`}><strong>{formatCurrency(totalProfit)}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

      {/* 5. Student Fee Ledger */}
      <article className="report-card">
        <div className="report-card-header">
          <div>
            <h3>Student Fee Ledger</h3>
            <p className="analytics-desc">Per-student monthly fees across all months with running totals.</p>
          </div>
          <button className="report-print-btn" type="button" onClick={() => printSection("rpt-student")}>Print</button>
        </div>
        <div id="rpt-student" className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student</th>
                <th>Teacher ID</th>
                <th>Teacher</th>
                {pnl.map((m) => (
                  <th key={m.month_key} className="col-num">{m.month_label.split(" ")[0]}</th>
                ))}
                <th className="col-num">Total Fees</th>
                <th className="col-num">Total Profit</th>
              </tr>
            </thead>
            <tbody>
              {studentLedger.map((student) => {
                const monthMap = Object.fromEntries(student.months.map((m) => [m.month_key, m]));
                const totalFees = student.months.reduce((s, m) => s + Number(m.fees || 0), 0);
                const totalProfit = student.months.reduce((s, m) => s + Number(m.profit || 0), 0);
                return (
                  <tr key={(student.student_id || "") + student.student_name}>
                    <td className="col-muted">{student.student_id || "-"}</td>
                    <td><strong>{student.student_name}</strong></td>
                    <td className="col-muted">{student.teacher_clt_id || "-"}</td>
                    <td>{student.teacher_name || "-"}</td>
                    {pnl.map((m) => {
                      const md = monthMap[m.month_key];
                      return (
                        <td key={m.month_key} className="col-num">{md ? formatCurrency(md.fees) : "-"}</td>
                      );
                    })}
                    <td className="col-num"><strong>{formatCurrency(totalFees)}</strong></td>
                    <td className={`col-num ${totalProfit >= 0 ? "profit-pos" : "profit-neg"}`}><strong>{formatCurrency(totalProfit)}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

    </div>
  );
}

function JananiAccountsPanel({ rows, formatCurrency }) {
  const totals = rows.reduce((acc, row) => ({
    amount: acc.amount + Number(row.amount || 0),
    salary: acc.salary + Number(row.salary || 0),
    janani_share: acc.janani_share + Number(row.janani_share || 0),
    crablearn_share: acc.crablearn_share + Number(row.crablearn_share || 0),
    crablearn_account: acc.crablearn_account + Number(row.crablearn_account || 0)
  }), { amount: 0, salary: 0, janani_share: 0, crablearn_share: 0, crablearn_account: 0 });

  return (
    <article className="report-card">
      <div className="report-card-header">
        <div>
          <h3>Janani Accounts</h3>
          <p className="analytics-desc">Monthly owner-share and account ledger imported from the Janani Accounts workbook tab.</p>
        </div>
      </div>
      {!rows.length ? <p>No Janani Accounts data found.</p> : (
        <div className="report-table-wrap">
          <table className="report-table">
            <thead><tr><th>Month</th><th>Person</th><th className="col-num">Amount</th><th className="col-num">Salary</th><th className="col-num">Janani Share</th><th className="col-num">Crablearn Share</th><th className="col-num">Crablearn Account</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id}><td>{row.month_label}</td><td>{row.person_name}</td><td className="col-num">{formatCurrency(row.amount)}</td><td className="col-num">{formatCurrency(row.salary)}</td><td className="col-num">{formatCurrency(row.janani_share)}</td><td className="col-num">{formatCurrency(row.crablearn_share)}</td><td className="col-num">{formatCurrency(row.crablearn_account)}</td></tr>)}</tbody>
            <tfoot><tr className="accounts-totals-row"><td colSpan="2"><strong>Total</strong></td><td className="col-num"><strong>{formatCurrency(totals.amount)}</strong></td><td className="col-num"><strong>{formatCurrency(totals.salary)}</strong></td><td className="col-num"><strong>{formatCurrency(totals.janani_share)}</strong></td><td className="col-num"><strong>{formatCurrency(totals.crablearn_share)}</strong></td><td className="col-num"><strong>{formatCurrency(totals.crablearn_account)}</strong></td></tr></tfoot>
          </table>
        </div>
      )}
    </article>
  );
}

// ── Enroll Panel ─────────────────────────────────────────────────────────────

const EMPTY_ENROLL = { monthLabel:"", studentName:"", studentId:"", teacherName:"", cltId:"", classTypeCode:"O2O", subClassTypeCode:"", subjectName:"", feesMonth:"", tutorSalaryHr:"", tutorSalaryPaid:"", profit:"", carryOverTutorFees:"", paymentDate:"" };

// ── Student enrollment sub-section ───────────────────────────────────────────

function StudentEnrollSection({ apiBaseUrl, onSaved, isSupervisor, currentUser }) {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subTypes, setSubTypes] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [form, setForm] = useState(EMPTY_ENROLL);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [rateHint, setRateHint] = useState("");
  const [adminIdentifier, setAdminIdentifier] = useState(currentUser?.phone || "");
  const [adminPassword, setAdminPassword] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const canDelete = Boolean(adminIdentifier.trim() && adminPassword);

  async function load() {
    const [s, t, sub, recent] = await Promise.all([
      fetch(`${apiBaseUrl}/api/accounts/roster/students`).then(r => r.json()),
      fetch(`${apiBaseUrl}/api/accounts/roster/teachers`).then(r => r.json()),
      fetch(`${apiBaseUrl}/api/accounts/roster/subjects`).then(r => r.json()),
      fetch(`${apiBaseUrl}/api/accounts/students?month=`).then(r => r.json())
    ]);
    if (s.ok) setStudents(s.rows);
    if (t.ok) setTeachers(t.rows);
    if (sub.ok) { setSubjects(sub.subjects || []); setSubTypes(sub.subTypes || []); }
    if (recent.ok) setRecentEntries((recent.rows || []).slice(0, 30));
  }

  useEffect(() => { load().catch(() => {}); }, [apiBaseUrl]);

  useEffect(() => {
    if (!form.cltId && !form.subjectName && !form.classTypeCode) return;
    const params = new URLSearchParams();
    if (form.cltId) params.set("cltId", form.cltId);
    if (form.classTypeCode) params.set("classTypeCode", form.classTypeCode);
    if (form.subClassTypeCode) params.set("subClassTypeCode", form.subClassTypeCode);
    if (form.subjectName) params.set("subjectName", form.subjectName);
    if (form.monthLabel) {
      const months = {january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
      const m = form.monthLabel.trim().toLowerCase().match(/([a-z]+)\s+(\d{4})/);
      if (m && months[m[1]]) params.set("forDate", `${m[2]}-${String(months[m[1]]).padStart(2,"0")}-01`);
    }
    fetch(`${apiBaseUrl}/api/accounts/rates/lookup?${params}`).then(r => r.json()).then(data => {
      if (!data.ok) return;
      const hints = [];
      setForm(f => {
        const next = { ...f };
        if (data.salaryPerHour !== null && f.tutorSalaryHr === "") { next.tutorSalaryHr = String(data.salaryPerHour); hints.push(`Tutor ₹${data.salaryPerHour}/hr`); }
        if (data.feesMonth !== null && f.feesMonth === "") { next.feesMonth = String(data.feesMonth); hints.push(`Fees ₹${data.feesMonth}/mo`); }
        return next;
      });
      if (hints.length) setRateHint(hints.join(" · ") + " — from rate card");
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cltId, form.classTypeCode, form.subClassTypeCode, form.subjectName, form.monthLabel]);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); setRateHint(""); }
  function autoFillStudent(name) { const m = students.find(s => s.student_name.toLowerCase() === name.toLowerCase()); setForm(f => ({ ...f, studentName: name, studentId: m ? m.student_id : f.studentId })); }
  function autoFillTeacher(name) { const m = teachers.find(t => t.teacher_name.toLowerCase() === name.toLowerCase()); setForm(f => ({ ...f, teacherName: name, cltId: m ? m.clt_id : f.cltId })); }

  function startEdit(entry) {
    setEditingId(entry.id);
    setPendingDelete(null);
    setForm({
      monthLabel: entry.month_label || "",
      studentName: entry.student_name || "",
      studentId: entry.student_id || "",
      teacherName: entry.teacher_name || "",
      cltId: entry.clt_id || "",
      classTypeCode: entry.class_type_code || "O2O",
      subClassTypeCode: entry.sub_class_type_code || "",
      subjectName: entry.subject_name || "",
      feesMonth: entry.fees_month != null ? String(entry.fees_month) : "",
      tutorSalaryHr: entry.tutor_salary_hr != null ? String(entry.tutor_salary_hr) : "",
      tutorSalaryPaid: entry.tutor_salary_paid != null ? String(entry.tutor_salary_paid) : "",
      profit: entry.profit != null ? String(entry.profit) : "",
      carryOverTutorFees: "",
      paymentDate: entry.payment_date || ""
    });
    setRateHint("");
    setMsg({ text: `Editing ${entry.student_name || "student"} — update the form and save.`, ok: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearForm() {
    setForm(EMPTY_ENROLL);
    setEditingId(null);
    setRateHint("");
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setMsg({ text: "", ok: true });
    try {
      if (editingId) {
        if (!canDelete) throw new Error("Enter your phone and password below to save edits.");
        const res = await fetch(`${apiBaseUrl}/api/accounts/entries/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminIdentifier,
            adminPassword,
            student_name: form.studentName || null,
            student_id: form.studentId || null,
            teacher_name: form.teacherName || null,
            clt_id: form.cltId || null,
            class_type_code: form.classTypeCode || null,
            sub_class_type_code: form.subClassTypeCode || null,
            subject_name: form.subjectName || null,
            fees_month: form.feesMonth !== "" ? Number(form.feesMonth) : null,
            tutor_salary_hr: form.tutorSalaryHr !== "" ? Number(form.tutorSalaryHr) : null,
            tutor_salary_paid: form.tutorSalaryPaid !== "" ? Number(form.tutorSalaryPaid) : null,
            profit: form.profit !== "" ? Number(form.profit) : null,
            payment_date: form.paymentDate || null
          })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message);
        setMsg({ text: `Updated — ${data.entry?.student_id || form.studentId || "student"}.`, ok: true });
      } else {
        const res = await fetch(`${apiBaseUrl}/api/accounts/entries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, feesMonth: form.feesMonth ? Number(form.feesMonth) : null, tutorSalaryHr: form.tutorSalaryHr ? Number(form.tutorSalaryHr) : null, tutorSalaryPaid: form.tutorSalaryPaid ? Number(form.tutorSalaryPaid) : null, profit: form.profit ? Number(form.profit) : null, carryOverTutorFees: form.carryOverTutorFees ? Number(form.carryOverTutorFees) : null }) });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message);
        setMsg({ text: `Saved — ${data.entry?.student_id || "new"}.`, ok: true });
      }
      clearForm();
      await load();
      if (onSaved) onSaved();
    } catch (err) { setMsg({ text: String(err.message), ok: false }); }
    finally { setSaving(false); }
  }

  function requestDelete(entry) {
    if (!canDelete) {
      setMsg({ text: "Enter your phone and password above, then click the remove icon again.", ok: false });
      return;
    }
    setPendingDelete(entry);
    setMsg({ text: "", ok: true });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const entry = pendingDelete;
    const label = `${entry.student_name || "student"}${entry.student_id ? ` (${entry.student_id})` : ""} — ${entry.month_label || "entry"}`;
    try {
      const res = await fetch(`${apiBaseUrl}/api/accounts/entries/${entry.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminIdentifier, adminPassword })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      setMsg({ text: `Removed student ${label}.`, ok: true });
      setPendingDelete(null);
      if (editingId === entry.id) clearForm();
      await load();
      if (onSaved) onSaved();
    } catch (err) {
      setMsg({ text: String(err.message), ok: false });
    } finally {
      setDeleting(false);
    }
  }

  const f = "enroll-input";
  return (
    <div className="enroll-subsection">
      <article className="enroll-card">
        <h3>{editingId ? "Edit Student Enrollment" : "New Student Enrollment"}</h3>
        {msg.text ? <div className={`accounts-feedback ${msg.ok?"success":"error"}`}>{msg.text}</div> : null}
        {rateHint ? <div className="rate-hint">💡 {rateHint}</div> : null}
        <form className="enroll-form" onSubmit={handleSubmit}>
          <div className="enroll-section-label">Month &amp; Student</div>
          <div className="enroll-row">
            <label className="enroll-field"><span>Month <em>*</em></span><input className={f} value={form.monthLabel} onChange={e => set("monthLabel", e.target.value)} placeholder="e.g. September 2026" required /></label>
            <label className="enroll-field enroll-field--wide"><span>Student Name <em>*</em></span><input className={f} list="se-students" value={form.studentName} onChange={e => autoFillStudent(e.target.value)} placeholder="Full name" required /><datalist id="se-students">{students.map(s=><option key={s.student_id} value={s.student_name}/>)}</datalist></label>
            <label className="enroll-field"><span>Student ID</span><input className={f} value={form.studentId} onChange={e => set("studentId", e.target.value)} placeholder="Auto" /></label>
          </div>
          <div className="enroll-section-label">Teacher &amp; Subject</div>
          <div className="enroll-row">
            <label className="enroll-field enroll-field--wide"><span>Teacher</span><input className={f} list="se-teachers" value={form.teacherName} onChange={e => autoFillTeacher(e.target.value)} placeholder="Teacher name" /><datalist id="se-teachers">{teachers.map(t=><option key={t.clt_id} value={t.teacher_name}/>)}</datalist></label>
            <label className="enroll-field"><span>CLT ID</span><input className={f} value={form.cltId} onChange={e => set("cltId", e.target.value)} placeholder="Auto" /></label>
            <label className="enroll-field"><span>Class Type</span><select className={f} value={form.classTypeCode} onChange={e => set("classTypeCode", e.target.value)}><option value="O2O">O2O</option><option value="N2N">N2N</option><option value="">Other</option></select></label>
            <label className="enroll-field"><span>Sub-type</span><input className={f} list="se-subtypes" value={form.subClassTypeCode} onChange={e => set("subClassTypeCode", e.target.value)} placeholder="Optional" /><datalist id="se-subtypes">{subTypes.map(s=><option key={s} value={s}/>)}</datalist></label>
            <label className="enroll-field enroll-field--wide"><span>Subject</span><input className={f} list="se-subjects" value={form.subjectName} onChange={e => set("subjectName", e.target.value)} placeholder="e.g. Mathematics" /><datalist id="se-subjects">{subjects.map(s=><option key={s} value={s}/>)}</datalist></label>
          </div>
          <div className="enroll-section-label">Fees &amp; Salary <span className="enroll-rate-tag">auto-fills from rate card</span></div>
          <div className="enroll-row">
            <label className="enroll-field"><span>Fees/Month (₹)</span><input className={f} type="number" min="0" step="0.01" value={form.feesMonth} onChange={e => set("feesMonth", e.target.value)} placeholder="Rate card" /></label>
            <label className="enroll-field"><span>Tutor Rate (₹/hr)</span><input className={f} type="number" min="0" step="0.01" value={form.tutorSalaryHr} onChange={e => set("tutorSalaryHr", e.target.value)} placeholder="Rate card" /></label>
            <label className="enroll-field"><span>Tutor Paid (₹)</span><input className={f} type="number" min="0" step="0.01" value={form.tutorSalaryPaid} onChange={e => set("tutorSalaryPaid", e.target.value)} placeholder="0.00" /></label>
            <label className="enroll-field"><span>Profit (₹)</span><input className={f} type="number" step="0.01" value={form.profit} onChange={e => set("profit", e.target.value)} placeholder="Fees − Tutor" /></label>
            <label className="enroll-field"><span>Payment Date</span><input className={f} type="date" value={form.paymentDate} onChange={e => set("paymentDate", e.target.value)} /></label>
          </div>
          {editingId ? (
            <div className="enroll-row" style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(76,62,95,0.1)" }}>
              <label className="enroll-field"><span>Your Phone</span><input className={f} value={adminIdentifier} onChange={e => setAdminIdentifier(e.target.value)} autoComplete="username" /></label>
              <label className="enroll-field"><span>Password <em>*</em></span><input className={f} type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required autoComplete="current-password" /></label>
            </div>
          ) : null}
          <div className="enroll-actions">
            <button className="button solid" type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Update Student" : "Save Enrollment"}</button>
            <button className="button" type="button" onClick={clearForm}>{editingId ? "Cancel Edit" : "Clear"}</button>
          </div>
        </form>
      </article>
      <div className="enroll-history-wrap" style={{ marginTop:"1.4rem" }}>
        <p className="enroll-history-label">Recent enrollments</p>
        {isSupervisor ? (
          <div className="enroll-row" style={{ marginBottom: "0.75rem" }}>
            <label className="enroll-field"><span>Your Phone</span><input className={f} value={adminIdentifier} onChange={e => { setAdminIdentifier(e.target.value); setPendingDelete(null); }} placeholder="Needed to remove" autoComplete="username" /></label>
            <label className="enroll-field"><span>Password</span><input className={f} type="password" value={adminPassword} onChange={e => { setAdminPassword(e.target.value); setPendingDelete(null); }} placeholder="Needed to remove" autoComplete="current-password" /></label>
          </div>
        ) : null}
        {isSupervisor && canDelete && !pendingDelete ? (
          <p className="enroll-delete-ready">Password entered. Use the edit or remove icons, then confirm if removing.</p>
        ) : null}
        {pendingDelete ? (
          <div className="enroll-delete-confirm">
            <p>Confirm remove student: <strong>{pendingDelete.student_name || "student"}</strong>{pendingDelete.student_id ? ` (${pendingDelete.student_id})` : ""} — {pendingDelete.month_label || "entry"}</p>
            <button className="button solid" type="button" disabled={deleting} onClick={confirmDelete}>{deleting ? "Removing…" : "Confirm Remove Student"}</button>
            <button className="button" type="button" disabled={deleting} onClick={() => setPendingDelete(null)}>Cancel</button>
          </div>
        ) : null}
        <div className="rates-table-wrap">
          <table className="report-table accounts-record-table">
            <thead><tr>{isSupervisor ? <th>Action</th> : null}<th>Student</th><th>ID</th><th>Teacher</th><th>Subject</th><th className="col-num">Fees</th><th>Month</th></tr></thead>
            <tbody>
              {recentEntries.length === 0 ? (
                <tr><td colSpan={isSupervisor ? 7 : 6} style={{color:"#8f82a0",fontStyle:"italic",textAlign:"center"}}>No student enrollments yet.</td></tr>
              ) : recentEntries.map((r,i) => (
                <tr key={r.id || i}>
                  {isSupervisor ? (
                    <td>
                      <div className="row-actions">
                        <button className="row-edit-btn" type="button" title="Edit student" aria-label="Edit student" onClick={() => startEdit(r)}>✏️</button>
                        <button className="row-remove-btn" type="button" title="Remove student" aria-label="Remove student" disabled={!canDelete} onClick={() => requestDelete(r)}>🗑</button>
                      </div>
                    </td>
                  ) : null}
                  <td><strong>{r.student_name||"-"}</strong></td>
                  <td className="col-muted">{r.student_id||"-"}</td>
                  <td>{r.teacher_name||"-"}</td>
                  <td className="col-muted">{r.subject_name||"-"}</td>
                  <td className="col-num">{r.fees_month ? `₹${Number(r.fees_month).toLocaleString("en-IN")}` : "₹0"}</td>
                  <td className="col-muted">{r.month_label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Teacher enrollment sub-section ───────────────────────────────────────────

function TeacherEnrollSection({ apiBaseUrl, isSupervisor, currentUser }) {
  const [rates, setRates] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ cltId:"", teacherName:"", subjectName:"", classTypeCode:"", salaryPerHour:"", effectiveFrom:"", notes:"", adminIdentifier: currentUser?.phone || "", adminPassword:"" });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const today = new Date().toISOString().slice(0,10);
  const canDelete = Boolean(String(form.adminIdentifier || "").trim() && form.adminPassword);

  useEffect(() => { load(); }, [apiBaseUrl]);
  async function load() {
    const [ratesRes, teachersRes] = await Promise.all([
      fetch(`${apiBaseUrl}/api/accounts/rates`).then(x => x.json()),
      fetch(`${apiBaseUrl}/api/accounts/roster/teachers`).then(x => x.json())
    ]);
    if (ratesRes.ok) setRates(ratesRes.tutorRates || []);
    if (teachersRes.ok) setTeachers(teachersRes.rows || []);
  }

  // Match student enroll: name first, auto-fill CLT ID when an existing teacher is chosen.
  function autoFillTeacher(name) {
    const fromRoster = teachers.find(t => t.teacher_name.toLowerCase() === name.toLowerCase());
    const fromRates = rates.find(r => String(r.teacher_name || "").toLowerCase() === name.toLowerCase());
    const cltId = fromRoster?.clt_id || fromRates?.clt_id || "";
    setForm(f => ({ ...f, teacherName: name, cltId: cltId || (f.teacherName.toLowerCase() === name.toLowerCase() ? f.cltId : "") }));
  }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setMsg("");
    try {
      const r = await fetch(`${apiBaseUrl}/api/accounts/rates/tutors`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ ...form, salaryPerHour: Number(form.salaryPerHour), effectiveFrom: form.effectiveFrom || today }) });
      const d = await r.json();
      if (!d.ok) throw new Error(d.message);
      const savedClt = d.row?.clt_id || form.cltId || "new";
      setMsg(`Saved — ${savedClt}.`);
      setForm(p => ({ cltId: "", teacherName: "", subjectName: "", classTypeCode: "", salaryPerHour: "", effectiveFrom: "", notes: "", adminIdentifier: p.adminIdentifier, adminPassword: "" }));
      load();
    } catch(err) { setMsg(String(err.message)); } finally { setSaving(false); }
  }

  async function handleRemoveTeacher(cltId, teacherName) {
    if (!canDelete) { setMsg("Enter your phone and password first."); return; }
    setPendingDelete({ type: "teacher", cltId, teacherName });
    setMsg("");
  }

  function startEdit(r) {
    setPendingDelete(null);
    setForm({
      cltId: r.clt_id,
      teacherName: r.teacher_name,
      subjectName: r.subject_name || "",
      classTypeCode: r.class_type_code || "",
      salaryPerHour: String(r.salary_per_hour),
      effectiveFrom: today,
      notes: r.notes || "",
      adminIdentifier: form.adminIdentifier,
      adminPassword: form.adminPassword
    });
    setMsg(`Editing ${r.teacher_name || "teacher"} — update the form and save.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmPendingDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      let r;
      if (pendingDelete.type === "teacher") {
        r = await fetch(`${apiBaseUrl}/api/accounts/rates/tutors/by-clt/${encodeURIComponent(pendingDelete.cltId)}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminIdentifier: form.adminIdentifier, adminPassword: form.adminPassword })
        });
      } else {
        r = await fetch(`${apiBaseUrl}/api/accounts/rates/tutors/${pendingDelete.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminIdentifier: form.adminIdentifier, adminPassword: form.adminPassword })
        });
      }
      const d = await r.json();
      if (!d.ok) throw new Error(d.message);
      setMsg(d.message || (pendingDelete.type === "teacher" ? "Teacher removed." : "Rate removed."));
      setPendingDelete(null);
      load();
    } catch (err) {
      setMsg(String(err.message || err));
    } finally {
      setDeleting(false);
    }
  }

  const f = "enroll-input";
  const byTeacher = rates.reduce((acc, r) => { if (!acc[r.clt_id]) acc[r.clt_id] = []; acc[r.clt_id].push(r); return acc; }, {});
  const teacherOptions = [
    ...teachers.map(t => ({ clt_id: t.clt_id, teacher_name: t.teacher_name })),
    ...rates.filter(r => !teachers.some(t => t.clt_id === r.clt_id)).map(r => ({ clt_id: r.clt_id, teacher_name: r.teacher_name }))
  ];

  return (
    <div className="enroll-subsection">
      {isSupervisor ? (
        <article className="enroll-card">
          <h3>Enroll New Teacher</h3>
          <p className="analytics-desc">Add a teacher with hourly rate and effective date. CLT ID auto-fills for existing teachers, or is assigned on save for new ones. Leave Subject blank to set a default rate for all subjects.</p>
          {msg ? <div className={`accounts-feedback ${msg.startsWith("Saved") || msg.includes("removed") || msg.includes("Removed") || msg.startsWith("Editing") ?"success":"error"}`}>{msg}</div> : null}
          <form className="enroll-form" onSubmit={handleSave} autoComplete="off">
            <div className="enroll-section-label">Teacher details</div>
            <div className="enroll-row">
              <label className="enroll-field enroll-field--wide"><span>Teacher Name <em>*</em></span><input className={f} list="te-teachers" value={form.teacherName} onChange={e => autoFillTeacher(e.target.value)} placeholder="Full name" required autoComplete="off" /><datalist id="te-teachers">{teacherOptions.map(t => <option key={t.clt_id} value={t.teacher_name} />)}</datalist></label>
              <label className="enroll-field"><span>CLT ID</span><input className={f} value={form.cltId} onChange={e => setForm(p => ({ ...p, cltId: e.target.value }))} placeholder="Auto" autoComplete="off" /></label>
              <label className="enroll-field"><span>Subject <span className="enroll-rate-tag">blank=all</span></span><input className={f} value={form.subjectName} onChange={e=>setForm(p=>({...p,subjectName:e.target.value}))} placeholder="Optional" /></label>
              <label className="enroll-field"><span>Class Type</span><select className={f} value={form.classTypeCode} onChange={e=>setForm(p=>({...p,classTypeCode:e.target.value}))}><option value="">Any</option><option value="O2O">O2O</option><option value="N2N">N2N</option></select></label>
              <label className="enroll-field"><span>₹/hr <em>*</em></span><input className={f} type="number" min="0" step="0.01" value={form.salaryPerHour} onChange={e=>setForm(p=>({...p,salaryPerHour:e.target.value}))} placeholder="200" required /></label>
              <label className="enroll-field"><span>Effective From <em>*</em></span><input className={f} type="date" value={form.effectiveFrom||today} onChange={e=>setForm(p=>({...p,effectiveFrom:e.target.value}))} required /></label>
              <label className="enroll-field"><span>Notes</span><input className={f} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Optional" /></label>
            </div>
            <div className="enroll-row" style={{marginTop:"0.5rem",paddingTop:"0.5rem",borderTop:"1px solid rgba(76,62,95,0.1)"}}>
              <label className="enroll-field"><span>Your Phone</span><input className={f} value={form.adminIdentifier} onChange={e=>{ setForm(p=>({...p,adminIdentifier:e.target.value})); setPendingDelete(null); }} autoComplete="username" /></label>
              <label className="enroll-field"><span>Password <em>*</em></span><input className={f} type="password" value={form.adminPassword} onChange={e=>{ setForm(p=>({...p,adminPassword:e.target.value})); setPendingDelete(null); }} required autoComplete="current-password" /></label>
            </div>
            <div className="enroll-actions"><button className="button solid" type="submit" disabled={saving}>Save Teacher</button><button className="button" type="button" onClick={()=>setForm(p=>({...p,cltId:"",teacherName:"",subjectName:"",classTypeCode:"",salaryPerHour:"",effectiveFrom:"",notes:"",adminPassword:""}))}>Clear</button></div>
          </form>
        </article>
      ) : null}
      <div className="enroll-history-wrap" style={{ marginTop:"1.4rem" }}>
        <p className="enroll-history-label">Teacher enrollment history</p>
        {isSupervisor && canDelete && !pendingDelete ? (
          <p className="enroll-delete-ready">Password entered. Use the edit or remove icons, then confirm if removing.</p>
        ) : null}
        {pendingDelete ? (
          <div className="enroll-delete-confirm">
            <p>
              {pendingDelete.type === "teacher"
                ? <>Confirm remove teacher: <strong>{pendingDelete.teacherName || pendingDelete.cltId}</strong> and all their rates</>
                : <>Confirm remove this teacher rate entry</>}
            </p>
            <button className="button solid" type="button" disabled={deleting} onClick={confirmPendingDelete}>{deleting ? "Removing…" : "Confirm Remove Teacher"}</button>
            <button className="button" type="button" disabled={deleting} onClick={() => setPendingDelete(null)}>Cancel</button>
          </div>
        ) : null}
        <div className="rates-table-wrap">
          <table className="report-table accounts-record-table">
            <thead><tr>{isSupervisor ? <th>Action</th> : null}<th>CLT ID</th><th>Teacher</th><th>Subject</th><th>Class</th><th className="col-num">₹/hr</th><th>Effective From</th><th>Status</th></tr></thead>
            <tbody>
              {rates.length === 0 ? (
                <tr><td colSpan={isSupervisor ? 8 : 7} style={{color:"#8f82a0",fontStyle:"italic",textAlign:"center"}}>No teachers enrolled yet.</td></tr>
              ) : Object.entries(byTeacher).map(([cltId, rows]) => rows.map((r,i) => (
                <tr key={r.id} className={i===0?"rate-row-current":""}>
                  {isSupervisor ? (
                    <td>
                      <div className="row-actions">
                        <button className="row-edit-btn" type="button" title="Edit teacher" aria-label="Edit teacher" onClick={() => startEdit(r)}>✏️</button>
                        <button className="row-remove-btn" type="button" title="Remove teacher" aria-label="Remove teacher" disabled={!canDelete} onClick={() => handleRemoveTeacher(r.clt_id, r.teacher_name)}>🗑</button>
                      </div>
                    </td>
                  ) : null}
                  <td className="col-muted">{r.clt_id}</td>
                  <td><strong>{r.teacher_name}</strong></td>
                  <td className="col-muted">{r.subject_name || <em style={{color:"#ccc"}}>All</em>}</td>
                  <td className="col-muted">{r.class_type_code || <em style={{color:"#ccc"}}>Any</em>}</td>
                  <td className="col-num">₹{Number(r.salary_per_hour).toFixed(0)}</td>
                  <td className="col-muted">{r.effective_from_str||r.effective_from}</td>
                  <td>{i===0?<span className="rate-active-badge">Active</span>:<span className="rate-hist-badge">History</span>}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Subject enrollment sub-section ───────────────────────────────────────────

// Subject Enrollment = enroll a student in a specific subject (creates account_entry, no supervisor needed)
function SubjectEnrollSection({ apiBaseUrl, isSupervisor, currentUser }) {
  const EMPTY = { subjectName:"", classTypeCode:"O2O", subClassTypeCode:"", monthLabel:"", studentName:"", studentId:"", teacherName:"", cltId:"", feesMonth:"", tutorSalaryHr:"", tutorSalaryPaid:"", profit:"", paymentDate:"" };
  const [subjects, setSubjects] = useState([]);
  const [subTypes, setSubTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState({ text:"", ok:true });
  const [saving, setSaving] = useState(false);
  const [rateHint, setRateHint] = useState("");
  const [adminIdentifier, setAdminIdentifier] = useState(currentUser?.phone || "");
  const [adminPassword, setAdminPassword] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const canDelete = Boolean(adminIdentifier.trim() && adminPassword);

  async function load() {
    const [s, t, sub, recent] = await Promise.all([
      fetch(`${apiBaseUrl}/api/accounts/roster/students`).then(r=>r.json()),
      fetch(`${apiBaseUrl}/api/accounts/roster/teachers`).then(r=>r.json()),
      fetch(`${apiBaseUrl}/api/accounts/roster/subjects`).then(r=>r.json()),
      fetch(`${apiBaseUrl}/api/accounts/students`).then(r=>r.json()),
    ]);
    if (s.ok) setStudents(s.rows);
    if (t.ok) setTeachers(t.rows);
    if (sub.ok) { setSubjects(sub.subjects||[]); setSubTypes(sub.subTypes||[]); }
    if (recent.ok) setHistory((recent.rows||[]).filter(r=>r.subject_name).slice(0,30));
  }

  useEffect(() => { load().catch(()=>{}); }, [apiBaseUrl]);

  // Auto-fill fee from rate card when subject or teacher changes.
  useEffect(() => {
    if (!form.subjectName && !form.cltId) return;
    const params = new URLSearchParams();
    if (form.cltId) params.set("cltId", form.cltId);
    if (form.classTypeCode) params.set("classTypeCode", form.classTypeCode);
    if (form.subClassTypeCode) params.set("subClassTypeCode", form.subClassTypeCode);
    if (form.subjectName) params.set("subjectName", form.subjectName);
    if (form.monthLabel) {
      const months = {january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
      const m = form.monthLabel.trim().toLowerCase().match(/([a-z]+)\s+(\d{4})/);
      if (m && months[m[1]]) params.set("forDate", `${m[2]}-${String(months[m[1]]).padStart(2,"0")}-01`);
    }
    fetch(`${apiBaseUrl}/api/accounts/rates/lookup?${params}`).then(r=>r.json()).then(data => {
      if (!data.ok) return;
      const hints = [];
      setForm(f => {
        const next = {...f};
        if (data.feesMonth !== null && f.feesMonth === "") { next.feesMonth = String(data.feesMonth); hints.push(`Fees ₹${data.feesMonth}/mo`); }
        if (data.salaryPerHour !== null && f.tutorSalaryHr === "") { next.tutorSalaryHr = String(data.salaryPerHour); hints.push(`Tutor ₹${data.salaryPerHour}/hr`); }
        return next;
      });
      if (hints.length) setRateHint(hints.join(" · ") + " — from rate card");
    }).catch(()=>{});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.subjectName, form.cltId, form.classTypeCode, form.subClassTypeCode, form.monthLabel]);

  function set(k,v) { setForm(f=>({...f,[k]:v})); setRateHint(""); }
  function autoStudent(name) { const m=students.find(s=>s.student_name.toLowerCase()===name.toLowerCase()); setForm(f=>({...f,studentName:name,studentId:m?m.student_id:f.studentId})); }
  function autoTeacher(name) { const m=teachers.find(t=>t.teacher_name.toLowerCase()===name.toLowerCase()); setForm(f=>({...f,teacherName:name,cltId:m?m.clt_id:f.cltId})); }

  function startEdit(entry) {
    setEditingId(entry.id);
    setPendingDelete(null);
    setForm({
      subjectName: entry.subject_name || "",
      classTypeCode: entry.class_type_code || "O2O",
      subClassTypeCode: entry.sub_class_type_code || "",
      monthLabel: entry.month_label || "",
      studentName: entry.student_name || "",
      studentId: entry.student_id || "",
      teacherName: entry.teacher_name || "",
      cltId: entry.clt_id || "",
      feesMonth: entry.fees_month != null ? String(entry.fees_month) : "",
      tutorSalaryHr: entry.tutor_salary_hr != null ? String(entry.tutor_salary_hr) : "",
      tutorSalaryPaid: entry.tutor_salary_paid != null ? String(entry.tutor_salary_paid) : "",
      profit: entry.profit != null ? String(entry.profit) : "",
      paymentDate: entry.payment_date || ""
    });
    setRateHint("");
    setMsg({ text: `Editing ${entry.subject_name || "subject"} — update the form and save.`, ok: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearForm() {
    setForm(EMPTY);
    setEditingId(null);
    setRateHint("");
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setMsg({text:"",ok:true});
    try {
      if (editingId) {
        if (!canDelete) throw new Error("Enter your phone and password below to save edits.");
        const res = await fetch(`${apiBaseUrl}/api/accounts/entries/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminIdentifier,
            adminPassword,
            student_name: form.studentName || null,
            student_id: form.studentId || null,
            teacher_name: form.teacherName || null,
            clt_id: form.cltId || null,
            class_type_code: form.classTypeCode || null,
            sub_class_type_code: form.subClassTypeCode || null,
            subject_name: form.subjectName || null,
            fees_month: form.feesMonth !== "" ? Number(form.feesMonth) : null,
            tutor_salary_hr: form.tutorSalaryHr !== "" ? Number(form.tutorSalaryHr) : null,
            tutor_salary_paid: form.tutorSalaryPaid !== "" ? Number(form.tutorSalaryPaid) : null,
            profit: form.profit !== "" ? Number(form.profit) : null,
            payment_date: form.paymentDate || null
          })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message);
        setMsg({ text: `Updated — ${form.subjectName || "subject"}.`, ok: true });
      } else {
        const res = await fetch(`${apiBaseUrl}/api/accounts/entries`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ ...form, feesMonth: form.feesMonth?Number(form.feesMonth):null, tutorSalaryHr: form.tutorSalaryHr?Number(form.tutorSalaryHr):null, tutorSalaryPaid: form.tutorSalaryPaid?Number(form.tutorSalaryPaid):null, profit: form.profit?Number(form.profit):null, carryOverTutorFees: null }) });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message);
        setMsg({text:`Saved — ${data.entry?.student_id||"new"} in ${form.subjectName}.`,ok:true});
      }
      clearForm();
      await load();
    } catch(err) { setMsg({text:String(err.message),ok:false}); }
    finally { setSaving(false); }
  }

  function requestDelete(entry) {
    if (!canDelete) {
      setMsg({ text: "Enter your phone and password above, then click the remove icon again.", ok: false });
      return;
    }
    setPendingDelete(entry);
    setMsg({ text: "", ok: true });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const entry = pendingDelete;
    const label = `${entry.subject_name || "subject"} — ${entry.student_name || "student"} (${entry.month_label || "entry"})`;
    try {
      const res = await fetch(`${apiBaseUrl}/api/accounts/entries/${entry.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminIdentifier, adminPassword })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      setMsg({ text: `Removed subject ${label}.`, ok: true });
      setPendingDelete(null);
      if (editingId === entry.id) clearForm();
      await load();
    } catch (err) {
      setMsg({ text: String(err.message), ok: false });
    } finally {
      setDeleting(false);
    }
  }

  const f = "enroll-input";
  return (
    <div className="enroll-subsection">
      <article className="enroll-card">
        <h3>{editingId ? "Edit Subject Enrollment" : "Enroll Student in Subject"}</h3>
        {msg.text ? <div className={`accounts-feedback ${msg.ok?"success":"error"}`}>{msg.text}</div> : null}
        {rateHint ? <div className="rate-hint">💡 {rateHint}</div> : null}
        <form className="enroll-form" onSubmit={handleSubmit}>
          <div className="enroll-section-label">Subject &amp; Class</div>
          <div className="enroll-row">
            <label className="enroll-field enroll-field--wide"><span>Subject <em>*</em></span>
              <input className={f} list="sub-subjects" value={form.subjectName} onChange={e=>set("subjectName",e.target.value)} placeholder="e.g. Mathematics" required />
              <datalist id="sub-subjects">{subjects.map(s=><option key={s} value={s}/>)}</datalist>
            </label>
            <label className="enroll-field"><span>Class Type</span><select className={f} value={form.classTypeCode} onChange={e=>set("classTypeCode",e.target.value)}><option value="O2O">O2O</option><option value="N2N">N2N</option><option value="">Other</option></select></label>
            <label className="enroll-field"><span>Sub-type</span>
              <input className={f} list="sub-subtypes" value={form.subClassTypeCode} onChange={e=>set("subClassTypeCode",e.target.value)} placeholder="Optional" />
              <datalist id="sub-subtypes">{subTypes.map(s=><option key={s} value={s}/>)}</datalist>
            </label>
          </div>
          <div className="enroll-section-label">Month &amp; Student</div>
          <div className="enroll-row">
            <label className="enroll-field"><span>Month <em>*</em></span><input className={f} value={form.monthLabel} onChange={e=>set("monthLabel",e.target.value)} placeholder="e.g. September 2026" required /></label>
            <label className="enroll-field enroll-field--wide"><span>Student Name <em>*</em></span>
              <input className={f} list="sub-students" value={form.studentName} onChange={e=>autoStudent(e.target.value)} placeholder="Full name" required />
              <datalist id="sub-students">{students.map(s=><option key={s.student_id} value={s.student_name}/>)}</datalist>
            </label>
            <label className="enroll-field"><span>Student ID</span><input className={f} value={form.studentId} onChange={e=>set("studentId",e.target.value)} placeholder="Auto" /></label>
          </div>
          <div className="enroll-section-label">Teacher</div>
          <div className="enroll-row">
            <label className="enroll-field enroll-field--wide"><span>Teacher</span>
              <input className={f} list="sub-teachers" value={form.teacherName} onChange={e=>autoTeacher(e.target.value)} placeholder="Teacher name" />
              <datalist id="sub-teachers">{teachers.map(t=><option key={t.clt_id} value={t.teacher_name}/>)}</datalist>
            </label>
            <label className="enroll-field"><span>CLT ID</span><input className={f} value={form.cltId} onChange={e=>set("cltId",e.target.value)} placeholder="Auto" /></label>
          </div>
          <div className="enroll-section-label">Fees <span className="enroll-rate-tag">auto-fills from rate card</span></div>
          <div className="enroll-row">
            <label className="enroll-field"><span>Fees/Month (₹)</span><input className={f} type="number" min="0" step="0.01" value={form.feesMonth} onChange={e=>set("feesMonth",e.target.value)} placeholder="Rate card" /></label>
            <label className="enroll-field"><span>Tutor Rate (₹/hr)</span><input className={f} type="number" min="0" step="0.01" value={form.tutorSalaryHr} onChange={e=>set("tutorSalaryHr",e.target.value)} placeholder="Rate card" /></label>
            <label className="enroll-field"><span>Tutor Paid (₹)</span><input className={f} type="number" min="0" step="0.01" value={form.tutorSalaryPaid} onChange={e=>set("tutorSalaryPaid",e.target.value)} placeholder="0.00" /></label>
            <label className="enroll-field"><span>Profit (₹)</span><input className={f} type="number" step="0.01" value={form.profit} onChange={e=>set("profit",e.target.value)} placeholder="Fees − Tutor" /></label>
            <label className="enroll-field"><span>Payment Date</span><input className={f} type="date" value={form.paymentDate} onChange={e=>set("paymentDate",e.target.value)} /></label>
          </div>
          {editingId ? (
            <div className="enroll-row" style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(76,62,95,0.1)" }}>
              <label className="enroll-field"><span>Your Phone</span><input className={f} value={adminIdentifier} onChange={e => setAdminIdentifier(e.target.value)} autoComplete="username" /></label>
              <label className="enroll-field"><span>Password <em>*</em></span><input className={f} type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required autoComplete="current-password" /></label>
            </div>
          ) : null}
          <div className="enroll-actions">
            <button className="button solid" type="submit" disabled={saving}>{saving?"Saving…": editingId ? "Update Subject" : "Save Enrollment"}</button>
            <button className="button" type="button" onClick={clearForm}>{editingId ? "Cancel Edit" : "Clear"}</button>
          </div>
        </form>
      </article>
      <div className="enroll-history-wrap" style={{marginTop:"1.4rem"}}>
        <p className="enroll-history-label">Recent subject enrollments</p>
        {isSupervisor ? (
          <div className="enroll-row" style={{ marginBottom: "0.75rem" }}>
            <label className="enroll-field"><span>Your Phone</span><input className={f} value={adminIdentifier} onChange={e => { setAdminIdentifier(e.target.value); setPendingDelete(null); }} placeholder="Needed to remove" autoComplete="username" /></label>
            <label className="enroll-field"><span>Password</span><input className={f} type="password" value={adminPassword} onChange={e => { setAdminPassword(e.target.value); setPendingDelete(null); }} placeholder="Needed to remove" autoComplete="current-password" /></label>
          </div>
        ) : null}
        {isSupervisor && canDelete && !pendingDelete ? (
          <p className="enroll-delete-ready">Password entered. Use the edit or remove icons, then confirm if removing.</p>
        ) : null}
        {pendingDelete ? (
          <div className="enroll-delete-confirm">
            <p>Confirm remove subject: <strong>{pendingDelete.subject_name || "subject"}</strong> — {pendingDelete.student_name || "student"} ({pendingDelete.month_label || "entry"})</p>
            <button className="button solid" type="button" disabled={deleting} onClick={confirmDelete}>{deleting ? "Removing…" : "Confirm Remove Subject"}</button>
            <button className="button" type="button" disabled={deleting} onClick={() => setPendingDelete(null)}>Cancel</button>
          </div>
        ) : null}
        <div className="rates-table-wrap">
          <table className="report-table accounts-record-table">
            <thead><tr>{isSupervisor ? <th>Action</th> : null}<th>Subject</th><th>Student</th><th>Teacher</th><th className="col-num">Fees</th><th>Month</th></tr></thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={isSupervisor ? 6 : 5} style={{color:"#8f82a0",fontStyle:"italic",textAlign:"center"}}>No subject enrollments yet.</td></tr>
              ) : history.map((r,i) => (
                <tr key={r.id || i}>
                  {isSupervisor ? (
                    <td>
                      <div className="row-actions">
                        <button className="row-edit-btn" type="button" title="Edit subject" aria-label="Edit subject" onClick={() => startEdit(r)}>✏️</button>
                        <button className="row-remove-btn" type="button" title="Remove subject" aria-label="Remove subject" disabled={!canDelete} onClick={() => requestDelete(r)}>🗑</button>
                      </div>
                    </td>
                  ) : null}
                  <td><strong>{r.subject_name||"-"}</strong></td>
                  <td>{r.student_name||"-"}</td>
                  <td className="col-muted">{r.teacher_name||"-"}</td>
                  <td className="col-num">{r.fees_month?`₹${Number(r.fees_month).toLocaleString("en-IN")}`:"-"}</td>
                  <td className="col-muted">{r.month_label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Enroll panel wrapper ──────────────────────────────────────────────────────

function EnrollPanel({ apiBaseUrl, isSupervisor, onSaved, currentUser }) {
  const [subTab, setSubTab] = useState("student");
  return (
    <div className="enroll-panel">
      <div className="enroll-subtabs">
        <button type="button" className={`enroll-subtab${subTab==="student"?" active":""}`} onClick={()=>setSubTab("student")}>Student Enrollment</button>
        <button type="button" className={`enroll-subtab${subTab==="teacher"?" active":""}`} onClick={()=>setSubTab("teacher")}>Teacher Enrollment</button>
        <button type="button" className={`enroll-subtab${subTab==="subject"?" active":""}`} onClick={()=>setSubTab("subject")}>Subject Enrollment</button>
      </div>
      {subTab === "student" ? <StudentEnrollSection apiBaseUrl={apiBaseUrl} onSaved={onSaved} isSupervisor={isSupervisor} currentUser={currentUser} /> : null}
      {subTab === "teacher" ? <TeacherEnrollSection apiBaseUrl={apiBaseUrl} isSupervisor={isSupervisor} currentUser={currentUser} /> : null}
      {subTab === "subject" ? <SubjectEnrollSection apiBaseUrl={apiBaseUrl} isSupervisor={isSupervisor} currentUser={currentUser} /> : null}
    </div>
  );
}



// ── Rates configuration panel ────────────────────────────────────────────────

const EMPTY_TUTOR_RATE = { cltId: "", teacherName: "", subjectName: "", classTypeCode: "", salaryPerHour: "", effectiveFrom: "", notes: "", adminIdentifier: "", adminPassword: "" };
const EMPTY_SUBJECT_FEE = { classTypeCode: "O2O", subClassTypeCode: "", subjectName: "", feesMonth: "", effectiveFrom: "", notes: "", adminIdentifier: "", adminPassword: "" };

function RatesPanel({ apiBaseUrl, mode = "teacher", isSupervisor = true, currentUser }) {
  const [tutorRates, setTutorRates] = useState([]);
  const [subjectFees, setSubjectFees] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subTypes, setSubTypes] = useState([]);
  const [tForm, setTForm] = useState({ ...EMPTY_TUTOR_RATE, adminIdentifier: currentUser?.phone || "" });
  const [sForm, setSForm] = useState({ ...EMPTY_SUBJECT_FEE, adminIdentifier: currentUser?.phone || "" });
  const [tMsg, setTMsg] = useState({ text: "", ok: true });
  const [sMsg, setSMsg] = useState({ text: "", ok: true });
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const canDeleteTutor = Boolean(String(tForm.adminIdentifier || "").trim() && tForm.adminPassword);
  const canDeleteSubject = Boolean(String(sForm.adminIdentifier || "").trim() && sForm.adminPassword);

  useEffect(() => { loadRates(); }, [apiBaseUrl]);

  async function loadRates() {
    const [ratesRes, teachersRes, subjectsRes] = await Promise.all([
      fetch(`${apiBaseUrl}/api/accounts/rates`).then(x => x.json()),
      fetch(`${apiBaseUrl}/api/accounts/roster/teachers`).then(x => x.json()),
      fetch(`${apiBaseUrl}/api/accounts/roster/subjects`).then(x => x.json())
    ]);
    if (ratesRes.ok) { setTutorRates(ratesRes.tutorRates || []); setSubjectFees(ratesRes.subjectFees || []); }
    if (teachersRes.ok) setTeachers(teachersRes.rows || []);
    if (subjectsRes.ok) { setSubjects(subjectsRes.subjects || []); setSubTypes(subjectsRes.subTypes || []); }
  }

  function autoFillTeacher(name) {
    const fromRoster = teachers.find(t => t.teacher_name.toLowerCase() === name.toLowerCase());
    const fromRates = tutorRates.find(r => String(r.teacher_name || "").toLowerCase() === name.toLowerCase());
    const cltId = fromRoster?.clt_id || fromRates?.clt_id || "";
    setTForm(f => ({
      ...f,
      teacherName: name,
      cltId: cltId || (f.teacherName.toLowerCase() === name.toLowerCase() ? f.cltId : "")
    }));
  }

  async function saveTutorRate(e) {
    e.preventDefault(); setSaving(true); setTMsg({ text: "", ok: true });
    try {
      const r = await fetch(`${apiBaseUrl}/api/accounts/rates/tutors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tForm, salaryPerHour: Number(tForm.salaryPerHour), effectiveFrom: tForm.effectiveFrom || today })
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.message);
      setTMsg({ text: `Saved — ${d.row?.clt_id || tForm.cltId || "rate"}.`, ok: true });
      setTForm(p => ({ ...EMPTY_TUTOR_RATE, adminIdentifier: p.adminIdentifier }));
      setPendingDelete(null);
      loadRates();
    } catch (err) {
      setTMsg({ text: String(err.message), ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function saveSubjectFee(e) {
    e.preventDefault(); setSaving(true); setSMsg({ text: "", ok: true });
    try {
      const r = await fetch(`${apiBaseUrl}/api/accounts/rates/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sForm, feesMonth: Number(sForm.feesMonth), effectiveFrom: sForm.effectiveFrom || today })
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.message);
      setSMsg({ text: `Saved — ${sForm.subjectName || "subject fee"}.`, ok: true });
      setSForm(p => ({ ...EMPTY_SUBJECT_FEE, adminIdentifier: p.adminIdentifier }));
      setPendingDelete(null);
      loadRates();
    } catch (err) {
      setSMsg({ text: String(err.message), ok: false });
    } finally {
      setSaving(false);
    }
  }

  function requestDeleteTutor(row) {
    if (!canDeleteTutor) {
      setTMsg({ text: "Enter your phone and password, then click the remove icon again.", ok: false });
      return;
    }
    setPendingDelete({ kind: "tutor", id: row.id, label: `${row.teacher_name || "teacher"} · ${row.subject_name || "All subjects"} · ₹${Number(row.salary_per_hour).toFixed(0)}/hr` });
    setTMsg({ text: "", ok: true });
  }

  function requestDeleteSubject(row) {
    if (!canDeleteSubject) {
      setSMsg({ text: "Enter your phone and password, then click the remove icon again.", ok: false });
      return;
    }
    setPendingDelete({ kind: "subject", id: row.id, label: `${row.subject_name || "subject"} · ${row.class_type_code || "Any"} · ₹${Number(row.fees_month).toLocaleString("en-IN")}/mo` });
    setSMsg({ text: "", ok: true });
  }

  async function confirmPendingDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const isTutor = pendingDelete.kind === "tutor";
      const creds = isTutor
        ? { adminIdentifier: tForm.adminIdentifier, adminPassword: tForm.adminPassword }
        : { adminIdentifier: sForm.adminIdentifier, adminPassword: sForm.adminPassword };
      const url = isTutor
        ? `${apiBaseUrl}/api/accounts/rates/tutors/${pendingDelete.id}`
        : `${apiBaseUrl}/api/accounts/rates/subjects/${pendingDelete.id}`;
      const r = await fetch(url, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(creds) });
      const d = await r.json();
      if (!d.ok) throw new Error(d.message);
      if (isTutor) setTMsg({ text: `Removed ${pendingDelete.label}.`, ok: true });
      else setSMsg({ text: `Removed ${pendingDelete.label}.`, ok: true });
      setPendingDelete(null);
      loadRates();
    } catch (err) {
      const text = String(err.message || err);
      if (pendingDelete.kind === "tutor") setTMsg({ text, ok: false });
      else setSMsg({ text, ok: false });
    } finally {
      setDeleting(false);
    }
  }

  function fillTutorForm(r) {
    setPendingDelete(null);
    setTForm({
      cltId: r.clt_id || "",
      teacherName: r.teacher_name || "",
      subjectName: r.subject_name || "",
      classTypeCode: r.class_type_code || "",
      salaryPerHour: String(r.salary_per_hour ?? ""),
      effectiveFrom: today,
      notes: "",
      adminIdentifier: tForm.adminIdentifier,
      adminPassword: tForm.adminPassword
    });
    setTMsg({ text: `Editing ${r.teacher_name || "teacher"} — update and save.`, ok: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fillSubjectForm(r) {
    setPendingDelete(null);
    setSForm({
      classTypeCode: r.class_type_code || "O2O",
      subClassTypeCode: r.sub_class_type_code || "",
      subjectName: r.subject_name || "",
      feesMonth: String(r.fees_month ?? ""),
      effectiveFrom: today,
      notes: "",
      adminIdentifier: sForm.adminIdentifier,
      adminPassword: sForm.adminPassword
    });
    setSMsg({ text: `Editing ${r.subject_name || "subject"} — update and save.`, ok: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const tutorRatesByTeacher = tutorRates.reduce((acc, r) => {
    if (!acc[r.clt_id]) acc[r.clt_id] = [];
    acc[r.clt_id].push(r);
    return acc;
  }, {});

  const subjectFeesByKey = subjectFees.reduce((acc, r) => {
    const key = `${r.subject_name || ""}|${r.class_type_code || ""}|${r.sub_class_type_code || ""}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const teacherOptions = [
    ...teachers.map(t => ({ clt_id: t.clt_id, teacher_name: t.teacher_name })),
    ...tutorRates
      .filter(r => !teachers.some(t => t.clt_id === r.clt_id))
      .map(r => ({ clt_id: r.clt_id, teacher_name: r.teacher_name }))
  ];

  const f = "enroll-input";

  if (mode === "teacher") {
    return (
      <div className="enroll-subsection">
        {isSupervisor ? (
          <article className="enroll-card rates-card">
            <h3>Teacher Rate Card</h3>
            <p className="analytics-desc">Set hourly tutor rates. Leave Subject blank for a default rate across all subjects. History is preserved by effective date.</p>
            {tMsg.text ? <div className={`accounts-feedback ${tMsg.ok ? "success" : "error"}`}>{tMsg.text}</div> : null}
            <form className="enroll-form" onSubmit={saveTutorRate} autoComplete="off">
              <div className="enroll-section-label">Rate details</div>
              <div className="enroll-row">
                <label className="enroll-field enroll-field--wide">
                  <span>Teacher Name <em>*</em></span>
                  <input className={f} list="rc-teachers" value={tForm.teacherName} onChange={e => autoFillTeacher(e.target.value)} placeholder="Full name" required autoComplete="off" />
                  <datalist id="rc-teachers">{teacherOptions.map(t => <option key={t.clt_id} value={t.teacher_name} />)}</datalist>
                </label>
                <label className="enroll-field"><span>CLT ID</span><input className={f} value={tForm.cltId} onChange={e => setTForm(p => ({ ...p, cltId: e.target.value }))} placeholder="Auto" autoComplete="off" /></label>
                <label className="enroll-field"><span>Subject <span className="enroll-rate-tag">blank=all</span></span><input className={f} list="rc-subjects" value={tForm.subjectName} onChange={e => setTForm(p => ({ ...p, subjectName: e.target.value }))} placeholder="Optional" /><datalist id="rc-subjects">{subjects.map(s => <option key={s} value={s} />)}</datalist></label>
                <label className="enroll-field"><span>Class Type</span><select className={f} value={tForm.classTypeCode} onChange={e => setTForm(p => ({ ...p, classTypeCode: e.target.value }))}><option value="">Any</option><option value="O2O">O2O</option><option value="N2N">N2N</option></select></label>
                <label className="enroll-field"><span>₹/hr <em>*</em></span><input className={f} type="number" min="0" step="0.01" value={tForm.salaryPerHour} onChange={e => setTForm(p => ({ ...p, salaryPerHour: e.target.value }))} placeholder="200" required /></label>
                <label className="enroll-field"><span>Effective From <em>*</em></span><input className={f} type="date" value={tForm.effectiveFrom || today} onChange={e => setTForm(p => ({ ...p, effectiveFrom: e.target.value }))} required /></label>
                <label className="enroll-field"><span>Notes</span><input className={f} value={tForm.notes} onChange={e => setTForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" /></label>
              </div>
              <div className="enroll-row" style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(76,62,95,0.1)" }}>
                <label className="enroll-field"><span>Your Phone</span><input className={f} value={tForm.adminIdentifier} onChange={e => { setTForm(p => ({ ...p, adminIdentifier: e.target.value })); setPendingDelete(null); }} autoComplete="username" /></label>
                <label className="enroll-field"><span>Password <em>*</em></span><input className={f} type="password" value={tForm.adminPassword} onChange={e => { setTForm(p => ({ ...p, adminPassword: e.target.value })); setPendingDelete(null); }} required autoComplete="current-password" /></label>
              </div>
              <div className="enroll-actions">
                <button className="button solid" type="submit" disabled={saving}>{saving ? "Saving…" : "Save Rate"}</button>
                <button className="button" type="button" onClick={() => setTForm(p => ({ ...EMPTY_TUTOR_RATE, adminIdentifier: p.adminIdentifier }))}>Clear</button>
              </div>
            </form>
          </article>
        ) : null}

        <div className="enroll-history-wrap" style={{ marginTop: "1.4rem" }}>
          <p className="enroll-history-label">Teacher rate history</p>
          {isSupervisor && canDeleteTutor && !pendingDelete ? (
            <p className="enroll-delete-ready">Password entered. Use the edit or remove icons, then confirm if removing.</p>
          ) : null}
          {pendingDelete?.kind === "tutor" ? (
            <div className="enroll-delete-confirm">
              <p>Confirm remove rate: <strong>{pendingDelete.label}</strong></p>
              <button className="button solid" type="button" disabled={deleting} onClick={confirmPendingDelete}>{deleting ? "Removing…" : "Confirm Remove"}</button>
              <button className="button" type="button" disabled={deleting} onClick={() => setPendingDelete(null)}>Cancel</button>
            </div>
          ) : null}
          <div className="rates-table-wrap rates-table-wrap--tall">
            <table className="report-table accounts-record-table">
              <thead>
                <tr>
                  {isSupervisor ? <th>Action</th> : null}
                  <th>CLT ID</th><th>Teacher</th><th>Subject</th><th>Class</th><th className="col-num">₹/hr</th><th>Effective From</th><th>Status</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {tutorRates.length === 0 ? (
                  <tr><td colSpan={isSupervisor ? 9 : 8} style={{ color: "#8f82a0", fontStyle: "italic", textAlign: "center" }}>No teacher rates yet.</td></tr>
                ) : Object.entries(tutorRatesByTeacher).map(([cltId, rates]) => rates.map((r, i) => (
                  <tr key={r.id} className={i === 0 ? "rate-row-current" : ""}>
                    {isSupervisor ? (
                      <td>
                        <div className="row-actions">
                          <button className="row-edit-btn" type="button" title="Edit rate" aria-label="Edit rate" onClick={() => fillTutorForm(r)}>✏️</button>
                          <button className="row-remove-btn" type="button" title="Remove rate" aria-label="Remove rate" disabled={!canDeleteTutor} onClick={() => requestDeleteTutor(r)}>🗑</button>
                        </div>
                      </td>
                    ) : null}
                    <td className="col-muted">{r.clt_id}</td>
                    <td><strong>{r.teacher_name}</strong></td>
                    <td className="col-muted">{r.subject_name || <em style={{ color: "#bbb" }}>All</em>}</td>
                    <td className="col-muted">{r.class_type_code || <em style={{ color: "#bbb" }}>Any</em>}</td>
                    <td className="col-num">₹{Number(r.salary_per_hour).toFixed(0)}</td>
                    <td className="col-muted">{r.effective_from_str || r.effective_from}</td>
                    <td>{i === 0 ? <span className="rate-active-badge">Active</span> : <span className="rate-hist-badge">History</span>}</td>
                    <td className="col-muted">{r.notes || "-"}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enroll-subsection">
      {isSupervisor ? (
        <article className="enroll-card rates-card rates-card--fee">
          <h3>Subject Fee Card</h3>
          <p className="analytics-desc">Monthly fees charged to students per subject and class type. Effective-date aware — history is preserved.</p>
          {sMsg.text ? <div className={`accounts-feedback ${sMsg.ok ? "success" : "error"}`}>{sMsg.text}</div> : null}
          <form className="enroll-form" onSubmit={saveSubjectFee} autoComplete="off">
            <div className="enroll-section-label">Fee details</div>
            <div className="enroll-row">
              <label className="enroll-field enroll-field--wide">
                <span>Subject <em>*</em></span>
                <input className={f} list="rc-fee-subjects" value={sForm.subjectName} onChange={e => setSForm(p => ({ ...p, subjectName: e.target.value }))} placeholder="e.g. Mathematics" required />
                <datalist id="rc-fee-subjects">{subjects.map(s => <option key={s} value={s} />)}</datalist>
              </label>
              <label className="enroll-field"><span>Class Type</span><select className={f} value={sForm.classTypeCode} onChange={e => setSForm(p => ({ ...p, classTypeCode: e.target.value }))}><option value="O2O">O2O</option><option value="N2N">N2N</option><option value="">Any</option></select></label>
              <label className="enroll-field">
                <span>Sub-type</span>
                <input className={f} list="rc-fee-subtypes" value={sForm.subClassTypeCode} onChange={e => setSForm(p => ({ ...p, subClassTypeCode: e.target.value }))} placeholder="Optional" />
                <datalist id="rc-fee-subtypes">{subTypes.map(s => <option key={s} value={s} />)}</datalist>
              </label>
              <label className="enroll-field"><span>Fees/Month (₹) <em>*</em></span><input className={f} type="number" min="0" step="0.01" value={sForm.feesMonth} onChange={e => setSForm(p => ({ ...p, feesMonth: e.target.value }))} placeholder="5000" required /></label>
              <label className="enroll-field"><span>Effective From <em>*</em></span><input className={f} type="date" value={sForm.effectiveFrom || today} onChange={e => setSForm(p => ({ ...p, effectiveFrom: e.target.value }))} required /></label>
              <label className="enroll-field"><span>Notes</span><input className={f} value={sForm.notes} onChange={e => setSForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" /></label>
            </div>
            <div className="enroll-row" style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(76,62,95,0.1)" }}>
              <label className="enroll-field"><span>Your Phone</span><input className={f} value={sForm.adminIdentifier} onChange={e => { setSForm(p => ({ ...p, adminIdentifier: e.target.value })); setPendingDelete(null); }} autoComplete="username" /></label>
              <label className="enroll-field"><span>Password <em>*</em></span><input className={f} type="password" value={sForm.adminPassword} onChange={e => { setSForm(p => ({ ...p, adminPassword: e.target.value })); setPendingDelete(null); }} required autoComplete="current-password" /></label>
            </div>
            <div className="enroll-actions">
              <button className="button solid" type="submit" disabled={saving}>{saving ? "Saving…" : "Save Fee"}</button>
              <button className="button" type="button" onClick={() => setSForm(p => ({ ...EMPTY_SUBJECT_FEE, adminIdentifier: p.adminIdentifier }))}>Clear</button>
            </div>
          </form>
        </article>
      ) : null}

      <div className="enroll-history-wrap" style={{ marginTop: "1.4rem" }}>
        <p className="enroll-history-label">Subject fee history</p>
        {isSupervisor && canDeleteSubject && !pendingDelete ? (
          <p className="enroll-delete-ready">Password entered. Use the edit or remove icons, then confirm if removing.</p>
        ) : null}
        {pendingDelete?.kind === "subject" ? (
          <div className="enroll-delete-confirm">
            <p>Confirm remove fee: <strong>{pendingDelete.label}</strong></p>
            <button className="button solid" type="button" disabled={deleting} onClick={confirmPendingDelete}>{deleting ? "Removing…" : "Confirm Remove"}</button>
            <button className="button" type="button" disabled={deleting} onClick={() => setPendingDelete(null)}>Cancel</button>
          </div>
        ) : null}
        <div className="rates-table-wrap rates-table-wrap--tall">
          <table className="report-table accounts-record-table">
            <thead>
              <tr>
                {isSupervisor ? <th>Action</th> : null}
                <th>Subject</th><th>Class Type</th><th>Sub-type</th><th className="col-num">₹/month</th><th>Effective From</th><th>Status</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {subjectFees.length === 0 ? (
                <tr><td colSpan={isSupervisor ? 8 : 7} style={{ color: "#8f82a0", fontStyle: "italic", textAlign: "center" }}>No subject fees yet.</td></tr>
              ) : Object.values(subjectFeesByKey).map(rows => rows.map((r, i) => (
                <tr key={r.id} className={i === 0 ? "rate-row-current" : ""}>
                  {isSupervisor ? (
                    <td>
                      <div className="row-actions">
                        <button className="row-edit-btn" type="button" title="Edit fee" aria-label="Edit fee" onClick={() => fillSubjectForm(r)}>✏️</button>
                        <button className="row-remove-btn" type="button" title="Remove fee" aria-label="Remove fee" disabled={!canDeleteSubject} onClick={() => requestDeleteSubject(r)}>🗑</button>
                      </div>
                    </td>
                  ) : null}
                  <td><strong>{r.subject_name || "—"}</strong></td>
                  <td className="col-muted">{r.class_type_code || "—"}</td>
                  <td className="col-muted">{r.sub_class_type_code || "—"}</td>
                  <td className="col-num">₹{Number(r.fees_month).toLocaleString("en-IN")}</td>
                  <td className="col-muted">{r.effective_from_str || r.effective_from}</td>
                  <td>{i === 0 ? <span className="rate-active-badge">Active</span> : <span className="rate-hist-badge">History</span>}</td>
                  <td className="col-muted">{r.notes || "-"}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Rate Card tab ─────────────────────────────────────────────────────────────

function RateCardTab({ apiBaseUrl, isSupervisor, currentUser }) {
  const [subTab, setSubTab] = useState("teacher");
  return (
    <div className="ratecard-tab">
      <div className="enroll-subtabs">
        <button type="button" className={`enroll-subtab${subTab === "teacher" ? " active" : ""}`} onClick={() => setSubTab("teacher")}>Teacher Rate Card</button>
        <button type="button" className={`enroll-subtab${subTab === "subject" ? " active" : ""}`} onClick={() => setSubTab("subject")}>Subject Fee Card</button>
      </div>
      <RatesPanel key={subTab} apiBaseUrl={apiBaseUrl} mode={subTab} isSupervisor={isSupervisor} currentUser={currentUser} />
    </div>
  );
}

// ── Inline row editor (supervisor only) ─────────────────────────────────────

function EditEntryModal({ entry, apiBaseUrl, currentUser, onSaved, onClose }) {
  const [form, setForm] = useState({
    student_name: entry.student_name || "",
    student_id: entry.student_id || "",
    teacher_name: entry.teacher_name || "",
    clt_id: entry.clt_id || "",
    class_type_code: entry.class_type_code || "",
    sub_class_type_code: entry.sub_class_type_code || "",
    subject_name: entry.subject_name || "",
    fees_month: entry.fees_month ?? "",
    tutor_salary_paid: entry.tutor_salary_paid ?? "",
    profit: entry.profit ?? "",
    payment_date: entry.payment_date || "",
    adminIdentifier: currentUser?.phone || "",
    adminPassword: ""
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subTypes, setSubTypes] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`${apiBaseUrl}/api/accounts/roster/students`).then(r => r.json()),
      fetch(`${apiBaseUrl}/api/accounts/roster/teachers`).then(r => r.json()),
      fetch(`${apiBaseUrl}/api/accounts/roster/subjects`).then(r => r.json())
    ]).then(([s, t, sub]) => {
      if (s.ok) setStudents(s.rows);
      if (t.ok) setTeachers(t.rows);
      if (sub.ok) { setSubjects(sub.subjects || []); setSubTypes(sub.subTypes || []); }
    }).catch(() => {});
  }, [apiBaseUrl]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  // When teacher name changes, auto-fill CLT ID from roster.
  function handleTeacherChange(name) {
    const match = teachers.find(t => t.teacher_name.toLowerCase() === name.toLowerCase());
    setForm(f => ({ ...f, teacher_name: name, clt_id: match ? match.clt_id : f.clt_id }));
  }

  // When CLT ID changes, auto-fill teacher name from roster.
  function handleCltChange(cltId) {
    const match = teachers.find(t => t.clt_id.toLowerCase() === cltId.toLowerCase());
    setForm(f => ({ ...f, clt_id: cltId, teacher_name: match ? match.teacher_name : f.teacher_name }));
  }

  // When student name changes, auto-fill student ID from roster.
  function handleStudentNameChange(name) {
    const match = students.find(s => s.student_name.toLowerCase() === name.toLowerCase());
    setForm(f => ({ ...f, student_name: name, student_id: match ? match.student_id : f.student_id }));
  }

  // When student ID changes, auto-fill student name from roster.
  function handleStudentIdChange(id) {
    const match = students.find(s => s.student_id.toLowerCase() === id.toLowerCase());
    setForm(f => ({ ...f, student_id: id, student_name: match ? match.student_name : f.student_name }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setMsg("");
    try {
      const res = await fetch(`${apiBaseUrl}/api/accounts/entries/${entry.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, fees_month: form.fees_month !== "" ? Number(form.fees_month) : null, tutor_salary_paid: form.tutor_salary_paid !== "" ? Number(form.tutor_salary_paid) : null, profit: form.profit !== "" ? Number(form.profit) : null })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      onSaved();
    } catch (err) { setMsg(String(err.message)); setSaving(false); }
  }

  const f = "enroll-input";
  return (
    <div className="edit-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="edit-modal">
        <div className="edit-modal-header">
          <h3>Edit Entry — {entry.month_label}</h3>
          <button className="edit-modal-close" type="button" onClick={onClose}>✕</button>
        </div>
        {msg ? <div className="accounts-feedback error">{msg}</div> : null}
        <form onSubmit={handleSave} className="enroll-form">
          <div className="enroll-section-label">Student</div>
          <div className="enroll-row">
            <label className="enroll-field enroll-field--wide">
              <span>Student Name</span>
              <input className={f} list="edit-students" value={form.student_name} onChange={e => handleStudentNameChange(e.target.value)} />
              <datalist id="edit-students">{students.map(s => <option key={s.student_id} value={s.student_name}>{s.student_id}</option>)}</datalist>
            </label>
            <label className="enroll-field">
              <span>Student ID</span>
              <input className={f} list="edit-student-ids" value={form.student_id} onChange={e => handleStudentIdChange(e.target.value)} />
              <datalist id="edit-student-ids">{students.map(s => <option key={s.student_id} value={s.student_id}>{s.student_name}</option>)}</datalist>
            </label>
          </div>

          <div className="enroll-section-label">Teacher</div>
          <div className="enroll-row">
            <label className="enroll-field enroll-field--wide">
              <span>Teacher Name</span>
              <input className={f} list="edit-teachers" value={form.teacher_name} onChange={e => handleTeacherChange(e.target.value)} />
              <datalist id="edit-teachers">{teachers.map(t => <option key={t.clt_id} value={t.teacher_name}>{t.clt_id}</option>)}</datalist>
            </label>
            <label className="enroll-field">
              <span>CLT ID</span>
              <input className={f} list="edit-clt-ids" value={form.clt_id} onChange={e => handleCltChange(e.target.value)} />
              <datalist id="edit-clt-ids">{teachers.map(t => <option key={t.clt_id} value={t.clt_id}>{t.teacher_name}</option>)}</datalist>
            </label>
          </div>

          <div className="enroll-section-label">Class</div>
          <div className="enroll-row">
            <label className="enroll-field">
              <span>Class Type</span>
              <select className={f} value={form.class_type_code} onChange={e => set("class_type_code", e.target.value)}>
                <option value="O2O">O2O</option>
                <option value="N2N">N2N</option>
                <option value="">Other</option>
              </select>
            </label>
            <label className="enroll-field">
              <span>Sub-type</span>
              <input className={f} list="edit-subtypes" value={form.sub_class_type_code} onChange={e => set("sub_class_type_code", e.target.value)} placeholder="e.g. PIB-01" />
              <datalist id="edit-subtypes">{subTypes.map(s => <option key={s} value={s} />)}</datalist>
            </label>
            <label className="enroll-field enroll-field--wide">
              <span>Subject</span>
              <input className={f} list="edit-subjects" value={form.subject_name} onChange={e => set("subject_name", e.target.value)} />
              <datalist id="edit-subjects">{subjects.map(s => <option key={s} value={s} />)}</datalist>
            </label>
          </div>

          <div className="enroll-section-label">Financials</div>
          <div className="enroll-row">
            <label className="enroll-field"><span>Fees/Month (₹)</span><input className={f} type="number" step="0.01" value={form.fees_month} onChange={e => set("fees_month", e.target.value)} /></label>
            <label className="enroll-field"><span>Tutor Paid (₹)</span><input className={f} type="number" step="0.01" value={form.tutor_salary_paid} onChange={e => set("tutor_salary_paid", e.target.value)} /></label>
            <label className="enroll-field"><span>Profit (₹)</span><input className={f} type="number" step="0.01" value={form.profit} onChange={e => set("profit", e.target.value)} /></label>
            <label className="enroll-field"><span>Payment Date</span><input className={f} type="date" value={form.payment_date} onChange={e => set("payment_date", e.target.value)} /></label>
          </div>

          <div className="enroll-section-label">Supervisor confirmation</div>
          <div className="enroll-row">
            <label className="enroll-field"><span>Your Phone</span><input className={f} value={form.adminIdentifier} onChange={e => set("adminIdentifier", e.target.value)} /></label>
            <label className="enroll-field"><span>Password <em>*</em></span><input className={f} type="password" value={form.adminPassword} onChange={e => set("adminPassword", e.target.value)} required /></label>
          </div>
          <div className="enroll-actions">
            <button className="button solid" type="submit" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
            <button className="button" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AccountsPage({ apiBaseUrl, currentUser }) {
  const [activeTab, setActiveTab] = useState("records");
  // Default to the current calendar month so only the most relevant data is shown.
  const [monthFilter, setMonthFilter] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [jananiAccounts, setJananiAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [analytics, setAnalytics] = useState({ trends: [], topTeachers: [], subjects: [], loading: false, error: "" });
  const [reports, setReports] = useState({ pnl: [], studentLedger: [], teacherPayout: [], classTypes: [], profitShare: [], loading: false, error: "" });
  const [editEntry, setEditEntry] = useState(null);
  const [studentSort, setStudentSort] = useState({ col: "student_name", dir: "asc" });
  const [teacherSort, setTeacherSort] = useState({ col: "teacher_name", dir: "asc" });

  const isSupervisor = ["admin", "supervisor"].includes(currentUser?.role);
  const queryMonth = monthFilter ? `?month=${encodeURIComponent(monthFilter)}` : "";

  const monthOptions = useMemo(() => {
    return monthlyReport.map((item) => ({
      value: item.month_key,
      label: item.month_label
    }));
  }, [monthlyReport]);

  const selectedSummary = useMemo(() => {
    if (!monthFilter) {
      return monthlyReport[0] || null;
    }
    return monthlyReport.find((item) => item.month_key === monthFilter) || null;
  }, [monthFilter, monthlyReport]);

  const studentTotals = useMemo(() => {
    return students.reduce(
      (acc, row) => ({
        fees: acc.fees + Number(row.fees_month || 0),
        tutor: acc.tutor + Number(row.tutor_salary_paid || 0),
        profit: acc.profit + Number(row.profit || 0)
      }),
      { fees: 0, tutor: 0, profit: 0 }
    );
  }, [students]);

  const teacherTotals = useMemo(() => {
    return teachers.reduce(
      (acc, row) => ({
        rows: acc.rows + Number(row.student_rows || 0),
        tutor: acc.tutor + Number(row.tutor_salary_paid || 0),
        profit: acc.profit + Number(row.profit || 0)
      }),
      { rows: 0, tutor: 0, profit: 0 }
    );
  }, [teachers]);

  // Sorted views — numeric cols sort as numbers, text cols case-insensitively.
  const sortedStudents = useMemo(() => {
    const numCols = new Set(["fees_month", "tutor_salary_paid", "profit"]);
    return [...students].sort((a, b) => {
      const av = numCols.has(studentSort.col) ? Number(a[studentSort.col] || 0) : String(a[studentSort.col] || "").toLowerCase();
      const bv = numCols.has(studentSort.col) ? Number(b[studentSort.col] || 0) : String(b[studentSort.col] || "").toLowerCase();
      return studentSort.dir === "asc" ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
    });
  }, [students, studentSort]);

  const sortedTeachers = useMemo(() => {
    const numCols = new Set(["student_rows", "tutor_salary_paid", "profit"]);
    return [...teachers].sort((a, b) => {
      const av = numCols.has(teacherSort.col) ? Number(a[teacherSort.col] || 0) : String(a[teacherSort.col] || "").toLowerCase();
      const bv = numCols.has(teacherSort.col) ? Number(b[teacherSort.col] || 0) : String(b[teacherSort.col] || "").toLowerCase();
      return teacherSort.dir === "asc" ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
    });
  }, [teachers, teacherSort]);

  function toggleStudentSort(col) {
    setStudentSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
  }

  function toggleTeacherSort(col) {
    setTeacherSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
  }

  useEffect(() => {
    loadAccountsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFilter]);

  useEffect(() => {
    if (activeTab === "analytics") {
      loadAnalytics();
    }
    if (activeTab === "reports") {
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function loadReports() {
    setReports((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const [pnlRes, ledgerRes, payoutRes, classRes, shareRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/accounts/reports/pnl`),
        fetch(`${apiBaseUrl}/api/accounts/reports/student-ledger`),
        fetch(`${apiBaseUrl}/api/accounts/reports/teacher-payout`),
        fetch(`${apiBaseUrl}/api/accounts/reports/class-types`),
        fetch(`${apiBaseUrl}/api/accounts/reports/profit-share`)
      ]);
      const [pnlP, ledgerP, payoutP, classP, shareP] = await Promise.all([
        pnlRes.json(), ledgerRes.json(), payoutRes.json(), classRes.json(), shareRes.json()
      ]);
      if (!pnlP.ok) throw new Error(pnlP.message || "Failed to load P&L.");
      setReports({ pnl: pnlP.rows || [], studentLedger: ledgerP.rows || [], teacherPayout: payoutP.rows || [], classTypes: classP.rows || [], profitShare: shareP.rows || [], loading: false, error: "" });
    } catch (error) {
      setReports((prev) => ({ ...prev, loading: false, error: String(error.message || error) }));
    }
  }

  async function loadAnalytics() {
    setAnalytics((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const [trendsRes, teachersRes, subjectsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/accounts/analytics/trends`),
        fetch(`${apiBaseUrl}/api/accounts/analytics/top-teachers`),
        fetch(`${apiBaseUrl}/api/accounts/analytics/subjects`)
      ]);
      const [trendsPayload, teachersPayload, subjectsPayload] = await Promise.all([
        trendsRes.json(), teachersRes.json(), subjectsRes.json()
      ]);
      if (!trendsPayload.ok) throw new Error(trendsPayload.message || "Failed to load trends.");
      if (!teachersPayload.ok) throw new Error(teachersPayload.message || "Failed to load top teachers.");
      if (!subjectsPayload.ok) throw new Error(subjectsPayload.message || "Failed to load subject data.");
      setAnalytics({
        trends: trendsPayload.rows || [],
        topTeachers: teachersPayload.rows || [],
        subjects: subjectsPayload.rows || [],
        loading: false,
        error: ""
      });
    } catch (error) {
      setAnalytics((prev) => ({ ...prev, loading: false, error: String(error.message || error) }));
    }
  }

  async function loadAccountsData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const [studentsRes, teachersRes, monthlyRes, jananiRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/accounts/students${queryMonth}`),
        fetch(`${apiBaseUrl}/api/accounts/teachers${queryMonth}`),
        fetch(`${apiBaseUrl}/api/accounts/reports/monthly`),
        fetch(`${apiBaseUrl}/api/accounts/janani`)
      ]);

      const [studentsPayload, teachersPayload, monthlyPayload, jananiPayload] = await Promise.all([
        studentsRes.json(),
        teachersRes.json(),
        monthlyRes.json(),
        jananiRes.json()
      ]);

      if (!studentsRes.ok || !studentsPayload.ok) {
        throw new Error(studentsPayload.message || "Failed to load student accounts.");
      }
      if (!teachersRes.ok || !teachersPayload.ok) {
        throw new Error(teachersPayload.message || "Failed to load teacher accounts.");
      }
      if (!monthlyRes.ok || !monthlyPayload.ok) {
        throw new Error(monthlyPayload.message || "Failed to load monthly reports.");
      }

      setStudents(Array.isArray(studentsPayload.rows) ? studentsPayload.rows : []);
      setTeachers(Array.isArray(teachersPayload.rows) ? teachersPayload.rows : []);
      setMonthlyReport(Array.isArray(monthlyPayload.rows) ? monthlyPayload.rows : []);
      setJananiAccounts(Array.isArray(jananiPayload.rows) ? jananiPayload.rows : []);
    } catch (error) {
      setErrorMessage(String(error.message || error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section accounts-section accounts-page" id="accounts">
      <div className="accounts-header-row">
        <div>
          <p className="section-kicker">Accounts — logged in as <strong>{currentUser?.full_name || "User"}</strong> · <span style={{ textTransform:"capitalize" }}>{currentUser?.role || ""}</span></p>
          <h2>Student and teacher accounts — 2025 &amp; 2026.</h2>
          <p className="section-text">Month-wise totals for fees, tutor payouts, and profit.</p>
        </div>
        <div className="accounts-actions">
          {activeTab === "records" ? (
            <label className="accounts-month-filter" htmlFor="accountsMonthFilter">
              Month
              <select id="accountsMonthFilter" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
                <option value="">All months</option>
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>

      <div className="accounts-tabs">
        <button
          className={`accounts-tab${activeTab === "records" ? " active" : ""}`}
          type="button"
          onClick={() => setActiveTab("records")}
        >
          Records
        </button>
        <button
          className={`accounts-tab${activeTab === "analytics" ? " active" : ""}`}
          type="button"
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
        <button
          className={`accounts-tab${activeTab === "reports" ? " active" : ""}`}
          type="button"
          onClick={() => setActiveTab("reports")}
        >
          Reports
        </button>
        <button
          className={`accounts-tab${activeTab === "janani" ? " active" : ""}`}
          type="button"
          onClick={() => setActiveTab("janani")}
        >
          Janani Accounts
        </button>
        <button
          className={`accounts-tab${activeTab === "enroll" ? " active" : ""}`}
          type="button"
          onClick={() => setActiveTab("enroll")}
        >
          Enroll
        </button>
        <button
          className={`accounts-tab${activeTab === "ratecards" ? " active" : ""}`}
          type="button"
          onClick={() => setActiveTab("ratecards")}
        >
          Rate Cards
        </button>
      </div>

      {errorMessage ? <div className="accounts-feedback error">{errorMessage}</div> : null}

      {activeTab === "records" ? (
        <>
          <div className="accounts-summary-grid">
            <article className="accounts-summary-card">
              <span>Month</span>
              <strong>{selectedSummary?.month_label || "No data"}</strong>
            </article>
            <article className="accounts-summary-card">
              <span>Students</span>
              <strong>{selectedSummary?.student_count || 0}</strong>
            </article>
            <article className="accounts-summary-card">
              <span>Teachers</span>
              <strong>{selectedSummary?.teacher_count || 0}</strong>
            </article>
            <article className="accounts-summary-card">
              <span>Total Fees</span>
              <strong>{formatCurrency(selectedSummary?.total_fees || 0)}</strong>
            </article>
            <article className="accounts-summary-card">
              <span>Total Tutor Paid</span>
              <strong>{formatCurrency(selectedSummary?.total_tutor_salary_paid || 0)}</strong>
            </article>
            <article className="accounts-summary-card">
              <span>Total Profit</span>
              <strong>{formatCurrency(selectedSummary?.total_profit || 0)}</strong>
            </article>
          </div>

      <div className="accounts-table-grid">
        <article className="accounts-card accounts-card--students">
          <div className="accounts-card-header">
            <h3>Student Accounts</h3>
            {!loading && students.length ? <span className="accounts-count-badge">{students.length} rows</span> : null}
          </div>
          {loading ? <p>Loading student accounts...</p> : null}
          {!loading && !students.length ? <p>No student rows for selected month.</p> : null}
          {!loading && students.length ? (
            <div className="accounts-table-wrap">
              <table className="accounts-table">
                <thead>
                  <tr>
                    {!monthFilter ? <th>Month</th> : null}
                    <SortTh label="Student"      col="student_name"     sort={studentSort} onSort={toggleStudentSort} />
                    <SortTh label="Student ID"   col="student_id"       sort={studentSort} onSort={toggleStudentSort} />
                    <SortTh label="CLT ID"       col="clt_id"           sort={studentSort} onSort={toggleStudentSort} />
                    <SortTh label="Teacher"      col="teacher_name"     sort={studentSort} onSort={toggleStudentSort} />
                    <SortTh label="Fees/Month"   col="fees_month"       sort={studentSort} onSort={toggleStudentSort} num />
                    <SortTh label="Tutor Paid"   col="tutor_salary_paid" sort={studentSort} onSort={toggleStudentSort} num />
                    <SortTh label="Profit"       col="profit"           sort={studentSort} onSort={toggleStudentSort} num />
                    {isSupervisor ? <th></th> : null}
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((row, index) => (
                    <tr key={`${row.month_key}-${row.student_id || row.student_name}-${index}`}>
                      {!monthFilter ? <td>{row.month_label}</td> : null}
                      <td><strong>{row.student_name || "-"}</strong></td>
                      <td className="col-muted">{row.student_id || "-"}</td>
                      <td className="col-muted">{row.clt_id || "-"}</td>
                      <td>{row.teacher_name || "-"}</td>
                      <td className="col-num">{formatCurrency(row.fees_month)}</td>
                      <td className="col-num">{formatCurrency(row.tutor_salary_paid)}</td>
                      <td className={`col-num col-profit ${Number(row.profit) >= 0 ? "profit-pos" : "profit-neg"}`}>{formatCurrency(row.profit)}</td>
                      {isSupervisor ? (
                        <td>
                          <button className="row-edit-btn" type="button" onClick={() => setEditEntry(row)} title="Edit">✏️</button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="accounts-totals-row">
                    {!monthFilter ? <td></td> : null}
                    <td colSpan={4}><strong>Total</strong></td>
                    <td className="col-num"><strong>{formatCurrency(studentTotals.fees)}</strong></td>
                    <td className="col-num"><strong>{formatCurrency(studentTotals.tutor)}</strong></td>
                    <td className={`col-num col-profit ${studentTotals.profit >= 0 ? "profit-pos" : "profit-neg"}`}><strong>{formatCurrency(studentTotals.profit)}</strong></td>
                    {isSupervisor ? <td></td> : null}
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : null}
        </article>

        <article className="accounts-card accounts-card--teachers">
          <div className="accounts-card-header">
            <h3>Teacher Accounts</h3>
            {!loading && teachers.length ? <span className="accounts-count-badge">{teachers.length} rows</span> : null}
          </div>
          {loading ? <p>Loading teacher accounts...</p> : null}
          {!loading && !teachers.length ? <p>No teacher rows for selected month.</p> : null}
          {!loading && teachers.length ? (
            <div className="accounts-table-wrap">
              <table className="accounts-table">
                <thead>
                  <tr>
                    {!monthFilter ? <th>Month</th> : null}
                    <SortTh label="Teacher"        col="teacher_name"     sort={teacherSort} onSort={toggleTeacherSort} />
                    <SortTh label="CLT ID"         col="clt_id"           sort={teacherSort} onSort={toggleTeacherSort} />
                    <SortTh label="Student Rows"   col="student_rows"     sort={teacherSort} onSort={toggleTeacherSort} num />
                    <SortTh label="Tutor Salary Paid" col="tutor_salary_paid" sort={teacherSort} onSort={toggleTeacherSort} num />
                    <SortTh label="Profit"         col="profit"           sort={teacherSort} onSort={toggleTeacherSort} num />
                  </tr>
                </thead>
                <tbody>
                  {sortedTeachers.map((row, index) => (
                    <tr key={`${row.month_key}-${row.teacher_name}-${index}`}>
                      {!monthFilter ? <td>{row.month_label}</td> : null}
                      <td><strong>{row.teacher_name || "-"}</strong></td>
                      <td className="col-muted">{row.clt_id || "-"}</td>
                      <td className="col-num">{row.student_rows || 0}</td>
                      <td className="col-num">{formatCurrency(row.tutor_salary_paid)}</td>
                      <td className={`col-num col-profit ${Number(row.profit) >= 0 ? "profit-pos" : "profit-neg"}`}>{formatCurrency(row.profit)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="accounts-totals-row">
                    {!monthFilter ? <td></td> : null}
                    <td colSpan={2}><strong>Total</strong></td>
                    <td className="col-num"><strong>{teacherTotals.rows}</strong></td>
                    <td className="col-num"><strong>{formatCurrency(teacherTotals.tutor)}</strong></td>
                    <td className={`col-num col-profit ${teacherTotals.profit >= 0 ? "profit-pos" : "profit-neg"}`}><strong>{formatCurrency(teacherTotals.profit)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : null}
        </article>
      </div>
        </>
      ) : null}

      {activeTab === "analytics" ? (
        <div className="analytics-panel">
          {analytics.error ? <div className="accounts-feedback error">{analytics.error}</div> : null}
          {analytics.loading ? <p>Loading analytics...</p> : null}

          {!analytics.loading && !analytics.error ? (
            <>
              <article className="analytics-card">
                <h3>Monthly Trends</h3>
                <p className="analytics-desc">Fees collected, tutor payouts, and profit across all months.</p>
                {analytics.trends.length === 0 ? <p>No trend data available.</p> : (() => {
                  const maxFees = Math.max(...analytics.trends.map((r) => Number(r.total_fees || 0)));
                  return (
                    <div className="trend-list">
                      {analytics.trends.map((row) => (
                        <GroupedMonthBar key={row.month_key} row={row} maxFees={maxFees} />
                      ))}
                    </div>
                  );
                })()}
              </article>

              <div className="analytics-two-col">
                <article className="analytics-card analytics-card--teachers">
                  <h3>Top Teachers</h3>
                  <p className="analytics-desc">Ranked by total student rows across all months.</p>
                  {analytics.topTeachers.length === 0 ? <p>No teacher data available.</p> : (() => {
                    const maxRows = Math.max(...analytics.topTeachers.map((r) => Number(r.student_rows || 0)));
                    return (
                      <div className="hbar-list">
                        {analytics.topTeachers.map((row) => (
                          <HBar
                            key={row.teacher_name}
                            label={row.teacher_name || "-"}
                            sublabel={row.clt_id ? `CLT ${row.clt_id} · ${row.months_active} mo` : `${row.months_active} mo`}
                            value={Number(row.student_rows || 0)}
                            maxValue={maxRows}
                            displayValue={`${row.student_rows} students`}
                            color="#e07040"
                          />
                        ))}
                      </div>
                    );
                  })()}
                </article>

                <article className="analytics-card analytics-card--subjects">
                  <h3>Revenue by Subject</h3>
                  <p className="analytics-desc">Total fees collected per subject.</p>
                  {analytics.subjects.length === 0 ? <p>No subject data available.</p> : (() => {
                    const maxFees = Math.max(...analytics.subjects.map((r) => Number(r.total_fees || 0)));
                    return (
                      <div className="hbar-list">
                        {analytics.subjects.map((row) => (
                          <HBar
                            key={row.subject}
                            label={row.subject}
                            sublabel={`${row.student_rows} rows`}
                            value={Number(row.total_fees || 0)}
                            maxValue={maxFees}
                            displayValue={formatCurrencyShort(row.total_fees)}
                            color="#4a90d9"
                          />
                        ))}
                      </div>
                    );
                  })()}
                </article>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {activeTab === "reports" ? (
        <ReportsPanel reports={reports} formatCurrency={formatCurrency} />
      ) : null}

      {activeTab === "janani" ? (
        <JananiAccountsPanel rows={jananiAccounts} formatCurrency={formatCurrency} />
      ) : null}

      {activeTab === "enroll" ? (
        <EnrollPanel apiBaseUrl={apiBaseUrl} isSupervisor={isSupervisor} onSaved={loadAccountsData} currentUser={currentUser} />
      ) : null}

      {activeTab === "ratecards" ? (
        <RateCardTab apiBaseUrl={apiBaseUrl} isSupervisor={isSupervisor} currentUser={currentUser} />
      ) : null}

      {editEntry ? (
        <EditEntryModal
          entry={editEntry}
          apiBaseUrl={apiBaseUrl}
          currentUser={currentUser}
          onClose={() => setEditEntry(null)}
          onSaved={() => { setEditEntry(null); loadAccountsData(); }}
        />
      ) : null}
    </section>
  );
}
