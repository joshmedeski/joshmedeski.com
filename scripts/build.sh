#!/bin/bash
set -e
curl -fsSL https://bun.sh/install | bash

export BUN_INSTALL=$HOME/.bun
export PATH=$BUN_INSTALL/bin:$PATH

bun --version
bun install
prisma migrate dev
cat /opt/build/repo/node_modules/load-yaml-file/index.js
cat /opt/build/repo/node_modules/load-yaml-file/package.json
bun --bun run astro build
