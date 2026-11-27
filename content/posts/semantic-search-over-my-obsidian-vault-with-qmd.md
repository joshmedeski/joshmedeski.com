---
title: Semantic Search Over My Obsidian Vault with qmd
description: How I index 4,700 Obsidian notes on a Mac mini with qmd, keep the index fresh with launchd, and serve it as an MCP server my agents reach over Tailscale.
pubDate: 2026-12-01T12:00:00.000Z
heroImage: ../attachments/posts/semantic-search-over-my-obsidian-vault-with-qmd/semantic-search-over-my-obsidian-vault-with-qmd.jpeg
areas:
  - obsidian
  - ai
---

I ask my agents about my own notes all the time. What did I decide about that plugin? Where did I write down that launchd gotcha? The answer is almost always somewhere in my Obsidian vault, but it rarely uses the words I search with.

Grep can't help with that. When my words don't match the note's words, a keyword search comes back empty, and an empty result looks exactly like "there's no note about this."

So I gave my agents real semantic search over the whole vault with [qmd](https://github.com/tobi/qmd). It runs on a Mac mini that stays on: one index of about 4,700 notes, a reindex every 15 minutes, and an MCP server the rest of my agents reach over Tailscale. Everything stays on that Mac. No note leaves it to get embedded.

<!-- TODO: Screenshot of an agent answering a vault question, showing the qmd `query` and `get` tool calls. -->

## What qmd is

qmd is a small search engine for markdown, written by Tobi Lütke. You point it at a folder and it builds a local index.

`qmd search` is keyword search. I use it when I know a title or a phrase. `qmd query` is the one I use when I don't know the words. qmd also ships an MCP server, which is how my agents reach the index.

## Install it

qmd is installed via npm:

```sh
npm install -g @tobilu/qmd
```

## Point it at the vault

I have one collection, `second-brain`, for the whole vault on the Mac mini:

```sh
qmd collection add ~/path/to/vault --name second-brain
qmd embed
qmd status
```

In `~/.config/qmd/index.yml` I only index markdown:

```yaml
pattern: "**/*.md"
```

My `ignore` list excludes a couple of private folders. `ignore` keeps a file out of the index and also blocks `qmd get` from returning it, so an agent can't pull those notes through search at all. If you have notes you never want an agent to see, put them in `ignore` before you build the index.

<!-- TODO: Optional personal detail. Why you fence some folders off, in general terms only. -->

## Contexts

I label each top-level folder, under `context:` in `~/.config/qmd/index.yml`, so agents know what kind of note a result is.

```yaml
context:
  "/Days": "Daily notes and journaling, named YYYY-MM-DD.md."
  "/Goals": "Measurable personal objectives with timelines."
  "/Events": "Dated meetings, appointments, trips, shows, and other events."
  "/Projects": "Project notes organized by commitment status."
  "/Projects/Active": "Projects currently committed to and actively being worked on."
  "/Projects/Waiting For": "Delegated or dependent projects waiting on others or external input."
  "/Projects/Someday Maybe": "Potential future projects not currently committed to."
  "/Areas": "Ongoing life domains and responsibilities."
  "/Resources": "Reference materials, tools, templates, and skills."
  "/Relationships": "People and organization profiles."
  "/Inbox": "Unsorted captures awaiting processing."
  "/Archives": "Completed projects and historical documents."
  "/Assets": "Supporting files and plain-text source material."
  "/Brain": "Persistent personal knowledge and synthesized notes."
```

Nested folders such as `/Projects/Active` get their own label on top of the parent's.

## Keep the index fresh with launchd

I never run `qmd update` or `qmd embed` by hand. A launchd agent on the Mac mini runs this every 15 minutes. Save it as `~/bin/reindex-qmd.sh` and make it executable:

```sh
#!/bin/sh
log="$HOME/.cache/qmd/vault-reindex.log"
mkdir -p "$(dirname "$log")"
{
  echo "----- $(date)"
  qmd update
  qmd embed
} >> "$log" 2>&1
```

launchd doesn't expand `~` or `$HOME`, so the plist uses the absolute path. It also puts `/usr/local/bin` on `PATH`, which is where the global npm install puts `qmd`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.yourname.qmd-watch</string>
  <key>ProgramArguments</key>
  <array>
    <string>/Users/you/bin/reindex-qmd.sh</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin</string>
  </dict>
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

Saving a note doesn't refresh the index on its own. The job does that about 15 minutes later, and writes the result to `~/.cache/qmd/vault-reindex.log`.

## Serve it as an MCP server

My agents don't have a shell on the Mac mini, so they can't run `qmd query` themselves. qmd can serve HTTP, and one long-running process keeps the models loaded:

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
    <string>/usr/local/bin/qmd</string>
    <string>mcp</string>
    <string>--http</string>
    <string>--port</string>
    <string>8181</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin</string>
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

`RunAtLoad` starts it at login, and `KeepAlive` restarts it if it dies. That `qmd` path is the npm global bin from `which qmd`, and `PATH` includes the same directory.

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

Set `QMD_ALLOWED_HOSTS` in the plist to your tailnet hostname, or requests through Tailscale come back as a 403.

Then check it from another device on your tailnet:

```sh
curl https://your-mac.your-tailnet.ts.net/health
```

## Connect your agents

Any MCP client that supports HTTP can use the `/mcp` endpoint. My laptop, Grok Bot, and Claude Code all point at that URL, so they search the Mac mini as long as it's awake.

<!-- TODO: Screenshot of the qmd custom connector in Grok Bot's settings. -->

A client that reads a JSON config, such as Claude Code's `.mcp.json`, looks like this:

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

I tell my agents to search with `query` before creating a new note, and to read the full note with `get` before answering from a result.

## A few things I learned

- Stick to markdown. Other file types bloat the index, so I convert a PDF to markdown before I index it.
- Add a short context label to each folder so agents can tell what a result is.
- Set `QMD_ALLOWED_HOSTS` to your tailnet hostname, or Tailscale requests come back as a 403.
- Don't expose the MCP server to the public internet. It has no login.

## Wrapping up

qmd gave my agents a way to find ideas in my vault, not only files. It runs on the Mac mini, a launchd job keeps the index within about 15 minutes of my latest edit, and Tailscale Serve lets every agent I use reach that one server.

If you keep your notes in markdown, try `qmd query` on your own vault this week. Start with the CLI, and add the MCP server once you want other agents to search it too.

And if you want agents to read your published writing as easily as your private notes, check out [How to Make Your Site LLM-Friendly](/posts/how-to-make-your-site-llm-friendly).
