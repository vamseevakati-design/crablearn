import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../crablearn-data.json");

let data = {
  students: [
    {
      id: 1,
      full_name: "Tanisha",
      phone: "8004994769",
      password: "demo-password",
      status: "approved",
      role: "student",
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      full_name: "Admin User",
      phone: "9000000000",
      password: "admin@123",
      status: "approved",
      role: "admin",
      created_at: new Date().toISOString()
    }
  ],
  callback_requests: [],
  nextId: 3
};

// Load existing data on startup
function loadData() {
  if (fs.existsSync(dbPath)) {
    try {
      const fileContent = fs.readFileSync(dbPath, "utf-8");
      data = JSON.parse(fileContent);
    } catch (error) {
      console.error("Failed to load data:", error.message);
    }
  } else {
    saveData();
  }
}

function saveData() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save data:", error.message);
  }
}

export function query(sql, params = []) {
  try {
    const sqlUpper = sql.trim().toUpperCase();

    // CREATE TABLE - no-op since we use JSON
    if (sqlUpper.startsWith("CREATE TABLE")) {
      return { rows: [], rowCount: 0 };
    }

    // INSERT INTO callback_requests
    if (sqlUpper.startsWith("INSERT INTO CALLBACK_REQUESTS")) {
      const newRequest = {
        id: data.nextId++,
        parent_name: params[0],
        parent_phone: params[1],
        program: params[2],
        message: params[3] || null,
        created_at: new Date().toISOString()
      };
      data.callback_requests.push(newRequest);
      saveData();
      return {
        rows: [{ id: newRequest.id, created_at: newRequest.created_at }],
        rowCount: 1
      };
    }

    // INSERT INTO students
    if (sqlUpper.startsWith("INSERT INTO STUDENTS")) {
      try {
        const existing = data.students.find((s) => s.phone === params[1]);
        if (existing) {
          throw new Error("UNIQUE constraint failed: students.phone");
        }
        const newStudent = {
          id: data.nextId++,
          full_name: params[0],
          phone: params[1],
          password: params[2],
          status: params[3] || "approved",
          role: params[4] || "student",
          created_at: new Date().toISOString()
        };
        data.students.push(newStudent);
        saveData();
        return {
          rows: [{ id: newStudent.id, created_at: newStudent.created_at }],
          rowCount: 1
        };
      } catch (error) {
        throw error;
      }
    }

    // SELECT FROM students
    if (sqlUpper.includes("SELECT") && sqlUpper.includes("FROM STUDENTS")) {
      if (sqlUpper.includes("WHERE PHONE")) {
        const phone = params[0];
        const password = params[1];
        const student = data.students.find(
          (s) => s.phone === phone && s.password === password
        );
        return {
          rows: student ? [student] : [],
          rowCount: student ? 1 : 0
        };
      }
      return { rows: data.students, rowCount: data.students.length };
    }

    // SELECT FROM callback_requests
    if (sqlUpper.includes("SELECT") && sqlUpper.includes("FROM CALLBACK_REQUESTS")) {
      return { rows: data.callback_requests, rowCount: data.callback_requests.length };
    }

    // SELECT CURRENT_TIMESTAMP
    if (sqlUpper.includes("CURRENT_TIMESTAMP")) {
      return {
        rows: [{ server_time: new Date().toISOString() }],
        rowCount: 1
      };
    }

    return { rows: [], rowCount: 0 };
  } catch (error) {
    console.error("Database query error:", error.message);
    throw error;
  }
}

export async function getDb() {
  loadData();
  return true;
}

export function closeDb() {
  saveData();
}
