#!/usr/bin/env python3
"""erf-normalize 1.1.0 — the corpus's named normalizing tool (ERF-70).

Deterministic: the same bytes in give the same bytes out, on any machine, with
no clock, no network and no randomness. It does exactly four things to an
extracted (or natively-markdown) text:

  1. CRLF and CR line endings become LF.
  2. A leading YAML frontmatter block (--- ... ---) is dropped; it is an
     export artifact of the authoring pipeline and not the work's prose.
  3. Trailing whitespace is stripped from every line.
  4. Markdown image syntax is dropped, and a line left empty by that drop is
     removed. A `data:` URI carrying a base64 SVG is an export artifact of the
     HTML-to-markdown step, not prose, and ERF-70 names dropping export
     artifacts as normalization's job.
  5. A run of three or more blank lines collapses to one blank line, and the
     file ends in exactly one newline.

Every step is line-local, which is what keeps ERF-69's fidelity check true:
normalizing a passage and then cutting it, or cutting and then normalizing,
give the same bytes, so an excerpt still occurs in the normalization of the
whole extracted source.

It reflows nothing and repairs no hyphenation: this corpus's raw files are
markdown and HTML, where line structure carries no meaning that ERF-51's fold
does not already collapse, and a reflow that guessed wrong at a code block or
a table would be the very damage ERF-70 warns about.

Usage: erf_normalize.py <in> <out>
"""
import re
import sys


def normalize(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    if text.startswith("---\n"):
        end = text.find("\n---\n", 3)
        if end != -1:
            text = text[end + 5 :]
    out = []
    for line in text.split("\n"):
        stripped = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", line)
        if stripped.strip() == "" and line.strip() != "":
            continue
        out.append(stripped.rstrip())
    text = "\n".join(out)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip("\n") + "\n"


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    with open(src, encoding="utf-8") as fh:
        out = normalize(fh.read())
    with open(dst, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(out)
