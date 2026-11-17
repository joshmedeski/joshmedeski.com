---
title: Understanding Temporary Files on macOS
description: I've used /tmp for years and my AI agents use it even more. I finally looked into how it actually works on modern macOS.
pubDate: 2026-11-17T12:00:00.000Z
heroImage: ../attachments/posts/understanding-temporary-files-on-macos/understanding-temporary-files-on-macos.jpeg
draft: true
areas:
  - macos
  - terminal
---

I've been putting files in `/tmp` for as long as I've used a terminal. Debug logs, quick experiments, output I only need for the next five minutes. Lately my AI agents use it even more than I do. But if you'd asked me how `/tmp` actually works on macOS (when things get deleted, who else can see them) I couldn't have told you. So I finally looked.

## TL;DR

- **Rebooting doesn't clear `/tmp`.** A cleaner runs every night at midnight and deletes files nobody has opened in about three days.
- **`/tmp` is shared.** Every user and process on your Mac can read what's in it.
- **`$TMPDIR` is your private temp folder.** Use it for anything even mildly sensitive.
- **Tell your agents where scratch work goes**, so you decide what gets kept.

## The assumptions I'd been running on

Before digging in, here's what I half-believed about `/tmp`:

1. **It clears when I reboot.**
2. **It's my space.**
3. **It's a trash can I never have to empty.**

Some of those are wrong. One is wrong in a way that matters.

## Why agents love it too

Watching AI agents work is what finally pushed me to look. Give one a task and it'll write a scratch script, dump command output to a log, or save a draft PR description, all in `/tmp`, without touching my project.

That makes sense. `/tmp` is always there and always writable, and agents tend to follow Linux habits, where `/tmp` is the default scratch spot. It keeps experiments out of the repo. It's the same reason I use it.

If you want to see what your agents have been up to, take a look.

List the newest files first:

```bash
ls -lt /private/tmp | head -20
```

Find the things you (or your agents) made today:

```bash
find /private/tmp -maxdepth 1 -user "$USER" -mtime -1
```

See how much is piled up:

```bash
du -sh /private/tmp
```

Notice I'm pointing at `/private/tmp`, not `/tmp`. Run these against `/tmp` and you'll get almost nothing back, because `/tmp` is just a symlink. More on that below.

Here's a trimmed look at mine from one afternoon:

```text
-rw-r--r--  hyperkeys.log
-rw-r--r--  claude-tmux-rename.log
drwx------  claude-501/
-rw-r--r--  post.html
-rw-r--r--  methods.ts
-rw-r--r--  helpers.ts
-rw-r--r--  pr-11480-body.md
-rw-r--r--  settings.bak3
-rw-r--r--  settings.bak2
drwx------  sock-834948071/
```

Draft PR descriptions, copied source files, settings backups. Almost none of that was me. And that `claude-501/` folder? That's Claude Code itself, which keeps its per-session scratch files in `/private/tmp/claude-<your user ID>/`. Even the screenshots I paste into a session land there.

`du` told me I had **3.5 GB** in there.

## Assumption 1: it clears when I reboot

Nope. On modern macOS, rebooting doesn't empty `/tmp`.

Instead there's a launchd daemon called `com.apple.tmp_cleaner` that runs **every night at midnight** and deletes files that haven't been accessed in a while. You can read its config yourself:

```bash
plutil -p /System/Library/LaunchDaemons/com.apple.tmp_cleaner.plist
```

```sh title="/System/Library/LaunchDaemons/com.apple.tmp_cleaner.plist"
"Label" => "com.apple.tmp_cleaner"
"ProgramArguments" => [ "/usr/libexec/tmp_cleaner" ]
"StartCalendarInterval" => { "Hour" => 0 }
"LowPriorityIO" => true
"Nice" => 1
```

A few things worth knowing about it:

- **It's based on last access, not creation.** A log file you keep reading can stick around indefinitely. A script an agent wrote and forgot goes away.
- **"A while" is about three days.** That's the long-standing BSD convention, but Apple doesn't document the exact threshold for `tmp_cleaner`, so treat "a few days" as the guarantee.
- **It runs on a timer.** If your Mac is asleep at midnight, launchd runs it when the machine wakes up.
- **The old BSD setup is gone.** Other Unixes use `periodic` scripts (`/etc/periodic/daily/*clean-tmps`) for this. On current macOS, `/etc/periodic` doesn't exist. `tmp_cleaner` replaced it.

So the right mental model is: _files in `/tmp` disappear after a few days of being ignored, on a nightly timer._

That also explained my 3.5 GB. Almost all of it was two build folders from two days earlier. They just hadn't been ignored long enough yet. A few days of heavy agent work can pile up a lot before the cleaner catches up.

## Assumption 2: it's my space

This is the one that matters. `/tmp` isn't yours. It's shared by every user and process on the machine.

```bash
ls -ld /tmp /private/tmp
```

```sh
lrwxr-xr-x  root wheel  /tmp -> private/tmp
drwxrwxrwt  root wheel  /private/tmp
```

`/tmp` is a symlink to `/private/tmp`, and its permissions are `1777`: anyone can read and write. The `t` at the end is the **sticky bit**, which means anyone can create files there but only the owner can delete or rename them. That's what keeps a shared folder from being total chaos.

Look back at my listing, too. Every loose file is `-rw-r--r--`, which means any user on the machine can read it. Claude Code locks its own folder down to `drwx------`, but the files agents drop next to it aren't protected. On a single-user laptop this rarely bites, but it's a good reason to never let an agent write tokens, `.env` contents, or API responses with credentials into `/tmp`.

### The private temp folder I didn't know about

Here's the part that surprised me. macOS already gives every user a private temp directory, and it's sitting in an environment variable:

```bash
echo "$TMPDIR"
```

```text
/var/folders/6p/cfdfd7ln47vf6svfgr1fhgg40000gn/T/
```

It's mode `700`, so only you can see inside it. This is where macOS apps are supposed to put their temp files.

You can also ask the system for it directly, which gives you the same path:

```bash
getconf DARWIN_USER_TEMP_DIR
```

Most languages already use it by default. Python's `tempfile` respects `$TMPDIR`:

```python
import tempfile
tempfile.gettempdir()
```

So does Node, minus the trailing slash:

```javascript
import os from 'node:os'
os.tmpdir()
```

The OS manages it as part of your per-user "darwin user dir," so don't treat it as permanent either.

There's also `/var/tmp`, another shared, world-readable folder meant for temp files that should outlive `/tmp`. I rarely need it.

| Path       | Who can read it | Use it for                                   |
| ---------- | --------------- | -------------------------------------------- |
| `/tmp`     | Everyone        | Throwaway logs, well-known paths, sockets    |
| `/var/tmp` | Everyone        | Temp files that should last a bit longer     |
| `$TMPDIR`  | Just you        | The default for anything even mildly private |

## Assumption 3: it's a trash can I never have to empty

This one is mostly true, and it's why I keep using `/tmp` for debugging. A few patterns I lean on:

**Short-lived logs.** Tee output to a file and tail it from another pane. If I forget about it, the cleaner gets it in a few days.

```bash
some-command 2>&1 | tee /tmp/run.log
tail -f /tmp/run.log
```

**Scratch workspaces that clean themselves up.** `mktemp` creates a file or directory atomically with a random name, and a `trap` deletes it when the script exits, even on an error or Ctrl-C.

```bash
dir="$(mktemp -d "${TMPDIR}myapp.XXXXXX")"
trap 'rm -rf "$dir"' EXIT
```

This beats hand-rolling a path like `/tmp/mytool.log`, which is predictable (a collision or symlink-attack risk in a shared folder).

**Atomic writes.** Write to a temp file on the same filesystem as the target, then `mv` it into place so nothing ever reads a half-written file.

**Named pipes and sockets.** `mkfifo "$(mktemp -u)"` for quick IPC between two processes.

**Emptying it yourself.** If you don't want to wait for the nightly cleaner, you can clear out your own stale files. Preview what would go first:

```bash
find /private/tmp -maxdepth 1 -type f -user "$USER" -atime +3 -print
```

Then swap `-print` for `-delete` when you're happy with the list:

```bash
find /private/tmp -maxdepth 1 -type f -user "$USER" -atime +3 -delete
```

And a few caveats I ran into:

- **`$TMPDIR` has a trailing slash.** `"$TMPDIR/foo"` gives you `//foo`. Harmless, but `"${TMPDIR}foo"` is cleaner.
- **Unix sockets have a ~104 character path limit.** `$TMPDIR` paths are long, so a socket there can fail with a cryptic error. For sockets, the short `/tmp` path is the pragmatic choice.
- **If you want to keep it, move it.** Anything an agent made that turns out to be useful should go somewhere real, like your project or `~/Library/Application Support/<app>`.

## Telling my agents where to put things

Now that I understand it, I'd rather decide where my agents' scratch work goes than leave it to habit. There are two approaches, depending on what you want:

- **`mktemp -d` for scratch work.** Private, out of your repo, and macOS cleans it up for you.
- **A gitignored `.scratch/` folder in the project.** Everything stays next to the code so you can review what the agent tried. The cleaner never touches it, so you clear it out yourself when you're done.

I like being able to see an agent's experiments, so the project-local folder is growing on me. Here's what I drop into `CLAUDE.md` or `AGENTS.md`:

```md
- Put scratch files and experiments in `.scratch/` (gitignored), not `/tmp`.
- Never write secrets, tokens, or `.env` contents to `/tmp`.
```

## Wrapping up

`/tmp` is still where my throwaway logs go. The difference is I know the rules now: it's shared, it's cleaned nightly by last access, and rebooting has nothing to do with it. Private stuff goes in `$TMPDIR`, anything worth keeping gets moved out, and my agents get told where their scratch work belongs.

It's funny how long you can use something every day without knowing how it works. macOS is full of little corners like this, and digging into them is one of my favorite things to write about. If you want more, check out my other [macOS posts](/areas/macos) or sign up below to get the next one in your inbox.

## Further reading

- `man mktemp`: creating temp files and directories safely
- `man launchd.plist`: how `StartCalendarInterval` and the other keys in the cleaner's config work
- [`FileManager.temporaryDirectory`](https://developer.apple.com/documentation/foundation/filemanager/temporarydirectory): Apple's docs on the per-user temp directory
