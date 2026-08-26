#!/usr/bin/env python3
"""bl-normalize.py 1.0.0

The corpus's normalizing tool (ERF-70): deterministic, versioned, applied
identically to an excerpt and to a whole extracted source.

Default mode (HTML extracted by pandoc, which already emits one line per
leaf block under `--wrap=none`):
  1. LF line endings; no BOM; form feeds become blank lines.
  2. Drop pandoc export artifacts:
       - bracketed spans carrying only attributes: `[search]{style="..."}`
         becomes `search`, `[ ]{.style1}` becomes ` `;
       - pandoc heading identifiers: `# Title  {#title}` becomes `# Title`;
       - lines that are entirely raw HTML tags;
       - pandoc `:::` div fences.
  3. Strip trailing whitespace from every line.
  4. Collapse any run of blank lines to one; trim leading and trailing blanks.
  5. Exactly one trailing newline.

`--reflow` adds the two repairs ERF-70 names, for text extracted from a PDF
by pdftotext, which hard-wraps every line:
  2a. Rejoin the lines of a paragraph into one line, separated by a single
      space. Blank lines and page breaks stay paragraph boundaries.
  2b. Repair hyphenation: a line ending `-` after a letter, followed by a
      line starting with a lower-case letter, joins with neither the hyphen
      nor a space.

It never rewrites a word, never folds case, and never touches a backslash
escape pandoc emitted. Same bytes in, same bytes out, on any machine.

Usage: bl-normalize.py [--reflow] < in.md > out.md
       bl-normalize.py --version
"""
import re
import sys

VERSION = "1.0.0"

ATTR_SPAN = re.compile(r"\[([^\[\]]*)\]\{[^}]*\}")
HEADING_ID = re.compile(r"^(#{1,6} .*?)\s*\{#[^}]*\}\s*$")
ONLY_HTML = re.compile(r"^\s*(?:<[^>]*>\s*)+$")
DIV_FENCE = re.compile(r"^\s*:::+\s*(?:\{[^}]*\}|[A-Za-z0-9_-]*)?\s*$")
HYPHEN_END = re.compile(r"(?<=[A-Za-z])-$")


def _reflow(lines):
    out = []
    buf = []

    def flush():
        if buf:
            out.append("".join(buf).strip())
            buf.clear()

    for line in lines:
        if line.strip() == "":
            flush()
            out.append("")
            continue
        if not buf:
            buf.append(line)
            continue
        if HYPHEN_END.search(buf[-1]) and line[:1].islower():
            buf[-1] = HYPHEN_END.sub("", buf[-1])
            buf.append(line)
        else:
            buf.append(" " + line)
    flush()
    return out


def normalize(text: str, reflow: bool = False) -> str:
    text = text.replace("﻿", "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\f", "\n\n")
    lines = []
    for line in text.split("\n"):
        if ONLY_HTML.match(line) or DIV_FENCE.match(line):
            continue
        line = ATTR_SPAN.sub(r"\1", line)
        line = HEADING_ID.sub(r"\1", line)
        lines.append(line.rstrip())
    if reflow:
        lines = _reflow(lines)
    collapsed = []
    blank = False
    for line in lines:
        if line == "":
            if blank:
                continue
            blank = True
        else:
            blank = False
        collapsed.append(line)
    while collapsed and collapsed[0] == "":
        collapsed.pop(0)
    while collapsed and collapsed[-1] == "":
        collapsed.pop()
    return "\n".join(collapsed) + "\n"


if __name__ == "__main__":
    if "--version" in sys.argv:
        print(f"bl-normalize.py {VERSION}")
        sys.exit(0)
    sys.stdout.write(normalize(sys.stdin.read(), reflow="--reflow" in sys.argv))
