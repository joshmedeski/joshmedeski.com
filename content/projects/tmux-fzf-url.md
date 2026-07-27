---
title: tmux-fzf-url
repo: joshmedeski/tmux-fzf-url
description: Quickly open urls from your terminal screen.
heroImage: ../attachments/projects/tmux-fzf-url-project-preview.jpeg
areas:
  - tmux
---

A URL shows up in your terminal — a docs link in a stack trace, a PR link from
a git push, a dev server address — and opening it means reaching for the mouse
to select it. This tmux plugin scrapes every URL off the screen, hands them to
fzf, and opens whichever ones you pick. It's a fork of
[wfxr/tmux-fzf-url](https://github.com/wfxr/tmux-fzf-url) that I maintain.

## Features

- 🔗 **Screen scraping** — pulls every URL out of the visible pane, no
  selecting or copying required.
- 🔍 **Fuzzy filtering** — pipes the results through fzf so you can narrow a
  screen full of links by typing a few characters.
- ➕ **Multi-select** — mark several URLs and open them all at once.
- 📜 **Scrollback search** — set `@fzf-url-history-limit` to search back
  through your history instead of just what's on screen.
- 🪟 **Popup support** — pass fzf options to run the picker in a floating tmux
  popup rather than a split.
- 🧩 **Custom capture patterns** — extend the matcher with
  `@fzf-url-extra-filter` to catch things that aren't URLs, like file paths.
- ⌨️ **Rebindable key** — defaults to `prefix + u`, changeable with
  `@fzf-url-bind`.

## Get started

Install with tpm, or clone the repo and source `fzf-url.tmux` yourself. It
needs tmux 3.2+, fzf, and bash. Every configuration option is documented on
GitHub.

::gh-repo{repo="joshmedeski/tmux-fzf-url"}
