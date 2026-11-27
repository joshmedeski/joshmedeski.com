---
title: Semantic Search Over My Obsidian Vault with qmd
description: How I index 4,700 Obsidian notes locally with qmd, keep the index fresh with launchd, and serve it as an MCP server my AI agents reach over Tailscale.
pubDate: 2026-12-01T12:00:00.000Z
heroImage: ../attachments/posts/semantic-search-over-my-obsidian-vault-with-qmd/semantic-search-over-my-obsidian-vault-with-qmd.jpeg
areas:
  - obsidian
  - ai
draft: true
---

I ask my agents about my own notes all the time. What did I decide about that plugin? Where did I write down that launchd gotcha? The answer is almost always somewhere in my Obsidian vault, but it rarely uses the words I search with.

Grep can't help with that. When my words don't match the note's words, a keyword search comes back empty, and an empty result looks exactly like "there's no note about this."

So I gave my agents real semantic search over the whole vault with [qmd](https://github.com/tobi/qmd). It indexes about 4,700 notes on a Mac mini, re-indexes itself every 15 minutes, and serves an MCP server that any of my agents can reach over Tailscale. Everything runs locally. No note leaves my machines to get embedded.

<!-- TODO: Screenshot of an agent answering a vault question, showing the qmd `query` and `get` tool calls. -->

## What qmd is

qmd is a small search engine for markdown, written by Tobi Lütke. You point it at a folder, and it builds a local index that supports three kinds of search:

- `qmd search` is BM25 keyword search. It's fast and loads no model.
- `qmd vsearch` is vector search over embeddings.
- `qmd query` combines both, expands your query with a small local model, and reranks the results with another one.

All three models are small GGUF files that run on your machine. Mine take about 2.2 GB on disk:

- Embedding: `embeddinggemma-300M-Q8_0`
- Query expansion: `qmd-query-expansion-1.7B-q4_k_m`
- Reranking: `qwen3-reranker-0.6b-q8_0`

It also ships an MCP server with five tools: `query`, `get`, `multi_get`, `status`, and `metadata`. That's the part that lets agents use it.

## Install it with its own Node

qmd is an npm package, so it needs Node. Learn from my mistake here: give it a Node of its own.

My first install on the Mac mini lived inside the Node runtime bundled with Hermes Agent, another agent tool I was trying out. When I uninstalled Hermes, qmd went with it. My reindex job kept running on schedule and silently did nothing for eight days before I noticed.

Now it uses a standalone, keg-only Node from Homebrew:

```sh
brew install node@24
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
npm install -g @tobilu/qmd
qmd --version
```

That gave me qmd 2.9.0 at `/opt/homebrew/bin/qmd`. Uninstalling some other tool can't take it down anymore.

## Point it at the vault

I have one collection, `second-brain`, for the whole vault. You can create one with the CLI:

```sh
qmd collection add ~/path/to/vault --name second-brain
qmd embed
qmd status
```

After that, I manage it in `~/.config/qmd/index.yml`. These are the two settings that matter most:

```yaml
pattern: "**/*.md,Assets/**/*.txt"
ignore:
  - "**/*.html"
  - "**/*.csv"
```

The pattern is an allowlist, so I index markdown plus plain-text files under `Assets/`, and nothing else.

I learned this one the hard way. I once widened the pattern to include HTML and CSV, since they're text too. When I measured it, 31 HTML files held 9.1 MB of indexed text, more than all 4,138 markdown notes at the time combined, which came to 7.4 MB. qmd has no HTML or CSV parser. It reads every file as plain text and chunks it, so raw markup and CSV rows got embedded as noise that competed with real notes on every search. I put the allowlist back and ran `qmd cleanup` to reclaim the space.

The same rule applies to PDFs. If I want one to be searchable, I convert it to markdown first.

My `ignore` list also excludes a couple of private folders. `ignore` keeps a file out of the index and also blocks `qmd get` from returning it, so an agent can't pull those notes through search at all. If you have notes you never want an agent to see, put them in `ignore` before you build the index.

<!-- TODO: Optional personal detail. Why you fence some folders off, in general terms only. -->

## Contexts label results, they don't rank them

qmd lets you attach a description to a path, called a context. I have 14, one per folder in my PARA setup:

```sh
qmd context add qmd://second-brain "Josh Medeski's personal knowledge base, organized with the PARA method"
qmd context add "qmd://second-brain/Projects/Active" "Projects Josh is actively working on"
```

I assumed contexts would steer the ranking. They don't. The reranker only sees the query and the chunk text, so contexts are labels that come back with results. Asking "what am I working on" can still rank an old archived note first.

The fix is to name what you're after. Specific queries rank well. For "what's active right now," my agents read `Projects/Active/` directly instead of searching.

One more trap if you came from qmd 1.x: 1.x matched lowercase slugs like `projects/active`, and 2.x matches the literal path. After I upgraded, 11 of my 12 contexts at the time silently stopped matching. `qmd context list` shows you what still resolves.

## Pick the right search mode

Speed depends almost entirely on the mode. When I measured it on my vault:

| Command | Time |
| --- | --- |
| `qmd search` | 0.08s |
| `qmd query` | 3.6s |
| `qmd query`, same query again | 1.6s |

So keyword search goes first when I know a literal phrase, a title, or a name.

The catch is that the score won't tell you when keyword search is wrong. For "keeping private records off the machine that reads my notes," keyword search gave me three hits at 92%, 89%, and 87%. All three were wrong. BM25 percentages are relative to whatever matched. They don't measure whether the question was answered.

So my agents follow three rules instead of judging scores:

1. Zero keyword hits always get re-run as a semantic `query`.
2. Read the full note before treating a hit as the answer, because search results are snippets.
3. Only a semantic miss can support "there's no note on this."

A keyword miss tells you about vocabulary. It doesn't tell you what's in the vault.

## Keep the index fresh with launchd

I never run `qmd update` or `qmd embed` by hand. The vault syncs to the Mac mini with Syncthing, and a launchd agent re-indexes it every 900 seconds at low priority:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.yourname.qmd-watch</string>
  <key>ProgramArguments</key>
  <array>
    <string>/Users/you/path/to/vault/.claude/hooks/reindex-qmd.sh</string>
    <string>--sync</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StartInterval</key>
  <integer>900</integer>
  <key>Nice</key>
  <integer>10</integer>
  <key>LowPriorityIO</key>
  <true/>
</dict>
</plist>
```

launchd doesn't expand `~` or `$HOME`, so every path in a plist has to be absolute.

Use `StartInterval`, not `WatchPaths`. My first plist watched the vault root, but `WatchPaths` isn't recursive, so it would have missed every edit inside a subfolder. It also never ran once.

At its core, the script runs two commands:

```sh
qmd update   # pick up new, changed, and deleted notes
qmd embed    # embed anything that changed
```

Mine does a bit more, because I learned a few things the hard way:

- **It skips when nothing changed.** `qmd update` clears qmd's query cache every time it runs, even when nothing changed, so search never ran warm. Skipping no-op runs took a repeated query from 3.72s to 1.61s. A full pass still runs every 60 minutes as a backstop.
- **It uses a lock.** Two processes writing to `index.sqlite` at once is the one thing that corrupts the index, so the launchd job and my Claude Code hook share a `mkdir` lock.
- **It cleans up rarely.** Editing notes leaves orphaned vectors behind. The script runs `qmd cleanup` only when orphans reach 20%, since cleanup rewrites the whole index file.
- **It finds a working Node.** launchd starts with a minimal `PATH`, so the script probes for a Node that works with qmd and caches the path.

Everything gets logged to `~/.cache/qmd/vault-reindex.log`. Worst case, a note shows up in search about 15 minutes after I save it, plus whatever lag Syncthing adds.

<!-- TODO: Consider linking the full reindex-qmd.sh as a gist, once the hardcoded paths are cleaned up. -->

## Serve it as an MCP server

My agents don't have a shell on the Mac mini, so they can't run `qmd query` themselves. They need the MCP server.

qmd's MCP server speaks stdio by default, but it also has an HTTP mode. One long-running server keeps the models loaded between requests instead of starting a new process for every client:

```sh
qmd mcp --http --port 8181
```

It binds to localhost only. A second launchd agent keeps it running:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.yourname.qmd-mcp</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/qmd</string>
    <string>mcp</string>
    <string>--http</string>
    <string>--port</string>
    <string>8181</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/opt/node@24/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
    <key>QMD_ALLOWED_HOSTS</key>
    <string>your-mac.your-tailnet.ts.net</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/Users/you/.cache/qmd/mcp.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/you/.cache/qmd/mcp.log</string>
</dict>
</plist>
```

`RunAtLoad` starts it at login, and `KeepAlive` restarts it if it dies. The `PATH` matters because the `qmd` launcher runs through `node`, and launchd won't find Homebrew's keg-only Node on its own.

Load it with `launchctl`:

```sh
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.yourname.qmd-mcp.plist
curl http://localhost:8181/health
```

## Reach it over Tailscale

The MCP server only listens on localhost. Tailscale Serve puts it on my tailnet with HTTPS:

```sh
tailscale serve --bg --https=443 http://localhost:8181
tailscale serve status
```

`--bg` keeps the config across reboots, so it doesn't need its own launchd job. To turn it off later, run `tailscale serve --https=443 off`.

This is where `QMD_ALLOWED_HOSTS` from the plist comes in. qmd's HTTP server checks the `Host` header to block DNS rebinding attacks. Requests through Tailscale Serve arrive with your `ts.net` hostname, so qmd rejects them with a 403 unless that hostname is on the list. If your connection fails with a 403, check this first. Don't reach for `QMD_ALLOWED_ORIGINS=*`, because it turns the checks off entirely.

Then check it from another machine on your tailnet:

```sh
curl https://your-mac.your-tailnet.ts.net/health
```

qmd's MCP server has no authentication. My setup relies on the tailnet being private. Never move it to `tailscale funnel`, which exposes it to the public internet, unless you put an auth layer in front of it.

## Connect your agents

Any MCP client that supports HTTP servers can use the `/mcp` endpoint. I added it to Grok Bot as a custom connector called "qmd," so every one of my bots can search the vault as long as the Mac mini is awake.

<!-- TODO: Screenshot of the qmd custom connector in Grok Bot's settings. -->

For a client that reads a JSON config, like Claude Code's `.mcp.json`, it looks like this:

```json
{
  "mcpServers": {
    "qmd": {
      "type": "http",
      "url": "https://your-mac.your-tailnet.ts.net/mcp"
    }
  }
}
```

Tools alone weren't enough, though. I also told my agents when to use them: search with `query` before creating a new note, so they don't duplicate one, and read the full note with `get` before answering from a search result.

To confirm it worked, I asked Grok Bot a question only my vault could answer and watched it call `query`, then `get`.

On my MacBook Pro, Claude Code still uses the qmd CLI through a skill instead of the MCP server. The skill's description tells Claude when to search, and I've found that a much stronger signal than a bare tool name. I pre-allow the read commands in my Claude Code permissions and deny the ones that change the index, like `qmd update` and `qmd cleanup`, so only my scripts touch the index. If you want the details, I covered permissions in [Tuning Your Claude Code Settings](/posts/tuning-your-claude-code-settings).

## Health checks

When something feels off, these three commands tell me where:

```sh
curl https://your-mac.your-tailnet.ts.net/health
qmd status
launchctl print gui/$(id -u)/com.yourname.qmd-watch
```

`qmd status` shows the document count, whether anything needs embedding, and how many orphaned vectors there are. Right now it reports 4,724 documents in `second-brain`, with nothing waiting to be embedded.

## What I'd still change

The setup works, but a few parts are still tied to my machines:

- The reindex script has my home folder hardcoded in a dozen places. I want it to work out every path from where it lives.
- The plists and `index.yml` live outside the vault. Moving them into the vault, with an install script that fills in the paths, would let both machines run the same setup.
- Each machine keeps its own `index.sqlite`, and that stays. Syncing a SQLite file between two machines that both write to it is how you corrupt it.

## Wrapping up

qmd gave my agents a way to find ideas in my vault, not only files. It runs locally, a launchd job keeps it within about 15 minutes of my latest edit, and Tailscale Serve lets every agent I use reach one MCP server without exposing it to the internet. The tradeoffs are real: the MCP server has no auth, contexts don't help ranking, and keyword scores can be confidently wrong. Each of those has a simple workaround once you know about it.

If you keep your notes in markdown, try `qmd query` on your own vault this week. Start with the CLI, and add the MCP server once you want other agents to search it too.

And if you want agents to read your published writing as easily as your private notes, check out [How to Make Your Site LLM-Friendly](/posts/how-to-make-your-site-llm-friendly).
