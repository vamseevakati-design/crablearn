import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { getDb, query, closeDb } from "./db.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

async function ensureSchema() {
  await getDb(); // Load data from file first

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
      ["Tanisha", "8004994769", "demo-password", "approved"]
    );
  } catch (error) {
    // Student already exists, that's fine
  }

  try {
    query(
      `INSERT INTO students (full_name, phone, password, status, role)
       VALUES (?, ?, ?, ?, ?)`,
      ["Admin User", "9000000000", "admin@123", "approved", "admin"]
    );
  } catch (error) {
    // Admin already exists, that's fine
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
  const { phone, password } = req.body ?? {};

  if (!phone || !password) {
    return res.status(400).json({ ok: false, message: "Phone and password are required." });
  }

  try {
    console.log("Login attempt with phone:", phone, "password:", password);
    const result = query(
      `SELECT id, full_name, phone, status, role
       FROM students
       WHERE phone = ? AND password = ?
       LIMIT 1`,
      [String(phone).trim(), String(password)]
    );

    console.log("Query result:", result);

    if (result.rowCount === 0) {
      return res.status(401).json({ ok: false, message: "Invalid login credentials." });
    }

    const student = result.rows[0];
    if (student.status !== "approved") {
      return res.status(403).json({ ok: false, message: "Student is not yet approved." });
    }

    return res.json({
      ok: true,
      message: `Welcome back, ${student.full_name}.`,
      student
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ ok: false, message: "Login failed. Please try again." });
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

function start() {
  (async () => {
    try {
      await ensureSchema();
      app.listen(port, () => {
        console.log(`crablearn API listening on http://localhost:${port}`);
        console.log(`Data stored in: crablearn-data.json`);
      });
    } catch (error) {
      console.error("Failed to start API:", error.message);
      closeDb();
      process.exit(1);
    }
  })();
}

start();
