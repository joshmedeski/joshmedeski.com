type Step = { ms: number; hold?: number }

export function timeline<T extends Step>(steps: T[], keyHold: number) {
  const starts = steps.reduce<number[]>(
    (acc, step) => [...acc, acc.at(-1)! + step.ms],
    [0],
  )
  return {
    ms: starts.at(-1)!,
    at(ms: number) {
      const index = Math.min(
        steps.length - 1,
        Math.max(
          0,
          starts.findLastIndex((start) => start <= ms),
        ),
      )
      const step = steps[index]
      return { step, held: ms - starts[index] < (step.hold ?? keyHold) }
    },
  }
}
