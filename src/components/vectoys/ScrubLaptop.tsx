/** @jsxImportSource react */
import { useScrub } from '@vinena/vectoys-react'
import { useEffect, useRef, type ComponentProps } from 'react'
import { Laptop, type LaptopHandle } from './laptop/laptop'

const CLOSED_BUFFER_VH = 25
const OPEN_SPAN_VH = 40

export function ScrubLaptop(props: ComponentProps<typeof Laptop>) {
  const track = useRef<HTMLDivElement>(null)
  const laptop = useRef<LaptopHandle>(null)
  const { progress, reduced } = useScrub(track, {
    screens: 1 + OPEN_SPAN_VH / 100,
  })

  useEffect(() => {
    if (reduced) return
    const open = (lid: number) => laptop.current?.set({ lid })
    open(progress.get())
    return progress.subscribe(open)
  }, [progress, reduced])

  return (
    <div className="relative">
      <div
        ref={track}
        aria-hidden
        className="pointer-events-none absolute inset-x-0"
        style={{
          top: `${CLOSED_BUFFER_VH - 100}vh`,
          height: `${100 + OPEN_SPAN_VH}vh`,
        }}
      />
      <Laptop {...props} ref={laptop} lid={reduced ? 1 : 0} />
    </div>
  )
}
