import type { Patient } from './types'
import { codedEntryTerms, parseCodedEntries, type CodedEntry } from './clinicalCodes'

const ALLERGY_CLASS_ALIASES: Record<string, string[]> = {
  sulfa: [
    'sulfa', 'sulfonamide', 'sulfonamides', 'sulfamethoxazole', 'sulfadiazine', 'sulfasalazine',
    'trimethoprim-sulfamethoxazole', 'trimethoprim', 'co-trimoxazole', 'cotrimoxazole', 'tmp-smx',
    'bactrim', 'septrin', 'septrin forte', 'fansidar',
  ],
  penicillin: ['penicillin', 'penicillins', 'amoxicillin', 'ampicillin', 'piperacillin', 'beta-lactam', 'cephalosporin', 'augmentin'],
  aspirin: ['aspirin', 'salicylate', 'salicylates', 'nsaid', 'ibuprofen', 'naproxen', 'diclofenac'],
  latex: ['latex'],
  iodine: ['iodine', 'iodinated', 'contrast', 'povidone'],
  codeine: ['codeine', 'opioid'],
  morphine: ['morphine', 'opioid'],
}

function expandAllergyAliases(terms: string[]): void {
  for (const t of [...terms]) {
    for (const [key, aliases] of Object.entries(ALLERGY_CLASS_ALIASES)) {
      if (t.includes(key) || aliases.some((a) => t.includes(a))) {
        aliases.forEach((a) => terms.push(a))
        terms.push(key)
      }
    }
  }
}

function allergyTerms(entries: CodedEntry[], freeText: string): string[] {
  const terms = new Set<string>()
  for (const e of entries) codedEntryTerms(e).forEach((t) => terms.add(t))
  const list = [...terms]
  expandAllergyAliases(list)
  list.forEach((t) => terms.add(t))
  for (const part of freeText.split(/[,;\n]+/)) {
    const p = part.replace(/\([^)]*\)/g, '').trim().toLowerCase()
    if (p && p !== 'none' && p !== 'nkda') terms.add(p)
    for (const [key, aliases] of Object.entries(ALLERGY_CLASS_ALIASES)) {
      if (p.includes(key) || aliases.some((a) => p.includes(a))) aliases.forEach((a) => terms.add(a))
    }
  }
  return [...terms]
}

function drugTerms(drugName: string, ingredients: string[]): string[] {
  const terms = new Set<string>()
  const name = drugName.toLowerCase()
  terms.add(name)
  for (const part of name.split(/\s+/)) if (part.length > 2) terms.add(part)
  for (const ing of ingredients) {
    const i = ing.toLowerCase()
    terms.add(i)
    for (const part of i.split(/\s+/)) if (part.length > 2) terms.add(part)
  }
  return [...terms]
}

function termsOverlap(allergySet: string[], drugSet: string[]): string[] {
  const hits: string[] = []
  for (const a of allergySet) {
    for (const d of drugSet) {
      if (a.length < 3 || d.length < 3) continue
      if (d.includes(a) || a.includes(d)) hits.push(a)
    }
  }
  return [...new Set(hits)]
}

export type DrugAllergyAlert = {
  severity: 'warning'
  message: string
  matchedTerms: string[]
}

export function checkPatientMedAllergies(
  patient: Pick<Patient, 'allergies' | 'allergy_codes'>,
  medNames: string[],
): DrugAllergyAlert[] {
  const alerts: DrugAllergyAlert[] = []
  const seen = new Set<string>()
  for (const med of medNames) {
    const alert = checkDrugAllergyLocal(patient, med)
    if (alert && !seen.has(alert.message)) {
      seen.add(alert.message)
      alerts.push(alert)
    }
  }
  return alerts
}

export function checkDrugAllergyLocal(
  patient: Pick<Patient, 'allergies' | 'allergy_codes'>,
  drugName: string,
  ingredients: string[] = [],
): DrugAllergyAlert | null {
  const entries = parseCodedEntries(patient.allergy_codes)
  const allergies = allergyTerms(entries, patient.allergies ?? '')
  if (!allergies.length) return null
  const drugs = drugTerms(drugName, ingredients)
  const matched = termsOverlap(allergies, drugs)
  if (!matched.length) return null
  return {
    severity: 'warning',
    message: `Allergy alert: patient is allergic to ${matched.join(', ')} — review ${drugName}.`,
    matchedTerms: matched,
  }
}
