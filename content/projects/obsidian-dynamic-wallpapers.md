---
title: Dynamic Wallpapers
repo: joshmedeski/obsidian-dynamic-wallpapers
description: An Obsidian plugin that gives every note a wallpaper, inherited from the notes it links to.
heroImage: ../attachments/projects/obsidian-dynamic-wallpapers.jpeg
areas:
  - obsidian
cta:
  label: Add to Obsidian
  url: obsidian://show-plugin?id=dynamic-wallpapers
---

Every note in an Obsidian vault looks identical, which makes it hard to feel
where you are. This plugin puts a wallpaper behind the note you're reading —
set directly in frontmatter, or inherited from the notes it links to. Tag a
note with an area and it picks up that area's wallpaper automatically, so a
whole branch of your vault gets a look without you touching a single other
file.

## Features

- 🖼️ **Per-note wallpapers** — point a `wallpaper` frontmatter property at any
  image in your vault.
- 🔗 **Inheritance** — notes without their own wallpaper fall back through a
  chain: a named frontmatter property, other frontmatter links, body links,
  then backlinks. First match wins, and every tier can be switched off.
- 🎨 **Wallpaper picker** — browse a thumbnail gallery of your wallpapers
  directory and click to apply.
- 🗂️ **Related wallpapers** — see every wallpaper that could apply to the
  current note, grouped by the inheritance tier that produced it.
- 🎲 **Random wallpaper** — pull a random one from the note's backlinks, or
  from the full related set, skipping whatever is already on screen.
- 🌗 **Per-theme overlay** — tune a color overlay separately for light and
  dark mode so your text stays readable.
- 📌 **Set wallpaper to note** — save whatever is currently on screen into the
  active note's frontmatter.
- ↔️ **Flip wallpaper** — mirror the current image horizontally in place.
- 🧹 **Thumbnail cache** — clear or rebuild the cached thumbnails behind the
  picker.

Every one of these is a command in the palette (`Cmd/Ctrl + P`), so you can
bind the ones you use to hotkeys.

> [!NOTE]
> Dynamic Wallpapers is desktop-only. It relies on Node.js filesystem APIs
> that Obsidian Mobile doesn't provide.

## Get started

Dynamic Wallpapers is available on the
[Obsidian community plugin directory](https://community.obsidian.md/plugins/dynamic-wallpapers),
or use the button above to open it straight inside your vault. The full
settings reference and a walkthrough of how inheritance resolves are
[on GitHub](https://github.com/joshmedeski/obsidian-dynamic-wallpapers).
