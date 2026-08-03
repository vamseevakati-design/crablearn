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

INSERT INTO students (full_name, phone, password, status)
VALUES ('Tanisha', '8004994769', 'demo-password', 'approved')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO students (full_name, phone, password, status, role)
VALUES ('Admin User', '9000000000', 'admin@123', 'approved', 'admin')
ON CONFLICT (phone) DO NOTHING;
