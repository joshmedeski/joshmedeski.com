/** @jsxImportSource react */
import { useEffect, useState } from 'react'
import { ScrubLaptop } from './ScrubLaptop'
import { Prompt, StatusBar, TERMINAL_CLASS } from './terminal'

const WINDOWS = [
  { name: 'zsh', icon: '🐚', flag: ' ' },
  { name: 'claude', icon: '🤖', flag: '-' },
  { name: 'nvim', icon: '📝', flag: '*' },
]

type Window = (typeof WINDOWS)[number]

const PHASES = [
  { session: 'default', label: (w: Window) => w.name },
  { session: 'icons only', label: (w: Window) => w.icon },
  { session: 'icon + title', label: (w: Window) => `${w.icon}${w.name}` },
]

const PHASE_MS = 2800
const TEXT_SIZE = 46

function Terminal() {
  const [phase, setPhase] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPlaying(false)
      setPhase(PHASES.length - 1)
    }
  }, [])

  useEffect(() => {
    if (!playing) return
    const timer = setInterval(
      () => setPhase((p) => (p + 1) % PHASES.length),
      PHASE_MS,
    )
    return () => clearInterval(timer)
  }, [playing])

  const { label } = PHASES[phase]

  return (
    <div className={TERMINAL_CLASS} style={{ fontSize: TEXT_SIZE }}>
      <div aria-hidden>
        <Prompt dir="~" text="" />
      </div>
      <div
        role="group"
        aria-label="Window name style"
        className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center gap-[0.6em]"
      >
        {PHASES.map(({ session }, i) => (
          <button
            key={session}
            type="button"
            aria-pressed={i === phase}
            onClick={() => {
              setPlaying(false)
              setPhase(i)
            }}
            className={`cursor-pointer rounded-[0.4em] border-2 px-[0.7em] py-[0.25em] transition-colors ${
              i === phase
                ? 'border-[#00cd00] bg-[#00cd00] text-black'
                : 'border-[#45475a] text-[#cdd6f4] hover:border-[#00cd00]'
            }`}
          >
            {session}
          </button>
        ))}
      </div>
      <div aria-hidden>
        <StatusBar>
          {`[dotfiles] ${WINDOWS.map((w, i) => `${i}:${label(w)}${w.flag}`).join(' ')}`}
        </StatusBar>
      </div>
    </div>
  )
}

export default function TmuxIconsLaptop() {
  return (
    <ScrubLaptop
      label="A tmux status bar with windows zsh, claude and nvim, shown with default names, icons only, or icon and name"
      look="realistic"
      yaw={-12}
    >
      <Terminal />
    </ScrubLaptop>
  )
}
