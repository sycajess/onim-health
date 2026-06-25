export type RxNormDrug = {
  rxcui: string
  name: string
  strength: string
}

function extractStrength(name: string): string {
  const m = name.match(
    /\b(\d+(?:\.\d+)?\s*(?:MG|MCG|G|ML|IU|%)(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:MG|MCG|ML))?)\b/i,
  )
  return m ? m[1].replace(/\s+/g, ' ') : ''
}

function cleanDrugName(name: string): string {
  return name.replace(/\s+/g, ' ').trim()
}

export async function searchRxNormDrugs(term: string): Promise<RxNormDrug[]> {
  const q = term.trim()
  if (q.length < 2) return []

  const url = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(q)}`
  const res = await fetch(url)
  if (!res.ok) return []

  const data = (await res.json()) as {
    drugGroup?: { conceptGroup?: { conceptProperties?: { rxcui: string; name: string }[] }[] }
  }

  const seen = new Set<string>()
  const results: RxNormDrug[] = []

  for (const group of data.drugGroup?.conceptGroup ?? []) {
    for (const concept of group.conceptProperties ?? []) {
      const name = cleanDrugName(concept.name)
      const key = `${concept.rxcui}:${name}`
      if (!name || seen.has(key)) continue
      seen.add(key)
      results.push({
        rxcui: concept.rxcui,
        name,
        strength: extractStrength(name),
      })
      if (results.length >= 20) return results
    }
  }

  return results
}

export async function resolveRxcuiForDrug(name: string): Promise<string | null> {
  const results = await searchRxNormDrugs(name)
  if (!results.length) return null
  const q = name.trim().toLowerCase()
  const exact = results.find((r) => r.name.toLowerCase() === q)
  if (exact) return exact.rxcui
  const starts = results.find((r) => r.name.toLowerCase().startsWith(q))
  if (starts) return starts.rxcui
  const contains = results.find((r) => r.name.toLowerCase().includes(q))
  return (contains ?? results[0]).rxcui
}
