#!/bin/sh
# run-trial.sh -- the whole trial end to end. Writes out/ and prints verdicts.
set -e
cd "$(dirname "$0")"
rm -rf out
mkdir -p out

echo "=== 1. the schema builds on its own (no application functions) ==="
sqlite3 out/schema-only.db < schema.sql
sqlite3 out/schema-only.db \
  "SELECT (SELECT count(*) FROM sqlite_master WHERE type='table')  || ' tables, '
       || (SELECT count(*) FROM sqlite_master WHERE type='trigger')|| ' triggers, '
       || (SELECT count(*) FROM sqlite_master WHERE type='view')   || ' views, '
       || (SELECT count(*) FROM sqlite_master WHERE type='index'
            AND name NOT LIKE 'sqlite_%')                          || ' indexes';"

for c in canonical authored hostile; do
  case $c in
    canonical) DIR=tests/corpus-canonical/relational-trial;  ID=relational-trial;;
    authored)  DIR=tests/corpus-authored/relational-trial;   ID=relational-trial;;
    hostile)   DIR=tests/corpus-hostile/relational-hostile;  ID=relational-hostile;;
  esac
  echo
  echo "=== 2.$c  load -> dump -> diff  ($DIR) ==="
  python3 erf_load.py --db "out/$c.db" --deployment "$c" "$DIR" | tee "out/$c-load.txt"
  python3 erf_dump.py --db "out/$c.db" --deployment "$c" --out "out/$c-regen" >/dev/null
  diff -ru -x captures "$DIR" "out/$c-regen/$ID" > "out/$c.diff" || true
  echo "  byte diff: $(wc -l < "out/$c.diff" | tr -d ' ') lines, in out/$c.diff"
  python3 erf_roundtrip.py "$DIR" 2>/dev/null \
    | grep -E '^  (E[123]|LOSS) |^tally:|^LOSS DETAIL|^    ' \
    | sed 's/^/  /' | tee "out/$c-roundtrip.txt"
done

echo
echo "=== 3. constraint probes: what the schema enforces ==="
python3 tests/constraint_probes.py | tee out/constraint-probes.txt | tail -8

echo
echo "=== 3b. negative cases: where a violation is caught, and by what ==="
python3 tests/negative_cases.py | tee out/negative-cases.txt | tail -2

echo
echo "=== 4. validator views: what the format says MUST be computed ==="
sqlite3 out/canonical.db < validator-report.sql > out/validator-report.txt
echo "  written to out/validator-report.txt"
sqlite3 out/canonical.db "SELECT claim_id || ' -> ' || disposition FROM v_claim_disposition ORDER BY disposition;"

# checkpoint the WAL so every out/*.db is a single self-contained file
for db in out/*.db out/negative/*.db; do
  [ -f "$db" ] && sqlite3 "$db" "PRAGMA wal_checkpoint(TRUNCATE);" >/dev/null 2>&1
done
rm -f out/*.db-wal out/*.db-shm out/negative/*.db-wal out/negative/*.db-shm

echo
echo "done. See round-trip-report.md for the reading."
