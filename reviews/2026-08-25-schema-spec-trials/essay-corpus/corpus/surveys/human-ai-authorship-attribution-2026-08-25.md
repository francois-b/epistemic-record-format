---
id: "human-ai-authorship-attribution-2026-08-25"
type: "survey"
corpus: "epistemology-llm-era"
title: "Tools that record whether text or code was written by a human or an AI, below the grain of a whole document"
conducted:
  timestamp: "2026-08-25"
  by: "anthropic/claude-opus-5"
searches:
  - tool: "WebSearch (Claude Code harness; US-only web index, upstream provider and index version not exposed to the caller)"
    query: "Cursor Blame feature which lines written by AI model attribution"
    scope: "the open web as the harness's index covers it, no domain filter"
    hits_reported: "10 result links returned; the instrument reports no total and no count"
    timestamp: "2026-08-25"
  - tool: "WebSearch (Claude Code harness; US-only web index, upstream provider and index version not exposed to the caller)"
    query: "tool records which sentences written by human versus AI across a whole corpus provenance 2026"
    scope: "the open web as the harness's index covers it, no domain filter"
    hits_reported: "6 result links returned; the instrument reports no total and no count"
    timestamp: "2026-08-25"
notable_results:
  - what: "agentblame, an open-source line-level AI attribution tool for git"
    note: "Works with Cursor, Claude Code and OpenCode, survives squash and rebase, and reports AI versus human line counts on every pull request. The essay names Cursor Blame as the exception; this is a second instance, and it is free."
    atoms:
      - "ell-103"
      - "ell-104"
  - what: "Grammarly Authorship runs inside Word, Google Docs and Canvas"
    note: "Directly contradicts the essay's description of it as a sidecar inside Grammarly's own app, and it attributes at the grain of the sentence, not the document."
    atoms:
      - "ell-106"
      - "ell-107"
  - what: "The Co-authored-by commit trailer"
    note: "A git-native, GitHub-documented mechanism for attributing one commit to several authors. It is the carrier that AI coding tools use to record their own participation, which makes git's silence about AI a convention gap rather than a mechanism gap."
    atoms:
      - "ell-105"
  - what: "GPTZero Writing Replay and OpAI-Bench"
    note: "Near-misses returned by the second act and not minted. Writing Replay records keystrokes inside Google Docs and replays the session; OpAI-Bench is a benchmark corpus annotated at document, sentence, token and span level. Neither is a working-corpus record, which is the essay's actual subject, and both are about detection rather than declaration."
---

What was sought: counterexamples to two of the essay's universal negatives,
that today's tools do not record whether something was written by a human
or an AI tool, and that nothing records who wrote what below the grain of a
whole page.

What was found: both fail as stated. Line-level and sentence-level
human-versus-AI attribution ships in at least four products, one of them
free and open source, and one of them (Grammarly Authorship) operating
inside the very Google Docs the essay names as recording nothing finer than
the author.

What survives: the essay's underlying point, which is that no such record
spans a working corpus across tools. Every instance found is confined to
one editor, one document format or one vendor's app. That is a narrower
claim than the one the essay makes and it was not falsified here.

Coverage bounds: two acts, English only, both phrased around attribution
and neither around the adjacent vocabulary of content credentials,
watermarking or provenance manifests, where more instances almost
certainly sit. Hits were inspected one page deep.
