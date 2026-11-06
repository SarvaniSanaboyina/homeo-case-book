import { Route, Routes } from 'react-router-dom'
import Shell from './components/Shell'
import { Busy, Missing } from './components/ui'
import Dashboard from './pages/Dashboard'
import PatientList from './pages/PatientList'
import PatientForm from './pages/PatientForm'
import PatientDetail from './pages/PatientDetail'
import CaseSheetForm from './pages/CaseSheetForm'
import PrescriptionForm from './pages/PrescriptionForm'
import FollowUpForm from './pages/FollowUpForm'
import { useClinicStatus } from './store'

export default function App() {
  const { status, error, refresh } = useClinicStatus()

  return (
    <Shell>
      {status === 'loading' ? (
        <Busy />
      ) : status === 'error' ? (
        <div className="hero-empty">
          <h1>Could not reach the records</h1>
          <p>{error}</p>
          <p className="quiet">Paste your Neon connection string into <code>.env</code>, run <code>npm run db:migrate</code>, then try again.</p>
          <button className="btn primary" type="button" onClick={() => refresh().catch(() => {})}>
            Try again
          </button>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<PatientList />} />
          <Route path="/patients/new" element={<PatientForm />} />
          <Route path="/patients/:patientId" element={<PatientDetail />} />
          <Route path="/patients/:patientId/edit" element={<PatientForm />} />
          <Route path="/patients/:patientId/cases/new" element={<CaseSheetForm />} />
          <Route path="/patients/:patientId/cases/:recordId" element={<CaseSheetForm />} />
          <Route path="/patients/:patientId/prescriptions/new" element={<PrescriptionForm />} />
          <Route path="/patients/:patientId/prescriptions/:recordId" element={<PrescriptionForm />} />
          <Route path="/patients/:patientId/follow-ups/new" element={<FollowUpForm />} />
          <Route path="/patients/:patientId/follow-ups/:recordId" element={<FollowUpForm />} />
          <Route path="*" element={<Missing title="Page not found" copy="That page is not in the case book." />} />
        </Routes>
      )}
    </Shell>
  )
}
