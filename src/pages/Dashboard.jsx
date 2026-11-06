import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { dueLabel, formatDate, formatWeekday, snippet, todayISO } from '../format'
import { dueVisits, recentEntries, visitsThisMonth } from '../selectors'
import { clearAll, exportBackup, importBackup, loadExample, useClinic } from '../store'
import { Notice, PageHeader } from '../components/ui'

const KIND = {
  case: 'Case sheet',
  rx: 'Prescription',
  follow: 'Follow-up',
}

export default function Dashboard() {
  const db = useClinic()
  const location = useLocation()
  const due = dueVisits(db)
  const recent = recentEntries(db).slice(0, 7)
  const today = todayISO()
  const [message, setMessage] = useState('')
  const [pendingImport, setPendingImport] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const exampleLock = useRef(false)

  async function addExample() {
    if (exampleLock.current) return
    exampleLock.current = true
    try {
      await loadExample()
      setMessage('Example patient added. You can delete it from the patient page.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      window.setTimeout(() => {
        exampleLock.current = false
      }, 400)
    }
  }

  async function onFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      setPendingImport(await file.text())
      setConfirmClear(false)
      setMessage('')
    } catch {
      setMessage('Could not read that file.')
    }
  }

  async function runImport() {
    const result = await importBackup(pendingImport)
    setPendingImport('')
    setMessage(result.ok ? 'Backup imported. It replaced the records in Neon.' : result.error)
  }

  async function runClear() {
    try {
      await clearAll()
      setConfirmClear(false)
      setMessage('All records in Neon were erased.')
      exampleLock.current = false
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <>
      <PageHeader
        documentTitle="Today"
        eyebrow="Case book"
        title={formatWeekday(today)}
        lede="Register a patient, then keep the case sheet, prescriptions, and follow-ups in one place."
        actions={<Link className="btn primary" to="/patients/new">Register patient</Link>}
      />
      <Notice>{location.state?.notice}</Notice>
      <Notice>{message}</Notice>

      {db.patients.length === 0 ? (
        <section className="hero-empty">
          <h2>The book is empty</h2>
          <p>Register the first patient, or load an example to see a case sheet, a prescription, and a follow-up together.</p>
          <div className="page-actions">
            <Link className="btn primary" to="/patients/new">Register a patient</Link>
            <button className="btn secondary" type="button" onClick={addExample}>Load an example</button>
          </div>
        </section>
      ) : (
        <>
          <section className="stats" aria-label="Record counts">
            <Stat label="Patients" value={db.patients.length} />
            <Stat label="Case sheets" value={db.caseSheets.length} />
            <Stat label="Prescriptions" value={db.prescriptions.length} />
            <Stat label="Follow-ups" value={db.followUps.length} />
          </section>
          <p className="quiet stat-note">{visitsThisMonth(db)} {visitsThisMonth(db) === 1 ? 'entry' : 'entries'} dated this month</p>

          <div className="split">
            <section className="panel">
              <h2>Coming up</h2>
              {due.length === 0 ? <p className="quiet">No overdue visits, and nothing due in the next 30 days.</p> : null}
              {due.slice(0, 8).map((item) => {
                const overdue = item.nextVisit < today
                return (
                  <Link key={item.record.id} className="list-row" to={`/patients/${item.patient.id}`}>
                    <span>
                      <strong>{item.patient.name}</strong>
                      <small>{item.patient.regNo}</small>
                    </span>
                    <span className={overdue ? 'when overdue' : 'when soon'}>
                      {dueLabel(item.nextVisit)}
                      <small>{formatDate(item.nextVisit)}</small>
                    </span>
                  </Link>
                )
              })}
            </section>

            <section className="panel">
              <h2>Recent entries</h2>
              {recent.length === 0 ? <p className="quiet">Case sheets, prescriptions, and follow-ups will show up here.</p> : null}
              {recent.map((item) => (
                <Link key={item.record.id} className="list-row" to={`/patients/${item.patient.id}#record-${item.record.id}`}>
                  <span>
                    <strong>{entryTitle(item.kind, item.record)}</strong>
                    <small>{item.patient.name}</small>
                  </span>
                  <span className="when">
                    {KIND[item.kind]}
                    <small>{formatDate(item.record.date)}</small>
                  </span>
                </Link>
              ))}
            </section>
          </div>
        </>
      )}

      <section className="section backup">
        <h2>Backup</h2>
        <p className="intro">Records live in Neon Postgres. Export a JSON copy, or import a file you saved earlier. Importing replaces every record in the database.</p>
        <div className="page-actions">
          <button className="btn secondary" type="button" onClick={() => exportBackup().catch((error) => setMessage(error.message))} disabled={db.patients.length === 0 && db.caseSheets.length === 0}>
            Export backup
          </button>
          <label className="btn secondary">
            Import backup
            <input type="file" accept="application/json,.json" onChange={onFile} />
          </label>
          {db.patients.length > 0 ? (
            <button className="btn ghost" type="button" onClick={addExample}>Add example patient</button>
          ) : null}
          <button className="btn ghost danger-text" type="button" onClick={() => { setConfirmClear(true); setPendingImport('') }} disabled={db.patients.length === 0}>
            Erase the database
          </button>
        </div>
        {pendingImport ? (
          <div className="confirm-box">
            <p>Replace every record in Neon with this backup?</p>
            <div className="page-actions">
              <button className="btn danger" type="button" onClick={runImport}>Replace records</button>
              <button className="btn secondary" type="button" onClick={() => setPendingImport('')}>Cancel</button>
            </div>
          </div>
        ) : null}
        {confirmClear ? (
          <div className="confirm-box">
            <p>Erase every patient, case sheet, prescription, and follow-up stored in Neon?</p>
            <div className="page-actions">
              <button className="btn danger" type="button" onClick={runClear}>Erase everything</button>
              <button className="btn secondary" type="button" onClick={() => setConfirmClear(false)}>Cancel</button>
            </div>
          </div>
        ) : null}
      </section>
    </>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function entryTitle(kind, record) {
  if (kind === 'case') return snippet(record.chiefComplaint, 72) || 'Case sheet'
  if (kind === 'rx') {
    const names = (record.remedies || []).map((item) => item.name).filter(Boolean)
    return names.join(', ') || 'Prescription'
  }
  return record.response || snippet(record.complaints, 72) || 'Follow-up'
}
