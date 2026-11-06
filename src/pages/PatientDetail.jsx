import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { formatDate, formatPhone, personLine } from '../format'
import { CASE_SECTIONS, FOLLOW_SECTIONS } from '../schema'
import { bundleFor } from '../selectors'
import { useClinic } from '../store'
import { Lines, Missing, Notice, PageHeader, recordSections } from '../components/ui'

const FILTERS = [
  ['all', 'All'],
  ['case', 'Case sheets'],
  ['rx', 'Prescriptions'],
  ['follow', 'Follow-ups'],
]

export default function PatientDetail() {
  const { patientId } = useParams()
  const db = useClinic()
  const location = useLocation()
  const [filter, setFilter] = useState('all')
  const { patient, caseSheets, prescriptions, followUps } = bundleFor(db, patientId)

  useEffect(() => {
    const id = location.hash.replace('#', '')
    if (!id) return
    setFilter('all')
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [location.hash])

  if (!patient) return <Missing title="Patient not found" />

  const feed = [
    ...caseSheets.map((record) => ({ kind: 'case', record })),
    ...prescriptions.map((record) => ({ kind: 'rx', record })),
    ...followUps.map((record) => ({ kind: 'follow', record })),
  ].sort((a, b) => String(b.record.date).localeCompare(String(a.record.date)) || String(b.record.createdAt).localeCompare(String(a.record.createdAt)))

  const shown = feed.filter((item) => filter === 'all' || item.kind === filter)
  const counts = { all: feed.length, case: caseSheets.length, rx: prescriptions.length, follow: followUps.length }
  const identity = [personLine(patient), patient.occupation, patient.city].filter(Boolean).join(' · ')

  return (
    <>
      <Link className="back no-print" to="/patients">← Patients</Link>
      <PageHeader
        eyebrow={patient.regNo}
        title={patient.name}
        lede={identity || 'Registration has a name only so far.'}
        actions={(
          <>
            <Link className="btn secondary" to={`/patients/${patient.id}/edit`}>Edit registration</Link>
            <button className="btn secondary" type="button" onClick={() => window.print()}>Print chart</button>
          </>
        )}
      />
      <Notice>{location.state?.notice}</Notice>
      {patient.allergies ? <p className="alert">Sensitivities: {patient.allergies}</p> : null}

      <section className="section">
        <h2>Registration</h2>
        <Lines
          rows={[
            ['Phone', formatPhone(patient.phone)],
            ['Alternate phone', formatPhone(patient.altPhone)],
            ['Email', patient.email],
            ['Address', patient.address],
            ['City', patient.city],
            ['Occupation', patient.occupation],
            ['Marital status', patient.maritalStatus],
            ['Blood group', patient.bloodGroup],
            ['Referred by', patient.referredBy],
            ['Guardian', [patient.emergencyName, formatPhone(patient.emergencyPhone)].filter(Boolean).join(' · ')],
            ['Date of birth', formatDate(patient.dob)],
            ['Approximate age', patient.dob || !patient.ageYears ? '' : `${patient.ageYears} years`],
            ['Registered', formatDate(patient.createdAt)],
            ['Notes', patient.notes],
          ]}
        />
      </section>

      <div className="action-row no-print">
        <Link className="btn primary" to={`/patients/${patient.id}/cases/new`}>Log case sheet</Link>
        <Link className="btn secondary" to={`/patients/${patient.id}/prescriptions/new`}>Log prescription</Link>
        <Link className="btn secondary" to={`/patients/${patient.id}/follow-ups/new`}>Log follow-up</Link>
      </div>

      <div className="filters no-print" role="tablist" aria-label="Record types">
        {FILTERS.map(([key, label]) => (
          <button key={key} type="button" className={filter === key ? 'on' : ''} aria-pressed={filter === key} onClick={() => setFilter(key)}>
            {label} {counts[key]}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <section className="hero-empty">
          <h2>{feed.length === 0 ? 'No visits yet' : 'Nothing in this filter'}</h2>
          <p>{feed.length === 0 ? 'Start with a case sheet, or log a prescription or follow-up on its own.' : 'Choose another record type, or show all.'}</p>
        </section>
      ) : null}

      {shown.map((item) => {
        if (item.kind === 'case') return <CaseCard key={item.record.id} patientId={patient.id} record={item.record} />
        if (item.kind === 'rx') return <RxCard key={item.record.id} patientId={patient.id} record={item.record} />
        return <FollowCard key={item.record.id} patientId={patient.id} record={item.record} />
      })}
    </>
  )
}

function CaseCard({ patientId, record }) {
  const sections = recordSections(CASE_SECTIONS, record, ['date', 'chiefComplaint'])
  return (
    <article className="record" id={`record-${record.id}`}>
      <header className="record-top">
        <span className="tag case">Case sheet</span>
        <time dateTime={record.date}>{formatDate(record.date)}</time>
        <Link className="btn secondary small no-print" to={`/patients/${patientId}/cases/${record.id}`}>Edit</Link>
      </header>
      <h3>{record.chiefComplaint || 'Case sheet'}</h3>
      {sections.map((section) => (
        <div key={section.title}>
          <h4>{section.title}</h4>
          <Lines rows={section.rows} />
        </div>
      ))}
    </article>
  )
}

function RxCard({ patientId, record }) {
  return (
    <article className="record" id={`record-${record.id}`}>
      <header className="record-top">
        <span className="tag rx">Prescription</span>
        <time dateTime={record.date}>{formatDate(record.date)}</time>
        <Link className="btn secondary small no-print" to={`/patients/${patientId}/prescriptions/${record.id}`}>Edit</Link>
      </header>
      {(record.remedies || []).length === 0 ? <p className="quiet">No medicines listed.</p> : (
        <div className="table-wrap">
          <table className="rx-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Potency</th>
                <th>Form</th>
                <th>Dose</th>
                <th>Repetition</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              {(record.remedies || []).map((remedy) => (
                <tr key={remedy.id || remedy.name}>
                  <td>{remedy.name || '—'}</td>
                  <td>{remedy.potency || '—'}</td>
                  <td>{remedy.form || '—'}</td>
                  <td>{remedy.dose || '—'}</td>
                  <td>{remedy.repetition || '—'}</td>
                  <td>{remedy.duration || '—'}</td>
                  <td>{remedy.instructions || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Lines
        rows={[
          ['Advice', record.advice],
          ['Diet and routine', record.diet],
          ['Next visit', formatDate(record.nextVisit)],
          ['Notes', record.notes],
        ]}
      />
    </article>
  )
}

function FollowCard({ patientId, record }) {
  const tone = {
    Improved: 'good',
    'Partial improvement': 'good',
    'No change': 'flat',
    Worse: 'bad',
    Aggravation: 'bad',
  }[record.response] || 'flat'
  const sections = recordSections(FOLLOW_SECTIONS, record, ['date', 'response', 'adherence'])
  return (
    <article className="record" id={`record-${record.id}`}>
      <header className="record-top">
        <span className="tag follow">Follow-up</span>
        {record.response ? <span className={`tag ${tone}`}>{record.response}</span> : null}
        <time dateTime={record.date}>{formatDate(record.date)}</time>
        <Link className="btn secondary small no-print" to={`/patients/${patientId}/follow-ups/${record.id}`}>Edit</Link>
      </header>
      {record.adherence ? <p className="quiet">Medicine taken: {record.adherence}</p> : null}
      {sections.map((section) => (
        <div key={section.title}>
          <h4>{section.title}</h4>
          <Lines rows={section.rows} />
        </div>
      ))}
    </article>
  )
}
