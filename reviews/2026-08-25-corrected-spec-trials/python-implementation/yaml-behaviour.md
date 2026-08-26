# PyYAML against the binding's YAML 1.2 JSON schema

A register of every place PyYAML's default behaviour and `ERF-65`'s
requirement met, with exact inputs and exact returns.

The requirement:

> **ERF-65** Frontmatter MUST parse under YAML 1.2 using the **JSON schema**,
> the narrowest of the three the specification defines. Under it only `null`,
> the literals `true` and `false`, and JSON's own number grammar resolve to
> non-string scalars; everything else stays a string.

Environment: Python 3.14.0, PyYAML 6.0.3, macOS.

---

## 1. PyYAML offers no way to select a schema

There is no `schema=` parameter, no `YAML12Loader`, no resolver preset.
`yaml.SafeLoader` carries one hard-coded resolver table, and it is YAML 1.1's.
The binding's own section 6 says two cold implementations on 2026-08-25 "found
their parsers offered no way to select the JSON schema at all"; this is a
third.

What compliance costs, exactly: replace the resolver table. `erf_validate.py`
lines 40-70.

```python
class JsonSchemaLoader(yaml.SafeLoader):
    yaml_implicit_resolvers = {}          # NOT inherited; see below

JsonSchemaLoader.add_implicit_resolver(
    'tag:yaml.org,2002:null',  re.compile(r'^null$'),        ['n'])
JsonSchemaLoader.add_implicit_resolver(
    'tag:yaml.org,2002:null',  re.compile(r'^$'),            [''])
JsonSchemaLoader.add_implicit_resolver(
    'tag:yaml.org,2002:bool',  re.compile(r'^(true|false)$'), ['t', 'f'])
JsonSchemaLoader.add_implicit_resolver(
    'tag:yaml.org,2002:int',   re.compile(r'^-?(0|[1-9][0-9]*)$'),
    list('-0123456789'))
JsonSchemaLoader.add_implicit_resolver(
    'tag:yaml.org,2002:float',
    re.compile(r'^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][-+]?[0-9]+)?$'),
    list('-0123456789'))
```

Two traps in that alone:

- `yaml_implicit_resolvers = {}` must be written in the class body. PyYAML's
  `add_implicit_resolver` copies the parent table into the subclass *only if*
  the subclass has no table of its own. Subclass and call `add_...` without
  the empty dict, and you silently keep all of YAML 1.1 and add JSON's
  resolvers on top.
- The first-character index is a real index, not a hint. Registering the
  null resolver under `['n']` alone leaves the empty scalar unresolved,
  because PyYAML looks up `''` for an empty value. YAML 1.2's JSON schema has
  no production for the empty scalar at all (JSON has no such token); I chose
  to resolve it to `null` and say so here rather than let it become the string
  `''`.

## 2. The register

`v: <input>`, taken through `yaml.safe_load` (PyYAML's default, YAML 1.1) and
through `JsonSchemaLoader`.

| Input | PyYAML default | JSON schema (required) | Meets? |
|:--|:--|:--|:--|
| `2018` | `int 2018` | `int 2018` | same |
| `0` | `int 0` | `int 0` | same |
| `-0` | `int 0` | `int 0` | same |
| `1.0` | `float 1.0` | `float 1.0` | same |
| `0.9.0` | `str '0.9.0'` | `str '0.9.0'` | same |
| `2026-08-23` | **`datetime.date(2026, 8, 23)`** | `str '2026-08-23'` | **diverges** |
| `2026-08-23T14:02:00Z` | **`datetime.datetime`** | `str '2026-08-23T14:02:00Z'` | **diverges** |
| `2026-08-23 14:02:00` | **`datetime.datetime`** | `str` | **diverges** |
| `no` | **`bool False`** | `str 'no'` | **diverges** |
| `yes` | **`bool True`** | `str 'yes'` | **diverges** |
| `on` | **`bool True`** | `str 'on'` | **diverges** |
| `off` | **`bool False`** | `str 'off'` | **diverges** |
| `True` / `TRUE` | **`bool True`** | `str 'True'` / `str 'TRUE'` | **diverges** |
| `Null` / `NULL` | **`None`** | `str 'Null'` / `str 'NULL'` | **diverges** |
| `~` | **`None`** | `str '~'` | **diverges** |
| `012` | **`int 10`** (YAML 1.1 octal) | `str '012'` | **diverges** |
| `00` | **`int 0`** | `str '00'` | **diverges** |
| `07` | **`int 7`** | `str '07'` | **diverges** |
| `0x1F` | **`int 31`** | `str '0x1F'` | **diverges** |
| `1:30` | **`int 90`** (sexagesimal) | `str '1:30'` | **diverges** |
| `1_000` | **`int 1000`** | `str '1_000'` | **diverges** |
| `+1` | **`int 1`** | `str '+1'` | **diverges** |
| `.inf` / `-.inf` | **`float inf` / `-inf`** | `str '.inf'` | **diverges** |
| `.nan` | **`float nan`** | `str '.nan'` | **diverges** |
| `1.` | **`float 1.0`** | `str '1.'` | **diverges** |
| `.5` | **`float 0.5`** | `str '.5'` | **diverges** |
| `1e3` | `str '1e3'` | **`float 1000.0`** | **diverges, the other way** |
| `=` | **`ConstructorError`** | `str '='` | **diverges** |
| `<<` | **`ConstructorError`** | `str '<<'` | **diverges** |
| `null` | `None` | `None` | same |
| `true` / `false` | `bool` | `bool` | same |
| `0o17` | `str '0o17'` | `str '0o17'` | same |
| `2018-1-1` | `str '2018-1-1'` | `str '2018-1-1'` | same |
| `00:00:00` | `str '00:00:00'` | `str '00:00:00'` | same |
| `y` / `n` | `str` | `str` | same (PyYAML dropped the 1.1 `y`/`n` bools) |
| `"2018"` (quoted) | `str '2018'` | `str '2018'` | same — quoting always wins |
| empty (`v:`) | `None` | `None` | same by my choice; the schema is silent |

Twenty-eight of those diverge. Every one of them is a way for the same file to
mean two things.

### 2a. `1e3` runs the other way, and the binding does not mention it

Every hazard `ERF-65` names is a scalar the JSON schema *narrows* to a string.
`1e3` is the reverse: PyYAML's default leaves it a string, and the schema the
binding **requires** turns it into a float. `hits_reported: 1e3` is a
plausible spelling for a search yield ("as the instrument reported it",
`ERF-27`) and it is exactly the field `ERF-65` uses as an example. So the pin
does not only stop retyping; it introduces one that the legacy default did not
have. A producer that quotes everything is unaffected. A producer reading the
binding's list of hazards and quoting only those is not.

### 2b. `=` and `<<` are parse-level, not resolution-level

Under default PyYAML, `v: =` and `v: <<` do not return a value at all: they
raise `yaml.constructor.ConstructorError`, because 1.1's value and merge tags
resolve and then find no constructor. Under the JSON schema they are ordinary
strings. A file that a legacy reader **cannot load** loads cleanly under the
binding's schema. That is a stronger divergence than a retype and it is not in
`ERF-65`'s list.

### 2c. Merge keys change structure, not just scalars

```
x: &a {p: 1}
y:
  <<: *a
  q: 2
```

| Loader | Result |
|:--|:--|
| PyYAML default | `{'x': {'p': 1}, 'y': {'p': 1, 'q': 2}}` |
| JSON schema | `{'x': {'p': 1}, 'y': {'<<': {'p': 1}, 'q': 2}}` |

The JSON schema has no merge type, so `<<` is a literal key and the merge does
not happen. The two loaders return different *shapes*, not different scalar
types. `ERF-66` forbids anchors and aliases, so a conforming record never
reaches this — but a validator that reports `ERF-66` after loading has already
loaded a different document than a legacy reader would.

### 2d. Duplicate keys are silent under every loader

```
a: 1
a: 2
```

PyYAML default and `JsonSchemaLoader` both return `{'a': 2}`. No warning, no
error, no hook. `ERF-66` forbids duplicate keys, and PyYAML will not tell you
about them at any level of the API that returns data. Detecting them requires
composing the node tree yourself (`yaml.compose`) and walking
`MappingNode.value` before the constructor collapses it. `erf_validate.py`
`walk_node()`.

### 2e. Anchors, aliases and explicit tags need the event stream

`ERF-66` also forbids anchors, aliases and explicit tags. None of the three
survives into loaded data: an alias is indistinguishable from a repeated
literal, and `!!str "x"` is indistinguishable from `"x"`. Detection needs
`yaml.parse()` and an inspection of `event.anchor` and `event.tag` /
`event.implicit`. One trap: `AliasEvent` carries the anchor name in
`.anchor` too, so a naive loop reports one alias as both an alias and an
anchor.

## 3. What actually travels

The binding's own section 6 concedes it: "A pinned schema is a claim about the
document, not about what a consumer will do to it, and a producer that quotes
every string-typed scalar (section 3) is the only defence that travels with
the file."

This register supports that, and sharpens it. Of the five spellings `ERF-65`
tells a producer to quote:

| `ERF-65`'s example | Retyped by the JSON schema? | Retyped by PyYAML's default? |
|:--|:--|:--|
| `as_of_date: "2018"` | yes, `int` | yes, `int` |
| `hits_reported: "0"` | yes, `int` | yes, `int` |
| `spec_version: "0.9.0"` | **no**, stays a string | no |
| a source id `"012"` | **no**, stays a string | yes, `int 10` |
| a family name `"no"` | **no**, stays a string | yes, `bool False` |

`ERF-65`'s condition is "its bare spelling **would resolve to another type
under this schema**", and three of its five examples do not. Two of those
three are hazards only for a reader that ignores the schema the same sentence
just mandated. The rule and its examples describe different sets. See
`ambiguities.md` §5.

## 4. Non-YAML: characters that survive `ERF-51`

Recorded here because they came out of the same measurement session and they
decide quote-check outcomes.

| Character | `unicodedata.category` | `str.isspace()` | Survives `ERF-51`? |
|:--|:--|:--|:--|
| U+00AD SOFT HYPHEN | `Cf` | `False` | **yes** |
| U+200B ZERO WIDTH SPACE | `Cf` | `False` | **yes** |
| U+00A0 NO-BREAK SPACE | `Zs` | `True` | no, collapsed by step 3 |
| U+3000 IDEOGRAPHIC SPACE | `Zs` | `True` | no, collapsed by step 3 |
| U+2019 RIGHT SINGLE QUOTATION MARK | `Pf` | `False` | yes, and it is not a letter/digit/mark |

`Cf` characters are neither whitespace (so step 3 does not remove them) nor
"a letter, digit, or combining mark" (so `ERF-52`'s whole-words rule treats
them as word boundaries). An extractor that emits soft hyphens — which is
ordinary for PDF and for hyphenated web text — therefore turns every
hyphenation point in the normalized text into a legal quote boundary. That is
`tests/fabrication-succeeded/atoms/fab-003.md`.

Note also that step 3's whitespace set is unstated. `str.split()` uses
Python's Unicode whitespace set, which includes U+00A0 and U+3000. An
implementation reading "whitespace" as ASCII `[ \t\n\r\f\v]` gives different
verdicts on any source containing a non-breaking space, which is most
extracted web text.
