#!/usr/bin/env python3
"""Style lint for SPEC.md (the spec is held to its own editorial rules).

Rules (line-based; fenced code blocks are exempt throughout):
  A  no em dash (U+2014) in body prose (headings exempt)
  B  no middle dot (U+00B7) anywhere outside fences
  C  requirement ids: a definition line has the shape "- **ERF-x.y** ", optionally
     preceded by its HTML anchor ("- <a id=\"erf-6\"></a>**ERF-6** "), and its
     first sentence carries an uppercase RFC 2119 keyword; any other ERF-id
     occurrence is bold, backticked, or inside parentheses on its line
  D  non-normative notes use the canonical blockquote form
     "> *Note (non-normative):*"; the legacy inline forms are violations
  E  each pipe table has a consistent column count across its rows
  F  field-reference entries: a label line (bold code-span field name followed
     by parenthesized metadata) carries exactly two semicolons in the metadata
     (type; writer; when) and is followed by a ":" definition body

Usage: python3 tools/lint/lint-spec-style.py [source.md]
       (defaults to the SPEC.md beside this repository's tools/ directory;
        exit 1 on any violation)
"""
import re
import sys
import pathlib

if len(sys.argv) > 1:
    src = pathlib.Path(sys.argv[1])
else:
    src = pathlib.Path(__file__).resolve().parent.parent.parent / "SPEC.md"
def markdown_shape(text, name):
    """Blank line before every heading and around every fence, no double
    blank lines, no trailing whitespace, one trailing newline."""
    problems = []; lines = text.split("\n"); in_code = False
    for i, l in enumerate(lines, 1):
        if l != l.rstrip(): problems.append((i, "M", "trailing whitespace"))
        if l.startswith("```"):
            if not in_code and i > 1 and lines[i-2].strip() != "" and lines[i-2] != "---": problems.append((i, "M", "fence not preceded by a blank line"))
            if in_code and i < len(lines) and lines[i].strip() != "": problems.append((i, "M", "closing fence not followed by a blank line"))
            in_code = not in_code; continue
        if in_code: continue
        if re.match(r"^#{1,6} ", l) and i > 1 and lines[i-2].strip() != "" and lines[i-2] != "---": problems.append((i, "M", "heading not preceded by a blank line"))
        if l == "" and i > 1 and lines[i-2] == "": problems.append((i, "M", "two consecutive blank lines"))
    if not text.endswith("\n") or text.endswith("\n\n"): problems.append((len(lines), "M", "file must end with exactly one newline"))
    return problems

lines = src.read_text().split("\n")

# frontmatter is exempt (titles/subtitles are display, not spec prose)
start = 0
if lines and lines[0] == "---":
    for i in range(1, len(lines)):
        if lines[i] == "---":
            start = i + 1
            break

violations = []
violations += markdown_shape(src.read_text(), src.name)
KEYWORD = re.compile(r"\b(MUST NOT|MUST|SHOULD NOT|SHOULD|MAY)\b")
ERF_ID = re.compile(r"(?:ERF|YAMLB)-\d+(?:\.\d+)?[a-z]?")
ANCHOR = r'(?:<a id="[a-z0-9-]+"></a>)?'
DEF_LINE = re.compile(r"^\s*- " + ANCHOR + r"\*\*((?:ERF|YAMLB)-\d+(?:\.\d+)?[a-z]?)\*\* ")
NOTE_OPENER = re.compile(r"^> \*Note \(non-normative\):\*")
LEGACY_NOTE = re.compile(r"\*\(?Non-normative")

def paren_spans(s, open_ch="(", close_ch=")"):
    spans, stack = [], []
    for i, ch in enumerate(s):
        if ch == open_ch:
            stack.append(i)
        elif ch == close_ch and stack:
            spans.append((stack.pop(), i))
    return spans

FIELD_LABEL = re.compile(r"^(\*\*`[A-Za-z_]+`\*\*(?:, \*\*`[A-Za-z_]+`\*\*)*) \(")

in_fence = False
fence_marker = None
i = start
while i < len(lines):
    ln = lines[i]
    stripped = ln.strip()
    fence_open = re.match(r"^(`{3,})", stripped)
    if in_fence:
        if fence_open and stripped.startswith(fence_marker):
            in_fence = False
        i += 1
        continue
    if fence_open:
        in_fence = True
        fence_marker = fence_open.group(1)
        i += 1
        continue

    is_heading = stripped.startswith("#")

    # A: em dash
    if "—" in ln and not is_heading:
        violations.append((i + 1, "A", "em dash in prose"))
    # B: middle dot
    if "·" in ln:
        violations.append((i + 1, "B", "middle dot"))
    # D: legacy note forms; canonical blockquote check
    if LEGACY_NOTE.search(ln):
        violations.append((i + 1, "D", "legacy non-normative note form (use the blockquote)"))
    if stripped.startswith(">") and "non-normative" in ln.lower():
        # first line of this blockquote run must be the canonical opener
        j = i
        while j > start and lines[j - 1].strip().startswith(">"):
            j -= 1
        if not NOTE_OPENER.match(lines[j]):
            violations.append((i + 1, "D", "blockquote note without canonical opener"))
    # C: requirement ids
    m = DEF_LINE.match(ln)
    if m:
        # join the bullet's wrapped lines to find the first sentence
        block = [DEF_LINE.sub("", ln)]
        k = i + 1
        while k < len(lines) and lines[k].startswith("  ") and not lines[k].lstrip().startswith("- "):
            block.append(lines[k].strip())
            k += 1
        text = " ".join(block)
        first = text.split(". ")[0]
        if not KEYWORD.search(first):
            violations.append((i + 1, "C", f"{m.group(1)}: no RFC 2119 keyword in first sentence"))
    for om in ERF_ID.finditer(ln):
        s, e = om.span()
        before = ln[s - 2:s]
        after = ln[e:e + 1]
        ok = (
            before.endswith("*") or before.endswith("`") or before.endswith("(")
            or before.endswith("[") or after == "`"
            or any(a < s and e <= b for a, b in paren_spans(ln))
            or any(a < s and e <= b for a, b in paren_spans(ln, "[", "]"))
        )
        if not ok:
            violations.append((i + 1, "C", f"bare requirement id {om.group(0)} (bold, backtick, or parenthesize)"))
    # F: field-reference entry shape
    fm = FIELD_LABEL.match(stripped)
    if fm:
        spans = paren_spans(stripped)
        meta = next((sp for sp in spans if sp[0] >= len(fm.group(1))), None)
        outer = next((sp for sp in spans if sp[0] >= len(fm.group(1))
                      and not any(a < sp[0] and sp[1] <= b for a, b in spans if (a, b) != sp)), None)
        if outer is None:
            violations.append((i + 1, "F", "field label without metadata parens"))
        else:
            a, b = outer
            inner = [sp for sp in spans if sp != outer and a < sp[0] and sp[1] <= b]
            semis = sum(1 for j, ch in enumerate(stripped[a + 1:b], start=a + 1)
                        if ch == ";" and not any(x < j <= y for x, y in inner))
            if semis != 2:
                violations.append((i + 1, "F",
                                   f"field metadata must be (type; writer; when): found {semis} semicolons"))
        k = i + 1
        while k < len(lines) and not lines[k].strip():
            k += 1
        if k >= len(lines) or not lines[k].lstrip().startswith(":"):
            violations.append((i + 1, "F", "field label not followed by a ':' definition body"))
    i += 1

# E: table column consistency
in_fence = False
table_rows = []  # (line_no, count)
def flush_table():
    global table_rows
    if len(table_rows) >= 2:
        counts = {c for _, c in table_rows}
        if len(counts) > 1:
            violations.append((table_rows[0][0], "E",
                               f"inconsistent table columns: {sorted(counts)}"))
    table_rows = []

for n, ln in enumerate(lines[start:], start=start + 1):
    stripped = ln.strip()
    if re.match(r"^`{3,}", stripped):
        in_fence = not in_fence
        flush_table()
        continue
    if in_fence:
        continue
    if stripped.startswith("|"):
        cells = re.sub(r"\\\|", "", stripped)  # ignore escaped pipes
        cells = re.sub(r"`[^`]*`", "``", cells)  # pipes inside code spans don't count
        table_rows.append((n, cells.count("|")))
    else:
        flush_table()
flush_table()

if violations:
    for line_no, rule, msg in violations:
        print(f"{src.name}:{line_no}: [{rule}] {msg}")
    print(f"\n{len(violations)} style violation(s).")
    sys.exit(1)
print("spec style: clean")
