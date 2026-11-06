import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDate, todayISO } from '../format'
import { latestCase, patientById } from '../selectors'
import { createPrescription, deletePrescription, updatePrescription, useClinic } from '../store'
import { Back, Field, FormError, Missing, PageHeader, SaveBar } from '../components/ui'

const POTENCIES = ['Q', '6X', '12X', '30X', '6C', '30C', '200C', '1M', '10M', '50M', 'CM', 'LM1', 'LM2', 'LM3', 'LM6']
const FORMS = ['Pills', 'Globules', 'Drops', 'Mother tincture', 'Powder', 'Ointment']
const REPETITIONS = ['Single dose', 'OD', 'BD', 'TDS', 'QID', 'Weekly', 'Alternate days', 'SOS']

function blankRemedy() {
  return {
    id: crypto.randomUUID(),
    name: '',
    potency: '',
    form: '',
    dose: '',
    repetition: '',
    duration: '',
    instructions: '',
  }
}

function blankForm() {
  return { date: todayISO(), advice: '', diet: '', nextVisit: '', notes: '', remedies: [blankRemedy()] }
}

function fromRecord(record) {
  return {
    date: record.date || todayISO(),
    advice: record.advice || '',
    diet: record.diet || '',
    nextVisit: record.nextVisit || '',
    notes: record.notes || '',
    remedies: record.remedies?.length
    ? record.remedies.map((item) => ({ ...blankRemedy(), ...item, id: item.id || crypto.randomUUID() }))
    : [blankRemedy()],
  }
}

export default function PrescriptionForm() {
  const { patientId, recordId = 'new' } = useParams()
  return <PrescriptionInner key={`${patientId}-${recordId}`} />
}

function PrescriptionInner() {
  const { patientId, recordId } = useParams()
  const db = useClinic()
  const navigate = useNavigate()
  const patient = patientById(db, patientId)
  const existing = recordId ? db.prescriptions.find((item) => item.id === recordId && item.patientId === patientId) : null
  const [form, setForm] = useState(() => (existing ? fromRecord(existing) : blankForm()))
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const errorRef = useRef(null)
  const backTo = `/patients/${patientId}`
  const lastCase = latestCase(db, patientId)

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'nearest' })
  }, [error])

  if (!patient) return <Missing title="Patient not found" />
  if (recordId && !existing) {
    return <Missing title="Prescription not found" to={backTo} action="Back to patient" />
  }

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function setRemedy(id, key, value) {
    setForm((current) => ({
      ...current,
      remedies: current.remedies.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }))
  }

  function addRemedy() {
    setForm((current) => ({ ...current, remedies: [...current.remedies, blankRemedy()] }))
  }

  function removeRemedy(id) {
    setForm((current) => {
      const remedies = current.remedies.filter((item) => item.id !== id)
      return { ...current, remedies: remedies.length ? remedies : [blankRemedy()] }
    })
  }

  async function onSubmit(event) {
    event.preventDefault()
    if (!form.date) {
      setError('Choose the date of this prescription.')
      document.getElementById('date')?.focus()
      return
    }
    if (form.date > todayISO()) {
      setError('Prescription date cannot be in the future.')
      document.getElementById('date')?.focus()
      return
    }
    const remedies = form.remedies.map((item) => ({
      id: item.id,
      name: item.name.trim(),
      potency: item.potency.trim(),
      form: item.form.trim(),
      dose: item.dose.trim(),
      repetition: item.repetition.trim(),
      duration: item.duration.trim(),
      instructions: item.instructions.trim(),
    })).filter((item) => Object.entries(item).some(([key, value]) => key !== 'id' && value))

    if (remedies.some((item) => !item.name)) {
      setError('Name each medicine. Remove any row you do not need.')
      return
    }
    if (!remedies.length) {
      setError('Add at least one medicine.')
      document.getElementById('remedy-name-0')?.focus()
      return
    }

    const data = {
      patientId,
      date: form.date,
      advice: form.advice.trim(),
      diet: form.diet.trim(),
      nextVisit: form.nextVisit,
      notes: form.notes.trim(),
      remedies,
    }
    try {
      if (existing) {
        await updatePrescription(existing.id, data)
        navigate(backTo, { state: { notice: 'Prescription updated.' } })
      } else {
        await createPrescription(data)
        navigate(backTo, { state: { notice: 'Prescription saved.' } })
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function onDelete() {
    try {
      await deletePrescription(existing.id)
      navigate(backTo, { state: { notice: 'Prescription deleted.' } })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="sheet" onSubmit={onSubmit} autoComplete="off" noValidate>
      <datalist id="potencies">
        {POTENCIES.map((item) => <option key={item} value={item} />)}
      </datalist>
      <datalist id="forms">
        {FORMS.map((item) => <option key={item} value={item} />)}
      </datalist>
      <datalist id="repetitions">
        {REPETITIONS.map((item) => <option key={item} value={item} />)}
      </datalist>

      <Back to={backTo}>← {patient.name}</Back>
      <PageHeader
        eyebrow={patient.regNo}
        title={existing ? 'Edit prescription' : 'New prescription'}
        lede="Record only what you dispensed or advised. This book does not choose a remedy."
      />
      <FormError error={error} errorRef={errorRef} />
      {lastCase ? (
        <aside className="context">
          <span>Latest case sheet · {formatDate(lastCase.date)}</span>
          <strong>{lastCase.chiefComplaint}</strong>
        </aside>
      ) : null}

      <section className="section">
        <h2>Medicines</h2>
        <p className="intro">Add a row for each medicine. Potency, dose, and repetition can be typed or chosen from the suggestions.</p>
        {form.remedies.map((remedy, index) => (
          <div className="remedy" key={remedy.id}>
            <div className="remedy-top">
              <h3>Medicine {index + 1}</h3>
              <button className="btn ghost danger-text" type="button" onClick={() => removeRemedy(remedy.id)}>
                Remove
              </button>
            </div>
            <div className="grid-2">
              <Field label="Name" required className="span-2">
                <input
                  id={index === 0 ? 'remedy-name-0' : undefined}
                  value={remedy.name}
                  maxLength={160}
                  placeholder="Medicine name"
                  onChange={(event) => setRemedy(remedy.id, 'name', event.target.value)}
                />
              </Field>
              <Field label="Potency">
                <input list="potencies" value={remedy.potency} maxLength={40} placeholder="30C, 200C, LM1…" onChange={(event) => setRemedy(remedy.id, 'potency', event.target.value)} />
              </Field>
              <Field label="Form">
                <input list="forms" value={remedy.form} maxLength={40} placeholder="Pills, drops…" onChange={(event) => setRemedy(remedy.id, 'form', event.target.value)} />
              </Field>
              <Field label="Dose">
                <input value={remedy.dose} maxLength={80} placeholder="4 pills, 2 drops…" onChange={(event) => setRemedy(remedy.id, 'dose', event.target.value)} />
              </Field>
              <Field label="Repetition">
                <input list="repetitions" value={remedy.repetition} maxLength={80} placeholder="Single dose, BD, SOS…" onChange={(event) => setRemedy(remedy.id, 'repetition', event.target.value)} />
              </Field>
              <Field label="Duration">
                <input value={remedy.duration} maxLength={80} placeholder="7 days, once" onChange={(event) => setRemedy(remedy.id, 'duration', event.target.value)} />
              </Field>
              <Field label="Instructions" className="span-2">
                <textarea rows={2} value={remedy.instructions} maxLength={500} onChange={(event) => setRemedy(remedy.id, 'instructions', event.target.value)} />
              </Field>
            </div>
          </div>
        ))}
        <button className="btn secondary" type="button" onClick={addRemedy}>Add another medicine</button>
      </section>

      <section className="section">
        <h2>With the prescription</h2>
        <div className="grid-2">
          <Field label="Date" required>
            <input id="date" type="date" value={form.date} onChange={(event) => setField('date', event.target.value)} />
          </Field>
          <Field label="Next visit" hint="Shows on Today until a later visit is logged.">
            <input type="date" value={form.nextVisit} onChange={(event) => setField('nextVisit', event.target.value)} />
          </Field>
          <Field label="Advice" className="span-2">
            <textarea rows={3} value={form.advice} maxLength={2000} onChange={(event) => setField('advice', event.target.value)} />
          </Field>
          <Field label="Diet and routine" className="span-2">
            <textarea rows={3} value={form.diet} maxLength={2000} onChange={(event) => setField('diet', event.target.value)} />
          </Field>
          <Field label="Notes" className="span-2">
            <textarea rows={3} value={form.notes} maxLength={2000} onChange={(event) => setField('notes', event.target.value)} />
          </Field>
        </div>
      </section>

      <SaveBar
        label="Save prescription"
        cancelTo={backTo}
        confirm={confirm}
        onAskDelete={existing ? () => setConfirm(true) : undefined}
        onDelete={onDelete}
        onKeep={() => setConfirm(false)}
        deleteLabel="Delete prescription"
      />
    </form>
  )
}
