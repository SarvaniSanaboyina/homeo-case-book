import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { todayISO } from './format'

const ClinicContext = createContext(null)
const emptyDb = { patients: [], caseSheets: [], prescriptions: [], followUps: [] }
const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api')

let refreshClinic = async () => emptyDb

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (response.status === 204) return null
  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }
  if (!response.ok) {
    throw new Error(payload?.error || 'The server could not complete that.')
  }
  return payload
}

async function after(path, options) {
  const result = await request(path, options)
  await refreshClinic()
  return result
}

export function ClinicProvider({ children }) {
  const [db, setDb] = useState(emptyDb)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const next = await request('/clinic')
    setDb(next)
    setStatus('ready')
    setError('')
    return next
  }, [])

  useEffect(() => {
    refreshClinic = refresh
    refresh().catch((err) => {
      setStatus('error')
      setError(err.message)
    })
    return () => {
      if (refreshClinic === refresh) refreshClinic = async () => emptyDb
    }
  }, [refresh])

  const value = useMemo(() => ({ db, status, error, refresh }), [db, status, error, refresh])
  return createElement(ClinicContext.Provider, { value }, children)
}

function useClinicContext() {
  const value = useContext(ClinicContext)
  if (!value) throw new Error('ClinicProvider is missing.')
  return value
}

export function useClinic() {
  return useClinicContext().db
}

export function useClinicStatus() {
  const { status, error, refresh } = useClinicContext()
  return { status, error, refresh }
}

export function createPatient(input) {
  return after('/patients', { method: 'POST', body: input })
}

export function updatePatient(id, input) {
  return after(`/patients/${id}`, { method: 'PATCH', body: input })
}

export function deletePatient(id) {
  return after(`/patients/${id}`, { method: 'DELETE' })
}

export function createCaseSheet(input) {
  return after(`/patients/${input.patientId}/cases`, { method: 'POST', body: input })
}

export function updateCaseSheet(id, input) {
  return after(`/cases/${id}`, { method: 'PATCH', body: input })
}

export function deleteCaseSheet(id) {
  return after(`/cases/${id}`, { method: 'DELETE' })
}

export function createPrescription(input) {
  return after(`/patients/${input.patientId}/prescriptions`, { method: 'POST', body: input })
}

export function updatePrescription(id, input) {
  return after(`/prescriptions/${id}`, { method: 'PATCH', body: input })
}

export function deletePrescription(id) {
  return after(`/prescriptions/${id}`, { method: 'DELETE' })
}

export function createFollowUp(input) {
  return after(`/patients/${input.patientId}/follow-ups`, { method: 'POST', body: input })
}

export function updateFollowUp(id, input) {
  return after(`/follow-ups/${id}`, { method: 'PATCH', body: input })
}

export function deleteFollowUp(id) {
  return after(`/follow-ups/${id}`, { method: 'DELETE' })
}

export async function importBackup(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.patients)) {
    return { ok: false, error: 'This file does not look like a Homeo backup.' }
  }
  try {
    await after('/clinic/import', { method: 'POST', body: parsed })
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

export async function exportBackup() {
  const data = await request('/clinic')
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `homeo-backup-${todayISO()}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function clearAll() {
  return after('/clinic', { method: 'DELETE' })
}

export function loadExample() {
  return after('/clinic/example', { method: 'POST' })
}
