#!/usr/bin/env python3
"""Author the test corpora from the specification.

One conforming corpus exercising every record type, then one non-conforming
corpus per requirement, each a copy of the conforming one with exactly one
thing changed. The mutation table below is the statement of what each corpus
violates: read it beside SPEC.md and every entry should be obvious.

Run:  python3 tests/make-corpora.py
"""

import hashlib
import os
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "corpora")

# ---------------------------------------------------------------------------
# The two normalized texts everything quotes. ERF-1: the only thing checks run
# against. Written by hand here, which is what "authored, not converted at
# check time" means.
# ---------------------------------------------------------------------------

PACIOLI = """# Chapter 36, Of the ledger

All entries made in the ledger have to be double entries -- that is, if you
make one creditor, you must make some one debtor.

The books should be closed each year, especially in a partnership, so that
each partner may know what he has.
"""

LEDGER = """# Committee findings, March 2026

The plan was non-binding, and management did not recommend it.

Revenue fell 12.5 percent in the year to March, the second consecutive
decline.

The committee said it does not believe the tool is reliable.
"""

RAW_LEDGER = """<html><body>
<h1>Committee findings, March 2026</h1>
<p>The plan was non-binding, and management did not recommend it.</p>
<p>Revenue fell 12.5 percent in the year to March, the second consecutive
decline.</p>
<p>The committee said it does not believe the tool is reliable.</p>
</body></html>
"""


def sha(b):
    return "sha256:" + hashlib.sha256(b.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# The conforming corpus
# ---------------------------------------------------------------------------

def base_files():
    f = {}

    f["normalized/pacioli-1494-geijsbeek.md"] = PACIOLI
    f["normalized/ledger-committee-2026.md"] = LEDGER
    f["raw/ledger-committee-2026.html"] = RAW_LEDGER

    # ERF-3 to ERF-8, ERF-68 to ERF-71. A bare YAML document with no body.
    f["sources.yaml"] = f"""type: sources
sources:
  pacioli-1494-geijsbeek:
    citation_text: "Luca Pacioli, Particularis de Computis et Scripturis
      (Venice, 1494), ch. 36, trans. Geijsbeek 1914"
    citation:
      type: book
      author: [{{family: "Pacioli", given: "Luca"}}]
      title: "Particularis de Computis et Scripturis"
      publisher-place: "Venice"
      issued: 1494
      chapter-number: 36
      translator: [{{family: "Geijsbeek", given: "John B."}}]
    received:
      url: "https://archive.example/ancientdoubleent00geijuoft.pdf"
      digest: "{sha(PACIOLI)}"
      timestamp: "2026-08-23"
    status: "shipped-as-quotation"
    normalized: "normalized/pacioli-1494-geijsbeek.md"
    normalized_digest: "{sha(PACIOLI)}"
    extraction: "pymupdf4llm 0.3.4"
    normalization: "pandoc 3.1.11 --wrap=none"
    excerpt: {{timestamp: "2026-08-23", by: "agent/claude-sonnet-5"}}
  ledger-committee-2026:
    citation_text: "Audit Committee, Findings on the Ledger Programme
      (Committee report, 2026), sec. 4"
    citation:
      type: report
      author: [{{family: "Committee", given: "Audit"}}]
      title: "Findings on the Ledger Programme"
      issued: 2026
    received:
      url: "https://example.org/committee/findings-2026.html"
      path: "raw/ledger-committee-2026.html"
      digest: "{sha(RAW_LEDGER)}"
      timestamp: "2026-08-24"
    status: "shipped"
    normalized: "normalized/ledger-committee-2026.md"
    normalized_digest: "{sha(LEDGER)}"
    licence: "CC-BY-4.0"
    licence_name: "Creative Commons Attribution 4.0 International"
    extraction: "pandoc 3.1.11 -f html -t commonmark"
    excerpt: {{timestamp: "2026-08-24", by: "human:fb"}}
  vendor-briefing-2026:
    citation_text: "Vendor Ltd, Briefing to Customers (private briefing, 2026)"
    status: "not-redistributable"
    reason: "Copyright permits reading and not republication; the quotation
      route of ERF-69 stays open but no text is held here."
"""

    # ERF-59. Exactly one declaration.
    f["corpus.yaml"] = """type: corpus
id: "ledger-governance"
title: "Ledger governance: how books get checked"
spec_version: "0.9.0"
classification: "public"
owner: "human:fb"
"""

    # --- atoms (4.2) -------------------------------------------------------
    f["atoms/lg-001.md"] = """---
id: "lg-001"
type: "atom"
corpus: "ledger-governance"
finding: "Pacioli's 1494 treatise states the double-entry rule explicitly:
  every ledger entry is made twice, once as a debit and once as a credit."
quote: "All entries made in the ledger have to be double entries -- that is,
  if you make one creditor, you must make some one debtor."
source: "pacioli-1494-geijsbeek"
source_quality: "high"
as_of_date: "1494"
created: {timestamp: "2026-07-19", by: "agent/claude-fable-5"}
finding_audit:
  - {auditor: "deepseek-v4-pro", verdict: "SUPPORTED", timestamp: "2026-07-19",
     protocol: "finding-audit-v2"}
  - {auditor: "gemini-3.5-flash", verdict: "SUPPORTED", timestamp: "2026-07-19",
     protocol: "finding-audit-v2"}
---
"""

    # An elided quote, ERF-52's one wildcard used as intended.
    f["atoms/lg-002.md"] = """---
id: "lg-002"
type: "atom"
corpus: "ledger-governance"
finding: "The same treatise states that books are closed annually, and gives
  partnership accounting as the reason it matters."
quote: "The books should be closed each year [...] so that each partner may
  know what he has."
source: "pacioli-1494-geijsbeek"
source_quality: "high"
as_of_date: "1494"
created: {timestamp: "2026-07-19", by: "agent/claude-fable-5"}
---
"""

    f["atoms/lg-003.md"] = """---
id: "lg-003"
type: "atom"
corpus: "ledger-governance"
finding: "The 2026 audit committee reports that the plan carried no binding
  force and that management declined to recommend it."
quote: "The plan was non-binding, and management did not recommend it."
source: "ledger-committee-2026"
source_quality: "medium"
as_of_date: "2026-03"
limitations: "The committee reports management's position rather than
  recording management's own words, so this is a one-hop relay."
created: {timestamp: "2026-08-24", by: "agent/claude-fable-5"}
finding_audit:
  - {auditor: "deepseek-v4-pro", verdict: "PARTIAL", timestamp: "2026-08-24",
     protocol: "finding-audit-v2"}
---
"""

    # A quote against a source whose text is withheld: the check is unavailable
    # and is named, not guessed at.
    f["atoms/lg-004.md"] = """---
id: "lg-004"
type: "atom"
corpus: "ledger-governance"
finding: "The vendor's own briefing states that its reconciliation step is
  manual, which is the vendor speaking about its own product."
quote: "Reconciliation remains a manual step in the current release."
source: "vendor-briefing-2026"
source_quality: "medium"
limitations: "A vendor's claim about its own product: a first party with an
  interest in the answer."
created: {timestamp: "2026-08-24", by: "agent/claude-fable-5"}
---
"""

    # --- claims (4.3) ------------------------------------------------------
    f["claims/double-entry-rule-is-1494.md"] = """---
id: "double-entry-rule-is-1494"
type: "claim"
corpus: "ledger-governance"
title: "The double-entry rule was stated explicitly in print by 1494"
short_name: "1494 rule"
epistemic_kind: "observation"
families: ["prior-art"]
semantic_query: "double entry bookkeeping debit credit earliest printed
  treatise Pacioli Venice"
atoms_for: ["lg-001", "lg-002"]
created: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}
standings:
  - timestamp: "2026-08-22T14:05:00-05:00"
    stance: "for"
    by: "human:fb"
    why: "Two atoms quote the treatise directly and both were audited
      SUPPORTED; nothing on record cuts the other way."
    evidence_at_stance: {atoms_for: ["lg-001", "lg-002"]}
evidence_audit:
  - {auditor: "deepseek-v4-pro", verdict: "SUPPORTED", timestamp: "2026-08-22",
     protocol: "backing-audit-v1"}
---
The double-entry rule was stated explicitly in print by 1494

## Working notes

Both atoms come from one source, so the claim rests on one work read
directly. A second independent printing would strengthen it.
"""

    f["claims/annual-close-is-the-control.md"] = """---
id: "annual-close-is-the-control"
type: "claim"
corpus: "ledger-governance"
title: "The annual close is the control the ledger discipline actually rests on"
epistemic_kind: "argument"
edges:
  - {to: "double-entry-rule-is-1494", relation: "assumes"}
created: {timestamp: "2026-08-23", by: "agent/claude-fable-5"}
standings:
  - timestamp: "2026-08-23T09:00:00-05:00"
    stance: "for"
    by: "human:fb"
    why: "Granting that the rule is old and stated, the close is where the
      rule is tested against the world; the argument follows."
    evidence_at_stance: {atoms_for: ["lg-002"]}
  - timestamp: "2026-08-23T16:30:00-05:00"
    stance: "against"
    by: "human:mk"
    why: "The close tests arithmetic, not judgment; the control is the
      partner's reading, which the close only occasions."
    evidence_at_stance: {atoms_for: ["lg-002"]}
---
The annual close is the control the ledger discipline actually rests on

## Working notes

Two people stand on opposite sides, so this reads contested. That is the
terminal reading, not a problem to resolve.
"""

    f["claims/no-tool-checks-narrative-drift.md"] = """---
id: "no-tool-checks-narrative-drift"
type: "claim"
corpus: "ledger-governance"
title: "No shipped tool checks prose against the claims the prose rests on"
epistemic_kind: "observation"
surveys: ["drift-check-tools-2026-08-22"]
created: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}
standings:
  - timestamp: "2026-08-22T18:00:00-05:00"
    stance: "for"
    by: "human:fb"
    why: "Supported as scoped: the survey covers the package indexes named in
      it, and the claim takes no more than that coverage carries."
    evidence_at_stance: {}
---
No shipped tool checks prose against the claims the prose rests on

## Working notes

A universal negative, so it is audited as scoped and cites the survey rather
than atoms; atoms can only quote what exists.
"""

    f["claims/market-will-adopt-record-formats.md"] = """---
id: "market-will-adopt-record-formats"
type: "claim"
corpus: "ledger-governance"
title: "Structured evidence records will be common practice in consulting
  within five years"
epistemic_kind: "bet"
edges:
  - {to: "annual-close-is-the-control", relation: "conflicts-with"}
created: {timestamp: "2026-08-23", by: "agent/claude-fable-5"}
standings:
  - timestamp: "2026-08-23T10:00:00-05:00"
    stance: "for"
    by: "human:fb"
    why: "Relied on when planning the practice: the tooling is cheap enough
      that the first mover advantage is small and adoption is likely."
    evidence_at_stance: {}
  - timestamp: "2026-08-25T11:15:00-05:00"
    stance: "withdrawn"
    by: "human:fb"
    why: "Outcome: two of the three vendors watched shipped nothing of the
      kind, and the bet no longer guides any decision. Exit, not opposition."
    evidence_at_stance: {}
---
Structured evidence records will be common practice in consulting within five
years

## Working notes

Withdrawn, so this reads retired. Retired is not "shown false"; the why says
which kind of withdrawal it was.
"""

    # `rejected`: every current holder judges it false. Also the corpus's one
    # `supports` edge, which is a premise arriving from the other side (ERF-24),
    # and its one `decomposes-into`, which is structure and never a premise.
    f["claims/partners-read-the-close.md"] = """---
id: "partners-read-the-close"
type: "claim"
corpus: "ledger-governance"
title: "A partnership's annual close is read by the partners, not only filed"
epistemic_kind: "observation"
atoms_for: ["lg-002"]
edges:
  - {to: "annual-close-is-the-control", relation: "supports"}
created: {timestamp: "2026-08-23", by: "agent/claude-fable-5"}
standings:
  - timestamp: "2026-08-23T08:00:00-05:00"
    stance: "for"
    by: "human:mk"
    why: "The treatise gives partnership accounting as the reason for the
      annual close, which only makes sense if a partner reads it."
    evidence_at_stance: {atoms_for: ["lg-002"]}
---
A partnership's annual close is read by the partners, not only filed

## Working notes

This claim carries a `supports` edge, so it is a premise of the argument it
points at even though the argument records no `assumes` edge back.
"""

    f["claims/reconciliation-is-manual-everywhere.md"] = """---
id: "reconciliation-is-manual-everywhere"
type: "claim"
corpus: "ledger-governance"
title: "Reconciliation is a manual step in every shipping ledger product"
epistemic_kind: "observation"
atoms_for: ["lg-004"]
edges:
  - {to: "partners-read-the-close", relation: "decomposes-into"}
created: {timestamp: "2026-08-24", by: "agent/claude-fable-5"}
standings:
  - timestamp: "2026-08-24T12:00:00-05:00"
    stance: "against"
    by: "human:fb"
    why: "One vendor's own briefing about one release is nowhere near every
      shipping product; the atom does not carry the word every."
    evidence_at_stance: {atoms_for: ["lg-004"]}
  - timestamp: "2026-08-25T09:30:00-05:00"
    stance: "against"
    by: "human:mk"
    why: "Agreed, and two products I have used reconcile automatically, so
      the statement is false as written rather than merely unbacked."
    evidence_at_stance: {atoms_for: ["lg-004"]}
---
Reconciliation is a manual step in every shipping ledger product

## Working notes

Every current holder judges this false, which is what `rejected` means. It is
not a deletion and the claim keeps its identity.
"""

    f["claims/we-record-every-stance.md"] = """---
id: "we-record-every-stance"
type: "claim"
corpus: "ledger-governance"
title: "Every stance taken in this corpus is recorded with its reason at the
  time it is taken"
epistemic_kind: "commitment"
created: {timestamp: "2026-08-24", by: "human:fb"}
---
Every stance taken in this corpus is recorded with its reason at the time it
is taken

## Working notes

Chosen conduct, so the author's decision is the backing. Nobody has stood on
it yet, which makes it a proposal.
"""

    # --- surveys (4.5) -----------------------------------------------------
    f["surveys/drift-check-tools-2026-08-22.md"] = """---
id: "drift-check-tools-2026-08-22"
type: "survey"
corpus: "ledger-governance"
title: "Tools that check prose against the claims it rests on"
conducted: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}
searches:
  - tool: "npm search (npm CLI 10.8.2)"
    query: "narrative drift claim binding prose check"
    scope: "the public npm registry"
    hits_reported: "0"
  - tool: "PyPI simple index via pip download --no-deps (pip 24.2)"
    query: "claim-binding OR narrative-anchor OR prose-drift"
    scope: "the public Python package index"
    hits_reported: "3 packages, none a drift checker"
notable_results:
  - what: "prose-lint, a style checker"
    note: "Checks the prose against a style guide and never against an
      external record; the nearest live relative, not an instance."
---
Tools that check prose against the claims it rests on.

The two indexes searched are package registries, not the world: an absence
here says something about what is packaged and distributed, not about what
exists inside firms. Coverage bounds: no search of private tooling, no search
of research prototypes, and hits were inspected only as far as each package's
own description.
"""

    f["surveys/drift-check-tools-2026-08-25.md"] = """---
id: "drift-check-tools-2026-08-25"
type: "survey"
corpus: "ledger-governance"
title: "Tools that check prose against the claims it rests on, re-run"
conducted: {timestamp: "2026-08-25", by: "agent/claude-fable-5"}
prior_survey: "drift-check-tools-2026-08-22"
searches:
  - tool: "npm search (npm CLI 10.8.2)"
    query: "narrative drift claim binding prose check"
    scope: "the public npm registry"
    hits_reported: "0"
---
The same sought, three days later. A search already run cannot have run
differently, so this is a new record rather than an edit to the last one.
"""

    # --- narrative (4.6) ---------------------------------------------------
    f["narratives/why-the-close-matters.md"] = """---
type: "narrative"
title: "Why the close matters"
corpus: "ledger-governance"
created: {timestamp: "2026-08-24", by: "human:fb"}
---
The rule itself is not new. It was in print, stated plainly, before the
sixteenth century began, and every ledger discipline since has been a
restatement of it rather than a discovery.

<!-- claims: double-entry-rule-is-1494 "It was in print, stated plainly" bound-at=2026-08-24 -->

What is new is the checking. Nothing on the market reads a paragraph and
tells you which of your own commitments it leans on, which is why the prose
and the thinking underneath it drift apart quietly.

<!-- claims: no-tool-checks-narrative-drift annual-close-is-the-control
     "Nothing on the market reads a paragraph" bound-at=2026-08-24 -->
"""
    return f


def write(path, files):
    if os.path.exists(path):
        shutil.rmtree(path)
    for rel, content in files.items():
        full = os.path.join(path, rel)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(content)


def edit(files, rel, old, new, count=1):
    assert rel in files, rel
    assert old in files[rel], f"{rel}: {old!r} not found"
    files[rel] = files[rel].replace(old, new, count)
    return files


# ---------------------------------------------------------------------------
# The non-conforming corpora: one requirement each.
# ---------------------------------------------------------------------------

def mutations():
    m = {}

    def mut(name, fn):
        m[name] = fn

    # ERF-1: a shipped source whose normalized text is not there.
    def erf1(f):
        del f["normalized/ledger-committee-2026.md"]
        return f
    mut("bad-erf1-normalized-text-absent", erf1)

    # ERF-2: a web locator with no `received.timestamp`.
    mut("bad-erf2-no-received-timestamp", lambda f: edit(
        f, "sources.yaml",
        '      timestamp: "2026-08-24"\n    status: "shipped"',
        '    status: "shipped"'))

    # ERF-3: one source id in two source lists.
    def erf3(f):
        f["sources-extra.yaml"] = (
            'type: sources\nsources:\n'
            '  pacioli-1494-geijsbeek:\n'
            '    citation_text: "A second entry for one work"\n'
            '    status: "licence-unverified"\n'
            '    reason: "Rights could not be established."\n')
        return f
    mut("bad-erf3-source-id-in-two-lists", erf3)

    # ERF-4: an atom naming a source the list does not hold.
    mut("bad-erf4-unknown-source", lambda f: edit(
        f, "atoms/lg-003.md",
        'source: "ledger-committee-2026"', 'source: "committee-report-2026"'))

    # ERF-5 (via the schema's conditional): an absence with no reason.
    mut("bad-erf5-absence-without-reason", lambda f: edit(
        f, "sources.yaml",
        '    reason: "Copyright permits reading and not republication; the quotation\n'
        '      route of ERF-69 stays open but no text is held here."\n', ''))

    # ERF-6 / ERF-52: an elision marker and nothing else.
    mut("bad-erf6-quote-is-only-an-elision", lambda f: edit(
        f, "atoms/lg-002.md",
        'quote: "The books should be closed each year [...] so that each partner may\n'
        '  know what he has."',
        'quote: "[...]"'))

    # ERF-7: a URL inside `citation_text`.
    mut("bad-erf7-url-in-citation-text", lambda f: edit(
        f, "sources.yaml",
        '(Committee report, 2026), sec. 4"',
        '(Committee report, 2026), https://example.org/committee/findings-2026.html"'))

    # ERF-12: a verdict off the vocabulary.
    mut("bad-erf12-verdict-off-vocabulary", lambda f: edit(
        f, "atoms/lg-003.md", 'verdict: "PARTIAL"', 'verdict: "INCONCLUSIVE"'))

    # ERF-15: a reference that encodes a location.
    mut("bad-erf15-reference-encodes-location", lambda f: edit(
        f, "claims/double-entry-rule-is-1494.md",
        'atoms_for: ["lg-001", "lg-002"]',
        'atoms_for: ["../atoms/lg-001.md", "lg-002"]'))

    # ERF-17: a record naming a corpus nobody declared.
    mut("bad-erf17-undeclared-corpus", lambda f: edit(
        f, "atoms/lg-001.md",
        'corpus: "ledger-governance"', 'corpus: "some-other-corpus"'))

    # ERF-19: a standing at bare-date precision.
    mut("bad-erf19-standing-is-a-bare-date", lambda f: edit(
        f, "claims/double-entry-rule-is-1494.md",
        'timestamp: "2026-08-22T14:05:00-05:00"', 'timestamp: "2026-08-22"'))

    # ERF-21 / ERF-39 / ERF-41: an LLM taking a stance.
    mut("bad-erf21-agent-takes-a-stance", lambda f: edit(
        f, "claims/double-entry-rule-is-1494.md",
        'by: "human:fb"\n    why: "Two atoms',
        'by: "agent/claude-fable-5"\n    why: "Two atoms'))

    # ERF-39: a standing with an empty `why`.
    mut("bad-erf39-standing-without-a-why", lambda f: edit(
        f, "claims/annual-close-is-the-control.md",
        'why: "The close tests arithmetic, not judgment; the control is the\n'
        '      partner\'s reading, which the close only occasions."',
        'why: ""'))

    # ERF-31 / ERF-33: a narrative binding naming nothing.
    mut("bad-erf31-binding-names-no-record", lambda f: edit(
        f, "narratives/why-the-close-matters.md",
        'claims: double-entry-rule-is-1494 "It was in print',
        'claims: the-rule-is-ancient "It was in print'))

    # YAMLB-1: a candidate that fails the grammar, which closes no passage.
    mut("bad-yamlb1-binding-fails-the-grammar", lambda f: edit(
        f, "narratives/why-the-close-matters.md",
        '<!-- claims: double-entry-rule-is-1494 "It was in print, stated plainly" bound-at=2026-08-24 -->',
        '<!-- claims: double-entry-rule-is-1494, annual-close-is-the-control "It was in print, stated plainly" -->'))

    # ERF-35: a field naming a record of the wrong type.
    mut("bad-erf35-reference-of-the-wrong-type", lambda f: edit(
        f, "claims/no-tool-checks-narrative-drift.md",
        'surveys: ["drift-check-tools-2026-08-22"]', 'surveys: ["lg-001"]'))

    # ERF-38 / ERF-36: two records, one id.
    def erf38(f):
        f["atoms/lg-005.md"] = f["atoms/lg-004.md"].replace(
            'id: "lg-004"', 'id: "lg-003"')
        return f
    mut("bad-erf38-duplicate-record-id", erf38)

    # ERF-41: a stance off the vocabulary.
    mut("bad-erf41-stance-off-vocabulary", lambda f: edit(
        f, "claims/market-will-adopt-record-formats.md",
        'stance: "withdrawn"', 'stance: "abstain"'))

    # ERF-43: a premise cycle, X assumes Y and Y supports X.
    mut("bad-erf43-premise-cycle", lambda f: edit(
        f, "claims/double-entry-rule-is-1494.md",
        'created: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}',
        'edges:\n  - {to: "annual-close-is-the-control", relation: "supports"}\n'
        'created: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}'))

    # ERF-43: a self-edge.
    mut("bad-erf43-self-edge", lambda f: edit(
        f, "claims/annual-close-is-the-control.md",
        '{to: "double-entry-rule-is-1494", relation: "assumes"}',
        '{to: "annual-close-is-the-control", relation: "assumes"}'))

    # ERF-43: a closure that ends at an argument with no premises.
    def erf43leaf(f):
        f["claims/reasoning-is-enough.md"] = """---
id: "reasoning-is-enough"
type: "claim"
corpus: "ledger-governance"
title: "Reasoning alone settles what a control is for"
epistemic_kind: "argument"
created: {timestamp: "2026-08-23", by: "agent/claude-fable-5"}
---
Reasoning alone settles what a control is for
"""
        return edit(f, "claims/annual-close-is-the-control.md",
                    '{to: "double-entry-rule-is-1494", relation: "assumes"}',
                    '{to: "reasoning-is-enough", relation: "assumes"}')
    mut("bad-erf43-closure-ends-at-an-argument", erf43leaf)

    # ERF-44: a conflict stored on both records.
    mut("bad-erf44-conflict-stored-twice", lambda f: edit(
        f, "claims/annual-close-is-the-control.md",
        'edges:\n  - {to: "double-entry-rule-is-1494", relation: "assumes"}',
        'edges:\n  - {to: "double-entry-rule-is-1494", relation: "assumes"}\n'
        '  - {to: "market-will-adopt-record-formats", relation: "conflicts-with"}'))

    # ERF-48: `last_modified` earlier than `created`.
    mut("bad-erf48-last-modified-before-created", lambda f: edit(
        f, "atoms/lg-003.md",
        'created: {timestamp: "2026-08-24", by: "agent/claude-fable-5"}',
        'created: {timestamp: "2026-08-24", by: "agent/claude-fable-5"}\n'
        'last_modified: {timestamp: "2026-08-20", by: "human:fb"}'))

    # ERF-52: a quote spliced across a paragraph boundary with no marker.
    mut("bad-erf52-splice-across-paragraphs", lambda f: edit(
        f, "atoms/lg-001.md",
        'quote: "All entries made in the ledger have to be double entries -- that is,\n'
        '  if you make one creditor, you must make some one debtor."',
        'quote: "you must make some one debtor. The books should be closed each\n'
        '  year"'))

    # ERF-52: a quote taking part of a hyphenated word.
    mut("bad-erf52-word-fragment", lambda f: edit(
        f, "atoms/lg-003.md",
        'quote: "The plan was non-binding, and management did not recommend it."',
        'quote: "binding, and management did not recommend it."'))

    # ERF-55: an empty list written out.
    mut("bad-erf55-empty-list-written", lambda f: edit(
        f, "claims/we-record-every-stance.md",
        'epistemic_kind: "commitment"',
        'epistemic_kind: "commitment"\natoms_for: []'))

    # ERF-55: a field the declared version does not define.
    mut("bad-erf55-undefined-field", lambda f: edit(
        f, "atoms/lg-001.md",
        'source_quality: "high"', 'source_quality: "high"\nconfidence: "0.9"'))

    # ERF-58: an event-time key that is not `timestamp`.
    mut("bad-erf58-event-time-key-renamed", lambda f: edit(
        f, "atoms/lg-004.md",
        'created: {timestamp: "2026-08-24", by: "agent/claude-fable-5"}',
        'created: {date: "2026-08-24", by: "agent/claude-fable-5"}'))

    # ERF-59: two declarations.
    def erf59(f):
        f["corpus-2.yaml"] = f["corpus.yaml"].replace(
            'id: "ledger-governance"', 'id: "ledger-governance-2"')
        return f
    mut("bad-erf59-two-declarations", erf59)

    # ERF-61 / ERF-60: a version that is not SemVer.
    mut("bad-erf61-spec-version-not-semver", lambda f: edit(
        f, "corpus.yaml", 'spec_version: "0.9.0"', 'spec_version: "0.9"'))

    # ERF-60: an unsupported MAJOR.
    mut("bad-erf60-unsupported-major", lambda f: edit(
        f, "corpus.yaml", 'spec_version: "0.9.0"', 'spec_version: "2.0.0"'))

    # ERF-65: a string-typed field that arrived as a number.
    mut("bad-erf65-bare-scalar-retyped", lambda f: edit(
        f, "atoms/lg-001.md", 'as_of_date: "1494"', 'as_of_date: 1494'))

    # ERF-65: `spec_version` unquoted, which arrives as a number.
    mut("bad-erf65-spec-version-unquoted", lambda f: edit(
        f, "corpus.yaml", 'spec_version: "0.9.0"', 'spec_version: 1.0'))

    # ERF-66: a duplicate key.
    mut("bad-erf66-duplicate-key", lambda f: edit(
        f, "atoms/lg-001.md",
        'source_quality: "high"', 'source_quality: "high"\nsource_quality: "low"'))

    # ERF-66: an anchor and an alias.
    mut("bad-erf66-anchor-and-alias", lambda f: edit(
        f, "atoms/lg-001.md",
        'created: {timestamp: "2026-07-19", by: "agent/claude-fable-5"}',
        'created: &c {timestamp: "2026-07-19", by: "agent/claude-fable-5"}\n'
        'last_modified: *c'))

    # ERF-67: CRLF line endings.
    mut("bad-erf67-crlf", lambda f: edit(
        f, "atoms/lg-004.md", "\n", "\r\n", count=-1))

    # ERF-71: a normalized_digest that does not match the bytes.
    mut("bad-erf71-digest-mismatch", lambda f: edit(
        f, "sources.yaml",
        f'    normalized_digest: "{sha(LEDGER)}"',
        '    normalized_digest: "sha256:' + "0" * 64 + '"'))

    # ERF-54: two files claiming to be the corpus is above; here, a body on an
    # atom, which the binding's section 1 gives no room for.
    def yamlb1s(f):
        f["atoms/lg-002.md"] += "Some prose the model gives an atom nowhere to put.\n"
        return f
    mut("bad-yamlb1s-atom-carries-a-body", yamlb1s)

    return m


def main():
    os.makedirs(OUT, exist_ok=True)
    write(os.path.join(OUT, "conforming"), base_files())
    n = 1
    for name, fn in mutations().items():
        files = fn(base_files())
        write(os.path.join(OUT, name), files)
        n += 1
    print(f"wrote {n} corpora to {OUT}")


if __name__ == "__main__":
    main()
