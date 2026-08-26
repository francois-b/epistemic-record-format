#!/usr/bin/env python3
# Generates tests/02-quote-fabrication/. Written as a script because several
# of the attacks turn on characters that do not survive a shell heredoc:
# U+00AD SOFT HYPHEN, U+200B ZERO WIDTH SPACE, U+00A0 NO-BREAK SPACE, and a
# decomposed e-acute.
import os, shutil

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "02-quote-fabrication")
if os.path.isdir(BASE):
    shutil.rmtree(BASE)
os.makedirs(os.path.join(BASE, "normalized"))

# id -> (normalized text, quote, expectation, what is being attempted)
CASES = {
 "f01-catapult-plain": (
   "The catapult was heavy. Someone eventually sat down.\n",
   "The cat[...]sat",
   "FAIL",
   "SPEC's own example in ERF-52. The whole-words rule must stop it."),

 "f02-hyphen-boundary": (
   "The cat-apult was heavy. Someone eventually sat down.\n",
   "The cat[...]sat",
   "PASS (HOLE)",
   "Same fabrication, but the character after `cat` is a hyphen. ERF-52: 'A span "
   "that opens or closes on punctuation is unconstrained on that side.' The source "
   "never contained the words 'The cat'."),

 "f03-soft-hyphen": (
   "The cat­apult was heavy. Someone eventually sat down.\n",
   "The cat[...]sat",
   "PASS (HOLE)",
   "U+00AD SOFT HYPHEN, general category Cf, is neither letter, digit nor combining "
   "mark, so it is a free boundary. PDF and EPUB extraction emits these by the "
   "thousand, and ERF-70 permits any named deterministic extractor."),

 "f04-zero-width-space": (
   "The cat​apult was heavy. Someone eventually sat down.\n",
   "The cat[...]sat",
   "PASS (HOLE)",
   "U+200B ZERO WIDTH SPACE, also category Cf. NFC does not remove it and it is not "
   "White_Space, so step 3 does not collapse it either."),

 "f05-underscore-join": (
   "The cat_apult was heavy. Someone eventually sat down.\n",
   "The cat[...]sat",
   "FAIL",
   "ERF-51 step 2 deletes `_`, so the text folds to `catapult` and the boundary "
   "closes. Marker removal helps the check here rather than the attacker."),

 "f06-bare-subword": (
   "The catapult was heavy.\n",
   "cat",
   "FAIL",
   "ERF-52: 'quoting `cat` out of `catapult` is the same fabrication without the "
   "marker'. No elision involved."),

 "f07-case": (
   "The cat sat on the mat.\n",
   "the cat sat",
   "FAIL",
   "ERF-51: 'Case MUST NOT be folded.'"),

 "f08-out-of-order": (
   "The cat sat on the mat.\n",
   "sat[...]cat",
   "FAIL",
   "'in order and without overlap'."),

 "f09-subword-continuation": (
   "The cat sat on the mat.\n",
   "cat[...]at",
   "FAIL",
   "The second span would have to be lifted out of `sat` or `mat`. Whole-words "
   "closes it on the left."),

 "f10-all-empty": (
   "The cat sat on the mat.\n",
   "[...]",
   "FAIL",
   "ERF-52: 'A quote whose spans are all empty MUST fail rather than trivially pass.'"),

 "f11-empty-flanks": (
   "The cat sat on the mat.\n",
   "[...]cat[...]",
   "PASS",
   "Leading and trailing empty spans are dropped; the one non-empty span is a whole "
   "word. Legitimate, and worth pinning because it is the shape f10 shades into."),

 "f12-elision-that-elides-nothing": (
   "The cat sat on the mat.\n",
   "The[...]cat",
   "PASS (minor hole)",
   "Nothing at all was removed between the spans; the marker asserts an omission "
   "that did not happen. ERF-52 leaves the gap 'unbounded by design', which the "
   "prose defends at the top end and never bounds at the bottom."),

 "f13-across-a-heading": (
   "## Conclusion\n\nThe tool failed every acceptance test.\n\n"
   "## Appendix\n\nEvery smoke test passed.\n",
   "The tool[...]passed.",
   "PASS (by design)",
   "A meaning reversal assembled across a section boundary. ERF-52 delegates this "
   "to the audit explicitly, so it is a documented non-hole, not a defect. Recorded "
   "because it is the largest thing the check does not do."),

 "f14-nbsp": (
   "The cat sat on the mat.\n",
   "cat sat",
   "PASS under Unicode White_Space / FAIL under ASCII",
   "U+00A0 has the White_Space property but is not ASCII whitespace. ERF-51 step 3 "
   "says 'collapse whitespace runs' and never says which set. Two conforming tools "
   "disagree on this pair."),

 "f15-nfd-source": (
   "Le rôle du café dans la vie publique.\n",
   "café",
   "PASS",
   "The source holds a decomposed e-acute; the quote holds the precomposed one. "
   "This is the pair NFC exists for."),

 "f16-combining-boundary": (
   "Le rôle du café dans la vie publique.\n",
   "caf",
   "FAIL",
   "Span ends on a letter and the next character is a letter. The combining-mark "
   "clause matters only when the source is left decomposed, which NFC prevents."),

 "f17-footnote-asterisk": (
   "Revenue grew 40%* in 2024.\n\n\\* excluding the divested unit.\n",
   "Revenue grew 40% in 2024.",
   "PASS (HOLE)",
   "ERF-51 step 2 deletes every `*`, including a footnote marker that is content "
   "rather than emphasis. The quote drops the qualifier that the marker carried and "
   "still reads as verbatim."),

 "f18-multiplication": (
   "The staffing model assumes 3*4 reviewer-hours per matter.\n",
   "The staffing model assumes 34 reviewer-hours per matter.",
   "PASS (HOLE)",
   "Same deletion, on an asterisk that is an operator. The quote states a number "
   "the source does not contain."),

 "f19-greedy-needs-skipping": (
   "The category is broad. The cat sat quietly.\n",
   "cat[...]sat",
   "PASS",
   "The leftmost occurrence of `cat` is inside `category` and fails the boundary "
   "test; a correct implementation must skip to the next candidate rather than "
   "give up. Pins that leftmost-VALID, not leftmost, is the search."),
}

decl = """type: corpus
id: fabrication-trial
title: "Fabrication attempts against the ERF-52 quote check"
spec_version: "0.9.0"
owner: "human:fb"
"""
open(os.path.join(BASE, "corpus.yaml"), "w").write(decl)

src_lines = ["type: sources", "sources:"]
for cid, (text, quote, expect, why) in sorted(CASES.items()):
    open(os.path.join(BASE, "normalized", cid + ".md"), "w").write(text)
    src_lines.append("  %s:" % cid)
    src_lines.append('    citation_text: "Synthetic text %s, authored for this trial"' % cid)
    src_lines.append("    status: shipped-as-quotation")
    src_lines.append("    normalized: normalized/%s.md" % cid)
open(os.path.join(BASE, "sources.yaml"), "w").write("\n".join(src_lines) + "\n")

def yq(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'

n = 0
readme = ["# 02-quote-fabrication", "",
          "Exercises **ERF-51** (the normalization sequence) and **ERF-52** (the quote",
          "check: elision marker, order, no overlap, whole words at span edges).", "",
          "Each atom is one attempt to make the validator certify a quote the source",
          "does not contain. `PASS (HOLE)` marks an attempt that succeeded.", "",
          "| atom | case | expected | what is attempted |", "|:--|:--|:--|:--|"]
for cid, (text, quote, expect, why) in sorted(CASES.items()):
    n += 1
    aid = "fab-%03d" % n
    open(os.path.join(BASE, aid + ".md"), "w").write(
        "---\n"
        "id: %s\n"
        "type: atom\n"
        "corpus: fabrication-trial\n"
        "finding: %s\n"
        "quote: %s\n"
        "source: %s\n"
        "source_quality: low\n"
        "limitations: %s\n"
        "created: {timestamp: 2026-08-25, by: \"human:fb\"}\n"
        "---\n" % (aid, yq("Fabrication probe %s: %s" % (cid, expect)), yq(quote), cid,
                   yq(why.replace("\n", " "))))
    readme.append("| `%s` | %s | %s | %s |" % (aid, cid, expect, why.replace("\n", " ")))
open(os.path.join(BASE, "README.md"), "w").write("\n".join(readme) + "\n")
print("wrote %d atoms to %s" % (n, BASE))
