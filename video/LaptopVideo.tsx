/** @jsxImportSource react */
import type { ComponentProps } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { Laptop } from '../src/components/vectoys/laptop/laptop'

const ZOOM = 1.3
const LIFT_PX = 40

export function useScreenMs() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (frame / fps) * 1000
}

export function LaptopVideo(props: ComponentProps<typeof Laptop>) {
  return (
    <AbsoluteFill className="justify-center bg-[#1e1e2e] [--vectoys-bg:#1e1e2e] [--vectoys-shadow:rgba(0,0,0,0.5)]">
      <div style={{ transform: `translateY(-${LIFT_PX}px) scale(${ZOOM})` }}>
        <Laptop {...props} draggable={false} fullscreen={false} />
      </div>
    </AbsoluteFill>
  )
}
