# Friction log

Every moment of re-reading, guessing or inference during this build, in order,
including the ones that resolved correctly. The resolved-correctly entries are
kept on purpose: a rule I had to read three times to get right is a rule the next
implementer will get wrong once.

Format: **[F-n]** trigger → what I did → resolved / guessed.

---

## Reading the spec

**[F-1] Requirement numbering has gaps.** ERF-16, ERF-29, ERF-30, ERF-45, ERF-46
and ERF-64 do not appear. I re-read looking for a missing section before finding
the answer in "Versioning and change control": "retired ids are never reused and
are never refilled". **Resolved.** Cost: one full re-scan. A one-line note near
the first gap, or a "retired ids" list, would have saved it.

**[F-2] Section 3 says the TypeScript file governs, and I cannot read it.**
"The normative data model is the file `types/erf.ts` [...] where the two differ,
the file governs." The inline mirror is "kept in sync by hand". So the normative
artefact is one I was told not to open, and the document itself says the copy I
have may be wrong. Every type decision in this build rests on a mirror the spec
disclaims. **Unresolvable by design of this trial**, but worth recording: a spec
that delegates normativity to a file outside itself cannot be built from cold.

**[F-3] `?` on `surveys` versus no `?` on `atoms_for`.** Read section 3, then
ERF-55, then ERF-56, then back to section 3. ERF-56 explains why list fields are
typed as required; `surveys?` and `notable_results.atoms?` are typed optional
four and twelve lines away with no explanation. **Guessed** they behave
identically (see type-decisions §1.2). Highest-friction single reading in the
document.

**[F-4] "Lists are total in the type and MAY be empty; empty lists are omitted in
serialization."** Read three times. It is three statements about three layers
(type / wire / reader) compressed into one sentence, and ERF-55 and ERF-56 each
restate one of them normatively later. **Resolved**, but only after finding
ERF-56.

---

## The source list

**[F-5] Is the source list a bare YAML file or frontmatter+body?** ERF-3 says "a
YAML document under the rules of section 7"; section 7's only file-shape rule is
ERF-53, scoped to record types; a source is explicitly not a record. Re-read
ERF-3, ERF-53, ERF-54, ERF-59. **Guessed**: accept both. See ambiguities A10.

**[F-6] What is `normalized` relative to?** Searched the whole document for a
base path. There is none. **Guessed**: corpus root, then as-given, and report
both candidates on failure. See ambiguities A4. This one made me want to look at
`examples/` more than anything else in the build.

**[F-7] ERF-2 and ERF-7 contradict for a received file the corpus holds.** Read
both four times trying to make them consistent. They are not. **Guessed** ERF-7
is loosely worded. See ambiguities A5.

**[F-8] Can `status: shipped` coexist with no `normalized`?** ERF-4 says "either
give the path [...] or record that none is held and why"; ERF-5 gives the absence
statuses; `shipped` is not one. So `shipped` with no `normalized` violates ERF-4
— but no requirement says that in those words, it is an inference from two.
**Resolved by inference.**

**[F-9] Does ERF-68's MUST fire on `status: shipped` with no `licence`?** ERF-68
is a SHOULD in its first sentence ("SHOULD name the licence") and a MUST in its
last ("such a source MUST carry the status `shipped-as-quotation`"). The MUST is
conditional on "The text may also ship under no licence at all" — which is a
statement about the world, not a field. I read it as: no `licence` field means
shipping under no licence, so `shipped` without `licence` violates the MUST.
**Guessed**, and I am not confident. An author who ships under a licence and
forgets to record it gets a violation naming the wrong problem.

**[F-10] ERF-69's excerpt MUST is unfalsifiable.** Spent ten minutes looking for
a field that marks a normalized text as an excerpt before concluding there is
none. **Resolved (negatively).** See ambiguities A17.

---

## Atoms and the quote check

**[F-11] Does ERF-52's "non-empty" apply before or after normalization?** Read
the paragraph five times. The sentence order says after; the sentence about
splitting says the ordering matters. **Guessed** after. This is the single
highest-consequence guess in the build — it decides pass versus fail on a real
input. See ambiguities A2.

**[F-12] What algorithm satisfies "in order and without overlap"?** Stopped to
convince myself leftmost-earliest is optimal (it is; an earlier match end never
forecloses a later span). **Resolved**, but the spec does not say, and an
implementer who does not stop to prove it will reach for backtracking or, worse,
for `find` from position 0 each time, which is wrong.

**[F-13] Does normalization strip the `[...]` brackets?** ERF-52 says it may
("because normalization may fold or strip brackets"). I read ERF-51's three steps
again: it does not. Then ran it to be sure. **The spec's stated reason for its
own ordering rule is factually wrong** — the ordering is still right, for the
opposite reason (NFKC *creates* markers from fullwidth brackets). See
yaml-behaviour §5.3. Cost: two re-reads plus a probe.

**[F-14] Does ERF-51 fold `…` to `...`?** Not stated anywhere. Ran NFKC. It does.
Which contradicts ERF-52's "A bare `...` and a bare `…` are literal source
characters". **Found by probing, not by reading**, which is the point of running
the probe.

**[F-15] What counts as whitespace in step 3?** Not stated. **Guessed** Unicode.
See ambiguities A21.

**[F-16] `ERF-11` says the mechanical result MUST NOT be stored — stored where?**
There is no field for it in the data model, so the only way to violate it is to
invent a field, which ERF-55 already forbids. Implemented as a blacklist of five
plausible names and recorded that an author using a sixth passes. **Resolved
with a known hole.**

**[F-17] ERF-13's atom-id shape.** Is `kwg-117` a grammar or an example? The MUST
attaches to permanence. **Guessed** flag-not-violate. See ambiguities A15.

---

## Claims

**[F-18] ERF-41 ties.** Wrote `computeDisposition`, then noticed "each person's
newest entry" is partial, then re-read "Every input has exactly one reading" and
realised the spec asserts the totality it does not have. **Guessed** file order +
flag. See type-decisions §10.3. Found by writing the function, not by reading.

**[F-19] ERF-43 termination.** Wrote the closure traversal, then realised it does
not terminate on a `supports` cycle, then re-read ERF-43 twice looking for the
prohibition. It forbids cycles in `assumes` and `decomposes-into` and `supports`
is neither, but ERF-24 puts `supports` into the closure. **Guessed** a visited set
+ flag. See type-decisions §10.4. The single clearest "requirement cannot be
implemented as written" in the document, and it took writing the code to see it.

**[F-20] ERF-49's "someone stands on".** Re-read, then read ERF-41's disposition
rules to see whether "stands on" is a defined term. It is not. **Guessed** any
standing entry. See ambiguities A9.

**[F-21] ERF-20's SHOULD versus ERF-55's semantics.** Read ERF-20, then ERF-55's
long paragraph about it, then back. They agree and ERF-55 is unusually explicit.
**Resolved, correctly, and quickly** — the one place in the format where the
`Maybe`-versus-empty question is answered outright. Recording it because the
contrast with [F-3] is the finding.

**[F-22] `evidence_at_stance:` written as YAML null.** Realised while writing
`Presence` that YAML has a third state the spec's two words do not cover. Went
back to ERF-55 to check. It genuinely does not. **Guessed** violation. See
type-decisions §1.1.

**[F-23] ERF-18's "body SHOULD open by restating title".** Restating verbatim, or
in other words? ERF-18 answers this well — "whether an opening in other words
still states the same claim is a reading, so no rule numbers it" — so I check
verbatim-under-ERF-51 and flag. **Resolved.** Good requirement.

---

## Narrative bindings

**[F-24] What is "its passage"?** Searched the whole document. Not defined.
Re-read §2's definition of narrative binding, ERF-31 twice, ERF-32. Nothing
delimits it. **Guessed** previous-binding-to-marker. See ambiguities A1. This is
where the temptation to open `examples/` was strongest: one example narrative
with two bindings would settle it, and no amount of re-reading will.

**[F-25] Is the anchor unescaped before matching?** Not stated. Inferred from the
escapes' stated purpose. **Guessed**. See ambiguities A6.

**[F-26] Can an id or anchor contain `-->`?** The grammar says yes; HTML says no.
Realised while writing the recognizer. **Guessed** lexer-first. See ambiguities
A7.

**[F-27] Comma-separated ids.** ERF-31's prose: "Ids are separated by whitespace,
never by commas, because a comma inside an unquoted list invites a parser to
guess." But `id ::= one or more characters, none of them whitespace or '"'`
**admits the comma**. So `claims: a, b "anchor" bound-at=...` parses cleanly as
two ids, `a,` and `b`, and the first resolves to nothing. The prose states an
intent the grammar does not enforce, and the failure surfaces as ERF-33
(unresolvable id) rather than ERF-31 (bad grammar). I built the test expecting
ERF-31, got ERF-33, re-read, and concluded the tool was right and my expectation
was wrong. Test renamed to `nc-ERF-33-binding-comma-separated-ids`. **Found by
the test disagreeing with me.**

**[F-28] A binding naming several claims — whose staleness?** ERF-32 is singular.
**Guessed** worst-wins. See ambiguities A8.

**[F-29] ERF-34 cites ERF-19 for `created`.** Read ERF-19. It is about standings
requiring full instants. Almost implemented that constraint on narratives before
noticing it contradicts ERF-19's own carve-out. **Nearly guessed wrong.** See
ambiguities A24.

**[F-30] Do bindings appear outside narratives?** Not stated. **Guessed**
narratives only. See ambiguities A19.

---

## Serialization

**[F-31] What is the frontmatter delimiter?** Only in examples. **Guessed**
`---`. See ambiguities A11.

**[F-32] ERF-66 through `Data.Yaml`.** Wrote the check, then realised libyaml has
already erased all four constructs. Went looking for a schema or duplicate-key
option on `Data.Yaml`. There is none. **Resolved by building a lexical pre-scan
and documenting its limits.** See yaml-behaviour §4.

**[F-33] ERF-65 through `Data.Yaml`.** Same shape. Ran the probe expecting the
spec's named hazard (timestamps becoming date objects) and found it does not
occur in Haskell, while six hazards the spec does not mention (`yes`/`no`/`on`/
`off`/`y`/`N`) do. **Found only by probing.** See yaml-behaviour §1.1.

**[F-34] ERF-67 "valid CommonMark".** Went to check what invalid CommonMark looks
like. There is no such thing. **Resolved (vacuous).** See ambiguities A23.

**[F-35] ERF-54 forbids meaning in filenames, and I need the extension to know
what to open.** Read ERF-54 twice. There is no other way to know which files to
read, since normalized texts and raw PDFs sit in the same tree. **Guessed** an
extension allowlist and recorded that it contradicts ERF-54. See type-decisions
§10.5.

**[F-36] Is a validator's input a corpus or a deployment?** ERF-38 and ERF-54
presume different answers. Read the conformance classes section again for a
definition of a validator's input. There is none. **Guessed** corpus. See
ambiguities A3. This one surprised me most: the Validator conformance class is
defined by "the input it accepts" and the document never says what that is.

**[F-37] ERF-3 "exactly two keys" versus ERF-72's `x_`.** Noticed while writing
the source-list parser that ERF-72's enumeration ("any record, declaration, or
source") omits the source list document. **Resolved** in favour of ERF-3, and
recorded. See ambiguities A13.

**[F-38] Is an unknown `type` value a violation or a note?** ERF-55 is about
field *names*. ERF-57 is about unknown record types. **Guessed** note. See
ambiguities A28.

---

## Reporting

**[F-39] The spec defines two report kinds and needs three.** Realised while
writing the reporter that ERF-54's "MUST report that it did", ERF-57's "MUST
report them" and ERF-41's computed disposition are none of them violations and
none of them flags in §2's sense. **Invented `Note` and labelled it as
invented.** See type-decisions §5.

**[F-40] Which requirement does a failed quote check cite?** Wrote it citing
ERF-6, then a test disagreed, then reasoned it out: an un-elided quote that does
not occur breaks ERF-6 (verbatim); an elided quote whose spans do not occur in
order breaks ERF-52 (the ordering rule); an all-empty quote breaks ERF-52's last
sentence. **Resolved by the test suite**, which is why the suite asserts the
requirement id rather than just the exit code.

**[F-41] The actor MUST has no id.** Went looking for the requirement number to
cite. §3.1's field index does not list `by` under any actor requirement. **The
only finding in the program with an empty requirement column**, and it is
labelled as such in the output. See ambiguities A25.

---

## Tooling friction (not the spec's fault, recorded for completeness)

**[F-42]** No Haskell toolchain on the machine. `ghc`, `stack`, `cabal`, `ghcup`
all absent; installed `haskell-stack` via Homebrew and used `stack script` with
LTS 22.43 (GHC 9.6.6), which downloads its own GHC. First full build ~25 min;
subsequent runs are instant from the compile cache.

**[F-43]** `"a\xA0b"` in a Haskell string literal is `\xA0B`, not `\xA0` followed
by `b`. My first normalization probe reported NBSP as unchanged because of this,
not because NFKC left it alone. Fixed with `\&`. Recorded because it briefly
produced a wrong finding, and a wrong finding stated confidently is exactly what
this exercise is meant to avoid.
