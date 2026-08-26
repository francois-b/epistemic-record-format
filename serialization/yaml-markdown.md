---
title: "The YAML/Markdown serialization, version 1"
purpose: "How the model of SPEC.md section 3 maps to files: one record per file, YAML frontmatter plus a markdown body. Normative for any corpus exchanged in this serialization, which is the interchange default."
status: normative
serialization_version: 1
spec_version: "0.9.0"
last_updated: 2026-08-25
---

# The YAML/Markdown serialization, version 1

A **serialization** says how the model maps to bytes. Nothing in this
document concerns a transport: a corpus in this serialization is the same
corpus whether it arrives over HTTP, on a disk, or in a git clone. This one
is the format's first and its interchange default: a producer that does not
know its recipient's serialization ships this one, and every corpus in this
repository is held in it. `SPEC.md` section 7 states what every
serialization must satisfy; this document states what this one does. (This
document was "the YAML/Markdown binding" until 2026-08-26; the format now
uses *binding* for narrative bindings only. The `YAMLB` ids keep their
letters, since an id never changes.)

Rules that moved here from `SPEC.md` on 2026-08-25 keep the `ERF` ids they
carried, so that nothing citing them breaks; they retire there and are never
reused. Rules that were always this serialization's own carry `YAMLB` ids, a flat
sequence under the same discipline.

## 1. The interchange form

One record per file: YAML frontmatter, then a markdown body, for every
record type. An atom's body is empty, so its file is frontmatter alone; the
shape is still frontmatter plus body, not a bare YAML document. The
declaration and the source list are YAML documents with no body. A
narrative is a markdown document with frontmatter whose only structured
content is its narrative bindings (schema `Narrative`). Discovery is by content and
never by path: every file carries `type` (`ERF-54`).

The source list's top level is exactly `type` and `sources` (schema `SourceList`):

```yaml
type: sources
sources:
  pacioli-1494-geijsbeek: {…}
```

The nesting is written out because an earlier wording named both keys
without saying which contained which, and an independent implementation
read the entries as further top-level keys beside `type`.

The file conventions below are conventions and not rules. A record is a `.md`
file: YAML frontmatter, then the body. A corpus's declaration is
`corpus.yaml` and its source list is `sources.yaml`. A held text, raw or
normalized, sits wherever its source entry names it by path, which is the only
place a path is stated and the only place one is read. None of these names
binds anything, because discovery is by content (`ERF-54`): a tool that
dispatches on a filename is reading something this serialization never wrote, and a
corpus that arranges its files differently is exactly as conforming. No media
type is registered for any of these files. `text/markdown` describes a record
*body* and not the file that carries it, since the file is frontmatter plus
body and nothing standard names that pair.

That a canonical interchange form exists, and that a store may hold a corpus
any other way provided it round-trips without loss, is `ERF-53` in
`SPEC.md`. That the form is this one is this section.

## 2. Encoding and body

- <a id="erf-67"></a>**ERF-67** A record body is CommonMark, and a file MUST be UTF-8
  encoded with LF line endings and no byte-order mark. Markdown without a
  named dialect is not a format, which is the gap CommonMark was written
  to close; every UTF-8 string is valid CommonMark, so naming the dialect
  fixes how a body renders and folds rather than excluding any body. An
  unstated encoding is a verbatim check waiting to fail on a byte nobody
  chose. `ERF-66` cannot be checked through a YAML library's tree, since
  duplicate keys, anchors, aliases and tags are resolved away before a
  tree exists; a validator reads the parser's event stream.

## 3. Parsing frontmatter

- <a id="erf-65"></a>**ERF-65** Frontmatter MUST parse under YAML 1.2 using the **JSON
  schema**, the narrowest of the three the specification defines. Under it
  only `null`, the literals `true` and `false`, and JSON's own number
  grammar resolve to non-string scalars; everything else stays a string.
  The hazard being excluded is a legacy default: YAML 1.1 defines a
  timestamp type, and common libraries keep it in their default schema, so
  an unquoted `timestamp` became a date object and made a claim's computed
  disposition depend on how a weekday name sorts. A producer SHOULD quote
  a timestamp regardless, so that a reader on a legacy schema still
  receives a string. Where the model types
  a field as a string and its bare spelling resolves to another type under
  this schema, which is `true`, `false`, `null` and JSON's number grammar,
  a producer MUST quote it: `as_of_date: "2018"`, `hits_reported: "0"`,
  `hits_reported: "1e3"`, `spec_version: "1.0"`. A bare year is JSON number
  grammar, so the schema that stops the timestamp hazard does not stop
  this one, and `spec_version: 1.0` arrives as a number that renders back
  as `1` with the minor version gone. Spellings a legacy YAML 1.1 reader
  retypes and this schema does not, `012`, `no`, `on`, `0.9.0`, a producer
  SHOULD quote as well, since most readers a file meets are legacy ones.
  String-typed means every field section 3 types as a string, every id
  and family name, and every source id; `citation` is typed by CSL and
  outside this rule. An empty scalar resolves to `null`. A validator MUST
  report a string-typed field that arrived as any other type, and the
  report is a violation.

## 4. Keys and structure

- <a id="yamlb-2"></a>**YAMLB-2** An empty list MUST be omitted on the wire, and a reader
  materializes it (`ERF-56`); an optional mapping that is present and
  empty MUST be written as `{}`, because presence asserts existence and
  `evidence_at_stance: {}` is a different fact from its absence. A file
  should not spend a line saying nothing, and a producer generalizing the
  list rule to mappings destroys the one fact `ERF-20` calls
  unrecoverable.

- <a id="erf-66"></a>**ERF-66** A document's frontmatter MUST NOT contain a duplicate key, an
  anchor, an alias, or an explicit tag. YAML permits all four and leaves a
  processor's response to duplicates at its own discretion, so two
  conforming parsers may legally disagree about the same file. A record is
  a flat structure and needs none of them; declining them removes the
  disagreement rather than adjudicating it.

## 5. The narrative binding's spelling

- <a id="yamlb-1"></a>**YAMLB-1** A narrative binding MUST be spelled as an HTML comment, so
  that it is invisible in every render and survives any markdown pipeline:

```markdown
<!-- claims: no-continuous-claim-check "no test that runs on claims" bound-at=2026-08-23 -->
```

```
narrative-binding ::= "<!--" ws* "claims:" ws+ ids ws+ anchor
                      ws+ "bound-at=" date ws* "-->"
date     ::= YYYY "-" MM "-" DD
ids      ::= id (ws+ id)*
id       ::= one or more characters, none of them whitespace, '"', '<' or '>'
anchor   ::= '"' char+ '"'
char     ::= any character other than '"' and '\', or one of the
             two-character escapes '\"' and '\\'
ws       ::= any Unicode White_Space character, line breaks included
```

  Ids are separated by whitespace and never by commas, because a comma
  inside an unquoted list invites a parser to guess. The anchor carries
  two escapes because a grammar that cannot express a legal value is a
  defect in the grammar: a passage whose own words sit in quotation marks
  would otherwise have no anchor. The escapes are decoded before the
  anchor is folded (`ERF-31`).

  Recognition precedes validation. A candidate is `<!--` followed by
  `claims:` where CommonMark would read an HTML comment, never inside a
  code span or a code block, since a document explaining bindings mentions
  `<!--` in a code span and a raw scan then swallows the next real binding
  as comment text. A candidate is delimited at the first `-->` before the
  grammar is applied, so that a greedy `ids` cannot eat the next binding; a
  candidate whose first `-->` comes after another `<!--`, or never, is
  unterminated, extends to the end of its own line so the bindings after
  it stay visible, and is reported (`ERF-31`).

## 6. Worked examples

The records `SPEC.md` describes, as this serialization writes them.

### A source list entry

```yaml
sources:
  pacioli-1494-geijsbeek:
    citation_text: "Luca Pacioli, Particularis de Computis et Scripturis
      (Venice, 1494), ch. 36, trans. Geijsbeek 1914"
    citation:
      type: book
      author: [{family: Pacioli, given: Luca}]
      title: "Particularis de Computis et Scripturis"
      publisher-place: Venice
      issued: 1494
      chapter-number: 36
      translator: [{family: Geijsbeek, given: John B.}]
    received:
      url: "https://archive.org/download/ancientdoubleent00geijuoft/ancientdoubleent00geijuoft.pdf"
      path: raw/pacioli-1494-geijsbeek.pdf
      digest: "sha256:05e58ce3f2589584d7d36446c46e2f74ab14f33ee6d1f0f20ef5e21c2aeaf2aa"
      timestamp: 2026-08-23
    status: shipped-as-quotation
    normalized: normalized/pacioli-1494-geijsbeek.md
    normalized_digest: "sha256:1b9a0c47d3e8f5a2c6b4e09f7d132a8be5c40f6719d2ab83c5e7104f9a6d2b3e"
    extraction: "pymupdf4llm 0.3.4"
    normalization: "pandoc 3.1.11 --wrap=none"
    excerpt: {timestamp: 2026-08-23, by: "agent/claude-sonnet-5"}
```

### An atom

```yaml
---
id: kwg-117
type: atom
corpus: knowledge-work-governance
finding: "Pacioli's 1494 treatise states the double-entry rule
  explicitly: every ledger entry is made twice, once as a debit
  and once as a credit."
quote: "All entries made in the ledger have to be double entries --
  that is, if you make one creditor, you must make some one debtor."
source: pacioli-1494-geijsbeek
source_quality: high
created: {timestamp: 2026-07-19, by: "agent/claude-fable-5"}
finding_audit:
  - {auditor: deepseek-v4-pro, verdict: SUPPORTED, timestamp: 2026-07-19,
     protocol: finding-audit-v2}
  - {auditor: gemini-3.5-flash, verdict: SUPPORTED, timestamp: 2026-07-19,
     protocol: finding-audit-v2}
---
```

### A claim

```yaml
---
id: citators-disagree-on-negative-treatment
type: claim
corpus: knowledge-work-governance
title: "The major legal citators disagree substantially on identifying
  negative treatment, and the leading vendor defense is that no
  objectively correct interpretation exists"
epistemic_kind: observation
created: {timestamp: 2026-08-22, by: "agent/claude-fable-5"}
families: [prior-art]
atoms_for: [kwg-014, kwg-015, kwg-016]
---
The major legal citators disagree substantially on identifying negative
treatment, and the leading vendor defense is that no objectively correct
interpretation exists.

## Working notes
...
```

### A survey

```yaml
---
id: granted-flag-uses-2026-08-22
type: survey
corpus: knowledge-work-governance
title: "Current uses of the granted field across the registered corpora"
conducted: {timestamp: 2026-08-22, by: "agent/claude-fable-5"}
searches:
  - tool: "grep -rnE (BSD grep, macOS)"
    query: "^granted:|^  granted:"
    scope: "every claim and question file in a private working collection
      of corpora"
    hits_reported: "0"
  - tool: "grep -rn (BSD grep, macOS)"
    query: "granted (word-level, --include=*.md)"
    scope: "the same claim and question files"
    hits_reported: "4 lines in 3 files; none a field use"
notable_results:
  - what: "A doc-class granted dimension in a corpus's own documentation"
    note: "A render-layer field of one document class, described in that
      corpus's own documentation; the word's nearest live relative, not a
      record field."
---
```

## 7. What this serialization costs (non-normative)

YAML was inherited from the working practice the format was extracted from,
not chosen; `docs/history.md` records that no forcing instance stands
behind it, alone among the format's decisions. A sourced survey of the case
against it is at
`reviews/2026-08-25-post-ruling-trials/yaml-markdown-case-against.md`. In
short: pinning YAML 1.2's JSON schema (section 3 above) stops the scalar
hazards, the boolean words, sexagesimal and octal forms, `.inf` and `.nan`,
and OpenAPI 3.2 and RFC 9512 section 3.4 converged on the same restriction
for the same reason. It does not stop the anchor and alias expansion
surface, which is structural to YAML's data model and which section 4
above declines rather than adjudicates; nor the duplicate-key ambiguity;
nor the fact that most parsers a document passes through implement YAML
1.1 resolution regardless of what the document claims. Two cold
implementations on 2026-08-25 found their parsers offered no way to select
the JSON schema at all. A pinned schema is a claim about the document, not
about what a consumer will do to it, and a producer that quotes every
string-typed scalar (section 3) is the only defence that travels with the
file.

A second serialization, over SQL, is drafted from the 2026-08-25 relational
trial and is the proof that the model survives leaving this one.

## References

- YAML 1.2: yaml.org/spec/1.2.2
- CommonMark 0.31.2: spec.commonmark.org
- RFC 3629, *UTF-8, a transformation format of ISO 10646* (STD 63)
