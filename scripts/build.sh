#!/bin/bash
set -e
curl -fsSL https://bun.sh/install | bash
export PATH="/opt/buildhome/.bun/bin:$PATH"
ls /opt/buildhome/.bun/bin
bun --version
bun install
bunx prisma migrate dev
bun --bun run build
