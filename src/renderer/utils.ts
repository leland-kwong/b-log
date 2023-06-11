export async function measurePerformance<T>(
  fn: () => Promise<T>,
  label: string
) {
  const start = performance.now()
  const fnResult = await fn()
  const end = performance.now()
  const timeTaken = end - start

  console.log(`${label} took`, timeTaken, 'ms')
  return fnResult
}
