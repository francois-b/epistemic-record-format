#!/usr/bin/env bash
# Builds every test corpus under tests/corpora/.
#
# Each corpus is authored from SPEC-as-tried.md alone. The non-conforming ones
# are named for the requirement id they are believed to violate; the full
# expectation table is in tests/EXPECTATIONS.md.
#
# Run:  bash tests/build-corpora.sh
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$HERE/corpora"
rm -rf "$OUT"
mkdir -p "$OUT"

sha() { shasum -a 256 "$1" | cut -d' ' -f1; }

# ---------------------------------------------------------------------------
# base <dir> - a minimal, conforming skeleton: declaration, source list with
# one shipped source, its normalized text.
# ---------------------------------------------------------------------------
base() {
  local d="$OUT/$1"
  mkdir -p "$d/normalized"
  cat > "$d/corpus.yaml" <<'YAML'
type: corpus
id: kwg
title: "Knowledge-work governance"
spec_version: "0.9.0"
owner: "human:francois"
YAML
  cat > "$d/normalized/pacioli.md" <<'MD'
# Particularis de Computis et Scripturis, chapter 36

All the entries that have been made in the day book must be entered in the
ledger. **All entries** made in the ledger have to be double entries -- that
is, if you make one creditor, you must make some one debtor. Out of this a
trial balance is made, by which we may see whether the said ledger is in
order, and this trial balance is drawn from the ledger itself.
MD
  local dig
  dig="$(sha "$d/normalized/pacioli.md")"
  cat > "$d/sources.yaml" <<YAML
type: sources
sources:
  pacioli-1494-geijsbeek:
    citation_text: "Luca Pacioli, Particularis de Computis et Scripturis
      (Venice, 1494), ch. 36, trans. Geijsbeek 1914"
    received:
      path: raw/pacioli-1494-geijsbeek.pdf
      digest: "sha256:05e58ce3f2589584d7d36446c46e2f74ab14f33ee6d1f0f20ef5e21c2aeaf2aa"
      timestamp: "2026-08-23"
    status: shipped-as-quotation
    normalized: normalized/pacioli.md
    normalized_digest: "sha256:${dig}"
    extraction: "pymupdf4llm 0.3.4"
    normalization: "pandoc 3.1.11 --wrap=none"
    excerpt: {timestamp: "2026-08-23", by: "agent/claude-sonnet-5"}
YAML
}

# atom <dir> <id> <quote> [extra yaml lines]
atom() {
  local d="$OUT/$1"; shift
  local id="$1"; shift
  local quote="$1"; shift
  mkdir -p "$d/atoms"
  cat > "$d/atoms/$id.md" <<YAML
---
id: $id
type: atom
corpus: kwg
finding: "Pacioli's 1494 treatise states the double-entry rule explicitly:
  every ledger entry is made twice, once as a debit and once as a credit."
quote: "$quote"
source: pacioli-1494-geijsbeek
source_quality: high
created: {timestamp: "2026-07-19", by: "agent/claude-fable-5"}
finding_audit:
  - {auditor: deepseek-v4-pro, verdict: SUPPORTED, timestamp: "2026-07-19",
     protocol: finding-audit-v2}
$*
---
YAML
}

###############################################################################
# 1. CONFORMING
###############################################################################
base conforming
C="$OUT/conforming"

atom conforming kwg-117 'All entries made in the ledger have to be double entries -- that is, if you make one creditor, you must make some one debtor.'
atom conforming kwg-118 'All the entries [...] must be entered in the ledger.'

# A medium-graded atom, with the reason in limitations per section 4.2.
mkdir -p "$C/atoms"
cat > "$C/atoms/kwg-119.md" <<'YAML'
---
id: kwg-119
type: atom
corpus: kwg
finding: "Pacioli's chapter 36 states that the trial balance is drawn from the
  ledger itself, which makes the balance a derived check rather than an
  independent one."
quote: "this trial balance is drawn from the ledger itself"
source: pacioli-1494-geijsbeek
source_quality: medium
as_of_date: "1494"
limitations: "A 1914 English translation of a 1494 Italian text; the
  translator's word choice is one hop from the original."
created: {timestamp: "2026-07-19", by: "agent/claude-fable-5"}
---
YAML

mkdir -p "$C/claims" "$C/surveys" "$C/narratives"
cat > "$C/claims/double-entry-detects-single-sided-error.md" <<'YAML'
---
id: double-entry-detects-single-sided-error
type: claim
corpus: kwg
title: "Double-entry bookkeeping detects single-sided error, because every
  ledger entry is made twice and the two sides must agree"
epistemic_kind: observation
created: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}
families: [prior-art]
atoms_for: [kwg-117, kwg-118]
standings:
  - timestamp: "2026-08-22T09:30:00Z"
    stance: for
    by: "human:francois"
    why: "The Pacioli text states the rule in as many words, and the atoms
      quote it directly."
    evidence_at_stance: {atoms_for: [kwg-117, kwg-118]}
---
Double-entry bookkeeping detects single-sided error, because every ledger
entry is made twice and the two sides must agree.

## Working notes

The claim is about detection, not prevention.
YAML

cat > "$C/claims/redundancy-is-the-control-primitive.md" <<'YAML'
---
id: redundancy-is-the-control-primitive
type: claim
corpus: kwg
title: "Redundancy, not review, is the control primitive in a ledger: the
  second entry is what makes the first checkable"
epistemic_kind: argument
created: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}
edges:
  - {to: double-entry-detects-single-sided-error, relation: assumes}
standings:
  - timestamp: "2026-08-23T11:00:00+02:00"
    stance: for
    by: "human:francois"
    why: "Granting that the two sides must agree, the detection follows from
      the redundancy alone and needs no reviewer."
---
Redundancy, not review, is the control primitive in a ledger: the second
entry is what makes the first checkable.

## Working notes

The argument is deliberately narrow.
YAML

cat > "$C/surveys/granted-flag-uses-2026-08-22.md" <<'YAML'
---
id: granted-flag-uses-2026-08-22
type: survey
corpus: kwg
title: "Current uses of the granted field across the seven registered corpora"
conducted: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}
searches:
  - tool: "grep -rnE (BSD grep, macOS)"
    query: "^granted:|^  granted:"
    scope: "all *.md under the seven registered corpus claims folders"
    hits_reported: "0"
  - tool: "grep -rn (BSD grep, macOS)"
    query: "granted (word-level, --include=*.md)"
    scope: "same seven claims folders"
    hits_reported: "4 lines in 3 files; none a field use"
notable_results:
  - what: "The claims-tree doc-class granted dimension"
    note: "A render-layer field of one document class; the word's nearest live
      relative, not a record field."
---
Searched for live uses of a `granted` field before proposing one.
YAML

cat > "$C/narratives/double-entry-brief.md" <<'YAML'
---
type: narrative
title: "Why redundancy is the control"
corpus: kwg
created: {timestamp: "2026-08-23", by: "human:francois"}
---
Pacioli's rule is not a bookkeeping convenience. Every ledger entry is made
twice, once as a debit and once as a credit, and the redundancy is the
control.

<!-- claims: double-entry-detects-single-sided-error "the redundancy is the control" bound-at=2026-08-24 -->

Nothing in the arrangement needs a reviewer. The second entry does the work a
reviewer would otherwise be asked to do.

<!-- claims: redundancy-is-the-control-primitive "The second entry does the work" bound-at=2026-08-24 -->
YAML

###############################################################################
# 2. NON-CONFORMING - the source list
###############################################################################

# ERF-3: top level is a mapping of EXACTLY two keys.
base nc-erf3-extra-top-key
python3 - "$OUT/nc-erf3-extra-top-key/sources.yaml" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read()
open(p, "w").write("version: 2\n" + s)
PY

# ERF-3: a source id repeated in one list.
base nc-erf3-duplicate-source-id
cat >> "$OUT/nc-erf3-duplicate-source-id/sources.yaml" <<'YAML'
  pacioli-1494-geijsbeek:
    citation_text: "A second entry under the same key"
    status: licence-unverified
    reason: "Rights could not be established."
YAML

# ERF-4: neither a normalized path nor a recorded absence.
base nc-erf4-no-normalized-no-absence
cat > "$OUT/nc-erf4-no-normalized-no-absence/sources.yaml" <<'YAML'
type: sources
sources:
  mystery-report:
    citation_text: "Anonymous, An Unattributed Report (n.p., 2026)"
    status: shipped
YAML

# ERF-5: an absence status with no reason.
base nc-erf5-absence-no-reason
cat > "$OUT/nc-erf5-absence-no-reason/sources.yaml" <<'YAML'
type: sources
sources:
  withheld-report:
    citation_text: "Gartner, Magic Quadrant for Legal Research (2026)"
    status: not-redistributable
YAML

# ERF-5: a status outside the closed set.
base nc-erf5-status-outside-set
cat > "$OUT/nc-erf5-status-outside-set/sources.yaml" <<'YAML'
type: sources
sources:
  withheld-report:
    citation_text: "Gartner, Magic Quadrant for Legal Research (2026)"
    status: paywalled
    reason: "Behind a subscription wall."
YAML

# ERF-68: the text ships, no licence is named, and the status is `shipped`.
base nc-erf68-ships-no-licence
python3 - "$OUT/nc-erf68-ships-no-licence/sources.yaml" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read().replace("status: shipped-as-quotation", "status: shipped")
open(p, "w").write(s)
PY

# ERF-7: citation_text contains a URL.
base nc-erf7-url-in-citation-text
python3 - "$OUT/nc-erf7-url-in-citation-text/sources.yaml" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read().replace(
  'trans. Geijsbeek 1914"',
  'trans. Geijsbeek 1914, https://archive.org/details/ancientdoubleent00geijuoft"')
open(p, "w").write(s)
PY

# ERF-70: the extracting tool is named without its exact version.
base nc-erf70-extraction-no-version
python3 - "$OUT/nc-erf70-extraction-no-version/sources.yaml" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read().replace('extraction: "pymupdf4llm 0.3.4"', 'extraction: "pdftotext"')
open(p, "w").write(s)
PY

# ERF-71: a digest that is not "<algorithm>:<hex>".
base nc-erf71-bad-digest-shape
python3 - "$OUT/nc-erf71-bad-digest-shape/sources.yaml" <<'PY'
import sys, re
p = sys.argv[1]
s = re.sub(r'normalized_digest: "sha256:[0-9a-f]+"', 'normalized_digest: "05e58ce3f2589584"', open(p).read())
open(p, "w").write(s)
PY

# ERF-71: the recorded digest does not match the file on disk.
base nc-erf71-digest-mismatch
python3 - "$OUT/nc-erf71-digest-mismatch/sources.yaml" <<'PY'
import sys, re
p = sys.argv[1]
s = re.sub(r'normalized_digest: "sha256:[0-9a-f]+"',
           'normalized_digest: "sha256:' + '0'*64 + '"', open(p).read())
open(p, "w").write(s)
PY

# ERF-1: the normalized path is named but the file is not there.
base nc-erf1-dangling-normalized
rm "$OUT/nc-erf1-dangling-normalized/normalized/pacioli.md"
atom nc-erf1-dangling-normalized kwg-117 'All entries made in the ledger have to be double entries'

# ERF-4: an atom naming a source that is not in the list.
base nc-erf4-unknown-source
mkdir -p "$OUT/nc-erf4-unknown-source/atoms"
cat > "$OUT/nc-erf4-unknown-source/atoms/kwg-120.md" <<'YAML'
---
id: kwg-120
type: atom
corpus: kwg
finding: "A finding whose source is not listed anywhere."
quote: "All entries made in the ledger have to be double entries"
source: a-source-nobody-listed
source_quality: high
created: {timestamp: "2026-07-19", by: "agent/claude-fable-5"}
---
YAML

###############################################################################
# 3. NON-CONFORMING - the quote check
###############################################################################

# ERF-6: the quote is not verbatim (one word changed).
base nc-erf6-not-verbatim
atom nc-erf6-not-verbatim kwg-117 'All entries made in the ledger must be double entries -- that is, if you make one creditor, you must make some one debtor.'

# ERF-51: case differs only. "Case MUST NOT be folded."
base nc-erf51-case-mismatch
atom nc-erf51-case-mismatch kwg-117 'all entries made in the ledger have to be double entries'

# ERF-52: a bare `...` is a literal source character, not a wildcard.
base nc-erf52-bare-ellipsis-not-a-wildcard
atom nc-erf52-bare-ellipsis-not-a-wildcard kwg-117 'All the entries ... must be entered in the ledger.'

# ERF-52: a quote whose spans are all empty MUST fail rather than trivially pass.
base nc-erf52-all-empty-spans
atom nc-erf52-all-empty-spans kwg-117 '[...]'

# ERF-52: spans present in the text but out of order.
base nc-erf52-spans-out-of-order
atom nc-erf52-spans-out-of-order kwg-117 'you must make some one debtor[...]All the entries that have been made'

###############################################################################
# 4. NON-CONFORMING - narrative bindings
###############################################################################

nbase() {
  base "$1"
  atom "$1" kwg-117 'All entries made in the ledger have to be double entries'
  mkdir -p "$OUT/$1/claims" "$OUT/$1/narratives"
  cat > "$OUT/$1/claims/a-real-claim.md" <<'YAML'
---
id: a-real-claim
type: claim
corpus: kwg
title: "A ledger entry made twice is checkable against itself"
epistemic_kind: observation
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
atoms_for: [kwg-117]
---
A ledger entry made twice is checkable against itself.
YAML
}

narr() { # narr <dir> <binding-line>
  cat > "$OUT/$1/narratives/brief.md" <<YAML
---
type: narrative
title: "A short brief"
corpus: kwg
created: {timestamp: "2026-08-23", by: "human:francois"}
---
The second entry is what makes the first one checkable, and that is the whole
of the mechanism.

$2
YAML
}

# ERF-31: `bound-at` missing. Every part of the grammar is required.
nbase nc-erf31-no-bound-at
narr nc-erf31-no-bound-at '<!-- claims: a-real-claim "the whole of the mechanism" -->'

# ERF-31: ids separated by commas. "Ids are separated by whitespace, never by
# commas, because a comma inside an unquoted list invites a parser to guess."
nbase nc-erf31-comma-separated-ids
narr nc-erf31-comma-separated-ids '<!-- claims: a-real-claim, kwg-117 "the whole of the mechanism" bound-at=2026-08-24 -->'

# ERF-31: no anchor at all.
nbase nc-erf31-no-anchor
narr nc-erf31-no-anchor '<!-- claims: a-real-claim bound-at=2026-08-24 -->'

# ERF-31: an escape the grammar does not define.
nbase nc-erf31-illegal-escape
narr nc-erf31-illegal-escape '<!-- claims: a-real-claim "the whole\n of the mechanism" bound-at=2026-08-24 -->'

# ERF-31: bound-at is not a YYYY-MM-DD date.
nbase nc-erf31-bad-date
narr nc-erf31-bad-date '<!-- claims: a-real-claim "the whole of the mechanism" bound-at=24-08-2026 -->'

# ERF-31 FLAG: the anchor does not occur in its passage.
nbase nc-erf31-anchor-not-in-passage
narr nc-erf31-anchor-not-in-passage '<!-- claims: a-real-claim "a phrase that is nowhere in the prose" bound-at=2026-08-24 -->'

# ERF-33: the binding names an id that resolves to no record.
nbase nc-erf33-unresolved-id
narr nc-erf33-unresolved-id '<!-- claims: a-claim-that-does-not-exist "the whole of the mechanism" bound-at=2026-08-24 -->'

# ERF-32 FLAG: the claim's last_modified is later than bound-at.
nbase nc-erf32-stale-binding
python3 - "$OUT/nc-erf32-stale-binding/claims/a-real-claim.md" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read().replace(
  'created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}',
  'created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}\nlast_modified: {timestamp: "2026-08-30", by: "human:francois"}')
open(p, "w").write(s)
PY
narr nc-erf32-stale-binding '<!-- claims: a-real-claim "the whole of the mechanism" bound-at=2026-08-24 -->'

# ERF-34: `created` written as a bare string rather than the {timestamp, by}
# stamp. "Naming the three fields without typing them left two readings, and
# two authors took one each."
nbase nc-erf34-created-bare-string
cat > "$OUT/nc-erf34-created-bare-string/narratives/brief.md" <<'YAML'
---
type: narrative
title: "A short brief"
corpus: kwg
created: "2026-08-23"
---
The second entry is what makes the first one checkable.

<!-- claims: a-real-claim "makes the first one checkable" bound-at=2026-08-24 -->
YAML

###############################################################################
# 5. NON-CONFORMING - records and invariants
###############################################################################

# ERF-38: two records with the same id, of different types.
base nc-erf38-duplicate-id
atom nc-erf38-duplicate-id kwg-117 'All entries made in the ledger have to be double entries'
mkdir -p "$OUT/nc-erf38-duplicate-id/claims"
cat > "$OUT/nc-erf38-duplicate-id/claims/kwg-117.md" <<'YAML'
---
id: kwg-117
type: claim
corpus: kwg
title: "A claim that has stolen an atom's id"
epistemic_kind: observation
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
---
A claim that has stolen an atom's id.
YAML

# ERF-19: a standing carrying a bare date rather than a full instant.
base nc-erf19-bare-date-standing
mkdir -p "$OUT/nc-erf19-bare-date-standing/claims"
cat > "$OUT/nc-erf19-bare-date-standing/claims/c1.md" <<'YAML'
---
id: c1
type: claim
corpus: kwg
title: "A claim someone has stood behind on a bare date"
epistemic_kind: bet
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
standings:
  - timestamp: "2026-08-22"
    stance: for
    by: "human:francois"
    why: "Because a bare date and a full instant on the same day cannot be
      ordered against each other."
---
A claim someone has stood behind on a bare date.
YAML

# ERF-21 / ERF-39: a non-human `by`, and an empty `why`.
base nc-erf21-nonhuman-standing
mkdir -p "$OUT/nc-erf21-nonhuman-standing/claims"
cat > "$OUT/nc-erf21-nonhuman-standing/claims/c2.md" <<'YAML'
---
id: c2
type: claim
corpus: kwg
title: "A claim an agent purported to stand behind"
epistemic_kind: bet
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
standings:
  - timestamp: "2026-08-22T10:00:00Z"
    stance: for
    by: "agent/claude-fable-5"
    why: "An LLM can propose a claim; only a person takes a stance."
  - timestamp: "2026-08-23T10:00:00Z"
    stance: against
    by: "human:francois"
    why: ""
---
A claim an agent purported to stand behind.
YAML

# ERF-55: an empty list written out, and a field the spec does not define.
base nc-erf55-empty-list-and-unknown-field
mkdir -p "$OUT/nc-erf55-empty-list-and-unknown-field/claims"
cat > "$OUT/nc-erf55-empty-list-and-unknown-field/claims/c3.md" <<'YAML'
---
id: c3
type: claim
corpus: kwg
title: "A claim with an empty list written out and an undefined field"
epistemic_kind: commitment
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
atoms_for: []
confidence: 0.8
x_internal_note: "an extension field, which ERF-72 permits"
---
A claim with an empty list written out and an undefined field.
YAML

# ERF-22: a stored disposition.
base nc-erf22-stored-state
mkdir -p "$OUT/nc-erf22-stored-state/claims"
cat > "$OUT/nc-erf22-stored-state/claims/c4.md" <<'YAML'
---
id: c4
type: claim
corpus: kwg
title: "A claim that stores its own disposition"
epistemic_kind: commitment
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
disposition: active
---
A claim that stores its own disposition.
YAML

# ERF-66: a duplicate key in a record's frontmatter.
base nc-erf66-duplicate-key
mkdir -p "$OUT/nc-erf66-duplicate-key/claims"
cat > "$OUT/nc-erf66-duplicate-key/claims/c5.md" <<'YAML'
---
id: c5
type: claim
corpus: kwg
title: "The first title"
title: "The second title"
epistemic_kind: commitment
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
---
The first title.
YAML

# ERF-66: an anchor and an alias.
base nc-erf66-anchor-alias
mkdir -p "$OUT/nc-erf66-anchor-alias/claims"
cat > "$OUT/nc-erf66-anchor-alias/claims/c6.md" <<'YAML'
---
id: c6
type: claim
corpus: kwg
title: "A claim using a YAML anchor and alias"
epistemic_kind: commitment
created: &stamp {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
last_modified: *stamp
---
A claim using a YAML anchor and alias.
YAML

# ERF-27: hits_reported written as a number rather than as text.
base nc-erf27-hits-reported-numeric
mkdir -p "$OUT/nc-erf27-hits-reported-numeric/surveys"
cat > "$OUT/nc-erf27-hits-reported-numeric/surveys/s-2026-08-22.md" <<'YAML'
---
id: s-2026-08-22
type: survey
corpus: kwg
title: "Whether any shipped tool checks quotes continuously"
conducted: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}
searches:
  - tool: "grep -rn (BSD grep, macOS)"
    query: "continuous quote check"
    hits_reported: 0
---
A survey whose yield was written as a number.
YAML

# ERF-26: a category rather than a named instrument, and no query.
base nc-erf26-unnamed-instrument
mkdir -p "$OUT/nc-erf26-unnamed-instrument/surveys"
cat > "$OUT/nc-erf26-unnamed-instrument/surveys/s2-2026-08-22.md" <<'YAML'
---
id: s2-2026-08-22
type: survey
corpus: kwg
title: "Whether any shipped tool checks quotes continuously"
conducted: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}
searches:
  - tool: "web search"
    hits_reported: "about a hundred"
---
A survey act with no query at all.
YAML

# ERF-43: a cycle in `assumes`.
base nc-erf43-assumes-cycle
mkdir -p "$OUT/nc-erf43-assumes-cycle/claims"
for n in a b; do :; done
cat > "$OUT/nc-erf43-assumes-cycle/claims/arg-a.md" <<'YAML'
---
id: arg-a
type: claim
corpus: kwg
title: "Argument A, which assumes argument B"
epistemic_kind: argument
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
edges:
  - {to: arg-b, relation: assumes}
---
Argument A, which assumes argument B.
YAML
cat > "$OUT/nc-erf43-assumes-cycle/claims/arg-b.md" <<'YAML'
---
id: arg-b
type: claim
corpus: kwg
title: "Argument B, which assumes argument A"
epistemic_kind: argument
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
edges:
  - {to: arg-a, relation: assumes}
---
Argument B, which assumes argument A.
YAML

# ERF-43: a self-edge.
base nc-erf43-self-edge
mkdir -p "$OUT/nc-erf43-self-edge/claims"
cat > "$OUT/nc-erf43-self-edge/claims/arg-self.md" <<'YAML'
---
id: arg-self
type: claim
corpus: kwg
title: "An argument that assumes itself"
epistemic_kind: argument
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
edges:
  - {to: arg-self, relation: assumes}
---
An argument that assumes itself.
YAML

# ERF-43: a premise closure terminating in an argument leaf.
base nc-erf43-argument-leaf
mkdir -p "$OUT/nc-erf43-argument-leaf/claims"
cat > "$OUT/nc-erf43-argument-leaf/claims/arg-top.md" <<'YAML'
---
id: arg-top
type: claim
corpus: kwg
title: "The top argument, which assumes a bare argument"
epistemic_kind: argument
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
edges:
  - {to: arg-bare, relation: assumes}
---
The top argument, which assumes a bare argument.
YAML
cat > "$OUT/nc-erf43-argument-leaf/claims/arg-bare.md" <<'YAML'
---
id: arg-bare
type: claim
corpus: kwg
title: "A bare argument with no premises of its own"
epistemic_kind: argument
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
---
A bare argument with no premises of its own.
YAML

# ERF-44: `conflicts-with` stored on both sides of one pair.
base nc-erf44-reciprocal-stored
mkdir -p "$OUT/nc-erf44-reciprocal-stored/claims"
cat > "$OUT/nc-erf44-reciprocal-stored/claims/c-left.md" <<'YAML'
---
id: c-left
type: claim
corpus: kwg
title: "The left claim of a conflicting pair"
epistemic_kind: commitment
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
edges:
  - {to: c-right, relation: conflicts-with}
---
The left claim of a conflicting pair.
YAML
cat > "$OUT/nc-erf44-reciprocal-stored/claims/c-right.md" <<'YAML'
---
id: c-right
type: claim
corpus: kwg
title: "The right claim of a conflicting pair"
epistemic_kind: commitment
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
edges:
  - {to: c-left, relation: conflicts-with}
---
The right claim of a conflicting pair.
YAML

# ERF-49 FLAG: an observation someone stands on with no atoms and no surveys.
base nc-erf49-unbacked-observation
mkdir -p "$OUT/nc-erf49-unbacked-observation/claims"
cat > "$OUT/nc-erf49-unbacked-observation/claims/c-unbacked.md" <<'YAML'
---
id: c-unbacked
type: claim
corpus: kwg
title: "An observation nobody has evidenced but somebody stands behind"
epistemic_kind: observation
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
standings:
  - timestamp: "2026-08-22T10:00:00Z"
    stance: for
    by: "human:francois"
    why: "I believe it on the strength of experience I have not written down."
---
An observation nobody has evidenced but somebody stands behind.
YAML

# ERF-35 FLAG: an evidence_at_stance naming an atom that no longer exists.
base nc-erf35-past-state-flag
atom nc-erf35-past-state-flag kwg-117 'All entries made in the ledger have to be double entries'
mkdir -p "$OUT/nc-erf35-past-state-flag/claims"
cat > "$OUT/nc-erf35-past-state-flag/claims/c-past.md" <<'YAML'
---
id: c-past
type: claim
corpus: kwg
title: "A claim whose ruler faced an atom that has since been withdrawn"
epistemic_kind: observation
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
atoms_for: [kwg-117]
standings:
  - timestamp: "2026-08-22T10:00:00Z"
    stance: for
    by: "human:francois"
    why: "Two atoms carried it at the time."
    evidence_at_stance: {atoms_for: [kwg-117, kwg-999-withdrawn]}
---
A claim whose ruler faced an atom that has since been withdrawn.
YAML

# ERF-35 VIOLATION: a current relationship that does not resolve.
base nc-erf35-unresolved-current
mkdir -p "$OUT/nc-erf35-unresolved-current/claims"
cat > "$OUT/nc-erf35-unresolved-current/claims/c-broken.md" <<'YAML'
---
id: c-broken
type: claim
corpus: kwg
title: "A claim citing an atom that does not exist"
epistemic_kind: observation
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
atoms_for: [kwg-does-not-exist]
---
A claim citing an atom that does not exist.
YAML

# ERF-54: a corpus that declares itself twice.
base nc-erf54-two-declarations
cp "$OUT/nc-erf54-two-declarations/corpus.yaml" "$OUT/nc-erf54-two-declarations/corpus-copy.yaml"

# ERF-13: an atom id with no sequence number.
base nc-erf13-bad-atom-id
mkdir -p "$OUT/nc-erf13-bad-atom-id/atoms"
cat > "$OUT/nc-erf13-bad-atom-id/atoms/pacioli-quote.md" <<'YAML'
---
id: pacioli-quote
type: atom
corpus: kwg
finding: "An atom whose id is a slug rather than a prefix plus a number."
quote: "All entries made in the ledger have to be double entries"
source: pacioli-1494-geijsbeek
source_quality: high
created: {timestamp: "2026-07-19", by: "agent/claude-fable-5"}
---
YAML

# ERF-12: a verdict recording a tool failure.
base nc-erf12-failed-audit-as-verdict
atom nc-erf12-failed-audit-as-verdict kwg-121 'All entries made in the ledger have to be double entries'
python3 - "$OUT/nc-erf12-failed-audit-as-verdict/atoms/kwg-121.md" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read().replace("verdict: SUPPORTED", "verdict: ERROR")
open(p, "w").write(s)
PY

# ERF-53: a record written as a bare YAML document with no body fence.
base nc-erf53-bare-yaml-record
mkdir -p "$OUT/nc-erf53-bare-yaml-record/atoms"
cat > "$OUT/nc-erf53-bare-yaml-record/atoms/kwg-122.md" <<'YAML'
id: kwg-122
type: atom
corpus: kwg
finding: "An atom serialized as a bare YAML document."
quote: "All entries made in the ledger have to be double entries"
source: pacioli-1494-geijsbeek
source_quality: high
created: {timestamp: "2026-07-19", by: "agent/claude-fable-5"}
YAML

# ERF-53: an atom with a non-empty body.
base nc-erf53-atom-with-body
atom nc-erf53-atom-with-body kwg-123 'All entries made in the ledger have to be double entries'
printf '\nAn atom must not have a body.\n' >> "$OUT/nc-erf53-atom-with-body/atoms/kwg-123.md"

# ERF-67: CRLF line endings.
base nc-erf67-crlf
atom nc-erf67-crlf kwg-124 'All entries made in the ledger have to be double entries'
python3 - "$OUT/nc-erf67-crlf/atoms/kwg-124.md" <<'PY'
import sys
p = sys.argv[1]
d = open(p, "rb").read().replace(b"\n", b"\r\n")
open(p, "wb").write(d)
PY

# ERF-58: the event-time key written as something other than `timestamp`.
base nc-erf58-wrong-event-time-key
mkdir -p "$OUT/nc-erf58-wrong-event-time-key/atoms"
cat > "$OUT/nc-erf58-wrong-event-time-key/atoms/kwg-125.md" <<'YAML'
---
id: kwg-125
type: atom
corpus: kwg
finding: "An atom whose created stamp uses `date` rather than `timestamp`."
quote: "All entries made in the ledger have to be double entries"
source: pacioli-1494-geijsbeek
source_quality: high
created: {date: "2026-07-19", by: "agent/claude-fable-5"}
---
YAML

# The actor convention of section 2 (an unnumbered MUST).
base nc-actor-convention
mkdir -p "$OUT/nc-actor-convention/atoms"
cat > "$OUT/nc-actor-convention/atoms/kwg-126.md" <<'YAML'
---
id: kwg-126
type: atom
corpus: kwg
finding: "An atom created by a bare name that follows no actor convention."
quote: "All entries made in the ledger have to be double entries"
source: pacioli-1494-geijsbeek
source_quality: high
created: {timestamp: "2026-07-19", by: "claude"}
---
YAML

# ERF-17: a claim naming a corpus nothing declares.
base nc-erf17-undeclared-corpus
mkdir -p "$OUT/nc-erf17-undeclared-corpus/claims"
cat > "$OUT/nc-erf17-undeclared-corpus/claims/c-elsewhere.md" <<'YAML'
---
id: c-elsewhere
type: claim
corpus: some-other-corpus
title: "A claim belonging to a corpus nothing declares"
epistemic_kind: commitment
created: {timestamp: "2026-08-01", by: "agent/claude-fable-5"}
---
A claim belonging to a corpus nothing declares.
YAML

# ERF-59 / ERF-61: a declaration with no spec_version and a bad one.
base nc-erf61-bad-semver
cat > "$OUT/nc-erf61-bad-semver/corpus.yaml" <<'YAML'
type: corpus
id: kwg
title: "Knowledge-work governance"
spec_version: "0.9"
YAML

# ERF-54 / ERF-57: an unknown record type, which must be reported but must NOT
# make the corpus non-conforming.
base tolerant-unknown-type
mkdir -p "$OUT/tolerant-unknown-type/questions"
cat > "$OUT/tolerant-unknown-type/questions/q1.md" <<'YAML'
---
id: q1
type: question
corpus: kwg
title: "A record type this spec_version does not define"
---
A record type this spec_version does not define.
YAML
printf 'A file carrying no type at all.\n' > "$OUT/tolerant-unknown-type/README.txt"


###############################################################################
# 6. AMBIGUITY DEMONSTRATORS
# These are not "conforming" or "non-conforming": their verdict CHANGES with a
# reading the spec does not settle. Each is referenced from ambiguities.md.
###############################################################################

# A-21: the anchor is drawn from a paragraph two paragraphs above the binding.
# Verdict under -passage=paragraph: FLAG. Under since-previous / document: none.
nbase amb-passage-scope
cat > "$OUT/amb-passage-scope/narratives/brief.md" <<'YAML'
---
type: narrative
title: "A brief whose anchor sits two paragraphs up"
corpus: kwg
created: {timestamp: "2026-08-23", by: "human:francois"}
---
The second entry is what makes the first one checkable, and that is the whole
of the mechanism.

A ledger that records each figure once has nothing to compare a figure
against, so an error in it is invisible until someone reconciles by hand.

Redundancy is therefore the control, and review is the fallback.

<!-- claims: a-real-claim "the whole of the mechanism" bound-at=2026-08-24 -->
YAML

# A-27: an anchor whose own words contain the HTML comment terminator. The
# ERF-31 grammar permits it (`-->` is not `"` and not `\`); HTML does not.
nbase amb-anchor-contains-comment-terminator
cat > "$OUT/amb-anchor-contains-comment-terminator/narratives/brief.md" <<'YAML'
---
type: narrative
title: "A brief quoting an arrow"
corpus: kwg
created: {timestamp: "2026-08-23", by: "human:francois"}
---
The pipeline is written raw --> extracted --> normalized, and every arrow is
a step somebody has to name.

<!-- claims: a-real-claim "raw --> extracted --> normalized" bound-at=2026-08-24 -->
YAML

# A-05: an elision whose trimmed spans match INSIDE longer words, so the quote
# passes a check its author would not recognize as fidelity.
base amb-elision-matches-mid-word
cat > "$OUT/amb-elision-matches-mid-word/normalized/pacioli.md" <<'MD'
# A text chosen to expose the span-boundary question

The catapult was heavy. Someone eventually sat on the mat beside it.
MD
mkdir -p "$OUT/amb-elision-matches-mid-word/atoms"
cat > "$OUT/amb-elision-matches-mid-word/atoms/kwg-200.md" <<'YAML'
---
id: kwg-200
type: atom
corpus: kwg
finding: "The source says a cat sat, which it does not: the two spans matched
  inside longer words because ERF-51 trims each span independently."
quote: "The cat[...]sat"
source: pacioli-1494-geijsbeek
source_quality: high
created: {timestamp: "2026-07-19", by: "agent/claude-fable-5"}
---
YAML
python3 - "$OUT/amb-elision-matches-mid-word/sources.yaml" <<'PY'
import sys, re, hashlib, os
p = sys.argv[1]
d = os.path.join(os.path.dirname(p), "normalized/pacioli.md")
dig = hashlib.sha256(open(d,'rb').read()).hexdigest()
s = re.sub(r'normalized_digest: "sha256:[0-9a-f]+"', 'normalized_digest: "sha256:%s"' % dig, open(p).read())
open(p, "w").write(s)
PY

echo "built $(find "$OUT" -maxdepth 1 -mindepth 1 -type d | wc -l | tr -d ' ') corpora under $OUT"
