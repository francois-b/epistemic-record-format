#!/usr/bin/env python3
"""build-narrative 1.0.0 — the essay's prose with narrative bindings inserted.

The prose is the author's, taken byte for byte from the normalized text of the
source it is registered as, so that the two copies cannot drift (see
friction-log.md F-09, which is about the fact that nothing in the format stops
them drifting when they are edited separately).

A binding is appended to the end of the line that closes its passage, rather
than placed on a line of its own. On its own line at column zero it would end
any markdown list it sits inside, and indented far enough to stay inside the
list item it would become an indented code block, where YAMLB-1 says a
candidate is not recognized at all. Inline at the end of a paragraph line it is
an HTML comment in CommonMark wherever it sits.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "corpus", "normalized", "essay-2026-08-19.md")
OUT = os.path.join(ROOT, "corpus", "narrative", "epistemology-for-knowledge-work-in-the-llm-era.md")
BOUND_AT = "2026-08-25"

# (line number in the normalized essay that closes the passage, claim ids, anchor)
BINDINGS = [
 (13, ["scope-excludes-coding",
       "ai-tooling-is-further-along-for-coding-than-for-knowledge-work"],
      "for the wider spectrum of knowledge work it's still the Wild West"),
 (25, ["km-1990s-failed-on-the-cost-of-manual-maintenance",
       "llm-economics-remove-the-labour-that-sank-km"],
      "the manual work it took to build and maintain created too much friction"),
 (30, ["grounded-material-lowers-hallucination-risk-downstream",
       "recycled-llm-prose-degrades-quickly"],
      "recycled from call to call, degrades quickly"),
 (36, ["epistemology-means-tracking-provenance-and-trust"],
      "tracking provenance and trust so that a written assertion can be relied on"),
 (39, ["an-epistemic-layer-is-missing-from-knowledge-work-tooling"],
      "a whole layer that is not yet mainstream"),
 (50, ["mainstream-tools-file-text-by-subject-format-author-and-date",
       "trust-tracking-is-confined-to-niches-and-done-by-hand",
       "file-text-by-epistemic-type"],
      "has been tracked only in niches, and by hand"),
 (56, ["atom-is-one-quote-from-one-source"],
      "one quote from one source, small enough to support a single point"),
 (63, ["no-tool-records-human-versus-ai-authorship",
       "without-attribution-past-verdicts-cannot-be-separated"],
      "at a finer grain than today's tools record"),
 (68, ["recording-human-judgment-has-next-to-no-tooling"],
      "there is next to no tooling for it"),
 (73, ["tools-must-not-create-chores-of-their-own"],
      "they should never create chores of their own"),
 (92, ["the-workspace-layer-is-absent-from-ai-governance"],
      "This last layer is missing from the AI-governance conversation"),
 (100, ["the-approach-is-untested-beyond-one-person",
        "sharing-requires-semantic-and-pragmatic-interoperability",
        "pragmatic-interoperability-is-an-established-term"],
       "what the literature calls pragmatic interoperability"),
 (109, ["disciplines-form-around-mechanical-primitives",
        "knowledge-work-lacks-the-three-mechanical-primitives",
        "code-review-formed-around-diff",
        "continuous-integration-formed-around-automated-tests"],
       "Code review formed around diff, continuous integration around tests"),
 (114, ["general-primitives-fail-on-the-specific-versus-open-tension",
        "general-purpose-knowledge-primitives-have-repeatedly-failed",
        "successful-saas-picked-a-use-case-with-workflow-constraints"],
       "have failed again and again"),
 (121, ["pkm-is-broadly-manual-work",
        "crm-decays-because-it-must-be-maintained-by-hand",
        "enterprise-wikis-go-stale-and-are-cleaned-up-or-abandoned"],
       "A CRM has to be maintained by hand"),
 (142, ["memory-and-graph-tools-have-not-moved-beyond-pre-llm-work",
        "no-tool-adds-checked-provenance-claim-checking-or-standing",
        "records-and-disciplines-outlast-any-particular-llm"],
       "What none of them add is a primitive for checked provenance"),
 (150, ["three-kinds-of-check-are-distinct",
        "checks-mechanize-in-the-order-syntactic-semantic-pragmatic",
        "unstructured-prose-defeats-checking"],
       "Syntactic checks mechanize reliably, semantic checks partially"),
 (159, ["pieces-must-be-separately-adoptable",
        "separability-improves-the-odds-of-adoption"],
       "Keeping them separable is a design decision"),
 (167, ["atom-is-one-quote-from-one-source",
        "entailment-is-the-cold-reader-test"],
       "checked for entailment, whether the quote actually supports it"),
 (177, ["google-docs-records-authorship-no-finer-than-the-document",
        "git-records-changes-without-recording-ai-use",
        "cursor-blame-marks-ai-written-lines-with-their-model",
        "grammarly-authorship-is-a-per-document-sidecar-in-its-own-app",
        "author-built-a-save-time-authorship-shadow-record"],
       "The nearest thing for prose is Grammarly's authorship report"),
 (183, ["standing-is-operator-only-and-dated"],
       "only the operator moves it"),
 (193, ["governance-was-where-most-of-the-value-turned-out-to-be",
        "llm-fit-sharpened-the-authors-document-thinking",
        "the-workspace-governance-layer-is-where-the-value-is"],
       "The solution was to add more governance"),
 (200, ["speech-to-text-became-ubiquitous-in-2026"],
       "Speech-to-text became ubiquitous in 2026"),
 (203, ["author-system-holds-500-atoms-one-operator-six-months",
        "the-one-operator-evidence-base-bounds-every-claim"],
       "My system holds 500+ atoms, with one operator, in about six months"),
 (215, ["the-semantic-web-vision-produced-an-unstructured-web"],
       "The web was meant to be semantic but what accumulated was unstructured"),
 (223, ["knowledge-is-text-you-can-check-combine-and-stand-behind",
        "knowledge-engineering-descends-to-palantirs-ontologies"],
       "Knowledge engineering in the 1980s came at it from the formal side"),
 (229, ["agile-began-when-software-iteration-got-faster",
        "knowledge-work-gets-its-own-agile"],
       "this was the start of Agile, with short iterations, continuous integration, and refactoring"),
 (239, ["company-brain-was-a-yc-request-for-startups-for-summer-2026",
        "company-brain-products-ship-permission-aware-retrieval-with-agents",
        "company-brain-names-no-mechanism"],
       "The word anthropomorphizes and specifies nothing"),
 (248, ["page-grain-explains-the-three-absences",
        "company-brain-citations-are-not-checked",
        "notion-and-guru-verify-whole-pages-and-let-them-lapse",
        "nothing-records-authorship-below-the-grain-of-a-whole-page"],
       "The unit in those products is the page or the chunk, not the claim"),
 (252, ["agentic-marketing-outruns-its-substrate"],
       "Agentic AI is being marketed while much of what sits underneath it is underserved"),
 (275, ["entailment-is-the-cold-reader-test",
        "three-kinds-of-check-are-distinct",
        "atom-is-one-quote-from-one-source",
        "standing-is-operator-only-and-dated"],
       "would a reader holding only the quote, with its surrounding context, accept the claim?"),
]

FRONT = (
    "---\n"
    'type: "narrative"\n'
    'title: "Epistemology for Knowledge Work in the LLM Era"\n'
    'corpus: "epistemology-llm-era"\n'
    "created:\n"
    '  timestamp: "2026-08-19"\n'
    '  by: "human:francois-bouet"\n'
    "---\n"
)


def marker(ids, anchor):
    esc = anchor.replace("\\", "\\\\").replace('"', '\\"')
    return '<!-- claims: %s "%s" bound-at=%s -->' % (" ".join(ids), esc, BOUND_AT)


def main():
    lines = open(SRC, encoding="utf-8").read().split("\n")
    for lineno, ids, anchor in BINDINGS:
        i = lineno - 1
        assert lines[i].strip(), "binding %d lands on a blank line" % lineno
        lines[i] = lines[i] + "  " + marker(ids, anchor)
    body = "\n".join(lines).rstrip("\n") + "\n"
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(FRONT + "\n" + body)
    print("narrative: %d bindings" % len(BINDINGS))


if __name__ == "__main__":
    main()
