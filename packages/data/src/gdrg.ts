import gdrgData from './gdrg-data.json'

export type GdrgCode = {
  code: string
  name: string
  tariff?: number
}

export const GDRG_CODES: GdrgCode[] = gdrgData as GdrgCode[]

export function searchGdrgCodes(query: string): GdrgCode[] {
  const q = query.trim().toLowerCase()
  if (!q) return GDRG_CODES.slice(0, 15)
  return GDRG_CODES.filter(
    (g) => g.code.toLowerCase().includes(q) || g.name.toLowerCase().includes(q),
  ).slice(0, 25)
}
