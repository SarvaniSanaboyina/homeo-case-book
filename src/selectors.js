import { addDays, todayISO } from './format'

export function patientById(db, id) {
  return db.patients.find((patient) => patient.id === id) || null
}

export function bundleFor(db, patientId) {
  const byDate = (a, b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt))
  return {
    patient: patientById(db, patientId),
    caseSheets: db.caseSheets.filter((item) => item.patientId === patientId).sort(byDate),
    prescriptions: db.prescriptions.filter((item) => item.patientId === patientId).sort(byDate),
    followUps: db.followUps.filter((item) => item.patientId === patientId).sort(byDate),
  }
}

export function countsFor(db, patientId) {
  return {
    cases: db.caseSheets.filter((item) => item.patientId === patientId).length,
    prescriptions: db.prescriptions.filter((item) => item.patientId === patientId).length,
    followUps: db.followUps.filter((item) => item.patientId === patientId).length,
  }
}

export function lastVisitDate(db, patientId) {
  const dates = [...db.caseSheets, ...db.prescriptions, ...db.followUps]
    .filter((item) => item.patientId === patientId && item.date)
    .map((item) => item.date)
    .sort()
  return dates.at(-1) || ''
}

export function latestCase(db, patientId) {
  return db.caseSheets
    .filter((item) => item.patientId === patientId)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null
}

export function latestPrescription(db, patientId) {
  return db.prescriptions
    .filter((item) => item.patientId === patientId)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)))[0] || null
}

function latestPlanned(db, patientId) {
  const rows = [...db.prescriptions, ...db.followUps].filter((item) => item.patientId === patientId && item.nextVisit)
  rows.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.createdAt).localeCompare(String(b.createdAt)))
  return rows.at(-1) || null
}

export function dueVisits(db) {
  const horizon = addDays(todayISO(), 30)
  const items = []
  for (const patient of db.patients) {
    const planned = latestPlanned(db, patient.id)
    if (!planned) continue
    const cameLater = [...db.caseSheets, ...db.prescriptions, ...db.followUps].some(
      (item) => item.patientId === patient.id && item.id !== planned.id && item.date && item.date > planned.date,
    )
    if (cameLater) continue
    if (planned.nextVisit > horizon) continue
    items.push({ patient, record: planned, nextVisit: planned.nextVisit })
  }
  items.sort((a, b) => a.nextVisit.localeCompare(b.nextVisit))
  return items
}

export function recentEntries(db) {
  const patients = new Map(db.patients.map((patient) => [patient.id, patient]))
  const items = [
    ...db.caseSheets.map((record) => ({ kind: 'case', record, patient: patients.get(record.patientId) })),
    ...db.prescriptions.map((record) => ({ kind: 'rx', record, patient: patients.get(record.patientId) })),
    ...db.followUps.map((record) => ({ kind: 'follow', record, patient: patients.get(record.patientId) })),
  ].filter((item) => item.patient)
  items.sort((a, b) => String(b.record.date).localeCompare(String(a.record.date)) || String(b.record.createdAt).localeCompare(String(a.record.createdAt)))
  return items
}

export function visitsThisMonth(db) {
  const prefix = todayISO().slice(0, 7)
  return [...db.caseSheets, ...db.prescriptions, ...db.followUps].filter((item) => String(item.date || '').startsWith(prefix)).length
}
