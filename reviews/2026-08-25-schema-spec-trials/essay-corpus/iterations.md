# Iterations

Every `erfval` run over `corpus/`, in order, with what changed before it.

Command, throughout:

```sh
../rust-validator/target/release/erfval corpus
```

Two counts are constant from pass 1 onward and are omitted below: **33
unperformed checks** and **3 partial** (ERF-35, ERF-36, ERF-38, which are
deployment-wide and this run sees one corpus, exactly as section 1 requires the
tool to say).

| Pass | Violations | Flags | Notes | What changed before the run |
|:--|--:|--:|--:|:--|
| 0 | 1 | 0 | 0 | Nothing. An empty `corpus/` directory, run to see the tool's baseline. The single violation is ERF-59: no declaration. |
| 1 | 0 | 1 | 1 | The declaration, the source list with the essay as its one source, the essay's normalized text, and 65 atoms quoting it. Flag: ERF-68 (licence, F-03). Note: the essay's shipped PDF, sitting in `raw/` and belonging to no source. |
| 1p | — | — | — | **Probe, not part of the corpus.** A copy with two throwaway atoms, to find out whether a quote spanning a bold-close-plus-space passes. It does not: `Epistemic types for text. Mainstream tools file text by subject` is an ERF-52 violation. This is F-05, the trial's sharpest finding, and it agreed exactly with my own implementation of ERF-51. Copy deleted. |
| 2 | 0 | 1 | 8 | 33 external sources fetched, extracted, excerpted and normalized; `sources.yaml` rebuilt with digests. No atoms cite them yet. Notes are raw files not yet registered. |
| 3 | 0 | 2 | 8 | 64 external atoms. One quote failed my own pre-flight check (`tools/erf_check.py quotes`) before `erfval` ever saw it: ell-150's quote spliced two sentences across a footnote reference. Fixed with an elision marker, which produced the second flag, ERF-6, because the same quote also carries a literal `…` the source contains. Both flags are correct and deliberate. |
| 4 | 0 | 2 | 8 | 4 more sources (sciwrite-lint, Computerworld, ZoomInfo, adr.github.io) and 4 more atoms. |
| 5 | 0 | 2 | 12 | 2 more sources (Guru, the LLM-convergence preprint) and 4 more atoms. 133 atoms total. |
| 6 | 0 | 2 | 77 | 69 claims and 10 surveys. The 65 new notes are ERF-41 printing a computed disposition for every claim: `proposal`, seventy times over, because no standing is written anywhere. No ERF-43 cycle, no ERF-43 argument leaf, no ERF-44 duplicate, no ERF-49 unbacked flag (see F-08 for why ERF-49 cannot fire here). |
| 7 | 0 | 2 | 78 | The narrative, with 31 narrative bindings. Every binding's ids resolved to claims and every anchor was found in its passage on the first run. |
| 7p | — | — | — | **Probe, not part of the corpus.** A copy with one anchor altered and one binding given a non-existent claim id, to confirm the anchor and resolution checks actually fire rather than passing vacuously. Both fired: a VIOLATION under ERF-31 for the unresolvable id and a FLAG under ERF-31 for the broken anchor, plus a staleness `indeterminate` under ERF-32. Copy deleted. |
| 8 | 0 | 2 | 70 | Eight raw files removed from `corpus/raw/`: seven pages fetched during the search that no source cites (Cloudflare challenges, a 404, superseded candidates) and the essay's shipped PDF, which is the same work as its markdown source and which ERF-3 gives no way to register alongside it (F-16). Notes drop from 78 to 70. |
| 9 | 0 | 2 | 70 | `finding_audit` entries merged onto every atom whose verdict parsed, from a batched cross-vendor audit under protocol `finding-audit-v1-batched-10`. See README.md for the tally. |

**Passes to zero violations: one.** The corpus never carried a violation after
pass 0, and pass 0's single violation was the empty directory.

That is not a claim that the format was easy. It is a consequence of building
the pre-flight checker first: `tools/erf_fold.py` is an independent
implementation of ERF-51 and ERF-52 written from the specification's prose, and
`tools/build_records.py` and `tools/build_sources.py` enforce ERF-55 (no empty
list written out), ERF-65 (every string-typed scalar quoted), ERF-18 (the body
opens with the title verbatim) and ERF-58 (`timestamp` everywhere) by
construction. Three violations were caught by those tools before `erfval` ran,
and each of them would have been an `erfval` violation:

1. a quote spliced across a footnote reference (would have been ERF-52);
2. an unquoted `hits_reported: 0` in a first draft of a survey (would have been
   ERF-65), never written, because the builder quotes every scalar;
3. an `atoms_against: []` written out on a claim before its counter-evidence
   existed (would have been ERF-55), the builder drops empty lists, which is
   the censorship F-07 complains about.

The honest reading of "one pass" is therefore: **the format's machine-checkable
requirements are cheap to satisfy once you have written the fold, and the fold
is the expensive part.** An author working by hand, without an implementation
of ERF-51 and ERF-52 in front of them, would have iterated on quotes for a long
time, and the diagnostic they would have received, "span 1 of 1 does not occur
in the normalized text as whole words", does not say which of the three folding
steps ate their quote.

## Flags left standing

Two, both deliberate, both explained in `README.md` and in the friction log.

- `ERF-68` on `essay-2026-08-19`: no SPDX identifier exists for an unpublished
  manuscript held by its own author, so the source names `licence_name` alone.
  Clearing the flag would mean inventing a `LicenseRef-` identifier for a
  licence that does not exist. F-03.
- `ERF-6` on `ell-150`: the quote carries a `…` that the source itself
  contains, inside a Wikipedia sentence quoting Berners-Lee. Under ERF-52 that
  is a literal character and it is checked as one, which is exactly right. The
  flag is the format telling a reader to look, and looking confirms it.
