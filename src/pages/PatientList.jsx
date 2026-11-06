import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { formatDate, formatPhone, personLine } from '../format'
import { countsFor, lastVisitDate } from '../selectors'
import { useClinic } from '../store'
import { Notice, PageHeader } from '../components/ui'
import { SEX_OPTIONS } from '../schema'

export default function PatientList() {
  const db = useClinic()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [sex, setSex] = useState('')
  const [sort, setSort] = useState('recent')

  const patients = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = db.patients.filter((patient) => {
      if (sex && patient.sex !== sex) return false
      if (!q) return true
      return [patient.name, patient.regNo, patient.phone, patient.altPhone, patient.city, patient.occupation, patient.email]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      return String(b.updatedAt).localeCompare(String(a.updatedAt))
    })
    return list
  }, [db, query, sex, sort])

  return (
    <>
      <PageHeader
        eyebrow="Registry"
        title="Patients"
        lede={`${db.patients.length} registered.`}
        actions={<Link className="btn primary" to="/patients/new">Register patient</Link>}
      />
      <Notice>{location.state?.notice}</Notice>

      <div className="toolbar">
        <label className="search">
          <span className="sr-only">Search patients</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, phone, or registration number"
            type="search"
          />
        </label>
        <select aria-label="Filter by sex" value={sex} onChange={(event) => setSex(event.target.value)}>
          <option value="">Any sex</option>
          {SEX_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select aria-label="Sort patients" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="recent">Recently updated</option>
          <option value="name">Name</option>
        </select>
      </div>

      {db.patients.length === 0 ? (
        <section className="hero-empty">
          <h2>No patients yet</h2>
          <p>Registration gives each person a number, then you can log visits against it.</p>
          <Link className="btn primary" to="/patients/new">Register a patient</Link>
        </section>
      ) : patients.length === 0 ? (
        <section className="hero-empty">
          <h2>No one matches</h2>
          <p>Try another name, phone number, or registration number.</p>
          <button className="btn secondary" type="button" onClick={() => { setQuery(''); setSex('') }}>Clear search</button>
        </section>
      ) : (
        <div className="ledger">
          <div className="ledger-head" aria-hidden="true">
            <span>Number</span>
            <span>Patient</span>
            <span>Contact</span>
            <span>Records</span>
            <span>Last visit</span>
          </div>
          {patients.map((patient) => {
            const counts = countsFor(db, patient.id)
            const last = lastVisitDate(db, patient.id)
            return (
              <Link key={patient.id} className="ledger-row" to={`/patients/${patient.id}`}>
                <span className="regno">{patient.regNo}</span>
                <span>
                  <strong>{patient.name}</strong>
                  <small>{personLine(patient) || 'Details not added'}</small>
                </span>
                <span>
                  <strong>{formatPhone(patient.phone) || 'No phone'}</strong>
                  <small>{patient.city || patient.email || '—'}</small>
                </span>
                <span className="records-cell">{recordSummary(counts)}</span>
                <span>
                  <strong>{last ? formatDate(last) : formatDate(patient.createdAt)}</strong>
                  <small>{last ? 'Last visit' : 'Registered'}</small>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

function recordSummary(counts) {
  const parts = []
  if (counts.cases) parts.push(`${counts.cases} case${counts.cases === 1 ? '' : 's'}`)
  if (counts.prescriptions) parts.push(`${counts.prescriptions} Rx`)
  if (counts.followUps) parts.push(`${counts.followUps} follow-up${counts.followUps === 1 ? '' : 's'}`)
  return parts.length ? parts.join(' · ') : 'No visits yet'
}
