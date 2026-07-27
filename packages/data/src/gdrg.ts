import gdrgData from './gdrg-data.json'

export type GdrgCode = {
  code: string
  name: string
  tariff?: number
}

export const GDRG_CODES: GdrgCode[] = gdrgData as GdrgCode[]

export function searchGdrgCodes(query: string): GdrgCode[] {
  const q = query.trim().toLowerCase()
  if (!q) return GDRG_CODES.slice(0, 20)
  const exactCode = GDRG_CODES.filter((g) => g.code.toLowerCase() === q)
  if (exactCode.length) return exactCode
  const starts = GDRG_CODES.filter(
    (g) => g.code.toLowerCase().startsWith(q) || g.name.toLowerCase().startsWith(q),
  )
  const contains = GDRG_CODES.filter(
    (g) =>
      !starts.includes(g) &&
      (g.code.toLowerCase().includes(q) || g.name.toLowerCase().includes(q)),
  )
  return [...starts, ...contains].slice(0, 40)
}
