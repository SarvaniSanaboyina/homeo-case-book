import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDate } from '../format'
import { FOLLOW_SECTIONS, emptyForm, formFromRecord, readForm, validate } from '../schema'
import { latestPrescription, patientById } from '../selectors'
import { createFollowUp, deleteFollowUp, updateFollowUp, useClinic } from '../store'
import { Back, Fields, FormError, Missing, PageHeader, SaveBar } from '../components/ui'

export default function FollowUpForm() {
  const { patientId, recordId = 'new' } = useParams()
  return <FollowUpInner key={`${patientId}-${recordId}`} />
}

function FollowUpInner() {
  const { patientId, recordId } = useParams()
  const db = useClinic()
  const navigate = useNavigate()
  const patient = patientById(db, patientId)
  const existing = recordId ? db.followUps.find((item) => item.id === recordId && item.patientId === patientId) : null
  const [form, setForm] = useState(() => (existing ? formFromRecord(FOLLOW_SECTIONS, existing) : emptyForm(FOLLOW_SECTIONS)))
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const errorRef = useRef(null)
  const backTo = `/patients/${patientId}`
  const previous = latestPrescription(db, patientId)

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'nearest' })
  }, [error])

  if (!patient) return <Missing title="Patient not found" />
  if (recordId && !existing) {
    return <Missing title="Follow-up not found" to={backTo} action="Back to patient" />
  }

  function onChange(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    const problem = validate(FOLLOW_SECTIONS, form)
    if (problem) {
      setError(problem.error)
      document.getElementById(problem.key)?.focus()
      return
    }
    const data = { ...readForm(FOLLOW_SECTIONS, form), patientId }
    try {
      if (existing) {
        await updateFollowUp(existing.id, data)
        navigate(backTo, { state: { notice: 'Follow-up updated.' } })
      } else {
        await createFollowUp(data)
        navigate(backTo, { state: { notice: 'Follow-up saved.' } })
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function onDelete() {
    try {
      await deleteFollowUp(existing.id)
      navigate(backTo, { state: { notice: 'Follow-up deleted.' } })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="sheet" onSubmit={onSubmit} autoComplete="off" noValidate>
      <Back to={backTo}>← {patient.name}</Back>
      <PageHeader
        eyebrow={patient.regNo}
        title={existing ? 'Edit follow-up' : 'New follow-up'}
        lede="Record what changed, how the last medicine was taken, and what you plan to do."
      />
      <FormError error={error} errorRef={errorRef} />
      {previous ? (
        <aside className="context">
          <span>Latest prescription · {formatDate(previous.date)}</span>
          <strong>
            {(previous.remedies || []).map((item) => [item.name, item.potency].filter(Boolean).join(' ')).filter(Boolean).join(', ') || 'No medicine named'}
          </strong>
        </aside>
      ) : null}
      <Fields sections={FOLLOW_SECTIONS} form={form} onChange={onChange} />
      <SaveBar
        label="Save follow-up"
        cancelTo={backTo}
        confirm={confirm}
        onAskDelete={existing ? () => setConfirm(true) : undefined}
        onDelete={onDelete}
        onKeep={() => setConfirm(false)}
        deleteLabel="Delete follow-up"
      />
    </form>
  )
}
