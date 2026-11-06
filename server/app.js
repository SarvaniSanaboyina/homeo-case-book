import cors from 'cors'
import express from 'express'
import { databaseHint, databaseReady } from './env.js'
import { ping } from './db.js'
import {
  addExample,
  clearClinic,
  createCaseSheet,
  createFollowUp,
  createPatient,
  createPrescription,
  deleteCaseSheet,
  deleteFollowUp,
  deletePatient,
  deletePrescription,
  loadClinic,
  replaceClinic,
  updateCaseSheet,
  updateFollowUp,
  updatePatient,
  updatePrescription,
} from './clinic.js'

function allowOrigin(origin) {
  if (!origin) return true
  const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  if (allowed.includes('*') || allowed.includes(origin)) return true
  try {
    return new URL(origin).hostname.endsWith('.vercel.app')
  } catch {
    return false
  }
}

const app = express()
app.use(cors({ origin: (origin, callback) => callback(null, allowOrigin(origin)) }))
app.use((req, _res, next) => {
  const currentPath = (req.url || '').split('?')[0]
  if (currentPath !== '/api' && currentPath !== '/api/') return next()
  const forwarded = req.headers['x-forwarded-uri']
  if (typeof forwarded !== 'string') return next()
  const raw = forwarded.startsWith('http')
    ? `${new URL(forwarded).pathname}${new URL(forwarded).search}`
    : forwarded
  const path = raw.split('?')[0]
  if (path.startsWith('/api/') && path.length > 5) req.url = raw
  next()
})
app.use(express.json({ limit: '8mb' }))

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next)
  }
}

app.get('/api/health', asyncRoute(async (_req, res) => {
  const db = await ping()
  res.status(db.ok ? 200 : 503).json({
    ok: db.ok,
    service: 'homeo-api',
    database: databaseReady() ? 'neon' : 'unconfigured',
    error: db.error || undefined,
  })
}))

app.get('/api/clinic', asyncRoute(async (_req, res) => {
  res.json(await loadClinic())
}))

app.post('/api/clinic/import', asyncRoute(async (req, res) => {
  res.json(await replaceClinic(req.body))
}))

app.post('/api/clinic/example', asyncRoute(async (_req, res) => {
  res.status(201).json(await addExample())
}))

app.delete('/api/clinic', asyncRoute(async (_req, res) => {
  res.json(await clearClinic())
}))

app.post('/api/patients', asyncRoute(async (req, res) => {
  res.status(201).json(await createPatient(req.body))
}))

app.patch('/api/patients/:id', asyncRoute(async (req, res) => {
  res.json(await updatePatient(req.params.id, req.body))
}))

app.delete('/api/patients/:id', asyncRoute(async (req, res) => {
  await deletePatient(req.params.id)
  res.status(204).end()
}))

app.post('/api/cases', asyncRoute(async (req, res) => {
  res.status(201).json(await createCaseSheet(req.body))
}))

app.post('/api/patients/:patientId/cases', asyncRoute(async (req, res) => {
  res.status(201).json(await createCaseSheet({ ...req.body, patientId: req.params.patientId }))
}))

app.patch('/api/cases/:id', asyncRoute(async (req, res) => {
  res.json(await updateCaseSheet(req.params.id, req.body))
}))

app.delete('/api/cases/:id', asyncRoute(async (req, res) => {
  await deleteCaseSheet(req.params.id)
  res.status(204).end()
}))

app.post('/api/prescriptions', asyncRoute(async (req, res) => {
  res.status(201).json(await createPrescription(req.body))
}))

app.post('/api/patients/:patientId/prescriptions', asyncRoute(async (req, res) => {
  res.status(201).json(await createPrescription({ ...req.body, patientId: req.params.patientId }))
}))

app.patch('/api/prescriptions/:id', asyncRoute(async (req, res) => {
  res.json(await updatePrescription(req.params.id, req.body))
}))

app.delete('/api/prescriptions/:id', asyncRoute(async (req, res) => {
  await deletePrescription(req.params.id)
  res.status(204).end()
}))

app.post('/api/follow-ups', asyncRoute(async (req, res) => {
  res.status(201).json(await createFollowUp(req.body))
}))

app.post('/api/patients/:patientId/follow-ups', asyncRoute(async (req, res) => {
  res.status(201).json(await createFollowUp({ ...req.body, patientId: req.params.patientId }))
}))

app.patch('/api/follow-ups/:id', asyncRoute(async (req, res) => {
  res.json(await updateFollowUp(req.params.id, req.body))
}))

app.delete('/api/follow-ups/:id', asyncRoute(async (req, res) => {
  await deleteFollowUp(req.params.id)
  res.status(204).end()
}))

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}.` })
})

app.use((error, _req, res, _next) => {
  const status = error.status || 500
  if (status >= 500) console.error(error)
  res.status(status).json({ error: error.message || 'The server could not complete that.' })
})

export default app
