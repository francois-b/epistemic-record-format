# 05-narrative-passages

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
| `n5-escapes` | `\"` and `\\` in the anchor | anchor found, clean |
| `n6-arrow-in-anchor` | anchor contains `-->` | grammar-legal, CommonMark-illegal. ambiguities.md ERF-31 #3 |
| `n7-in-code-fence` | a binding inside a fenced code block | **reading-dependent**. ambiguities.md ERF-31 #6 |
| `n8-hard-wrapped` | anchor spans a hard-wrapped newline | anchor found (the case ERF-31 says the fold settles) |
| `n9-anchor-after-binding` | anchor lifted from after the last binding | ERF-31 **flag** |
| `n10-subword-anchor` | anchor `cat` inside `catapult` | passes: ERF-31 invokes ERF-51 only, never ERF-52's whole-words rule |
| `n11-grammar-failures` | six malformed candidates plus one ordinary comment | six ERF-31 violations, the ordinary comment untouched |
| `n12-staleness` | a bound claim with a later `last_modified`; an id resolving to nothing | ERF-32 flag; ERF-33 violation |
