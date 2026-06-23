export type CodedEntry = {
  code: string
  name: string
  terms?: string[]
}

export function parseCodedEntries(raw: unknown): CodedEntry[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((x) => x && typeof x === 'object' && 'code' in x && 'name' in x)
    .map((x) => ({
      code: String((x as CodedEntry).code),
      name: String((x as CodedEntry).name),
      terms: Array.isArray((x as CodedEntry).terms)
        ? (x as CodedEntry).terms!.map(String)
        : undefined,
    }))
}

export function formatCodedList(entries: CodedEntry[]): string {
  return entries.map((e) => (e.code ? `${e.name} (${e.code})` : e.name)).join(', ')
}

export function codedEntryTerms(entry: CodedEntry): string[] {
  const base = [entry.name, entry.code, ...(entry.terms ?? [])]
  return base.map((t) => t.toLowerCase().trim()).filter(Boolean)
}
