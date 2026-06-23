export type GdrgCode = {
  code: string
  name: string
  tariff?: number
}

/** NHIA G-DRG subset (2022 tariff manual) */
export const GDRG_CODES: GdrgCode[] = [
  { code: 'OPDC01A', name: 'General OPD Consultation >=12 Yrs', tariff: 55.06 },
  { code: 'OPDC02A', name: 'Antenatal/Postnatal >=12 Yrs', tariff: 71.22 },
  { code: 'OPDC03A', name: 'Dental Adult (without procedure)', tariff: 71.22 },
  { code: 'OPDC14C', name: 'Capitation OPD <12 Yrs', tariff: 38.5 },
  { code: 'MEDI01A', name: 'Thyroid Diseases >=12 Yrs', tariff: 407.54 },
  { code: 'MEDI02A', name: 'Diabetes – Simple >=12 Yrs', tariff: 303.85 },
  { code: 'MEDI03A', name: 'Diabetes – Complicated >=12 Yrs', tariff: 598.63 },
  { code: 'MEDI06A', name: 'Anaemia >=12 Yrs', tariff: 316.66 },
  { code: 'MEDI07A', name: 'Heart Disease >=12 Yrs', tariff: 572.89 },
  { code: 'MEDI12A', name: 'Seizure Disorders >=12 Yrs', tariff: 312.31 },
  { code: 'MEDI14A', name: 'Cerebrovascular Accident/Stroke >=12 Yrs', tariff: 410.6 },
  { code: 'MEDI16A', name: 'Sickle Cell with Complication >=12 Yrs', tariff: 311.98 },
  { code: 'MEDI19A', name: 'Kidney Disease without Renal Failure >=12 Yrs', tariff: 524.4 },
  { code: 'MEDI22A', name: 'Obstructive Airway Disease >=12 Yrs', tariff: 210.33 },
  { code: 'MEDI23A', name: 'Diarrhoea and Vomiting >=12 Yrs', tariff: 185.27 },
  { code: 'MEDI28A', name: 'Malaria >=12 Yrs', tariff: 121.82 },
  { code: 'MEDI30A', name: 'Systemic Infections >=12 Yrs', tariff: 516.18 },
  { code: 'MEDI32A', name: 'Hypertension >=12 Yrs', tariff: 312.74 },
  { code: 'MEDI38A', name: 'Retroviral Infection/Immunosuppression >=12 Yrs', tariff: 407.82 },
  { code: 'MEDI41A', name: 'Cerebral Malaria', tariff: 641.69 },
  { code: 'INVE01A', name: 'Full Blood Count', tariff: 18.5 },
  { code: 'INVE02A', name: 'Blood Glucose', tariff: 12.0 },
  { code: 'INVE03A', name: 'Urinalysis', tariff: 10.5 },
  { code: 'INVE04A', name: 'Liver Function Test', tariff: 45.0 },
  { code: 'INVE05A', name: 'Renal Function Test', tariff: 42.0 },
  { code: 'INVE06A', name: 'Lipid Profile', tariff: 55.0 },
  { code: 'INVE07A', name: 'HIV Screening', tariff: 25.0 },
  { code: 'INVE08A', name: 'Hepatitis B Surface Antigen', tariff: 28.0 },
  { code: 'INVE09A', name: 'Malaria Rapid Test', tariff: 15.0 },
  { code: 'INVE10A', name: 'Chest X-Ray', tariff: 65.0 },
  { code: 'INVE11A', name: 'Ultrasound Scan', tariff: 85.0 },
  { code: 'OBGY01A', name: 'Normal Delivery', tariff: 350.0 },
  { code: 'OBGY02A', name: 'Caesarean Section', tariff: 1200.0 },
  { code: 'PAED01C', name: 'Neonatal Conditions <12 Yrs', tariff: 280.0 },
  { code: 'PAED02C', name: 'Paediatric Malaria <12 Yrs', tariff: 95.0 },
  { code: 'ZOOM01A', name: 'Minor Procedure', tariff: 120.0 },
  { code: 'ZOOM02A', name: 'Wound Dressing', tariff: 45.0 },
]

export function searchGdrgCodes(query: string): GdrgCode[] {
  const q = query.trim().toLowerCase()
  if (!q) return GDRG_CODES.slice(0, 15)
  return GDRG_CODES.filter(
    (g) => g.code.toLowerCase().includes(q) || g.name.toLowerCase().includes(q),
  ).slice(0, 20)
}
