#!/usr/bin/env python3
"""
Generates the test corpora for erfval.

Every corpus here was authored from SPEC-as-tried.md alone. `conforming/` is
intended to produce zero violations. Each `nonconforming/nc-ERF-NN-slug/` holds
one deliberate defect, and the directory name states the requirement id it is
believed to violate. `flagging/` holds corpora that should produce FLAGS and no
violations: a corpus carrying flags and no violations conforms (section 2), and
the point of those cases is that erfval must say so.

Run:  python3 tests/make-tests.py
"""
import os, shutil, textwrap

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- base pieces

DECL = """type: corpus
id: knowledge-work-governance
title: "Knowledge-work governance"
spec_version: "0.9.0"
owner: "human:francois"
"""

NORMALIZED = """# Particularis de Computis et Scripturis, chapter 36

Of the manner of keeping the ledger and its journal, and of the entries which
are made therein. All entries made in the ledger have to be double entries --
that is, if you make one creditor, you must make some one debtor. From this a
trial balance is made, which is called in Venice the *summa summarum*.

The balance of the ledger is a sheet folded lengthwise, on which are entered on
the right all the creditors of the ledger, and on the left all the debtors.
"""

SOURCES = """type: sources
sources:
  pacioli-1494-geijsbeek:
    citation_text: "Luca Pacioli, Particularis de Computis et Scripturis
      (Venice, 1494), ch. 36, trans. Geijsbeek 1914"
    received:
      url: "https://archive.org/download/ancientdoubleent00geijuoft/ancientdoubleent00geijuoft.pdf"
      path: raw/pacioli-1494-geijsbeek.pdf
      digest: "sha256:05e58ce3f2589584d7d36446c46e2f74ab14f33ee6d1f0f20ef5e21c2aeaf2aa"
      timestamp: "2026-08-23"
    status: shipped-as-quotation
    normalized: normalized/pacioli-1494-geijsbeek.md
    normalized_digest: "sha256:1b9a0c47d3e8f5a2c6b4e09f7d132a8be5c40f6719d2ab83c5e7104f9a6d2b3e"
    extraction: "pymupdf4llm 0.3.4"
    normalization: "pandoc 3.1.11 --wrap=none"
    excerpt: {timestamp: "2026-08-23", by: "agent/claude-sonnet-5"}
  acme-legal-ai-2026:
    citation_text: "Acme Analytics, Legal AI Market Report (Acme Analytics, 2026)"
    status: not-redistributable
    reason: "Copyright permits reading but not republication; the report is
      held offline and quoted findings cannot be re-checked from this corpus."
"""

ATOM1 = """---
id: kwg-001
type: atom
corpus: knowledge-work-governance
finding: "Pacioli's 1494 treatise states the double-entry rule explicitly:
  every ledger entry is made twice, once as a debit and once as a credit."
quote: "All entries made in the ledger have to be double entries -- that is,
  if you make one creditor, you must make some one debtor."
source: pacioli-1494-geijsbeek
source_quality: high
as_of_date: "1494"
created: {timestamp: "2026-07-19", by: "agent/claude-fable-5"}
finding_audit:
  - {auditor: deepseek-v4-pro, verdict: SUPPORTED, timestamp: "2026-07-19",
     protocol: finding-audit-v2}
---
"""

# Exercises ERF-52: a quote with an elision. The two spans occur in the
# normalized text, in order and without overlap.
ATOM2 = """---
id: kwg-002
type: atom
corpus: knowledge-work-governance
finding: "Pacioli's chapter 36 describes the balance sheet as a folded sheet
  with creditors entered on the right and debtors on the left."
quote: "The balance of the ledger is a sheet folded lengthwise [...] on the
  left all the debtors."
source: pacioli-1494-geijsbeek
source_quality: high
created: {timestamp: "2026-07-19", by: "agent/claude-fable-5"}
---
"""

CLAIM_OBS = """---
id: double-entry-rule-stated-1494
type: claim
corpus: knowledge-work-governance
title: "The double-entry rule was stated explicitly in print by 1494"
epistemic_kind: observation
created: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}
families: [prior-art]
atoms_for: [kwg-001, kwg-002]
standings:
  - timestamp: "2026-08-23T14:02:00Z"
    stance: for
    by: "human:francois"
    why: "Pacioli's own text states the rule in the imperative; the atoms quote
      it directly and the normalized text is held in this corpus."
    evidence_at_stance:
      atoms_for: [kwg-001, kwg-002]
---
The double-entry rule was stated explicitly in print by 1494.

## Working notes

Geijsbeek's 1914 translation is the copy actually read.
"""

CLAIM_ARG = """---
id: ledger-discipline-predates-software
type: claim
corpus: knowledge-work-governance
title: "Ledger discipline predates software and was never a software problem"
epistemic_kind: argument
created: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}
edges:
  - {to: double-entry-rule-stated-1494, relation: assumes}
---
Ledger discipline predates software and was never a software problem.

## Working notes

The premise arrives on the graph, not in this prose.
"""

SURVEY = """---
id: granted-flag-uses-2026-08-22
type: survey
corpus: knowledge-work-governance
title: "Current uses of the granted field across the seven registered corpora"
conducted: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}
searches:
  - tool: "grep -rnE (BSD grep, macOS)"
    query: "^granted:|^  granted:"
    scope: "all *.md under the seven registered corpus claims folders"
    hits_reported: "0"
notable_results:
  - what: "The claims-tree doc-class granted dimension"
    note: "A render-layer field of one document class, documented in an
      internal corpus; the word's nearest live relative, not a record field."
---
Nothing turned up. The universe searched is the seven registered corpora, which
is the universe the claim is about, so the absence is conclusive within it.
"""

NARRATIVE = """---
type: narrative
title: "Why the ledger came first"
corpus: knowledge-work-governance
created: {timestamp: "2026-08-24", by: "human:francois"}
---
Long before anyone wrote software for it, the discipline of the ledger was
already exact. Pacioli did not invent double-entry bookkeeping; he wrote down
what Venetian merchants were already doing, and the rule he wrote down is
stated in the imperative rather than as advice.

<!-- claims: double-entry-rule-stated-1494 "stated in the imperative rather than as advice" bound-at=2026-08-24 -->

Everything since has been a re-implementation of that rule on faster substrate.

<!-- claims: ledger-discipline-predates-software "a re-implementation of that rule" bound-at=2026-08-24 -->
"""

BASE = {
    "corpus.yaml": DECL,
    "sources.yaml": SOURCES,
    "normalized/pacioli-1494-geijsbeek.md": NORMALIZED,
    "atoms/kwg-001.md": ATOM1,
    "atoms/kwg-002.md": ATOM2,
    "claims/double-entry-rule-stated-1494.md": CLAIM_OBS,
    "claims/ledger-discipline-predates-software.md": CLAIM_ARG,
    "surveys/granted-flag-uses-2026-08-22.md": SURVEY,
    "narratives/why-the-ledger-came-first.md": NARRATIVE,
}


def write(root, files, binary=None):
    if os.path.isdir(root):
        shutil.rmtree(root)
    for rel, content in files.items():
        p = os.path.join(root, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8", newline="") as fh:
            fh.write(content)
    for rel, blob in (binary or {}).items():
        p = os.path.join(root, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "wb") as fh:
            fh.write(blob)


def variant(**edits):
    """A copy of BASE with files replaced, added (str) or removed (None)."""
    f = dict(BASE)
    for k, v in edits.items():
        rel = k.replace("__", "/").replace("_DOT_", ".")
        if v is None:
            f.pop(rel, None)
        else:
            f[rel] = v
    return f


def sub(path, old, new, files=None):
    f = dict(files or BASE)
    assert old in f[path], f"pattern not found in {path}: {old!r}"
    f[path] = f[path].replace(old, new)
    return f


# --------------------------------------------------------------- the cases
# name -> (requirement id, one-line description, files, binary files)
CASES = {}


def case(name, req, desc, files, binary=None):
    CASES[name] = (req, desc, files, binary or {})


case("nc-ERF-3-third-top-level-key", "ERF-3",
     "The source list's top level carries a third key beside `type` and `sources`.",
     sub("sources.yaml", "type: sources\n", "type: sources\nversion: 2\n"))

case("nc-ERF-4-source-not-in-list", "ERF-4",
     "An atom names a source id that is not in the source list.",
     sub("atoms/kwg-001.md", "source: pacioli-1494-geijsbeek",
         "source: pacioli-1494-brown"))

case("nc-ERF-5-absence-without-reason", "ERF-5",
     "A source with an absence status carries no `reason`.",
     sub("sources.yaml",
         '    status: not-redistributable\n    reason: "Copyright permits reading but not republication; the report is\n      held offline and quoted findings cannot be re-checked from this corpus."\n',
         "    status: not-redistributable\n"))

case("nc-ERF-6-quote-not-verbatim", "ERF-6",
     "The quote is a paraphrase: 'must' where the source says 'have to'.",
     sub("atoms/kwg-001.md",
         "All entries made in the ledger have to be double entries",
         "All entries made in the ledger must be double entries"))

case("nc-ERF-52-all-spans-empty", "ERF-52",
     "The quote is nothing but an elision marker, so every span is empty.",
     sub("atoms/kwg-001.md",
         'quote: "All entries made in the ledger have to be double entries -- that is,\n  if you make one creditor, you must make some one debtor."',
         'quote: "[...]"'))

case("nc-ERF-52-spans-out-of-order", "ERF-52",
     "The two spans of an elided quote occur in the text, but in the wrong order.",
     sub("atoms/kwg-002.md",
         'quote: "The balance of the ledger is a sheet folded lengthwise [...] on the\n  left all the debtors."',
         'quote: "on the left all the debtors [...] The balance of the ledger is a sheet"'))

case("nc-ERF-7-url-in-citation-text", "ERF-7",
     "`citation_text` carries a URL; a citation identifies a work, a locator retrieves a copy.",
     sub("sources.yaml",
         '(Venice, 1494), ch. 36, trans. Geijsbeek 1914"',
         '(Venice, 1494), ch. 36, https://archive.org/details/ancientdoubleent00geijuoft"'))

case("nc-ERF-9-quality-outside-set", "ERF-9",
     "`source_quality` is `unknown`, which is outside the closed set.",
     sub("atoms/kwg-001.md", "source_quality: high", "source_quality: unknown"))

case("nc-ERF-12-verdict-records-a-failure", "ERF-12",
     "An audit entry records FAILED as a verdict; ERF-12 says a failed audit is an audit that did not happen.",
     sub("atoms/kwg-001.md", "verdict: SUPPORTED", "verdict: FAILED"))

case("nc-ERF-17-undeclared-corpus", "ERF-17",
     "A claim's `corpus` names a corpus no declaration declares.",
     sub("claims/double-entry-rule-stated-1494.md",
         "corpus: knowledge-work-governance", "corpus: some-other-corpus"))

case("nc-ERF-19-standing-bare-date", "ERF-19",
     "A standing entry's timestamp is a bare date; ERF-19 requires a full instant with an offset.",
     sub("claims/double-entry-rule-stated-1494.md",
         'timestamp: "2026-08-23T14:02:00Z"', 'timestamp: "2026-08-23"'))

case("nc-ERF-19-standing-no-offset", "ERF-19",
     "A standing entry's timestamp carries a time but no offset.",
     sub("claims/double-entry-rule-stated-1494.md",
         'timestamp: "2026-08-23T14:02:00Z"', 'timestamp: "2026-08-23T14:02:00"'))

case("nc-ERF-21-standing-by-machine", "ERF-21",
     "A standing is taken by an agent actor; only a person takes a stance.",
     sub("claims/double-entry-rule-stated-1494.md",
         'by: "human:francois"', 'by: "agent/claude-fable-5"'))

case("nc-ERF-22-stored-state-field", "ERF-22",
     "A claim stores a `disposition` field; the disposition is computed, never stored.",
     sub("claims/double-entry-rule-stated-1494.md",
         "families: [prior-art]", "families: [prior-art]\ndisposition: active"))

case("nc-ERF-31-binding-missing-bound-at", "ERF-31",
     "A narrative binding omits `bound-at`; it MUST be reported, never skipped.",
     sub("narratives/why-the-ledger-came-first.md",
         '"stated in the imperative rather than as advice" bound-at=2026-08-24',
         '"stated in the imperative rather than as advice"'))

case("nc-ERF-33-binding-comma-separated-ids", "ERF-33",
     "Ids are comma-separated. ERF-31's PROSE forbids commas but its GRAMMAR admits one inside an id, so the binding parses and the trailing comma makes the id resolve to nothing. The reported violation is ERF-33, not ERF-31.",
     sub("narratives/why-the-ledger-came-first.md",
         "claims: double-entry-rule-stated-1494 \"stated",
         "claims: double-entry-rule-stated-1494, ledger-discipline-predates-software \"stated"))

case("nc-ERF-33-binding-names-nothing", "ERF-33",
     "A narrative binding names a claim id that resolves to no record.",
     sub("narratives/why-the-ledger-came-first.md",
         "claims: ledger-discipline-predates-software",
         "claims: a-claim-that-does-not-exist"))

case("nc-ERF-35-atoms-for-dangling", "ERF-35",
     "`atoms_for` names an atom that does not exist in the deployment.",
     sub("claims/double-entry-rule-stated-1494.md",
         "atoms_for: [kwg-001, kwg-002]\nstandings:",
         "atoms_for: [kwg-001, kwg-999]\nstandings:"))

case("nc-ERF-38-duplicate-id-across-types", "ERF-38",
     "An atom and a claim hold the same id; ids are unique regardless of record type.",
     sub("claims/ledger-discipline-predates-software.md",
         "id: ledger-discipline-predates-software", "id: kwg-001"))

case("nc-ERF-39-empty-why", "ERF-39",
     "A standing entry's `why` is present but empty; an entry without a reason is a toggle.",
     sub("claims/double-entry-rule-stated-1494.md",
         'why: "Pacioli\'s own text states the rule in the imperative; the atoms quote\n      it directly and the normalized text is held in this corpus."',
         'why: ""'))

case("nc-ERF-43-assumes-cycle", "ERF-43",
     "Two claims assume each other; `assumes` MUST admit no cycles.",
     sub("claims/double-entry-rule-stated-1494.md",
         "families: [prior-art]",
         "families: [prior-art]\nedges:\n  - {to: ledger-discipline-predates-software, relation: assumes}"))

case("nc-ERF-43-self-edge", "ERF-43",
     "A claim carries an edge to itself.",
     sub("claims/ledger-discipline-predates-software.md",
         "  - {to: double-entry-rule-stated-1494, relation: assumes}",
         "  - {to: ledger-discipline-predates-software, relation: supports}"))

case("nc-ERF-44-conflict-stored-twice", "ERF-44",
     "`conflicts-with` is stored on both members of the pair.",
     sub("claims/double-entry-rule-stated-1494.md",
         "families: [prior-art]",
         "families: [prior-art]\nedges:\n  - {to: ledger-discipline-predates-software, relation: conflicts-with}",
         sub("claims/ledger-discipline-predates-software.md",
             "  - {to: double-entry-rule-stated-1494, relation: assumes}",
             "  - {to: double-entry-rule-stated-1494, relation: assumes}\n  - {to: double-entry-rule-stated-1494, relation: conflicts-with}")))

case("nc-ERF-48-modified-before-created", "ERF-48",
     "`last_modified` is earlier than `created`.",
     sub("atoms/kwg-001.md",
         'created: {timestamp: "2026-07-19", by: "agent/claude-fable-5"}',
         'created: {timestamp: "2026-07-19", by: "agent/claude-fable-5"}\nlast_modified: {timestamp: "2026-07-01", by: "human:francois"}'))

case("nc-ERF-54-two-declarations", "ERF-54",
     "Two files carry `type: corpus`; a corpus that declares itself twice cannot say which governs.",
     variant(**{"second_DOT_yaml": DECL.replace("id: knowledge-work-governance",
                                                "id: knowledge-work-governance-two")}))

case("nc-ERF-55-empty-list-written", "ERF-55",
     "An empty list is written out rather than omitted.",
     sub("claims/double-entry-rule-stated-1494.md",
         "families: [prior-art]", "families: [prior-art]\natoms_against: []"))

case("nc-ERF-55-unknown-field", "ERF-55",
     "A record carries a field the declared spec_version does not define and which is not under the `x_` prefix.",
     sub("atoms/kwg-001.md", "source_quality: high",
         "source_quality: high\nconfidence: 0.8"))

case("nc-ERF-58-wrong-event-time-key", "ERF-58",
     "A stamp uses `date` instead of `timestamp`.",
     sub("atoms/kwg-002.md",
         'created: {timestamp: "2026-07-19", by: "agent/claude-fable-5"}',
         'created: {date: "2026-07-19", by: "agent/claude-fable-5"}'))

case("nc-ERF-61-not-semver", "ERF-61",
     "`spec_version` is not a Semantic Versioning 2.0.0 string.",
     sub("corpus.yaml", 'spec_version: "0.9.0"', 'spec_version: "0.9"'))

case("nc-ERF-65-bare-year-resolves-to-number", "ERF-65",
     "`as_of_date` is an unquoted year, which ERF-14 permits and ERF-65's mandated JSON schema resolves to a number.",
     sub("atoms/kwg-001.md", 'as_of_date: "1494"', "as_of_date: 1494"))

case("nc-ERF-65-hits-reported-number", "ERF-65",
     "`hits_reported` is an unquoted 0, which ERF-27 says must be text.",
     sub("surveys/granted-flag-uses-2026-08-22.md", 'hits_reported: "0"', "hits_reported: 0"))

case("nc-ERF-66-duplicate-key", "ERF-66",
     "Frontmatter carries a duplicate key; YAML leaves a processor's response at its discretion.",
     sub("atoms/kwg-001.md", "source_quality: high",
         "source_quality: high\nsource_quality: low"))

case("nc-ERF-66-anchor-and-alias", "ERF-66",
     "Frontmatter defines a YAML anchor and uses an alias.",
     sub("claims/double-entry-rule-stated-1494.md",
         'created: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}',
         'created: &mint {timestamp: "2026-08-22", by: "agent/claude-fable-5"}\nlast_modified: *mint'))

case("nc-ERF-68-shipped-without-licence", "ERF-68",
     "A source ships its normalized text under status `shipped` and names no licence.",
     sub("sources.yaml", "status: shipped-as-quotation", "status: shipped"))

case("nc-ERF-53-atom-with-a-body", "ERF-53",
     "An atom's file carries a body; an atom's file is frontmatter and nothing else.",
     sub("atoms/kwg-001.md", "---\n" + "" , "---\n", ) )
CASES["nc-ERF-53-atom-with-a-body"] = (
    "ERF-53",
    "An atom's file carries a body; an atom's file is frontmatter and nothing else.",
    sub("atoms/kwg-001.md",
        "     protocol: finding-audit-v2}\n---\n",
        "     protocol: finding-audit-v2}\n---\n\nSome working notes an atom is not allowed to have.\n"),
    {})

case("nc-ERF-15-reference-encodes-location", "ERF-15",
     "A reference is a path rather than a bare id.",
     sub("claims/double-entry-rule-stated-1494.md",
         "atoms_for: [kwg-001, kwg-002]", "atoms_for: [atoms/kwg-001.md, kwg-002]"))

case("nc-ERF-26-tool-is-a-category", "ERF-26",
     "A search act's `tool` is empty; ERF-26 requires the concrete instrument named.",
     sub("surveys/granted-flag-uses-2026-08-22.md",
         'tool: "grep -rnE (BSD grep, macOS)"', 'tool: ""'))

# ERF-67 needs real bytes, so it is built from the binary channel.
_crlf_files = dict(BASE)
del _crlf_files["atoms/kwg-001.md"]
case("nc-ERF-67-crlf-line-endings", "ERF-67",
     "A record file uses CRLF line endings and opens with a byte-order mark.",
     _crlf_files,
     {"atoms/kwg-001.md": b"\xef\xbb\xbf" + ATOM1.replace("\n", "\r\n").encode("utf-8")})

# ---------------------------------------------------------- flagging (conforms)
FLAG_CASES = {}


def flagcase(name, req, desc, files):
    FLAG_CASES[name] = (req, desc, files, {})


flagcase("fl-ERF-31-anchor-does-not-occur", "ERF-31",
         "The prose was edited so the anchor no longer occurs in its passage. A FLAG, not a violation: editing prose is an act the format permits.",
         sub("narratives/why-the-ledger-came-first.md",
             "stated in the imperative rather than as advice.",
             "written as a command, not as advice."))

flagcase("fl-ERF-32-stale-binding", "ERF-32",
         "A bound claim carries a `last_modified` later than the binding's bound-at.",
         sub("claims/double-entry-rule-stated-1494.md",
             'created: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}',
             'created: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}\nlast_modified: {timestamp: "2026-08-25", by: "human:francois"}'))

flagcase("fl-ERF-49-unbacked-observation", "ERF-49",
         "An observation someone stands on with empty atoms_for and empty surveys.",
         sub("claims/double-entry-rule-stated-1494.md",
             "atoms_for: [kwg-001, kwg-002]\nstandings:", "standings:"))

flagcase("fl-ERF-43-retired-leaf", "ERF-43",
         "The argument's premise closure terminates in a leaf whose computed disposition is `retired`.",
         sub("claims/double-entry-rule-stated-1494.md",
             "    stance: for\n", "    stance: withdrawn\n"))

flagcase("fl-ERF-35-evidence-at-stance-dangling", "ERF-35",
         "`evidence_at_stance` names an atom that no longer exists. A past-state reference: flagged, never a violation.",
         sub("claims/double-entry-rule-stated-1494.md",
             "      atoms_for: [kwg-001, kwg-002]",
             "      atoms_for: [kwg-001, kwg-404]"))

flagcase("fl-ERF-20-evidence-at-stance-present-and-empty", "ERF-20/ERF-55",
         "`evidence_at_stance` is present and EMPTY: the ruler stamped, and faced no evidence. This is a different fact from an absent stamp and erfval must say which it saw.",
         sub("claims/double-entry-rule-stated-1494.md",
             "    evidence_at_stance:\n      atoms_for: [kwg-001, kwg-002]",
             "    evidence_at_stance: {}"))

flagcase("fl-ERF-20-evidence-at-stance-absent", "ERF-20/ERF-55",
         "`evidence_at_stance` is ABSENT: the ruler stamped nothing. Compare with the previous case; the two MUST be distinguishable in the output.",
         sub("claims/double-entry-rule-stated-1494.md",
             "    evidence_at_stance:\n      atoms_for: [kwg-001, kwg-002]\n", ""))

flagcase("fl-ERF-72-extension-field", "ERF-72",
         "A record carries an `x_` extension field, which a validator MUST NOT report as an unknown-field violation.",
         sub("atoms/kwg-001.md", "source_quality: high",
             "source_quality: high\nx_confidence: \"0.8\""))

# ------------------------------------------------------------------- emit

def main():
    write(os.path.join(HERE, "conforming"), BASE)

    lines = ["# Test corpora", "",
             "Authored from `SPEC-as-tried.md` alone. Regenerate with `python3 tests/make-tests.py`.",
             "",
             "## conforming/", "",
             "Intended to produce zero violations. `erfval tests/conforming` exits 0.",
             "", "## nonconforming/", "",
             "One deliberate defect each. The directory name states the requirement id.",
             "", "| corpus | requirement | defect |", "|:--|:--|:--|"]

    for name in sorted(CASES):
        req, desc, files, binary = CASES[name]
        write(os.path.join(HERE, "nonconforming", name), files, binary)
        lines.append("| `%s` | %s | %s |" % (name, req, desc))

    lines += ["", "## flagging/", "",
              "Corpora that should produce FLAGS and no violations. Section 2: \"a corpus",
              "carrying flags and no violations conforms\". `erfval` exits 0 on all of these,",
              "and the flags must still be visible.",
              "", "| corpus | requirement | condition |", "|:--|:--|:--|"]
    for name in sorted(FLAG_CASES):
        req, desc, files, binary = FLAG_CASES[name]
        write(os.path.join(HERE, "flagging", name), files, binary)
        lines.append("| `%s` | %s | %s |" % (name, req, desc))

    with open(os.path.join(HERE, "README.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")

    print("wrote conforming/, %d nonconforming/, %d flagging/" % (len(CASES), len(FLAG_CASES)))


if __name__ == "__main__":
    main()
