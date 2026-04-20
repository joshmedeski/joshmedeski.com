---
title: Sample Style Guide
description: A draft post that exercises every formatting feature — headings, wiki-links, embeds, callouts, GhRepo cards, code blocks, tables, and more.
pubDate: 2026-04-20
heroImage: ../attachments/site/desk.jpeg
category: development
draft: true
aliases:
  - Style Reference
  - Sample Styles
---

This post is a living reference for every style the site supports. It is marked `draft: true`, so it only renders in `pnpm dev` — never in production.

## Headings

# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

## Basic text

A paragraph with **bold text**, _italic text_, ~~strikethrough~~, and `inline code`. Regular links look like [this link to Astro](https://astro.build).

Line break with two trailing spaces —
ends up on a new line.

A paragraph with a footnote reference[^1].

[^1]: Footnote content appears at the bottom of the rendered page.

## Wiki-links

**Internal (resolved):** [[Smart tmux sessions with sesh]] — the plugin resolves the title to `/posts/smart-tmux-sessions-with-sesh`.

**Internal with alias:** [[How to use git worktrees|the worktree post]] — custom display text, same resolution.

**Cross-collection:** [[Dev Workflow Intro]] — links from a post to a guide.

**Broken:** [[This Page Does Not Exist]] — renders with the `broken-link` class (dimmed + strikethrough) but doesn't fail the build.

## Image embeds

### Obsidian-style embed

A single bang-bracket embed — plugin emits an `<img>` whose `src` is resolved via the attachment index:

![[desk.jpeg]]

### Standard markdown image

Works the same — served via the `public/attachments` symlink:

![A desk](/attachments/site/collage-of-josh.jpg)

## Callouts

Obsidian callouts — all 13 standard types render via `rehype-callouts` with the Obsidian theme CSS.

> [!note]
> A note callout. Generic emphasis.

> [!abstract] Summary / TL;DR
> Use for overviews at the top of long posts.

> [!info] Info
> Neutral informational context.

> [!todo] To-do
> Something still in progress.

> [!tip] Tip
> A helpful recommendation.

> [!success] Success
> Confirmation of a completed step.

> [!question] Question
> An open-ended prompt for the reader.

> [!warning] Heads up
> Something to pay attention to.

> [!failure] Failure
> A cautionary pattern to avoid.

> [!danger] Danger
> High-risk or destructive guidance.

> [!bug] Bug
> A known issue or gotcha.

> [!example] Example
> Use for illustrative code or scenarios.

> [!quote] Quote
> "The best way to predict the future is to invent it." — Alan Kay

### Collapsible callouts

> [!note]- Collapsed by default
> Click the caret to open. Body hidden initially.

> [!tip]+ Open by default
> Body visible, but collapsible.

## Code

### Inline

The command `sesh connect` attaches to a running tmux session.

### Fenced block with syntax highlighting

```ts
// TypeScript via expressive-code
export function hello(name: string): string {
  return `Hello, ${name}!`
}
```

```bash
# Shell highlighting
brew install joshmedeski/sesh/sesh
sesh connect $(sesh list -tz | fzf-tmux -p 55%,60%)
```

```toml
# TOML — the kind of config some posts reference
import = ["~/.config/alacritty/catppuccin/catppuccin-mocha.toml"]

[window]
padding.x = 10
padding.y = 10
```

## GitHub repo card (remark directive)

Inline repo card — resolves via `src/data/gh-repos.json`:

::gh-repo{repo="joshmedeski/sesh"}

::gh-repo{repo="jesseduffield/lazygit"}

## Lists

### Unordered

- First item
- Second item
  - Nested item
  - Another nested item
    - Deeply nested
- Back to the top level

### Ordered

1. Step one
2. Step two
3. Step three
   1. Sub-step 3a
   2. Sub-step 3b

### Task lists

- [x] Completed task
- [ ] Outstanding task
- [ ] Another outstanding task

## Tables

| Tool    | Purpose         | Language |
| ------- | --------------- | -------- |
| tmux    | Terminal mux    | C        |
| sesh    | Session manager | Go       |
| lazygit | Git TUI         | Go       |
| Neovim  | Editor          | C/Lua    |

## Blockquotes

> A plain blockquote is different from a callout. It shows with a left border in prose.
>
> It can span multiple paragraphs.

## Horizontal rule

---

## Raw HTML passthrough

A raw `<iframe>` embed — Obsidian tolerates it in preview mode, and Astro renders it as-is:

<iframe
  width="560"
  height="315"
  src="https://www.youtube.com/embed/-yX3GjZfb5Y"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen
></iframe>

## End

If you reached this point, every style pipeline is wired up.
