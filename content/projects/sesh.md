---
title: sesh
repo: joshmedeski/sesh
description: Smart session manager for the terminal
heroImage: ../attachments/projects/sesh-project-preview.jpeg
areas:
  - tmux
---

Sesh is a CLI that creates and manages tmux sessions from anywhere on your
machine. Instead of remembering which sessions exist and manually `cd`-ing to a
project before attaching, you fuzzy-find across your running sessions, your
zoxide history, and your configured projects — then jump straight in. If a
session doesn't exist yet, sesh creates it and names it for you.

## Features

- ⚡ **Smart session creation** — names sessions after the git repo, git
  remote, or directory so you never end up with `0`, `1`, and `2`.
- 📁 **Zoxide integration** — your most-visited directories become sessions
  you can jump to instantly.
- ⚙️ **Per-project configuration** — define startup commands, windows, and
  preview commands for a project in `sesh.toml`.
- ✳️ **Wildcard configs** — apply one config to every project matching a glob
  instead of repeating yourself.
- 🔍 **Built-in picker** — an interactive session selector out of the box, or
  wire it up to fzf, television, or gum.
- 🪟 **Window management** — `sesh window` lists, switches, and creates
  windows the same way `sesh connect` handles sessions.
- 🔄 **Last session switching** — bounce between your two most recent sessions
  with a single command.
- 📋 **Clone and connect** — clone a git repo and start a session for it in
  one step.
- ⌨️ **Shell completions** — tab completion for Bash, Zsh, fish, and
  PowerShell.

## Get started

Sesh installs via Homebrew, Go, Nix, Conda, and the AUR. Installation steps,
the full `sesh.toml` reference, and example tmux keybindings all live on
GitHub.

::gh-repo{repo="joshmedeski/sesh"}
