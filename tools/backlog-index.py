#!/usr/bin/env python3
"""Regenerate docs/backlog/README.md from the entry files beside it.

The index is derived, never edited by hand: an entry's frontmatter is the
only place its state lives. Run after adding or changing an entry.
"""
import re, sys, pathlib, collections

ROOT = pathlib.Path(__file__).resolve().parent.parent
ENTRIES = ROOT / "docs" / "backlog"
INDEX = ENTRIES / "README.md"

HEADER = """---
title: "Backlog"
purpose: "The governed queue: one file per entry, each with its basis, its provenance, and a verdict from someone other than whoever raised it. This page is the index."
status: non-normative
last_updated: 2026-08-25
---

# Backlog

Everything this format does not do yet, plus everything a reader has told it
is wrong. One queue, because both need the same governance before they reach
a decision: an accurate description, a stated basis, and someone other than
the raiser confirming both.

Nothing here is a promise and nothing is scheduled. **One file per entry,
in this folder**; this page is generated from them by
`tools/backlog-index.py` and is never edited by hand.

## What an entry carries

- **id** — `B-nn`, stable and never reused. An entry that leaves keeps its
  id in the changelog.
- **kind** — `capability` (the format does not do this yet, waits on a
  trigger) or `defect` (the specification is wrong, unclear, or incomplete,
  waits on a ruling).
- **basis** — how the entry knows what it says. `demonstrated`: an artifact
  exists and can be re-run. `reported`: a careful reader judged it, nothing
  failed. `anticipated`: nobody has hit this, and it is the weakest basis
  there is.
- **raised** — where it came from, specifically enough to go back to.
- **verified** — who checked the description against the current
  specification, when, and their verdict. An entry nobody has verified is
  not ready to be decided.
- **status** — `open` (verified accurate, awaiting trigger or ruling) or
  `contested` (verification disputes it: stale, inaccurate, duplicate, or
  already decided elsewhere). A contested entry is a decision about the
  entry, not about the format.

## The rule this queue exists to enforce

A field earns its place by a demonstrated need rather than by symmetry or by
anticipation. That is why `anticipated` is recorded as weak rather than
treated as equal: an item that has sat unhit through a five-trial battery is
evidence about its author's imagination, not about the format.

Items leave when their trigger fires or their ruling lands, going into the
specification or into `non-goals.md` if the answer turns out to be no.
Decisions already taken against something are not here.

"""

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

    head = HEADER
    def tbl(title, note, rs):
        if not rs: return ""
        s = f"## {title}\n\n{note}\n\n| id | | basis | verification |\n|---|---|---|---|\n"
        for r in rs:
            s += f"| [`{r['id']}`]({r['file']}) | {r['title']} | `{r['basis']}` | `{r['verdict']}` |\n"
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
