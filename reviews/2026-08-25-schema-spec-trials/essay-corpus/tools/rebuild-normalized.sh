#!/bin/sh
# rebuild-normalized 1.0.0 — regenerate every normalized text from the raw
# files the corpus holds, using the tools each source names (ERF-70).
#
# The extraction's own output is not retained (ERF-70), so this script
# recreates it in work/ and the excerpt ranges in tools/excerpts.tsv are
# applied against it. Deterministic: the same raw bytes and the same tool
# versions give the same normalized texts and therefore the same digests.
set -eu
cd "$(dirname "$0")/.."
mkdir -p work/extracted
for f in corpus/raw/*.html; do
  b=$(basename "$f" .html)
  pandoc --from=html --to=gfm-raw_html --wrap=none "$f" -o "work/extracted/$b.md"
done
for f in corpus/raw/*.pdf; do
  [ -e "$f" ] || continue
  b=$(basename "$f" .pdf)
  pdftotext -layout -enc UTF-8 "$f" "work/extracted/$b.md"
done
while IFS="$(printf '\t')" read -r id rng; do
  [ -n "$id" ] || continue
  python3 tools/erf_excerpt.py "work/extracted/$id.md" "work/excerpt-$id.md" "$rng"
  python3 tools/erf_normalize.py "work/excerpt-$id.md" "corpus/normalized/$id.md"
done < tools/excerpts.tsv
# the essay arrived as markdown: no extraction, normalization only
python3 tools/erf_normalize.py \
  corpus/raw/epistemology-for-knowledge-work-in-the-llm-era-6ed2f-source.md \
  corpus/normalized/essay-2026-08-19.md
python3 tools/build_sources.py
echo "normalized texts rebuilt from the raw files"
