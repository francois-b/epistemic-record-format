#!/usr/bin/env bash
# Runs erfval over every authored corpus and checks the verdict against the
# expectation recorded in EXPECTATIONS.md.
#
#   bash tests/run-tests.sh
#
# Expectation syntax:  <corpus> <expected-severity> <expected-requirement>
#   conform            no violations at all
#   V:ERF-n            at least one VIOLATION carrying that requirement id
#   F:ERF-n            no violations, and at least one FLAG carrying that id
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$HERE")"
BIN="$ROOT/erfval-bin"

if [ ! -x "$BIN" ]; then
  (cd "$ROOT/erfval" && GOFLAGS=-mod=mod go build -o "$BIN" .)
fi
if [ ! -d "$HERE/corpora" ]; then
  bash "$HERE/build-corpora.sh" >/dev/null
fi

EXPECT=$(cat <<'TABLE'
conforming                              conform
tolerant-unknown-type                   conform
nc-erf3-extra-top-key                   V:ERF-3
nc-erf3-duplicate-source-id             V:ERF-66
nc-erf4-no-normalized-no-absence        V:ERF-4
nc-erf4-unknown-source                  V:ERF-4
nc-erf5-absence-no-reason               V:ERF-5
nc-erf5-status-outside-set              V:ERF-5
nc-erf68-ships-no-licence               V:ERF-68
nc-erf7-url-in-citation-text            V:ERF-7
nc-erf70-extraction-no-version          V:ERF-70
nc-erf71-bad-digest-shape               V:ERF-71
nc-erf71-digest-mismatch                V:ERF-71
nc-erf1-dangling-normalized             V:ERF-1
nc-erf6-not-verbatim                    V:ERF-6
nc-erf51-case-mismatch                  V:ERF-6
nc-erf52-bare-ellipsis-not-a-wildcard   V:ERF-6
nc-erf52-all-empty-spans                V:ERF-52
nc-erf52-spans-out-of-order             V:ERF-6
nc-erf31-no-bound-at                    V:ERF-31
nc-erf31-no-anchor                      V:ERF-31
nc-erf31-illegal-escape                 V:ERF-31
nc-erf31-bad-date                       V:ERF-31
nc-erf31-comma-separated-ids            V:ERF-33
nc-erf31-anchor-not-in-passage          F:ERF-31
nc-erf32-stale-binding                  F:ERF-32
nc-erf33-unresolved-id                  V:ERF-33
nc-erf34-created-bare-string            V:ERF-34
nc-erf38-duplicate-id                   V:ERF-38
nc-erf19-bare-date-standing             V:ERF-19
nc-erf21-nonhuman-standing              V:ERF-21
nc-erf55-empty-list-and-unknown-field   V:ERF-55
nc-erf22-stored-state                   V:ERF-22
nc-erf66-duplicate-key                  V:ERF-66
nc-erf66-anchor-alias                   V:ERF-66
nc-erf27-hits-reported-numeric          V:ERF-27
nc-erf26-unnamed-instrument             V:ERF-26
nc-erf43-assumes-cycle                  V:ERF-43
nc-erf43-self-edge                      V:ERF-43
nc-erf43-argument-leaf                  V:ERF-43
nc-erf44-reciprocal-stored              V:ERF-44
nc-erf49-unbacked-observation           F:ERF-49
nc-erf35-past-state-flag                F:ERF-35
nc-erf35-unresolved-current             V:ERF-35
nc-erf54-two-declarations               V:ERF-54
nc-erf13-bad-atom-id                    V:ERF-13
nc-erf12-failed-audit-as-verdict        V:ERF-12
nc-erf53-bare-yaml-record               V:ERF-53
nc-erf53-atom-with-body                 V:ERF-53
nc-erf67-crlf                           V:ERF-67
nc-erf58-wrong-event-time-key           V:ERF-58
nc-erf17-undeclared-corpus              V:ERF-17
nc-erf61-bad-semver                     V:ERF-61
nc-actor-convention                     V:ERF-Actor
amb-anchor-contains-comment-terminator  V:ERF-31
amb-elision-matches-mid-word            conform
amb-passage-scope                       conform
TABLE
)

pass=0; fail=0
while read -r corpus expect; do
  [ -z "$corpus" ] && continue
  dir="$HERE/corpora/$corpus"
  if [ ! -d "$dir" ]; then
    printf 'MISSING %-42s (no such corpus)\n' "$corpus"; fail=$((fail+1)); continue
  fi
  out="$("$BIN" "$dir" 2>&1)"
  nviol=$(printf '%s' "$out" | sed -n 's/^summary: \([0-9]*\) violation.*/\1/p')
  case "$expect" in
    conform)
      if [ "$nviol" = "0" ]; then ok=1; else ok=0; fi ;;
    V:*)
      req="${expect#V:}"
      if [ "$nviol" != "0" ] && printf '%s' "$out" | sed -n '/^VIOLATION/,/^FLAG\|^ADVISORY\|^INFO\|^====/p' | grep -q "$req"; then ok=1; else ok=0; fi ;;
    F:*)
      req="${expect#F:}"
      if [ "$nviol" = "0" ] && printf '%s' "$out" | sed -n '/^FLAG/,/^ADVISORY\|^INFO\|^====/p' | grep -q "$req"; then ok=1; else ok=0; fi ;;
    *) ok=0 ;;
  esac
  if [ "$ok" = "1" ]; then
    printf 'ok   %-42s %s\n' "$corpus" "$expect"; pass=$((pass+1))
  else
    printf 'FAIL %-42s expected %s, got: %s\n' "$corpus" "$expect" \
      "$(printf '%s' "$out" | grep -E '^summary:')"; fail=$((fail+1))
  fi
done <<< "$EXPECT"

echo
echo "corpus tests: $pass passed, $fail failed"

echo
echo "--- go unit tests ---"
(cd "$ROOT/erfval" && GOFLAGS=-mod=mod go test ./...) || fail=$((fail+1))

[ "$fail" = "0" ]
