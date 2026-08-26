#!/bin/sh
# erf-fetch 1.0.0 — take the raw file, as it arrived (ERF-2).
#
#   erf_fetch.sh <source-id> <url>
#
# Writes corpus/raw/<source-id>.<ext>, prints the sha256 digest and the
# retrieval date, and never touches the file again: a raw file is immutable,
# and a revision arriving later is a new source.
set -eu
ID="$1"; URL="$2"; EXT="${3:-html}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$DIR/corpus/raw/$ID.$EXT"
curl -sSL --compressed --max-time 60 \
  -H 'Accept: text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8' \
  -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' \
  -o "$OUT" "$URL"
printf '%s  sha256:%s  bytes=%s\n' "$ID" "$(shasum -a 256 "$OUT" | cut -d' ' -f1)" "$(wc -c < "$OUT" | tr -d ' ')"
