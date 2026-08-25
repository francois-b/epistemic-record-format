#!/usr/bin/env python3
"""Regenerate docs/backlog.md from the entry files in docs/backlog/.

The index is derived, never edited by hand: an entry's frontmatter is the
only place its state lives. Run after adding or changing an entry.
"""
import re, sys, pathlib, collections

ROOT = pathlib.Path(__file__).resolve().parent.parent
ENTRIES = ROOT / "docs" / "backlog"
INDEX = ROOT / "docs" / "backlog.md"

def frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        return None
    fm, cur = {}, None
    for line in m.group(1).split("\n"):
        if re.match(r"^\w[\w_]*:", line):
            k, _, v = line.partition(":")
            cur = k.strip()
            fm[cur] = v.strip().strip('"') or {}
        elif line.startswith("  ") and isinstance(fm.get(cur), dict):
            k, _, v = line.strip().partition(":")
            fm[cur][k.strip()] = v.strip().strip('"')
    return fm

def main():
    rows, problems = [], []
    for p in sorted(ENTRIES.glob("B-*.md")):
        fm = frontmatter(p.read_text())
        if not fm:
            problems.append(f"{p.name}: no frontmatter")
            continue
        title = re.search(r"^# B-\d+ · (.+)$", p.read_text(), re.M)
        for req in ("id", "kind", "status", "basis", "raised", "verified"):
            if req not in fm:
                problems.append(f"{p.name}: missing {req}")
        rows.append({"id": fm.get("id",""), "title": title.group(1) if title else p.stem,
                     "kind": fm.get("kind",""), "basis": fm.get("basis",""),
                     "status": fm.get("status",""),
                     "verdict": (fm.get("verified") or {}).get("verdict",""),
                     "file": p.name})
    if problems:
        print("\n".join(problems), file=sys.stderr)
        return 1
    rows.sort(key=lambda r: int(r["id"].split("-")[1]))

    head = (ROOT / "docs" / "backlog-index-header.md").read_text()
    def tbl(title, note, rs):
        if not rs: return ""
        s = f"## {title}\n\n{note}\n\n| id | | basis | verification |\n|---|---|---|---|\n"
        for r in rs:
            s += f"| [`{r['id']}`](backlog/{r['file']}) | {r['title']} | `{r['basis']}` | `{r['verdict']}` |\n"
        return s + "\n"
    out = head
    out += tbl("Contested", "Verification disputes these: stale, inaccurate, duplicated, or already ruled elsewhere. Each needs a decision about the **entry** before the format is touched.",
               [r for r in rows if r["status"] == "contested"])
    out += tbl("Unverified", "Raised but not yet checked by anyone other than whoever raised them. **Not ready to be decided.**",
               [r for r in rows if r["verdict"] == "unverified"])
    out += tbl("Defects awaiting a ruling", "Verified accurate. The specification is wrong, unclear, or incomplete here.",
               [r for r in rows if r["kind"] == "defect" and r["status"] == "open" and r["verdict"] == "accurate"])
    out += tbl("Capabilities awaiting a trigger", "Verified accurate. The format does not do these yet; each names the event that would revive it.",
               [r for r in rows if r["kind"] == "capability" and r["status"] == "open" and r["verdict"] == "accurate"])
    counts = collections.Counter(r["verdict"] for r in rows)
    out += f"\n---\n\n{len(rows)} entries: " + ", ".join(f"{n} {v}" for v, n in sorted(counts.items())) + ".\nRegenerate with `python3 tools/backlog-index.py`.\n"
    INDEX.write_text(out)
    print(f"index: {len(rows)} entries")
    return 0

sys.exit(main())
