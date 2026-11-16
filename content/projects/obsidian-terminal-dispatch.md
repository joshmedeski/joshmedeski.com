---
title: Terminal Dispatch
repo: joshmedeski/obsidian-terminal-dispatch
description: An Obsidian plugin that sends the note you're reading to a terminal command or coding agent, and tells you when it's done.
heroImage: ../attachments/projects/obsidian-terminal-dispatch.jpeg
areas:
  - obsidian
  - claude-code
cta:
  label: Add to Obsidian
  url: obsidian://show-plugin?id=terminal-dispatch
---

Handing a note to an agent usually means leaving Obsidian, opening a terminal,
and pasting a path. Terminal Dispatch turns that into a command palette entry.
Each **recipe** is a name plus a shell command that runs in your vault, with the
active note filled in, so "process this meeting" or "file this as an issue" is
one keystroke away. The agent works in your terminal, where it belongs, and
Obsidian stays a launcher.

## Features

- 🧾 **Recipes are just shell commands** — `{file}`, `{vault_path}`,
  `{file_name}`, and `{file_basename}` are filled in before the command runs,
  so anything you can type in a terminal can become an Obsidian command.
- ⌨️ **Prompted input** — put `{input}` in a recipe and it asks for text first,
  for things like "this week, mornings" when scheduling a project.
- 🪟 **Background sessions** — pair it with
  [sesh](https://github.com/joshmedeski/sesh) to open each dispatch in a tmux
  window without stealing focus, or turn on **Focus terminal** to jump there.
- 🔔 **Hear back from Claude Code** — a few Claude Code hooks report session
  state, so the status bar shows what's running and a notice appears when an
  agent finishes or needs you.
- 🤖 **Agent skill included** — `npx skills add joshmedeski/obsidian-terminal-dispatch`
  teaches your coding agent to write recipes for you.
- 🍎 **Works with local models** — a recipe can call Apple's on-device `fm` CLI
  to summarize a note into its `summary:` property, with nothing leaving your Mac.

## Get started

Terminal Dispatch is available on the
[Obsidian community plugin directory](https://community.obsidian.md/plugins/terminal-dispatch),
or use the button above to open it straight inside your vault. Once it's
installed, add a recipe in the plugin's settings and reload the plugin so it
shows up in the command palette. Next on the roadmap:
recipes that run automatically when a note is created or modified.

::gh-repo{repo="joshmedeski/obsidian-terminal-dispatch"}
