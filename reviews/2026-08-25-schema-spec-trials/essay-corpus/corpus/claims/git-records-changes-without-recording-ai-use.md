---
id: "git-records-changes-without-recording-ai-use"
type: "claim"
corpus: "epistemology-llm-era"
title: "Git records every change but at a coarser grain than a knowledge corpus needs, and without recording AI use"
epistemic_kind: "observation"
short_name: "git and AI"
semantic_query: "git commit attribution granularity recording AI assistance authorship trailers"
families:
  - "prior-art"
created:
  timestamp: "2026-08-25"
  by: "anthropic/claude-opus-5"
atoms_for:
  - "ell-050"
atoms_against:
  - "ell-105"
---

Git records every change but at a coarser grain than a knowledge corpus needs, and without recording AI use

## Working notes

The mechanism half is wrong. Git carries commit trailers, GitHub
documents Co-authored-by as the way to attribute one commit to several
authors, and AI coding tools already write themselves into that field.
Git records no AI use by default; it is not unable to.
