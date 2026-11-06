import { todayISO } from './format'

export const SEX_OPTIONS = ['Female', 'Male', 'Other']
export const MARITAL_OPTIONS = ['Single', 'Married', 'Widowed', 'Separated', 'Other']
export const BLOOD_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
export const THERMAL_OPTIONS = ['Chilly', 'Hot', 'Ambithermal']
export const RESPONSE_OPTIONS = ['Improved', 'Partial improvement', 'No change', 'Worse', 'Aggravation']
export const ADHERENCE_OPTIONS = ['As advised', 'Partly', 'Not taken']
export const PLAN_OPTIONS = [
  'Continue same',
  'Change remedy',
  'Change potency',
  'Wait and watch',
  'Stop medicine',
  'Refer',
]

export const PATIENT_SECTIONS = [
  {
    title: 'Identity',
    fields: [
      { key: 'name', label: 'Full name', required: true, requiredMessage: 'Enter the patient’s name.', maxLength: 120, autoComplete: 'name', placeholder: 'Patient’s name' },
      { key: 'sex', label: 'Sex', type: 'select', options: SEX_OPTIONS, placeholder: 'Select' },
      { key: 'dob', label: 'Date of birth', type: 'date', past: true, hint: 'Age is calculated from this.' },
      { key: 'ageYears', label: 'Approximate age', type: 'number', min: 0, max: 120, hint: 'Used only when date of birth is empty.', inputMode: 'numeric' },
      { key: 'phone', label: 'Phone', maxLength: 20, autoComplete: 'tel', inputMode: 'tel', placeholder: 'Mobile number' },
      { key: 'altPhone', label: 'Alternate phone', maxLength: 20, inputMode: 'tel' },
      { key: 'email', label: 'Email', type: 'email', maxLength: 120, autoComplete: 'email' },
      { key: 'city', label: 'City', maxLength: 80, autoComplete: 'address-level2' },
      { key: 'address', label: 'Address', type: 'textarea', span: 2, rows: 2, maxLength: 400, autoComplete: 'street-address' },
    ],
  },
  {
    title: 'Background',
    fields: [
      { key: 'occupation', label: 'Occupation', maxLength: 80 },
      { key: 'maritalStatus', label: 'Marital status', type: 'select', options: MARITAL_OPTIONS, placeholder: 'Select' },
      { key: 'bloodGroup', label: 'Blood group', type: 'select', options: BLOOD_OPTIONS, placeholder: 'Select' },
      { key: 'referredBy', label: 'Referred by', maxLength: 120 },
      { key: 'emergencyName', label: 'Guardian or emergency contact', maxLength: 120 },
      { key: 'emergencyPhone', label: 'Guardian phone', maxLength: 20, inputMode: 'tel' },
      { key: 'allergies', label: 'Sensitivities and allergies', type: 'textarea', span: 2, rows: 2, maxLength: 500, placeholder: 'Drugs, foods, or anything that has disagreed' },
      { key: 'notes', label: 'Registration notes', type: 'textarea', span: 2, rows: 3, maxLength: 2000 },
    ],
  },
]

export const CASE_SECTIONS = [
  {
    title: 'Visit',
    fields: [
      { key: 'date', label: 'Visit date', type: 'date', required: true, requiredMessage: 'Choose a visit date.', past: true, defaultToday: true },
    ],
  },
  {
    title: 'Presenting complaint',
    fields: [
      { key: 'chiefComplaint', label: 'Chief complaint', type: 'textarea', span: 2, rows: 3, required: true, requiredMessage: 'Add the chief complaint.', maxLength: 2000, placeholder: 'What brought the patient in, in their words' },
      { key: 'duration', label: 'Duration', maxLength: 160, placeholder: 'e.g. 3 years, worse for 2 months' },
      { key: 'location', label: 'Location', maxLength: 200, placeholder: 'Side, extension, tissue' },
      { key: 'sensation', label: 'Sensation', maxLength: 200, placeholder: 'Burning, bursting, stitching…' },
      { key: 'modalitiesBetter', label: 'Better from', maxLength: 240, placeholder: 'Pressure, rest, open air…' },
      { key: 'modalitiesWorse', label: 'Worse from', maxLength: 240, placeholder: 'Sun, motion, night…' },
      { key: 'concomitants', label: 'Concomitants', type: 'textarea', span: 2, rows: 2, maxLength: 1000, placeholder: 'Symptoms that come with the complaint' },
      { key: 'causation', label: 'Onset and causation', type: 'textarea', span: 2, rows: 2, maxLength: 1000, placeholder: 'How it began, and what the patient connects it with' },
    ],
  },
  {
    title: 'History',
    fields: [
      { key: 'history', label: 'History of the complaint', type: 'textarea', span: 2, rows: 4, maxLength: 4000 },
      { key: 'pastHistory', label: 'Past history', type: 'textarea', span: 2, rows: 3, maxLength: 2000 },
      { key: 'familyHistory', label: 'Family history', type: 'textarea', span: 2, rows: 3, maxLength: 2000 },
      { key: 'previousTreatment', label: 'Treatment already taken', type: 'textarea', span: 2, rows: 3, maxLength: 2000 },
      { key: 'menstrual', label: 'Menstrual history', type: 'textarea', span: 2, rows: 2, maxLength: 1000, hint: 'Leave blank if it does not apply.' },
      { key: 'birthHistory', label: 'Birth and development', type: 'textarea', span: 2, rows: 2, maxLength: 1000, hint: 'Useful for infants and children.' },
    ],
  },
  {
    title: 'Mind',
    fields: [
      { key: 'mental', label: 'Mental symptoms', type: 'textarea', span: 2, rows: 5, maxLength: 4000, placeholder: 'Mood, fears, company, anger, weeping, memory, dreams of the day' },
    ],
  },
  {
    title: 'Physical generals',
    fields: [
      { key: 'appetite', label: 'Appetite', maxLength: 200 },
      { key: 'thirst', label: 'Thirst', maxLength: 200 },
      { key: 'desires', label: 'Desires', maxLength: 240 },
      { key: 'aversions', label: 'Aversions', maxLength: 240 },
      { key: 'intolerance', label: 'Food intolerance', maxLength: 240 },
      { key: 'stool', label: 'Stool', maxLength: 200 },
      { key: 'urine', label: 'Urine', maxLength: 200 },
      { key: 'perspiration', label: 'Perspiration', maxLength: 200 },
      { key: 'sleep', label: 'Sleep', maxLength: 240 },
      { key: 'thermal', label: 'Thermal reaction', type: 'segmented', options: THERMAL_OPTIONS, span: 2 },
      { key: 'dreams', label: 'Dreams', type: 'textarea', span: 2, rows: 2, maxLength: 1000 },
    ],
  },
  {
    title: 'Particulars and examination',
    fields: [
      { key: 'particulars', label: 'Particular symptoms', type: 'textarea', span: 2, rows: 4, maxLength: 3000 },
      { key: 'examination', label: 'Examination and observations', type: 'textarea', span: 2, rows: 3, maxLength: 2000, placeholder: 'Appearance, tongue, built, anything you observed' },
    ],
  },
  {
    title: 'Assessment',
    fields: [
      { key: 'diagnosis', label: 'Provisional diagnosis', maxLength: 240, span: 2 },
      { key: 'notes', label: 'Case notes', type: 'textarea', span: 2, rows: 3, maxLength: 3000, placeholder: 'Repertory notes or anything to remember next time' },
    ],
  },
]

export const FOLLOW_SECTIONS = [
  {
    title: 'Visit',
    fields: [
      { key: 'date', label: 'Visit date', type: 'date', required: true, requiredMessage: 'Choose a visit date.', past: true, defaultToday: true },
      { key: 'response', label: 'Response since last visit', type: 'segmented', options: RESPONSE_OPTIONS, required: true, requiredMessage: 'Choose how the patient responded.', span: 2 },
      { key: 'adherence', label: 'Medicine taken', type: 'segmented', options: ADHERENCE_OPTIONS, span: 2 },
    ],
  },
  {
    title: 'What changed',
    fields: [
      { key: 'complaints', label: 'Complaints now', type: 'textarea', span: 2, rows: 3, maxLength: 2000 },
      { key: 'changes', label: 'Changes since last visit', type: 'textarea', span: 2, rows: 3, maxLength: 2000 },
      { key: 'newSymptoms', label: 'New symptoms', type: 'textarea', span: 2, rows: 2, maxLength: 1500 },
      { key: 'reaction', label: 'Reaction to the medicine', type: 'textarea', span: 2, rows: 2, maxLength: 1500 },
      { key: 'observations', label: 'Observations', type: 'textarea', span: 2, rows: 2, maxLength: 1500 },
    ],
  },
  {
    title: 'Next step',
    fields: [
      { key: 'assessment', label: 'Assessment', type: 'textarea', span: 2, rows: 3, maxLength: 2000 },
      { key: 'plan', label: 'Plan', type: 'select', options: PLAN_OPTIONS, placeholder: 'Select a plan' },
      { key: 'nextVisit', label: 'Next visit', type: 'date', hint: 'Shows on Today until a later visit is logged.' },
    ],
  },
]

export function emptyForm(sections) {
  const form = {}
  for (const section of sections) {
    for (const field of section.fields) {
      form[field.key] = field.defaultToday ? todayISO() : ''
    }
  }
  return form
}

export function formFromRecord(sections, record) {
  const form = emptyForm(sections)
  for (const section of sections) {
    for (const field of section.fields) {
      const value = record?.[field.key]
      form[field.key] = value == null ? '' : String(value)
    }
  }
  return form
}

export function readForm(sections, form) {
  const data = {}
  for (const section of sections) {
    for (const field of section.fields) {
      const value = form[field.key]
      data[field.key] = typeof value === 'string' ? value.trim() : (value ?? '')
    }
  }
  return data
}

export function validate(sections, form) {
  const today = todayISO()
  for (const section of sections) {
    for (const field of section.fields) {
      const value = String(form[field.key] ?? '').trim()
      if (field.required && !value) {
        return { error: field.requiredMessage || `Add ${field.label.toLowerCase()}.`, key: field.key }
      }
      if (field.past && value && value > today) {
        return { error: `${field.label} cannot be in the future.`, key: field.key }
      }
      if (field.type === 'number' && value !== '') {
        const n = Number(value)
        if (!Number.isFinite(n) || n < (field.min ?? 0) || n > (field.max ?? 200)) {
          return { error: `Check ${field.label.toLowerCase()}.`, key: field.key }
        }
      }
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { error: 'Check the email address.', key: field.key }
      }
    }
  }
  return null
}
