import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData, SPECIALTIES, formatCodedList, parseCodedEntries, searchGdrgCodes, type Patient } from '@onim/data'
import { Button, Modal } from '@onim/ui'
import { PhoneInput, formatPhone } from './PhoneInput'
import { CodedTagInput, type SearchOption } from './SearchInput'
import { searchAllergies, searchIcd10 } from '../lib/clinicalTables'
import './SearchInput.css'

const OTHER_SPECIALTY = 'Other'

type NewPatientModalProps = {
  open: boolean
  onClose: () => void
  patient?: Patient | null
}

function parsePhone(phone: string) {
  const trimmed = phone.trim()
  if (!trimmed) return { countryCode: '+233', number: '' }
  const match = trimmed.match(/^(\+\d{1,4})\s*(.*)$/)
  if (match) return { countryCode: match[1], number: match[2] }
  return { countryCode: '+233', number: trimmed }
}

function resolveSpecialtyFields(specialty: string) {
  if ((SPECIALTIES as readonly string[]).includes(specialty)) {
    return { choice: specialty, other: '' }
  }
  if (!specialty) return { choice: '', other: '' }
  return { choice: OTHER_SPECIALTY, other: specialty }
}

export function NewPatientModal({ open, onClose, patient }: NewPatientModalProps) {
  const { addPatient, updatePatient } = useData()
  const navigate = useNavigate()
  const isEdit = !!patient
  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [countryCode, setCountryCode] = useState('+233')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [dob, setDob] = useState('')
  const [sex, setSex] = useState('')
  const [ghanaCard, setGhanaCard] = useState('')
  const [nhis, setNhis] = useState('')
  const [specialtyChoice, setSpecialtyChoice] = useState('')
  const [otherSpecialty, setOtherSpecialty] = useState('')
  const [blood, setBlood] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [allergyTags, setAllergyTags] = useState<SearchOption[]>([])
  const [conditionTags, setConditionTags] = useState<SearchOption[]>([])
  const [gdrgTags, setGdrgTags] = useState<SearchOption[]>([])
  const [currentMeds, setCurrentMeds] = useState('')
  const [ecName, setEcName] = useState('')
  const [ecRel, setEcRel] = useState('')
  const [ecCountryCode, setEcCountryCode] = useState('+233')
  const [ecPhoneNumber, setEcPhoneNumber] = useState('')

  const searchGdrg = useCallback(
    async (q: string) => searchGdrgCodes(q).map((g) => ({ code: g.code, name: g.name })),
    [],
  )

  const resolvedSpecialty = specialtyChoice === OTHER_SPECIALTY ? otherSpecialty.trim() : specialtyChoice
  const hasPhone = phoneNumber.replace(/\D/g, '').length > 0
  const canSave =
    fname.trim().length > 0 &&
    lname.trim().length > 0 &&
    hasPhone &&
    dob.trim().length > 0 &&
    sex.trim().length > 0

  useEffect(() => {
    if (!open) return
    if (patient) {
      setFname(patient.fname)
      setLname(patient.lname)
      const parsed = parsePhone(patient.phone)
      setCountryCode(parsed.countryCode)
      setPhoneNumber(parsed.number)
      setEmail(patient.email)
      setAddress(patient.address)
      setDob(patient.dob || '')
      setSex(patient.sex || '')
      setGhanaCard(patient.id_num)
      setNhis(patient.nhis)
      const specialtyFields = resolveSpecialtyFields(patient.specialty)
      setSpecialtyChoice(specialtyFields.choice)
      setOtherSpecialty(specialtyFields.other)
      setBlood(patient.blood || '')
      setWeight(patient.weight ? String(patient.weight) : '')
      setHeight(patient.height ? String(patient.height) : '')
      setAllergyTags(parseCodedEntries(patient.allergy_codes).map((e) => ({ code: e.code, name: e.name })))
      setConditionTags(parseCodedEntries(patient.condition_codes).map((e) => ({ code: e.code, name: e.name })))
      setGdrgTags(parseCodedEntries(patient.gdrg_codes).map((e) => ({ code: e.code, name: e.name })))
      setCurrentMeds(patient.current_meds)
      setEcName(patient.ec_name)
      setEcRel(patient.ec_rel)
      const ecParsed = parsePhone(patient.ec_phone || '')
      setEcCountryCode(ecParsed.countryCode)
      setEcPhoneNumber(ecParsed.number)
      return
    }
    setFname('')
    setLname('')
    setCountryCode('+233')
    setPhoneNumber('')
    setEmail('')
    setAddress('')
    setDob('')
    setSex('')
    setGhanaCard('')
    setNhis('')
    setSpecialtyChoice('')
    setOtherSpecialty('')
    setBlood('')
    setWeight('')
    setHeight('')
    setAllergyTags([])
    setConditionTags([])
    setGdrgTags([])
    setCurrentMeds('')
    setEcName('')
    setEcRel('')
    setEcCountryCode('+233')
    setEcPhoneNumber('')
  }, [open, patient])

  async function handleSave() {
    if (!canSave) return

    const allergyCodes = allergyTags.map((t) => ({
      code: t.code,
      name: t.name,
      terms: [t.name, t.code].filter(Boolean),
    }))
    const conditionCodes = conditionTags.map((t) => ({
      code: t.code,
      name: t.name,
      terms: [t.name, t.code].filter(Boolean),
    }))

    const gdrgCodes = gdrgTags.map((t) => ({
      code: t.code,
      name: t.name,
      terms: [t.name, t.code].filter(Boolean),
    }))

    const payload = {
      fname: fname.trim(),
      lname: lname.trim(),
      phone: formatPhone(countryCode, phoneNumber),
      email: email.trim(),
      address: address.trim(),
      dob,
      sex,
      id_num: ghanaCard.trim(),
      nhis: nhis.trim(),
      specialty: resolvedSpecialty || '',
      blood: blood.trim(),
      weight: weight.trim() ? Number(weight) : null,
      height: height.trim() ? Number(height) : null,
      allergies: formatCodedList(allergyCodes) || 'None',
      allergy_codes: allergyCodes,
      conditions: formatCodedList(conditionCodes),
      condition_codes: conditionCodes,
      gdrg_codes: gdrgCodes,
      current_meds: currentMeds.trim(),
      ec_name: ecName.trim(),
      ec_rel: ecRel.trim(),
      ec_phone: formatPhone(ecCountryCode, ecPhoneNumber),
    }

    if (isEdit && patient) {
      const result = await updatePatient(patient.id, payload)
      if ('error' in result) return
      onClose()
      return
    }

    const created = await addPatient(payload)
    if ('error' in created) return
    onClose()
    navigate(`/patients/${created.id}`)
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit Patient' : 'Register New Patient'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => void handleSave()}
            disabled={!canSave}
          >
            {isEdit ? 'Save Changes' : 'Save Patient'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>First name</span>
          <input className="form-input" value={fname} onChange={(e) => setFname(e.target.value)} placeholder="First name" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Last name</span>
          <input className="form-input" value={lname} onChange={(e) => setLname(e.target.value)} placeholder="Last name" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Phone</span>
          <PhoneInput
            countryCode={countryCode}
            number={phoneNumber}
            onCountryCodeChange={setCountryCode}
            onNumberChange={setPhoneNumber}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Email</span>
          <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@..." />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Address (Street, Ghana)</span>
          <textarea className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, Ghana" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Date of birth</span>
          <input className="form-input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Sex</span>
          <select className="form-input" value={sex} onChange={(e) => setSex(e.target.value)}>
            <option value="">Select sex</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Ghana Card number</span>
          <input className="form-input" value={ghanaCard} onChange={(e) => setGhanaCard(e.target.value)} placeholder="GHA-123456789-0" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>NHIS number</span>
          <input className="form-input" value={nhis} onChange={(e) => setNhis(e.target.value)} placeholder="NHIS-XXXXX" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Specialty</span>
          <select
            className="form-input"
            value={specialtyChoice}
            onChange={(e) => setSpecialtyChoice(e.target.value)}
          >
            <option value="">Select specialty</option>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value={OTHER_SPECIALTY}>Other</option>
          </select>
        </label>
        {specialtyChoice === OTHER_SPECIALTY && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
            <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Other specialty</span>
            <input
              className="form-input"
              value={otherSpecialty}
              onChange={(e) => setOtherSpecialty(e.target.value)}
              placeholder="Type specialty"
            />
          </label>
        )}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Blood type</span>
          <select className="form-input" value={blood} onChange={(e) => setBlood(e.target.value)}>
            <option value="">Select blood type</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Weight (kg)</span>
          <input className="form-input" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Height (cm)</span>
          <input className="form-input" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Allergies</span>
          <CodedTagInput
            entries={allergyTags}
            onChange={setAllergyTags}
            search={searchAllergies}
            placeholder="Search allergy…"
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Diagnosis (ICD-10)</span>
          <CodedTagInput
            entries={conditionTags}
            onChange={setConditionTags}
            search={searchIcd10}
            placeholder="Search ICD-10…"
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>G-DRG</span>
          <CodedTagInput
            entries={gdrgTags}
            onChange={setGdrgTags}
            search={searchGdrg}
            placeholder="Search G-DRG…"
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Current medications</span>
          <textarea className="form-input" value={currentMeds} onChange={(e) => setCurrentMeds(e.target.value)} placeholder="Current medications taken by patient" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Emergency contact name</span>
          <input className="form-input" value={ecName} onChange={(e) => setEcName(e.target.value)} placeholder="Full name" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Relationship</span>
          <input className="form-input" value={ecRel} onChange={(e) => setEcRel(e.target.value)} placeholder="Relationship" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Emergency contact phone</span>
          <PhoneInput
            countryCode={ecCountryCode}
            number={ecPhoneNumber}
            onCountryCodeChange={setEcCountryCode}
            onNumberChange={setEcPhoneNumber}
          />
        </label>
      </div>
    </Modal>
  )
}
