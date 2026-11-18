---
title: One Command Saved Me 2.8M Claude Code Tokens
description: RTK quietly filters command output before Claude Code reads it. More room before I hit my rate limits, and I haven't changed a thing about how I work.
pubDate: 2026-11-18T12:00:00.000Z
heroImage: ../attachments/posts/one-command-saved-me-2-8m-claude-code-tokens/one-command-saved-me-2-8m-claude-code-tokens.jpeg
areas:
  - claude-code
---

Every command Claude Code runs dumps its output into the context window. A passing test suite, a lint run, an `ls` of an assets folder. Most of that output is noise, but Claude reads all of it. I'm on a Claude plan, so that noise eats into my rate limits. Worse, it fills up the conversation and pushes it toward compaction sooner.

[RTK](https://github.com/rtk-ai/rtk) (Rust Token Killer) fixes this. It's a CLI proxy that sits between Claude and your shell and filters command output down to what the agent actually needs.

## Setup

I installed it with Homebrew seven months ago. Since then, all I've done is keep it up to date along with the rest of my system dependencies.

```sh
brew install rtk
rtk init -g
```

`rtk init -g` handles the setup for you, so there's nothing to paste. For reference, this is the `PreToolUse` hook it adds to your global Claude Code settings:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "rtk hook claude" }]
      }
    ]
  }
}
```

That's it.

## It just works

This is the part I like most. I don't think about RTK and neither does Claude. When Claude runs `git status`, the hook rewrites it to `rtk git status` before it executes. Same for `grep`, `ls`, `go test`, `eslint`, `gh`, and a long list of other commands. Claude gets the compact output, and nobody had to change their habits.

Here's `git status` in this blog's repo while I was writing this post. Without RTK, Claude reads all of this:

```
On branch main
Your branch is up to date with 'origin/main'.

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	content/attachments/posts/one-command-saved-me-2-8m-claude-code-tokens/
	content/posts/one-command-saved-me-2-8m-claude-code-tokens.md

nothing added to commit but untracked files present (use "git add" to track)
```

With RTK, it reads this:

```
* main...origin/main
?? content/attachments/posts/one-command-saved-me-2-8m-claude-code-tokens/
?? content/posts/one-command-saved-me-2-8m-claude-code-tokens.md
```

Same information, without the hints written for humans. Claude already knows how to `git add` a file.

What if RTK cuts something Claude actually needs? When it truncates output, it saves the full version to a log file and leaves a note telling Claude where to find it:

```
[see remaining: tail -n +1 "~/Library/Application Support/rtk/tee/1795025400_ls-hidden.log"]
```

Claude can read the rest whenever it needs to, and `rtk bypass <cmd>` runs any command with no filtering at all.

I stopped babysitting terminal output. The cost is about 321ms per command on average, which I've never noticed.

## The numbers

RTK tracks everything it filters. Run `rtk gain` to see your savings:

```
RTK Token Savings (Global Scope)
════════════════════════════════════════════════════════════

Total commands:    33747
Input tokens:      10.8M
Output tokens:     8.1M
Tokens saved:      2.8M (25.5%)
Total exec time:   155m21s (avg 321ms)
Efficiency meter: ██████░░░░░░░░░░░░░░░░░░ 25.5%
Excluded:          300 oversized outputs (input past the ~30k-char agent cap)

By Command
────────────────────────────────────────────────────────────────────────
  #  Command                   Count   Saved  Total%    Time  Impact
────────────────────────────────────────────────────────────────────────
 1.  rtk read                   6272    2.2M   29.0%     0ms  ██████████
 2.  rtk grep                  11184    1.7M    6.9%   408ms  ████████░░
 3.  rtk go test ./...            29    1.5M  100.0%    1.7s  ███████░░░
 4.  rtk lint eslint               4    1.0M   99.9%    8.1s  █████░░░░░
 5.  rtk ls Assets                14  308.7K   98.7%    27ms  █░░░░░░░░░
────────────────────────────────────────────────────────────────────────
```

That's 2.8M tokens saved across almost 34,000 commands, and it's only the last 90 days, since RTK keeps 90 days of history by default. I've been running it since April 2026, so the real number is higher.

2.8M is also the conservative number. Claude Code cuts off any command output past about 30,000 characters, so RTK leaves those 300 oversized outputs out of the total. It only takes credit for tokens Claude would actually have read. The per-command rows still include those big outputs, so don't add them up. The total at the top is the real number.

Some commands get trimmed, and some get almost erased:

- **Trimmed.** `read` and `grep` cut 7–29% per call, but Claude runs them constantly. That's over 17,000 calls between them.
- **Erased.** `go test` and `eslint` output shrinks by more than 99%. A passing test suite doesn't need hundreds of lines of `ok` output, so RTK collapses it to a summary. Claude gets the part that matters.

Those savings also compound. Command output stays in the context for the rest of the session, so it's sent again with every turn after it. Trimming it once keeps the whole conversation lighter, which on my plan means more room before I hit my rate limits.

## Finding what it missed

RTK doesn't support every command. When it sees one it doesn't know, it passes the output through untouched, so nothing breaks. You just don't get the savings. `rtk discover` scans your Claude Code history and shows you both the commands RTK doesn't handle yet and the ones that slipped past it:

```
Scanned: 24 sessions (last 30 days), 2304 Bash commands
Already using RTK: 856 commands (37.2%)

MISSED SAVINGS -- Commands RTK already handles
Command                  Count    RTK Equivalent     Est. Savings
grep -n                     46    rtk grep           ~11.2K tokens
cat                         20    rtk read           ~8.1K tokens
curl -s                     20    rtk curl           ~3.3K tokens
git add                     17    rtk git            ~3.0K tokens
ls -la                      16    rtk ls             ~2.8K tokens
Total: 176 commands -> ~33.1K tokens saveable
```

In my last 30 days, 37% of my Bash commands went through RTK. Most of the rest were commands RTK doesn't support yet, like Python heredocs, `pnpm build`, and `sips`, and those passed through as normal. The commands it could have filtered but missed only add up to about 33K tokens. `discover` lists the unsupported ones too and points you to the [issue tracker](https://github.com/rtk-ai/rtk/issues) if you want to request support.

## A few more commands

- `rtk gain --history` shows recent commands and how much each one saved.
- `rtk bypass <cmd>` runs a command without filtering, which helps when you need to see the raw output.
- If `rtk gain` fails, check `which rtk`. There's an unrelated Rust Type Kit that also installs as `rtk`.

## Wrapping up

Most tools that save tokens ask you to change how you work. RTK doesn't. I installed it, ran one command, and seven months later it's still saving me tokens on every session. If you use Claude Code, it's an easy win.

Check out [RTK on GitHub](https://github.com/rtk-ai/rtk), install it, and start saving tokens for yourself. And while you're there, give the project a star.

If you want more ways to tune Claude Code, check out [Tuning Your Claude Code Settings](/posts/tuning-your-claude-code-settings).
