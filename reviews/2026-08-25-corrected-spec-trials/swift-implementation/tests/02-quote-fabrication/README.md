# 02-quote-fabrication

Exercises **ERF-51** (the normalization sequence) and **ERF-52** (the quote
check: elision marker, order, no overlap, whole words at span edges).

Each atom is one attempt to make the validator certify a quote the source
does not contain. `PASS (HOLE)` marks an attempt that succeeded.

| atom | case | expected | what is attempted |
|:--|:--|:--|:--|
| `fab-001` | f01-catapult-plain | FAIL | SPEC's own example in ERF-52. The whole-words rule must stop it. |
| `fab-002` | f02-hyphen-boundary | PASS (HOLE) | Same fabrication, but the character after `cat` is a hyphen. ERF-52: 'A span that opens or closes on punctuation is unconstrained on that side.' The source never contained the words 'The cat'. |
| `fab-003` | f03-soft-hyphen | PASS (HOLE) | U+00AD SOFT HYPHEN, general category Cf, is neither letter, digit nor combining mark, so it is a free boundary. PDF and EPUB extraction emits these by the thousand, and ERF-70 permits any named deterministic extractor. |
| `fab-004` | f04-zero-width-space | PASS (HOLE) | U+200B ZERO WIDTH SPACE, also category Cf. NFC does not remove it and it is not White_Space, so step 3 does not collapse it either. |
| `fab-005` | f05-underscore-join | FAIL | ERF-51 step 2 deletes `_`, so the text folds to `catapult` and the boundary closes. Marker removal helps the check here rather than the attacker. |
| `fab-006` | f06-bare-subword | FAIL | ERF-52: 'quoting `cat` out of `catapult` is the same fabrication without the marker'. No elision involved. |
| `fab-007` | f07-case | FAIL | ERF-51: 'Case MUST NOT be folded.' |
| `fab-008` | f08-out-of-order | FAIL | 'in order and without overlap'. |
| `fab-009` | f09-subword-continuation | FAIL | The second span would have to be lifted out of `sat` or `mat`. Whole-words closes it on the left. |
| `fab-010` | f10-all-empty | FAIL | ERF-52: 'A quote whose spans are all empty MUST fail rather than trivially pass.' |
| `fab-011` | f11-empty-flanks | PASS | Leading and trailing empty spans are dropped; the one non-empty span is a whole word. Legitimate, and worth pinning because it is the shape f10 shades into. |
| `fab-012` | f12-elision-that-elides-nothing | PASS (minor hole) | Nothing at all was removed between the spans; the marker asserts an omission that did not happen. ERF-52 leaves the gap 'unbounded by design', which the prose defends at the top end and never bounds at the bottom. |
| `fab-013` | f13-across-a-heading | PASS (by design) | A meaning reversal assembled across a section boundary. ERF-52 delegates this to the audit explicitly, so it is a documented non-hole, not a defect. Recorded because it is the largest thing the check does not do. |
| `fab-014` | f14-nbsp | PASS under Unicode White_Space / FAIL under ASCII | U+00A0 has the White_Space property but is not ASCII whitespace. ERF-51 step 3 says 'collapse whitespace runs' and never says which set. Two conforming tools disagree on this pair. |
| `fab-015` | f15-nfd-source | PASS | The source holds a decomposed e-acute; the quote holds the precomposed one. This is the pair NFC exists for. |
| `fab-016` | f16-combining-boundary | FAIL | Span ends on a letter and the next character is a letter. The combining-mark clause matters only when the source is left decomposed, which NFC prevents. |
| `fab-017` | f17-footnote-asterisk | PASS (HOLE) | ERF-51 step 2 deletes every `*`, including a footnote marker that is content rather than emphasis. The quote drops the qualifier that the marker carried and still reads as verbatim. |
| `fab-018` | f18-multiplication | PASS (HOLE) | Same deletion, on an asterisk that is an operator. The quote states a number the source does not contain. |
| `fab-019` | f19-greedy-needs-skipping | PASS | The leftmost occurrence of `cat` is inside `category` and fails the boundary test; a correct implementation must skip to the next candidate rather than give up. Pins that leftmost-VALID, not leftmost, is the search. |
