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

  const params = new URLSearchParams({ terms: q, maxList: '20' })
  const res = await fetch(`https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?${params}`)
  if (!res.ok) return []

  const data = (await res.json()) as [number, string[], unknown, string[]]
  const codes = data[1] ?? []
  const names = data[3] ?? []

  const seen = new Set<string>()
  const results: RxNormDrug[] = []

  codes.forEach((rxcui, i) => {
    const name = cleanDrugName(String(names[i] ?? ''))
    const key = `${rxcui}:${name}`
    if (!name || seen.has(key)) return
    seen.add(key)
    results.push({
      rxcui: String(rxcui),
      name,
      strength: extractStrength(name),
    })
  })

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
