#!/bin/sh
# Run the validator over every test corpus.  Each corpus is a hand-authored
# case set; tests/README.md says which requirement each exercises and what the
# expected outcome is.  This script does not assert -- read the output against
# tests/README.md.
cd "$(dirname "$0")/.."
for d in tests/*/; do
    [ -f "$d/corpus.yaml" ] || continue
    echo "==================================================================="
    echo "== $d"
    echo "==================================================================="
    python3 erf_validate.py "$d" --dispositions
    echo
done
