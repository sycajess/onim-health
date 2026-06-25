import { billingLineAmount, parseBillingServices, type BillingTariffTier } from './billing'
import type { BillingInvoice, Patient } from './types'

export type ClinicNhisSettings = {
  providerAccreditation: string
  eclaimAuthorization: string
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatNhisDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
}

function formatXmlDateTime(d = new Date()): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`
}

function patientSexCode(sex: string): string {
  const s = sex.trim().toUpperCase()
  if (s.startsWith('M')) return 'M'
  if (s.startsWith('F')) return 'F'
  return 'U'
}

function buildClaimXml(
  invoice: BillingInvoice,
  patient: Patient,
  _settings: ClinicNhisSettings,
): string {
  const lines = parseBillingServices(invoice.services)
  const tier = (invoice.payment_tier ?? 'nhis') as BillingTariffTier
  const total = lines.reduce((sum, line) => sum + billingLineAmount(line, tier), 0)
  const primaryIcd = invoice.primary_icd10 ?? lines.find((l) => l.icd10)?.icd10 ?? ''
  const serviceType = 'OUT'
  const outPatientCode = lines.find((l) => l.gdrg)?.gdrg ?? ''

  const treatmentNodes = [
    `<Treatment>`,
    `<Type>DIAGNOSIS</Type>`,
    `<ICDCode>${xmlEscape(primaryIcd)}</ICDCode>`,
    `</Treatment>`,
    ...lines
      .filter((l) => l.gdrg)
      .map((line) => [
        `<Treatment>`,
        `<Type>INVESTIGATION</Type>`,
        `<TreatmentCode>${xmlEscape(line.gdrg!)}</TreatmentCode>`,
        `<Cost>${billingLineAmount(line, tier).toFixed(2)}</Cost>`,
        `</Treatment>`,
      ].join('')),
  ].join('')

  return [
    `<Claim>`,
    `<ClaimIdentificationNumber>${xmlEscape(invoice.id)}</ClaimIdentificationNumber>`,
    `<ServiceType>${serviceType}</ServiceType>`,
    `<AdmissionDate>${formatNhisDate(invoice.date)}</AdmissionDate>`,
    `<DischargeDate>${formatNhisDate(invoice.date)}</DischargeDate>`,
    `<TotalCost>${total.toFixed(2)}</TotalCost>`,
    `<Currency>GHC</Currency>`,
    `<OutPatientCode>${xmlEscape(outPatientCode)}</OutPatientCode>`,
    `<Patients>`,
    `<PatientData>`,
    `<Surname>${xmlEscape(patient.lname)}</Surname>`,
    `<OtherName>${xmlEscape(patient.fname)}</OtherName>`,
    `<DateOfBirth>${patient.dob ? formatNhisDate(patient.dob) : ''}</DateOfBirth>`,
    `<Infant>NO</Infant>`,
    `<MemberNumber>${xmlEscape(patient.nhis)}</MemberNumber>`,
    `<Gender>${patientSexCode(patient.sex)}</Gender>`,
    `</PatientData>`,
    `</Patients>`,
    `<TreatmentsCount>${1 + lines.filter((l) => l.gdrg).length}</TreatmentsCount>`,
    `<Treatments>${treatmentNodes}</Treatments>`,
    `</Claim>`,
  ].join('')
}

export function buildNhisClaimBatchXml(
  invoices: BillingInvoice[],
  patients: Patient[],
  settings: ClinicNhisSettings,
): string {
  const patientMap = new Map(patients.map((p) => [p.id, p]))
  const claims = invoices
    .map((inv) => {
      const patient = patientMap.get(inv.patient_id)
      if (!patient) return ''
      return buildClaimXml(inv, patient, settings)
    })
    .filter(Boolean)

  const batchDate = formatXmlDateTime()
  const header = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<batch>`,
    `<GeneralInformation>`,
    `<VersionInformation>`,
    `<XMLFormatVersion>8.6</XMLFormatVersion>`,
    `<GDRGVersion>2022</GDRGVersion>`,
    `<TariffVersion>2022</TariffVersion>`,
    `<ICDVersion>10</ICDVersion>`,
    `</VersionInformation>`,
    `<BatchInformation>`,
    `<BatchGenerationDate>${batchDate}</BatchGenerationDate>`,
    `<ClaimsNumber>${claims.length}</ClaimsNumber>`,
    `</BatchInformation>`,
    `<ProviderInformation>`,
    `<ProviderAccreditationNumber>${xmlEscape(settings.providerAccreditation || 'PENDING')}</ProviderAccreditationNumber>`,
    `<eClaimAuthorizationNumber>${xmlEscape(settings.eclaimAuthorization || 'PENDING')}</eClaimAuthorizationNumber>`,
    `</ProviderInformation>`,
    `</GeneralInformation>`,
  ].join('')

  return `${header}${claims.join('')}</batch>`
}

export function downloadNhisClaimXml(filename: string, xml: string): void {
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
