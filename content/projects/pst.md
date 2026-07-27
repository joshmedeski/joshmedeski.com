---
title: pst
repo: joshmedeski/pst
description: Local-first speech tooling for macOS, packaged as a Claude Code plugin.
heroImage: ../attachments/projects/pst-project-preview.png
areas:
  - claude-code
  - audio
---

Every text-to-speech option worth using sends your text to somebody else's
server and bills you per character. `pst` runs the whole thing on your Mac
instead — no cloud, no API keys, no metering — using the Kokoro-82M model on
Apple's MLX framework. It ships as a Claude Code plugin, so asking the
assistant to "read that back to me" speaks it aloud through `/pst:tts`.

## Features

- 🔒 **Fully on-device** — speech is generated locally through
  [mlx-audio](https://github.com/Blaizzy/mlx-audio); nothing leaves your
  machine and nothing costs money to run.
- 🗣️ **28 voices** — American and British, female and male, from `af_heart`
  to `bm_george`, with the language inferred from the voice name.
- ✴️ **Claude Code plugin** — installs from its own marketplace and exposes
  `/pst:tts`, which the agent triggers on its own when you ask to hear
  something.
- 🔁 **Always-on mode** — `/pst:tts always` speaks a summary at the end of
  every turn, and `verbose` narrates the work as it happens. Session-scoped,
  cleared when the conversation ends.
- ⚡ **Streamed playback** — audio plays as it generates, straight to
  `afplay`, with nothing written to disk.
- ⚖️ **Quality comparison** — `tts-compare` renders the same sentence across
  every Kokoro quantization so you can pick the trade-off by ear.
- 🧰 **One-command setup** — `/pst:setup` installs the engine via `uv` and is
  idempotent, so it doubles as a repair command.

## Get started

Add the marketplace with `/plugin marketplace add joshmedeski/pst`, install
`pst@pst`, then run `/pst:setup` once. It needs macOS on Apple Silicon and
[uv](https://github.com/astral-sh/uv). Voice modes, the CLI flags, and the
roadmap toward speech-to-text and a full duplex voice loop are all on GitHub.

::gh-repo{repo="joshmedeski/pst"}
