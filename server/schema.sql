CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_no text NOT NULL UNIQUE,
  name text NOT NULL,
  sex text NOT NULL DEFAULT '',
  dob date,
  age_years text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  alt_phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  occupation text NOT NULL DEFAULT '',
  marital_status text NOT NULL DEFAULT '',
  blood_group text NOT NULL DEFAULT '',
  referred_by text NOT NULL DEFAULT '',
  emergency_name text NOT NULL DEFAULT '',
  emergency_phone text NOT NULL DEFAULT '',
  allergies text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  chief_complaint text NOT NULL,
  duration text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  sensation text NOT NULL DEFAULT '',
  modalities_better text NOT NULL DEFAULT '',
  modalities_worse text NOT NULL DEFAULT '',
  concomitants text NOT NULL DEFAULT '',
  causation text NOT NULL DEFAULT '',
  history text NOT NULL DEFAULT '',
  past_history text NOT NULL DEFAULT '',
  family_history text NOT NULL DEFAULT '',
  previous_treatment text NOT NULL DEFAULT '',
  menstrual text NOT NULL DEFAULT '',
  birth_history text NOT NULL DEFAULT '',
  mental text NOT NULL DEFAULT '',
  appetite text NOT NULL DEFAULT '',
  thirst text NOT NULL DEFAULT '',
  desires text NOT NULL DEFAULT '',
  aversions text NOT NULL DEFAULT '',
  intolerance text NOT NULL DEFAULT '',
  stool text NOT NULL DEFAULT '',
  urine text NOT NULL DEFAULT '',
  perspiration text NOT NULL DEFAULT '',
  sleep text NOT NULL DEFAULT '',
  thermal text NOT NULL DEFAULT '',
  dreams text NOT NULL DEFAULT '',
  particulars text NOT NULL DEFAULT '',
  examination text NOT NULL DEFAULT '',
  diagnosis text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  remedies jsonb NOT NULL DEFAULT '[]'::jsonb,
  advice text NOT NULL DEFAULT '',
  diet text NOT NULL DEFAULT '',
  next_visit date,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  response text NOT NULL,
  adherence text NOT NULL DEFAULT '',
  complaints text NOT NULL DEFAULT '',
  changes text NOT NULL DEFAULT '',
  new_symptoms text NOT NULL DEFAULT '',
  reaction text NOT NULL DEFAULT '',
  observations text NOT NULL DEFAULT '',
  assessment text NOT NULL DEFAULT '',
  plan text NOT NULL DEFAULT '',
  next_visit date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS case_sheets_patient_idx ON case_sheets (patient_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS prescriptions_patient_idx ON prescriptions (patient_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS follow_ups_patient_idx ON follow_ups (patient_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS patients_updated_idx ON patients (updated_at DESC);
