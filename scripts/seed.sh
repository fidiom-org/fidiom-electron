#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export ELECTRON_RUN_AS_NODE=1
exec ./node_modules/.bin/electron ./node_modules/tsx/dist/cli.mjs scripts/db-seed.ts "$@"
