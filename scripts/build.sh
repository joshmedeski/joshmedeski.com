#!/bin/bash
set -e
curl -fsSL https://bun.sh/install | bash

export PATH="/opt/buildhome/.bun/bin:$PATH"
bun --version
bun install
bun x prisma migrate dev
bun --bun run build
