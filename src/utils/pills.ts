export type PillSize = 'sm' | 'lg'

export function pillClass(size: PillSize = 'sm'): string {
  const base = 'flex items-center rounded-full bg-neutral-800 text-neutral-200'
  return size === 'lg'
    ? `${base} gap-2 px-4 py-1.5 text-base md:text-lg`
    : `${base} gap-1 px-3 py-1 text-sm`
}
