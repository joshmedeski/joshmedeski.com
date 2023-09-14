#!/bin/bash
set -e
curl -fsSL https://bun.sh/install | bash

export BUN_INSTALL=$HOME/.bun
export PATH=$BUN_INSTALL/bin:$PATH

bun --version
bun install --frozen-lockfile
prisma migrate dev
ls /opt/build/repo/node_modules/load-yaml-file
bun --bun run astro build
