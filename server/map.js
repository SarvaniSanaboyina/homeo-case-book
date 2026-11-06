function text(value) {
  return value == null ? '' : String(value)
}

function dateOut(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function dateIn(value) {
  const next = text(value).slice(0, 10)
  return next || null
}

function stampOut(value) {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString()
  const raw = String(value)
  if (/^\d{4}-\d{2}-\d{2} /.test(raw) && !raw.includes('T')) {
    return new Date(raw.replace(' ', 'T')).toISOString()
  }
  return raw
}

export function patientOut(row) {
  if (!row) return null
  return {
    id: row.id,
    regNo: row.reg_no,
    name: row.name,
    sex: text(row.sex),
    dob: dateOut(row.dob),
    ageYears: text(row.age_years),
    phone: text(row.phone),
    altPhone: text(row.alt_phone),
    email: text(row.email),
    city: text(row.city),
    address: text(row.address),
    occupation: text(row.occupation),
    maritalStatus: text(row.marital_status),
    bloodGroup: text(row.blood_group),
    referredBy: text(row.referred_by),
    emergencyName: text(row.emergency_name),
    emergencyPhone: text(row.emergency_phone),
    allergies: text(row.allergies),
    notes: text(row.notes),
    createdAt: stampOut(row.created_at),
    updatedAt: stampOut(row.updated_at),
  }
}

export function patientIn(body) {
  return {
    name: text(body.name).trim(),
    sex: text(body.sex),
    dob: dateIn(body.dob),
    ageYears: text(body.ageYears),
    phone: text(body.phone),
    altPhone: text(body.altPhone),
    email: text(body.email),
    city: text(body.city),
    address: text(body.address),
    occupation: text(body.occupation),
    maritalStatus: text(body.maritalStatus),
    bloodGroup: text(body.bloodGroup),
    referredBy: text(body.referredBy),
    emergencyName: text(body.emergencyName),
    emergencyPhone: text(body.emergencyPhone),
    allergies: text(body.allergies),
    notes: text(body.notes),
  }
}

export function caseOut(row) {
  if (!row) return null
  return {
    id: row.id,
    patientId: row.patient_id,
    date: dateOut(row.visit_date),
    chiefComplaint: text(row.chief_complaint),
    duration: text(row.duration),
    location: text(row.location),
    sensation: text(row.sensation),
    modalitiesBetter: text(row.modalities_better),
    modalitiesWorse: text(row.modalities_worse),
    concomitants: text(row.concomitants),
    causation: text(row.causation),
    history: text(row.history),
    pastHistory: text(row.past_history),
    familyHistory: text(row.family_history),
    previousTreatment: text(row.previous_treatment),
    menstrual: text(row.menstrual),
    birthHistory: text(row.birth_history),
    mental: text(row.mental),
    appetite: text(row.appetite),
    thirst: text(row.thirst),
    desires: text(row.desires),
    aversions: text(row.aversions),
    intolerance: text(row.intolerance),
    stool: text(row.stool),
    urine: text(row.urine),
    perspiration: text(row.perspiration),
    sleep: text(row.sleep),
    thermal: text(row.thermal),
    dreams: text(row.dreams),
    particulars: text(row.particulars),
    examination: text(row.examination),
    diagnosis: text(row.diagnosis),
    notes: text(row.notes),
    createdAt: stampOut(row.created_at),
    updatedAt: stampOut(row.updated_at),
  }
}

export function caseIn(body) {
  return {
    patientId: body.patientId,
    date: dateIn(body.date),
    chiefComplaint: text(body.chiefComplaint).trim(),
    duration: text(body.duration),
    location: text(body.location),
    sensation: text(body.sensation),
    modalitiesBetter: text(body.modalitiesBetter),
    modalitiesWorse: text(body.modalitiesWorse),
    concomitants: text(body.concomitants),
    causation: text(body.causation),
    history: text(body.history),
    pastHistory: text(body.pastHistory),
    familyHistory: text(body.familyHistory),
    previousTreatment: text(body.previousTreatment),
    menstrual: text(body.menstrual),
    birthHistory: text(body.birthHistory),
    mental: text(body.mental),
    appetite: text(body.appetite),
    thirst: text(body.thirst),
    desires: text(body.desires),
    aversions: text(body.aversions),
    intolerance: text(body.intolerance),
    stool: text(body.stool),
    urine: text(body.urine),
    perspiration: text(body.perspiration),
    sleep: text(body.sleep),
    thermal: text(body.thermal),
    dreams: text(body.dreams),
    particulars: text(body.particulars),
    examination: text(body.examination),
    diagnosis: text(body.diagnosis),
    notes: text(body.notes),
  }
}

function remediesOut(value) {
  if (!value) return []
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  }
  return Array.isArray(value) ? value : []
}

export function prescriptionOut(row) {
  if (!row) return null
  return {
    id: row.id,
    patientId: row.patient_id,
    date: dateOut(row.visit_date),
    remedies: remediesOut(row.remedies),
    advice: text(row.advice),
    diet: text(row.diet),
    nextVisit: dateOut(row.next_visit),
    notes: text(row.notes),
    createdAt: stampOut(row.created_at),
    updatedAt: stampOut(row.updated_at),
  }
}

export function prescriptionIn(body) {
  const remedies = Array.isArray(body.remedies)
    ? body.remedies.map((item) => ({
      id: text(item.id) || crypto.randomUUID(),
      name: text(item.name).trim(),
      potency: text(item.potency),
      form: text(item.form),
      dose: text(item.dose),
      repetition: text(item.repetition),
      duration: text(item.duration),
      instructions: text(item.instructions),
    })).filter((item) => item.name)
    : []
  return {
    patientId: body.patientId,
    date: dateIn(body.date),
    remedies,
    advice: text(body.advice),
    diet: text(body.diet),
    nextVisit: dateIn(body.nextVisit),
    notes: text(body.notes),
  }
}

export function followOut(row) {
  if (!row) return null
  return {
    id: row.id,
    patientId: row.patient_id,
    date: dateOut(row.visit_date),
    response: text(row.response),
    adherence: text(row.adherence),
    complaints: text(row.complaints),
    changes: text(row.changes),
    newSymptoms: text(row.new_symptoms),
    reaction: text(row.reaction),
    observations: text(row.observations),
    assessment: text(row.assessment),
    plan: text(row.plan),
    nextVisit: dateOut(row.next_visit),
    createdAt: stampOut(row.created_at),
    updatedAt: stampOut(row.updated_at),
  }
}

export function followIn(body) {
  return {
    patientId: body.patientId,
    date: dateIn(body.date),
    response: text(body.response).trim(),
    adherence: text(body.adherence),
    complaints: text(body.complaints),
    changes: text(body.changes),
    newSymptoms: text(body.newSymptoms),
    reaction: text(body.reaction),
    observations: text(body.observations),
    assessment: text(body.assessment),
    plan: text(body.plan),
    nextVisit: dateIn(body.nextVisit),
  }
}

export function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}
