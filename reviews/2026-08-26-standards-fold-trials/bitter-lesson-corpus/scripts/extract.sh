#!/usr/bin/env bash
# extract.sh <slug> [ext]
# ERF-70 extraction step: raw file -> CommonMark, by a named deterministic tool.
#   html -> "pandoc 3.8.3 -f html -t plain --wrap=none"
#   pdf  -> "pdftotext 25.12.0 (poppler) -enc UTF-8"
# Plain text is valid CommonMark (ERF-67), so pdftotext's output needs no
# second converter; what it needs is reflowing, which is the normalization
# step (ERF-70) and belongs to bl-normalize.py --reflow.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
slug="$1"; ext="${2:-html}"
mkdir -p "$ROOT/work/extracted"
in="$ROOT/corpus/raw/$slug.$ext"
out="$ROOT/work/extracted/$slug.md"
case "$ext" in
  pdf) pdftotext -enc UTF-8 "$in" "$out" ;;
  html|htm) pandoc -f html -t plain --wrap=none "$in" -o "$out" ;;
  *) echo "no extractor registered for .$ext" >&2; exit 2 ;;
esac
echo "work/extracted/$slug.md  ($(wc -l < "$out") lines)"
