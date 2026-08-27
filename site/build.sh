#!/usr/bin/env bash
#
# Build the published site into site/build/.
#
#   site/build.sh [--corpus <dir>] [--out <dir>]
#
# Everything under the output directory is generated. Nothing there is ever
# hand-edited: the landing page's source is site/landing.html and the corpus
# pages come from the reference viewer, so the site can be thrown away and
# rebuilt from the repository at any time.
#
# The repository's own URL is a build input rather than a constant, because
# the landing page links back into the source and a fork's links should
# point at the fork. GitHub Actions passes the real one; locally it falls
# back to a placeholder that says plainly it is one.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CORPUS="$REPO_ROOT/examples/corpora/ai-capex"
OUT="$REPO_ROOT/site/build"

while [ $# -gt 0 ]; do
  case "$1" in
    --corpus) CORPUS="$2"; shift 2 ;;
    --out)    OUT="$2";    shift 2 ;;
    -h|--help) sed -n '2,12p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

REPO_URL="${ERF_REPO_URL:-https://github.com/francois-b/epistemic-record-format}"

echo "==> repository url: $REPO_URL"
echo "==> corpus:         $CORPUS"
echo "==> output:         $OUT"

# The site never publishes a corpus that does not conform. erf-check exits
# non-zero on any violation, and `set -e` stops the build here if it does.
cd "$REPO_ROOT/implementations/yaml-markdown/typescript"
[ -d node_modules ] || npm install --no-audit --no-fund
echo "==> checking the corpus"
npx tsx erf-check.ts "$CORPUS" | tail -n 2

rm -rf "$OUT"
mkdir -p "$OUT/assets"

cd "$REPO_ROOT/tools/viewer"
[ -d node_modules ] || npm install --no-audit --no-fund
echo "==> rendering the corpus"
npx tsx erf-view.ts "$CORPUS" -o "$OUT/corpus" \
  --link "the format=../index.html" \
  --link "spec=$REPO_URL/blob/main/SPEC.md"

# One stylesheet, written once by the viewer with its font faces inside it.
# The landing page reads the same one, so the two halves of the site cannot
# drift apart visually.
cp "$OUT/corpus/assets/erf.css" "$OUT/assets/erf.css"

# The schema at the URL its $id declares, version-scoped, so $ref and tooling resolve it.
mkdir -p "$OUT/schema/0.9.0"
cp "$REPO_ROOT/schema/erf.schema.json" "$OUT/schema/0.9.0/erf.schema.json"

echo "==> writing the landing page"
sed "s#{{REPO}}#${REPO_URL}#g" "$REPO_ROOT/site/landing.html" > "$OUT/index.html"

# GitHub Pages runs Jekyll unless told not to, which would reprocess the
# generated HTML and drop any path beginning with an underscore.
touch "$OUT/.nojekyll"

# A rendered corpus is almost entirely cross-references, so one renamed page
# breaks hundreds of links and nothing else in the build would notice.
echo "==> checking links"
LINKLOG="$(mktemp)"
trap 'rm -f "$LINKLOG"' EXIT
if ! python3 "$REPO_ROOT/site/check-links.py" "$OUT" > "$LINKLOG"; then
  cat "$LINKLOG" >&2
  exit 1
fi
# The external list is long and is not a finding; the verdict lines are.
grep -v '^  external ' "$LINKLOG"

echo "==> done: $(find "$OUT" -name '*.html' | wc -l | tr -d ' ') pages, $(du -sh "$OUT" | cut -f1) total"
