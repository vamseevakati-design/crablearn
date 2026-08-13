import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  authenticateStudent,
  closeDb,
  createApprovalNotification,
  createStudent,
  ensurePrivilegedAccounts,
  getDb,
  listApprovalNotifications,
  listStudents,
  query,
  resetStudentPassword,
  updateStudentStatus,
  unlockStudent
} from "./db.js";
import {
  closeAccountsDb,
  createAccountEntry,
  deleteAccountEntry,
  deleteSubjectFee,
  deleteTutorRate,
  deleteTutorRatesByCltId,
  ensureAccountsSchema,
  ensureRatesSchema,
  getAnalyticsSubjects,
  getAnalyticsTopTeachers,
  getAnalyticsTrends,
  getMonthlyAccountReports,
  getReportClassTypes,
  getReportPnL,
  getReportProfitShare,
  getReportStudentLedger,
  getReportTeacherPayout,
  getRosterStudents,
  getRosterSubjects,
  getRosterTeachers,
  getSubjectFees,
  getTutorRates,
  importWorkbookToAccounts,
  listStudentAccounts,
  listTeacherAccounts,
  lookupRates,
  updateAccountEntry,
  upsertSubjectFee,
  upsertTutorRate
} from "./accountsDb.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");
const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

const APPROVAL_CONTACTS = {
  admin: {
    role: "admin",
    phone: "+919787001217",
    email: "padmaja.vamsee@gmail.com"
  },
  supervisor: {
    role: "supervisor",
    phone: "+919873762244",
    email: "vrvamsee@gmail.com"
  }
};

function getApprovalContacts() {
  return APPROVAL_CONTACTS;
}

function queueApprovalNotification(student, reviewer = null) {
  const contacts = getApprovalContacts();
  const notification = createApprovalNotification({
    student,
    reviewer,
    targets: contacts
  });

  console.log(
    `[approval-notification] ${student.full_name} (${student.phone}) role=${student.role} status=${student.status} -> admin ${contacts.admin.phone}/${contacts.admin.email}, supervisor ${contacts.supervisor.phone}/${contacts.supervisor.email}`
  );

  return {
    notification,
    contacts
  };
}

function isPrivilegedRole(role) {
  return role === "admin" || role === "supervisor";
}

function isAllowedRoleForLogin(requestedRole, actualRole) {
  if (!requestedRole) {
    return true;
  }

  const normalizedRequested = String(requestedRole).trim().toLowerCase();
  const normalizedActual = String(actualRole || "").trim().toLowerCase();

  if (!normalizedRequested) {
    return true;
  }

  if (normalizedRequested === "student") {
    return ["student", "admin", "supervisor"].includes(normalizedActual);
  }

  if (normalizedRequested === "teacher") {
    return normalizedActual === "teacher";
  }

  if (normalizedRequested === "engineer") {
    return normalizedActual === "engineer";
  }

  if (normalizedRequested === "accounts") {
    return ["accounts", "admin", "supervisor"].includes(normalizedActual);
  }

  return normalizedRequested === normalizedActual;
}

function sanitizeStudent(student) {
  if (!student) {
    return null;
  }

  return {
    id: student.id,
    full_name: student.full_name,
    phone: student.phone,
    email: student.email,
    status: student.status,
    role: student.role,
    created_at: student.created_at
  };
}

function requirePrivilegedActor(req, res) {
  const { adminIdentifier, adminPassword } = req.body ?? {};

  if (!adminIdentifier || !adminPassword) {
    res.status(400).json({
      ok: false,
      message: "adminIdentifier and adminPassword are required."
    });
    return null;
  }

  const actor = authenticateStudent(adminIdentifier, adminPassword);
  if (!actor) {
    res.status(401).json({ ok: false, message: "Invalid admin credentials." });
    return null;
  }

  if (!isPrivilegedRole(actor.role)) {
    res.status(403).json({ ok: false, message: "Only admin or supervisor can perform this action." });
    return null;
  }

  if (actor.status !== "approved") {
    res.status(403).json({ ok: false, message: "Privileged account is not approved." });
    return null;
  }

  return actor;
}

async function ensureSchema() {
  await getDb(); // Load data from file first
  ensurePrivilegedAccounts();

  query(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'approved',
      role TEXT NOT NULL DEFAULT 'student',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  query(`
    CREATE TABLE IF NOT EXISTS callback_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_name TEXT NOT NULL,
      parent_phone TEXT NOT NULL,
      program TEXT NOT NULL,
      message TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    query(
      `INSERT INTO students (full_name, phone, password, status)
       VALUES (?, ?, ?, ?)`,
      ["Tanisha", "9871587344", "demo-password", "approved"]
    );
  } catch (error) {
    // Student already exists, that's fine
  }

  try {
    query(
      `INSERT INTO students (full_name, phone, password, status, role)
       VALUES (?, ?, ?, ?, ?)`,
      ["Admin User", "+919787001217", "admin@123", "approved", "admin"]
    );
  } catch (error) {
    // Admin already exists, that's fine
  }

  try {
    query(
      `INSERT INTO students (full_name, phone, password, status, role)
       VALUES (?, ?, ?, ?, ?)`,
      ["supervisor", "+919873762244", "Paddu@0629", "approved", "supervisor"]
    );
  } catch (error) {
    // Supervisor already exists, that's fine
  }
}

app.get("/api/health", (_req, res) => {
  try {
    const result = query("SELECT CURRENT_TIMESTAMP AS server_time");
    res.json({ ok: true, serverTime: result.rows[0]?.server_time || new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Database connection failed." });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { phone, password, role } = req.body ?? {};
  const identifier = String(phone || "").trim();

  if (!identifier || !password) {
    return res.status(400).json({ ok: false, message: "Username/phone and password are required." });
  }

  try {
    console.log("Login attempt with identifier:", identifier);
    const student = authenticateStudent(identifier, String(password));

    if (!student) {
      return res.status(401).json({ ok: false, message: "Invalid login credentials." });
    }

    if (!isAllowedRoleForLogin(role, student.role)) {
      return res.status(403).json({
        ok: false,
        message: `This account is not allowed for ${String(role || "selected")} login.`
      });
    }

    if (student.status !== "approved") {
      if (student.status === "denied") {
        return res.status(403).json({ ok: false, message: "Your access request was denied. Contact admin or supervisor for review." });
      }

      return res.status(403).json({
        ok: false,
        message: `Your account is awaiting approval from admin or supervisor. Admin: ${APPROVAL_CONTACTS.admin.phone} / ${APPROVAL_CONTACTS.admin.email}. Supervisor: ${APPROVAL_CONTACTS.supervisor.phone} / ${APPROVAL_CONTACTS.supervisor.email}.`
      });
    }

    return res.json({
      ok: true,
      message: `Welcome back, ${student.full_name}.`,
      student: sanitizeStudent(student)
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ ok: false, message: "Login failed. Please try again." });
  }
});

app.post("/api/auth/register", (req, res) => {
  const { fullName, phone, password, role } = req.body ?? {};

  if (!fullName || !phone || !password) {
    return res.status(400).json({ ok: false, message: "fullName, phone, and password are required." });
  }

  try {
    const normalizedRole = String(role || "student").trim().toLowerCase();
    const allowedRole = ["student", "teacher", "engineer"].includes(normalizedRole) ? normalizedRole : "student";
    const created = createStudent({
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      password: String(password),
      role: allowedRole,
      status: "pending"
    });
    const { contacts } = queueApprovalNotification(created);

    return res.status(201).json({
      ok: true,
      message: `Account request created for ${created.full_name}. Approval notices sent to admin ${contacts.admin.phone} / ${contacts.admin.email} and supervisor ${contacts.supervisor.phone} / ${contacts.supervisor.email}.`,
      student: sanitizeStudent(created)
    });
  } catch (error) {
    if (String(error.message).includes("UNIQUE constraint failed")) {
      return res.status(409).json({ ok: false, message: "A user with this phone already exists." });
    }
    if (String(error.message) === "MISSING_REQUIRED_FIELDS") {
      return res.status(400).json({ ok: false, message: "fullName, phone, and password are required." });
    }
    return res.status(500).json({ ok: false, message: "Could not create account." });
  }
});

app.post("/api/admin/users", (req, res) => {
  const actor = requirePrivilegedActor(req, res);
  if (!actor) {
    return;
  }

  const { fullName, phone, password, role = "student", status = "approved" } = req.body ?? {};

  if (!fullName || !phone || !password) {
    return res.status(400).json({ ok: false, message: "fullName, phone, and password are required." });
  }

  try {
    const created = createStudent({ fullName, phone, password, role, status });
    return res.status(201).json({
      ok: true,
      message: `${created.full_name} has been created by ${actor.full_name}.`,
      student: sanitizeStudent(created)
    });
  } catch (error) {
    if (String(error.message).includes("UNIQUE constraint failed")) {
      return res.status(409).json({ ok: false, message: "A user with this phone already exists." });
    }
    if (String(error.message) === "MISSING_REQUIRED_FIELDS") {
      return res.status(400).json({ ok: false, message: "fullName, phone, and password are required." });
    }
    return res.status(500).json({ ok: false, message: "Failed to create user." });
  }
});

app.post("/api/admin/users/list", (req, res) => {
  const actor = requirePrivilegedActor(req, res);
  if (!actor) {
    return;
  }

  const users = listStudents().map((student) => sanitizeStudent(student));
  return res.json({
    ok: true,
    message: `User list generated by ${actor.full_name}.`,
    users,
    approvalContacts: getApprovalContacts(),
    notifications: listApprovalNotifications()
  });
});

app.post("/api/admin/users/:phone/approve", (req, res) => {
  const actor = requirePrivilegedActor(req, res);
  if (!actor) {
    return;
  }

  const targetPhone = String(req.params.phone || "").trim();
  if (!targetPhone) {
    return res.status(400).json({ ok: false, message: "Target phone is required." });
  }

  const updated = updateStudentStatus(targetPhone, "approved", actor.full_name);
  if (!updated) {
    return res.status(404).json({ ok: false, message: "User not found." });
  }

  return res.json({
    ok: true,
    message: `${updated.full_name} has been approved by ${actor.full_name}.`,
    student: sanitizeStudent(updated)
  });
});

app.post("/api/admin/users/:phone/unlock", (req, res) => {
  const actor = requirePrivilegedActor(req, res);
  if (!actor) {
    return;
  }

  const targetPhone = String(req.params.phone || "").trim();
  if (!targetPhone) {
    return res.status(400).json({ ok: false, message: "Target phone is required." });
  }

  const updated = unlockStudent(targetPhone);
  if (!updated) {
    return res.status(404).json({ ok: false, message: "User not found." });
  }

  return res.json({
    ok: true,
    message: `${updated.full_name} has been unlocked by ${actor.full_name}.`,
    student: sanitizeStudent(updated)
  });
});

app.post("/api/admin/users/:phone/deny", (req, res) => {
  const actor = requirePrivilegedActor(req, res);
  if (!actor) {
    return;
  }

  const targetPhone = String(req.params.phone || "").trim();
  if (!targetPhone) {
    return res.status(400).json({ ok: false, message: "Target phone is required." });
  }

  const updated = updateStudentStatus(targetPhone, "denied", actor.full_name);
  if (!updated) {
    return res.status(404).json({ ok: false, message: "User not found." });
  }

  return res.json({
    ok: true,
    message: `${updated.full_name} has been denied by ${actor.full_name}.`,
    student: sanitizeStudent(updated)
  });
});

app.post("/api/admin/users/:phone/reset-password", (req, res) => {
  const actor = requirePrivilegedActor(req, res);
  if (!actor) {
    return;
  }

  const targetPhone = String(req.params.phone || "").trim();
  const { newPassword } = req.body ?? {};

  if (!targetPhone || !newPassword) {
    return res.status(400).json({ ok: false, message: "Target phone and newPassword are required." });
  }

  try {
    const updated = resetStudentPassword(targetPhone, String(newPassword));
    if (!updated) {
      return res.status(404).json({ ok: false, message: "User not found." });
    }

    return res.json({
      ok: true,
      message: `${updated.full_name}'s password has been reset by ${actor.full_name}.`,
      student: sanitizeStudent(updated)
    });
  } catch (error) {
    if (String(error.message) === "PASSWORD_REQUIRED") {
      return res.status(400).json({ ok: false, message: "newPassword is required." });
    }
    return res.status(500).json({ ok: false, message: "Failed to reset password." });
  }
});

app.post("/api/callback-requests", (req, res) => {
  console.log("Callback endpoint hit with body:", req.body);
  const { parentName, parentPhone, program, message } = req.body ?? {};

  if (!parentName || !parentPhone || !program) {
    console.log("Missing required fields");
    return res.status(400).json({ ok: false, message: "Parent name, phone, and program are required." });
  }

  try {
    console.log("Calling query with callback insert");
    const insert = query(
      `INSERT INTO callback_requests (parent_name, parent_phone, program, message)
       VALUES (?, ?, ?, ?)`,
      [
        String(parentName).trim(),
        String(parentPhone).trim(),
        String(program).trim(),
        message ? String(message).trim() : null
      ]
    );

    console.log("Query returned:", insert);
    return res.status(201).json({
      ok: true,
      message: `${parentName}, your callback request for ${program} has been saved.`,
      request: insert.rows[0]
    });
  } catch (error) {
    console.error("Callback error:", error.message);
    return res.status(500).json({ ok: false, message: "Could not save callback request." });
  }
});

app.post("/api/accounts/import", async (req, res) => {
  const { workbookPath, skipSheets } = req.body ?? {};

  try {
    const result = await importWorkbookToAccounts(workbookPath, { skipSheets: skipSheets || [] });
    return res.status(201).json({
      ok: true,
      message: `Imported ${result.rowsImported} rows from accounts workbook.`,
      import: result
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: `Accounts import failed: ${String(error.message || error)}`
    });
  }
});

app.get("/api/accounts/students", async (req, res) => {
  const month = String(req.query.month || "").trim() || null;
  try {
    const rows = await listStudentAccounts(month);
    return res.json({ ok: true, rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: `Could not load student accounts: ${String(error.message || error)}` });
  }
});

app.get("/api/accounts/teachers", async (req, res) => {
  const month = String(req.query.month || "").trim() || null;
  try {
    const rows = await listTeacherAccounts(month);
    return res.json({ ok: true, rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: `Could not load teacher accounts: ${String(error.message || error)}` });
  }
});

app.get("/api/accounts/reports/monthly", async (_req, res) => {
  try {
    const rows = await getMonthlyAccountReports();
    return res.json({ ok: true, rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: `Could not load monthly account reports: ${String(error.message || error)}` });
  }
});

app.get("/api/accounts/analytics/trends", async (_req, res) => {
  try {
    const rows = await getAnalyticsTrends();
    return res.json({ ok: true, rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: `Could not load analytics trends: ${String(error.message || error)}` });
  }
});

app.get("/api/accounts/analytics/top-teachers", async (_req, res) => {
  try {
    const rows = await getAnalyticsTopTeachers();
    return res.json({ ok: true, rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: `Could not load top teachers: ${String(error.message || error)}` });
  }
});

app.get("/api/accounts/analytics/subjects", async (_req, res) => {
  try {
    const rows = await getAnalyticsSubjects();
    return res.json({ ok: true, rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: `Could not load subject analytics: ${String(error.message || error)}` });
  }
});

app.get("/api/accounts/reports/pnl", async (_req, res) => {
  try {
    const rows = await getReportPnL();
    return res.json({ ok: true, rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: `Could not load P&L report: ${String(error.message || error)}` });
  }
});

app.get("/api/accounts/reports/student-ledger", async (_req, res) => {
  try {
    const rows = await getReportStudentLedger();
    return res.json({ ok: true, rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: `Could not load student ledger: ${String(error.message || error)}` });
  }
});

app.get("/api/accounts/reports/teacher-payout", async (_req, res) => {
  try {
    const rows = await getReportTeacherPayout();
    return res.json({ ok: true, rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: `Could not load teacher payout report: ${String(error.message || error)}` });
  }
});

app.get("/api/accounts/reports/class-types", async (_req, res) => {
  try {
    const rows = await getReportClassTypes();
    return res.json({ ok: true, rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: `Could not load class type report: ${String(error.message || error)}` });
  }
});

app.get("/api/accounts/reports/profit-share", async (_req, res) => {
  try {
    const rows = await getReportProfitShare();
    return res.json({ ok: true, rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: `Could not load profit share report: ${String(error.message || error)}` });
  }
});

app.get("/api/accounts/roster/students", async (_req, res) => {
  try {
    const rows = await getRosterStudents();
    return res.json({ ok: true, rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: String(error.message || error) });
  }
});

app.get("/api/accounts/roster/teachers", async (_req, res) => {
  try {
    const rows = await getRosterTeachers();
    return res.json({ ok: true, rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: String(error.message || error) });
  }
});

app.get("/api/accounts/roster/subjects", async (_req, res) => {
  try {
    const data = await getRosterSubjects();
    return res.json({ ok: true, ...data });
  } catch (error) {
    return res.status(500).json({ ok: false, message: String(error.message || error) });
  }
});

app.post("/api/accounts/entries", async (req, res) => {
  try {
    const row = await createAccountEntry(req.body ?? {});
    return res.status(201).json({ ok: true, message: "Entry created.", entry: row });
  } catch (error) {
    return res.status(400).json({ ok: false, message: String(error.message || error) });
  }
});

app.patch("/api/accounts/entries/:id", async (req, res) => {
  const actor = requirePrivilegedActor(req, res);
  if (!actor) return;
  try {
    const row = await updateAccountEntry(Number(req.params.id), req.body ?? {});
    return res.json({ ok: true, message: `Entry updated by ${actor.full_name}.`, entry: row });
  } catch (error) {
    return res.status(400).json({ ok: false, message: String(error.message || error) });
  }
});

app.delete("/api/accounts/entries/:id", async (req, res) => {
  const actor = requirePrivilegedActor(req, res);
  if (!actor) return;
  try {
    await deleteAccountEntry(Number(req.params.id));
    return res.json({ ok: true, message: `Entry deleted by ${actor.full_name}.` });
  } catch (error) {
    return res.status(400).json({ ok: false, message: String(error.message || error) });
  }
});

// ── Rate configuration routes ──────────────────────────────────────────────────

app.get("/api/accounts/rates", async (_req, res) => {
  try {
    const [tutorRates, subjectFees] = await Promise.all([getTutorRates(), getSubjectFees()]);
    return res.json({ ok: true, tutorRates, subjectFees });
  } catch (error) {
    return res.status(500).json({ ok: false, message: String(error.message || error) });
  }
});

app.get("/api/accounts/rates/lookup", async (req, res) => {
  try {
    const { cltId, classTypeCode, subClassTypeCode, subjectName, forDate } = req.query;
    const result = await lookupRates({ cltId, classTypeCode, subClassTypeCode, subjectName, forDate });
    return res.json({ ok: true, ...result });
  } catch (error) {
    return res.status(500).json({ ok: false, message: String(error.message || error) });
  }
});

app.post("/api/accounts/rates/tutors", async (req, res) => {
  const actor = requirePrivilegedActor(req, res);
  if (!actor) return;
  try {
    const row = await upsertTutorRate(req.body ?? {});
    return res.json({ ok: true, message: `Tutor rate saved by ${actor.full_name}.`, row });
  } catch (error) {
    return res.status(400).json({ ok: false, message: String(error.message || error) });
  }
});

app.delete("/api/accounts/rates/tutors/by-clt/:cltId", async (req, res) => {
  const actor = requirePrivilegedActor(req, res);
  if (!actor) return;
  try {
    const result = await deleteTutorRatesByCltId(req.params.cltId);
    return res.json({
      ok: true,
      message: `Removed teacher ${result.cltId} (${result.deleted} rate${result.deleted === 1 ? "" : "s"}) by ${actor.full_name}.`,
      ...result
    });
  } catch (error) {
    return res.status(400).json({ ok: false, message: String(error.message || error) });
  }
});

app.delete("/api/accounts/rates/tutors/:id", async (req, res) => {
  const actor = requirePrivilegedActor(req, res);
  if (!actor) return;
  try {
    await deleteTutorRate(Number(req.params.id));
    return res.json({ ok: true, message: `Tutor rate deleted by ${actor.full_name}.` });
  } catch (error) {
    return res.status(400).json({ ok: false, message: String(error.message || error) });
  }
});

app.post("/api/accounts/rates/subjects", async (req, res) => {
  const actor = requirePrivilegedActor(req, res);
  if (!actor) return;
  try {
    const row = await upsertSubjectFee(req.body ?? {});
    return res.json({ ok: true, message: `Subject fee saved by ${actor.full_name}.`, row });
  } catch (error) {
    return res.status(400).json({ ok: false, message: String(error.message || error) });
  }
});

app.delete("/api/accounts/rates/subjects/:id", async (req, res) => {
  const actor = requirePrivilegedActor(req, res);
  if (!actor) return;
  try {
    await deleteSubjectFee(Number(req.params.id));
    return res.json({ ok: true, message: `Subject fee deleted by ${actor.full_name}.` });
  } catch (error) {
    return res.status(400).json({ ok: false, message: String(error.message || error) });
  }
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

function start() {
  (async () => {
    try {
      await ensureSchema();
      try {
        await ensureAccountsSchema();
      } catch (accountsError) {
        console.warn("Accounts schema initialization skipped:", accountsError.message);
      }
      try {
        await ensureRatesSchema();
      } catch (ratesError) {
        console.warn("Rates schema initialization skipped:", ratesError.message);
      }
      app.listen(port, () => {
        console.log(`crablearn listening on http://localhost:${port}`);
        if (fs.existsSync(distPath)) {
          console.log(`Serving frontend from: ${distPath}`);
        }
        console.log(`Data store: crablearn-data.json (JSON fallback) / Postgres when configured`);
      });
    } catch (error) {
      console.error("Failed to start API:", error.message);
      closeDb();
      closeAccountsDb();
      process.exit(1);
    }
  })();
}

start();
