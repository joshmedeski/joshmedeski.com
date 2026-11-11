---
title: How to Make Your Site LLM-Friendly
description: Serve your content as markdown, treat llms.txt like a table of contents, and let AI agents find their own way around your site
pubDate: 2026-11-11T12:00:00.000Z
heroImage: ../attachments/posts/how-to-make-your-site-llm-friendly/how-to-make-your-site-llm-friendly.webp
areas:
  - development
  - ai
---

More and more people find my content through an AI agent instead of a search engine. Someone asks their agent "how does Josh set up sesh?" and it goes and reads my site.

The problem is that my site was built for browsers. Every page is wrapped in navigation, a footer, newsletter forms, and a pile of markup the agent has to dig through to find the handful of paragraphs it actually wanted.

So I made this site LLM-friendly. Here's what I did, and what I'd do on any site, whatever it's built with.

## Serve your content as markdown

This is the most important part, and it doesn't depend on your stack.

Agents read markdown really well. It's compact, it keeps headings and code blocks intact, and it has none of the noise of a rendered page. So every page on my site now has a markdown twin: add `.md` to the URL and you get the raw content.

- https://www.joshmedeski.com/projects/sesh/ is the page
- https://www.joshmedeski.com/projects/sesh.md is the markdown

How you get there depends on how your site is built. What matters is that **you control a way to render the same content through a different content type**. If your content already starts as markdown files, you're mostly just serving the source. If it lives in a CMS or a database, you'll need a step that converts it.

My site is built with [Astro](https://astro.build) and deployed on [Netlify](https://www.netlify.com). Astro lets any file in `src/pages` be an endpoint instead of a page, so one file covers posts, guides, projects, and uses:

```ts title="src/pages/[type]/[id].md.ts"
import type { APIRoute } from 'astro'
import type { CollectionEntry } from 'astro:content'
import {
  CONTENT_TYPES,
  getPublished,
  type ContentType,
} from '~/utils/siteContent'

export async function getStaticPaths() {
  const groups = await Promise.all(
    CONTENT_TYPES.map(async (type) =>
      (await getPublished(type)).map((entry) => ({
        params: { type, id: entry.id },
        props: { entry },
      })),
    ),
  )
  return groups.flat()
}

export const GET: APIRoute<{ entry: CollectionEntry<ContentType> }> = ({
  props: { entry },
}) =>
  new Response(
    `# ${entry.data.title}\n\n${entry.data.description}\n\n${entry.body}`,
    { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } },
  )
```

Astro builds these into plain `.md` files at build time, and Netlify serves them like any other static file. No server, no function, nothing to keep running.

If you're on a different stack, look for the same idea: a route or template that outputs your content with a different file extension and content type. Most static site generators and frameworks have one.

## Tell agents the markdown exists

An agent that lands on a page from a search result doesn't know there's a cleaner copy one URL away. So every page that has a markdown version also says so in its `<head>`:

```html
<link
  rel="alternate"
  type="text/markdown"
  href="https://www.joshmedeski.com/projects/sesh.md"
/>
```

It's the same tag RSS readers have used for years to find feeds. Not every agent looks for it yet, but it costs one line in my layout.

## Answer agents that ask for markdown

Some agents skip the link and ask for markdown up front, with an `Accept: text/markdown` header on the normal URL. Others don't ask at all, but say who they are in their user agent. A static site ignores both and sends HTML anyway.

So a small [Netlify edge function](https://docs.netlify.com/build/edge-functions/overview/) sits in front of every page that has a markdown version. If the request asks for markdown, or comes from a known AI agent, it returns the `.md` file. Otherwise it passes the request through untouched:

```ts title="netlify/edge-functions/markdown.ts"
export default async (request: Request, context: Context) => {
  const markdownPath = markdownPathFor(new URL(request.url).pathname)
  if (!markdownPath) return

  const asMarkdown =
    wantsMarkdown(request.headers.get('accept')) ||
    isAgent(request.headers.get('user-agent'))

  const response = asMarkdown
    ? await fetch(new URL(markdownPath, request.url))
    : await context.next()

  const headers = new Headers(response.headers)
  headers.append('Vary', 'Accept, User-Agent')
  return new Response(response.body, { status: response.status, headers })
}
```

`isAgent` only matches the fetchers that run while someone is waiting on an answer: `ChatGPT-User`, `Claude-User`, and `Perplexity-User`. I left crawlers like `GPTBot` and Googlebot alone, so search engines see the same page as everyone else.

The `Vary` header matters. Without it, a cache could store the markdown and hand it to the next person who opens the page in a browser.

Try it yourself:

```sh
curl -H "Accept: text/markdown" https://www.joshmedeski.com/projects/sesh/
```

## Every list gets a markdown page too

Single pages weren't enough. An agent also needs to know what exists before it can read it.

So every page on my site that lists things got a markdown version as well:

- `/posts.md` lists every post, newest first, with dates and descriptions
- `/videos.md`, `/guides.md`, and `/projects.md` do the same for their content
- `/uses.md` lists my gear and tools, grouped by area
- `/wallpapers.md` gives an overview of the wallpapers I've made
- `/stats.md` ranks my most viewed videos and posts

Every link in those lists points at the `.md` version of the page. Once an agent lands on one markdown page, it can keep following links and never touch HTML again.

## Let agents browse by topic

My site groups content into areas, which you might call topics, categories, or tags. Each area now has a markdown page that lists everything in it: guides, videos, posts, projects, uses, and appearances.

So if you want to know everything I've written about Claude Code, https://www.joshmedeski.com/areas/claude-code.md has it in one request. A parent area like Terminal includes everything from its sub-areas (fish, Neovim, and tmux).

This turned out to be the most useful way in. Agents rarely want "all posts". They want "everything about tmux".

## Treat llms.txt like a table of contents

[llms.txt](https://llmstxt.org) is a markdown file at the root of your site that tells agents where to start. I used to have a hand-written one. Now it's generated at build time, so it never goes stale.

> [!NOTE] One catch
> As I write this, agents don't go looking for `llms.txt` on their own. They land on a page from a search result and read whatever's there, so you still have to point them at it. That's why the markdown link in every page's `<head>` matters. I hope that changes, because a file agents check before anything else is exactly what `llms.txt` should be.

My first version listed every single post. It worked, but it was mostly one long list that got longer every time I published.

What I landed on is a table of contents, not a catalog. It links to the listings instead of repeating them:

```md
## Content

- [Posts](https://www.joshmedeski.com/posts.md): Every blog post, newest first, with dates and descriptions
- [Videos](https://www.joshmedeski.com/videos.md): Posts that come with a YouTube video
- [Guides](https://www.joshmedeski.com/guides.md): Multi-part guides
```

The few exceptions are things worth having up front. My projects are listed inline, because there are only six and they're the thing people ask about most. Every area is listed with a short explanation of how area pages work. Then there's a section for the newsletter, my RSS feed, and my social links.

The whole file is 67 lines, and publishing a new post doesn't make it any longer.

## Email sign-up was easy

I already had a Netlify function behind the newsletter form on every post. It takes a JSON body with an email address and sends it to my newsletter provider.

So adding email sign-up for agents was just a few lines of documentation in `llms.txt`:

````md
## Newsletter

Get Josh's new posts by email. To subscribe an address, with its owner's permission, send:

```http
POST https://www.joshmedeski.com/.netlify/functions/create-new-subscriber
Content-Type: application/json

{"email": "you@example.com"}
```
````

If you do this, make sure your newsletter sends a confirmation email before it adds someone. An endpoint anyone can call is an endpoint anyone can sign up anybody with.

## Try it out

Copy this prompt into any agent and see what it finds:

```md
Read https://www.joshmedeski.com/llms.txt
and tell me about Josh Medeski.

What does he write about, what has he built,
and where should I start?
```

Then keep asking follow-up questions. The agent starts at `llms.txt` and follows the markdown links from there.

If you build your own, start with the markdown versions of your pages. That's the piece that makes everything else work. Everything after it is just a list of links.
