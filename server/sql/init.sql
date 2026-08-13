CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  role TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS callback_requests (
  id SERIAL PRIMARY KEY,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  program TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

INSERT INTO students (full_name, phone, password, status)
VALUES ('Tanisha Vakati', '9871587344', 'demo-password', 'approved')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO students (full_name, phone, password, status, role)
VALUES ('Admin', '9000000000', 'admin@123', 'approved', 'admin')
ON CONFLICT (phone) DO NOTHING;
