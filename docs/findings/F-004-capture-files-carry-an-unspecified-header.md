---
id: F-004
raised:
  by: "claude-opus-5, re-running the 2026-08-25 verifiers against the current spec"
  on: 2026-08-25
  observation: "Every capture file in both authored corpora opens with a YAML header duplicating its source-list entry; the format specifies no such header, and in five files it does not parse"
basis: demonstrated
specified:
  by: null
  on: null
  requirement: null
  claim: null
verifications: []
outcome: open
---

# F-004 · Capture files carry a metadata header the format never specifies

## What was observed

Both authored corpora write their normalized text as a markdown file
opening with YAML frontmatter:

    ---
    source: n-chen-abundant-intelligence-deficient-demand
    citation: Xupeng Chen, "Abundant Intelligence and Deficient Demand: A Macro-Financial Stress Test of Rapid AI Adoption" (arXiv:2603.09209 [cs.AI], submitted 2026-03-10)
    fetched_url: https://arxiv.org/pdf/2603.09209
    fetched_date: 2026-08-25
    digest: sha256:fc15edd9...
    converter: pymupdf4llm 0.3.4 (PyMuPDF 1.28.2)
    excerpt: true
    ---

Nothing in the specification asks for this. Two cold authoring agents
invented it independently, which suggests the need is real: a capture
separated from its corpus says nothing about where it came from.

## Three things follow, and they may be three findings

**It duplicates the source list.** Every field above already lives on the
`Source` entry. Two copies of a digest can disagree, and nothing checks
them against each other.

**In five files it does not parse.** An unquoted `citation:` scalar
containing `: ` is a YAML error. The Python validator reports these as
`ERF-65` violations. Nothing else reads them, so the defect sat unnoticed.

**It is inside the text the quote is checked against.** `quoteCheck` folds
the whole file, header included. No quote has collided with a header yet,
but nothing prevents it: a quote containing `converter: pymupdf4llm` would
match against the header rather than the source, and the check would pass
for the wrong reason.

## Why it may matter

`ERF-4` requires a source to give the path of its normalized text and says
nothing about that file's structure. If a capture may open with arbitrary
frontmatter, the text being checked is not the text that was extracted, and
the quote check's guarantee is weaker than it reads. Either the format
specifies the capture file (and says the header is stripped before
folding), or it says plainly that a capture is the normalized text and
nothing else.
