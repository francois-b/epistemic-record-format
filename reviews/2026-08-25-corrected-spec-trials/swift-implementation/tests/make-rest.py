#!/usr/bin/env python3
"""Generates tests/03..06."""
import os, shutil

HERE = os.path.dirname(os.path.abspath(__file__))

def fresh(name):
    d = os.path.join(HERE, name)
    if os.path.isdir(d): shutil.rmtree(d)
    os.makedirs(d)
    return d

def decl(d, cid, title):
    open(os.path.join(d, "corpus.yaml"), "w").write(
        'type: corpus\nid: %s\ntitle: "%s"\nspec_version: "0.9.0"\nowner: "human:fb"\n' % (cid, title))

def claim(d, cid, corpus, kind, edges=None, standings=None, atoms_for=None, last_modified=None, title=None):
    L = ["---", "id: %s" % cid, "type: claim", "corpus: %s" % corpus,
         'title: "%s"' % (title or ("Claim " + cid)),
         "epistemic_kind: %s" % kind,
         'created: {timestamp: 2026-08-01, by: "human:fb"}']
    if last_modified:
        L.append('last_modified: {timestamp: %s, by: "human:fb"}' % last_modified)
    if atoms_for:
        L.append("atoms_for: [%s]" % ", ".join(atoms_for))
    if edges:
        L.append("edges:")
        for to, rel in edges:
            L.append("  - {to: %s, relation: %s}" % (to, rel))
    if standings:
        L.append("standings:")
        for ts, st, by, why in standings:
            L.append('  - {timestamp: "%s", stance: %s, by: "%s", why: "%s"}' % (ts, st, by, why))
    L += ["---", "%s." % (title or ("Claim " + cid)), ""]
    open(os.path.join(d, cid + ".md"), "w").write("\n".join(L))

# ---------------------------------------------------------------- 03 ERF-43
d = fresh("03-premise-closure")
decl(d, "closure-trial", "Premise-closure cases for ERF-43")
C = "closure-trial"
# c1 well-founded
claim(d, "c1-arg-ok", C, "argument", edges=[("c1-obs", "assumes")])
claim(d, "c1-obs", C, "observation")
# c2 THE LITERAL CONFIGURATION ERF-43's cycle clause names:
#   "X assumes Y and Y supports X both make Y a premise of X".
# Under the orientation ERF-24 gives, these are two edges asserting the SAME
# premise (Y of X). It is not a cycle. See ambiguities.md ERF-43 #1.
claim(d, "c2-x", C, "argument", edges=[("c2-y", "assumes")])
claim(d, "c2-y", C, "observation", edges=[("c2-x", "supports")])
# c2b a real cycle in the premise relation, via assumes alone
claim(d, "c2b-m", C, "argument", edges=[("c2b-n", "assumes")])
claim(d, "c2b-n", C, "argument", edges=[("c2b-m", "assumes")])
# c3 mutual supports -- "two mutually supporting arguments made a literal traversal run forever"
claim(d, "c3-p", C, "argument", edges=[("c3-q", "supports")])
claim(d, "c3-q", C, "argument", edges=[("c3-p", "supports")])
# c4 self-edge
claim(d, "c4-self", C, "argument", edges=[("c4-self", "assumes")])
# c5 closure terminating in an argument leaf
claim(d, "c5-outer", C, "argument", edges=[("c5-inner", "assumes")])
claim(d, "c5-inner", C, "argument",
      standings=[("2026-08-02T09:00:00Z", "for", "human:fb", "I rely on it.")])
# c6 closure terminating in a retired leaf
claim(d, "c6-arg", C, "argument", edges=[("c6-leaf", "assumes")])
claim(d, "c6-leaf", C, "observation",
      standings=[("2026-08-02T09:00:00Z", "for", "human:fb", "Held at the time."),
                 ("2026-08-03T09:00:00Z", "withdrawn", "human:fb", "Left it; the framing moved.")])
# c7 decomposes-into cycle
claim(d, "c7-d1", C, "observation", edges=[("c7-d2", "decomposes-into")])
claim(d, "c7-d2", C, "observation", edges=[("c7-d1", "decomposes-into")])
# c8 diamond: a claim reached twice is visited once
claim(d, "c8-top", C, "argument", edges=[("c8-l", "assumes"), ("c8-r", "assumes")])
claim(d, "c8-l", C, "argument", edges=[("c8-bottom", "assumes")])
claim(d, "c8-r", C, "argument", edges=[("c8-bottom", "assumes")])
claim(d, "c8-bottom", C, "observation")
# c9 a genuine premise-relation cycle between two NON-arguments: does the
# cycle prohibition reach claims no argument's closure ever visits?
claim(d, "c9-obs-a", C, "observation", edges=[("c9-obs-b", "assumes")])
claim(d, "c9-obs-b", C, "observation", edges=[("c9-obs-a", "assumes")])
# c10 an argument with no premises at all: empty closure, vacuously satisfied
claim(d, "c10-bare", C, "argument")
open(os.path.join(d, "README.md"), "w").write("""# 03-premise-closure

Exercises **ERF-43** (premise closure, cycle prohibition over the oriented
premise relation, self-edges, non-argument leaves, retired leaves, termination)
and **ERF-49** (unbacked flags).

| case | shape | expected |
|:--|:--|:--|
| `c1-*` | argument assumes an observation | clean |
| `c2-*` | `X assumes Y`, `Y supports X` -- the literal configuration ERF-43's cycle clause names | **not a cycle** under ERF-24's orientation: two edges asserting the same premise. See ambiguities.md ERF-43 #1 |
| `c2b-*` | `M assumes N`, `N assumes M` | ERF-43 violation: a real cycle |
| `c3-*` | `P supports Q`, `Q supports P` | ERF-43 violation: the named runaway-traversal case |
| `c4-self` | `S assumes S` | ERF-43 violation: self-edge (and a cycle) |
| `c5-*` | closure ends in an argument with no premises | ERF-43 violation: leaf is an argument |
| `c6-*` | closure ends in a leaf whose disposition is `retired` | ERF-43 **flag**, not violation |
| `c7-*` | `decomposes-into` cycle | ERF-43 violation |
| `c8-*` | diamond | clean; proves the visited-set terminates without false cycles |
| `c9-*` | a premise cycle between two **observations**, reached by no argument | reading-dependent, see ambiguities.md ERF-43 #2 |
| `c10-bare` | argument with no premises | clean under ERF-43 (empty closure), no ERF-49 flag since nobody stands on it |
""")

# ---------------------------------------------------------------- 04 ERF-41
d = fresh("04-disposition")
decl(d, "disposition-trial", "Disposition cases for ERF-41")
C = "disposition-trial"
claim(d, "d01-no-standings", C, "observation", title="No standings at all")
claim(d, "d02-one-for", C, "observation", title="One for",
      standings=[("2026-08-01T10:00:00Z", "for", "human:fb", "Because.")])
claim(d, "d03-one-against", C, "observation", title="One against",
      standings=[("2026-08-01T10:00:00Z", "against", "human:fb", "Because not.")])
claim(d, "d04-contested", C, "observation", title="For and against",
      standings=[("2026-08-01T10:00:00Z", "for", "human:fb", "Yes."),
                 ("2026-08-01T11:00:00Z", "against", "human:jm", "No.")])
claim(d, "d05-withdrawn-only", C, "observation", title="Held then withdrawn",
      standings=[("2026-08-01T10:00:00Z", "for", "human:fb", "Yes."),
                 ("2026-08-02T10:00:00Z", "withdrawn", "human:fb", "Left it.")])
claim(d, "d06-one-left-one-stands", C, "observation", title="One left, one stands",
      standings=[("2026-08-01T10:00:00Z", "for", "human:fb", "Yes."),
                 ("2026-08-02T10:00:00Z", "withdrawn", "human:fb", "Left it."),
                 ("2026-08-03T10:00:00Z", "for", "human:jm", "Still yes.")])
claim(d, "d07-bad-stance-newest", C, "observation", title="Newest entry is out of vocabulary",
      standings=[("2026-08-01T10:00:00Z", "for", "human:fb", "Yes."),
                 ("2026-08-02T10:00:00Z", "maybe", "human:fb", "Not sure any more.")])
claim(d, "d08-all-bad-stances", C, "observation", title="Every entry out of vocabulary",
      standings=[("2026-08-01T10:00:00Z", "maybe", "human:fb", "Hmm."),
                 ("2026-08-02T10:00:00Z", "leaning", "human:jm", "Hmm too.")])
claim(d, "d09-same-instant-tie", C, "observation", title="One person, two stances, same instant",
      standings=[("2026-08-01T10:00:00Z", "for", "human:fb", "Yes."),
                 ("2026-08-01T10:00:00Z", "against", "human:fb", "No.")])
claim(d, "d10-withdraw-then-other-against", C, "observation", title="Withdrawal plus an against",
      standings=[("2026-08-01T10:00:00Z", "for", "human:fb", "Yes."),
                 ("2026-08-02T10:00:00Z", "withdrawn", "human:fb", "Left it."),
                 ("2026-08-03T10:00:00Z", "against", "human:jm", "It is false.")])
claim(d, "d11-bare-date-standing", C, "observation", title="Standing carrying a bare date",
      standings=[("2026-08-01", "for", "human:fb", "Yes.")])
open(os.path.join(d, "README.md"), "w").write("""# 04-disposition

Exercises **ERF-41** (computed disposition, per-person newest entry, withdrawal
as exit, a stance outside the vocabulary) and **ERF-19** (a standing's
timestamp is a full RFC 3339 instant).

Run `erfval tests/04-disposition --dispositions` to see the computation trace.

| claim | expected disposition | why |
|:--|:--|:--|
| `d01-no-standings` | `proposal` | no standings at all |
| `d02-one-for` | `active` | |
| `d03-one-against` | `rejected` | |
| `d04-contested` | `contested` | two people, opposed |
| `d05-withdrawn-only` | `retired` | nothing remains after discarding withdrawals |
| `d06-one-left-one-stands` | `active` | |
| `d07-bad-stance-newest` | **reading-dependent** | reported as an ERF-41/ERF-55 violation either way; see ambiguities.md ERF-41 #1 |
| `d08-all-bad-stances` | **reading-dependent** (`proposal` here) | |
| `d09-same-instant-tie` | **undetermined by the spec** (`rejected` here) | ambiguities.md ERF-41 #2 |
| `d10-withdraw-then-other-against` | `rejected` | |
| `d11-bare-date-standing` | `active` | plus an ERF-19 violation for the bare date |
""")

# ---------------------------------------------------------------- 05 ERF-31
d = fresh("05-narrative-passages")
decl(d, "passage-trial", "Narrative-binding passage cases for ERF-31")
C = "passage-trial"
for cid in ["p-alpha", "p-beta", "p-gamma", "p-delta"]:
    claim(d, cid, C, "observation", title="Bound claim " + cid)
claim(d, "p-moved", C, "observation", title="A claim edited after it was bound",
      last_modified="2026-08-30")

def narrative(name, body, title):
    open(os.path.join(d, name), "w").write(
        '---\ntype: narrative\ntitle: "%s"\ncorpus: %s\ncreated: {timestamp: 2026-08-25, by: "human:fb"}\n---\n%s'
        % (title, C, body))

# n1: first binding -- passage runs from the start of the body.
narrative("n1-first-binding.md", """The first sentence of the document asserts something.

<!-- claims: p-alpha "first sentence of the document" bound-at=2026-08-25 -->
""", "First binding")

# n2: second binding's anchor lifted from BEFORE the first binding.
narrative("n2-anchor-from-earlier-passage.md", """Alpha territory: the ledger is append-only.

<!-- claims: p-alpha "the ledger is append-only" bound-at=2026-08-25 -->

Beta territory: dispositions are computed.

<!-- claims: p-beta "the ledger is append-only" bound-at=2026-08-25 -->
""", "Anchor lifted from the previous passage")

# n3: two bindings with nothing between them.
narrative("n3-adjacent-bindings.md", """Some prose that says a thing.

<!-- claims: p-alpha "prose that says a thing" bound-at=2026-08-25 -->
<!-- claims: p-beta "prose that says a thing" bound-at=2026-08-25 -->
""", "Two bindings with nothing between them")

# n3b: empty anchor against an empty passage.
narrative("n3b-empty-anchor.md", """Some prose that says a thing.

<!-- claims: p-alpha "prose that says a thing" bound-at=2026-08-25 -->
<!-- claims: p-beta "" bound-at=2026-08-25 -->
""", "Empty anchor, empty passage")

# n4: a malformed candidate between two bindings.
narrative("n4-malformed-between.md", """Alpha territory: the ledger is append-only.

<!-- claims: p-alpha "the ledger is append-only" bound-at=2026-08-25 -->

Beta territory: dispositions are computed.

<!-- claims: p-beta bound-at=2026-08-25 -->

Gamma territory: sources are listed once.

<!-- claims: p-gamma "dispositions are computed" bound-at=2026-08-25 -->
""", "A malformed candidate between two bindings")

# n5: anchor carrying both escapes.
narrative("n5-escapes.md", r"""He wrote "nothing further" and a backslash \ followed.

<!-- claims: p-alpha "wrote \"nothing further\" and a backslash \\ followed" bound-at=2026-08-25 -->
""", "Anchor escapes")

# n6: anchor containing the comment terminator.
narrative("n6-arrow-in-anchor.md", """The pipeline reads raw --> extracted --> normalized.

<!-- claims: p-alpha "raw --> extracted" bound-at=2026-08-25 -->
""", "An anchor containing the comment terminator")

# n7: a binding inside a fenced code block.
narrative("n7-in-code-fence.md", """Here is how a binding is spelled:

```
<!-- claims: p-alpha "some words" bound-at=2026-08-25 -->
```

The real assertion is that anchors survive edits.

<!-- claims: p-beta "anchors survive edits" bound-at=2026-08-25 -->
""", "A binding inside a code fence")

# n8: an anchor whose passage is hard-wrapped across a newline.
narrative("n8-hard-wrapped.md", """The mechanism that exists to detect moved
prose then detects almost nothing at all.

<!-- claims: p-alpha "detect moved prose then detects" bound-at=2026-08-25 -->
""", "A hard-wrapped anchor")

# n9: an anchor lifted from AFTER the last binding.
narrative("n9-anchor-after-binding.md", """Alpha territory says one thing.

<!-- claims: p-alpha "sources are listed once per corpus" bound-at=2026-08-25 -->

Sources are listed once per corpus, which is the trailing text.
""", "Anchor lifted from after the binding")

# n10: an anchor that is a sub-word of its passage.
narrative("n10-subword-anchor.md", """The catapult was the wrong metaphor.

<!-- claims: p-alpha "cat" bound-at=2026-08-25 -->
""", "A sub-word anchor")

# n11: grammar failures, one per comment.
narrative("n11-grammar-failures.md", """Prose that says a thing about ledgers.

<!-- claims: p-alpha, p-beta "says a thing" bound-at=2026-08-25 -->

More prose that says a thing about ledgers.

<!-- claims: p-alpha "says a thing" -->

More prose that says a thing about ledgers.

<!-- claims: p-alpha"says a thing" bound-at=2026-08-25 -->

More prose that says a thing about ledgers.

<!-- claims: p-alpha "says a thing" bound-at=2026-8-25 -->

More prose that says a thing about ledgers.

<!-- claims: p-alpha "says a thing bound-at=2026-08-25 -->

More prose that says a thing about ledgers.

<!-- claims: p-alpha "says a \\thing" bound-at=2026-08-25 -->

An ordinary HTML comment, which is not a narrative binding at all.

<!-- just a note to myself -->
""", "Grammar failures")

# n12: staleness and an unresolvable id.
narrative("n12-staleness.md", """A passage resting on a claim that has since moved.

<!-- claims: p-moved "resting on a claim that has since moved" bound-at=2026-08-25 -->

A passage resting on a claim that does not exist.

<!-- claims: p-nonexistent "resting on a claim that does not exist" bound-at=2026-08-25 -->
""", "Staleness and an unresolved id")

open(os.path.join(d, "README.md"), "w").write("""# 05-narrative-passages

Exercises **ERF-31** (the narrative-binding grammar, the two escapes, recognize
-then-validate, and the definition of "its passage"), **ERF-32** (staleness) and
**ERF-33** (an id that resolves to nothing).

Run `erfval tests/05-narrative-passages --bindings` to see each binding's
computed passage.

| file | edge case | expected |
|:--|:--|:--|
| `n1-first-binding` | first binding: passage starts at the body | anchor found, clean |
| `n2-anchor-from-earlier-passage` | anchor lifted from the passage above the previous binding | ERF-31 **flag** |
| `n3-adjacent-bindings` | two bindings, nothing between them | second passage is empty; ERF-31 **flag** |
| `n3b-empty-anchor` | empty anchor `""` against that empty passage | passes trivially; see ambiguities.md ERF-31 #5 |
| `n4-malformed-between` | a malformed candidate between two bindings | **reading-dependent**: flag under R1, clean under R2. ambiguities.md ERF-31 #2 |
| `n5-escapes` | `\\"` and `\\\\` in the anchor | anchor found, clean |
| `n6-arrow-in-anchor` | anchor contains `-->` | grammar-legal, CommonMark-illegal. ambiguities.md ERF-31 #3 |
| `n7-in-code-fence` | a binding inside a fenced code block | **reading-dependent**. ambiguities.md ERF-31 #6 |
| `n8-hard-wrapped` | anchor spans a hard-wrapped newline | anchor found (the case ERF-31 says the fold settles) |
| `n9-anchor-after-binding` | anchor lifted from after the last binding | ERF-31 **flag** |
| `n10-subword-anchor` | anchor `cat` inside `catapult` | passes: ERF-31 invokes ERF-51 only, never ERF-52's whole-words rule |
| `n11-grammar-failures` | six malformed candidates plus one ordinary comment | six ERF-31 violations, the ordinary comment untouched |
| `n12-staleness` | a bound claim with a later `last_modified`; an id resolving to nothing | ERF-32 flag; ERF-33 violation |
""")

# ---------------------------------------------------------------- 06 ERF-65
d = fresh("06-scalar-types")
os.makedirs(os.path.join(d, "normalized"))
open(os.path.join(d, "corpus.yaml"), "w").write(
    'type: corpus\nid: types-trial\ntitle: "Scalar arrival types"\nspec_version: 1.0\nowner: "human:fb"\n')
open(os.path.join(d, "normalized", "t.md"), "w").write("The rate was 4 percent in 2018.\n")
open(os.path.join(d, "sources.yaml"), "w").write("""type: sources
sources:
  012:
    citation_text: "A source whose id has a leading zero"
    status: shipped-as-quotation
    normalized: normalized/t.md
  no:
    citation_text: "A source whose id is the word no"
    status: shipped-as-quotation
    normalized: normalized/t.md
  ts:
    citation_text: "A source with an unquoted timestamp"
    status: shipped-as-quotation
    normalized: normalized/t.md
    excerpt: {timestamp: 2026-08-23, by: "human:fb"}
""")
open(os.path.join(d, "ty-001.md"), "w").write("""---
id: ty-001
type: atom
corpus: types-trial
finding: "The rate is reported for a single year."
quote: "The rate was 4 percent in 2018."
source: ts
source_quality: high
as_of_date: 2018
created: {timestamp: 2026-08-25, by: "human:fb"}
---
""")
open(os.path.join(d, "ty-002.md"), "w").write("""---
id: ty-002
type: atom
corpus: types-trial
finding: "A finding whose title-shaped neighbour arrived as a boolean."
quote: "The rate was 4 percent in 2018."
source: 012
source_quality: high
limitations: true
created: {timestamp: 2026-08-25, by: "human:fb"}
---
""")
open(os.path.join(d, "ty-survey-2026-08-25.md"), "w").write("""---
id: ty-survey-2026-08-25
type: survey
corpus: types-trial
title: "A survey whose yield arrived as a number"
conducted: {timestamp: 2026-08-25, by: "human:fb"}
searches:
  - tool: "grep -rn (BSD grep, macOS)"
    query: "rate"
    hits_reported: 0
---
Body.
""")
open(os.path.join(d, "ty-claim.md"), "w").write("""---
id: ty-claim
type: claim
corpus: types-trial
title: "A claim carrying a family name that reads as a word"
epistemic_kind: observation
created: {timestamp: 2026-08-25, by: "human:fb"}
created: {timestamp: 2026-08-26, by: "human:jm"}
families: [no, 012, 2018]
atoms_for: [ty-001]
---
A claim carrying a family name that reads as a word.
""")
open(os.path.join(d, "README.md"), "w").write("""# 06-scalar-types

Exercises **BINDING ERF-65** ("A validator MUST report a string-typed field
that arrived as any other type") and **BINDING ERF-66** (no duplicate key,
anchor, alias or explicit tag).

Every scalar here is written bare. Under the YAML 1.2 **JSON schema** that
ERF-65 pins, only `null`, `true`, `false` and JSON's number grammar leave
string-hood.

| field | bare spelling | resolves to | reported? |
|:--|:--|:--|:--|
| `spec_version` | `1.0` | float | yes |
| `as_of_date` | `2018` | integer | yes |
| `hits_reported` | `0` | integer | yes |
| `limitations` | `true` | boolean | yes |
| `families[2]` | `2018` | integer | yes |
| source id | `012` | **string** (leading zero is not JSON number grammar) | **no** |
| source id / family | `no` | **string** (only `true`/`false` are literals) | **no** |
| `excerpt.timestamp` | `2026-08-23` | **string** | **no** |
| duplicate `created` key | — | — | ERF-66 |

The last three rows are the finding: ERF-65's own list of what a producer MUST
quote names `"012"`, `"no"` and a timestamp, and under the schema ERF-65
mandates, none of those three needs quoting. See ambiguities.md ERF-65 #2.
""")
print("wrote 03, 04, 05, 06")
