/** @jsxImportSource react */
import type { ReactNode } from 'react'

export const TERMINAL_CLASS =
  'relative h-full bg-[#11111b] px-[1em] py-[0.8em] font-mono text-[34px] leading-[1.45] text-[#cdd6f4]'

export const Cursor = () => (
  <span className="inline-block h-[1.1em] w-[0.6em] translate-y-[0.15em] bg-[#f5e0dc]" />
)

export function Prompt({ dir, text }: { dir: string; text: string }) {
  return (
    <div>
      <span className="text-[#89b4fa]">{dir}</span>
      <span className="text-[#a6e3a1]"> ❯ </span>
      {text}
      <Cursor />
    </div>
  )
}

export function StatusBar({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-0 whitespace-pre bg-[#00cd00] px-[0.3em] text-black">
      {children}
    </div>
  )
}
