#!/usr/bin/env python3
"""Regenerate conformance/requirements.md from the normative documents.

One row per requirement: what it says in a phrase, which conformance class
binds it where a document says so, and what defends it. Three inputs and no
judgment of its own:

  SPEC.md                    the requirement text, and the retired-id list
  serialization/yaml-markdown.md  the requirements that moved to the binding
  conformance/coverage.yaml  the coverage state of each

The class column is filled only where a document names the class. Section 1's
conformance-class list names a few requirements outright, its consumer
paragraph names four more, and a requirement whose own text says "A validator
MUST" names its own. Everything else stays blank, because a guess in this
column would read exactly like a ruling.

Run after adding, changing, or retiring a requirement.
"""
import re
import sys
import pathlib

import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
SPEC = ROOT / "SPEC.md"
SERIALIZATION = ROOT / "serialization"
COVERAGE = ROOT / "conformance" / "coverage.yaml"
INDEX = ROOT / "conformance" / "requirements.md"

DEF_LINE = re.compile(
    r'^- (?:<a id="[a-z0-9-]+"></a>)?\*\*((?:ERF|YAMLB)-\d+)\*\* (.*)$')
# "A consumer MUST NOT reject a corpus…": the requirement names its own class.
SELF_NAMED = re.compile(
    r"\b(?:A|An|Every|The)\s+(producer|consumer|validator)\b[^.]{0,80}?"
    r"\b(?:MUST NOT|MUST|SHOULD NOT|SHOULD|MAY)\b")
ID_IN_TEXT = re.compile(r"(?:ERF|YAMLB)-\d+")

HEADER = """---
title: "The requirement index"
purpose: "Every numbered requirement in one table: what it says, which conformance class binds it where a document says so, and what defends it."
status: non-normative
generated: 2026-08-26
model: claude-opus-5
---

# The requirement index

**Generated. Never edit this file by hand.** It is derived from `SPEC.md`,
`serialization/yaml-markdown.md` and `coverage.yaml`, which are the three places a
requirement's text, its home and its coverage actually live. Regenerate with:

```
python3 tools/requirements-index.py
```

The gist column is the requirement's opening, trimmed. It is a finding aid and
not the requirement: what binds is the full text, which each id links to.

The class column is filled only where a document names the class, either in
`SPEC.md` section 1 or in the requirement's own wording. A blank means no
document says, not that no class applies. Every requirement binds the
Validator class to the extent it is machine-checkable, which is why that class
is not repeated down the column.

"""


def requirements(path, link_base):
    """Every requirement in one document, in document order."""
    out = []
    lines = path.read_text().split("\n")
    i = 0
    while i < len(lines):
        m = DEF_LINE.match(lines[i])
        if not m:
            i += 1
            continue
        block = [m.group(2)]
        k = i + 1
        while (k < len(lines) and lines[k].startswith("  ")
               and not lines[k].lstrip().startswith("- ")):
            block.append(lines[k].strip())
            k += 1
        out.append({"id": m.group(1), "text": " ".join(block).strip(),
                    "link": link_base})
        i = k
    return out


def gist(text, limit=120):
    """The first sentence, or the first ~120 characters on a word boundary."""
    text = re.sub(r"\s+", " ", text).strip()
    # A sentence ends at ". " before a capital, a backtick or an opening quote,
    # which keeps "e.g." and "3.4" from ending one.
    m = re.search(r"\.\s+(?=[A-Z`*\"(])", text)
    first = text[:m.start() + 1] if m else text
    if len(first) <= limit + 40:
        return first
    cut = first[:limit]
    cut = cut[:cut.rfind(" ")] if " " in cut else cut
    return cut.rstrip(" ,;:") + "…"


def named_classes(spec_text):
    """Classes that SPEC.md section 1 attaches to a requirement by id."""
    named = {}

    def attach(ids, cls):
        for rid in ids:
            named.setdefault(rid, set()).add(cls)

    section1 = spec_text.split("### Conformance classes", 1)
    if len(section1) < 2:
        return named
    body = section1[1].split("\n## ", 1)[0]

    # The class list: one bullet per class, each naming its own requirements.
    for m in re.finditer(r"^- (Record|Corpus|Producer|Consumer|Validator): ",
                         body, re.M):
        start = m.end()
        nxt = re.search(r"^- (?:Record|Corpus|Producer|Consumer|Validator): ",
                        body[start:], re.M)
        chunk = body[start:start + nxt.start()] if nxt else body[start:]
        chunk = chunk.split("\n\n", 1)[0]
        attach(ID_IN_TEXT.findall(chunk), m.group(1))

    # The consumer paragraph enumerates the consumer rules by id.
    para = re.search(r"\*\*What a consumer rule may say\.\*\*(.*?)(?:\n\n|\Z)",
                     body, re.S)
    if para:
        attach(ID_IN_TEXT.findall(para.group(1)), "Consumer")
    return named


def state(entry):
    """The coverage cell: what defends this requirement, or why nothing does."""
    if entry is None:
        return "**no coverage row**"
    if entry.get("tests"):
        return ", ".join(f"`{t}`" for t in entry["tests"])
    if entry.get("untestable-by-design"):
        return "untestable by design: " + entry["untestable-by-design"]
    if entry.get("uncovered"):
        return "uncovered: " + entry["uncovered"]
    return "**row states nothing**"


def cell(s):
    return re.sub(r"\s+", " ", str(s)).replace("|", r"\|").strip()


def main():
    spec_text = SPEC.read_text()
    reqs = requirements(SPEC, "../SPEC.md")
    for p in sorted(SERIALIZATION.glob("*.md")):
        reqs += requirements(p, f"../serialization/{p.name}")

    cov = (yaml.safe_load(COVERAGE.read_text()) or {}).get("requirements") or {}
    named = named_classes(spec_text)

    problems = []
    seen = set()
    for r in reqs:
        if r["id"] in seen:
            problems.append(f"{r['id']} is defined twice")
        seen.add(r["id"])
    for rid in cov:
        if rid not in seen:
            problems.append(f"coverage names {rid}, which no document defines")
    if problems:
        print("\n".join(problems), file=sys.stderr)
        return 1

    rows = []
    for r in reqs:
        classes = set(named.get(r["id"], ()))
        for m in SELF_NAMED.finditer(r["text"]):
            classes.add(m.group(1).capitalize())
        order = ["Record", "Corpus", "Producer", "Consumer", "Validator"]
        cls = ", ".join(c for c in order if c in classes)
        anchor = f"{r['link']}#{r['id'].lower()}"
        rows.append(f"| [`{r['id']}`]({anchor}) | {cell(gist(r['text']))} "
                    f"| {cls} | {cell(state(cov.get(r['id'])))} |")

    out = HEADER
    out += f"{len(rows)} requirements.\n\n"
    out += "| id | gist | class | what defends it |\n|---|---|---|---|\n"
    out += "\n".join(rows) + "\n"

    retired = re.search(r"^- Retired ids, never reused: (.*?)(?=\n- )",
                        spec_text, re.S | re.M)
    out += "\n## Retired ids\n\n"
    if retired:
        # The list ends at the first sentence break; what follows is a note
        # that cites a live requirement, which is not a retired id.
        ids = ID_IN_TEXT.findall(retired.group(1).split(". ", 1)[0])
        out += ("Never reused and never refilled, so that a "
                "requirement-by-requirement diff can tell a retired id from a "
                "lost one. The rulings are in `../CHANGELOG.md` and "
                "`../docs/history.md`.\n\n")
        out += "| Retired id |\n|---|\n"
        out += "\n".join(f"| `{i}` |" for i in ids) + "\n"
    else:
        out += ("`SPEC.md` no longer carries a retired-id list, which is "
                "either a change or a defect.\n")

    INDEX.write_text(out)
    print(f"requirements index: {len(rows)} requirements")
    return 0


sys.exit(main())
