---
title: "The YAML/Markdown binding, version 1"
purpose: "How the model of SPEC.md section 3 maps to files: one record per file, YAML frontmatter plus a markdown body. Normative for any corpus exchanged in this binding, which is the interchange default."
status: normative
binding_version: 1
spec_version: "0.9.0"
last_updated: 2026-08-25
---

# The YAML/Markdown binding, version 1

A **binding** says how the model maps to bytes. This one is the format's
first and its interchange default: a producer that does not know its
recipient's binding ships this one, and every corpus in this repository is
held in it. `SPEC.md` section 7 states what every binding must satisfy;
this document states what this one does.

Requirement ids here are the ids the rules carried in `SPEC.md` before they
moved on 2026-08-25. They keep them so that nothing already citing them
breaks. A later version of this document takes its own id namespace, and
these ids retire in `SPEC.md` and are never reused.

## 1. The interchange form

One record per file: YAML frontmatter, then a markdown body, for every
record type. An atom's body is empty, so its file is frontmatter alone; the
shape is still frontmatter plus body, not a bare YAML document. The
declaration and the source list are YAML documents with no body. A
narrative is a markdown document with frontmatter whose only structured
content is its narrative bindings (`ERF-34`). Discovery is by content and
never by path: every file carries `type` (`ERF-54`).

That a canonical interchange form exists, and that a store may hold a corpus
any other way provided it round-trips without loss, is `ERF-53` in
`SPEC.md`. That the form is this one is this section.

## 2. Encoding and body

- **ERF-67** A record body MUST be valid CommonMark, and a file MUST be
  UTF-8 encoded with LF line endings and no byte-order mark. Markdown
  without a named dialect is not a format, which is the gap CommonMark was
  written to close, and an unstated encoding is a verbatim check waiting to
  fail on a byte nobody chose.

## 3. Parsing frontmatter

- **ERF-65** Frontmatter MUST parse under YAML 1.2 using the **JSON
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

- **ERF-66** A record's frontmatter MUST NOT contain a duplicate key, an
  anchor, an alias, or an explicit tag. YAML permits all four and leaves a
  processor's response to duplicates at its own discretion, so two
  conforming parsers may legally disagree about the same file. A record is
  a flat structure and needs none of them; declining them removes the
  disagreement rather than adjudicating it.

## 5. The narrative binding's spelling

The grammar of a narrative binding, an HTML comment closing a passage with
its claim ids, a quoted anchor carrying two escapes, and `bound-at`, is
stated in `ERF-31`. The concept (a passage bound to claims, with an anchor
that must occur in it and a date the binding was made) belongs to the
model; the spelling as an HTML comment in CommonMark belongs to this
binding, and will move here when `ERF-31` is split.

## 6. What this binding costs (non-normative)

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

A second binding, over SQL, is drafted from the 2026-08-25 relational trial
and is the proof that the model survives leaving this one.
