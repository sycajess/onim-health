import { lazy, type ComponentType } from 'react'
import { reloadOnceOnChunkError } from './chunkError'

export function lazyRoute<T extends Record<string, ComponentType>>(
  loader: () => Promise<T>,
  name: keyof T & string,
) {
  return lazy(() =>
    reloadOnceOnChunkError(async () => {
      const mod = await loader()
      return { default: mod[name] }
    }),
  )
}
