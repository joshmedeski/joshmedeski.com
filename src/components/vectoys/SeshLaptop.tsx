/** @jsxImportSource react */
import { useEffect, useState } from 'react'
import { Laptop } from './laptop/laptop'
import { Cursor, Prompt, StatusBar, TERMINAL_CLASS } from './terminal'

type Session = { icon: string; name: string; key?: string }

const SESSIONS: Session[] = [
  { icon: '🧠', key: 'sb', name: 'second brain' },
  { icon: '⚡', key: 'sc', name: 'sesh config' },
  { icon: '🏠', key: 'df', name: 'dotfiles' },
  { icon: '🌐', name: 'joshmedeski_com' },
  { icon: '⚡', key: 'ss', name: 'sesh' },
  { icon: '🔊', name: 'pst' },
  { icon: '🔗', name: 'tmux-fzf-url' },
  { icon: '🪟', name: 'tmux-nerd-font-window-name' },
  { icon: '💎', name: 'obsidian-terminal-dispatch' },
  { icon: '🖼️', name: 'obsidian-dynamic-wallpapers' },
  { icon: '📚', name: 'second-brain-starter-vault' },
]

const TEXT_SIZE = 40

type Place = { name: string; dir: string }

const SITE: Place = { name: 'joshmedeski_com', dir: '~/c/joshmedeski_com' }
const SESH_CONFIG: Place = { name: 'sesh config', dir: '~/.config/sesh' }

type Screen = 'shell' | 'picker' | 'session'
type Frame = {
  screen: Screen
  text: string
  ms: number
  at?: Place
  keys?: string
  pressed?: string[]
  hold?: number
}

const RHYTHM = [1.3, 0.6, 0.8, 0.5, 1.1, 0.7, 1.4, 0.6, 0.9, 0.5, 1.2]
const WORD_PAUSE = 2.5
const KEY_HOLD = 120

const keyFor = (char: string) => (char === ' ' ? 'space' : char)

const typing = (screen: Screen, word: string, ms: number): Frame[] =>
  [...word].map((char, i) => ({
    screen,
    text: word.slice(0, i + 1),
    ms: ms * RHYTHM[i % RHYTHM.length] * (char === ' ' ? WORD_PAUSE : 1),
    pressed: [keyFor(char)],
  }))

const enter = (screen: Screen, text: string): Frame[] => [
  { screen, text, ms: 500 },
  { screen, text, ms: 180, pressed: ['return'] },
]

const MODIFIER_LEAD = 250

const chord = (keys: string, pressed: string[]): Frame[] => [
  {
    screen: 'session',
    text: '',
    ms: MODIFIER_LEAD,
    keys: keys.slice(0, 1),
    pressed: pressed.slice(0, 1),
    hold: MODIFIER_LEAD * 2,
  },
  { screen: 'session', text: '', ms: 650, keys, pressed, hold: 400 },
]

const inside = (at: Place, frames: Frame[]) =>
  frames.map((frame) => ({ ...frame, at }))

const FRAMES: Frame[] = [
  { screen: 'shell', text: '', ms: 1200 },
  ...typing('shell', 'sesh picker', 110),
  ...enter('shell', 'sesh picker'),
  { screen: 'picker', text: '', ms: 4000 },
  ...typing('picker', 'jom', 260),
  ...enter('picker', 'jom'),
  ...inside(SITE, [
    { screen: 'session', text: '', ms: 1800 },
    ...chord('⌘K', ['command', 'k']),
    { screen: 'picker', text: '', ms: 1500 },
    { screen: 'picker', text: 's', ms: 450, pressed: ['s'] },
    { screen: 'picker', text: 'sc', ms: 200, pressed: ['c'] },
  ]),
  ...inside(SESH_CONFIG, [
    { screen: 'session', text: '', ms: 2000 },
    ...chord('⌘L', ['command', 'l']),
  ]),
  ...inside(SITE, [
    { screen: 'session', text: '', ms: 2000 },
    ...typing('session', 'tmux kill-server', 75),
    ...enter('session', 'tmux kill-server'),
  ]),
]

const PICKER_FRAME = FRAMES.findIndex((f) => f.screen === 'picker')

const fuzzy = (name: string, query: string) => {
  const found: number[] = []
  for (const char of query) {
    const at = name.indexOf(char, (found.at(-1) ?? -1) + 1)
    if (at < 0) return null
    found.push(at)
  }
  return found
}

function Name({ name, query }: { name: string; query: string }) {
  const found = new Set(fuzzy(name, query) ?? [])
  return (
    <span>
      {[...name].map((char, i) =>
        found.has(i) ? (
          <span key={i} className="text-[#a6e3a1]">
            {char}
          </span>
        ) : (
          char
        ),
      )}
    </span>
  )
}

function KeyPill({ shortcut, query }: { shortcut: string; query: string }) {
  const typed = query && shortcut.startsWith(query) ? query : ''
  const rest = shortcut.slice(typed.length)

  return (
    <span className="inline-flex overflow-hidden rounded-[0.5em] text-[#1e1e2e]">
      {typed && (
        <span className={`bg-[#a6e3a1] pl-[0.4em] ${rest ? '' : 'pr-[0.4em]'}`}>
          {typed}
        </span>
      )}
      {rest && (
        <span
          className={`bg-[#c6cdf0] pr-[0.4em] ${typed ? '' : 'pl-[0.4em]'}`}
        >
          {rest}
        </span>
      )}
    </span>
  )
}

function Row({
  session,
  selected,
  query,
}: {
  session: Session
  selected: boolean
  query: string
}) {
  return (
    <li className="flex items-center gap-[0.6em]">
      <span className="w-[1.2em] text-center">{selected ? '👉' : ''}</span>
      <span className="w-[1.2em] text-center">{session.icon}</span>
      {session.key && <KeyPill shortcut={session.key} query={query} />}
      <Name name={session.name} query={query} />
    </li>
  )
}

function Picker({ query }: { query: string }) {
  const match = (s: Session) =>
    fuzzy(s.name, query) !== null || Boolean(s.key?.startsWith(query))
  const matches = SESSIONS.filter(match)

  return (
    <>
      <div className="mb-[0.8em] flex items-center gap-[0.6em]">
        <span className="w-[1.2em]" />
        <span className="w-[1.2em] text-center">⚡</span>
        <span>
          {query ? (
            <>
              {query}
              <Cursor />
            </>
          ) : (
            <>
              <span className="bg-[#f5e0dc] text-[#11111b]">C</span>
              <span className="text-[#6c7086]">hoose a session</span>
            </>
          )}
        </span>
      </div>
      <ul>
        {matches.map((s) => (
          <Row
            key={s.name}
            session={s}
            selected={s === matches[0]}
            query={query}
          />
        ))}
      </ul>
    </>
  )
}

function Terminal({ frame }: { frame: Frame }) {
  const { screen, text, at, keys } = frame

  return (
    <div aria-hidden className={TERMINAL_CLASS} style={{ fontSize: TEXT_SIZE }}>
      {screen === 'shell' && <Prompt dir="~" text={text} />}
      {screen === 'picker' && <Picker query={text} />}
      {screen === 'session' && at && <Prompt dir={at.dir} text={text} />}
      {at && <StatusBar>[{at.name}] 0:fish*</StatusBar>}
      {keys && (
        <kbd className="absolute right-[1em] bottom-[2.6em] rounded-[0.3em] border-2 border-[#585b70] bg-[#313244] px-[0.5em] py-[0.1em] font-sans text-[#cdd6f4]">
          {keys}
        </kbd>
      )}
    </div>
  )
}

export default function SeshLaptop() {
  const [index, setIndex] = useState(0)
  const [held, setHeld] = useState(false)
  const frame = FRAMES[index]

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIndex(PICKER_FRAME)
      return
    }
    setHeld(true)
    const release = setTimeout(() => setHeld(false), frame.hold ?? KEY_HOLD)
    const next = setTimeout(
      () => setIndex((i) => (i + 1) % FRAMES.length),
      frame.ms,
    )
    return () => {
      clearTimeout(release)
      clearTimeout(next)
    }
  }, [index])

  return (
    <Laptop
      label="Animation of sesh: typing sesh picker opens the session picker, fuzzy searching jom opens the joshmedeski_com tmux session, then pressing Command K and typing sc jumps straight to sesh config, then Command L switches back to joshmedeski_com, where tmux kill-server ends it all"
      look="realistic"
      yaw={-12}
      pressed={held ? frame.pressed : undefined}
    >
      <Terminal frame={frame} />
    </Laptop>
  )
}
