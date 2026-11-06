import cors from 'cors'
import express from 'express'
import { config, databaseHint, databaseReady } from './env.js'
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

const app = express()
app.use(cors({ origin: config.corsOrigin }))
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

app.use((error, _req, res, _next) => {
  const status = error.status || 500
  if (status >= 500) console.error(error)
  res.status(status).json({ error: error.message || 'The server could not complete that.' })
})

app.listen(config.port, () => {
  console.log(`Homeo API on http://localhost:${config.port}`)
  if (!databaseReady()) {
    console.warn(databaseHint())
  } else {
    ping().then((db) => {
      if (db.ok) console.log('Connected to Neon Postgres.')
      else console.warn(db.error)
    })
  }
})
