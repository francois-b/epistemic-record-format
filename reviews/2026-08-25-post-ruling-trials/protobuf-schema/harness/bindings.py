"""Narrative-binding recognition and validation, ERF-31.

Two separate acts, in this order, because ERF-31 says so:

  "A binding that does not match this grammar MUST be reported, never skipped.
   A comment opening `<!--` followed by `claims:` IS a narrative binding:
   recognizing one and validating one are separate acts, and a consumer
   performs them in that order."

RECOGNIZE is a loose regex over the prose. VALIDATE is the grammar. A recognized
binding that fails validation still becomes a NarrativeBinding message, with
well_formed=false and only `raw` meaningful -- because a message that could only
hold well-formed bindings would make the malformed one invisible, which is the
failure ERF-31 exists to forbid.
"""

import re

# RECOGNIZE: "<!--" ws* "claims:"
RECOGNIZE = re.compile(r"<!--\s*claims:.*?-->", re.DOTALL)

# VALIDATE: the ERF-31 grammar, transcribed.
#   id     ::= one or more characters, none of them whitespace or '"'
#   anchor ::= '"' char* '"'  with the two escapes \" and \\
#   date   ::= YYYY "-" MM "-" DD
_ID = r'[^\s"]+'
_ANCHOR = r'"(?:[^"\\]|\\"|\\\\)*"'
_DATE = r"\d{4}-\d{2}-\d{2}"
GRAMMAR = re.compile(
    r'^<!--\s*claims:\s+'
    rf'(?P<ids>{_ID}(?:\s+{_ID})*?)\s+'
    rf'(?P<anchor>{_ANCHOR})\s+'
    rf'bound-at=(?P<date>{_DATE})\s*-->$'
)


def unescape(anchor_literal):
    inner = anchor_literal[1:-1]
    return inner.replace('\\"', '"').replace("\\\\", "\\")


def extract(body):
    """Return a list of dicts, one per RECOGNIZED binding."""
    out = []
    for m in RECOGNIZE.finditer(body):
        raw = m.group(0)
        g = GRAMMAR.match(raw)
        if g:
            out.append({
                "claim_ids": g.group("ids").split(),
                "anchor": unescape(g.group("anchor")),
                "bound_at": g.group("date"),
                "raw": raw,
                "well_formed": True,
            })
        else:
            out.append({"raw": raw, "well_formed": False})
    return out


# ERF-51 folding, applied to the anchor and to the passage alike (ERF-31:
# "The anchor occurs in its passage under ERF-51"). Reproduced here only to
# show that a schema cannot hold it; it is not exercised by the round trip.
import unicodedata


def fold(text):
    t = unicodedata.normalize("NFKC", text)            # 1. NFKC
    t = t.replace("*", "").replace("_", "").replace("`", "")  # 2. markers
    return " ".join(t.split())                          # 3. whitespace, trim
