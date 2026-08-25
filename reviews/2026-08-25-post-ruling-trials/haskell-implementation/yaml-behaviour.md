# YAML behaviour

Measured, not assumed. Every row below is real output from
`./run-erfval.sh --probe-yaml` and `./run-erfval.sh --probe-normalize`, on:

- GHC 9.6.6 (Stackage LTS 22.43), macOS x86_64
- `yaml-0.11.11.2` → `libyaml` 0.2.5, `aeson-2.2.3.0`
- `unicode-transforms-0.4.0.1` for NFKC

The question the spec makes this matter for:

> **ERF-65** "Frontmatter MUST parse under YAML 1.2 using the **JSON schema**,
> the narrowest of the three the specification defines. Under it only `null`, the
> literals `true` and `false`, and JSON's own number grammar resolve to
> non-string scalars; everything else stays a string. The hazard being excluded
> is a legacy default: YAML 1.1 defines a timestamp type, and common libraries
> keep it in their default schema [...] A producer SHOULD quote a timestamp
> regardless, so that a reader on a legacy schema still receives a string."

---

## 1. Scalars, as VALUES

| input | Data.Yaml result | ERF-65 requires | verdict |
|:--|:--|:--|:--|
| `k: 2026-08-23` | `String "2026-08-23"` | String | **agrees** |
| `k: 2026-08-23T14:02:00Z` | `String "2026-08-23T14:02:00Z"` | String | **agrees** |
| `k: "2018"` | `String "2018"` | String | agrees |
| `k: 0.9.0` | `String "0.9.0"` | String | agrees |
| `k: 12:30:00` | `String "12:30:00"` | String | agrees |
| `k: 1:30` | `String "1:30"` | String | agrees |
| `k: .inf` | `String ".inf"` | String | agrees |
| `k: true` | `Bool True` | Bool | agrees |
| `k: null` / `k: ~` / `k:` | `Null` | Null | agrees (all three identical) |
| `k: 2018` | `Number 2018` | Number (JSON grammar) | agrees — **and collides with ERF-14** |
| **`k: yes`** | **`Bool True`** | **String `"yes"`** | **DIVERGES** |
| **`k: no`** | **`Bool False`** | **String `"no"`** | **DIVERGES** |
| **`k: on`** | **`Bool True`** | **String `"on"`** | **DIVERGES** |
| **`k: off`** | **`Bool False`** | **String `"off"`** | **DIVERGES** |
| **`k: y`** | **`Bool True`** | **String `"y"`** | **DIVERGES** |
| **`k: N`** | **`Bool False`** | **String `"N"`** | **DIVERGES** |
| **`k: 012`** | **`Number 12`** | **String `"012"`** (JSON forbids leading zeros) | **DIVERGES, and loses the zero** |
| **`k: 0x1F`** | **`Number 31`** | **String `"0x1F"`** (JSON has no hex) | **DIVERGES** |
| **`k: 0o17`** | **`Number 15`** | **String `"0o17"`** (JSON has no octal) | **DIVERGES** |
| **`k: 1.0`** | **`Number 1`** | Number, but see below | **loses the minor version** |

### 1.1 The spec named the wrong hazard

ERF-65's stated reason for mandating the JSON schema is the YAML 1.1 **timestamp
type**: "an unquoted `timestamp` became a date object and made a claim's computed
disposition depend on how a weekday name sorts."

**That hazard does not exist in Haskell.** `Data.Yaml` decodes into `aeson`'s
`Value`, which has no date constructor, so a bare `2026-08-23` comes back as a
`String` and the spec's named failure cannot occur. It is a PyYAML / Ruby /
SnakeYAML hazard, and ERF-65 is written for those ecosystems.

**The hazards that DO exist in Haskell, ERF-65 does not mention.** `yes`, `no`,
`on`, `off`, `y`, `N`, `Y`, `n` are YAML 1.1 booleans that libyaml resolves as
booleans and the JSON schema keeps as strings. So `Data.Yaml`'s default resolver
**cannot be used to implement ERF-65 conformantly**, and there is no schema knob
on it: `Data.Yaml` exposes no way to select the JSON schema. An implementer who
needs strict ERF-65 conformance must either post-process (which is what `erfval`
does — see §3) or drop to `Text.Libyaml`'s event stream and re-resolve by hand.

Whether this bites in practice depends on whether any format field can hold one
of those tokens unquoted. Candidates, all legal today:

```yaml
short_name: no          # -> Bool False. A claim short-named "no".
scope: off              # -> Bool False. A search act scoped to "off".
licence_name: N/A       # safe (the slash breaks the token)
families: [y, n]        # -> [Bool True, Bool False]
hits_reported: no       # -> Bool False, where ERF-27 demands text
```

`erfval` reports each as an ERF-65 violation naming the resolved type.

### 1.2 `1.0` does not just become a number, it becomes `1`

> **ERF-61** "`spec_version` MUST follow Semantic Versioning 2.0.0."

`spec_version: 1.0` resolves to `Number 1.0`, which `aeson`'s `Scientific`
normalizes and which renders back as `1` — the minor version is gone before any
validator sees it. A validator reporting "spec_version `1` is not SemVer" is
reporting a string the author never wrote. `spec_version: 0.9.0` is safe only
because two dots make it un-numeric. So the format's own version string is
quotation-safe by accident of having reached a third component.

### 1.3 The three ERF-65 collisions with fields the spec calls text

Reproduced from `ambiguities.md` A12, now with measured values:

| field | spec | unquoted | measured |
|:--|:--|:--|:--|
| `as_of_date` | ERF-14: "MAY be **a year**" | `as_of_date: 2018` | `Number 2018` |
| `hits_reported` | ERF-27: yield "**as text** (\"0\", \"3\", …)" | `hits_reported: 0` | `Number 0` |
| `spec_version` | ERF-61: SemVer | `spec_version: 1.0` | `Number 1` |

All three are ERF-65-conformant resolutions of ERF-65-conformant YAML that
produce values the *other* requirement forbids. ERF-65 anticipates exactly this
class of problem, for timestamps only, and answers it with a SHOULD.

---

## 2. Scalars, as MAPPING KEYS

Source ids are mapping keys (ERF-3: `sources` is `Record<SourceId, Source>`), so
key resolution is an identity question, not a value question.

| input | Data.Yaml result |
|:--|:--|
| `2026-08-23: v` | key `"2026-08-23"` |
| `yes: v` | key `"yes"` |
| `no: v` | key `"no"` |
| `on: v` | key `"on"` |
| `null: v` | key `"null"` |
| `true: v` | key `"true"` |
| `2018: v` | key `"2018"` |
| `012: v` | key `"012"` |
| `1.0: v` | key `"1.0"` |
| `12:30:00: v` | key `"12:30:00"` |

**Every key comes back as an exact string, including the ones that resolve to
booleans and numbers as values.** This is not `Data.Yaml` being careful; it is
`aeson`'s `Object` being a `KeyMap Text`, which forces every key back to text
before the program can see it. The `012` key keeps its leading zero where the
`012` *value* does not.

So in Haskell, source ids are safe. **They are not safe everywhere.** In PyYAML
`yaml.safe_load("no: v")` gives `{False: 'v'}`, a boolean dict key — a source id
`no` becomes `False`, and any atom naming `source: no` gets the string `"no"`,
which never matches. The format has no rule on source-id syntax (ERF-3 says only
"keyed by a source id unique within the corpus"), so a corpus that is fine in one
language silently breaks in another. That is an interoperability finding the
format could close with one sentence constraining id characters — nothing in the
spec does.

---

## 3. What `erfval` does about it

`Data.Yaml` cannot be told to use the JSON schema. `erfval` therefore checks the
*consequence* rather than the resolution: every field the data model types as a
string is read through `str`, which reports a `Number` or a `Bool` as an ERF-65
violation naming what it resolved to, and then coerces so the remaining checks
still run. Measured output:

```
VIOLATION  [ERF-65  ]  .../atoms/kwg-001.md.as_of_date
    a bare year resolved to the number 1494. ERF-14 permits a year, but ERF-65
    mandates the YAML 1.2 JSON schema under which `2018` is a NUMBER, not a
    string. Nothing in the spec resolves the collision; quote it.
```

This catches the collisions and the `yes`/`no` divergences alike, because both
surface as "a string-typed field arrived as a non-string". It does **not** catch
the reverse: a value that libyaml keeps as a string and the JSON schema would
also keep as a string but which the *producer* intended as a number. There is no
such field in the format, so nothing is lost.

---

## 4. ERF-66: duplicate keys, anchors, aliases, tags

> **ERF-66** "A record's frontmatter MUST NOT contain a duplicate key, an anchor,
> an alias, or an explicit tag. YAML permits all four and leaves a processor's
> response to duplicates at its own discretion, so two conforming parsers may
> legally disagree about the same file."

| input | Data.Yaml result |
|:--|:--|
| `k: 1` / `k: 2` | `key "k" -> Number 2` — silently last-wins, no warning |
| `a: &x hello` / `b: *x` | `a -> "hello", b -> "hello"` — alias silently expanded |
| `k: !!str 2018` | `String "2018"` — tag silently applied |

All four prohibited constructs are **erased by the parser before any Haskell
value exists**. There is no flag, no warning, and no residue in the `Value`. A
validator built on `Data.Yaml` cannot implement ERF-66 at all through the parser.

`erfval` runs a lexical pre-scan (`erf66Scan`) over the frontmatter text before
handing it to `Data.Yaml`. It detects top-level duplicate keys, and values that
begin with `&`, `*` or `!` outside quotes. It is deliberately approximate and
says so: it will miss a duplicate inside a one-line flow mapping, and it can be
fooled by an unquoted scalar beginning with one of those sigils.

This is not a Haskell defect. PyYAML, go-yaml, serde_yaml and js-yaml all merge
duplicate keys silently by default. **A specification that requires this check
should say what a validator is expected to have access to** — the token stream,
not the parsed document — because through the parsed document the answer is
always "no duplicates".

---

## 5. ERF-51 normalization, measured

`./run-erfval.sh --probe-normalize`, with the escape `\&` being Haskell's
string-literal separator, not part of the data:

| case | input | ERF-51 output |
|:--|:--|:--|
| whitespace runs | `"Hello  world"` | `"Hello world"` |
| emphasis | `"a *however* b"` | `"a however b"` |
| underscore inside a word | `"snake_case"` | `"snakecase"` |
| code markers | ``"run `grep -n` now"`` | `"run grep -n now"` |
| ligature U+FB01 | `"\xFB01nal"` | `"final"` |
| NBSP U+00A0 | `"a\xA0b"` | `"a b"` |
| thin space U+2009 | `"a\x2009b"` | `"a b"` |
| **fullwidth asterisk U+FF0A** | `"a\xFF0Ab"` | **`"ab"`** |
| **ellipsis U+2026** | `"a\x2026b"` | **`"a...b"`** |
| zero-width space U+200B | `"a\x200Bb"` | `"a\x200Bb"` — unchanged |
| combining acute | `"e\x301"` | `"\xE9"` (é) |
| em dash U+2014 | `"a \x2014 b"` | unchanged — correct |
| curly quotes U+201C/D | `"\x201Cx\x201D"` | unchanged — correct |
| hard wrap | `"one\ntwo"` | `"one two"` |
| case | `"The Thing"` | `"The Thing"` — not folded, correct |
| elision marker | `"a [...] b"` | `"a [...] b"` — brackets survive normalization |

Three results are worth pulling out.

### 5.1 NFKC silently reintroduces a character fold the spec deliberately deleted

> **ERF-52** "Only the exact marker `[...]` MUST be treated as an omission, and
> it is the only wildcard. **A bare `...` and a bare `…` are literal source
> characters and MUST be matched literally** (`ERF-6`)."
>
> ERF-51 note: "An earlier version folded typographic quotes to straight ones,
> folded seven dash variants to a hyphen [...] Two things killed them. [...] And
> they were forgiving the wrong thing: the normalized text is what the check runs
> against, so an author who retypes rather than copies is guessing at their own
> evidence, and a failure telling them to copy is the correct answer."

Measured: **NFKC maps U+2026 `…` to `...`**. Applied to both sides, so an author
who types `...` where the source has `…` passes the check, and vice versa. That
is a typographic character fold — exactly the class of fold ERF-51's note says
was removed on principle, reintroduced by step 1 of ERF-51 itself.

ERF-52 asserts the two are distinct literals. Under ERF-51 they are not. The two
requirements are inconsistent, and the inconsistency is invisible unless someone
runs NFKC.

The same mechanism reaches further than ellipses: NFKC folds ½ → `1⁄2`, ﬁ → `fi`,
Roman numeral Ⅳ → `IV`, superscript ² → `2`, and every fullwidth Latin character
to its ASCII form. Any of those in a source is silently equated with its typed
equivalent.

### 5.2 NFKC feeds step 2 characters the author did not write

Fullwidth asterisk U+FF0A is not a markdown emphasis marker. NFKC (step 1) turns
it into `*`, and step 2 then deletes it as "the markdown emphasis and code
markers". A CJK source containing `＊` loses the character. Same for fullwidth
low line U+FF3F → `_` and fullwidth grave U+FF40 → `` ` ``. Step 2 is specified
as operating on markdown markers and in fact operates on whatever step 1 produced.

Harmless for matching, since both sides get it — but it means the normalized form
of a quote is not recoverable from the quote, and a validator reporting "span not
found" cannot show the author what it actually searched for without re-running
the pipeline.

### 5.3 ERF-52's split-before-normalize rule is right, and its stated reason is wrong

> **ERF-52** "The quote MUST be split on `[...]` BEFORE normalization, **because
> normalization may fold or strip brackets** and would otherwise destroy the
> marker; each span is then normalized independently."

Measured: ERF-51 does not strip brackets. `"a [...] b"` normalizes to `"a [...] b"`
unchanged — step 2 removes only `*`, `_` and `` ` ``, and nothing touches `[` or
`]`. The stated reason is false.

The rule is nonetheless correct, for the opposite reason. NFKC **creates**
markers:

```
"［...］"  (U+FF3B, three dots, U+FF3D)   -NFKC->  "[...]"
"［…］"   (U+FF3B, U+2026, U+FF3D)       -NFKC->  "[...]"
```

Both fold to a literal `[...]`. Had normalization run first, a quote from a CJK
source containing fullwidth brackets would acquire an elision marker its author
never wrote — and ERF-52 says "The text between two spans is unbounded by
design", so that accidental marker would license an unbounded skip in a fidelity
check. Splitting first prevents it.

Worth stating because the requirement's justification is the part an implementer
reasons from when a case arises that the rule does not literally cover, and here
that reasoning would lead them wrong.

### 5.4 Zero-width space is neither folded nor collapsed

U+200B survives NFKC and is not `isSpace`. A PDF extractor emitting zero-width
spaces (several do, at hyphenation points) produces a normalized text in which no
quote can be found, and ERF-51's three steps have no answer. ERF-70 pushes this
to "a named tool in the pipeline", which is a real answer — but it means quote
failures of this kind look identical to transcription errors, which is the
failure ERF-51's note says the short sequence was designed to expose.
