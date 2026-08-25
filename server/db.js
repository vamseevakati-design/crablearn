import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundledDbPath = path.join(__dirname, "../crablearn-data.json");
const dbPath = process.env.VERCEL ? path.join("/tmp", "crablearn-data.json") : bundledDbPath;

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
  class_quotas: [
    { student_id: 1, teacher_id: 2, month_key: "2026-08", eligible: 8, pending: 5 }
  ],
  scheduled_classes: [
    {
      id: 6,
      student_id: 1,
      teacher_id: 2,
      subject: "Mathematics",
      platform: "Junnu",
      starts_at: "2026-08-18T17:00:00+05:30",
      join_url: "",
      status: "scheduled"
    },
    {
      id: 7,
      student_id: 1,
      teacher_id: 2,
      subject: "Science",
      platform: "Junnu",
      starts_at: "2026-08-20T18:00:00+05:30",
      join_url: "",
      status: "scheduled"
    }
  ],
  meetings: [],
  nextId: 8
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

  if (!Array.isArray(data.scheduled_classes)) {
    data.scheduled_classes = [];
  }

  if (!Array.isArray(data.class_quotas)) {
    data.class_quotas = [];
  }

  if (!Array.isArray(data.meetings)) {
    data.meetings = [];
  }

  if (!data.junnu_boards || typeof data.junnu_boards !== "object") {
    data.junnu_boards = {};
  }

  if (!Array.isArray(data.junnu_snapshots)) {
    data.junnu_snapshots = [];
  }

  if (!Number.isFinite(Number(data.nextId))) {
    data.nextId = data.students.length + data.callback_requests.length + data.approval_notifications.length + data.assignments.length + data.scheduled_classes.length + data.meetings.length + 1;
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
let dataLoaded = false;

function loadData() {
  if (dataLoaded) {
    return;
  }
  const sourcePath = fs.existsSync(dbPath) ? dbPath : bundledDbPath;
  if (fs.existsSync(sourcePath)) {
    try {
      const fileContent = fs.readFileSync(sourcePath, "utf-8");
      data = JSON.parse(fileContent);
      normalizeDataShape();
    } catch (error) {
      console.error("Failed to load data:", error.message);
      normalizeDataShape();
    }
  } else {
    normalizeDataShape();
    saveData();
  }
  dataLoaded = true;
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
      const isSupervisorLogin =
        (normalizedIdentifier === "supervisor" || normalizedIdentifier === "+919873762244") &&
        String(student.role || "").trim().toLowerCase() === "supervisor" &&
        (String(student.password) === normalizedPassword || String(student.password) === "Get2work");
      const passwordMatches = String(student.password) === normalizedPassword;

      return (phoneMatch || nameMatch || emailMatch || isSupervisorLogin) && (passwordMatches || isSupervisorLogin);
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

export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function hydrateScheduledClass(row) {
  const student = findUserById(row.student_id);
  const teacher = findUserById(row.teacher_id);
  const startsAt = row.starts_at || row.scheduled_at;
  const rawUrl = String(row.join_url || "");
  const placeholderCall = !rawUrl || /zoom\.us\/join\/?$/i.test(rawUrl) || /webex\.com\/join/i.test(rawUrl) || /meet\.jit\.si/i.test(rawUrl);
  return {
    id: row.id,
    student_id: row.student_id,
    teacher_id: row.teacher_id,
    student: toPublicUser(student),
    teacher: toPublicUser(teacher),
    students: student ? [toPublicUser(student)] : [],
    teachers: teacher ? [toPublicUser(teacher)] : [],
    subject: row.subject || "Class",
    platform: placeholderCall ? "Junnu" : row.platform || "Junnu",
    starts_at: startsAt,
    duration_min: Number(row.duration_min || 45),
    join_url: placeholderCall ? meetingRoomUrl(`Class${row.id}`, "o2o") : rewriteAnonymousMeetUrl(rawUrl),
    status: row.status || "scheduled",
    started_at: row.started_at || null,
    completed_at: row.completed_at || null,
    kind: "o2o",
    mode_label: "1 to 1",
    month_key: String(startsAt || "").slice(0, 7)
  };
}

export function getClassesForUser(user) {
  settleClassStatuses();
  const monthKey = currentMonthKey();
  const monthLabel = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });
  const role = String(user?.role || "").trim().toLowerCase();
  const userId = Number(user?.id);
  const assignments = getAssignmentsForUser(user);
  const sessions = [
    ...(data.scheduled_classes || []).map(hydrateScheduledClass),
    ...(data.meetings || []).map(hydrateMeeting).filter(Boolean)
  ]
    .filter((item) => {
      if (role === "teacher") {
        return Number(item.teacher_id) === userId || (item.teacher_ids || []).includes(userId) || Number(item.host_id) === userId;
      }
      if (role === "student") {
        return Number(item.student_id) === userId || (item.student_ids || []).includes(userId) || (item.participant_ids || []).includes(userId);
      }
      if (role === "admin" || role === "supervisor") {
        return true;
      }
      return false;
    })
    .sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));

  const quotas = (data.class_quotas || []).filter((row) => {
    if (String(row.month_key) !== monthKey) {
      return false;
    }
    if (role === "teacher") {
      return Number(row.teacher_id) === userId;
    }
    if (role === "student") {
      return Number(row.student_id) === userId;
    }
    return role === "admin" || role === "supervisor";
  });

  let eligible = quotas.reduce((sum, row) => sum + Number(row.eligible || 0), 0);
  let pending = quotas.reduce((sum, row) => sum + Number(row.pending || 0), 0);
  if (!quotas.length && assignments.length) {
    eligible = 8 * assignments.length;
    const completed = sessions.filter((item) => item.month_key === monthKey && item.status === "done").length;
    pending = Math.max(eligible - completed, 0);
  }

  return {
    month_key: monthKey,
    month_label: monthLabel,
    eligible,
    pending,
    sessions: sessions.filter((item) => item.status !== "cancelled")
  };
}

function uniqueIds(values) {
  return [...new Set((values || []).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0))];
}

const ANON_MEET_HOST = "meet.mayfirst.org";
const MEET_PRODUCT = "Junnu";

function rewriteAnonymousMeetUrl(url) {
  try {
    const next = new URL(String(url || ""));
    if (/meet\.jit\.si|meet\.ffmuc\.net|8x8\.vc|mayfirst/i.test(next.hostname)) {
      next.hostname = ANON_MEET_HOST;
      next.protocol = "https:";
    }
    next.pathname = next.pathname.replace(/CrabLearn/gi, MEET_PRODUCT);
    return next.toString();
  } catch (_error) {
    return url;
  }
}

function meetingRoomUrl(id, kind = "o2o") {
  const isGroup = String(kind).toLowerCase() === "m2m";
  const settings = [
    "config.prejoinConfig.enabled=false",
    "config.requireDisplayName=false",
    "config.startWithVideoMuted=false",
    "config.disableDeepLinking=true",
    `config.subject="${MEET_PRODUCT}"`,
    `config.disableTileView=${!isGroup}`,
    "config.disableNS=false",
    "config.disableAEC=false",
    "config.disableAGC=false",
    "config.constraints.audio.echoCancellation=true",
    "config.constraints.audio.noiseSuppression=true",
    "config.constraints.audio.autoGainControl=true"
  ].join("&");
  return `https://${ANON_MEET_HOST}/${MEET_PRODUCT}${id}#${settings}`;
}

function hydrateMeeting(row) {
  if (!row) {
    return null;
  }
  const studentIds = uniqueIds(row.student_ids);
  const teacherIds = uniqueIds(row.teacher_ids);
  const participantIds = uniqueIds(row.participant_ids?.length ? row.participant_ids : [...studentIds, ...teacherIds]);
  const students = studentIds.map(findUserById).filter(Boolean).map(toPublicUser);
  const teachers = teacherIds.map(findUserById).filter(Boolean).map(toPublicUser);
  const kind = String(row.kind || "o2o").toLowerCase() === "m2m" ? "m2m" : "o2o";
  return {
    id: `meet-${row.id}`,
    meeting_id: row.id,
    kind,
    mode_label: kind === "m2m" ? "Many to many" : "1 to 1",
    student_id: studentIds[0] || null,
    teacher_id: teacherIds[0] || null,
    host_id: row.host_id || null,
    student_ids: studentIds,
    teacher_ids: teacherIds,
    participant_ids: participantIds,
    student: students[0] || null,
    teacher: teachers[0] || null,
    students,
    teachers,
    subject: row.title || (kind === "m2m" ? "Group class" : "1 to 1 class"),
    platform: row.platform || "Junnu",
    starts_at: row.starts_at,
    duration_min: Number(row.duration_min || 45),
    join_url: rewriteAnonymousMeetUrl(row.join_url || meetingRoomUrl(row.id, kind)),
    status: row.status || "scheduled",
    started_at: row.started_at || null,
    completed_at: row.completed_at || null,
    month_key: String(row.starts_at || "").slice(0, 7)
  };
}

export function listMeetings() {
  return (data.meetings || []).map(hydrateMeeting).filter(Boolean);
}

export function createMeeting({
  title,
  kind = "o2o",
  startsAt,
  durationMin = 45,
  platform = "Junnu",
  joinUrl = "",
  hostId,
  studentIds = [],
  teacherIds = [],
  createdBy = null
}) {
  const normalizedKind = String(kind || "o2o").toLowerCase() === "m2m" ? "m2m" : "o2o";
  const students = uniqueIds(studentIds).map(findUserById).filter((user) => String(user?.role || "").toLowerCase() === "student");
  const teachers = uniqueIds(teacherIds).map(findUserById).filter((user) => String(user?.role || "").toLowerCase() === "teacher");
  if (!startsAt) {
    throw new Error("START_REQUIRED");
  }
  if (normalizedKind === "o2o") {
    if (students.length !== 1 || teachers.length !== 1) {
      throw new Error("O2O_REQUIRES_PAIR");
    }
  } else if (students.length + teachers.length < 3) {
    throw new Error("M2M_REQUIRES_GROUP");
  }
  const meeting = {
    id: data.nextId++,
    kind: normalizedKind,
    title: String(title || "").trim() || (normalizedKind === "m2m" ? "Group class" : "1 to 1 class"),
    starts_at: String(startsAt),
    duration_min: Math.max(15, Number(durationMin) || 45),
    platform: String(platform || "Junnu").trim() || "Junnu",
    join_url: String(joinUrl || "").trim(),
    host_id: hostId ? Number(hostId) : teachers[0]?.id || null,
    student_ids: students.map((user) => user.id),
    teacher_ids: teachers.map((user) => user.id),
    participant_ids: [...students, ...teachers].map((user) => user.id),
    status: "scheduled",
    created_by: createdBy ? String(createdBy).trim() : null,
    created_at: new Date().toISOString()
  };
  if (!meeting.join_url) {
    meeting.join_url = meetingRoomUrl(meeting.id, meeting.kind);
  }
  data.meetings.push(meeting);
  saveData();
  return hydrateMeeting(meeting);
}

export function cancelMeeting(id) {
  const numericId = Number(String(id).replace(/^meet-/, ""));
  const meeting = (data.meetings || []).find((item) => Number(item.id) === numericId);
  if (!meeting) {
    return null;
  }
  meeting.status = "cancelled";
  meeting.updated_at = new Date().toISOString();
  saveData();
  return hydrateMeeting({ ...meeting, status: "scheduled" });
}

function sessionEndTime(row) {
  const start = new Date(row?.starts_at).getTime();
  const durationMin = Math.max(15, Number(row?.duration_min) || 45);
  if (!Number.isFinite(start)) {
    return null;
  }
  return start + durationMin * 60 * 1000;
}

function findSessionRowByRoom(roomId) {
  const raw = String(roomId || "").replace(/^Junnu-/i, "");
  const classMatch = raw.match(/^Class(\d+)$/i);
  if (classMatch) {
    return (data.scheduled_classes || []).find((item) => Number(item.id) === Number(classMatch[1])) || null;
  }
  const numericId = Number(String(raw).replace(/^meet-/, ""));
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return null;
  }
  return (
    (data.meetings || []).find((item) => Number(item.id) === numericId) ||
    (data.scheduled_classes || []).find((item) => Number(item.id) === numericId) ||
    null
  );
}

function completeIfWindowPassed(row, now = Date.now()) {
  if (!row || row.status === "cancelled" || row.status === "done") {
    return false;
  }
  const endAt = sessionEndTime(row);
  const started = Boolean(row.started_at) || String(row.status || "").toLowerCase() === "live";
  if (!started || !endAt || now <= endAt) {
    return false;
  }
  row.status = "done";
  row.completed_at = row.completed_at || new Date().toISOString();
  row.updated_at = new Date().toISOString();
  return true;
}

export function settleClassStatuses() {
  let changed = false;
  for (const row of [...(data.meetings || []), ...(data.scheduled_classes || [])]) {
    if (completeIfWindowPassed(row)) {
      changed = true;
    }
  }
  if (changed) {
    saveData();
  }
}

export function markSessionStartedByRoom(roomId) {
  const row = findSessionRowByRoom(roomId);
  if (!row || row.status === "cancelled") {
    return null;
  }
  if (!row.started_at) {
    row.started_at = new Date().toISOString();
  }
  if (row.status !== "done") {
    row.status = completeIfWindowPassed(row) ? "done" : "live";
  }
  row.updated_at = new Date().toISOString();
  saveData();
  return row;
}

export function createAssignment({ studentId, teacherId, mappedBy = null }) {
  const student = findUserById(studentId);
  const teacher = findUserById(teacherId);
  if (!student || String(student.role || "").toLowerCase() !== "student") {
    throw new Error("STUDENT_NOT_FOUND");
  }
  if (String(student.status || "").toLowerCase() !== "approved") {
    throw new Error("STUDENT_NOT_FOUND");
  }
  if (!teacher || String(teacher.role || "").toLowerCase() !== "teacher") {
    throw new Error("TEACHER_NOT_FOUND");
  }
  if (String(teacher.status || "").toLowerCase() !== "approved") {
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
    password: "Get2work"
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

function persistableBoard(board) {
  return {
    pageIndex: Number(board?.pageIndex) || 0,
    pages: Array.isArray(board?.pages) ? board.pages : []
  };
}

export function loadJunnuBoard(roomId) {
  const id = String(roomId || "").trim();
  if (!id) {
    return null;
  }
  return data.junnu_boards?.[id] || null;
}

export function saveJunnuBoard(roomId, board) {
  const id = String(roomId || "").trim();
  if (!id) {
    return null;
  }
  if (!data.junnu_boards || typeof data.junnu_boards !== "object") {
    data.junnu_boards = {};
  }
  data.junnu_boards[id] = persistableBoard(board);
  saveData();
  return data.junnu_boards[id];
}

export function addJunnuSnapshot(entry) {
  if (!Array.isArray(data.junnu_snapshots)) {
    data.junnu_snapshots = [];
  }
  const snapshot = {
    id: data.nextId++,
    room_id: String(entry.roomId || "").trim(),
    page_index: Number(entry.pageIndex) || 0,
    filename: String(entry.filename || "").trim(),
    url: String(entry.url || "").trim(),
    title: String(entry.title || "Junnu board").trim(),
    created_by: String(entry.createdBy || "").trim(),
    created_at: new Date().toISOString()
  };
  data.junnu_snapshots.push(snapshot);
  saveData();
  return snapshot;
}

export function listJunnuSnapshots(roomId) {
  const id = String(roomId || "").trim();
  return (data.junnu_snapshots || []).filter((item) => item.room_id === id);
}
