# The AI capital-expenditure corpus

Seventy-one sources, 151 atoms, 53 claims, 6 surveys and 3 narratives on one
open question: whether the money going into AI infrastructure is backed by
demand that will pay for it, or is running ahead of that demand. It is the
largest corpus in this repository, and it is here because a format for
recording an argument should be legible at the size arguments actually
reach. The smaller [`minimal`](../minimal/) corpus exercises every record
type in eighteen records; this one shows what happens when there are a
hundred and fifty.

Nobody is asking you to agree with any of it. The corpus records what
seventy-one sources say, in both directions, with every quote checkable
against a held copy of the text it came from.

## Where it came from

Eleven LLM agents wrote it on 2026-08-25, in sequence, as the third of that
day's ten independent trials of this specification. Each agent read the
corpus its predecessors had left and added to it: two source scouts for the
two camps, a third for the dimensions both camps ignore, five batches of
atoms, two batches of claims, and a closing author who wrote the surveys and
the narratives. A twelfth run put 62 cross-vendor audit verdicts on the
findings. None of them saw this repository beyond `SPEC.md`.

The trial record is at
[`reviews/2026-08-25-independent-trials/03-authoring-trial-at-scale/`](../../../reviews/2026-08-25-independent-trials/03-authoring-trial-at-scale/),
and it stays as it was: the corpus exactly as the eleven agents left it,
plus the friction log each of them wrote while working and the audit run's
log. **This folder is a copy of that corpus, brought to the specification as
it stands on 2026-08-26.** Read the trial folder for what the agents
produced against the draft they had; read this folder for a corpus that
conforms today. `npx tsx viewer/erf-check.ts examples/corpora/2026-08-26-ai-capex`
ends at zero violations and zero flags.

## What was changed in the copying

Nothing in the argument. No source, atom, claim, survey or narrative was
added, removed, retitled or re-graded, and no finding, quote or verdict was
edited except the three quote corrections below, each of which moved the
quote toward the text rather than the other way round.

| Change | Count | Why |
|:--|:--|:--|
| `captures/` renamed to `normalized/`, and the source list's 69 pointers with it | 1 + 69 | The format calls this the source's *normalized text* (`ERF-1`); `captures/` was the older word. |
| `received.timestamp` recorded on every source | 71 | `ERF-2`: a source whose raw file is mutable at its location must say when it was fetched, or nothing says which version was read. Each date comes from the header the trial's own pipeline wrote into the held text; the two sources holding no text take theirs from the corpus's own record of the attempt. |
| Held-text headers rewritten as HTML comments | 22 | Twenty-two files carried their provenance header as a `---` block, which CommonMark reads as a heading and `ERF-51` therefore folds into the normalized text. An HTML comment folds to nothing, which is what a header that is not the work's own text has to do. |
| `excerpt` recorded on two sources, and their headers corrected | 2 | Both hold a passage of a Federal Reserve Board paper and both said `excerpt: false`. `ERF-69`: a normalized text that is an excerpt must record who selected the passage and when. |
| Quotes corrected against the normalized text | 3 | See below. |
| Working-note vocabulary in the source list | 2 | The list's header comment named the trial's internal run vocabulary and a document outside this repository; one `reason` referred to an authoring aid that does not travel with the corpus. |

The three quotes, in full, because a corpus about checkable evidence owes an
account of every quote it touched:

- **`acx-117`** quoted `doesn’t` where the normalized text has `doesn't`. An
  author who retypes a quote tidies it, which is what `ERF-6` forbids and
  what the check exists to catch. The quote now has the apostrophe the text
  has.
- **`acx-22`** and **`acx-31`** each ran two paragraphs of the source
  together as one. `ERF-52` does not let a span cross a paragraph boundary
  unless the quote holds the same break, on the reasoning that splicing a
  heading or the end of one paragraph onto the prose after it makes the
  source say in one breath what it said in two. The break is restored in
  both; not a word changed.

Thirteen working-note bodies point at their author's friction log by a name
that was internal to the trial: `claimsA-friction.md` is the trial folder's
`ai-capex-09-claims-a-friction.md`, `claimsB-friction.md` is
`ai-capex-10-claims-b-friction.md`, and `final-friction.md` is
`ai-capex-11-surveys-narratives-friction.md`. The pointers are left as
written rather than corrected, because editing a claim's body sets its
`last_modified` (`ERF-48`) and would then age every narrative binding
resting on it (`ERF-32`), which is a lot of noise for a cosmetic fix. This
paragraph is the map instead.

One thing was deliberately **not** rewritten. A search act in
`ai-attributable-revenue-evidence-rerun-2026-08-25` records its scope as
`corpus/captures/*.md`, which is the folder's old name. `ERF-28` makes what
a survey conducted immutable: a search already run cannot have run
differently, and editing the record of where it ran to match a later rename
would be falsifying it. The path is stale and the record is true.

## What this corpus does not have, and why that is worth seeing

**No standings, so every claim computes to `proposal`.** The ledger is
empty on all fifty-three. Only a person takes a stance (the data model fixes
a standing's author to a `human:` actor), eleven LLM agents wrote this
corpus, and none of them could have stood behind anything in it. The
disposition is computed from that emptiness rather than inferred from how
good the evidence looks, which is the point: a well-evidenced claim nobody
has committed to is a proposal, and the format says so.

**No claim cites a survey.** All six surveys are searches over the corpus
itself, run by the closing author, and each is a real record of what was
sought and what came back. Two of them record an absence, which is the thing
only a survey can evidence. None is attached to a claim, so the claims that
could rest on that coverage do not. That is a gap the closing author left,
and it is left standing.

**A hundred and twenty of the 151 atoms carry no audit verdict.** Thirty-one
were audited by two vendors' LLMs, 62 verdicts in all. The rest have a quote
that checks and a finding nobody has yet judged against it, which the
viewer's health page lists one by one.

**Two sources hold no normalized text.** One page carries an explicit
anti-redistribution clause that reaches even short excerpts, so the
quotation route is closed to it; the other returned a bot-check page rather
than the article. Both are recorded with a status and a reason rather than
dropped, so a reader can tell a decision from an oversight. Neither is
quoted by any atom, so every quote in the corpus checks.

## Its shape

```
corpus.yaml               the declaration
sources.yaml              the source list: citation, locator, licence, normalized text
atoms/<id>.md             151 atoms, one file each
claims/<id>.md            53 claims
surveys/<id>.md           6 surveys
narratives/<slug>.md      3 narratives, with bindings into the claims
normalized/<id>.md        69 held texts, one per source that ships one
```

The layout is one arrangement rather than a rule. Records self-describe with
`type` and `corpus` (`ERF-54`), so nothing about a record's meaning depends
on the folder it sits in.

## Date

Authored 2026-08-25; brought to conformance and copied here 2026-08-26,
against specification version 0.9.0.
