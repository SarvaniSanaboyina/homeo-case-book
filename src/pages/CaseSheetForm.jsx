import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CASE_SECTIONS, emptyForm, formFromRecord, readForm, validate } from '../schema'
import { patientById } from '../selectors'
import { createCaseSheet, deleteCaseSheet, updateCaseSheet, useClinic } from '../store'
import { Back, Fields, FormError, Missing, PageHeader, SaveBar } from '../components/ui'

export default function CaseSheetForm() {
  const { patientId, recordId = 'new' } = useParams()
  return <CaseSheetInner key={`${patientId}-${recordId}`} />
}

function CaseSheetInner() {
  const { patientId, recordId } = useParams()
  const db = useClinic()
  const navigate = useNavigate()
  const patient = patientById(db, patientId)
  const existing = recordId ? db.caseSheets.find((item) => item.id === recordId && item.patientId === patientId) : null
  const [form, setForm] = useState(() => (existing ? formFromRecord(CASE_SECTIONS, existing) : emptyForm(CASE_SECTIONS)))
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const errorRef = useRef(null)
  const backTo = `/patients/${patientId}`

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'nearest' })
  }, [error])

  if (!patient) return <Missing title="Patient not found" />
  if (recordId && !existing) {
    return <Missing title="Case sheet not found" to={backTo} action="Back to patient" />
  }

  function onChange(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    const problem = validate(CASE_SECTIONS, form)
    if (problem) {
      setError(problem.error)
      document.getElementById(problem.key)?.focus()
      return
    }
    const data = { ...readForm(CASE_SECTIONS, form), patientId }
    try {
      if (existing) {
        await updateCaseSheet(existing.id, data)
        navigate(backTo, { state: { notice: 'Case sheet updated.' } })
      } else {
        await createCaseSheet(data)
        navigate(backTo, { state: { notice: 'Case sheet saved. Log a prescription if you gave one at this visit.' } })
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function onDelete() {
    try {
      await deleteCaseSheet(existing.id)
      navigate(backTo, { state: { notice: 'Case sheet deleted.' } })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="sheet" onSubmit={onSubmit} autoComplete="off" noValidate>
      <Back to={backTo}>← {patient.name}</Back>
      <PageHeader
        eyebrow={patient.regNo}
        title={existing ? 'Edit case sheet' : 'New case sheet'}
        lede="Write the case as you took it. The remedy itself goes in a prescription."
      />
      <FormError error={error} errorRef={errorRef} />
      <Fields sections={CASE_SECTIONS} form={form} onChange={onChange} />
      <SaveBar
        label="Save case sheet"
        cancelTo={backTo}
        confirm={confirm}
        onAskDelete={existing ? () => setConfirm(true) : undefined}
        onDelete={onDelete}
        onKeep={() => setConfirm(false)}
        deleteLabel="Delete case sheet"
      />
    </form>
  )
}
