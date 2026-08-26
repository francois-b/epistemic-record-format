#!/usr/bin/env bash
# fetch.sh <slug> <url> [ext]
# Retrieves a raw file to corpus/raw/<slug>.<ext>, prints its sha256 and the
# retrieval date. The raw file is immutable once written (ERF-2): the script
# refuses to overwrite one.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
slug="$1"; url="$2"; ext="${3:-html}"
out="$ROOT/corpus/raw/$slug.$ext"
if [ -e "$out" ]; then
  echo "REFUSED (raw files are immutable, ERF-2): $out already exists" >&2
  exit 3
fi
curl -sS -L --max-time 60 \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" \
  -o "$out" "$url"
digest=$(shasum -a 256 "$out" | awk '{print $1}')
echo "slug=$slug"
echo "path=raw/$slug.$ext"
echo "url=$url"
echo "digest=sha256:$digest"
echo "timestamp=$(date -u +%Y-%m-%d)"
echo "bytes=$(wc -c < "$out")"
