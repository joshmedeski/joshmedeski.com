/** @jsxImportSource react */
import { Composition } from 'remotion'
import {
  FRAMES,
  KEY_HOLD,
  Terminal,
} from '../src/components/vectoys/SeshLaptop'
import { LaptopVideo, useScreenMs } from './LaptopVideo'
import { timeline } from './timeline'
import './style.css'

const FPS = 60
const SIZE = 1080

const [first, ...rest] = FRAMES
const blank = { ...first, ms: first.ms / 2 }
const sesh = timeline([blank, ...rest, blank], KEY_HOLD)

function SeshVideo() {
  const { step, held } = sesh.at(useScreenMs())
  return (
    <LaptopVideo
      label="sesh demo"
      look="realistic"
      yaw={-12}
      pressed={held ? step.pressed : undefined}
    >
      <Terminal frame={step} />
    </LaptopVideo>
  )
}

export function Root() {
  return (
    <Composition
      id="sesh"
      component={SeshVideo}
      fps={FPS}
      width={SIZE}
      height={SIZE}
      durationInFrames={Math.round((sesh.ms / 1000) * FPS)}
    />
  )
}
