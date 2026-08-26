#!/usr/bin/env python3
"""Author the test corpora for erfval.

Everything here was written from SPEC-as-tried.md, SCHEMA-as-tried.json and
BINDING-as-tried.md. Digests are computed so the corpus is self-consistent;
nothing else is generated.

Run: python3 tests/build-corpora.py   (from the crate root)
"""
import hashlib
import os
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))


def write(path, text):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    return full


def sha(path):
    with open(os.path.join(ROOT, path), "rb") as f:
        return "sha256:" + hashlib.sha256(f.read()).hexdigest()


# ===========================================================================
# 1. The conforming corpus. Every record type, every disposition, every
#    epistemic kind, every relation, every source status.
# ===========================================================================

C = "conforming"
if os.path.isdir(os.path.join(ROOT, C)):
    shutil.rmtree(os.path.join(ROOT, C))

RAW_PACIOLI = """OF THE WAY TO DRAW UP THE TRIAL BALANCE OF THE LEDGER

Before we go further we must explain how the entries are to be balanced.

All entries made in the ledger have to be double entries -- that is, if you
make one creditor, you must make some one debtor. The trial balance must be
equal, that is, the debits must equal the credits, and if they do not the
book is wrong.

You must always take care to see that the debit side agrees with the credit
side, for otherwise there would be a mistake in your ledger.

Of this we shall speak more fully in the following chapter, which treats of
the closing of the books at the end of the year.
"""
write(f"{C}/raw/pacioli-1494-geijsbeek.txt", RAW_PACIOLI)

# The normalized text: an excerpt of the raw file, as markdown. It carries the
# quoted passages together with enough adjacent text for their place in the
# work to be legible (ERF-69).
NORM_PACIOLI = """## Of the way to draw up the trial balance of the ledger

Before we go further we must explain how the entries are to be balanced.

All entries made in the ledger have to be double entries -- that is, if you
make one creditor, you must make some one debtor. The trial balance must be
equal, that is, the debits must equal the credits, and if they do not the
book is wrong.

You must always take care to see that the **debit** side agrees with the
credit side, for otherwise there would be a mistake in your ledger.
"""
write(f"{C}/normalized/pacioli-1494-geijsbeek.md", NORM_PACIOLI)

NORM_NOTE = """# Why the ledger balances

A working note, written for this corpus and placed under CC0.

The parity of a ledger is not a property anyone asserts. It is a property a
machine recomputes: sum the debits, sum the credits, and compare. A
difference of one cent is as loud as a difference of a million, which is the
whole reason the control is worth running at all.

What the control cannot tell you is *which* entry is wrong. It tells you only
that one of them is, and that is a different and much smaller claim than the
one people usually make for it.
"""
write(f"{C}/normalized/bouet-2026-ledger-note.md", NORM_NOTE)

write(
    f"{C}/corpus.yaml",
    """type: corpus
id: ledger-discipline
title: "Ledger discipline: a worked corpus for the Epistemic Record Format"
spec_version: "0.9.0"
owner: "human:fb"
classification: "public"
""",
)

write(
    f"{C}/sources.yaml",
    f"""type: sources
sources:
  pacioli-1494-geijsbeek:
    citation_text: "Luca Pacioli, Particularis de Computis et Scripturis
      (Venice, 1494), ch. 36, trans. Geijsbeek 1914"
    citation:
      type: book
      author: [{{family: Pacioli, given: Luca}}]
      title: "Particularis de Computis et Scripturis"
      publisher-place: Venice
      issued: 1494
      chapter-number: 36
      translator: [{{family: Geijsbeek, given: "John B."}}]
    received:
      path: raw/pacioli-1494-geijsbeek.txt
      digest: "{sha(f'{C}/raw/pacioli-1494-geijsbeek.txt')}"
      timestamp: "2026-08-23"
    status: shipped-as-quotation
    normalized: normalized/pacioli-1494-geijsbeek.md
    normalized_digest: "{sha(f'{C}/normalized/pacioli-1494-geijsbeek.md')}"
    excerpt: {{timestamp: "2026-08-23", by: "human:fb"}}
  bouet-2026-ledger-note:
    citation_text: "Francois Bouet, Why the ledger balances (working note, 2026)"
    status: shipped
    licence: "CC0-1.0"
    licence_name: "Creative Commons Zero v1.0 Universal"
    normalized: normalized/bouet-2026-ledger-note.md
    normalized_digest: "{sha(f'{C}/normalized/bouet-2026-ledger-note.md')}"
  acme-2026-reconciliation-whitepaper:
    citation_text: "Acme Ledger Systems, Reconciliation at Scale
      (vendor white paper, 2026)"
    status: not-redistributable
    reason: "Copyright permits reading and not republication; the quotation
      route of ERF-69 stays open, and this corpus has not taken it."
""",
)

# --- atoms ---------------------------------------------------------------

write(
    f"{C}/atoms/led-001.md",
    """---
id: led-001
type: atom
corpus: ledger-discipline
finding: "Pacioli's 1494 treatise states the double-entry rule explicitly:
  every ledger entry is made twice, once as a debit and once as a credit."
quote: "All entries made in the ledger have to be double entries -- that is,
  if you make one creditor, you must make some one debtor."
source: pacioli-1494-geijsbeek
source_quality: high
as_of_date: "1494"
created: {timestamp: "2026-08-19", by: "human:fb"}
finding_audit:
  - {auditor: deepseek-v4-pro, verdict: SUPPORTED, timestamp: "2026-08-19",
     protocol: finding-audit-v2}
  - {auditor: gemini-3.5-flash, verdict: SUPPORTED, timestamp: "2026-08-19",
     protocol: finding-audit-v2}
---
""",
)

# The quote crosses a markdown emphasis run: the normalized text reads
# "the **debit** side" and the quote reads "the debit side" (ERF-51 step 2).
write(
    f"{C}/atoms/led-002.md",
    """---
id: led-002
type: atom
corpus: ledger-discipline
finding: "Pacioli states the trial-balance control in the same chapter: the
  debit side must agree with the credit side or the ledger is in error."
quote: "You must always take care to see that the debit side agrees with the
  credit side, for otherwise there would be a mistake in your ledger."
source: pacioli-1494-geijsbeek
source_quality: high
as_of_date: "1494"
created: {timestamp: "2026-08-19", by: "human:fb"}
last_modified: {timestamp: "2026-08-20", by: "human:fb"}
finding_audit:
  - {auditor: deepseek-v4-pro, verdict: SUPPORTED, timestamp: "2026-08-21",
     protocol: finding-audit-v2}
---
""",
)

# An elided quote, testing ERF-52's split-before-normalization.
write(
    f"{C}/atoms/led-003.md",
    """---
id: led-003
type: atom
corpus: ledger-discipline
finding: "The working note states that a parity check localizes no error: it
  reports that some entry is wrong and not which one."
quote: "What the control cannot tell you is which entry is wrong. It tells
  you only that one of them is, [...] much smaller claim than the one people
  usually make for it."
source: bouet-2026-ledger-note
source_quality: medium
limitations: "The note is the corpus owner's own, written for this corpus:
  a first party with an interest in the answer, not an independent report."
created: {timestamp: "2026-08-19", by: "human:fb"}
finding_audit:
  - {auditor: gemini-3.5-flash, verdict: SUPPORTED, timestamp: "2026-08-20",
     protocol: finding-audit-v2}
---
""",
)

# An atom whose source holds no normalized text: the quote check is
# unavailable and MUST be reported as such (ERF-51), never passed or failed.
write(
    f"{C}/atoms/led-004.md",
    """---
id: led-004
type: atom
corpus: ledger-discipline
finding: "Acme's 2026 white paper claims its reconciliation engine detects
  every unbalanced entry within one accounting period."
quote: "Our engine detects every unbalanced entry within a single accounting
  period."
source: acme-2026-reconciliation-whitepaper
source_quality: medium
limitations: "A vendor's claim about its own product: an identifiable first
  party with an interest in the answer. The corpus holds no normalized text
  for this source, so the quote check cannot run against it."
as_of_date: "2026"
created: {timestamp: "2026-08-19", by: "human:fb"}
---
""",
)

# --- claims ---------------------------------------------------------------


def claim(fid, front, statement, notes):
    write(f"{C}/claims/{fid}.md", f"---\n{front}---\n{statement}\n\n{notes}\n")


claim(
    "every-entry-is-made-twice",
    """id: every-entry-is-made-twice
type: claim
corpus: ledger-discipline
title: "Pacioli's 1494 treatise states the double-entry rule explicitly:
  every ledger entry is made twice, once as a debit and once as a credit."
epistemic_kind: observation
short_name: "double entry, stated"
families: [prior-art]
semantic_query: "double entry bookkeeping origin Pacioli debit credit rule"
created: {timestamp: "2026-08-20", by: "human:fb"}
atoms_for: [led-001, led-002]
edges:
  - {to: ledger-parity-detects-error, relation: decomposes-into}
standings:
  - timestamp: "2026-08-21T09:14:00-05:00"
    stance: for
    by: "human:fb"
    why: "Two atoms quote the treatise directly and both audits came back
      SUPPORTED under the same protocol. The claim is about what the text
      says, which is exactly what a quote settles."
    evidence_at_stance: {atoms_for: [led-001, led-002]}
evidence_audit:
  - {auditor: deepseek-v4-pro, verdict: SUPPORTED, timestamp: "2026-08-22",
     protocol: backing-audit-v1}
""",
    "Pacioli's 1494 treatise states the double-entry rule explicitly: every "
    "ledger entry is made twice, once as a debit and once as a credit.",
    """## Working notes

The claim is deliberately about the text and not about practice. Whether
Venetian merchants actually kept books this way in 1494 is a different claim
and would need different evidence.""",
)

claim(
    "ledger-parity-detects-error",
    """id: ledger-parity-detects-error
type: claim
corpus: ledger-discipline
title: "A trial balance detects that some entry is wrong without localizing
  which one."
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: "human:fb"}
atoms_for: [led-003]
edges:
  - {to: trial-balance-is-a-control, relation: supports}
standings:
  - timestamp: "2026-08-21T09:20:00-05:00"
    stance: for
    by: "human:fb"
    why: "The working note says it in as many words, and the arithmetic is
      not in dispute: a sum that differs names no term."
    evidence_at_stance: {atoms_for: [led-003]}
""",
    "A trial balance detects that some entry is wrong without localizing "
    "which one.",
    """## Working notes

This is the premise that keeps the argument above it honest. Without it the
control reads as a diagnosis rather than an alarm.""",
)

claim(
    "trial-balance-is-a-control",
    """id: trial-balance-is-a-control
type: claim
corpus: ledger-discipline
title: "The trial balance is a control and not a proof: it establishes that
  the books are internally consistent, never that they are true."
epistemic_kind: argument
created: {timestamp: "2026-08-20", by: "human:fb"}
edges:
  - {to: every-entry-is-made-twice, relation: assumes}
standings:
  - timestamp: "2026-08-21T09:31:00-05:00"
    stance: for
    by: "human:fb"
    why: "Granting both premises, the conclusion follows: a check that both
      sides agree cannot distinguish two compensating errors from none."
    evidence_at_stance: {atoms_for: [led-001, led-002, led-003]}
""",
    "The trial balance is a control and not a proof: it establishes that the "
    "books are internally consistent, never that they are true.",
    """## Working notes

Premises arrive from both sides of the graph: this claim assumes the
double-entry rule, and `ledger-parity-detects-error` supports it. Both are
observations, so the closure terminates in non-argument leaves.""",
)

claim(
    "no-continuous-quote-check-ships",
    """id: no-continuous-quote-check-ships
type: claim
corpus: ledger-discipline
title: "No shipped knowledge-management tool re-runs a verbatim quote check
  against a held copy of the source on every read."
epistemic_kind: observation
created: {timestamp: "2026-08-22", by: "human:fb"}
surveys: [continuous-quote-check-2026-08-22]
edges:
  - {to: vendor-reconciliation-is-sound, relation: conflicts-with}
standings:
  - timestamp: "2026-08-23T08:02:00-05:00"
    stance: for
    by: "human:fb"
    why: "Read as scoped, not as proved: the survey's two acts cover the
      indexes named there and nothing wider, and within that scope the yield
      was nil."
    evidence_at_stance: {atoms_for: [led-003]}
  - timestamp: "2026-08-23T11:40:00-05:00"
    stance: against
    by: "human:mn"
    why: "The scope is a private working collection, so an absence in it says
      something about its curation and close to nothing about the world. I
      do not think the claim as titled is carried."
    evidence_at_stance: {atoms_for: [led-003]}
evidence_audit:
  - {auditor: deepseek-v4-pro, verdict: PARTIAL, timestamp: "2026-08-23",
     protocol: backing-audit-v1}
""",
    "No shipped knowledge-management tool re-runs a verbatim quote check "
    "against a held copy of the source on every read.",
    """## Working notes

A universal negative, so it is audited as scoped rather than as proved
(`ERF-25`). The survey record carries the coverage bounds; the title does
not, which is the objection the `against` standing makes.""",
)

claim(
    "citators-will-converge",
    """id: citators-will-converge
type: claim
corpus: ledger-discipline
title: "Within three years the major legal citators will converge on a shared
  definition of negative treatment."
epistemic_kind: bet
created: {timestamp: "2026-08-22", by: "human:fb"}
""",
    "Within three years the major legal citators will converge on a shared "
    "definition of negative treatment.",
    """## Working notes

Recorded as a bet, so it owes no backing and has nothing to audit. No one has
stood behind it yet, so its computed disposition is *proposal*.""",
)

claim(
    "we-will-quote-verbatim",
    """id: we-will-quote-verbatim
type: claim
corpus: ledger-discipline
title: "This corpus will quote verbatim from a held normalized text and will
  never retype a passage from memory."
epistemic_kind: commitment
created: {timestamp: "2026-08-20", by: "human:fb"}
standings:
  - timestamp: "2026-08-20T17:05:00-05:00"
    stance: for
    by: "human:fb"
    why: "Chosen conduct. The decision is the backing: a retyped quote is a
      guess about one's own evidence, and the check exists to say so."
    evidence_at_stance: {}
""",
    "This corpus will quote verbatim from a held normalized text and will "
    "never retype a passage from memory.",
    """## Working notes

`evidence_at_stance` is present and empty, which asserts that the ruler
stamped and faced nothing. Absent would mean never stamped (`ERF-55`).""",
)

claim(
    "vendor-reconciliation-is-sound",
    """id: vendor-reconciliation-is-sound
type: claim
corpus: ledger-discipline
title: "Acme's reconciliation engine detects every unbalanced entry within a
  single accounting period."
epistemic_kind: observation
created: {timestamp: "2026-08-22", by: "human:fb"}
atoms_for: [led-004]
atoms_against: [led-003]
standings:
  - timestamp: "2026-08-23T10:00:00-05:00"
    stance: against
    by: "human:fb"
    why: "The only evidence for it is the vendor's own page, and the working
      note gives a class of unbalanced entry no parity check can localize.
      I judge the claim as titled false."
    evidence_at_stance: {atoms_for: [led-004], atoms_against: [led-003]}
""",
    "Acme's reconciliation engine detects every unbalanced entry within a "
    "single accounting period.",
    """## Working notes

Evidence against a claim weakens its position, never its identity. This is
the same statement it was when it was minted, standing in a worse light.""",
)

claim(
    "training-materials-are-current",
    """id: training-materials-are-current
type: claim
corpus: ledger-discipline
title: "The bookkeeping training materials in this corpus reflect the
  double-entry rule as the treatise states it."
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: "human:fb"}
atoms_for: [led-001]
standings:
  - timestamp: "2026-08-20T12:00:00-05:00"
    stance: for
    by: "human:fb"
    why: "Checked the materials against led-001 line by line on the day they
      were written."
    evidence_at_stance: {atoms_for: [led-001]}
  - timestamp: "2026-08-24T16:30:00-05:00"
    stance: withdrawn
    by: "human:fb"
    why: "Withdrawn because the materials moved to another corpus and this
      claim now has no subject here. Not because the evidence turned."
    evidence_at_stance: {atoms_for: [led-001]}
""",
    "The bookkeeping training materials in this corpus reflect the "
    "double-entry rule as the treatise states it.",
    """## Working notes

Every current holder has left, so the computed disposition is *retired*. A
retired claim is not a claim shown false, which is what the `why` is for.""",
)

# --- the survey -----------------------------------------------------------

write(
    f"{C}/surveys/continuous-quote-check-2026-08-22.md",
    """---
id: continuous-quote-check-2026-08-22
type: survey
corpus: ledger-discipline
title: "Shipped tools that re-run a verbatim quote check against a held copy
  of the source"
conducted: {timestamp: "2026-08-22", by: "human:fb"}
searches:
  - tool: "rg 13.0.0 (ripgrep, macOS)"
    query: "quote.?check|verbatim.?check|source.?fidelity"
    scope: "a private working collection of forty-one knowledge-management
      repositories held locally"
    hits_reported: "0"
    timestamp: "2026-08-22"
  - tool: "manual review of vendor documentation pages, one reader"
    query: "the documentation sites of nine knowledge-management vendors,
      read in full for any check that runs against a stored source text"
    hits_reported: "3 pages mentioning citation checking; none re-running a
      check against a held copy"
    timestamp: "2026-08-22"
notable_results:
  - what: "One vendor's citation linter"
    note: "Checks that a citation resolves to a reachable URL, which is a
      liveness check on the locator and not a fidelity check on the text.
      A near miss: it is the check this claim says nobody ships, run against
      the wrong thing."
---
What was sought: a shipped tool that holds a copy of a source and re-checks
quoted text against it, rather than checking that a link still resolves.

Coverage bounds. The first act searched a private local collection, so an
absence in it says something about that collection's curation and close to
nothing about the world. The second act read nine vendors' public
documentation, which is what those vendors chose to publish and not what
their products do. Neither act touched a shipped binary.

What surprised me: every hit was a liveness check. Nobody in this sample
treats the source text as the thing to be checked.

What I would search differently: the release notes rather than the marketing
documentation, and the issue trackers rather than either.
""",
)

# --- the narrative --------------------------------------------------------

write(
    f"{C}/narratives/why-we-hold-the-text.md",
    """---
type: narrative
title: "Why we hold the text"
corpus: ledger-discipline
created: {timestamp: "2026-08-23", by: "human:fb"}
---
# Why we hold the text

The rule that every entry is made twice is not a modern invention. It is
stated flatly in a 1494 treatise, in a sentence a reader can check today
because somebody kept the text.
<!-- claims: every-entry-is-made-twice "not a modern invention" bound-at=2026-08-23 -->

What that rule buys is narrower than it sounds. The trial balance is a
control: it tells you the two sides agree, and it tells you nothing about
whether either side is true. Read it as a proof and you will trust a set of
books that two compensating errors have quietly balanced.
<!-- claims: trial-balance-is-a-control ledger-parity-detects-error
     "two compensating errors have quietly balanced" bound-at=2026-08-23 -->

The same asymmetry is why this corpus keeps normalized texts rather than
links. A link tells you the page is still there. It does not tell you the
page still says what you quoted, and no amount of link-checking closes that
gap.

An ordinary comment, which is not a candidate: <!-- a note to the editor -->

A code span mentioning the marker, which the scan must not swallow:
`<!-- claims: not-a-real-binding "x" bound-at=2026-01-01 -->`

And a fenced block, likewise:

```
<!-- claims: also-not-a-binding "y" bound-at=2026-01-01 -->
```
""",
)

print("wrote", C)


# ===========================================================================
# 2. Non-conforming corpora, one per requirement.
# ===========================================================================

BASE_CORPUS = """type: corpus
id: {cid}
title: "A corpus that violates {req}"
spec_version: "0.9.0"
owner: "human:fb"
"""

BASE_SOURCES = """type: sources
sources:
  note:
    citation_text: "A held note (2026)"
    status: shipped
    licence: "CC0-1.0"
    licence_name: "Creative Commons Zero v1.0 Universal"
    normalized: normalized/note.md
"""

BASE_NORM = """# A held note

The parity of a ledger is not a property anyone asserts. It is a property a
machine recomputes: sum the debits, sum the credits, and compare.

A difference of one cent is as loud as a difference of a million, which is
the whole reason the control is worth running at all.
"""

GOOD_ATOM = """---
id: bad-001
type: atom
corpus: {cid}
finding: "The note states that a ledger's parity is recomputed rather than
  asserted."
quote: "It is a property a machine recomputes: sum the debits, sum the
  credits, and compare."
source: note
source_quality: high
created: {{timestamp: "2026-08-19", by: "human:fb"}}
---
"""


def bad(name, req, files, *, corpus=True, sources=True, atom=False, norm=True):
    d = f"violations/{name}"
    cid = name.replace("_", "-")
    if os.path.isdir(os.path.join(ROOT, d)):
        shutil.rmtree(os.path.join(ROOT, d))
    if corpus:
        write(f"{d}/corpus.yaml", BASE_CORPUS.format(cid=cid, req=req))
    if sources:
        write(f"{d}/sources.yaml", BASE_SOURCES)
    if norm:
        write(f"{d}/normalized/note.md", BASE_NORM)
    if atom:
        write(f"{d}/atoms/bad-001.md", GOOD_ATOM.format(cid=cid))
    for path, text in files.items():
        write(f"{d}/{path}", text)
    write(f"{d}/EXPECT", req + "\n")


# ERF-52: the quote is not verbatim (a word changed).
bad(
    "erf-52-quote-not-verbatim",
    "ERF-52",
    {
        "atoms/q1.md": """---
id: q1
type: atom
corpus: erf-52-quote-not-verbatim
finding: "The note states that a ledger's parity is recomputed."
quote: "It is a property a machine recalculates: sum the debits, sum the
  credits, and compare."
source: note
source_quality: high
created: {timestamp: "2026-08-19", by: "human:fb"}
---
"""
    },
)

# ERF-52: whole-words. The span ends mid-token across a word-internal hyphen.
bad(
    "erf-52-partial-word",
    "ERF-52",
    {
        "normalized/note.md": """# A held note

The plan was non-binding, and management did not recommend it. Revenue fell
12.5 percent over the same period.
""",
        "atoms/q2.md": """---
id: q2
type: atom
corpus: erf-52-partial-word
finding: "The note reports that management did not recommend the plan."
quote: "binding, and management did not recommend"
source: note
source_quality: high
created: {timestamp: "2026-08-19", by: "human:fb"}
---
""",
        "atoms/q3.md": """---
id: q3
type: atom
corpus: erf-52-partial-word
finding: "The note reports a revenue fall."
quote: "Revenue fell 12"
source: note
source_quality: high
created: {timestamp: "2026-08-19", by: "human:fb"}
---
""",
    },
)

# ERF-52: spans out of order.
bad(
    "erf-52-spans-out-of-order",
    "ERF-52",
    {
        "atoms/q4.md": """---
id: q4
type: atom
corpus: erf-52-spans-out-of-order
finding: "The note states the parity rule."
quote: "sum the debits, sum the credits, and compare. [...] It is a property
  a machine recomputes"
source: note
source_quality: high
created: {timestamp: "2026-08-19", by: "human:fb"}
---
""",
    },
)

# ERF-52: a quote that splices two paragraphs.
bad(
    "erf-52-paragraph-splice",
    "ERF-52",
    {
        "atoms/q5.md": """---
id: q5
type: atom
corpus: erf-52-paragraph-splice
finding: "The note states the parity rule and its sensitivity in one breath."
quote: "sum the debits, sum the credits, and compare. A difference of one
  cent is as loud as a difference of a million"
source: note
source_quality: high
created: {timestamp: "2026-08-19", by: "human:fb"}
---
""",
    },
)

# ERF-52: a quote whose spans are all empty.
bad(
    "erf-52-empty-spans",
    "ERF-52",
    {
        "atoms/q6.md": """---
id: q6
type: atom
corpus: erf-52-empty-spans
finding: "An atom whose quote is nothing but elision markers."
quote: "[...][...]"
source: note
source_quality: high
created: {timestamp: "2026-08-19", by: "human:fb"}
---
""",
    },
)

# ERF-6 / ERF-52: a bare ellipsis is a literal source character, not a wildcard.
bad(
    "erf-52-bare-ellipsis-is-literal",
    "ERF-52",
    {
        "atoms/q7.md": """---
id: q7
type: atom
corpus: erf-52-bare-ellipsis-is-literal
finding: "The note states the parity rule."
quote: "It is a property a machine recomputes ... and compare."
source: note
source_quality: high
created: {timestamp: "2026-08-19", by: "human:fb"}
---
""",
    },
)

# ERF-4: the atom names a source the list does not hold.
bad(
    "erf-04-unknown-source",
    "ERF-4",
    {
        "atoms/q8.md": """---
id: q8
type: atom
corpus: erf-04-unknown-source
finding: "The note states the parity rule."
quote: "sum the debits, sum the credits, and compare"
source: a-source-nobody-listed
source_quality: high
created: {timestamp: "2026-08-19", by: "human:fb"}
---
""",
    },
)

# ERF-1: the source ships but the normalized text is not held.
bad(
    "erf-01-missing-normalized-text",
    "ERF-1",
    {},
    norm=False,
    atom=True,
)

# ERF-5: a source recording an absence with no reason.
bad(
    "erf-05-absence-without-reason",
    "ERF-5",
    {
        "sources.yaml": """type: sources
sources:
  note:
    citation_text: "A note nobody may redistribute (2026)"
    status: not-redistributable
""",
    },
    norm=False,
)

# ERF-35: a reference that resolves to nothing.
bad(
    "erf-35-dangling-reference",
    "ERF-35",
    {
        "claims/c.md": """---
id: c
type: claim
corpus: erf-35-dangling-reference
title: "A claim citing an atom that does not exist."
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: "human:fb"}
atoms_for: [bad-001, led-999]
---
A claim citing an atom that does not exist.

## Working notes

`led-999` was never minted.
""",
    },
    atom=True,
)

# ERF-35: a reference that resolves to the wrong record type.
bad(
    "erf-35-wrong-type",
    "ERF-35",
    {
        "claims/c.md": """---
id: c
type: claim
corpus: erf-35-wrong-type
title: "A claim whose surveys list names an atom."
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: "human:fb"}
surveys: [bad-001]
---
A claim whose surveys list names an atom.

## Working notes

`bad-001` is an atom, not a survey.
""",
    },
    atom=True,
)

# ERF-38 / ERF-36: two records, one id, different types.
bad(
    "erf-38-duplicate-id",
    "ERF-38",
    {
        "claims/bad-001.md": """---
id: bad-001
type: claim
corpus: erf-38-duplicate-id
title: "A claim that steals an atom's id."
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: "human:fb"}
---
A claim that steals an atom's id.

## Working notes

One atom, claim, or survey may hold a given id, and no second record of any
type may repeat it.
""",
    },
    atom=True,
)

# ERF-41 / ERF-19: a standing whose timestamp is a bare date.
bad(
    "erf-41-standing-bare-date",
    "ERF-41",
    {
        "claims/c.md": """---
id: c
type: claim
corpus: erf-41-standing-bare-date
title: "A claim whose ledger cannot be ordered."
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: "human:fb"}
atoms_for: [bad-001]
standings:
  - timestamp: "2026-08-21"
    stance: for
    by: "human:fb"
    why: "A bare date and an instant on the same day cannot be ordered."
    evidence_at_stance: {atoms_for: [bad-001]}
---
A claim whose ledger cannot be ordered.

## Working notes

ERF-19 requires a full RFC 3339 instant here alone.
""",
    },
    atom=True,
)

# ERF-21: a standing taken by a machine.
bad(
    "erf-21-machine-stance",
    "ERF-21",
    {
        "claims/c.md": """---
id: c
type: claim
corpus: erf-21-machine-stance
title: "A claim an agent stood behind."
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: "human:fb"}
atoms_for: [bad-001]
standings:
  - timestamp: "2026-08-21T09:00:00-05:00"
    stance: for
    by: "agent/claude-fable-5"
    why: "An LLM proposes; only a person takes a stance."
    evidence_at_stance: {atoms_for: [bad-001]}
---
A claim an agent stood behind.

## Working notes

ERF-21 makes `by` a `human:` actor.
""",
    },
    atom=True,
)

# ERF-22 / ERF-55: a stored state field.
bad(
    "erf-22-stored-disposition",
    "ERF-55",
    {
        "claims/c.md": """---
id: c
type: claim
corpus: erf-22-stored-disposition
title: "A claim that stores its own disposition."
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: "human:fb"}
disposition: active
atoms_for: [bad-001]
---
A claim that stores its own disposition.

## Working notes

The disposition is computed, never stored.
""",
    },
    atom=True,
)

# ERF-43: a cycle in the premise relation.
bad(
    "erf-43-premise-cycle",
    "ERF-43",
    {
        "claims/a.md": """---
id: a
type: claim
corpus: erf-43-premise-cycle
title: "Claim A, which assumes B."
epistemic_kind: argument
created: {timestamp: "2026-08-20", by: "human:fb"}
edges:
  - {to: b, relation: assumes}
---
Claim A, which assumes B.

## Working notes

X assumes Y and Y supports X both make Y a premise of X.
""",
        "claims/b.md": """---
id: b
type: claim
corpus: erf-43-premise-cycle
title: "Claim B, which supports A."
epistemic_kind: argument
created: {timestamp: "2026-08-20", by: "human:fb"}
edges:
  - {to: a, relation: supports}
---
Claim B, which supports A.

## Working notes

The cycle is A -> B -> A.
""",
    },
)

# ERF-43: a self-edge.
bad(
    "erf-43-self-edge",
    "ERF-43",
    {
        "claims/a.md": """---
id: a
type: claim
corpus: erf-43-self-edge
title: "A claim that assumes itself."
epistemic_kind: argument
created: {timestamp: "2026-08-20", by: "human:fb"}
edges:
  - {to: a, relation: assumes}
---
A claim that assumes itself.

## Working notes

Self-edges MUST NOT exist in any relation.
""",
    },
)

# ERF-43: a closure terminating in an argument leaf.
bad(
    "erf-43-argument-leaf",
    "ERF-43",
    {
        "claims/top.md": """---
id: top
type: claim
corpus: erf-43-argument-leaf
title: "The top argument, which assumes a premise-less argument."
epistemic_kind: argument
created: {timestamp: "2026-08-20", by: "human:fb"}
edges:
  - {to: bottom, relation: assumes}
---
The top argument, which assumes a premise-less argument.

## Working notes

The closure MUST terminate in non-argument leaves.
""",
        "claims/bottom.md": """---
id: bottom
type: claim
corpus: erf-43-argument-leaf
title: "An argument with no premises at all."
epistemic_kind: argument
created: {timestamp: "2026-08-20", by: "human:fb"}
---
An argument with no premises at all.

## Working notes

Nothing terminates below this.
""",
    },
)

# ERF-44: conflicts-with stored on both claims.
bad(
    "erf-44-conflicts-stored-twice",
    "ERF-44",
    {
        "claims/a.md": """---
id: a
type: claim
corpus: erf-44-conflicts-stored-twice
title: "Claim A, in tension with B."
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: "human:fb"}
edges:
  - {to: b, relation: conflicts-with}
---
Claim A, in tension with B.

## Working notes

Stored once, the reciprocal derived.
""",
        "claims/b.md": """---
id: b
type: claim
corpus: erf-44-conflicts-stored-twice
title: "Claim B, in tension with A."
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: "human:fb"}
edges:
  - {to: a, relation: conflicts-with}
---
Claim B, in tension with A.

## Working notes

The reciprocal is stored here too, which is the violation.
""",
    },
)

# ERF-48: last_modified earlier than created.
bad(
    "erf-48-backwards-stamp",
    "ERF-48",
    {
        "atoms/q.md": """---
id: q
type: atom
corpus: erf-48-backwards-stamp
finding: "The note states the parity rule."
quote: "sum the debits, sum the credits, and compare"
source: note
source_quality: high
created: {timestamp: "2026-08-19", by: "human:fb"}
last_modified: {timestamp: "2026-08-17", by: "human:fb"}
---
""",
    },
)

# ERF-53: an atom with a body.
bad(
    "erf-53-atom-with-body",
    "ERF-53",
    {
        "atoms/q.md": """---
id: q
type: atom
corpus: erf-53-atom-with-body
finding: "The note states the parity rule."
quote: "sum the debits, sum the credits, and compare"
source: note
source_quality: high
created: {timestamp: "2026-08-19", by: "human:fb"}
---
An atom's body is empty, so its file is frontmatter and nothing else.
""",
    },
)

# ERF-54: two declarations.
bad(
    "erf-54-two-declarations",
    "ERF-54",
    {
        "other-corpus.yaml": """type: corpus
id: erf-54-two-declarations
title: "A second declaration of the same corpus"
spec_version: "0.9.0"
""",
    },
    atom=True,
)

# ERF-55: an empty list written out.
bad(
    "erf-55-empty-list",
    "ERF-55",
    {
        "claims/c.md": """---
id: c
type: claim
corpus: erf-55-empty-list
title: "A claim that writes out an empty list."
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: "human:fb"}
atoms_for: [bad-001]
atoms_against: []
---
A claim that writes out an empty list.

## Working notes

Empty lists MUST be omitted; a field's absence means none.
""",
    },
    atom=True,
)

# ERF-58: an event-time key that is not `timestamp`.
bad(
    "erf-58-wrong-time-key",
    "ERF-58",
    {
        "atoms/q.md": """---
id: q
type: atom
corpus: erf-58-wrong-time-key
finding: "The note states the parity rule."
quote: "sum the debits, sum the credits, and compare"
source: note
source_quality: high
created: {date: "2026-08-19", by: "human:fb"}
---
""",
    },
)

# ERF-59: no declaration at all.
bad("erf-59-no-declaration", "ERF-59", {}, corpus=False, atom=True)

# ERF-65: a string-typed field that arrived as a number.
bad(
    "erf-65-unquoted-scalar",
    "ERF-65",
    {
        "surveys/s.md": """---
id: s
type: survey
corpus: erf-65-unquoted-scalar
title: "A survey whose yield arrived as a number"
conducted: {timestamp: "2026-08-22", by: "human:fb"}
searches:
  - tool: "rg 13.0.0 (ripgrep, macOS)"
    query: "granted"
    hits_reported: 0
---
The yield is typed as text by the model and MUST be quoted.
""",
    },
)

# ERF-66: a duplicate key.
bad(
    "erf-66-duplicate-key",
    "ERF-66",
    {
        "atoms/q.md": """---
id: q
type: atom
corpus: erf-66-duplicate-key
finding: "The note states the parity rule."
quote: "sum the debits, sum the credits, and compare"
quote: "A difference of one cent is as loud as a difference of a million"
source: note
source_quality: high
created: {timestamp: "2026-08-19", by: "human:fb"}
---
""",
    },
)

# ERF-66: an anchor and an alias.
bad(
    "erf-66-anchor-and-alias",
    "ERF-66",
    {
        "atoms/q.md": """---
id: q
type: atom
corpus: erf-66-anchor-and-alias
finding: &f "The note states the parity rule."
quote: "sum the debits, sum the credits, and compare"
source: note
source_quality: high
limitations: *f
created: {timestamp: "2026-08-19", by: "human:fb"}
---
""",
    },
)

# ERF-67: CRLF line endings.
d = "violations/erf-67-crlf"
if os.path.isdir(os.path.join(ROOT, d)):
    shutil.rmtree(os.path.join(ROOT, d))
write(f"{d}/corpus.yaml", BASE_CORPUS.format(cid="erf-67-crlf", req="ERF-67"))
write(f"{d}/sources.yaml", BASE_SOURCES)
write(f"{d}/normalized/note.md", BASE_NORM)
full = os.path.join(ROOT, f"{d}/atoms/q.md")
os.makedirs(os.path.dirname(full), exist_ok=True)
with open(full, "wb") as f:
    f.write(GOOD_ATOM.format(cid="erf-67-crlf").replace("\n", "\r\n").encode())
write(f"{d}/EXPECT", "ERF-67\n")

# YAMLB-1: a narrative binding that fails the grammar.
bad(
    "yamlb-1-bad-grammar",
    "YAMLB-1",
    {
        "narratives/n.md": """---
type: narrative
title: "A narrative with a broken binding"
corpus: yamlb-1-bad-grammar
created: {timestamp: "2026-08-23", by: "human:fb"}
---
The first passage asserts something and closes with a binding whose ids are
separated by commas, which the grammar refuses.
<!-- claims: bad-001, other "closes with a binding" bound-at=2026-08-23 -->

The second passage closes with a binding that never terminates.
<!-- claims: bad-001 "never terminates" bound-at=2026-08-23

The third passage closes with a binding whose date is not a date.
<!-- claims: bad-001 "is not a date" bound-at=23-08-2026 -->
""",
    },
    atom=True,
)

# ERF-31: a narrative binding naming a claim that does not exist.
bad(
    "erf-31-binding-resolves-to-nothing",
    "ERF-31",
    {
        "narratives/n.md": """---
type: narrative
title: "A narrative binding a claim nobody minted"
corpus: erf-31-binding-resolves-to-nothing
created: {timestamp: "2026-08-23", by: "human:fb"}
---
A narrative claiming support from a record that does not exist is a defect in
the narrative, and hiding it turns a broken citation into a confident
sentence.
<!-- claims: no-such-claim "a confident sentence" bound-at=2026-08-23 -->
""",
    },
    atom=True,
)

# ERF-70: a converted source that names no extracting tool.
bad(
    "erf-70-unnamed-extraction",
    "ERF-70",
    {
        "sources.yaml": """type: sources
sources:
  note:
    citation_text: "A note that arrived as a PDF (2026)"
    status: shipped
    licence: "CC0-1.0"
    licence_name: "Creative Commons Zero v1.0 Universal"
    received:
      path: raw/note.pdf
      timestamp: "2026-08-19"
    normalized: normalized/note.md
""",
        "raw/note.pdf": "%PDF-1.4 (a stand-in, not a real PDF)\n",
    },
    atom=True,
)

# ERF-69: the normalized text holds the quoted passage and nothing else.
bad(
    "erf-69-text-is-the-quote",
    "ERF-69",
    {
        "normalized/note.md": "sum the debits, sum the credits, and compare\n",
        "atoms/q.md": """---
id: q
type: atom
corpus: erf-69-text-is-the-quote
finding: "A source whose held text is a copy of the thing it is meant to
  check."
quote: "sum the debits, sum the credits, and compare"
source: note
source_quality: high
created: {timestamp: "2026-08-19", by: "human:fb"}
---
""",
    },
)

# ERF-60: a MAJOR version this validator was not built from.
bad(
    "erf-60-unsupported-major",
    "ERF-60",
    {
        "corpus.yaml": """type: corpus
id: erf-60-unsupported-major
title: "A corpus declaring a major version this validator does not support"
spec_version: "2.0.0"
""",
    },
    atom=True,
)

# ERF-3: no source list at all.
bad("erf-03-no-source-list", "ERF-3", {}, sources=False, norm=False)

print("wrote violations/")


# ===========================================================================
# 3. The fabrication suite: attempts to make a false quotation pass ERF-52.
#
#    The spec's conformance README describes an attack suite; this is the
#    independent one. Each atom's `limitations` records the attack and the
#    verdict expected from a correct reading of ERF-51 and ERF-52.
# ===========================================================================

F = "fabrication"
if os.path.isdir(os.path.join(ROOT, F)):
    shutil.rmtree(os.path.join(ROOT, F))

ZWSP = "\u200b"
SHY = "\u00ad"

FAB_NORM = (
    "# Board minutes, 14 March 2026\n"
    "\n"
    "The chair opened by noting that the plan was non-binding, and management\n"
    "did not recommend it in its current form. Revenue fell 12.5 percent over\n"
    "the same period, and the reserve was set at 1,000 units with a MAX_LEN of\n"
    "3*4 characters in the export.\n"
    "\n"
    "The board did not approve the acquisition. Several members said they would\n"
    "support a revised proposal in the autumn, provided the dilig" + SHY + "ence was\n"
    "redone by an independent firm. The chair recorded the re\u0301sume\u0301 of the\n"
    "external adviser.\n"
    "\n"
    "A motion to adjourn was carried unanimously.\n"
)
write(f"{F}/normalized/minutes.md", FAB_NORM)
write(
    f"{F}/corpus.yaml",
    """type: corpus
id: fabrication-suite
title: "An attack suite: attempts to make a false quotation pass the check"
spec_version: "0.9.0"
owner: "human:fb"
""",
)
write(
    f"{F}/sources.yaml",
    """type: sources
sources:
  minutes:
    citation_text: "Board minutes, 14 March 2026"
    status: shipped
    licence: "CC0-1.0"
    licence_name: "Creative Commons Zero v1.0 Universal"
    normalized: normalized/minutes.md
""",
)

FAB_INDEX = []


def fab(num, slug, finding, quote, expect, note):
    fid = "fab-%03d" % num
    FAB_INDEX.append((fid, slug, expect, note))
    write(
        f"{F}/atoms/{slug}.md",
        "---\n"
        f"id: {fid}\n"
        "type: atom\n"
        "corpus: fabrication-suite\n"
        f"finding: {finding}\n"
        f"quote: {quote}\n"
        f"limitations: \"{expect}. {note}\"\n"
        "source: minutes\n"
        "source_quality: high\n"
        'created: {timestamp: "2026-08-24", by: "human:fb"}\n'
        "---\n",
    )


# A1 - reverse the sense by eliding the negation.
fab(1, "a01-elide-negation",
    '"The board approved the acquisition."',
    '"The board did [...] approve the acquisition."',
    "EXPECT PASS",
    "The text between two spans is unbounded by design, so the mechanical "
    "check cannot see a reversed sense. Only a finding audit can. This is "
    "the format saying so, not a defect in the tool")

# A2 - splice two paragraphs with no marker.
fab(2, "a02-paragraph-splice",
    '"The minutes record the recommendation and the vote in one breath."',
    '"3*4 characters in the export. The board did not approve the acquisition."',
    "EXPECT FAIL",
    "Splicing across the blank line; the fold puts U+2029 where the quote "
    "has a space")

# A3 - lift a span that begins inside a hyphenated word.
fab(3, "a03-word-prefix",
    '"The minutes describe the plan as binding."',
    '"binding, and management did not recommend"',
    "EXPECT FAIL",
    "The whole-words rule: the hyphen in non-binding joins two word "
    "characters and is word-internal")

# A4 - truncate a decimal.
fab(4, "a04-number-truncation",
    '"Revenue fell 12 percent."',
    '"Revenue fell 12"',
    "EXPECT FAIL",
    "A full stop between digits is word-internal, so 12 does not occur "
    "in 12.5")

# A5 - hide the boundary behind an elision marker.
fab(5, "a05-elision-fakes-a-boundary",
    '"The minutes describe the plan as binding."',
    '"[...]binding, and management did not recommend"',
    "EXPECT FAIL",
    "The sharpest attack in this suite: an empty leading span is skipped, "
    "and the whole-words test still reads the hyphen in the text. A naive "
    "implementation that treated an elision marker as a word boundary "
    "would let this through")

# A6 - change case.
fab(6, "a06-case-change",
    '"The minutes say The Board did not approve the acquisition."',
    '"the Board did not approve the acquisition"',
    "EXPECT FAIL",
    "Case MUST NOT be folded")

# A7 - control: an honest quote, copied.
fab(7, "a07-honest-control",
    '"The minutes record a unanimous motion to adjourn."',
    '"A motion to adjourn was carried unanimously"',
    "EXPECT PASS",
    "The control. If this fails, the fold is wrong")

# A8 - markers around a non-word character.
fab(8, "a08-markers-around-punctuation",
    '"Revenue fell 12.5 percent."',
    '"Revenue fell 12*.*5 percent"',
    "EXPECT PASS",
    "A finding: the marker rule keeps a marker only between two WORD "
    "characters, and a full stop is not one, so these fold away and the "
    "quote matches. What a reader sees rendered and what the check compares "
    "are not the same string here")

# A9 - two tiny spans with the whole document elided between them.
fab(9, "a09-total-elision",
    '"The minutes say the board approved everything unanimously."',
    '"The board [...] unanimously"',
    "EXPECT PASS",
    "An elision of arbitrary length is legal. ERF-52 declines to measure "
    "the distance, deliberately")

# A10 - defeat a kept marker.
fab(10, "a10-underscore-in-token",
    '"The export has a MAXLEN limit."',
    '"MAXLEN of"',
    "EXPECT FAIL",
    "MAX_LEN keeps its underscore: a marker with word characters on both "
    "sides survives the fold")

# A11 - defeat a kept marker, the multiplication case.
fab(11, "a11-star-between-digits",
    '"The export allows 34 characters."',
    '"34 characters in the export"',
    "EXPECT FAIL",
    "3*4 keeps its star for the same reason, so 34 does not occur")

# A12 - a comma inside a number.
fab(12, "a12-comma-in-number",
    '"The reserve was set at 1 unit."',
    '"the reserve was set at 1"',
    "EXPECT FAIL",
    "A comma between digits is word-internal, so 1 does not occur in 1,000")

# A13 - a soft hyphen in the text, absent from the quote.
fab(13, "a13-soft-hyphen-in-text",
    '"The minutes record that the diligence was to be redone."',
    '"the diligence was redone by an independent firm"',
    "EXPECT PASS",
    "The text carries a soft hyphen inside diligence; format characters go "
    "in step 1, so an honest quote typed without it still matches")

# A14 - a decomposed accent in the quote, composed in the text.
fab(14, "a14-nfc-mismatch",
    '"The chair recorded the adviser\'s resume."',
    '"The chair recorded the r\u00e9sum\u00e9 of the external adviser."',
    "EXPECT PASS",
    "The text stores the accents decomposed and the quote composed; NFC in "
    "step 1 makes them the same string")

# A15 - a zero-width space used to join two words in the quote.
fab(15, "a15-zero-width-join",
    '"The minutes say management didnot recommend it."',
    '"management did' + ZWSP + 'not recommend it"',
    "EXPECT FAIL",
    "Removing the zero-width space leaves didnot, which the text does not "
    "hold. An invisible character can only delete, never insert a space")

# A16 - two spans crossing a sentence boundary inside one paragraph.
fab(16, "a16-sentence-boundary",
    '"The minutes record the vote and the members\' condition together."',
    '"The board did not approve the acquisition. Several members said"',
    "EXPECT PASS",
    "A sentence boundary is not a paragraph boundary; ERF-51 marks only the "
    "blank line")

# A17 - spans presented out of the order the text holds them in.
fab(17, "a17-reordered-spans",
    '"The minutes put the vote before the recommendation."',
    '"The board did not approve the acquisition. [...] management"',
    "EXPECT FAIL",
    "Every non-empty span must occur in order; management comes first in "
    "the text")

# A18 - overlapping spans.
fab(18, "a18-overlapping-spans",
    '"The minutes repeat the phrase twice."',
    '"did not recommend it [...] recommend it in its current form"',
    "EXPECT FAIL",
    "The second span would have to overlap the first, which ERF-52 forbids")

write(
    f"{F}/README-attacks.md",
    "# The fabrication suite\n\n"
    "Each atom is one attempt to make a quotation the source does not carry\n"
    "pass the ERF-52 check, or one control that must pass. The `limitations`\n"
    "field on each atom states the attack and the expected verdict.\n\n"
    "| id | file | expected |\n|:--|:--|:--|\n"
    + "".join(
        f"| {fid} | atoms/{slug}.md | {exp} |\n" for fid, slug, exp, _ in FAB_INDEX
    )
    + "\nRun: `./target/release/erfval --quiet tests/fabrication`\n\n"
    "This file carries no `type`, so the validator ignores it and says so\n"
    "(`ERF-54`), which is itself part of the test.\n",
)

print("wrote", F, len(FAB_INDEX), "attacks")


# ===========================================================================
# 4. The flags corpus. Everything here is a flag and nothing is a violation:
#    "a corpus carrying flags and no violations conforms" (SPEC section 1).
# ===========================================================================

G = "flags"
if os.path.isdir(os.path.join(ROOT, G)):
    shutil.rmtree(os.path.join(ROOT, G))

write(f"{G}/normalized/note.md", BASE_NORM)
write(
    f"{G}/normalized/thin.md",
    "It is a property a machine recomputes: sum the debits, sum the credits,\n"
    "and compare. That is all.\n",
)
write(
    f"{G}/corpus.yaml",
    """type: corpus
id: flagged
title: "A corpus that conforms and that someone should look at"
spec_version: "0.9.0"
owner: "human:fb"
""",
)
write(
    f"{G}/sources.yaml",
    """type: sources
sources:
  note:
    citation_text: "A note on parity, www.example.org (2026)"
    status: shipped
    normalized: normalized/note.md
    received:
      url: "https://example.org/notes/parity.html"
    extraction: "pandoc 3.1.11"
  thin:
    citation_text: "A source whose normalized text is the quote and nothing more"
    status: shipped
    licence: "CC0-1.0"
    licence_name: "Creative Commons Zero v1.0 Universal"
    normalized: normalized/thin.md
""",
)

# ERF-13 (id shape), ERF-9 (medium with no limitations), ERF-6 (bare ellipsis
# inside a quote that still matches), ERF-47 (a stale finding audit).
write(
    f"{G}/atoms/loose.md",
    """---
id: an-atom-without-a-sequence-number
type: atom
corpus: flagged
finding: "The note states that a ledger's parity is recomputed."
quote: "It is a property a machine recomputes: sum the debits, sum the
  credits, and compare."
source: note
source_quality: medium
created: {timestamp: "2026-08-19", by: "human:fb"}
last_modified: {timestamp: "2026-08-22", by: "human:fb"}
finding_audit:
  - {auditor: gemini-3.5-flash, verdict: SUPPORTED, timestamp: "2026-08-20",
     protocol: finding-audit-v2}
---
""",
)

write(
    f"{G}/atoms/thin-001.md",
    """---
id: thin-001
type: atom
corpus: flagged
finding: "A source whose held text is barely longer than the quote lifted
  from it."
quote: "It is a property a machine recomputes: sum the debits, sum the
  credits,"
source: thin
source_quality: high
created: {timestamp: "2026-08-19", by: "human:fb"}
---
""",
)

# ERF-49 (an observation someone stands on, unbacked), ERF-20 (no
# evidence_at_stance), ERF-41 (two entries by one person sharing an instant),
# ERF-18 (the body does not open with the title).
write(
    f"{G}/claims/unbacked.md",
    """---
id: unbacked
type: claim
corpus: flagged
title: "A claim nobody attached evidence to, that a person nonetheless stands
  behind."
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: "human:fb"}
standings:
  - timestamp: "2026-08-21T09:00:00-05:00"
    stance: for
    by: "human:fb"
    why: "Stood behind on the strength of a conversation nobody wrote down."
  - timestamp: "2026-08-21T14:00:00-05:00"
    stance: against
    by: "human:mn"
    why: "I read the same conversation the other way."
  - timestamp: "2026-08-21T14:00:00-05:00"
    stance: for
    by: "human:mn"
    why: "A correction filed the same instant, which is the collision a
      validator must flag."
---
The body opens with something other than the title, which is what makes
later drift invisible to a reader.

## Working notes

Every flag in this file is deliberate.
""",
)

# ERF-43 (a retired claim inside a premise closure).
write(
    f"{G}/claims/hollow-argument.md",
    """---
id: hollow-argument
type: claim
corpus: flagged
title: "An argument standing on a premise its holder has since left."
epistemic_kind: argument
created: {timestamp: "2026-08-20", by: "human:fb"}
last_modified: {timestamp: "2026-08-23", by: "human:fb"}
edges:
  - {to: abandoned-premise, relation: assumes}
  - {to: abandoned-premise, relation: assumes}
---
An argument standing on a premise its holder has since left.

## Working notes

The duplicate edge is deliberate too.
""",
)

write(
    f"{G}/claims/abandoned-premise.md",
    """---
id: abandoned-premise
type: claim
corpus: flagged
title: "A premise every holder has withdrawn from."
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: "human:fb"}
atoms_for: [thin-001]
standings:
  - timestamp: "2026-08-20T09:00:00-05:00"
    stance: for
    by: "human:fb"
    why: "Held at the time."
    evidence_at_stance: {atoms_for: [thin-001], atoms_against: [led-404]}
  - timestamp: "2026-08-24T09:00:00-05:00"
    stance: withdrawn
    by: "human:fb"
    why: "Left it. Not because it was shown false."
    evidence_at_stance: {atoms_for: [thin-001]}
---
A premise every holder has withdrawn from.

## Working notes

`led-404` in the first entry's `evidence_at_stance` resolves to nothing: a
past state, so a flag and not a violation (ERF-35).
""",
)

# ERF-32 (a narrative binding older than the claim it names).
write(
    f"{G}/narratives/stale.md",
    """---
type: narrative
title: "A narrative whose bindings have aged"
corpus: flagged
created: {timestamp: "2026-08-19", by: "human:fb"}
---
An argument standing on a premise its holder has since left is still an
argument, and the prose above it keeps saying what it said.
<!-- claims: hollow-argument "keeps saying what it said" bound-at=2026-08-19 -->
""",
)

# ERF-24 (a bet carrying a backing audit), ERF-15 (a path-like reference),
# ERF-65 (a legacy scalar hazard left unquoted: a bare date).
write(
    f"{G}/claims/a-bet-with-an-audit.md",
    """---
id: a-bet-with-an-audit
type: claim
corpus: flagged
title: "A bet that someone audited anyway."
epistemic_kind: bet
created: {timestamp: 2026-08-20, by: "human:fb"}
evidence_audit:
  - {auditor: gemini-3.5-flash, verdict: PARTIAL, timestamp: "2026-08-21",
     protocol: backing-audit-v1}
---
A bet that someone audited anyway.

## Working notes

`created.timestamp` is an unquoted date, which this schema leaves a string
and a legacy YAML 1.1 reader turns into a date object.
""",
)

# ERF-28 (a re-run whose id does not end with its conducted date).
write(
    f"{G}/surveys/rerun.md",
    """---
id: a-rerun-with-the-wrong-id
type: survey
corpus: flagged
title: "A re-run of an earlier survey"
conducted: {timestamp: "2026-08-24", by: "human:fb"}
prior_survey: the-first-survey-2026-08-20
searches:
  - tool: "rg 13.0.0 (ripgrep, macOS)"
    query: "parity"
    hits_reported: "0"
---
A re-run's id SHOULD end with the conducted date.
""",
)

write(
    f"{G}/surveys/first.md",
    """---
id: the-first-survey-2026-08-20
type: survey
corpus: flagged
title: "The first pass at the same question"
conducted: {timestamp: "2026-08-20", by: "human:fb"}
searches:
  - tool: "rg 13.0.0 (ripgrep, macOS)"
    query: "parity"
    hits_reported: "0"
---
The predecessor.
""",
)

write(f"{G}/EXPECT", "flags only; zero violations\n")
print("wrote", G)
