#!/usr/bin/env bash
# Run every corpus in tests/ against the built validator and check the verdict.
# Usage: tests/run.sh    (from the crate root, after `cargo build --release`)
set -u
BIN=./target/release/erfval
HERE="$(cd "$(dirname "$0")" && pwd)"
fail=0

echo "== conforming =="
"$BIN" --quiet "$HERE/conforming" > /dev/null
if [ $? -eq 0 ]; then echo "  ok   conforms, exit 0"; else
  echo "  FAIL the conforming corpus does not conform"; "$BIN" --quiet "$HERE/conforming" | grep '^VIOLATION'; fail=1; fi

echo "== flags (must conform, must carry flags) =="
out=$("$BIN" --quiet "$HERE/flags"); code=$?
n=$(echo "$out" | grep -c '^FLAG')
if [ $code -eq 0 ] && [ "$n" -gt 10 ]; then echo "  ok   conforms with $n flags"; else
  echo "  FAIL exit=$code flags=$n"; echo "$out" | grep '^VIOLATION'; fail=1; fi

echo "== violations (each must name its requirement) =="
for d in "$HERE"/violations/*/; do
  n=$(basename "$d"); exp=$(cat "$d/EXPECT")
  out=$("$BIN" --quiet "$d" 2>&1); code=$?
  got=$(echo "$out" | grep '^VIOLATION' | awk '{print $2}' | sort -u | tr '\n' ' ')
  if [ $code -ne 1 ]; then printf "  FAIL %-38s no violation reported\n" "$n"; fail=1
  elif echo " $got " | grep -q " $exp "; then printf "  ok   %-38s %s\n" "$n" "$exp"
  else printf "  FAIL %-38s expected %s, got %s\n" "$n" "$exp" "$got"; fail=1; fi
done

echo "== fabrication (each attack, expected verdict in its limitations) =="
out=$("$BIN" --quiet "$HERE/fabrication" 2>&1)
for a in "$HERE"/fabrication/atoms/*.md; do
  slug=$(basename "$a" .md)
  want=$(grep -o 'EXPECT \(PASS\|FAIL\)' "$a" | head -1 | awk '{print $2}')
  if echo "$out" | grep -q "ERF-52 .*atoms/$slug.md"; then got=FAIL; else got=PASS; fi
  if [ "$want" = "$got" ]; then printf "  ok   %-34s %s\n" "$slug" "$got"
  else printf "  FAIL %-34s wanted %s, got %s\n" "$slug" "$want" "$got"; fail=1; fi
done

echo "== deployment-wide (two corpora on one command line) =="
out=$("$BIN" --quiet "$HERE/conforming" "$HERE/flags" 2>&1)
if echo "$out" | grep -q '^PARTIAL'; then
  echo "  FAIL ERF-36/38 still reported as partial with two corpora"; fail=1
else echo "  ok   no PARTIAL when the deployment is complete"; fi

echo
if [ $fail -eq 0 ]; then echo "ALL PASS"; else echo "FAILURES"; fi
exit $fail
