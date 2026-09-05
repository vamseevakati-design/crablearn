import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;
let pool;

const poolOptions = {
  max: Number(process.env.PGPOOL_MAX || 1),
  idleTimeoutMillis: Number(process.env.PGPOOL_IDLE_TIMEOUT || 5000),
  connectionTimeoutMillis: Number(process.env.PGPOOL_CONNECTION_TIMEOUT || 10000)
};

function normalizeConnectionString(value) {
  const raw = String(value || "").trim();
  if (!raw || !/supabase\.co|supabase\.com/i.test(raw)) return raw;
  try {
    const url = new URL(raw);
    if (/pooler\.supabase\.com$/i.test(url.hostname) && url.port === "5432") {
      url.port = "6543";
    }
    url.searchParams.set("pgbouncer", "true");
    return url.toString();
  } catch (_error) {
    return raw;
  }
}

function getPool() {
  if (pool) return pool;
  const connectionString = normalizeConnectionString(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  const ssl = process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined;
  pool = connectionString
    ? new Pool({ connectionString, ...poolOptions, ssl })
    : new Pool({
      ...poolOptions,
        host: process.env.PGHOST || "127.0.0.1",
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER || "crablearn",
        password: process.env.PGPASSWORD || "crablearn123",
        database: process.env.PGDATABASE || "crablearn",
        ssl
      });
  return pool;
}

function mapAccount(row, role) {
  return {
    id: role === "teacher" ? row.educator_id : (row.student_id || row.id),
    full_name: row.full_name,
    first_name: row.first_name,
    last_name: row.last_name,
    phone: row.phone,
    email: row.email,
    qualification: row.qualification || null,
    specialization: row.specialization || null,
    dob: row.dob || null,
    gender: row.gender || null,
    address_line1: row.address_line1 || null,
    address_line2: row.address_line2 || null,
    country_code: row.country_code || null,
    postal_code: row.postal_code || null,
    password: row.password,
    status: row.status,
    role,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export async function ensureAuthSchema() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS students (
      student_id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT UNIQUE,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      country_code TEXT,
      status TEXT NOT NULL DEFAULT 'approved',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS educators (
      educator_id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT UNIQUE,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      country_code TEXT,
      specialization TEXT,
      qualification TEXT,
      status TEXT NOT NULL DEFAULT 'approved',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE students
      ALTER COLUMN phone DROP NOT NULL;
    ALTER TABLE educators
      ALTER COLUMN phone DROP NOT NULL;
    ALTER TABLE students
      ADD COLUMN IF NOT EXISTS full_name TEXT,
      ADD COLUMN IF NOT EXISTS phone TEXT,
      ADD COLUMN IF NOT EXISTS password TEXT,
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS country_code TEXT,
      ADD COLUMN IF NOT EXISTS first_name TEXT,
      ADD COLUMN IF NOT EXISTS last_name TEXT,
      ADD COLUMN IF NOT EXISTS dob DATE,
      ADD COLUMN IF NOT EXISTS gender TEXT,
      ADD COLUMN IF NOT EXISTS address_line1 TEXT,
      ADD COLUMN IF NOT EXISTS address_line2 TEXT,
      ADD COLUMN IF NOT EXISTS postal_code TEXT;
    ALTER TABLE educators
      ADD COLUMN IF NOT EXISTS full_name TEXT,
      ADD COLUMN IF NOT EXISTS phone TEXT,
      ADD COLUMN IF NOT EXISTS password TEXT,
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS country_code TEXT,
      ADD COLUMN IF NOT EXISTS first_name TEXT,
      ADD COLUMN IF NOT EXISTS last_name TEXT,
      ADD COLUMN IF NOT EXISTS address_line1 TEXT,
      ADD COLUMN IF NOT EXISTS address_line2 TEXT,
      ADD COLUMN IF NOT EXISTS postal_code TEXT;
  `);
}

export async function registerAccount({ role, firstName, lastName, fullName, email, phone, password, dateOfBirth, gender, addressLine1, addressLine2, country, postalCode, qualification, specialization }) {
  const normalizedRole = role === "teacher" ? "teacher" : "student";
  const table = normalizedRole === "teacher" ? "educators" : "students";
  const passwordHash = await bcrypt.hash(String(password), 12);
  const columns = normalizedRole === "teacher"
    ? "full_name, first_name, last_name, email, phone, password, country_code, address_line1, address_line2, postal_code, qualification, specialization, status"
    : "full_name, first_name, last_name, email, phone, password, country_code, dob, gender, address_line1, address_line2, postal_code, status";
  const values = normalizedRole === "teacher"
    ? [fullName, firstName || null, lastName || null, email.toLowerCase(), phone || null, passwordHash, country || null, addressLine1 || null, addressLine2 || null, postalCode || null, qualification || null, specialization || null]
    : [fullName, firstName || null, lastName || null, email.toLowerCase(), phone || null, passwordHash, country || null, dateOfBirth || null, gender || null, addressLine1 || null, addressLine2 || null, postalCode || null];
  const placeholders = values.map((_, index) => `$${index + 1}`).join(",");
  const result = await getPool().query(`INSERT INTO ${table} (${columns}) VALUES (${placeholders}, 'pending') RETURNING *`, values);
  return mapAccount(result.rows[0], normalizedRole);
}

export async function authenticateAccount(identifier, password, role) {
  const normalizedRole = role === "teacher" ? "teacher" : "student";
  const table = normalizedRole === "teacher" ? "educators" : "students";
  const value = String(identifier || "").trim().toLowerCase();
  const digits = value.replace(/\D/g, "");
  const result = await getPool().query(
    `SELECT * FROM ${table}
     WHERE LOWER(COALESCE(email, '')) = $1
        OR LOWER(COALESCE(full_name, '')) = $1
        OR phone = $1
        OR ($2 <> '' AND regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') LIKE '%' || RIGHT($2, 10))
     LIMIT 1`,
    [value, digits]
  );
  const row = result.rows[0];
  if (!row) return null;
  const valid = await bcrypt.compare(String(password), String(row.password));
  if (!valid && String(row.password) !== String(password)) return null;
  return mapAccount(row, normalizedRole);
}

export function closeAuthDb() {
  if (pool) {
    void pool.end();
    pool = null;
  }
}
