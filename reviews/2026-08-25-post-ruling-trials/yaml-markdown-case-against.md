---
title: "The case against YAML + Markdown as a normative interchange substrate"
purpose: "Evidence file for deciding whether YAML frontmatter + Markdown stays the pinned interchange form of a data specification, or becomes one swappable binding among several. Collects the strongest documented arguments against, sourced to pages actually fetched."
status: non-normative
last_updated: 2026-08-25
---

# The case against YAML + Markdown as a normative interchange substrate

This file does not argue the other side. It assumes the case *for* YAML+Markdown
(git-diffability, human editability, no build step, plain-text longevity, tool
independence) is already on record, and collects what practitioners who
actually shipped on this substrate and specification authors who had to make it
normative say went wrong. Every claim below carries a URL, an author or
publication, and — where the search summary and the fetched page might diverge
— only what the fetched page itself states. Weak or unfetched sourcing is
flagged as such rather than smoothed over.

---

## 1. YAML the language

### 1.1 It is a documented security and availability liability at the spec level — not just folklore

The strongest source in this file is not a blog post but an IETF RFC — the
document that gave YAML a registered media type at all, 22 years after the
language shipped. **RFC 9512, "YAML Media Type"** (R. Polli, E. Wilde, E. Aro;
IETF, February 2024), §4.1–4.2, states plainly:

> "Care should be used when using YAML tags because their resolution might
> trigger unexpected code execution." … "Code execution in deserializers
> should be disabled by default."

and, on the anchor/alias mechanism specifically:

> Treating cyclic graphs as trees "risks going into an infinite loop" and can
> trigger "Exponential Data Expansion (e.g., a Billion Laughs Attack)."
> Mitigation requires "processors that limit the anchor recursion depth and
> validate the input."

This is not a hypothetical the RFC authors invented for the security section.
**CVE-2026-45304** (Symfony Blog, published 2026-05-20, "CVE-2026-45304: YAML
Parser Exponential Memory Allocation via Recursive Collection-Alias Expansion
('Billion Laughs')") describes exactly this failing in a widely-deployed
production YAML parser, affecting Symfony's YAML component across four release
lines (< 5.4.52, 6.x < 6.4.40, 7.x < 7.4.12, 8.x < 8.0.12) as of this year. The
advisory's own words:

> "A small input can blow up into a multi-gigabyte structure and exhaust
> memory: the classic 'Billion Laughs' denial-of-service against any parser
> exposed to untrusted YAML."

The fix was a hard-coded resolution limit (default 128, modeled on
SnakeYAML's `LoaderOptions`) plus a new flag to reject aliases outright for
untrusted input — i.e., the shipped mitigation is "disable part of the
language," not "the format was already safe."

**Why this matters for a normative interchange spec specifically:** a wire
format used for machine-to-machine or third-party-submitted data is, by
definition, a format exposed to untrusted input. RFC 9512 and this 2026 CVE
are both about that exact threat model, not about hand-authored config files
read only by their own author.

### 1.2 The Norway problem is real, reproducible, and independent of any one parser's bugs

**"The YAML Document from Hell"**, Ruud van Asseldonk, ruuda.nl, 2023-01-11 —
gives exact input/output pairs rather than paraphrase. For a country-code list:

```
geoblock_regions:
  - dk
  - fi
  - is
  - no
  - se
```

parses (YAML 1.1 rules) to

```json
{"geoblock_regions": ["dk", "fi", "is", false, "se"]}
```

— the author's summary line: `no` "converts to boolean `false`." The same
piece gives the **sexagesimal** case with an exact number:

```
port_mapping:
  - 22:22
  - 80:80
  - 443:443
```

parses to `{"port_mapping": [1342, "80:80", "443:443"]}` — `22:22` is read as
base-60 (22×60+22 = 1342), a YAML 1.1 feature "silently removed" in 1.2, so the
same document means two different things depending which spec version a given
parser implements.

**HitchDev, "The Norway Problem — why StrictYAML refuses to do implicit
typing"** gives the country-list example directly with PyYAML: `['GB', 'IE',
'FR', 'DE', 'NO']` parses to `['GB', 'IE', 'FR', 'DE', False]`, with the
author's own line: "It snows a lot in False." The same page gives a second,
independent implicit-typing failure — `surname: Null` parses to Python `None`
rather than the string `"Null"` — i.e., the bug class is general (any bare
word that happens to collide with a type keyword), not limited to booleans.

**noyaml.com** (fetched directly) adds concrete cases beyond booleans: `07`
parses as the integer 7 while `08` parses as the *string* `"08"` (invalid
octal falls back to string) — meaning a sibling pair of near-identical values
in the same list silently take different types; and `04:30` parses as
`16200` (seconds since midnight) unless force-typed with `!!str`.

### 1.3 YAML 1.1 vs 1.2 is not settled in practice, nine-plus years on

**GitHub issue `yaml/pyyaml#116`** (opened 2017-12-27, still open as of this
research), the request itself: "the lack of YAML 1.2 support in this library
is a hindrance to parsing YAML in a consistent 'least surprise' manner." PyYAML
is the reference Python implementation; it has not adopted 1.2 in the
intervening years.

**GitHub issue `kubernetes/kubernetes#34146`** documents the practical
consequence: a user wrote `command: [redis-server, '--appendonly', no]`
expecting YAML-1.2 string semantics and got

> `error validating data: expected type string, for field
> spec.template.spec.containers[2].command[6], got bool`

— traced to Kubernetes's YAML dependency chain (`ghodss/yaml` →
`cloudfoundry-incubator/candiedyaml`) implementing YAML 1.1 resolution rules.
The reporter's own framing: "In previous YAML versions this should be
translated to be a boolean value, but in the current, 1.2, it should be a
string" — i.e., the *same bytes* are a different data type depending which
spec vintage the parser on the other end implements, and the calling code has
no portable way to know which one it's talking to.

**InfoWorld, "7 YAML gotchas to avoid — and how to avoid them,"** Serdar
Yegulalp, 2022-08-17, catalogs this as one of seven recurring failure classes
(alongside unquoted strings, multiline-string ambiguity, boolean ambiguity,
octal notation, executable-tag risk, and serialization inconsistency across
libraries), and its own closing recommendation is: "Don't use it. Or at least,
don't use it directly" — i.e., generate YAML from a typed source rather than
hand-author it.

### 1.4 Duplicate keys: the spec is normatively clear, but nothing enforces it, and real parsers disagree on the wrong answer

The **YAML 1.2.2 spec itself** (yaml.org/spec/1.2.2/, §3.2.1.1) requires that
a mapping's keys form a set "with the restriction that each of the keys is
unique" — but the spec does not mandate that a conformant processor reject a
document that violates this. The practical result, per **GitHub issue
`go-yaml/yaml#154`**: a document with two `scrape_configs:` top-level keys was
parsed by silently discarding the first block and keeping the second, which
the reporter states is backwards from what the spec text implies ("the first,
not the last, occurrence should be valid") — and no error was raised either
way. **HitchDev, "What is wrong with duplicate keys?"** generalizes the
failure mode: with `x: cow` followed 200 lines later by `x: bull`, "a user
might very likely change the *first* `x` and erroneously believe that the
resulting value of `x` has been changed — when it hasn't," because the parser
silently resolves to the last occurrence. Different real parsers disagree on
*which* occurrence wins (PyYAML and yaml-cpp: last-value-wins; older Symfony:
first-value-wins; newer Symfony: throws), so the same malformed document is
silently misinterpreted differently by different consumers of "the same"
interchange format.

### 1.5 Spec size and surface area

**Martin Tournoij (arp242), "YAML: probably not so great after all,"**
arp242.net, first published 2016-09-04, updated 2019-04-15, states the raw
comparison: the YAML spec runs to roughly 23,449 words against TOML's 3,339 —
and separately notes "nine ways to write a multi-line string in YAML with
subtly different behaviour." The **"In Defense of YAML"** piece (below,
§5) — written specifically to rebut this style of criticism — does not
dispute the count; it concedes "the YAML 1.2.2 spec runs to ten chapters with
sections numbered four levels deep" and "dozens of ways to express multiline
strings." That a defense of YAML concedes the complexity claim rather than
contesting it is itself evidence the underlying fact isn't in dispute.

---

## 2. Markdown as a data container

Markdown's problem for a *data* substrate is upstream of YAML entirely: there
was never one normative grammar to begin with, which is precisely why
CommonMark had to be invented. The **CommonMark spec's own introduction**
(spec.commonmark.org/0.31.2/ — written by the format's own maintainers, John
MacFarlane et al.) states the founding problem in its own words:

> John Gruber's canonical description "does not specify the syntax
> unambiguously." … "Because there is no unambiguous spec, implementations
> have diverged considerably." … "To make matters worse, because nothing in
> Markdown counts as a 'syntax error,' the divergence often isn't discovered
> right away."

That last sentence is the load the rest of this section rests on: a
malformed or ambiguously-formed data record in Markdown does not fail to
parse — it silently parses to *something*, and different tools silently
choose different somethings, with no error signal at any point to say the
document diverged from intent. This is the same failure shape as YAML's
duplicate-key and implicit-typing problems (§1.2, §1.4) — for a data
substrate, the fact that both layers of the stack share the "silently accept
and reinterpret" failure mode compounds rather than cancels.

---

## 3. Frontmatter specifically

Frontmatter is not a specification anyone ratified; it is a convention that
spread by imitation, and it diverges exactly where a convention with no
owning body would be expected to diverge: delimiters and permitted formats.

**FormatArc, "Markdown Frontmatter YAML to JSON — 5 SSGs, 5 YAML Traps,"**
2026-06-22 (fetched directly), tabulates the actual divergence across five
static-site generators:

| Tool | Delimiters accepted | Notable restriction |
|---|---|---|
| Jekyll | `---` only | YAML only — rejects TOML and JSON outright; even an empty post needs `---\n---` |
| Hugo | `---`, `+++`, `{...}` | Most lenient: YAML, TOML, *and* JSON natively, plus Org-mode |
| Astro | `---`, `+++` | Does not parse JSON frontmatter natively — must be converted first |
| Eleventy | `---`, `{...}` | TOML is an add-on, not built in |
| Gatsby/Docusaurus | `---` only | YAML only, no TOML/JSON in core |

Five tools that all call the block "frontmatter," five different rulesets for
what's even legal inside it.

**`jlevy/frontmatter-format`** (GitHub README, fetched directly) — a project
explicitly attempting to generalize the convention across file types — is
itself the clearest admission that no normative document exists: its FAQ asks
"Hasn't this been done before?" and answers "Possibly, but as far as I can
tell, not in a systematic way for multiple file formats." A project whose
entire premise is *finally writing down* the convention is evidence the
convention was never written down.

**The delimiter collides with Markdown's own syntax.** `---` is also
CommonMark's horizontal-rule (and Setext-heading) marker. **GitHub issue
`prettier/prettier#9788`** (fetched directly) shows the concrete failure: given

```
---
---

# Title 1

Hello, world

---

text
```

Prettier's formatter, with embedded-language formatting on, misparses the
horizontal rule that follows "Hello, world" and converts it into a heading
marker instead — i.e., an empty frontmatter block changes how a *later,
unrelated* `---` in the document body is interpreted. The bug is not exotic:
it is the direct, predictable consequence of overloading one token (`---`) for
two unrelated grammatical roles (frontmatter fence, horizontal rule) in the
same file, and it is position- and context-dependent in a way that isn't
visibly flagged to the author writing the document.

---

## 4. Practitioner regret

This is the category the brief asks be weighted most heavily, and it is also
the thinnest in unambiguous "we built X and reverted" postmortems — most of
what surfaces is teams hitting a specific wall and routing around it, which is
weaker evidence than a full reversal but is still concrete and dated.

**George Nance, "Don't use frontmatter to separate your markdown files in
GatsbyJS,"** 2020-08-27 (fetched directly) — a first-person account of exactly
the failure mode this file is investigating. His own statement of the trigger:
"I wanted to simplify how my blog generated articles so I could focus on
creating content and not figuring out why a post was missing" — i.e.,
frontmatter-field-based content typing was silently dropping posts, and
debugging *why* consumed time that should have gone to the content itself. His
fix was to stop using a frontmatter field as the source of truth for content
type and use the filesystem path instead — moving structural information out
of the free-form YAML block and into a mechanism the tool couldn't silently
misparse.

**GitHub issue `gatsbyjs/gatsby#2670`** (fetched directly) is the mechanism
behind that class of failure, reported independently: Gatsby infers its
GraphQL schema from whatever frontmatter fields happen to be present across
all Markdown files, so filtering on a field that exists in *some* files but
not *all* of them throws `Unknown field` — verbatim: `GraphQL Error Argument
"filter" has invalid value {frontmatter: {draft: {ne: true}}}. In field
"frontmatter": In field "draft": Unknown field.` The reporter's workaround was
to create a placeholder file just to force the field into existence. This is
the structural cost of frontmatter having no schema: the schema is inferred
after the fact from whatever happens to be on disk, so adding a new field
anywhere requires either touching every existing file or accepting silent
gaps.

**Dan Holloran, "Obsidian Properties and Frontmatter: Stop Treating Metadata
as an Afterthought,"** 2026-06-03 (fetched directly) — a practitioner account
of the same failure at knowledge-base scale rather than CMS scale: "You add a
tag here, a status field there — and suddenly half your notes have
inconsistent frontmatter, your Dataview queries keep returning empty tables,
and you're not sure which notes even have a `due_date` key." His summary
line: "Metadata in Obsidian is powerful, but it's easy to let it sprawl into
something unmaintainable." This is the corpus-level version of the duplicate-
key problem (§1.4): nothing forces cross-file consistency, so drift
accumulates invisibly until a query silently returns less than it should,
with no error to point at the cause.

**Nuxt Content v3** (content.nuxt.com/blog/v3, fetched directly) is the
clearest instance of an actual framework reversing course, though it should
be read carefully — the reversal is about the *runtime* substrate, not the
authoring format (Markdown/YAML/JSON files stay as the source of truth). The
announcement's own stated reasons for moving production content resolution
onto a SQLite database rather than parsing files at runtime: "Using a
database instead of the file-based storage reduces many I/O operations when
querying large datasets," and, more concretely, that v2 had to "load all
cache files to search through the content" at runtime, and that "a large
bundle size required to store all content files… was an issue when deploying
to serverless or edge platforms like Netlify, NuxtHub or Vercel," where "you
can't store data in server memory or use file-based databases like SQLite."
Read narrowly, this is a performance/deployment argument, not a data-
integrity one — but it is still a maintained framework's own team concluding
that parsing a tree of Markdown+frontmatter files *as the runtime query
substrate* does not scale, and quietly building a database underneath rather
than fixing the file-based path.

---

## 5. The counter-case to the counter-case

Briefly, because the operator already has the case for YAML+Markdown: the
piece that makes the strongest *defense* of YAML, **"In Defense of YAML,"**
Rich Iannone and Tomasz Kalinowski, Posit (opensource.posit.co), 2026-05-21,
does not contest git-diffability, human editability, no-build-step, or
plain-text longevity — those aren't in dispute anywhere in this research.
What it disputes is whether the *complexity and footgun* criticisms above
still apply to YAML 1.2 specifically. Its own framing, conceding the
historical criticisms were "not fabricated":

> "In YAML 1.1, the bare scalar `NO` was interpreted as the boolean value
> `false`." … "The implicit typing that created the Norway problem is gone.
> In the YAML 1.2 Core Schema, only `true` and `false`… are recognized as
> booleans." … "JSON is now a strict, proper subset of YAML 1.2, which means
> any valid JSON document parses identically as YAML."

Its thesis, in short: "the specification that actually governs the language
today is a different, safer, more predictable document" than the one every
Norway-problem blog post is describing. That claim is genuine and sourced
(the YAML 1.2.2 spec itself, §1.2, states its 2009 revision's "primary focus
was making YAML a strict superset of JSON") — but it is a claim about the
*specification*, and §1.3 above (PyYAML's 1.2 request open since 2017;
Kubernetes's 1.1-only dependency chain) is evidence that the *specification*
and the *installed base of parsers* are two different facts, nine-plus years
apart.

---

## Closing: what pinning YAML 1.2 + JSON Schema takes on, and what it doesn't buy back

On this evidence, a specification author pinning YAML frontmatter + Markdown
as the normative interchange form is taking on, at minimum: (a) a security
surface that a normative body (RFC 9512) explicitly flags for arbitrary-code-
execution and resource-exhaustion risk, both demonstrated in production code
this year (CVE-2026-45304); (b) an installed base of parsers that, per a
still-open 2017 issue against the reference Python implementation, has not
converged on which version of the format it's speaking; (c) a duplicate-key
rule the spec states normatively but does not require any processor to
enforce, with real parsers resolving the ambiguity in opposite directions;
(d) a host document format (Markdown) whose own maintainers built a second,
stricter specification (CommonMark) specifically because "nothing in Markdown
counts as a syntax error"; and (e) a frontmatter convention that has no
owning body at all, diverges across every major tool that implements it, and
shares a delimiter token (`---`) with an unrelated piece of the host
document's own grammar.

Pinning YAML 1.2's JSON Schema — the strictest of YAML's built-in schemas,
the same restriction the OpenAPI Specification (v3.2.0) and RFC 9512 §3.4
both independently converged on recommending for exactly this reason — does
mitigate a real, well-defined subset of the above: the Norway problem, the
sexagesimal and octal implicit-typing surprises, and `.inf`/`.nan` (all of
which the JSON Schema tag set simply does not define). It does **not**
mitigate: the anchor/alias resource-exhaustion and tag-driven code-execution
risks (those are structural to the YAML data model, not the schema layer, per
RFC 9512 §4.1–4.2); the duplicate-key ambiguity (a mapping-node rule
unrelated to scalar typing); the fact that most real-world parsers a
document might pass through (PyYAML, and anything built on libyaml) do not
implement 1.2 resolution rules regardless of what the document itself claims
to conform to, so "pinned to 1.2 JSON Schema" is a claim about the
specification's text, not an enforceable guarantee about every consumer's
behavior; or anything in §2–§3 above, since the Markdown-ambiguity and
frontmatter-convention problems live entirely outside the YAML layer that a
schema pin can reach.

---

## Sources

Fetched and quoted directly:

1. [noyaml.com](https://noyaml.com/) — noyaml.com (undated single-page site cataloguing YAML pitfalls)
2. ["YAML: probably not so great after all"](https://www.arp242.net/yaml-config.html) — Martin Tournoij (arp242), arp242.net, published 2016-09-04, updated 2019-04-15
3. ["The Norway Problem — why StrictYAML refuses to do implicit typing and so should you"](https://hitchdev.com/strictyaml/why/implicit-typing-removed/) — HitchDev / StrictYAML docs (undated)
4. ["The YAML Document from Hell"](https://ruuda.nl/2023/the-yaml-document-from-hell) — Ruud van Asseldonk, ruuda.nl, 2023-01-11
5. [go-yaml/yaml issue #154 — "YAML spec violation: Duplicate keys are silently ignored, and parser selects incorrect key"](https://github.com/go-yaml/yaml/issues/154) — GitHub issue
6. ["Billion laughs attack"](https://en.wikipedia.org/wiki/Billion_laughs_attack) — Wikipedia (undated, checked for YAML-specific content and CVE-2019-11253 reference)
7. ["Markdown Frontmatter YAML to JSON — 5 SSGs, 5 YAML Traps, No Upload"](https://formatarc.com/en/blog/markdown-frontmatter-yaml-json/) — FormatArc Editorial Team, 2026-06-22
8. ["Don't use frontmatter to separate your markdown files in GatsbyJS — Use the file system"](https://georgenance.com/articles/dont-use-frontmatter-markdown-files-gatsby) — George Nance, 2020-08-27
9. ["7 YAML gotchas to avoid — and how to avoid them"](https://www.infoworld.com/article/2336307/7-yaml-gotchas-to-avoidand-how-to-avoid-them.html) — Serdar Yegulalp, InfoWorld, 2022-08-17
10. [kubernetes/kubernetes issue #34146 — "kubectl / kubernetes not 100% compatible with YAML 1.2"](https://github.com/kubernetes/kubernetes/issues/34146) — GitHub issue
11. ["In Defense of YAML"](https://opensource.posit.co/blog/2026-05-21_in-defense-of-yaml/) — Rich Iannone and Tomasz Kalinowski, Posit, 2026-05-21
12. ["What is wrong with duplicate keys?"](https://hitchdev.com/strictyaml/why/duplicate-keys-disallowed/) — HitchDev / StrictYAML docs (undated)
13. ["CVE-2026-45304: YAML Parser Exponential Memory Allocation via Recursive Collection-Alias Expansion ('Billion Laughs')"](https://symfony.com/blog/cve-2026-45304-yaml-parser-exponential-memory-allocation-via-recursive-collection-alias-expansion-billion-laughs) — Symfony Blog, published 2026-05-20
14. [prettier/prettier issue #9788 — "Empty YAML front matter breaks horizontal rules in markdown when formatting"](https://github.com/prettier/prettier/issues/9788) — GitHub issue
15. [jlevy/frontmatter-format README](https://github.com/jlevy/frontmatter-format) — GitHub repository (undated)
16. [YAML Spec 1.2.2](https://yaml.org/spec/1.2.2/) — yaml.org, official specification (§1.2 History, §3.2.1.1 mapping-key uniqueness, chapter 10 schemas)
17. [CommonMark Spec 0.31.2](https://spec.commonmark.org/0.31.2/) — commonmark.org, official specification, introduction section
18. [gatsbyjs/gatsby issue #2670 — "GraphQL query filter errors if Frontmatter key doesn't exist"](https://github.com/gatsbyjs/gatsby/issues/2670) — GitHub issue
19. [github/yaml/pyyaml issue #116 — "YAML 1.2 support"](https://github.com/yaml/pyyaml/issues/116) — GitHub issue, opened 2017-12-27, open as of this research
20. ["Announcing Nuxt Content version 3"](https://content.nuxt.com/blog/v3) — Nuxt Content team, content.nuxt.com
21. [OpenAPI Specification v3.2.0](https://spec.openapis.org/oas/v3.2.0.html) — OpenAPI Initiative, official specification
22. [RFC 9512 — "YAML Media Type"](https://datatracker.ietf.org/doc/html/rfc9512) — R. Polli, E. Wilde, E. Aro; IETF, February 2024
23. ["Obsidian Properties and Frontmatter: Stop Treating Metadata as an Afterthought"](https://danholloran.me/posts/obsidian-properties-and-frontmatter-a-practical-guide) — Dan Holloran, 2026-06-03

Searched but explicitly excluded as unreliable (aggregator/low-provenance
content, not relied on for any claim above):

- ascii.co.uk article on the "Norway problem" persisting — a syndication/aggregator page with no named author and thin sourcing; its specific parser-adoption claims were cross-checked instead against the primary GitHub issues (`yaml/pyyaml#116`, `kubernetes/kubernetes#34146`) cited above.

Fetch attempted and failed (not used for any claim):

- medium.com/insiderengineering "Managing Markdown as Data" — returned HTTP 403, not read, not cited.
