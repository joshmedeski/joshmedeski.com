---
title: Upgrading to Astro 7
description: My markdown pipeline got smaller, my checks went green, and AI agents did the tedious parts
pubDate: 2026-09-21T12:00:00.000Z
heroImage: ../attachments/posts/upgrading-to-astro-7/upgrading-to-astro-7.webp
areas:
  - development
---

I jumped this site from Astro 5 straight to [Astro 7](https://astro.build/blog/astro-7/). Two majors in one pass, no stopping in the middle.

I expected the usual major-version tax: shims, workarounds, a pile of new config to keep old things working. Instead the site came out of it smaller than it went in. That's not something I get to say very often.

## New Markdown Processor

Astro 7 swaps the default markdown processor to Sätteri, and this was easily the most helpful part of the upgrade.

I have three custom things in my markdown: a plugin that turns `::gh-repo` directives into GitHub repo cards, callouts in Obsidian syntax, and the directive parser that makes the first one possible.

The directive parser is the one that went away. The new processor handles that syntax natively — one feature flag, and all 53 of my `::gh-repo` embeds kept working without touching a single post. A dependency I'd been carrying for years turned out to be built in.

My repo-card plugin came along with it and got smaller in the process. The old one had to crawl the document tree by hand looking for nodes to swap out, because the old system had no way to say "replace this node with that one." The new one does. Ninety lines became twenty.

For callouts there was a direct port available, so that was one import line and nothing else. The rendered HTML came out identical.

Same repo cards, same callouts, same 154 pages — and one less dependency to keep up with.

## Node 24, because that's as far as I can go

I also moved from Node 22 to 24 while I was in there.

Not 26, even though 26 exists. Netlify limits which Node versions I can actually build and run functions on, and 24 is the newest one that's fully supported. So that's where I landed.

I've made peace with this. There's always a newer version than the one I'm allowed to use, and chasing it on a site with real deploys is a good way to break something for no benefit. 22 was heading toward the end of its life, 24 is the current long-term release, and that's forward. Forward is enough.

## Cleaning Up Checks

Here's the part I didn't plan on.

My type checker had been reporting 16 errors for a while. My formatter had been failing quietly. Neither broke the build, so neither got fixed — that's how this stuff goes. But I was already in the code, so I cleaned them up.

Both are at zero now, and two of those "errors" were real bugs hiding in plain sight.

One was a link in an old post with an empty destination. It had been shipping as a link to nowhere since the day I published it, and nobody told me. The other was a component passing an image object into a raw `<img>` tag, which would have rendered literal garbage on the page — except nothing imports that component, so it never got the chance. Checking whether it was even used explained the bug faster than reading the error did.

| Check       | Before    | After     |
| ----------- | --------- | --------- |
| Type errors | 16        | 0         |
| Formatting  | failing   | passing   |
| Tests       | 42 passed | 42 passed |
| Pages built | 154       | 154       |
| Node        | 22        | 24        |

Green checks aren't the point on their own. The point is that the next time something in there goes red, I'll believe it. A check that's been failing for months is just noise you've trained yourself to scroll past.

## Working with AI Agents

Last thing, and I mean it sincerely.

An upgrade like this used to be a grind. Two major versions of a framework, a markdown pipeline swap, a dozen dependency bumps, and a pile of accumulated type errors — that's a week of tedious work where most of the effort goes into finding what broke rather than fixing it.

Working with AI agents, I went through the whole site in one sitting. Not because the agent made the decisions — I still had to decide to move to the new parser, decide to stay on Node 24, decide which components to delete. But the sifting, the "check all 154 pages," the "find every place this pattern appears," the tedious verification work I'd normally rush or skip — that got done properly instead of getting done quickly.

And the verification is the part I'm most glad about. I finished this upgrade with more confidence in my site than I started with, because I could afford to actually check things rather than hope. That's a better trade than the time savings.
