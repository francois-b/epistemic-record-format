#!/usr/bin/env python3
"""erf-fold 1.0.0 — an independent implementation of ERF-51 (the fold) and
ERF-52 (the span check), written from SPEC-as-tried.md alone.

Used as a pre-flight check before running `erfval`, so that a quote that
cannot pass is caught while the normalized text is still open in front of me.
Any disagreement between this and `erfval` is a friction-log entry.
"""
import sys
import unicodedata

MARKERS = "*_`"
PARA = "\u2029"


def is_word(ch: str) -> bool:
    """A word character is a letter, digit or combining mark (Unicode L, N, M)."""
    if not ch:
        return False
    return unicodedata.category(ch)[0] in ("L", "N", "M")


def is_ws(ch: str) -> bool:
    # Unicode White_Space. Python's str.isspace() is close; add the two
    # separators explicitly and exclude the characters isspace() adds that
    # White_Space does not (the Cf ones are already gone by step 1).
    return ch.isspace() or ch in ("\u2028", "\u2029", "\u0085")


def fold(text: str) -> str:
    """ERF-51, the ordered sequence."""
    # 1. NFC, then remove every format character (General Category Cf).
    text = unicodedata.normalize("NFC", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Cf")

    # 2. Remove a run of one marker repeated that has a word character on
    #    exactly one side of the run. Decided against the text as it entered
    #    the step; one pass.
    out = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch in MARKERS:
            j = i
            while j < n and text[j] == ch:
                j += 1
            before = text[i - 1] if i > 0 else ""
            after = text[j] if j < n else ""
            if is_word(before) != is_word(after):
                i = j  # exactly one side is a word character: drop the run
                continue
            out.append(text[i:j])
            i = j
            continue
        out.append(ch)
        i += 1
    text = "".join(out)

    # 3. Collapse each whitespace run to a single space, except a run holding
    #    a blank line, which collapses to U+2029; then trim.
    out = []
    i = 0
    n = len(text)
    while i < n:
        if is_ws(text[i]):
            j = i
            while j < n and is_ws(text[j]):
                j += 1
            run = text[i:j]
            if run.count("\n") >= 2 or PARA in run:
                out.append(PARA)
            else:
                out.append(" ")
            i = j
            continue
        out.append(text[i])
        i += 1
    return "".join(out).strip(" \t\n\r\u2028\u2029")


def word_internal(text: str, j: int) -> bool:
    """A character is word-internal when it joins two word characters."""
    if j < 0 or j >= len(text):
        return False
    ch = text[j]
    prev = text[j - 1] if j > 0 else ""
    nxt = text[j + 1] if j + 1 < len(text) else ""
    if ch in ".,:/":
        return prev.isdigit() and nxt.isdigit()
    if ch in "'\u2019":
        return (unicodedata.category(prev)[:1] == "L") and (
            unicodedata.category(nxt)[:1] == "L"
        )
    if ch == "-":
        return is_word(prev) and is_word(nxt)
    return False


def boundary_ok(text: str, start: int, span: str) -> bool:
    """The whole-words test of ERF-52, read against the text."""
    end = start + len(span)
    if is_word(span[0]):
        j = start - 1
        if j >= 0 and (is_word(text[j]) or word_internal(text, j)):
            return False
    if is_word(span[-1]):
        j = end
        if j < len(text) and (is_word(text[j]) or word_internal(text, j)):
            return False
    return True


def check(quote: str, text: str):
    """ERF-52. Returns (ok, message)."""
    # Split on the exact marker BEFORE normalization.
    raw_spans = quote.split("[...]")
    spans = [fold(s) for s in raw_spans]
    nonempty = [s for s in spans if s]
    if not nonempty:
        return False, "every span is empty after the fold"
    ftext = fold(text)

    def search(idx: int, pos: int):
        if idx == len(nonempty):
            return True
        span = nonempty[idx]
        at = ftext.find(span, pos)
        while at != -1:
            if boundary_ok(ftext, at, span):
                if search(idx + 1, at + len(span)):
                    return True
            at = ftext.find(span, at + 1)
        return False

    if search(0, 0):
        return True, "ok"
    # Report the first span that cannot be placed at all, for a useful message.
    for s in nonempty:
        if s not in ftext:
            return False, "span not present in the normalized text: %r" % s[:90]
    return False, "spans present but not in order, without overlap, and as whole words"


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--fold":
        sys.stdout.write(fold(open(sys.argv[2], encoding="utf-8").read()))
    else:
        print(__doc__)
