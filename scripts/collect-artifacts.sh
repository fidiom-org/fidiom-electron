#!/usr/bin/env bash
#
# Collects submission artifacts for the QVAC hackathon:
#   - hardware.txt : machine / hardware proof (CPU, RAM, GPU, disk, OS)
#   - env.txt      : toolchain versions + git commit (reproducibility)
#   - run-<ts>.log : full stdout/stderr of an app run (model load, inference,
#                    tool calls, RAG retrieval — driven by the console.log lines
#                    in src/main/*)
#
# Usage:
#   bash scripts/collect-artifacts.sh          # capture hardware + env, then run `yarn dev` and log it
#   bash scripts/collect-artifacts.sh --info   # capture hardware + env only (no app run)
#
# Stop the app run with Ctrl-C; the log is flushed on exit.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/artifacts"
TS="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT"

OS="$(uname -s)"

echo "==> Collecting hardware info → artifacts/hardware.txt"
{
  echo "# Hardware proof — generated $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "uname: $(uname -a)"
  echo
  if [ "$OS" = "Darwin" ]; then
    echo "## CPU";    sysctl -n machdep.cpu.brand_string 2>/dev/null
    echo "cores: $(sysctl -n hw.ncpu 2>/dev/null)"
    echo "## Memory"; echo "$(( $(sysctl -n hw.memsize 2>/dev/null) / 1024 / 1024 )) MB"
    echo "## Model";  sysctl -n hw.model 2>/dev/null
    echo "## GPU / Chip"
    system_profiler SPHardwareDataType SPDisplaysDataType 2>/dev/null \
      | grep -Ei "chip|model name|memory|cores|chipset|vendor|vram|metal" | sed 's/^ *//'
  elif [ "$OS" = "Linux" ]; then
    echo "## CPU";    grep -m1 "model name" /proc/cpuinfo 2>/dev/null | cut -d: -f2- | sed 's/^ *//'
    echo "cores: $(nproc 2>/dev/null)"
    echo "## Memory"; grep MemTotal /proc/meminfo 2>/dev/null
    echo "## GPU";    (lspci 2>/dev/null | grep -Ei "vga|3d|display") || echo "lspci unavailable"
    command -v nvidia-smi >/dev/null 2>&1 && nvidia-smi 2>/dev/null | head -15
  else
    echo "Unsupported OS for auto hardware capture: $OS — fill in manually."
  fi
  echo
  echo "## Disk"
  df -h "$ROOT" 2>/dev/null
} > "$OUT/hardware.txt"

echo "==> Collecting toolchain / reproducibility info → artifacts/env.txt"
{
  echo "# Environment — generated $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "node:      $(node -v 2>/dev/null)"
  echo "yarn:      $(yarn -v 2>/dev/null)"
  echo "electron:  $(node -e "process.stdout.write(require('$ROOT/package.json').devDependencies.electron || require('$ROOT/package.json').dependencies.electron || 'n/a')" 2>/dev/null)"
  echo "@qvac/sdk: $(node -e "process.stdout.write(require('$ROOT/node_modules/@qvac/sdk/package.json').version)" 2>/dev/null || echo 'not installed')"
  echo "git commit: $(git -C "$ROOT" rev-parse HEAD 2>/dev/null)"
  echo "git branch: $(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null)"
  echo "git status:"; git -C "$ROOT" status --short 2>/dev/null
} > "$OUT/env.txt"

echo "    hardware.txt and env.txt written."

if [ "${1:-}" = "--info" ]; then
  echo "==> --info given; skipping app run."
  exit 0
fi

LOG="$OUT/run-$TS.log"
echo "==> Running 'yarn dev' — output tee'd to artifacts/run-$TS.log"
echo "    Use the app (unlock, send a chat message, scan a receipt), then Ctrl-C to stop."
echo "----------------------------------------------------------------------"

# Line-buffered tee so logs are flushed live; timestamps prepended per line.
( cd "$ROOT" && yarn dev 2>&1 ) | while IFS= read -r line; do
  printf '%s %s\n' "$(date -u +%H:%M:%S)" "$line"
done | tee "$LOG"

echo "----------------------------------------------------------------------"
echo "==> Saved run log → $LOG"
echo "==> Artifacts in $OUT:"
ls -la "$OUT"
