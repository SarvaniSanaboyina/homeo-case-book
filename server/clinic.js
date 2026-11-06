import { query, withTransaction } from './db.js'
import {
  caseIn,
  caseOut,
  followIn,
  followOut,
  httpError,
  patientIn,
  patientOut,
  prescriptionIn,
  prescriptionOut,
} from './map.js'
import { exampleRecords } from './example.js'

async function nextRegNo(client) {
  const { rows } = await client.query(`
    SELECT COALESCE(MAX(CAST(SUBSTRING(reg_no FROM 4) AS INTEGER)), 1000) + 1 AS next
    FROM patients
    WHERE reg_no ~ '^HM-[0-9]+$'
  `)
  return `HM-${rows[0].next}`
}

async function touchPatient(client, patientId) {
  await client.query('UPDATE patients SET updated_at = now() WHERE id = $1', [patientId])
}

async function requirePatient(client, patientId) {
  const { rows } = await client.query('SELECT id FROM patients WHERE id = $1', [patientId])
  if (!rows[0]) throw httpError(404, 'Patient not found.')
}

export async function loadClinic() {
  const [patients, caseSheets, prescriptions, followUps] = await Promise.all([
    query('SELECT * FROM patients ORDER BY updated_at DESC'),
    query('SELECT * FROM case_sheets ORDER BY visit_date DESC, created_at DESC'),
    query('SELECT * FROM prescriptions ORDER BY visit_date DESC, created_at DESC'),
    query('SELECT * FROM follow_ups ORDER BY visit_date DESC, created_at DESC'),
  ])
  return {
    patients: patients.rows.map(patientOut),
    caseSheets: caseSheets.rows.map(caseOut),
    prescriptions: prescriptions.rows.map(prescriptionOut),
    followUps: followUps.rows.map(followOut),
  }
}

export async function createPatient(body) {
  const data = patientIn(body)
  if (!data.name) throw httpError(400, 'Enter the patient’s name.')
  return withTransaction(async (client) => {
    const regNo = body.regNo || await nextRegNo(client)
    const { rows } = await client.query(
      `INSERT INTO patients (
        id, reg_no, name, sex, dob, age_years, phone, alt_phone, email, city, address,
        occupation, marital_status, blood_group, referred_by, emergency_name, emergency_phone,
        allergies, notes, created_at, updated_at
      ) VALUES (
        COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19,
        COALESCE($20::timestamptz, now()), COALESCE($21::timestamptz, now())
      ) RETURNING *`,
      [
        body.id || null, regNo, data.name, data.sex, data.dob, data.ageYears, data.phone, data.altPhone,
        data.email, data.city, data.address, data.occupation, data.maritalStatus, data.bloodGroup,
        data.referredBy, data.emergencyName, data.emergencyPhone, data.allergies, data.notes,
        body.createdAt || null, body.updatedAt || null,
      ],
    )
    return patientOut(rows[0])
  })
}

export async function updatePatient(id, body) {
  const data = patientIn(body)
  if (!data.name) throw httpError(400, 'Enter the patient’s name.')
  const { rows } = await query(
    `UPDATE patients SET
      name = $2, sex = $3, dob = $4, age_years = $5, phone = $6, alt_phone = $7, email = $8,
      city = $9, address = $10, occupation = $11, marital_status = $12, blood_group = $13,
      referred_by = $14, emergency_name = $15, emergency_phone = $16, allergies = $17, notes = $18,
      updated_at = now()
    WHERE id = $1
    RETURNING *`,
    [
      id, data.name, data.sex, data.dob, data.ageYears, data.phone, data.altPhone, data.email,
      data.city, data.address, data.occupation, data.maritalStatus, data.bloodGroup, data.referredBy,
      data.emergencyName, data.emergencyPhone, data.allergies, data.notes,
    ],
  )
  if (!rows[0]) throw httpError(404, 'Patient not found.')
  return patientOut(rows[0])
}

export async function deletePatient(id) {
  const { rowCount } = await query('DELETE FROM patients WHERE id = $1', [id])
  if (!rowCount) throw httpError(404, 'Patient not found.')
}

const CASE_INSERT = `
  INSERT INTO case_sheets (
    id, patient_id, visit_date, chief_complaint, duration, location, sensation, modalities_better,
    modalities_worse, concomitants, causation, history, past_history, family_history, previous_treatment,
    menstrual, birth_history, mental, appetite, thirst, desires, aversions, intolerance, stool, urine,
    perspiration, sleep, thermal, dreams, particulars, examination, diagnosis, notes, created_at, updated_at
  ) VALUES (
    COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
    $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33,
    COALESCE($34::timestamptz, now()), COALESCE($35::timestamptz, now())
  ) RETURNING *
`

function caseParams(data, body = {}) {
  return [
    body.id || null, data.patientId, data.date, data.chiefComplaint, data.duration, data.location,
    data.sensation, data.modalitiesBetter, data.modalitiesWorse, data.concomitants, data.causation,
    data.history, data.pastHistory, data.familyHistory, data.previousTreatment, data.menstrual,
    data.birthHistory, data.mental, data.appetite, data.thirst, data.desires, data.aversions,
    data.intolerance, data.stool, data.urine, data.perspiration, data.sleep, data.thermal, data.dreams,
    data.particulars, data.examination, data.diagnosis, data.notes, body.createdAt || null, body.updatedAt || null,
  ]
}

export async function createCaseSheet(body) {
  const data = caseIn(body)
  if (!data.patientId) throw httpError(400, 'Patient is missing.')
  if (!data.date) throw httpError(400, 'Choose a visit date.')
  if (!data.chiefComplaint) throw httpError(400, 'Add the chief complaint.')
  return withTransaction(async (client) => {
    await requirePatient(client, data.patientId)
    const { rows } = await client.query(CASE_INSERT, caseParams(data, body))
    await touchPatient(client, data.patientId)
    return caseOut(rows[0])
  })
}

export async function updateCaseSheet(id, body) {
  const data = caseIn(body)
  if (!data.date) throw httpError(400, 'Choose a visit date.')
  if (!data.chiefComplaint) throw httpError(400, 'Add the chief complaint.')
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE case_sheets SET
        visit_date = $2, chief_complaint = $3, duration = $4, location = $5, sensation = $6,
        modalities_better = $7, modalities_worse = $8, concomitants = $9, causation = $10, history = $11,
        past_history = $12, family_history = $13, previous_treatment = $14, menstrual = $15, birth_history = $16,
        mental = $17, appetite = $18, thirst = $19, desires = $20, aversions = $21, intolerance = $22,
        stool = $23, urine = $24, perspiration = $25, sleep = $26, thermal = $27, dreams = $28,
        particulars = $29, examination = $30, diagnosis = $31, notes = $32, updated_at = now()
      WHERE id = $1
      RETURNING *`,
      [
        id, data.date, data.chiefComplaint, data.duration, data.location, data.sensation,
        data.modalitiesBetter, data.modalitiesWorse, data.concomitants, data.causation, data.history,
        data.pastHistory, data.familyHistory, data.previousTreatment, data.menstrual, data.birthHistory,
        data.mental, data.appetite, data.thirst, data.desires, data.aversions, data.intolerance,
        data.stool, data.urine, data.perspiration, data.sleep, data.thermal, data.dreams, data.particulars,
        data.examination, data.diagnosis, data.notes,
      ],
    )
    if (!rows[0]) throw httpError(404, 'Case sheet not found.')
    await touchPatient(client, rows[0].patient_id)
    return caseOut(rows[0])
  })
}

export async function deleteCaseSheet(id) {
  return withTransaction(async (client) => {
    const { rows } = await client.query('DELETE FROM case_sheets WHERE id = $1 RETURNING patient_id', [id])
    if (!rows[0]) throw httpError(404, 'Case sheet not found.')
    await touchPatient(client, rows[0].patient_id)
  })
}

export async function createPrescription(body) {
  const data = prescriptionIn(body)
  if (!data.patientId) throw httpError(400, 'Patient is missing.')
  if (!data.date) throw httpError(400, 'Choose the date of this prescription.')
  if (!data.remedies.length) throw httpError(400, 'Add at least one medicine.')
  return withTransaction(async (client) => {
    await requirePatient(client, data.patientId)
    const { rows } = await client.query(
      `INSERT INTO prescriptions (
        id, patient_id, visit_date, remedies, advice, diet, next_visit, notes, created_at, updated_at
      ) VALUES (
        COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4::jsonb, $5, $6, $7, $8,
        COALESCE($9::timestamptz, now()), COALESCE($10::timestamptz, now())
      ) RETURNING *`,
      [
        body.id || null, data.patientId, data.date, JSON.stringify(data.remedies), data.advice, data.diet,
        data.nextVisit, data.notes, body.createdAt || null, body.updatedAt || null,
      ],
    )
    await touchPatient(client, data.patientId)
    return prescriptionOut(rows[0])
  })
}

export async function updatePrescription(id, body) {
  const data = prescriptionIn(body)
  if (!data.date) throw httpError(400, 'Choose the date of this prescription.')
  if (!data.remedies.length) throw httpError(400, 'Add at least one medicine.')
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE prescriptions SET
        visit_date = $2, remedies = $3::jsonb, advice = $4, diet = $5, next_visit = $6, notes = $7, updated_at = now()
      WHERE id = $1
      RETURNING *`,
      [id, data.date, JSON.stringify(data.remedies), data.advice, data.diet, data.nextVisit, data.notes],
    )
    if (!rows[0]) throw httpError(404, 'Prescription not found.')
    await touchPatient(client, rows[0].patient_id)
    return prescriptionOut(rows[0])
  })
}

export async function deletePrescription(id) {
  return withTransaction(async (client) => {
    const { rows } = await client.query('DELETE FROM prescriptions WHERE id = $1 RETURNING patient_id', [id])
    if (!rows[0]) throw httpError(404, 'Prescription not found.')
    await touchPatient(client, rows[0].patient_id)
  })
}

export async function createFollowUp(body) {
  const data = followIn(body)
  if (!data.patientId) throw httpError(400, 'Patient is missing.')
  if (!data.date) throw httpError(400, 'Choose a visit date.')
  if (!data.response) throw httpError(400, 'Choose how the patient responded.')
  return withTransaction(async (client) => {
    await requirePatient(client, data.patientId)
    const { rows } = await client.query(
      `INSERT INTO follow_ups (
        id, patient_id, visit_date, response, adherence, complaints, changes, new_symptoms, reaction,
        observations, assessment, plan, next_visit, created_at, updated_at
      ) VALUES (
        COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        COALESCE($14::timestamptz, now()), COALESCE($15::timestamptz, now())
      ) RETURNING *`,
      [
        body.id || null, data.patientId, data.date, data.response, data.adherence, data.complaints, data.changes,
        data.newSymptoms, data.reaction, data.observations, data.assessment, data.plan, data.nextVisit,
        body.createdAt || null, body.updatedAt || null,
      ],
    )
    await touchPatient(client, data.patientId)
    return followOut(rows[0])
  })
}

export async function updateFollowUp(id, body) {
  const data = followIn(body)
  if (!data.date) throw httpError(400, 'Choose a visit date.')
  if (!data.response) throw httpError(400, 'Choose how the patient responded.')
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE follow_ups SET
        visit_date = $2, response = $3, adherence = $4, complaints = $5, changes = $6, new_symptoms = $7,
        reaction = $8, observations = $9, assessment = $10, plan = $11, next_visit = $12, updated_at = now()
      WHERE id = $1
      RETURNING *`,
      [
        id, data.date, data.response, data.adherence, data.complaints, data.changes, data.newSymptoms,
        data.reaction, data.observations, data.assessment, data.plan, data.nextVisit,
      ],
    )
    if (!rows[0]) throw httpError(404, 'Follow-up not found.')
    await touchPatient(client, rows[0].patient_id)
    return followOut(rows[0])
  })
}

export async function deleteFollowUp(id) {
  return withTransaction(async (client) => {
    const { rows } = await client.query('DELETE FROM follow_ups WHERE id = $1 RETURNING patient_id', [id])
    if (!rows[0]) throw httpError(404, 'Follow-up not found.')
    await touchPatient(client, rows[0].patient_id)
  })
}

function assertBackup(payload) {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.patients)) {
    throw httpError(400, 'This file does not look like a Homeo backup.')
  }
  for (const patient of payload.patients) {
    if (!patient?.id || !String(patient.name || '').trim()) {
      throw httpError(400, 'A patient in this file is missing a name or id.')
    }
  }
}

export async function replaceClinic(payload) {
  assertBackup(payload)
  await withTransaction(async (client) => {
    await client.query('DELETE FROM patients')
    for (const patient of payload.patients) {
      const data = patientIn(patient)
      await client.query(
        `INSERT INTO patients (
          id, reg_no, name, sex, dob, age_years, phone, alt_phone, email, city, address, occupation,
          marital_status, blood_group, referred_by, emergency_name, emergency_phone, allergies, notes,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
          COALESCE($20::timestamptz, now()), COALESCE($21::timestamptz, now())
        )`,
        [
          patient.id, patient.regNo || `HM-${Date.now()}`, data.name, data.sex, data.dob, data.ageYears,
          data.phone, data.altPhone, data.email, data.city, data.address, data.occupation, data.maritalStatus,
          data.bloodGroup, data.referredBy, data.emergencyName, data.emergencyPhone, data.allergies, data.notes,
          patient.createdAt || null, patient.updatedAt || null,
        ],
      )
    }
    for (const record of payload.caseSheets || []) {
      const data = caseIn(record)
      await client.query(CASE_INSERT, caseParams(data, record))
    }
    for (const record of payload.prescriptions || []) {
      const data = prescriptionIn(record)
      await client.query(
        `INSERT INTO prescriptions (
          id, patient_id, visit_date, remedies, advice, diet, next_visit, notes, created_at, updated_at
        ) VALUES (
          COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4::jsonb, $5, $6, $7, $8,
          COALESCE($9::timestamptz, now()), COALESCE($10::timestamptz, now())
        )`,
        [
          record.id || null, data.patientId, data.date, JSON.stringify(data.remedies), data.advice, data.diet,
          data.nextVisit, data.notes, record.createdAt || null, record.updatedAt || null,
        ],
      )
    }
    for (const record of payload.followUps || []) {
      const data = followIn(record)
      await client.query(
        `INSERT INTO follow_ups (
          id, patient_id, visit_date, response, adherence, complaints, changes, new_symptoms, reaction,
          observations, assessment, plan, next_visit, created_at, updated_at
        ) VALUES (
          COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          COALESCE($14::timestamptz, now()), COALESCE($15::timestamptz, now())
        )`,
        [
          record.id || null, data.patientId, data.date, data.response, data.adherence, data.complaints, data.changes,
          data.newSymptoms, data.reaction, data.observations, data.assessment, data.plan, data.nextVisit,
          record.createdAt || null, record.updatedAt || null,
        ],
      )
    }
  })
  return loadClinic()
}

export async function clearClinic() {
  await query('DELETE FROM patients')
  return loadClinic()
}

export async function addExample() {
  const records = exampleRecords()
  await withTransaction(async (client) => {
    const patient = patientIn(records.patient)
    const regNo = await nextRegNo(client)
    await client.query(
      `INSERT INTO patients (
        id, reg_no, name, sex, dob, age_years, phone, alt_phone, email, city, address, occupation,
        marital_status, blood_group, referred_by, emergency_name, emergency_phone, allergies, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [
        records.patient.id, regNo, patient.name, patient.sex, patient.dob, patient.ageYears, patient.phone,
        patient.altPhone, patient.email, patient.city, patient.address, patient.occupation, patient.maritalStatus,
        patient.bloodGroup, patient.referredBy, patient.emergencyName, patient.emergencyPhone, patient.allergies,
        patient.notes,
      ],
    )
    const sheet = caseIn(records.caseSheet)
    await client.query(CASE_INSERT, caseParams(sheet, records.caseSheet))
    const rx = prescriptionIn(records.prescription)
    await client.query(
      `INSERT INTO prescriptions (id, patient_id, visit_date, remedies, advice, diet, next_visit, notes)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8)`,
      [
        records.prescription.id, rx.patientId, rx.date, JSON.stringify(rx.remedies), rx.advice, rx.diet,
        rx.nextVisit, rx.notes,
      ],
    )
    const follow = followIn(records.followUp)
    await client.query(
      `INSERT INTO follow_ups (
        id, patient_id, visit_date, response, adherence, complaints, changes, new_symptoms, reaction,
        observations, assessment, plan, next_visit
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        records.followUp.id, follow.patientId, follow.date, follow.response, follow.adherence, follow.complaints,
        follow.changes, follow.newSymptoms, follow.reaction, follow.observations, follow.assessment, follow.plan,
        follow.nextVisit,
      ],
    )
  })
  return loadClinic()
}
