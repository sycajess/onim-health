export type ClinicalSearchResult = {
  code: string
  name: string
  terms?: string[]
}

async function fetchClinicalTable(
  path: string,
  terms: string,
  extraParams?: Record<string, string>,
): Promise<ClinicalSearchResult[]> {
  const q = terms.trim()
  if (q.length < 2) return []

  const params = new URLSearchParams({ terms: q, maxList: '15', ...extraParams })
  const res = await fetch(`https://clinicaltables.nlm.nih.gov/api/${path}?${params}`)
  if (!res.ok) return []

  const data = (await res.json()) as [number, string[], unknown, string[]]
  const codes = data[1] ?? []
  const names = data[3] ?? []

  return codes.map((code, i) => ({
    code: String(code),
    name: String(names[i] ?? code),
    terms: [String(names[i] ?? ''), String(code)].filter(Boolean),
  }))
}

export function searchAllergies(terms: string) {
  return fetchClinicalTable('allergy/v1/search', terms)
}

export function searchIcd10(terms: string) {
  return fetchClinicalTable('icd10cm/v3/search', terms, { sf: 'code,name' })
}

export function searchLoinc(terms: string) {
  return fetchClinicalTable('loinc_items/v3/search', terms, { df: 'component,long_common_name' })
}

export async function fetchDrugIngredients(rxcui: string): Promise<string[]> {
  if (!rxcui) return []
  const res = await fetch(
    `https://rxnav.nlm.nih.gov/REST/rxcui/${encodeURIComponent(rxcui)}/related.json?tty=IN`,
  )
  if (!res.ok) return []
  const data = (await res.json()) as {
    relatedGroup?: { conceptGroup?: { tty?: string; conceptProperties?: { name: string }[] }[] }
  }
  const ingredients: string[] = []
  for (const group of data.relatedGroup?.conceptGroup ?? []) {
    if (group.tty !== 'IN') continue
    for (const c of group.conceptProperties ?? []) {
      if (c.name) ingredients.push(c.name)
    }
  }
  return ingredients
}
