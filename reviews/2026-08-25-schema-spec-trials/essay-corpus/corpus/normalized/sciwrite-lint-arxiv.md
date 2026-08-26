# Title:sciwrite-lint: Verification Infrastructure for the Age of Science Vibe-Writing

Authors:[Sergey V Samsonau](https://arxiv.org/search/cs?searchtype=author&query=Samsonau,+S+V)

View a PDF of the paper titled sciwrite-lint: Verification Infrastructure for the Age of Science Vibe-Writing, by Sergey V Samsonau

[View PDF](/pdf/2604.08501) [HTML (experimental)](https://arxiv.org/html/2604.08501v2)

> Abstract:Scientific papers make claims about prior work backed by citations. Verifying those citations at scale (that each cited paper exists, says what the citation claims, and is itself reliable) is structurally beyond what human review can deliver: a typical paper has dozens of citations, and a careful reviewer reads at most a handful end-to-end. AI-assisted writing makes this gap even more urgent: LLMs hallucinate references and may fill in plausible details from titles or abstracts of papers they never read, worse for the smaller local-weights models that privacy-aware researchers must use.
> sciwrite-lint applies the linting paradigm from software engineering to citation verification: it runs entirely on the researcher's machine (free public databases, a single consumer GPU, and open-weights models), is fast enough to re-lint between revisions so authors catch problems at the source while drafting, and serves journals and reviewers as an automated first pass. The pipeline checks reference existence, metadata accuracy, retraction status, and claim support, traverses one level into cited papers' bibliographies, and produces per-reference reliability scores. We evaluate on 30 unseen papers (arXiv and bioRxiv) with error injection and LLM-adjudicated false-positive analysis.
> The same linting workflow extends to internal consistency: numbers in text vs. tables, abstract vs. body, figure captions vs. content, statistical results vs. their verbal interpretation, plus structural cross-references (dangling cites, orphan references). As a separate experimental contribution we also propose SciLint Score: citation-chain integrity combined with a contribution component operationalizing five philosophy-of-science frameworks (Popper, Lakatos, Kitcher, Laudan, Mayo).

[TABLE]
