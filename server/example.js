function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

function todayISO() {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function exampleRecords() {
  const patientId = crypto.randomUUID()
  const caseDate = addDays(todayISO(), -40)
  const followDate = addDays(todayISO(), -12)
  const nextVisit = addDays(todayISO(), 5)
  return {
    patient: {
      id: patientId,
      name: 'Example — L. Iyer',
      sex: 'Female',
      dob: '1992-04-18',
      ageYears: '',
      phone: '9848012345',
      altPhone: '',
      email: '',
      city: 'Hyderabad',
      address: 'Sample address only',
      occupation: 'Teacher',
      maritalStatus: 'Married',
      bloodGroup: 'B+',
      referredBy: 'Sister',
      emergencyName: 'R. Iyer',
      emergencyPhone: '9848098765',
      allergies: 'None known',
      notes: 'Sample record so you can see a filled case. Delete it when you start your own book.',
    },
    caseSheet: {
      id: crypto.randomUUID(),
      patientId,
      date: caseDate,
      chiefComplaint: 'Recurrent headache, mostly the right temple, extending into the eye.',
      duration: '3 years, worse for 4 months',
      location: 'Right temple to right eye',
      sensation: 'Bursting',
      modalitiesBetter: 'Hard pressure, sleep, a dark room',
      modalitiesWorse: 'Sun, missed meal, 10 to 11 am',
      concomitants: 'Nausea when the pain peaks. Vision feels strained.',
      causation: 'Began after a period of grief and long hours of correction work.',
      history: 'Attacks last half a day. She can predict them when she has skipped breakfast and then gone into the sun.',
      pastHistory: 'Childhood eczema, now quiet.',
      familyHistory: 'Mother: migraine. Father: hypertension.',
      previousTreatment: 'Occasional painkillers. No regular allopathic preventive.',
      menstrual: 'Regular cycle. Headache sometimes before menses.',
      birthHistory: '',
      mental: 'Reserved at the clinic. Dwells on old slights. Weeps when alone and does not want consolation in company.',
      appetite: 'Small, worse during an attack',
      thirst: 'Large quantities, infrequently',
      desires: 'Salt, cold drinks',
      aversions: 'Bread',
      intolerance: 'Oily food brings heaviness',
      stool: 'Satisfactory',
      urine: 'Normal',
      perspiration: 'Scanty, face when anxious',
      sleep: 'Late to fall asleep, dwells on the day',
      thermal: 'Chilly',
      dreams: 'Of unfinished work, occasionally of water',
      particulars: 'Right-sided headache with visual strain. Crack of the lower lip in summer.',
      examination: 'Reserved, answers after a pause. Tongue clean. Dark under the eyes.',
      diagnosis: 'Recurrent migraine',
      notes: 'Sample case sheet for the example patient.',
    },
    prescription: {
      id: crypto.randomUUID(),
      patientId,
      date: caseDate,
      remedies: [
        {
          id: crypto.randomUUID(),
          name: 'Natrum muriaticum',
          potency: '200C',
          form: 'Pills',
          dose: '4 pills',
          repetition: 'Single dose',
          duration: 'Once',
          instructions: 'One dose at night, nothing by mouth for 15 minutes.',
        },
        {
          id: crypto.randomUUID(),
          name: 'Sac lac',
          potency: '',
          form: 'Pills',
          dose: '4 pills',
          repetition: 'BD',
          duration: '7 days',
          instructions: 'Morning and night.',
        },
      ],
      advice: 'Do not repeat the medicated dose.',
      diet: 'Regular breakfast. Less time in direct sun on an empty stomach.',
      nextVisit: followDate,
      notes: 'Sample prescription logged with the first visit.',
    },
    followUp: {
      id: crypto.randomUUID(),
      patientId,
      date: followDate,
      response: 'Improved',
      adherence: 'As advised',
      complaints: 'One mild headache in two weeks, gone after sleep.',
      changes: 'Sleep is earlier. Thirst unchanged. Less irritable at school.',
      newSymptoms: 'None.',
      reaction: 'No aggravation after the single dose.',
      observations: 'Looks less drawn. Lip crack still present.',
      assessment: 'Direction is favourable. Wait before repeating.',
      plan: 'Wait and watch',
      nextVisit,
    },
  }
}
