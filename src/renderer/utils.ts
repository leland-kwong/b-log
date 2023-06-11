import { Level } from 'level'

export async function measurePerformance<T>(
  label: string,
  fn: () => Promise<T>
) {
  const start = performance.now()
  const fnResult = await fn()
  const end = performance.now()
  const timeTaken = end - start

  console.log(`${label} took`, timeTaken, 'ms')
  return fnResult
}

const db = new Level('./.cache')

export async function cacheGet(cacheKey: string) {
  try {
    const cached = await db.get(cacheKey)
    return cached
  } catch (err: any) {
    if (err.code === 'LEVEL_NOT_FOUND') {
      console.log('Cache miss:', cacheKey)
    } else {
      console.log('Cache error:', err)
    }
    return
  }
}

export async function cacheSet(
  cacheKey: string,
  value: string
) {
  await db.put(cacheKey, value)
}

export async function cacheClose() {
  return await db.close()
}
