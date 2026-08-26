# Example records

One record per type, each in the interchange form the YAML/Markdown serialization defines (`serialization/yaml-markdown.md`): YAML frontmatter between `---` fences, then a CommonMark body where the type has one. An atom's file is frontmatter alone. Copy any of these and you have a conforming file; the conformance suite validates each against `schema/erf.schema.json`.

The source entries are one document, `sources.yaml`, since a source is an entry in a corpus's source list and never a file of its own.

## `atom-book.md`

A standalone atom record (SPEC.md, section 4.2). The atom names its
source by id (ERF-35); the work's citation, locator, and capture live on
the source entry, shown standalone in `sources.yaml`. Every atom
carries its own `type` and `corpus`, in a collection document or
standalone alike: a record extracted from a store is complete without it
(ERF-53, ERF-54).

## `atom-web.md`

A standalone atom record (SPEC.md, section 4.2) quoting a web-native
work. The atom names its source by id (ERF-35); the source entry carries
the citation and the retrieval locator (`sources.yaml`). The
backslash in the quote is verbatim from the source abstract; capture
fidelity beats cleanup.

## `claim.md`

A claim record (SPEC.md, section 4.3), This claim ships as a proposal: nobody has
stood behind it yet, so `standings` is an empty ledger and is omitted
rather than written empty (ERF-55); dispositions are computed from
the ledger, never stored. Empty `edges` and `atoms_against` are
omitted for the same reason.

## `survey-closed.md`

A survey record (SPEC.md, section 4.5) over a CLOSED corpus: the
searched universe is the claim's universe and the probes are complete
over it, so absence is conclusive and the body correctly states no
coverage bounds (a complete search of a closed corpus has none). A real record from a
working corpus: the probes measure the corpus's own retired `granted`
field, so the format's subtraction ledger cites a record instead of
asserting a measurement in prose.

## `survey-gap.md`

A survey record (SPEC.md, section 4.5) backing an ABSENCE reading: the
sought was not found, and the record carries the acts, their yields, and,
closing its body, the coverage bounds a gap claim needs. This is a real record from a
working corpus, minted retroactively from a saved research scan; where
the scan did not record a query or a yield, the record says "not
recorded" rather than reconstructing one. The citing claim lists this
record in `surveys:`; its atoms evidence the near-misses (presence),
the survey evidences the absence.

## `survey-mixed.md`

A survey record (SPEC.md, section 4.5) backing a DENSITY reading, and
the mixed case: web probes beside a private-corpus probe. The body's
closing coverage bounds carry the universe-relation judgment the type
cannot: the private-library act bears only on that library's holdings,
so its yield is recorded as color, not coverage. A real record from a
working corpus; every query was actually run and every hit count is as
the instrument reported it.

## `sources.yaml`

Two entries.

**`pacioli-1494-geijsbeek`.** A standalone source entry (SPEC.md, section 4.1): the work behind
`atom-book.md`, with a structured CSL `citation` block. In a corpus this
is one entry of `sources.yaml`, keyed by its id; it is shown here as one entry of a two-entry `sources.yaml`. The capture is a hand-selected excerpt
(ERF-69) converted from a scanned PDF by a named, deterministic tool
(ERF-70), with the raw file pinned by its digest (ERF-71): a
reader who fetches the PDF confirms it is the one the author held, then
re-runs the conversion and the containment check themselves. The embedded
OCR text layer is not a source of nondeterminism: the recognition ran
once, before the artifact existed, and the digest pins its result.

**`lightman-2023-verify`.** A standalone source entry (SPEC.md, section 4.1): the web-native work
behind `atom-web.md`. `citation_text` identifies the work and never
carries a URL (ERF-7); `received.url` names the artifact actually
retrieved, the file itself rather than a page describing it.
The capture is withheld with its reason stated (ERF-5): arXiv grants
authors distribution rights but grants third parties none by default,
and unverified is not permission.
