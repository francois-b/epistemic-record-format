# Friction log

A running record of every moment during this implementation where I had to
re-read, guess, infer, or backtrack. Kept in the order it happened, including
the things I got right in the end — "I read this three times before it worked"
is a fact about the prose whether or not the outcome was correct.

Session: 2026-08-25. Input: `SPEC-as-tried.md` only. Target: Go, `erfval`.

---

## Reading the spec

**F-01. Section 3's TypeScript is the data model, but it is a mirror.** "The
normative data model is the file `types/erf.ts` [...] where the two differ,
the file governs." I could not read that file. So every field name, every
optionality marker, and the exact `Actor` template-literal type came from a
block the document itself calls a hand-maintained copy. I built the whole
field-set from a source the spec disclaims. Nothing went wrong, but I had no
way to know that.

**F-02. Which fields are required, and where that is stated.** The
TypeScript's `?` markers are the only statement of optionality, and section
3.1's field-reference table maps fields to requirements but never says
required-or-not. So for `Source.citation_text` and `Source.status` — both
non-optional in the interface, neither carrying a MUST that says "present" —
I had to report their absence under a requirement number that does not
actually say it (`ERF-3` and `ERF-5` respectively). Every "this field is
required" message my validator prints cites a requirement about something
else.

**F-03. Read the `ERF-53` / `ERF-3` / `ERF-59` triangle four times.**
`ERF-53` says the interchange form is frontmatter plus body "for every record
type". `ERF-3` says the source list is "a document". `ERF-59` says the
declaration is "a YAML document". I went back and forth on whether the
non-record files also take frontmatter. Settled on accepting both, after
noticing that a bare YAML document may open with `---` and be
indistinguishable from an unterminated frontmatter block. That realisation
came from writing the splitter, not from reading the spec.

**F-04. `ERF-55` and `ERF-56` read as contradictory on first pass.** "Empty
lists MUST be omitted" and "A reader MUST materialize an omitted list-typed
field as an empty list." Third read made it click: one binds the producer's
bytes, the other the reader's in-memory shape. The `evidence_at_stance: {}`
paragraph is what made it land, and it is buried at the end of `ERF-55`.

**F-05. Section 1's conformance-class list.** I read the Validator bullet
three times trying to decide whether the colon-list was exhaustive, because
the answer determines whether the entire scope of this trial (the quote check,
narrative bindings) is inside the class. Concluded it is probably not
exhaustive and implemented accordingly, then wrote it up as A-01. I still do
not know the intended reading.

**F-06. The flag/violation distinction is clear; nothing else is.** Section 2
is unusually explicit that a validator reports two kinds of thing. Then
`ERF-68` has a SHOULD, `ERF-51` requires reporting a check as "unavailable",
and `ERF-8` cannot be checked at all. I had to invent two more severities on
the first hour of building, before writing a single check. That is the kind of
gap that shows up immediately in any implementation.

**F-07. Missing requirement numbers.** `ERF-16`, `ERF-29`, `ERF-30`, `ERF-45`,
`ERF-46`, `ERF-64` never appear. I searched for each one twice, assuming I had
missed a section, before concluding they were retired. The "Versioning and
change control" section says retired ids are never refilled, which is
consistent, but nothing lists them, so I could not tell an intentional gap
from a lost paragraph.

---

## The source list

**F-08. `ERF-3`'s "exactly two keys" is unusually precise, and I trusted it.**
Then `ERF-72` says an extension field may go on "any record, declaration, or
source". A source *list* is none of those three, so `x_` on the list document
violates `ERF-3`. I implemented the strict reading and flagged it. I do not
believe that is intended, but the two sentences do not overlap.

**F-09. `ERF-4`'s "either / or" took two reads to turn into code.** "Every
source MUST either give the path of its normalized text or record that none is
held and why." The "record that none is held" half is only given operational
form in `ERF-5` (a status from a closed set plus a reason). So the check
straddles two requirements, and I emit two findings for one defect
(`nc-erf4-no-normalized-no-absence` reports both ERF-4 and ERF-5).

**F-10. `ERF-68` cost the most time of any source rule.** A SHOULD and a MUST
landing on the same observable (a missing `licence` field), with the MUST's
trigger ("ships under no licence") detectable only as the absence the SHOULD is
about. I wrote three different versions of this check. The final one keys off
`status`, which required inferring meaning from the inline comments in the
TypeScript (`// under a licence`, `// under none`) rather than from any
requirement text.

**F-11. `ERF-70`'s "exact version" — my first heuristic was wrong and the test
caught it.** I checked "the tool string contains a digit". `pymupdf4llm` has a
4 in its name, so my deliberately-broken test corpus passed. I had to change
the fixture rather than the check, because there is no better check available.
Recorded as A-18. This is the clearest single instance in the whole session of
a MUST that a validator cannot implement.

**F-12. `ERF-2`'s last sentence versus `ERF-7`'s last sentence.** `ERF-2`:
"a corpus that does not [hold the raw file] holds `received.url` and
`received.digest` instead." `ERF-7`: "A received file has no retrieval
locator, so its source carries no `received`." Both describe when `received`
is present or absent, in incompatible-sounding terms, and neither is worded as
a MUST. I ended up making the first an advisory and not implementing the
second at all, because nothing in a record marks a source as "received rather
than fetched".

**F-13. Where do the paths point?** I wrote `resolveCorpusPath` twice. The
first version resolved relative to the source list's own directory; the second
tries the corpus root first. Neither is what the spec says, because the spec
says nothing. Every corpus I authored had to be laid out to match my guess.

---

## Narrative bindings

**F-14. The grammar is the clearest thing in the document, and I still could
not implement it without three decisions the grammar does not make.** `ws` is
undefined. Where the ids stop and the anchor begins is derivable (an id cannot
contain `"`) but is not stated. And the comment's own terminator is not in the
grammar's character sets at all.

**F-15. The comma case surprised me.** I wrote the "commas are wrong" test
corpus expecting my parser to reject it, because the prose says ids are
"never" comma-separated. It parsed. `a-real-claim,` is a legal `id` under the
grammar. My validator reported `ERF-33` (unresolved id) rather than `ERF-31`.
Ten minutes of assuming my parser was broken before I re-read `id ::= one or
more characters, none of them whitespace or '"'` and realised the grammar and
the prose disagree.

**F-16. "Its passage" — the single longest stall of the session.** I searched
the document for a definition of "passage" four times. There is none. Section
4.6's opening ("A passage that asserts something SHOULD end with a narrative
binding") is the closest thing and it defines a passage by what it does, not
by where it starts. I built three implementations behind a flag rather than
pick one silently, because the choice changes the verdict on real documents.

**F-17. `ERF-34` deserves credit.** It is the one place in the document that
names a past ambiguity and closes it explicitly ("Naming the three fields
without typing them left two readings, and two authors took one each"). That
paragraph made `created` trivially implementable. It is also the model for
what A-02 and A-16 need.

**F-18. Recognition versus validation took two reads but is well drawn.** "A
comment opening `<!--` followed by `claims:` IS a narrative binding:
recognizing one and validating one are separate acts, and a consumer performs
them in that order." Once I understood it the code fell out immediately. The
sentence is doing real work and it is stated once, in bold, which was enough.

**F-19. But the same paragraph does not say whether a grammar failure is a
violation or a flag.** "MUST be reported, never skipped" names neither of
section 2's two categories, and the paragraph two above it names one
explicitly. I read both paragraphs back to back three times looking for the
word and it is not there.

---

## The quote check

**F-20. `ERF-51` step 2 stopped me for a while.** "Remove the markdown
emphasis and code markers `*`, `_`, and `` ` ``." Is that "remove those three
characters" or "remove them where they are markers"? I wrote a test for
`snake_case` before deciding, watched it become `snakecase`, and decided that
had to be intended because the alternative needs a CommonMark parser inside a
function that also runs on bare quote fragments.

**F-21. `ERF-52` is precise about order and overlap and silent about the
consequence.** I implemented greedy leftmost matching, convinced myself it was
optimal (it is — deferring a match never enables a later one), then wrote the
mid-word test almost as an afterthought and got a pass on `"The cat[...]sat"`
against `"The catapult ... sat on the mat"`. That is a fabricated quote passing
a fidelity check. I re-read `ERF-51` and `ERF-52` twice looking for the rule
that prevents it. There is none. This is A-03 and it is the most alarming
thing I found.

**F-22. "Non-empty span" — before or after normalization?** A span of only
whitespace is non-empty as written and empty after step 3. `ERF-52` says
"Every non-empty span MUST occur" and "A quote whose spans are all empty MUST
fail". I chose after-normalization, so `"  [...]  "` fails. The other reading
makes it pass with two spans that normalize to nothing and therefore match
anywhere.

**F-23. `ERF-51`'s pointer to the conformance cases.** Reaching the sentence
"where a reading of the prose and a case disagree, the case governs" after
having already made four judgment calls about the prose was deflating. It
means F-20 and F-22 are not answerable from the document. I recorded my
readings as unit tests so they can be diffed against the cases rather than
re-derived.

---

## YAML

**F-24. `ERF-65` is right about the hazard and I nearly walked into it.** I
started with `yaml.Unmarshal` into `map[string]interface{}`, then wrote a probe
before trusting it. `gopkg.in/yaml.v3` resolves unquoted `2026-08-23` to
`!!timestamp` — the exact bug the requirement describes, in a library that
advertises YAML 1.2. I threw the decode path away and wrote a resolver over
`yaml.Node`. That is maybe 120 lines that exist purely because no mainstream
YAML library implements the schema the format requires.

**F-25. The probe also showed the requirement is wider than it looks.**
`0o14`, `0x1f`, `1_000`, `012`, `+1`, `1.` and `.inf` all resolve to numbers
in yaml.v3 and to strings under the JSON schema. `ERF-65` names only the
timestamp case. An implementer who reads it as "remember to quote your
timestamps" and otherwise trusts their library will still be wrong.

**F-26. `ERF-66` detection depends on the decode target, which nothing
mentions.** yaml.v3 errors on a duplicate key when decoding into a map and
silently keeps both when decoding into a node tree. So whether a validator
*can* see a duplicate depends on an implementation detail of how it chose to
parse. I detect on the node tree. A spec that forbids duplicates should say
that a validator must be able to observe them.

**F-27. Detecting an explicit tag was guesswork.** yaml.v3 exposes
`node.Style & yaml.TaggedStyle`. I found that by probing, not from any
documentation, and I am not certain it is exhaustive. `ERF-66` forbids
explicit tags without saying how a validator recognises one, which in most
YAML libraries is not exposed at all.

---

## Records, invariants, graph

**F-28. `ERF-49`'s "someone stands on".** Three readings (any standing; a
current `for`; disposition ≠ proposal). I wrote it one way, changed it, changed
it back. The phrase is doing load that the rest of the requirement's precision
does not match — the same sentence is exact about "empty `atoms_for` and empty
`surveys`".

**F-29. `ERF-43`'s closure definition is unusually careful and it paid off.**
"The closure is what the edges *reach* and does not include the argument
itself, so an argument with no premises has an empty closure and satisfies
this rule vacuously: what is wrong with such an argument is that nothing backs
it, which is `ERF-49`'s flag, not that its closure ends badly." That sentence
answered a question I was about to get wrong. It is the best-written
requirement in the document.

**F-30. `ERF-41` gave me no tie-break and I had to invent one.** Two entries
by one person at the same instant. I used document order and justified it by
append-onlyness, which `ERF-63` explicitly permits a substrate not to preserve
(database rows have no order). So my disposition is stable for files and
undefined for a conforming database substrate.

**F-31. `ERF-40` and `ERF-28` cannot be checked and I spent time working out
that they cannot.** Both say "immutable" / "append-only", `ERF-40` explicitly
"verified against the substrate's history". A validator given a directory has
none. I looked for a way to do it (git? a hash chain? a monotone field?) before
accepting that the interchange form carries nothing that would support it.

**F-32. `ERF-36`/`ERF-38` and the word "deployment".** I re-read the section 2
definition twice. A deployment is a social arrangement, not an artifact. There
is no manifest, no registry, no field. I made the command line the deployment
boundary, which means my `ERF-38` check reports duplicates only among the
directories I happened to be pointed at, and my `ERF-35` check reports false
violations whenever a corpus cites its neighbour and I was handed one of them.

**F-33. `ERF-54`'s "report every untyped file" produced immediate noise.** The
first run over my own conforming corpus reported the normalized text as
"ignored" — the corpus reporting its own evidence as not-part-of-itself. I
suppressed it behind a flag, which the spec does not authorize, and wrote it
up.

**F-34. `ERF-13`'s id shape is an example in parentheses.** `(kwg-117)`. I
wrote a regex from an example. Claim ids have no stated shape at all, so my
validator checks the shape of one id type and not the others, which is what
the spec does too, but it reads as an oversight in both.

**F-35. The `body` field.** `Claim` and `Survey` carry `body: string` in the
interface; the serialization puts the body after the frontmatter. Is `body:`
inside frontmatter legal in the interchange form? I accepted it as a known key
without comparing it to the markdown body, which means a record could carry
two different bodies and my validator would say nothing.

---

## Things that went right

Worth recording, because a friction log listing only problems misrepresents
the document.

- The vocabularies (section 5) are closed, short, and unambiguous. Every one
  went straight into code.
- `ERF-41`'s disposition algorithm is complete: "Every input has exactly one
  reading" is true, and the only gap is the tie-break (F-30).
- `ERF-47`'s staleness rule handles the mixed-precision case explicitly, with
  a stated reason. I implemented it from one read and the unit tests passed
  first time.
- `ERF-19`'s justification for requiring a full instant in exactly one place,
  and nowhere else, is the clearest piece of rationale in the document.
- `ERF-35`'s closing instruction — "ask whether the reference asserts
  something now or records something then" — is a rule an implementer can
  apply to a field the spec has not enumerated. That is what a specification
  should do.
- `ERF-31`'s recognition-before-validation rule, and `ERF-34`'s explicit
  closing of a past ambiguity, are both models for what the open questions in
  `ambiguities.md` need.
