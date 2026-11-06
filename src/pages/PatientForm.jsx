import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PATIENT_SECTIONS, emptyForm, formFromRecord, readForm, validate } from '../schema'
import { patientById } from '../selectors'
import { createPatient, deletePatient, updatePatient, useClinic } from '../store'
import { Back, Fields, FormError, Missing, PageHeader, SaveBar } from '../components/ui'

export default function PatientForm() {
  const { patientId = 'new' } = useParams()
  return <PatientFormInner key={patientId} />
}

function PatientFormInner() {
  const { patientId } = useParams()
  const db = useClinic()
  const navigate = useNavigate()
  const existing = patientId ? patientById(db, patientId) : null
  const [form, setForm] = useState(() => (existing ? formFromRecord(PATIENT_SECTIONS, existing) : emptyForm(PATIENT_SECTIONS)))
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const errorRef = useRef(null)

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'nearest' })
  }, [error])

  if (patientId && !existing) return <Missing title="Patient not found" />

  function onChange(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    const problem = validate(PATIENT_SECTIONS, form)
    if (problem) {
      setError(problem.error)
      document.getElementById(problem.key)?.focus()
      return
    }
    const data = readForm(PATIENT_SECTIONS, form)
    try {
      if (existing) {
        await updatePatient(existing.id, data)
        navigate(`/patients/${existing.id}`, { state: { notice: 'Registration updated.' } })
      } else {
        const patient = await createPatient(data)
        navigate(`/patients/${patient.id}`, {
          state: { notice: 'Patient registered. You can log a case sheet, prescription, or follow-up next.' },
        })
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function onDelete() {
    try {
      await deletePatient(existing.id)
      navigate('/patients', { state: { notice: `${existing.name} and their records were removed.` } })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="sheet" onSubmit={onSubmit} noValidate>
      <Back to={existing ? `/patients/${existing.id}` : '/patients'}>
        {existing ? `← ${existing.name}` : '← Patients'}
      </Back>
      <PageHeader
        eyebrow={existing ? existing.regNo : 'New registration'}
        title={existing ? 'Edit patient' : 'Register patient'}
        lede="Name is required. Everything else can wait until you know it."
      />
      <FormError error={error} errorRef={errorRef} />
      <Fields sections={PATIENT_SECTIONS} form={form} onChange={onChange} />
      <SaveBar label={existing ? 'Save registration' : 'Register patient'} cancelTo={existing ? `/patients/${existing.id}` : '/patients'} />
      {existing ? (
        <section className="danger-zone no-print">
          <h2>Remove patient</h2>
          <p>This deletes the registration and every case sheet, prescription, and follow-up attached to it.</p>
          {confirm ? (
            <div className="page-actions">
              <button className="btn danger" type="button" onClick={onDelete}>Delete patient</button>
              <button className="btn secondary" type="button" onClick={() => setConfirm(false)}>Keep patient</button>
            </div>
          ) : (
            <button className="btn ghost danger-text" type="button" onClick={() => setConfirm(true)}>Delete this patient</button>
          )}
        </section>
      ) : null}
    </form>
  )
}
