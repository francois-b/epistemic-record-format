#!/usr/bin/env bash
# Runs erfval over every generated corpus and checks the expectation encoded in
# the directory name.
#
#   conforming/       must exit 0 and report zero violations
#   nonconforming/*   must exit 1 and the requirement id in the directory name
#                     must appear among the VIOLATION lines
#   flagging/*        must exit 0 and report at least one FLAG
cd "$(dirname "$0")/.." || exit 2
V=./run-erfval.sh
pass=0; fail=0

check() {  # $1 dir  $2 expect(conform|violate|flag)  $3 req-or-empty
  out=$("$V" "$1" 2>&1); rc=$?
  case "$2" in
    conform) [ "$rc" = 0 ] && ok=1 || ok=0 ;;
    violate)
      if [ "$rc" = 1 ] && echo "$out" | grep -q "^VIOLATION  \[$3"; then ok=1; else ok=0; fi ;;
    flag)
      if [ "$rc" = 0 ] && echo "$out" | grep -q "^FLAG"; then ok=1; else ok=0; fi ;;
  esac
  if [ "$ok" = 1 ]; then
    pass=$((pass+1)); printf 'ok    %s\n' "$1"
  else
    fail=$((fail+1)); printf 'FAIL  %s   (exit %s, wanted %s %s)\n' "$1" "$rc" "$2" "$3"
    echo "$out" | grep -E '^(VIOLATION|FLAG)' | sed 's/^/          /' | head -8
  fi
}

check tests/conforming conform
for d in tests/nonconforming/*/; do
  req=$(basename "$d" | sed -E 's/^nc-(ERF-[0-9]+)-.*/\1/')
  check "${d%/}" violate "$req"
done
for d in tests/flagging/*/; do
  check "${d%/}" flag
done

echo
echo "passed $pass, failed $fail"
[ "$fail" = 0 ]
