#!/bin/bash
set -e
curl -fsSL https://bun.sh/install | bash

export BUN_INSTALL=$HOME/.bun
export PATH=$BUN_INSTALL/bin:$PATH

bun --version
bun install
prisma migrate dev
echo "bun --bun run astro build"
echo "build astro with bun please 🙏"
bun --bun run astro build
