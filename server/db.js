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
      phone: "9871587344",
      password: "demo-password",
      status: "approved",
      role: "student",
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      full_name: "Padmaja Vakati",
      phone: "9787001217",
      password: "Get2work",
      status: "approved",
      role: "teacher",
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      full_name: "Admin User",
      phone: "+919787001217",
      email: "padmaja.vamsee@gmail.com",
      password: "admin@123",
      status: "approved",
      role: "admin",
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      full_name: "supervisor",
      phone: "+919873762244",
      email: "vrvamsee@gmail.com",
      password: "Paddu@0629",
      status: "approved",
      role: "supervisor",
      created_at: new Date().toISOString()
    }
  ],
  callback_requests: [],
  approval_notifications: [],
  assignments: [
    {
      id: 5,
      student_id: 1,
      teacher_id: 2,
      mapped_by: "supervisor",
      created_at: new Date().toISOString()
    }
  ],
  nextId: 6
};

function normalizeDataShape() {
  if (!Array.isArray(data.students)) {
    data.students = [];
  }

  if (!Array.isArray(data.callback_requests)) {
    data.callback_requests = [];
  }

  if (!Array.isArray(data.approval_notifications)) {
    data.approval_notifications = [];
  }

  if (!Array.isArray(data.assignments)) {
    data.assignments = [];
  }

  if (!Number.isFinite(Number(data.nextId))) {
    data.nextId = data.students.length + data.callback_requests.length + data.approval_notifications.length + data.assignments.length + 1;
  }

  data.students = data.students.map((student) => ({
    ...student,
    email: student.email || null
  }));
}

function syncPrivilegedAccount({ role, fullName, phone, email, password }) {
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (!normalizedRole) {
    return null;
  }

  const existingByRole = data.students.find((student) => String(student.role || "").trim().toLowerCase() === normalizedRole);
  const existingByPhone = data.students.find((student) => String(student.phone || "").trim() === String(phone || "").trim());
  const target = existingByRole || existingByPhone;

  if (target) {
    const nextEmail = email ? String(email).trim() : null;
    const hasChanges =
      target.full_name !== fullName ||
      target.phone !== phone ||
      (target.email || null) !== nextEmail ||
      target.password !== password ||
      target.status !== "approved" ||
      target.role !== normalizedRole;

    if (hasChanges) {
      target.full_name = fullName;
      target.phone = phone;
      target.email = nextEmail;
      target.password = password;
      target.status = "approved";
      target.role = normalizedRole;
      target.updated_at = new Date().toISOString();
      saveData();
    }

    return target;
  }

  const student = {
    id: data.nextId++,
    full_name: String(fullName || "").trim(),
    phone: String(phone || "").trim(),
    email: email ? String(email).trim() : null,
    password: String(password || ""),
    status: "approved",
    role: normalizedRole,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  data.students.push(student);
  saveData();
  return student;
}

// Load existing data on startup
function loadData() {
  if (fs.existsSync(dbPath)) {
    try {
      const fileContent = fs.readFileSync(dbPath, "utf-8");
      data = JSON.parse(fileContent);
      normalizeDataShape();
    } catch (error) {
      console.error("Failed to load data:", error.message);
    }
  } else {
    normalizeDataShape();
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

export function authenticateStudent(identifier, password) {
  const normalizedIdentifier = String(identifier || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");

  if (!normalizedIdentifier || !normalizedPassword) {
    return null;
  }

  return (
    data.students.find((student) => {
      const phoneMatch = String(student.phone || "") === normalizedIdentifier;
      const nameMatch = String(student.full_name || "").trim().toLowerCase() === normalizedIdentifier;
      const emailMatch = String(student.email || "").trim().toLowerCase() === normalizedIdentifier;
      return (phoneMatch || nameMatch || emailMatch) && String(student.password) === normalizedPassword;
    }) || null
  );
}

export function listStudents() {
  return data.students;
}

export function toPublicUser(user) {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    full_name: user.full_name,
    phone: user.phone,
    email: user.email || null,
    status: user.status,
    role: user.role,
    created_at: user.created_at
  };
}

function findUserById(id) {
  const numericId = Number(id);
  return data.students.find((item) => Number(item.id) === numericId) || null;
}

function hydrateAssignment(row) {
  const student = findUserById(row.student_id);
  const teacher = findUserById(row.teacher_id);
  if (!student || !teacher) {
    return null;
  }
  return {
    id: row.id,
    student_id: student.id,
    teacher_id: teacher.id,
    student: toPublicUser(student),
    teacher: toPublicUser(teacher),
    mapped_by: row.mapped_by || null,
    created_at: row.created_at
  };
}

export function listAssignments() {
  return data.assignments.map(hydrateAssignment).filter(Boolean);
}

export function getAssignmentsForUser(user) {
  const role = String(user?.role || "").trim().toLowerCase();
  const userId = Number(user?.id);
  const all = listAssignments();
  if (role === "admin" || role === "supervisor") {
    return all;
  }
  if (role === "teacher") {
    return all.filter((item) => Number(item.teacher_id) === userId);
  }
  if (role === "student") {
    return all.filter((item) => Number(item.student_id) === userId);
  }
  return [];
}

export function createAssignment({ studentId, teacherId, mappedBy = null }) {
  const student = findUserById(studentId);
  const teacher = findUserById(teacherId);
  if (!student || String(student.role || "").toLowerCase() !== "student") {
    throw new Error("STUDENT_NOT_FOUND");
  }
  if (!teacher || String(teacher.role || "").toLowerCase() !== "teacher") {
    throw new Error("TEACHER_NOT_FOUND");
  }
  const exists = data.assignments.find(
    (item) => Number(item.student_id) === Number(student.id) && Number(item.teacher_id) === Number(teacher.id)
  );
  if (exists) {
    throw new Error("ASSIGNMENT_EXISTS");
  }
  const assignment = {
    id: data.nextId++,
    student_id: student.id,
    teacher_id: teacher.id,
    mapped_by: mappedBy ? String(mappedBy).trim() : null,
    created_at: new Date().toISOString()
  };
  data.assignments.push(assignment);
  saveData();
  return hydrateAssignment(assignment);
}

export function deleteAssignment(id) {
  const numericId = Number(id);
  const index = data.assignments.findIndex((item) => Number(item.id) === numericId);
  if (index < 0) {
    return null;
  }
  const [removed] = data.assignments.splice(index, 1);
  saveData();
  return hydrateAssignment(removed) || removed;
}

export function createStudent({ fullName, phone, password, status = "approved", role = "student" }) {
  const normalizedPhone = String(phone || "").trim();
  const normalizedName = String(fullName || "").trim();
  const normalizedPassword = String(password || "");
  const normalizedRole = String(role || "student").trim().toLowerCase();

  if (!normalizedName || !normalizedPhone || !normalizedPassword) {
    throw new Error("MISSING_REQUIRED_FIELDS");
  }

  const existing = data.students.find((student) => student.phone === normalizedPhone);
  if (existing) {
    throw new Error("UNIQUE constraint failed: students.phone");
  }

  const student = {
    id: data.nextId++,
    full_name: normalizedName,
    phone: normalizedPhone,
    email: null,
    password: normalizedPassword,
    status: String(status || "approved").trim().toLowerCase(),
    role: normalizedRole || "student",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  data.students.push(student);
  saveData();
  return student;
}

export function unlockStudent(phone) {
  const normalizedPhone = String(phone || "").trim();
  const student = data.students.find((item) => item.phone === normalizedPhone);
  if (!student) {
    return null;
  }

  student.status = "approved";
  student.updated_at = new Date().toISOString();
  saveData();
  return student;
}

export function updateStudentStatus(phone, status, reviewedBy = null) {
  const normalizedPhone = String(phone || "").trim();
  const normalizedStatus = String(status || "").trim().toLowerCase();
  const student = data.students.find((item) => item.phone === normalizedPhone);
  if (!student) {
    return null;
  }

  student.status = normalizedStatus || student.status;
  student.updated_at = new Date().toISOString();
  student.reviewed_at = new Date().toISOString();
  student.reviewed_by = reviewedBy ? String(reviewedBy).trim() : null;
  saveData();
  return student;
}

export function createApprovalNotification({ student, targets, reviewer = null }) {
  const notification = {
    id: data.nextId++,
    student_phone: student?.phone || null,
    student_name: student?.full_name || null,
    role: student?.role || null,
    status: student?.status || null,
    reviewer: reviewer ? String(reviewer).trim() : null,
    targets: targets
      ? JSON.parse(JSON.stringify(targets))
      : {
          admin: { phone: null, email: null },
          supervisor: { phone: null, email: null }
        },
    created_at: new Date().toISOString()
  };

  data.approval_notifications.push(notification);
  saveData();
  return notification;
}

export function listApprovalNotifications() {
  return data.approval_notifications;
}

export function ensurePrivilegedAccounts() {
  const admin = syncPrivilegedAccount({
    role: "admin",
    fullName: "Admin User",
    phone: "+919787001217",
    email: "padmaja.vamsee@gmail.com",
    password: "admin@123"
  });

  const supervisor = syncPrivilegedAccount({
    role: "supervisor",
    fullName: "supervisor",
    phone: "+919873762244",
    email: "vrvamsee@gmail.com",
    password: "Paddu@0629"
  });

  return { admin, supervisor };
}

export function resetStudentPassword(phone, newPassword) {
  const normalizedPhone = String(phone || "").trim();
  const normalizedPassword = String(newPassword || "");
  const student = data.students.find((item) => item.phone === normalizedPhone);
  if (!student) {
    return null;
  }

  if (!normalizedPassword) {
    throw new Error("PASSWORD_REQUIRED");
  }

  student.password = normalizedPassword;
  student.updated_at = new Date().toISOString();
  saveData();
  return student;
}

export function closeDb() {
  saveData();
}
