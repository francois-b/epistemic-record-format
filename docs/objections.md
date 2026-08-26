---
title: "Objections"
purpose: "The strongest honest case that this format cannot work, is naive, or reinvents something that already tried and failed, kept so it can be checked against rather than re-argued."
status: non-normative
generated: 2026-08-26
model: claude-opus-5
last_updated: 2026-08-26
---

# Objections

This document collects the strongest case a sceptical, well-read reader
could make against the Epistemic Record Format. It is not a risk register
and it is not balance for its own sake. Each entry is an argument someone
would actually raise, with the prior art or the measurement that grounds
it, the condition under which it bites, and an honest note on where the
format currently stands. It exists so that the objection can be checked
against a written answer instead of re-argued from scratch every time it
surfaces, and so that the author cannot quietly forget the ones that have
not been answered.

An objection stays here only while it survives. Research killed several
of the candidates outright, and those are listed at the end with the
reason rather than kept as decoration. When an objection is answered by a
change to the format, its "Where the format stands" section says so and
names what changed; when it is confirmed, that is recorded too. A document
that lists every objection anyone could think of is less useful than one
that lists the ones still standing.

---

## 1. The standings ledger, the format's headline novelty, is empty in every corpus the project ships

**The objection.** `docs/influences.md` closes by naming two elements that
appear in no surveyed prior art, and the standings ledger is the first of
them. Yet across both corpora this repository publishes, 59 claims in
total, not one carries a standing. The reference practice's own author
keeps his positions outside the format entirely, in a separate essay
system. A format whose distinguishing feature is unexercised by its
inventor across a year of practice has not discovered a missing primitive;
it has designed a field nobody fills, which is the exact failure mode the
project's own subtraction ledger was built to catch.

**What grounds it.** Measured in this repository on 2026-08-26.
`examples/corpora/2026-08-26-ai-capex/` holds 151 atoms, 53 claims, 6
surveys and 71 sources; `grep -l "^standings:" claims/*.md` returns zero.
`examples/corpora/minimal/` holds 9 atoms and 6 claims; also zero. The
README states the consequence plainly: "Every claim computes to
`proposal`, because nobody has stood behind any of them." `docs/design-history.md`
goes further: "The reference practice deliberately does not [keep a
register of its author's positions]. Its author's positions live outside
the format, in a separate writing system: 109 essays, each carrying a
headline position, each revised about once a quarter, none of them leaned
on as a premise by any claim in any corpus."

The force of this comes from the project's own standard. `docs/design-history.md`
states that "candidates were admitted only on a demonstrated need (a
'forcing instance') and retired on demonstrated non-use," and
`docs/non-goals.md` records the executions: the `question` record type cut
after "25 records across five corpora, every one `status: open`,
`answered_by` never written once in a year"; `accepted` on an audit entry
cut on "zero uses across 1,642 audit entries"; `preference` cut on "zero
uses in 279 typed claims"; `granted` cut on "zero uses across the field's
entire lifetime." Applied consistently, that rule points at `standings`.

The prior art says the same thing from outside. Kialo, the only
per-person stance precedent `influences.md` found, has run since August
2017 and reports roughly 18,000 public debates, 720,000 claims and 1
million votes (https://en.wikipedia.org/wiki/Kialo, figures as of July
2023), and its stance data is a current value overwritten on update, not a
ledger, because that is what people were willing to maintain. Guru, named
in `influences.md` as "the closest shipped analog to a standing anywhere,"
gates its verification behind an expiry timer precisely because unprompted
re-endorsement does not happen.

**What would have to be true for it to bite.** That the standings ledger
is a designed field rather than an extracted one: that in the seven
private corpora behind the format (roughly 740 atoms and 300 claims per
`docs/design-history.md`), standings are also rare, or are minted in bursts at
authoring time and never revisited, or contain no withdrawals. The test is
a published count: standings per claim, the distribution of stance values,
the number of `withdrawn` entries, and the median gap between a claim's
creation and its first standing. If withdrawals are near zero and most
standings land within a day of the claim, the ledger is a birth
certificate rather than a record of holding a position over time. The
objection dies if a corpus shows standings accumulating after the fact,
including reversals, at a rate that tracks the corpus's size.

**Where the format stands.** Unanswered, and the strongest objection in
this document. The specification is coherent about standings and the
shipped evidence is silent about them. Two mitigations are real but
partial: `docs/design-history.md` records why the author's own positions are held
outside the format (nothing in that population ever asked for backing or a
ledger), which is a defensible scoping decision rather than an evasion;
and the format is explicit that a claim with no standings is a `proposal`
and conforms, so empty ledgers are not a violation. Neither of those
answers the question the sceptic is actually asking, which is whether
anyone ever writes the second half of the record.

---

## 2. On the flagship corpus, the mechanical quote check verifies the quote against a passage the quoting pipeline chose

**The objection.** The format's foundational promise is that a quote is
checkable against a held copy of its source, mechanically, years later. In
the corpus this project ships as its showcase, every one of the 69 held
texts is not the work but an excerpt of it, median 2.1 kB, selected by an
LLM at capture time. The quote check therefore runs against a passage chosen by
the same pipeline that chose the quote, and it reports 151 of 151 passing.
The specification anticipates this and requires (`ERF-69`) that the
excerpt be checked to occur in the normalization of the whole source, but
the reference validator prints that requirement under `NOT-CHECKED`. So
the one mechanical guarantee the format is built on is, on its own
evidence, a check that the copy contains the copy.

**What grounds it.** Measured in this repository on 2026-08-26.
`examples/corpora/2026-08-26-ai-capex/sources.yaml` carries 71 sources: 59
`shipped-as-quotation`, 10 `shipped`, 1 `not-redistributable`, 1
`access-restricted`. All 69 held texts under `normalized/` carry an
`excerpt: true` provenance header and none is a whole work; they range
from 694 to 4,351 bytes, median 2,125. `npm run check --
examples/corpora/2026-08-26-ai-capex` reports `QUOTE 151 passed, 0 failed,
0 uncheckable of 151 atoms`, zero violations, and among its `NOT-CHECKED`
lines: `ERF-69 whether an excerpt carries enough adjacent text; a
judgment`. The validator does not run the fidelity half of `ERF-69`
either, which is mechanical rather than a judgment: the requirement says
the normalized text "MUST occur, under the folding of `ERF-51`, in the
normalization of the whole extracted source," and nothing in the shipped
run performs it, because the whole extracted source is not in the
repository. Of the 71 sources, 54 carry a `received.digest`, so for 17 a
reader cannot confirm they hold the same raw file even after fetching it.

The project has already been bitten here once, and it is worth spelling
out, because it is the sharpest available evidence that a substring test
reads as more than it is.
`docs/findings/F-008-a-fabricated-quote-passes-the-quote-check.md` records
that on the first day the specification was read by anyone else, a Go
implementation demonstrated that the quote `"The cat[...]sat"` passes
against the text "The catapult was heavy. Someone eventually sat on the
mat beside it." Every condition the requirement stated was satisfied and
the verdict was PASS. The finding is filed as a "ship-blocker for 0.9,"
described in the repository's own words as going to "the soundness of the
mechanism the whole format rests on," and it was ruled the same day. That
the project caught, recorded and fixed it within hours is to its credit.
That the mechanism was unsound as written until an outsider read it is the
point the sceptic will make.

**What would have to be true for it to bite.** That excerpt selection
introduces errors a whole-source check would catch. The falsification is
cheap and the format already specifies it: obtain the raw files at
`received.url`, confirm the digests where present, re-run the extraction
tools named in `ERF-70`, and test that each of the 69 held excerpts occurs
verbatim in the full normalized source. If all 70 pass, the objection
reduces to a documentation problem (the validator should say the check is
deferred, not undecidable) and the reported 151 of 151 keeps its meaning.
If any fail, the corpus's headline number was never what it appeared to
be. A second test targets context rather than fidelity: sample excerpts
whose surrounding sentences reverse or qualify the quoted passage, and
measure how often the excerpt window drops the qualifier.

**Where the format stands.** Partly answered, and the gap is in the
implementation rather than the specification. `ERF-69` states the problem
in as many words ("a text holding the quote alone proves nothing, because
it is a copy of the thing it is meant to check"), requires the whole-source
fidelity check, requires `excerpt.by` and `excerpt.timestamp` so a bad
selection is attributable, and the security section concedes that "a
recipient of the records alone holds citations and locators, not proof."
What is missing is that no shipped tool runs the check, no shipped corpus
demonstrates it having been run, and the validator's summary line reports a
pass rate that a reader will take to mean more than it does.

---

## 3. The judgment that actually matters is delegated to an instrument measured at 55 to 85 per cent on this exact task, and the shipped verdicts never once say no

**The objection.** The mechanical check settles whether text was copied.
Everything a reader cares about (does this quote, in its context, support
this finding) is the semantic judgment, and the format hands it to an LLM
auditor. The published accuracy of LLMs on precisely this attribution
judgment ranges from 43 per cent to 85 per cent depending on system and
dataset, and trained human annotators only reach Krippendorff's alpha
around 0.7 to 0.8 on it, so there is no clean ground truth to appeal to
either. In the flagship corpus, 31 of 151 atoms carry an audit at all, and
of the 62 verdicts recorded, 60 are `SUPPORTED`, 2 are `PARTIAL`, and none
is `UNSUPPORTED`. An instrument that has never returned a negative verdict
has not been shown to discriminate.

**What grounds it.** Measured accuracy on the attribution judgment:
Yue et al., "Automatic Evaluation of Attribution by Large Language Models"
(EMNLP Findings 2023, https://arxiv.org/abs/2305.06311) report zero-shot
ChatGPT at 43.2 per cent on AttrEval-Simulation and 55.0 per cent on
AttrEval-GenSearch, and GPT-4 at 55.6 and 85.1 per cent, with the authors
cautioning that the higher figure is inflated because GPT-4 generated the
examples it grades. Li et al., "AttributionBench" (Feb 2024,
https://arxiv.org/abs/2402.15089) put the best fine-tuned system at
roughly 80 per cent macro-F1 and describe the task as still showing
"substantial difficulty." The human ceiling on the same judgment is not
much higher: Rashkin et al., "Measuring Attribution in Natural Language
Generation Models" (Computational Linguistics 49(4), 2023,
https://arxiv.org/abs/2112.12870) report Krippendorff's alpha of 0.76,
0.69, 0.79 and 0.74 across four datasets for the AIS judgment.

Multiple auditors do not repair this. "Nine Judges, Two Effective Votes:
Correlated Errors Undermine LLM Evaluation Panels"
(https://arxiv.org/abs/2605.29800, May 2026) finds that a panel of nine
frontier LLMs across seven model families carries about two independent
votes' worth of information, loses roughly 75 per cent of nominal
independence to correlated mistakes on the same items, falls 8 to 22
percentage points short of what true independent voting would achieve, and
is matched or beaten by the single best judge in every condition tested.
"Correlated Errors in Large Language Models"
(https://arxiv.org/abs/2506.07962) reports that error correlation is
higher, not lower, among more individually-accurate LLMs and among LLMs
sharing a developer, with two LLMs agreeing 60 per cent of the time when
both are wrong.

The wider grounding market publishes no error rate to compare against.
Google's Vertex AI check-grounding documentation
(https://docs.cloud.google.com/generative-ai-app-builder/docs/check-grounding,
fetched 2026-08-26) returns a 0 to 1 support score and publishes latency
but no accuracy, precision or recall figures. Anthropic's Citations
documentation
(https://platform.claude.com/docs/en/build-with-claude/citations, fetched
2026-08-26) makes no accuracy claim; the "up to 15% recall accuracy"
figure exists only in the January 2025 launch post, with no published
methodology. Independently, Liu, Zhang and Liang, "Evaluating Verifiability
in Generative Search Engines" (EMNLP Findings 2023,
https://arxiv.org/abs/2304.09848) found that across four commercial
generative search engines only 51.5 per cent of generated sentences were
fully supported by their citations and 74.5 per cent of citations
supported the sentence they were attached to, which is what the
state of the art looks like when someone does measure it.

The corpus figures come from this repository, 2026-08-26:
`grep -l finding_audit atoms/*.md` returns 31 of 151 in the ai-capex
corpus; the verdict tally across those entries is 60 `SUPPORTED`, 2
`PARTIAL`, 0 `UNSUPPORTED`, across two auditors (`deepseek-v4-pro` and
`gemini-3.5-flash`) under one protocol (`capex-audit-v1`).

**What would have to be true for it to bite.** That the auditors would
pass a bad atom. The test is a seeded run: take a sample of the corpus's
atoms, corrupt the findings in known ways (overstate the hedge, swap the
actor, widen the time scope, drop the qualifier the excerpt's next
sentence supplies), re-run the same protocol, and measure the detection
rate and the false-positive rate on the untouched controls. If the
auditors catch most seeded defects and leave the controls alone, the 60
of 62 `SUPPORTED` is a clean corpus rather than a blind instrument, and
this objection weakens to a coverage complaint about the other 120 atoms.
If detection is near chance, the audit field is recording an instrument
that agrees with whoever wrote the prompt.

**Where the format stands.** Partly answered in the specification, unanswered
in the practice. `ERF-11` is unusually careful: the judgment "is not
recomputable and MUST be recorded per auditor," verdicts under different
protocol versions "MUST NOT be read as like for like," the auditor is a
bare instrument identifier rather than an actor because "an audit entry
names the instrument that rendered a verdict, not a role in the practice,"
and a failed or unparseable audit MUST NOT be written as a verdict. The
non-normative note under `ERF-25` states the correlated-error problem
before the literature did: "Models trained on overlapping corpora share
failure modes, and two SUPPORTED verdicts can be one correlated error
wearing two names." That is the right position, and the format deserves
credit for holding it. What the format does not do, and does not claim to
do, is tell a reader how much a `SUPPORTED` is worth. With no published
detection rate for the protocol and no negative verdicts in the shipped
corpus, `finding_audit` currently reads as more assurance than it carries,
and the format's honesty about that lives in a note rather than anywhere a
consumer will see it.

---

## 4. This is the fifth attempt at the same idea, and the labour the LLM removes is not the labour that killed the previous four

**The objection.** Structured capture of claims, evidence and argument has
been built repeatedly since the late 1980s, and it has failed repeatedly,
in research prototypes and in commercial products with real distribution.
The essay's answer is that LLMs remove the manual work that sank knowledge
management the first time. But the documented cause of failure was not
transcription. It was cognitive overhead at capture time, tacit knowledge
that resists being made explicit, structure imposed before the author knows
what they think, and a mismatch between who does the work and who gets the
benefit. The LLM removes the typing. Every one of those four causes lands
on judgments this format explicitly reserves for the human: grading a
source, deciding whether a finding overstates its quote, taking a stance.
The format automates the cheap half and then adds two new chores, audits
and standings, on top.

**What grounds it.** Shipman and Marshall, "Formality Considered Harmful"
(Computer Supported Cooperative Work 8(4), 333-352, 1999,
https://people.engr.tamu.edu/shipman/formality-paper/harmful.html) names
the four causes directly: cognitive overhead, tacit knowledge, premature
structure, and situational structure. Their worked example of overhead is
the Virtual Notebook System, whose interest-profile matcher required users
to choose from 20,000 MeSH terms and which contributed to the project's
abandonment. Their tacit-knowledge example is closer to home: design
students produced IBIS-shaped argument in conversation and failed when
asked to formalize it. The same paper records that Conklin and Yakemovic
"had little success in persuading other groups to use itIBIS" outside the
originating team, and that structured meeting captures "had to be
converted to more conventional prose" for anyone else to read them.
Grudin's "Why CSCW Applications Fail" (CSCW 1988, DOI
10.1145/62266.62273) names the disparity between the person doing the
work and the person receiving the benefit as the general failure mode.

The commercial record is worse than the research record. QuestMap, the
commercial gIBIS descendant, was discontinued. Debategraph is gone:
https://debategraph.org served nothing but a bare placeholder page when
fetched on 2026-08-26. CiTO, the forty-relation citation-typing ontology
`docs/influences.md` already names as a cautionary tale, has "so far not
been wide in publishing" (Journal of Cheminformatics, 2020) and its
reference repository at https://github.com/SPAROntologies/cito carries 16
stars; no count of CiTO-annotated citations could be found. Nanopublications,
which `influences.md` calls "the closest structural ancestor anywhere,"
runs a live network of about 88,700 nanopublications across 18 services on
roughly 6 servers (https://monitor.nanodash.net/, fetched 2026-08-26)
after more than a decade.

The clearest case is the one that succeeded and was killed anyway.
ClaimReview, schema.org's claim markup, accumulated over 250,000 tagged
fact-checks across a decade of collaboration between Google, schema.org
and the Duke Reporters' Lab, and Google reported roughly 4 billion annual
impressions on the resulting snippets as of 2019. In June 2025 Google
deprecated the rich result, describing it as streamlining that affected "a
very small percentage of results"
(https://www.poynter.org/ifcn/2025/google-claimreview-fact-checks-snippets-removed/).
Structured claim annotation reached genuine scale, and the consumer that
gave it its value withdrew.

Against all of this, one piece of evidence cuts the other way and should
be stated: van Gelder's meta-analytic work on argument mapping reports
gains of roughly 0.8 standard deviations on standardized critical-thinking
tests for high-intensity mapping courses, against roughly 0.34 for a full
year of ordinary undergraduate education. The technique works on the
people who use it. The failure is uptake, not efficacy. (This figure comes
from secondary sources citing van Gelder 2015; the primary PDF returned
403 and the number is not independently confirmed here.)

**What would have to be true for it to bite.** That the residual human
cost per record is high enough to stop a practitioner who is not the
format's author. The measurement is minutes: instrument an authoring
session and record human time per atom, per audit adjudication, and per
standing, separated from LLM time. Shipman and Marshall's threshold is
qualitative, so the honest test is comparative rather than absolute: a
second practitioner adopts the format without the author's help and their
corpus is still growing three months later. If it stalls in week two, the
overhead objection is confirmed regardless of what the minute counts say.
The objection weakens if the human cost is dominated by decisions the
practitioner would have made anyway, in prose, less legibly.

**Where the format stands.** Partly answered by design, unanswered by
evidence. The format's deliberate thinness is a direct response to this
history and `docs/purpose.md` says so: four relations where CiTO has
forty, on the reasoning that "the surveyed evidence is that small
vocabularies get used and large ones get skipped." That is the right
lesson from the right cases, and the Web Data Commons record supports it
(the October 2024 crawl found 73.99 billion triples across 16.5 million
domains, overwhelmingly lightweight schema.org rather than heavier
ontologies: https://webdatacommons.org/structureddata/). Plain text in git
rather than a tool also answers Grudin's disparity for the solo case,
since the author is the beneficiary. What is absent is any measurement of
the human cost per record, and any user other than the author.

---

## 5. Copyright makes re-checkability non-transferable, and for the sources a consultant actually cites the frozen copy is contractually forbidden

**The objection.** The format's central promise is a check "anyone holding
both can re-run years later." For most of the sources that matter in
consulting work (analyst notes, subscription news, legal databases), the
vendor's own terms forbid keeping the copy the check needs, quite apart
from any fair-use question. Westlaw's terms say permanent archival storage
is prohibited. Gartner's say you must destroy downloaded content when the
licence ends. Perma.cc, the most legally careful frozen-copy service in
existence, refuses to archive paywalled sources at all. So the format's
guarantee splits in two: the author, who holds the captures, can re-run the
check; the client who receives the records cannot. What travels is a
citation and an assertion that somebody once checked, which is what a
footnote already was.

**What grounds it.** Vendor terms, fetched 2026-08-26. Thomson Reuters'
Westlaw Terms of Use state that "Permanent archival storage is prohibited"
and that on breach "you must immediately destroy all copies of downloaded
materials in your possession or control"
(https://content.next.westlaw.com/StaticPages/TermsOfUse.html). Gartner's
research usage policy forbids reproducing or distributing content and
requires destruction of downloaded content
(https://www.gartner.com/en/about/policies/research-docs). Perma.cc, run
by the Harvard Library Innovation Lab since 2013, excludes paywalled
sources and named databases such as HeinOnline and Westlaw from archiving,
and its stated legal posture is to respond to takedown requests rather
than to clear rights in advance (guidance at
https://libguides.law.unm.edu/LawJournals/perma).

The case law does not rescue retention as such. Bartz v. Anthropic
(N.D. Cal., 3:24-cv-05417-WHA, order of 23 June 2025) held that training
on lawfully acquired books was transformative fair use, and separately that
downloading roughly 7 million pirated books for retention in a permanent
central library was not, in Judge Alsup's phrase "inherently, irredeemably
infringing," with later purchase failing to cure it. The acquisition and
retention of the copy is analysed independently of what is done with it.
Authors Guild v. HathiTrust (2d Cir., 10 June 2014) upheld full-text
search over complete copies but vacated and remanded on the preservation
and replacement copies specifically. Hachette v. Internet Archive (2d Cir.,
4 September 2024) affirmed that controlled digital lending, a strict
one-to-one owned-to-loaned model run by a nonprofit library, was not fair
use. In the EU, DSM Directive 2019/790 Article 4 permits retaining TDM
copies only "as long as necessary" and lets rightholders opt out; Article 3
has no opt-out but is confined to research organisations and scientific
research
(https://eur-lex.europa.eu/eli/dir/2019/790/oj/eng).

The shipped corpus shows the consequence. Of 71 sources in
`examples/corpora/2026-08-26-ai-capex/sources.yaml`, 10 are `shipped`
under a permitting licence, 59 are `shipped-as-quotation` (a short excerpt
under no licence), 1 is `not-redistributable` and 1 is
`access-restricted`. In `examples/corpora/minimal/`, 4 of 9 atoms can have
their check run and 5 cannot. And 54 of the ai-capex corpus's 71 sources
carry a `received.digest`, so for 17 of them a reader who re-fetches the
raw file cannot confirm they hold the same one.

**What would have to be true for it to bite.** That the recipients of a
corpus care about re-running checks. If the value of the format is
internal (the author's own discipline, and the ability to answer "where did
this come from" a year later), the objection collapses, because the author
holds the captures. It bites if the format is sold on external
verifiability, which the README's framing invites ("checkable against
frozen copies of its sources"). The test is a delivery: hand a client the
records with normalized texts stripped per licence, and ask what fraction
of the assertions they could independently verify without re-buying the
sources. If the answer is low, the format's value proposition to a third
party is the discipline it imposed on the author, not the checks it
enables in the reader.

**Where the format stands.** Answered honestly in the specification and
under-stated everywhere else. The `Source.status` vocabulary exists
precisely to record this, with five values distinguishing what may travel
and why, and the security considerations concede the point in as many
words: "anyone holding the corpus *and its normalized texts* can re-run
that atom's mechanical check; a recipient of the records alone holds
citations and locators, not proof." `docs/non-goals.md` records the ruling
that redistribution rules stay outside the spec. That is the right design.
The gap is presentational: the README's headline sentence promises
checkability without the qualifier, and the minimal corpus's 4-of-9 check
rate is explained in prose the reader meets after the pitch.

---

## 6. A survey records a search of the corpus, not a search of the world, and absence claims will be read as the second

**The objection.** `docs/purpose.md` claims surveys as one of the things
nothing else in the field does: "A survey records what was sought, with
which instrument, and what came back. This is what lets a claim about
absence rest on something citable." But in the flagship corpus every
survey searches the corpus's own records. The instruments are `grep` over
151 atom files and manual reading of what `grep` returned. What such a
record evidences is absence from the author's own notes, which is a
statement about the author's collection effort, not about the world. The
format then licenses a claim to cite it as evidence of absence, and a
reader who sees "backed by a survey" will not make the distinction the
survey's own body makes.

**What grounds it.** Measured in this repository, 2026-08-26. All six
surveys in `examples/corpora/2026-08-26-ai-capex/surveys/` declare their
universe as the corpus. From
`ai-attributable-revenue-evidence-2026-08-25.md`: "this survey's universe
is the corpus's 151 minted atoms, a closed set." From
`depreciation-and-useful-life-evidence-2026-08-25.md`: "this is a complete
search of the closed set of 151 atoms and 53 claims, so the '5 atoms, 3
companies, 1 uncited' finding is conclusive within the corpus as it
stands. It says nothing about depreciation evidence that exists in the
world but was never captured into this corpus."

The corpus supplies its own demonstration of the failure. The one survey
that widened its scope, `ai-attributable-revenue-evidence-rerun-2026-08-25.md`,
searched the 69 raw captures with a keyword grep instead of the atoms, and
immediately found a first-party figure the atom layer had missed (Amazon's
"AI revenue run rate... over $15 billion in Q1 2026," sitting inside a
capture already cited by another atom). Its own note draws the moral: "a
keyword search is not a complete reading," and four query phrasings do not
exhaust how a source might name the thing. One widening of scope, one
miss found. There is no reason to think a third widening would find none.

**What would have to be true for it to bite.** That a reader, or a
downstream consumer, treats a survey-backed absence claim as a claim about
the world. The test is a reading study, but a cheaper one exists: take the
corpus's existing absence-flavoured claims, re-run each survey's question
against the open web rather than the corpus, and count how many
absence readings survive. The objection weakens sharply if the format or
the reference viewer distinguishes a corpus-scoped survey from a
world-scoped one at the point of display; it dies if the survey record
carries that scope as a typed field a consumer can act on.

**Where the format stands.** Partly answered, and the partial answer is
better than most formats manage. `ERF-25` requires that "a universal
negative, a claim of the form 'no shipped tool does X', MUST be audited as
scoped rather than as proved," and states that "the atoms evidence the
coverage of a survey, not the absence itself." Every survey in the corpus
writes an explicit coverage-bounds paragraph, and they are candid to the
point of self-incrimination, which is the discipline working. What is
missing is that the scope of a survey's universe (this corpus, versus the
web, versus a named database) is prose in the body rather than a field,
so nothing mechanical can distinguish "I searched my notes" from "I
searched the literature," and no consumer can surface the difference.

---

## 7. Every field that grades sources at scale has measured its own graders disagreeing, and a one-person corpus cannot detect that it is drifting

**The objection.** The format asks a person to grade each source `high`,
`medium` or `low` on a single axis, and to accept or dispute an auditor's
`SUPPORTED` / `PARTIAL` / `UNSUPPORTED` verdict. Every profession that has
tried to standardize judgments of this shape and then measured itself has
found substantial disagreement between trained practitioners working from
published protocols. Two commercial legal citators, staffed by lawyers and
sold on exactly this function, agree on negative treatment about 15 per
cent of the time. GRADE, the standard evidence-grading framework in
medicine, reports inter-rater kappas in the 0.2 to 0.4 range on some
domains. Intelligence analysts collapse a two-axis reliability code onto
its diagonal. In a one-person corpus there is no second rater, so the
format cannot detect drift, cannot calibrate, and gives its own consistency
the appearance of correctness. What it records is that one person was
self-consistent, which is not what a reader will take it to mean.

**What grounds it.** Paul Hellyer, "Evaluating Shepard's, KeyCite, and
BCite for Case Validation Accuracy," Law Library Journal 110 (2018):
449-476 (https://scholarship.law.wm.edu/libpubs/131/) found that Shepard's
and KeyCite each missed or mislabelled roughly a third of negative citing
relationships, BCite over two thirds, and that all three agreed on
negative treatment in only 53 of 357 examined citing relationships. The
format's own corpus already knows this: the claim quoted in the README as
its worked example is `citators-disagree-on-negative-treatment`.

In evidence synthesis, Buscemi et al., "Single data extraction generated
more errors than double data extraction in systematic reviews" (Journal of
Clinical Epidemiology 59, 2006, https://pubmed.ncbi.nlm.nih.gov/16765272/)
measured a 14.5 per cent error rate for double extraction against 17.7 per
cent for single extraction with verification, at a cost of 49 extra
minutes per study, and a 2018 replication found near-parity (15 versus 16
per cent). Read carefully that is two findings, and only the first helps
the sceptic: professionals extracting structured data from papers err at
roughly one item in seven even when two of them do it. Published
inter-rater kappas for GRADE judgments run around 0.41 for risk of bias,
0.18 for precision and 0.44 for overall quality of evidence. (Those kappa
figures surfaced consistently in secondary sources, most likely from
Hartling et al. on interrater reliability of strength-of-evidence grading,
but the primary text could not be fetched and the attribution is not
confirmed here.) On source grading specifically, Mandel and colleagues
(Journal of Behavioral Decision Making, 2023,
https://onlinelibrary.wiley.com/doi/full/10.1002/bdm.2307) find that
analysts using the two-axis Admiralty-style code assign ratings that
collapse toward the diagonal rather than being assessed independently; no
clean percentage for that collapse was found. That result independently
reproduces the reason `docs/non-goals.md` gives for declining a lettered
scale ("87% of two-axis ratings collapse to the diagonal"), which is the
format getting this right for its own reasons.

On the reader's side, Petroni et al., "Improving Wikipedia verifiability
with AI" (Nature Machine Intelligence 5, 2023,
https://arxiv.org/abs/2207.06220) report that in their human evaluation,
for over 40 per cent of the citations examined (41.3 per cent in one
reported table) no evidence supporting the Wikipedia claim could be found
in the cited reference. Wikipedia's own backlog category "All articles
with unsourced statements" held 583,810 articles when checked on
2026-08-26. That is what verification debt looks like in the largest
volunteer-run system that has ever tried this.

The cost side is measured too. Borah et al. (BMJ Open 7, 2017, e012545,
https://pubmed.ncbi.nlm.nih.gov/28242767/) found a mean of 67.3 weeks from
registration to publication for 195 systematic reviews, with a mean team
of 5 authors and an inclusion yield of 2.94 per cent of citations
screened; Michelson and Reuter (Contemporary Clinical Trials
Communications 16, 2019, 100443) estimate $141,194.80 per systematic
review. Doing this properly is expensive when institutions do it, which is
the reason a solo practitioner's version is interesting and also the
reason to ask what it is actually delivering.

**What would have to be true for it to bite.** That a second competent
person, given the format, the same sources and the same protocol, would
produce materially different records. The test is a straightforward
double-coding exercise: hand 30 of the corpus's sources to a second
practitioner, have them mint atoms and grade `source_quality` blind, and
compute agreement against the existing records. Kappa above about 0.7 on
`source_quality` and high agreement on findings would make this objection
mostly a theoretical worry. Kappa in the GRADE range would confirm that
the grade carries less information than its three-value vocabulary
implies. The same exercise on `finding_audit` adjudication answers the
verdict half.

**Where the format stands.** Explicitly declined for now, and named as
such. `docs/purpose.md` lists multi-party collaboration among the things
the format does not do: "One human per corpus is the practice the format
was extracted from," with actor registries and identifier collision
deferred "behind the arrival of a second human." The essay flags the same
gap under semantic and pragmatic interoperability. The design also
anticipates the failure mode: the single-axis `source_quality` exists
because two-axis scales were measured collapsing, and `ERF-11` records the
auditor and protocol version rather than treating a verdict as a fact.
None of that is calibration. A declined scope is a legitimate answer to
"why doesn't it do X" and not an answer to "does the thing it does mean
anything to anyone but you," and the second question is the one this
objection asks.

---

## Objections considered and set aside

- **"This is nanopublications with worse tooling."** Set aside as an
  objection in its own right and folded into objection 4.
  `docs/influences.md` already names nanopublications as "the closest
  structural ancestor anywhere," and the live network stands at roughly
  88,700 nanopublications across 18 services (https://monitor.nanodash.net/,
  2026-08-26) after more than a decade, which is evidence about adoption at
  scale rather than evidence that this format duplicates it.
- **"This is Xanadu, which never shipped."** Rhetorically appealing,
  factually wrong. The format does not do transclusion; it holds copies and
  compares strings. And transclusion did ship: Roam's block references and
  Obsidian's embeds are used daily. The Xanadu story (conceived 1960,
  OpenXanadu released April 2014, "the longest-running vaporware story in
  the history of the computer industry" per Gary Wolf, Wired 3.06, June
  1995) is a story about scope, and this format's scope is deliberately
  small.
- **"Structured argument notation does not help people think."** The
  evidence runs the other way and it should be said plainly: van Gelder's
  meta-analytic work reports roughly 0.8 standard deviations of improvement
  on standardized critical-thinking tests from high-intensity
  argument-mapping courses, against roughly 0.34 for a full year of
  ordinary undergraduate education. Dropped. The historical failures are
  about uptake, which is objection 4.
- **"Checkable narratives always die, see Jupyter and Distill."** The
  numbers are real (Pimentel et al., MSR 2019: of 863,878 notebook
  executions attempted, 24.11 per cent ran without error and 4.03 per cent
  reproduced the original results, https://leomurta.github.io/papers/pimentel2019a.pdf;
  Distill's July 2021 hiatus notice cites volunteer burnout and "more than
  50 hours of help" per early article, https://distill.pub/2021/distill-hiatus).
  But they do not transfer. A narrative binding is a staleness comparison
  between two timestamps, not an execution environment, and it has no
  dependency graph to rot. Quarto and Manubot are also alive, which is
  evidence that narrowly-scoped versions of this idea survive. Kept here as
  a warning about editorial labour rather than as an objection.
- **"Nobody buying consulting work will pay for the audit trail."**
  Probably the most commercially serious worry in the list, and dropped
  because no evidence was found either way. The Duke Reporters' Lab's 2026
  census (437 active fact-checking projects, down from a 2024 peak of 464,
  with 75 per cent reporting financial vulnerability,
  https://reporterslab.org/2026/06/12/2026-census-fact-checking-losses-continue-amid-funding-pressure-but-most-projects-persist/)
  is suggestive about the economics of verification as a product, but it is
  about a different market. There appears to be no published
  cost-per-fact-check or throughput figure anywhere, which is itself worth
  noting: the field that measures everything about itself does not publish
  the unit cost of one verified claim.
- **"Literate programming stayed niche, so this will too."** Weak by
  analogy alone. Knuth's own position ("If nobody likes it but me, let it
  die") and the survey literature's verdict that the technique "is not
  widely used" despite producing better software are the same uptake
  argument already made in objection 4 with better cases.

---

## Sources

Fetched or measured 2026-08-26 unless otherwise noted.

**In this repository (measured 2026-08-26).** `README.md`; `SPEC.md`
sections 1, 2, 4.2, 4.5, 5 and Security Considerations; `docs/purpose.md`;
`docs/non-goals.md`; `docs/influences.md`; `docs/design-history.md`;
`examples/corpora/2026-08-26-ai-capex/` (151 atoms, 53 claims, 6 surveys,
71 sources, 3 narratives); `examples/corpora/minimal/`; the output of
`npm run check -- examples/corpora/2026-08-26-ai-capex`.

**Adoption and structured-capture history.** Shipman, F.M. and Marshall,
C.C., "Formality Considered Harmful," Computer Supported Cooperative Work
8(4): 333-352, 1999, https://people.engr.tamu.edu/shipman/formality-paper/harmful.html.
Grudin, J., "Why CSCW Applications Fail," CSCW 1988, DOI
10.1145/62266.62273 (abstract and secondary discussion only; the primary
text could not be fetched). Scheuer, Loll, Pinkwart and McLaren,
"Computer-Supported Argumentation: A Review of the State of the Art,"
IJCSCL 5(1): 43-102, 2010 (citation confirmed; the PDF could not be
parsed, so no content claim is made from it here). Poynter/IFCN, "Google
backs away from search result snippets that address falsehoods," 2025,
https://www.poynter.org/ifcn/2025/google-claimreview-fact-checks-snippets-removed/.
Nanopub Monitor, https://monitor.nanodash.net/. Web Data Commons structured
data, October 2024 extraction, https://webdatacommons.org/structureddata/.
SPAR Ontologies CiTO repository, https://github.com/SPAROntologies/cito.
Kialo scale figures via https://en.wikipedia.org/wiki/Kialo (July 2023
vintage, secondary). https://debategraph.org (placeholder page, no content).

**LLM verification reliability.** Rashkin et al., "Measuring Attribution in
Natural Language Generation Models," Computational Linguistics 49(4),
2023, https://arxiv.org/abs/2112.12870. Yue et al., "Automatic Evaluation
of Attribution by Large Language Models," EMNLP Findings 2023,
https://arxiv.org/abs/2305.06311. Li et al., "AttributionBench," 2024,
https://arxiv.org/abs/2402.15089. Liu, Zhang and Liang, "Evaluating
Verifiability in Generative Search Engines," EMNLP Findings 2023,
https://arxiv.org/abs/2304.09848. "Nine Judges, Two Effective Votes:
Correlated Errors Undermine LLM Evaluation Panels," May 2026,
https://arxiv.org/abs/2605.29800. "Correlated Errors in Large Language
Models," https://arxiv.org/abs/2506.07962. Zheng et al., "Judging
LLM-as-a-Judge with MT-Bench and Chatbot Arena," 2023,
https://arxiv.org/abs/2306.05685. Vertex AI check-grounding documentation,
https://docs.cloud.google.com/generative-ai-app-builder/docs/check-grounding.
Anthropic Citations documentation,
https://platform.claude.com/docs/en/build-with-claude/citations.

**Professional practice.** Hellyer, P., "Evaluating Shepard's, KeyCite, and
BCite for Case Validation Accuracy," Law Library Journal 110 (2018):
449-476, https://scholarship.law.wm.edu/libpubs/131/. Borah et al., BMJ
Open 7 (2017): e012545, https://pubmed.ncbi.nlm.nih.gov/28242767/.
Michelson and Reuter, Contemporary Clinical Trials Communications 16
(2019): 100443. Buscemi et al., Journal of Clinical Epidemiology 59
(2006), https://pubmed.ncbi.nlm.nih.gov/16765272/. Mandel et al., Journal
of Behavioral Decision Making, 2023,
https://onlinelibrary.wiley.com/doi/full/10.1002/bdm.2307. Petroni et al.,
"Improving Wikipedia verifiability with AI," Nature Machine Intelligence 5
(2023): 1142-1148, https://arxiv.org/abs/2207.06220. Wikipedia,
Category:All articles with unsourced statements,
https://en.wikipedia.org/wiki/Category:All_articles_with_unsourced_statements.
Duke Reporters' Lab 2026 census,
https://reporterslab.org/2026/06/12/2026-census-fact-checking-losses-continue-amid-funding-pressure-but-most-projects-persist/.

**Copyright and capture.** Bartz v. Anthropic PBC, N.D. Cal.
3:24-cv-05417-WHA, order of 23 June 2025,
https://bpb-us-e2.wpmucdn.com/sites.uci.edu/dist/d/2220/files/2025/07/Bartz-v-Anthropic-PBC_Redacted.pdf.
Kadrey v. Meta Platforms, N.D. Cal., order of 25 June 2025,
https://law.justia.com/cases/federal/district-courts/california/candce/3:2023cv03417/415175/598/.
Authors Guild v. HathiTrust, 755 F.3d 87 (2d Cir. 2014),
https://law.justia.com/cases/federal/appellate-courts/ca2/12-4547/12-4547-2014-06-10.html.
Authors Guild v. Google, 804 F.3d 202 (2d Cir. 2015),
https://law.justia.com/cases/federal/appellate-courts/ca2/13-4829/13-4829-2015-10-16.html.
Hachette v. Internet Archive (2d Cir., 4 September 2024),
https://www.eff.org/cases/hachette-v-internet-archive. Directive (EU)
2019/790, Articles 3 and 4,
https://eur-lex.europa.eu/eli/dir/2019/790/oj/eng. Westlaw Terms of Use,
https://content.next.westlaw.com/StaticPages/TermsOfUse.html. Gartner
research documents usage policy,
https://www.gartner.com/en/about/policies/research-docs. Perma.cc journal
guidance, https://libguides.law.unm.edu/LawJournals/perma.

**Checkable narrative.** Pimentel, Murta, Braganholo and Freire, "A
Large-Scale Study About Quality and Reproducibility of Jupyter Notebooks,"
MSR 2019, https://leomurta.github.io/papers/pimentel2019a.pdf. Distill,
"Distill Hiatus," 2 July 2021, https://distill.pub/2021/distill-hiatus.
Wolf, G., "The Curse of Xanadu," Wired 3.06, June 1995,
https://www.wired.com/1995/06/xanadu/ (quotation via mirrored copies; the
original could not be fetched directly).

**Figures that could not be verified, and are therefore not asserted
above.** No count of CiTO-annotated citations exists that could be found.
No published accuracy, precision or recall figure exists for Vertex AI's
check-grounding API, and none for Anthropic's Citations API beyond a
January 2025 launch-post claim with no disclosed methodology. No study was
found measuring the rate at which an LLM produces a verbatim-looking
quotation, from a source document it was actually given, that does not
occur in that document, which is the measurement this format's quote check
most wants. No published cost-per-fact-check or per-checker throughput
figure was found. The commonly repeated "about 20 per cent of Wikipedia
citations fail to support their claim" could not be confirmed in the
Petroni paper; the figure stated above (over 40 per cent, on the subset
evaluated) is what the paper reports. The GRADE kappa figures could not be
tied to a confirmed primary citation. The van Gelder effect size is from
secondary sources; the primary PDF returned 403. No numeric collapse rate
was found for Admiralty-code diagonal ratings.
