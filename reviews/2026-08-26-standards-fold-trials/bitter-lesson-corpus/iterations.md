# Validator runs

Every run of `npx tsx viewer/erf-check.ts <corpus-dir>`, in order, with what
changed. Runs marked *(probe)* were made on a throwaway copy of the corpus
with a defect injected on purpose, to find out what the validator checks; they
are not passes over the real corpus and the copies were deleted afterwards.

`UNRECOGNIZED` lines are counted separately throughout: one is emitted per
normalized text on every run, which is a property of the format rather than of
this corpus (friction log F-06).

| # | What was in the corpus | Violations | Flags | Unrecognized | What changed after |
|:--|:--|--:|--:|--:|:--|
| 1 | declaration, source list with 1 source, 2 smoke atoms | 0 | 0 | 1 | Nothing to fix. Confirmed the file shapes parse: frontmatter-only atom files, a bodiless `sources.yaml`, a bodiless `corpus.yaml`. Confirmed `type` discovery works with records in subdirectories, so `atoms/`, `claims/`, `surveys/` are safe. |
| 2 | 31 sources, 115 atoms | 5 | 0 | 31 | Five `ERF-50/ERF-52` word-boundary failures: `bl-043`, `bl-084`, `bl-099`, `bl-100`, `bl-101`. Every one ended a span before a possessive (`Moore` in `Moore's law`, `we don` in `we don't have`). Extended the end anchors past the apostrophe and re-minted. |
| 3 | same, quotes fixed | 0 | 0 | 31 | Nothing. Atom layer clean. |
| 4 | + 32 claims, 4 surveys | 0 | 0 | 31 | Nothing. All `atoms_for` / `atoms_against` / `surveys` / `edges.to` references resolved on the first run; the premise graph was accepted, which told me the `ERF-43` restructuring I had done while writing the specs (F-10) was right. |
| 5 | + the bound narrative | 0 | 0 | 31 | Nothing. Ten narrative bindings, every id resolved, every anchor found in its passage. |
| P-a | *(probe)* stale binding + broken anchor + dangling atom ref + machine-actor standing, all at once | 63 | 1 | 31 | Learned four things: the dangling reference is a correct `ERF-35` violation; the broken anchor is a correct `ERF-31` flag; one bad `standings.by` produces 62 violations through the `oneOf` cascade (F-13); and the schema-level messages cite `ERF-73`, a requirement id the specification does not define (F-11). Also surfaced that the validator's atom-id pattern is stricter than the normative schema's (F-12). |
| P-b | *(probe)* a bound claim given `last_modified: 2026-08-30`, binding stamped `bound-at=2026-08-26` | 0 | 0 | 31 | Nothing fired. `ERF-32` / `ERF-47` narrative-binding staleness is not checked, and the validator names no unchecked requirements (F-14). |
| P-c | *(probe)* `last_modified` earlier than `created` | 1 | 0 | 31 | Correct, exact `ERF-48` violation with both timestamps in the message. |
| P-d | *(probe)* a self-edge and the cycle it makes | 2 | 0 | 31 | Correct `ERF-43` violations, one for the self-edge and one for the cycle, with the cycle path printed. |
| 6 | orphan atoms `bl-112` and `bl-114` attached to claims | 0 | 0 | 31 | Final. Nothing outstanding. |

**Passes to zero violations: two.** Run 2 found five; run 3 was clean, and
every layer added afterwards (claims, surveys, narrative) validated on its
first run.

## Flags read and disposed of

There were no flags on any run over the real corpus. The two flag conditions
the corpus could plausibly raise were tested deliberately:

- **`ERF-31` broken anchor** — fires correctly (probe P-a). None outstanding:
  every anchor in `narrative-bitter-lesson-bound.md` is lifted from its own
  passage by `str.index` in `scripts/build-narrative.py`, so a broken one
  cannot reach the validator.
- **`ERF-32` / `ERF-47` stale binding** — does not fire, ever (probe P-b).
  This is the format's to hear about, not mine to fix. See friction log F-14.

The 31 `UNRECOGNIZED` lines are read and left standing: they are the
normalized texts the format requires the corpus to hold, reported under
`ERF-54` because a `.md` file with no `type` is not part of the corpus. Also
the format's to decide, not mine. See F-06.
