export function todayISO() {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function formatDate(value) {
  if (!value) return ''
  const iso = String(value).slice(0, 10)
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatWeekday(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function dueLabel(iso) {
  const target = new Date(`${iso}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((target - today) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < 0) return `${Math.abs(diff)} days overdue`
  return `In ${diff} days`
}

export function ageFromDob(dob) {
  if (!dob) return ''
  const birth = new Date(`${dob}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return ''
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months -= 1
  if (months < 0) return ''
  if (months < 24) {
    if (months === 0) return 'Under 1 month'
    return `${months} month${months === 1 ? '' : 's'}`
  }
  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? '' : 's'}`
}

export function ageLabel(patient) {
  if (!patient) return ''
  if (patient.dob) return ageFromDob(patient.dob)
  if (patient.ageYears) return `${patient.ageYears} years`
  return ''
}

export function formatPhone(phone) {
  const raw = String(phone || '').trim()
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`
  return raw
}

export function personLine(patient) {
  return [ageLabel(patient), patient.sex].filter(Boolean).join(' · ')
}

export function snippet(value, max = 140) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trim()}…`
}
