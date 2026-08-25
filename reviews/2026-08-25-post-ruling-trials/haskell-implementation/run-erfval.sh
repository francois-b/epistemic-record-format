#!/usr/bin/env bash
# Compiles on first run (~1 min), then runs from the cached binary.
set -euo pipefail
cd "$(dirname "$0")"
exec stack script --compile --resolver lts-22.43 \
  --package yaml --package aeson --package text --package bytestring \
  --package containers --package unordered-containers --package vector \
  --package scientific --package directory --package filepath --package time \
  --package unicode-transforms \
  -- erfval.hs "$@"
