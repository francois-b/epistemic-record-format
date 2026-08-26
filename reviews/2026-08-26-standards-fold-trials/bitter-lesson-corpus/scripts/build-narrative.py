#!/usr/bin/env python3
"""build-narrative.py 1.0.0 — assemble the bound narrative.

The narrative reproduces Sutton's essay, so the prose must be the essay's
bytes and not a retyping of them. The script reads the paragraphs out of
`corpus/normalized/sutton-2019-bitter-lesson.md` by line index, splits a
paragraph where a binding falls mid-paragraph by locating a supplied cut
phrase with `str.index`, and writes the narrative bindings between the
pieces. Every anchor is likewise lifted from the paragraph by substring
(ERF-31 requires the anchor to occur in its passage), so a mistyped anchor
raises here rather than reaching the validator as a broken binding.
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BOUND_AT = "2026-08-26"

# (source line in the normalized essay, cut phrase or None, claim ids, anchor)
PLAN = [
    (7, "Most AI research has been conducted",
     ["computation-leveraging-methods-win-over-seventy-years",
      "compute-cost-per-unit-continues-to-fall-exponentially"],
     "general methods that leverage computation are ultimately the most effective"),
    (7, None,
     ["most-ai-research-assumes-constant-computation",
      "knowledge-and-computation-compete-for-researcher-time"],
     "Time spent on one is time not spent on the other"),
    (8, None,
     ["deep-blue-won-by-massive-deep-search",
      "deep-blue-was-simpler-than-its-knowledge-based-rivals",
      "majority-of-chess-researchers-viewed-the-1997-win-with-dismay",
      "defeated-chess-researchers-called-brute-force-ungeneral-and-inhuman"],
     "were based on massive, deep search"),
    (9, None,
     ["computer-go-repeated-the-chess-pattern-twenty-years-later",
      "human-knowledge-efforts-in-go-proved-irrelevant-once-search-scaled",
      "learning-played-no-big-role-in-the-1997-chess-program",
      "self-play-learning-brings-massive-computation-to-bear",
      "search-and-learning-are-the-two-techniques-that-use-massive-computation"],
     "only delayed by a further 20 years"),
    (10, None,
     ["darpa-ran-an-early-speech-recognition-competition-in-the-1970s",
      "speech-entrants-used-hand-built-human-knowledge",
      "hmm-based-methods-were-the-rival-side-in-the-1970s-speech-programme",
      "statistical-methods-beat-human-knowledge-methods-in-speech",
      "statistics-and-computation-came-to-dominate-natural-language-processing",
      "deep-learning-dramatically-improved-speech-recognition",
      "deep-learning-speech-systems-rely-less-on-human-knowledge"],
     "an early competition, sponsored by DARPA, in the 1970s"),
    (11, None,
     ["early-computer-vision-used-edges-cylinders-and-sift",
      "early-computer-vision-methods-are-discarded-today",
      "modern-vision-networks-use-only-convolution-and-invariances"],
     "But today all this is discarded"),
    (12, "The bitter lesson is based on the historical observations",
     ["the-field-is-still-making-the-same-mistakes"],
     "we are continuing to make the same kind of mistakes"),
    (12, None,
     ["ai-researchers-often-build-knowledge-into-their-agents",
      "building-in-knowledge-always-helps-in-the-short-term",
      "built-in-knowledge-plateaus-and-inhibits-progress-in-the-long-run",
      "breakthroughs-arrive-by-scaling-search-and-learning",
      "chess-engines-abandoned-hand-crafted-evaluation-for-learning"],
     "in the long run it plateaus and even inhibits further progress"),
    (13, None,
     ["search-and-learning-scale-arbitrarily-with-computation"],
     "The two methods that seem to scale arbitrarily in this way"),
    (14, None,
     ["the-contents-of-minds-are-irredeemably-complex",
      "build-in-only-meta-methods"],
     "we should build in only the meta-methods"),
]

PREAMBLE = """The prose below is Rich Sutton's, quoted in full from the essay
registered in this corpus as `sutton-2019-bitter-lesson` and copied from its
normalized text by script rather than retyped. Nothing in it has been edited.
The only additions are the narrative bindings, which are HTML comments and so
invisible in any render, and this note. The corpus takes no standing on any
claim a binding names; every claim in it is a proposal.
"""


def main() -> int:
    lines = (ROOT / "corpus" / "normalized" / "sutton-2019-bitter-lesson.md") \
        .read_text(encoding="utf-8").split("\n")
    out = [PREAMBLE.strip(), "", "## " + lines[0].strip(), "",
           "*" + lines[2].strip() + ", " + lines[4].strip() + "*", ""]
    remainder = {}
    for lineno, cut, claims, anchor in PLAN:
        para = remainder.pop(lineno, lines[lineno - 1])
        if cut:
            i = para.index(cut)
            piece, rest = para[:i].rstrip(), para[i:]
            remainder[lineno] = rest
        else:
            piece = para
        if anchor not in piece:
            print(f"anchor not in its passage (line {lineno}): {anchor!r}",
                  file=sys.stderr)
            return 2
        out.append(piece)
        out.append(f'<!-- claims: {" ".join(claims)} "{anchor}" '
                   f'bound-at={BOUND_AT} -->')
        out.append("")

    fm = ('---\ntype: "narrative"\n'
          'title: "The Bitter Lesson, bound to its claims"\n'
          'corpus: "bitter-lesson"\n'
          'created:\n  timestamp: "2026-08-26"\n'
          '  by: "agent/claude-opus-5"\n---\n\n')
    (ROOT / "corpus" / "narrative-bitter-lesson-bound.md").write_text(
        fm + "\n".join(out).rstrip() + "\n", encoding="utf-8")
    print(f"narrative written with {len(PLAN)} narrative bindings")
    return 0


if __name__ == "__main__":
    sys.exit(main())
