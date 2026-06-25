import { checkDrugAllergyLocal, type DrugAllergyAlert } from '@onim/data'
import type { Patient } from '@onim/data'
import { fetchDrugIngredients } from './clinicalTables'
import { resolveRxcuiForDrug } from './rxnorm'

export async function checkDrugAllergyWithRxNorm(
  patient: Pick<Patient, 'allergies' | 'allergy_codes'>,
  drugName: string,
  rxcui?: string,
): Promise<DrugAllergyAlert | null> {
  let id = rxcui?.trim() ?? ''
  if (!id && drugName.trim().length >= 2) {
    id = (await resolveRxcuiForDrug(drugName)) ?? ''
  }
  const ingredients = id ? await fetchDrugIngredients(id) : []
  return checkDrugAllergyLocal(patient, drugName, ingredients)
}

export async function resolveRxcuiForSave(drugName: string, rxcui?: string): Promise<string> {
  const existing = rxcui?.trim()
  if (existing) return existing
  return (await resolveRxcuiForDrug(drugName)) ?? ''
}

export async function checkPatientMedAllergiesWithRxNorm(
  patient: Pick<Patient, 'allergies' | 'allergy_codes'>,
  meds: { name: string; rxcui?: string }[],
): Promise<DrugAllergyAlert[]> {
  const alerts: DrugAllergyAlert[] = []
  const seen = new Set<string>()
  for (const med of meds) {
    const alert = await checkDrugAllergyWithRxNorm(patient, med.name, med.rxcui)
    if (alert && !seen.has(alert.message)) {
      seen.add(alert.message)
      alerts.push(alert)
    }
  }
  return alerts
}
