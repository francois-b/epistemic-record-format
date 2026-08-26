#!/usr/bin/env python3
"""run-finding-audit 1.0.0 — protocol finding-audit-v1-batched-10.

ERF-11 splits the atom's two checks: the mechanical one (the quote occurs in
the normalized text) is recomputable and MUST NOT be stored, and the judgment
(does the quote, in context, support the finding?) is not recomputable and is
recorded per auditor. This runs the judgment on a second vendor's model, so
that the verdict is not the same instrument that wrote the finding grading its
own work.

Protocol, versioned because ERF-11 says verdicts under different protocols are
not comparable:
  * batches of 10 atoms per call;
  * each item carries the atom id, the source's citation_text, the quote and
    the finding, and nothing else — no claim, no other atom, no essay;
  * the model returns one line per id, `id: VERDICT`;
  * a line that does not parse to exactly SUPPORTED, PARTIAL or UNSUPPORTED
    yields no entry at all, because ERF-12 forbids writing a failed or
    unparseable audit as a verdict.

Writes tools/audits.json. Re-runnable; existing verdicts are kept unless
--force is given, because a survey of an act already run cannot re-run.
"""
import json
import os
import re
import subprocess
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDITOR = "gemini-3.5-flash"
PROTOCOL = "finding-audit-v1-batched-10"
OUT = os.path.join(ROOT, "tools", "audits.json")

PROMPT = """You are auditing evidence records. For each item you are given a
source citation, a verbatim QUOTE taken from that source, and a FINDING that a
researcher wrote about the quote.

Judge one thing only: does the quote, read as coming from that source, support
the finding as written? Do not judge whether the finding is true in the world,
and do not judge whether the quote is accurately transcribed.

Answer exactly one of:
  SUPPORTED   - the quote carries the finding, including its hedging and scope
  PARTIAL     - the quote carries part of the finding, or the finding claims
                more scope, certainty or specificity than the quote gives
  UNSUPPORTED - the quote does not carry the finding

Output one line per item, in the form `id: VERDICT`. No other text.

ITEMS:
"""


def load_atoms():
    data = yaml.safe_load(open(os.path.join(ROOT, "tools", "atoms.data.yaml"), encoding="utf-8"))
    srcs = yaml.safe_load(open(os.path.join(ROOT, "corpus", "sources.yaml"), encoding="utf-8"))["sources"]
    return data["atoms"], srcs


def main():
    atoms, srcs = load_atoms()
    done = {}
    if os.path.exists(OUT) and "--force" not in sys.argv:
        done = json.load(open(OUT, encoding="utf-8"))
    todo = [a for a in atoms if a["id"] not in done]
    print("%d atoms, %d already audited, %d to run" % (len(atoms), len(done), len(todo)))
    for i in range(0, len(todo), 10):
        batch = todo[i : i + 10]
        body = []
        for a in batch:
            body.append(
                "---\nID: %s\nSOURCE: %s\nQUOTE: %s\nFINDING: %s"
                % (a["id"], srcs[a["source"]]["citation_text"], a["quote"], a["finding"])
            )
        proc = subprocess.run(
            ["mods", "--api", "google", "-m", "gemini-3.5-flash", "--no-cache",
             PROMPT + "\n".join(body)],
            capture_output=True, text=True, timeout=300,
            stdin=subprocess.DEVNULL,
        )
        text = proc.stdout
        found = 0
        for line in text.split("\n"):
            m = re.match(r"^\s*[`*\-\s]*(\S+?)\s*:\s*\*{0,2}(SUPPORTED|PARTIAL|UNSUPPORTED)\*{0,2}\s*$", line)
            if m and any(m.group(1) == a["id"] for a in batch):
                done[m.group(1)] = m.group(2)
                found += 1
        print("  batch %d: %d/%d parsed" % (i // 10 + 1, found, len(batch)))
        json.dump(done, open(OUT, "w", encoding="utf-8"), indent=1, sort_keys=True)
    print("total verdicts: %d" % len(done))


if __name__ == "__main__":
    main()
