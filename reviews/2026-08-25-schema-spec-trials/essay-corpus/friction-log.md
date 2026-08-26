# Friction log, building a top-down corpus from the spec, cold

Twenty-four entries, one per moment. Every place the specification, the schema
or the binding made me guess, re-read or invent; every place the validator
disagreed with my reading of the text; every place the workflow (narrative →
claims → atoms) fought the format or the format fought back.

Built from `SPEC-as-tried.md`, `SCHEMA-as-tried.json`, `BINDING-as-tried.md`,
`rust-validator/README.md` and the essay. Nothing else under
`epistemic-record-format/` was read.

---

## F-00 · 2026-08-25 · The temptation, recorded as instructed

Listing `rust-validator/` to find the binary showed `ambiguities.md` (28 KB)
and the validator's own `friction-log.md` (9 KB) sitting beside the README I
was allowed to read. Twenty-nine ambiguities, already enumerated by someone
who had just done the same cold read, is exactly what I wanted at the moment I
was picking `ell-001` as an atom id. I did not open either. Recording it
because the temptation is itself the finding: the validator's README *names*
its ambiguity file and cites entries from it by number ("the contested reading
A3", "A22", "A26") while withholding the file, which converts a documentation
convenience into a standing invitation. If a trial wants a cold build, the
README handed to the builder should not cite the answers by number.

---

## F-01 · 2026-08-25 · ERF-2 and ERF-7 disagree about a file received by hand

The essay arrived as a file, not from a URL. ERF-7: "A file received by hand
has no locator and no `received`." ERF-2: "A corpus that holds the raw file
records where, in `received.path`." I hold the raw file *and* received it by
hand, so the two requirements point opposite ways: ERF-7 says write no
`received`, ERF-2 says write `received.path`.

I went with `received: {path, digest, timestamp}` and no `url`, because
ERF-2's purpose (a reader can find the bytes the author held) is served and
ERF-7's purpose (a citation is not a locator) is not violated by a path. But I
had to pick, and the spec gave me no rule. ERF-7's sentence appears to be
about `received.url` specifically and to have overreached into `received` as a
whole.

**Suggested fix:** ERF-7's last sentence should read "has no locator", full
stop; whether it carries a `received` is ERF-2's business.

---

## F-02 · 2026-08-25 · ERF-13's atom-id shape is a MUST the schema cannot see

ERF-13: an atom's `id` "MUST be permanent: a mint-time prefix and a sequence
number (`kwg-117`)". The schema's `Id` accepts any non-whitespace string. The
validator README says it *flags* an id that is not prefix-plus-sequence and
notes the prose and schema disagree. So a MUST in section 4.2 is enforced as a
flag, and the shape it requires is given only by example: is `ell-001` a
sequence number, or must it be `ell-1`? Is `essay-2026-08-19` (my source id) in
scope at all? I guessed zero-padded three digits and a corpus-initials prefix,
and nothing told me whether padding was allowed until the run came back clean.

This also collides with the claim ids the binding's own worked example uses
(`citators-disagree-on-negative-treatment`), which are not
prefix-plus-sequence, so the rule holds for atoms only, which ERF-13 says and
ERF-36 does not.

---

## F-03 · 2026-08-25 · ERF-68 has no route for a work with no SPDX identifier

The essay is an unpublished manuscript, all rights reserved, held in full by
the corpus whose owner wrote it. ERF-68: a shipping source "SHOULD name the
licence that permits it as an SPDX identifier **where one exists**, with the
plain name alongside". No SPDX identifier exists for "the author owns this and
holds it in his own corpus", so I wrote `licence_name` alone and no `licence`.

The validator flags it anyway: *"a source whose normalized text ships SHOULD
name its licence; absent, it is unclear whether `status: shipped-as-quotation`
was owed instead."* Its reading is that `licence` is the field that discharges
the SHOULD; mine was that `licence_name` discharges it in the case ERF-68
explicitly carves out. Both readings are available in the text.

**The flag stands in this corpus, deliberately.** The alternative was to
invent `LicenseRef-author-all-rights-reserved`, which is legal SPDX syntax and
a fabrication of a licence that does not exist.

**Suggested fix:** ERF-68 should say which field satisfies it when no SPDX
identifier exists, or the schema should make `licence_name` alone sufficient.

---

## F-04 · 2026-08-25 · ERF-69 silently forbids a multi-passage excerpt

This one changed the shape of every tool I then wrote.

ERF-69 lets normalized text be "an excerpt of the work rather than a whole
copy". Two sentences later it requires: "the normalized text MUST occur, under
the folding of `ERF-51`, in the normalization of the whole extracted source."

An excerpt made of two passages from different parts of a document *occurs
nowhere in the source*. So the fidelity check makes every excerpt necessarily
**one contiguous passage**, and the format never says so. The consequence is
operational and large: a 6,000-word web page from which I want to quote
paragraph 3 and paragraph 40 cannot be one source with a two-passage excerpt.
It must be either one source holding a contiguous span covering both (which
may be the whole document, defeating the point of excerpting) or two sources
over one work (which ERF-3 forbids: "one entry per work").

I rewrote `tools/erf_excerpt.py` to accept exactly one range, and every web
source in this corpus is a single contiguous excerpt as a result. Where the
evidence I needed sat too far apart, I took a wider excerpt than I wanted.

**Suggested fix:** say it. Either "an excerpt MUST be one contiguous passage",
or define the fidelity check over each passage of a multi-passage excerpt
independently.

---

## F-05 · 2026-08-25 · ERF-51 leaves the closing emphasis marker whenever the emphasized text ends in punctuation

The sharpest technical finding of the build, and both my implementation and
`erfval` agree on it, which is what makes it a specification problem and not a
bug.

ERF-51 step 2 removes a marker run "that has a word character on **exactly one
side** of the run", and keeps a run with word characters "on both sides
(`MAX_LEN`, `3*4`) or on neither (`a * b`, a lone footnote star)". The spec's
own worked example is "`**bold**` folds to `bold`", which is true: the closing
`**` has `d` on its left and a space on its right.

But the essay is written in bold-run headers that end in a full stop:

```
- **Epistemic types for text.** Mainstream tools file text by subject, …
```

The closing `**` here has `.` on its left and a space on its right. **Neither
is a word character, so the run is kept.** The normalized text reads
`Epistemic types for text.** Mainstream tools file text by subject`.

Consequence, verified against `erfval`:

| quote | verdict |
|:--|:--|
| `Epistemic types for text.` | passes |
| `Epistemic types for text. Mainstream tools file text by subject` | **VIOLATION ERF-52** |

A reader copying one sentence out of the *rendered* essay, where it reads
exactly as the second row, gets a conformance violation, and the diagnostic
says the quote "does not occur in the normalized text as whole words", which
does not point at emphasis markers at all. Nothing in ERF-51 or ERF-52 warns
that markdown emphasis can survive the fold; the note attached to ERF-51 says
the sequence exists so that "an author who retypes rather than copies is
guessing at their own evidence", but here the author who *copies* is punished
and the one who copies from the markdown source is rewarded.

The validator's README brushes the same wound from the other side: its
fabrication suite records `Revenue fell 12*.*5 percent` passing, and notes
"what a reader sees rendered and what the check compares are not the same
string, which nothing in ERF-51 says". That is the benign half of this. This is
the malignant half: the same gap makes an honest quote fail.

**Suggested fix:** step 2 should remove a marker run that has a word character
on exactly one side **or** that is bounded on one side by a non-word,
non-whitespace character and on the other by whitespace or a boundary, or,
more simply, ERF-51 should be defined over rendered CommonMark inline content
rather than over raw markdown, since ERF-67 already pins the dialect.

---

## F-06 · 2026-08-25 · Where does a claim end and a passage begin? The format has no opinion, and the top-down workflow needs one

Working narrative-down, the first real decision is granularity, and the format
declines it in both directions. ERF-31: "A passage that asserts something
SHOULD end with a narrative binding." Section 4.3: "if a reader cannot
disagree with the sentence, it is not a claim yet." Neither says whether the
essay's sentence

> "Knowledge work has no diff for arguments, no test that runs on claims as a
> document grows, no lint for provenance, so the corresponding disciplines
> haven't crystallized."

is one claim or four (three universal negatives plus an inference). I made it
four, because the three absences have different evidence and the inference is
an `argument` over them, and because ERF-24's premise contract only works if
the inference is separable from its premises. But nothing in the format told
me that, and a corpus that made it one claim would be equally conforming and
completely unauditable — its single `evidence_audit` would have to answer four
different questions at once.

The format has an `epistemic_kind` that varies the backing contract and a
`decomposes-into` relation, and never connects them: the rule
"a claim whose backing contract differs across its parts MUST be decomposed"
is the missing sentence.

---

## F-07 · 2026-08-25 · ERF-55's "empty lists MUST be omitted" fights the top-down order of work

Building narrative-first means claims exist before their evidence. The natural
intermediate state is a claim with `atoms_for: []` — "I know this needs
evidence, I have not got it yet". ERF-55 makes writing that a **violation**,
and ERF-56 makes omitting it mean "none", so the format cannot distinguish
*no evidence sought* from *evidence sought and none found*. The second is
exactly what a survey with zero yield records, so the format has a vocabulary
for it on the survey side and none on the claim side.

In practice this meant every claim in this corpus passed through a state where
its file lied about its own completeness. That is a real cost of the top-down
workflow the format does not acknowledge, and it is the reason
`tools/build_records.py` drops empty lists rather than my writing them: the
builder had to become a censor.

---

## F-08 · 2026-08-25 · "Take no standings" and ERF-49 pull against each other

The brief (correctly, per ERF-21) says leave every claim a proposal. ERF-49
flags an unbacked `observation` "someone stands on", and the validator reads
"someone stands on" as a disposition other than `proposal` or `retired`. So in
a corpus of pure proposals **ERF-49 can never fire**, and the one check that
would tell the author "this claim of yours has no evidence at all" is silent
precisely in the state where an author most needs it, before he has ruled on
anything.

I therefore had to track unbacked claims myself, outside the format, and they
are listed in `README.md`. The format's own answer to "what did you assert
without evidence?" is unavailable to a corpus that has not yet been adjudicated.

---

## F-09 · 2026-08-25 · The narrative is prose "authored by a person and never generated", and this corpus's narrative is a copy

ERF-34 and section 4.6: "It is prose, authored by a person and never
generated." My narrative file is the essay's own prose with narrative bindings
inserted. That is the intended use, but it means the corpus now holds the
essay's text twice: once as `normalized/essay-2026-08-19.md` (the source I
quote against) and once as `narrative/…md` (the document I bind). Nothing in
the format relates the two, and nothing stops them drifting apart. A quote
check runs against the first; a narrative binding's anchor check runs against
the second; and no requirement says they must be the same text.

For a corpus whose subject *is* one document, which is the top-down case the
brief asked for — that is a real hole. `ERF-32` and `ERF-47` carefully detect a
claim moving under a binding, and nothing detects the narrative moving away
from the source it was minted from.

---

## F-10 · 2026-08-25 · `hits_reported` "as the instrument reported it" cannot be satisfied by the instrument I have

ERF-27: `hits_reported` "MUST record each act's yield as the instrument
reported it, as text, and MUST NOT state precision the instrument did not
give." The search tool available to me returns a ranked list of results and no
count at all, no "About 12,400 results", no total, nothing. So the only
honest value is a description of what came back ("10 results returned; the tool
reports no total"), which is a statement about the tool rather than a yield.

Every survey in this corpus carries that shape, and it is worth the format
knowing: `hits_reported` was designed against instruments that report counts
(grep, a search engine's results line) and an LLM-facing search API is not one.
A zero-yield survey is still expressible; a *sparseness* reading is not, because
"10 results, none relevant" and "10 of 12,400 results, none relevant" are the
same string here and mean very different things.

---

## F-11 · 2026-08-25 · ERF-26's "concrete instrument" collides with a hosted search API whose version is not observable

ERF-26: "A category ('web search') is not an instrument, and yields are
comparable only where instruments are named." The instrument I used is the
`WebSearch` tool of the Claude Code harness, which fronts an unnamed and
unversioned upstream index that can change between two acts in the same
sitting. I wrote `tool: "WebSearch (Claude Code harness, Brave-backed index),
2026-08-25"` and it is the most concrete thing available; it is still not a
name a second party could re-run against. That is a limit of the environment,
but ERF-26's comparability promise is void for every survey conducted with a
hosted assistant search tool, which is going to be most of them.

---

## F-12 · 2026-08-25 · The bet has no place to record its resolution date

Section 4.3: "For a bet, record the decision it licenses in the `why` of the
`for` entry that backs it, and the outcome in the `why` of the `withdrawn`
entry that ends it." Both live in `standings`. A corpus that takes no standings
,  which is what an LLM building a corpus for a human to rule on must produce , 
therefore has **nowhere at all** to write what would settle a bet or by when.

The essay's bets ("if that holds, knowledge work gets its own round of
methodologies", "the records outlast any particular LLM") are exactly the
claims whose value depends on a resolution criterion, and the format's only
slot for one is a field an LLM is forbidden to write. I put the resolution
criterion in the claim body under working notes, which is the only place left,
and no requirement makes anybody look there.

---

## F-13 · 2026-08-25 · `evidence_audit` staleness makes the honest order of work look broken

ERF-47 flags an `evidence_audit` older than "the last change to what it
judged", and the validator computes that against the claim, its cited atoms
*and* its cited surveys' `conducted` stamps. Building a corpus in one sitting
at date precision, every audit I could honestly record carries the same bare
date as the atoms it judged, which ERF-47 rescues ("two bare dates that are
equal read as current"). But the moment I added one atom to a claim after
auditing it, the audit went stale and the only fix was to re-run it, which at
this volume means re-running an LLM audit for a single added atom.

The rule is right. The cost is that a top-down corpus, where evidence keeps
arriving after the claim exists, re-audits constantly, and the format offers no
"audited as of these N atoms" scoping even though `ERF-20` invented exactly
that idea for standings (`evidence_at_stance`) and did not give it to audits.

---

## F-14 · 2026-08-25 · ERF-31 makes the anchor's uniqueness the author's problem and does not say so

The narrative bindings are checked by "the anchor MUST occur in its passage".
My first pass anchored several passages on short phrases that also occur
earlier in the same passage; the check passed, but the anchor no longer
identifies a *spot*, which is what ERF-31 says an anchor is for ("The anchor is
how software finds the spot after the prose moves"). A validator that only
tests occurrence cannot tell a locating anchor from a decorative one, and the
requirement never asks for uniqueness. I lengthened every anchor by hand to
make it unique within its passage; nothing made me.

---

## F-15 · 2026-08-25 · A survey cannot cite the atoms that defeated it

ERF-25 and section 4.5: a survey backs an absence reading, and "a survey cannot
disconfirm a gap claim, because what disconfirms it is a found source, and a
found source is atom-shaped". Right. But the surveys in this corpus are the
opposite case: I searched for the opposite of the author's universal negatives
and **found things**, so the survey's yield is the counter-evidence. The record
shape handles it (`notable_results[].atoms`), and the *claim* then has to carry
the same survey in `surveys` (a backing list, read as coverage) while the atoms
it produced sit in `atoms_against`. So one survey plays two roles on one claim
and the field names say only one of them: `surveys` is documented as what the
observation's backing "includes" (ERF-24), never as what refuted it.

Reading a finished claim, you cannot tell from the field names whether its
survey supports its coverage or destroyed it. Only the body says.

---

## F-16 · 2026-08-25 · One work in two formats, and ERF-3 admits only one

The essay exists as a markdown source and as the typeset PDF that was actually
circulated. They are the same work. ERF-3: "A corpus MUST keep a source list,
one entry per work."

So the corpus can register the copy it quotes against (the markdown, where the
fold behaves) or the copy a reader holds (the PDF), and not both. I registered
the markdown and deleted the PDF from `corpus/raw/`, which means this corpus's
provenance chain runs to an artefact the essay's readers never saw.

The format has a precise vocabulary for the raw file, for extraction and for
normalization, and no vocabulary at all for *the same work manifested twice*.
The natural answer, two sources with a stated relation, is unavailable because
sources carry no relations. The other natural answer, one source with two
`received` blocks, is unavailable because `received` is a single object.

## F-17 · 2026-08-25 · There is nowhere to record that a source could not be retrieved

Two retrievals failed on 2026-08-25: `w3.org/TR/prov-o/` and
`peerj.com/articles/cs-78/` both served a bot challenge to `curl`, and
`getguru.com/product/verification` returned a 404. In each case I fell back to
a weaker source and graded the atom `medium` with the fallback stated in
`limitations`.

The source list's `status` vocabulary covers three kinds of *rights* absence
(`not-redistributable`, `access-restricted`, `licence-unverified`) and no kind
of *retrieval* absence. A source I could not fetch has no entry at all, so the
corpus's record of "I tried the primary and could not get it" lives in an
atom's `limitations` and in a survey body, where no check will ever look at it
and no reader will find it by field.

This matters more than it sounds: the difference between "the author cited
Wikipedia" and "the author tried the W3C recommendation, was refused by a bot
challenge, and cited Wikipedia" is the whole of the reader's trust calculation,
and the format gives it no home.

## F-18 · 2026-08-25 · ERF-18's restatement rule is vacuous for any corpus a producer writes

ERF-18: "The body SHOULD open by restating [the title], and keeping the
restatement verbatim is what makes later drift visible to a reader." The
validator flags a body that does not open with the title verbatim.

My builder writes the title into the body. So the check can never fail, and the
drift it exists to expose cannot occur, because there is only one copy of the
string in the system that anyone edits. Seventy claims carry a duplicated
30-to-40-word title for a reader's benefit and for no checker's.

The rule is written for a human author typing a body under a title. Under a
producer it is 2,000 words of duplication and a check that is true by
construction. Neither the requirement nor the conformance classes distinguish
the two cases, and section 1's Producer class is exactly where that distinction
would live.

## F-19 · 2026-08-25 · An atom cannot say where in its source the quote sits

ERF-4 puts the locator on the source: "A source's citation, locator and
normalized text live on the source and never on the atom." That is right for
the *work*'s locator, `received.url`. It leaves nowhere for the *quote*'s
position within the work.

For a source whose normalized text is a 6,000-word excerpt, twelve atoms all
say "somewhere in here". The reader's recourse is to search the normalized text
for the quote, which works, and which means the format has made position
recoverable rather than recorded. That is a defensible trade and it costs
something a citation practice normally has: a page number, a section, a
paragraph. `citation_text` can carry a locator "when it matters" (section 4.1)
but `citation_text` is per-source, so it can carry one locator for twelve
atoms.

## F-20 · 2026-08-25 · The corpus is 10 MB and most of it is raw HTML nobody will read

`corpus/raw/` holds 40 retrieved files, 8.9 MB of them, almost all
JavaScript-heavy marketing HTML from which one paragraph was taken. ERF-2 wants
the raw file held so the extraction can be re-run; ERF-71 wants the digest so a
reader can confirm the bytes. Both are right and both are satisfied.

The consequence nobody states: a corpus that quotes 40 web pages ships two
orders of magnitude more bytes of unread HTML than of the evidence it exists to
carry. This corpus's atoms, claims, surveys and narrative together are about
370 KB. A deployment quoting a thousand pages will hold gigabytes of vendor
markup, and the format's own security section, which thinks carefully about
whether *normalized texts* may travel, says nothing about the raw files, which
are the bulk and are equally copyrighted.

## F-21 · 2026-08-25 · Where the workflow and the format actually fought

Narrative → claims → atoms is the order the brief asked for and it is the
opposite of the order the format's own machinery rewards. Three specific
collisions, each already logged in its own entry, but they are one thing:

- **ERF-55 forbids the natural intermediate state** (F-07): building down means
  claims exist before evidence, and a claim with `atoms_for: []` is a violation.
- **ERF-49 cannot fire in a corpus of proposals** (F-08): building down means
  nobody has ruled yet, so the one check that finds unbacked claims is off in
  exactly the state that produces them.
- **ERF-47 punishes evidence arriving late** (F-13): building down means atoms
  keep arriving after the claim, so every backing audit ages the moment the
  search-for-the-opposite succeeds.

Read together, the format assumes evidence-first: capture, then assert, then
bind prose to what is asserted. That assumption is nowhere stated, and the
specification's own framing ("what a source *said*, what an author *claims*")
puts them in that order without saying it is an order of work. A section
saying "this format assumes evidence precedes assertion, and here is what
changes if you work the other way" would have saved me three of the fifteen
entries above.

---

## F-22 · 2026-08-25 · ERF-12 is right and batching makes it expensive

ERF-12: "a failed, unparseable or abandoned audit MUST NOT be written as
[a verdict]. An audit that produced nothing did not happen." Correct, and the
strongest small rule in the specification.

Running it against a batched LLM auditor showed the cost. Six passes over 133
atoms, ten per call: some calls returned clean `id: VERDICT` lines and some
returned nothing parseable at all, and a batch that failed took its ten atoms
down with it whatever the model actually thought about each. Ten atoms are
unaudited at the end and carry no `finding_audit` key, which is the correct
outcome and is also indistinguishable, in the record, from ten atoms nobody
ever tried to audit.

The format has no way to say **"an audit was attempted here and did not
complete"**. ERF-12 makes writing a verdict forbidden, which is right, and
leaves the attempt with no trace, which loses the one fact a person needs to
decide whether to re-run: was this never audited, or has it failed four times?
`ERF-20` invented `evidence_at_stance` for exactly this class of
unrecoverable-context problem on the standings side and gave nothing equivalent
to audits.

## F-23 · 2026-08-25 · The specification's craft guidance for a finding is one paragraph and the failure rate is a third

Section 4.2 on writing a finding well is four sentences: state what the quote
shows rather than restating it, name the actor and the time scope, hedge
exactly as hard as the source does, compression is a defect.

I wrote 133 findings under that guidance, believing I was following it. A
second vendor's model, given the citation, the quote and the finding and
nothing else, returned `PARTIAL` on 46 of the 123 it judged: the finding
claiming more scope, certainty or specificity than the quote carries. One came
back `UNSUPPORTED` and was a straightforward defect I had not noticed.

That is not a complaint about the guidance, which is good. It is a measurement
the specification does not have and would benefit from: **the craft rule that
matters most is the one with no mechanical check behind it, and its natural
failure rate in careful hands is around a third.** Section 4.2 says "the schema
checks structure; it cannot check craft" and then spends one paragraph on the
craft. The proportions are backwards relative to where the errors are.
