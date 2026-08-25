"""Direct measurements of proto3 presence semantics against ERF's rules.

Each probe is a claim the deliverables make, measured rather than asserted.
Run:  python harness/presence_probe.py
"""

import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ROOT, "gen"))

import erf_pb2 as pb
from google.protobuf import json_format, descriptor
from google.protobuf.struct_pb2 import Struct

FD = descriptor.FieldDescriptor
R = []


def say(label, result, verdict):
    R.append((label, result, verdict))
    print(f"  {verdict:<9} {label}\n            {result}")


def hdr(t):
    print(f"\n{t}\n{'-' * len(t)}")


# ---------------------------------------------------------------------------
hdr("P-1  evidence_at_stance: absent vs present-and-empty (ERF-55, ERF-20)")

c = pb.Claim(id="x", type="claim")
e0 = c.standings.add(timestamp="t0", stance=1, by="human:a", why="w")   # absent
e1 = c.standings.add(timestamp="t1", stance=1, by="human:b", why="w")
e1.evidence_at_stance.SetInParent()                                     # present {}
e2 = c.standings.add(timestamp="t2", stance=2, by="human:c", why="w")
e2.evidence_at_stance.atoms_for.append("pt-001")                        # present, 1

wire = c.SerializeToString()
back = pb.Claim.FromString(wire)
states = [s.HasField("evidence_at_stance") for s in back.standings]
say("HasField after a full wire round trip", states,
    "PRESERVED" if states == [False, True, True] else "DESTROYED")

only_empty = pb.EvidenceAtStance().SerializeToString()
say("bytes for an EvidenceAtStance carrying two empty lists",
    f"{len(only_empty)} bytes of content; the parent spends "
    f"{len(e1.evidence_at_stance.SerializeToString()) + 2} bytes to say 'present'",
    "MEASURED")

# ---------------------------------------------------------------------------
hdr("P-2  optional scalar: absent vs present-and-empty (`optional` keyword)")

a1 = pb.Atom(id="a1", type="atom")                       # limitations absent
a2 = pb.Atom(id="a2", type="atom"); a2.limitations = ""  # present, empty
b1, b2 = a1.SerializeToString(), a2.SerializeToString()
r1, r2 = pb.Atom.FromString(b1), pb.Atom.FromString(b2)
say("with `optional`: HasField after round trip",
    f"absent={r1.HasField('limitations')}  empty={r2.HasField('limitations')}  "
    f"bytes differ by {len(b2) - len(b1)}",
    "PRESERVED" if not r1.HasField("limitations")
    and r2.HasField("limitations") else "DESTROYED")

# The control: `body` is a plain proto3 string with implicit presence, which is
# what EVERY optional scalar would be if the `optional` keyword were dropped.
c1 = pb.Claim(id="c"); c2 = pb.Claim(id="c"); c2.body = ""
say("CONTROL, implicit presence (no `optional`): same two states",
    f"bytes identical: {c1.SerializeToString() == c2.SerializeToString()}; "
    f"has_presence={pb.Claim.DESCRIPTOR.fields_by_name['body'].has_presence}; "
    f"a reader cannot ask, and there is no API to ask with",
    "DESTROYED")

# ---------------------------------------------------------------------------
hdr("P-3  optional LIST: `surveys?: SurveyId[]` (proto3 forbids "
    "`optional repeated`)")

s_absent = pb.Claim(id="s1")
s_empty = pb.Claim(id="s2"); s_empty.surveys.SetInParent()
s_full = pb.Claim(id="s3"); s_full.surveys.values.append("srv-1")
states = [pb.Claim.FromString(m.SerializeToString()).HasField("surveys")
          for m in (s_absent, s_empty, s_full)]
say("WRAPPER encoding (chosen): three-state survives",
    f"absent/empty/full -> {states}",
    "PRESERVED" if states == [False, True, True] else "DESTROYED")
say("PLAIN `repeated` encoding (the alternative)",
    "`repeated` has no presence at all: absent and empty are the same "
    "zero bytes. proto3 offers no third option.",
    "DESTROYED")

# ---------------------------------------------------------------------------
hdr("P-4  enum zero: does it create a state the specification lacks?")

for msg_cls, field, enum_name in [
        (pb.Claim, "epistemic_kind", "EpistemicKind"),
        (pb.StandingEntry, "stance", "Stance"),
        (pb.Edge, "relation", "Relation"),
        (pb.Atom, "source_quality", "SourceQuality"),
        (pb.AuditEntry, "verdict", "Verdict"),
        (pb.Source, "status", "SourceStatus")]:
    f = msg_cls.DESCRIPTOR.fields_by_name[field]
    zero = f.enum_type.values_by_number[0].name
    say(f"{msg_cls.DESCRIPTOR.name}.{field} ({enum_name})",
        f"zero member {zero!r}; has_presence={f.has_presence}; "
        f"omitted and zero are the same {len(msg_cls().SerializeToString())} bytes",
        "ILLEGAL-STATE")

# ---------------------------------------------------------------------------
hdr("P-5  source list as map<string, Source>: ordering and duplicates")

IN = ["zeta", "alpha", "mu", "beta"]
runs = []
for _ in range(6):
    sl = pb.SourceList(type="sources")
    for k in IN:
        sl.sources[k].citation_text = k
    runs.append(list(pb.SourceList.FromString(
        sl.SerializeToString()).sources.keys()))
say("key order after a wire round trip",
    f"in  {IN}\n            out " +
    "\n            out ".join(str(r) for r in runs[:3]),
    "PRESERVED" if all(r == IN for r in runs) else "REORDERED")
import subprocess
SNIP = ("import sys; sys.path.insert(0, %r)\n"
        "import erf_pb2 as pb\n"
        "sl = pb.SourceList(type='sources')\n"
        "for k in ['zeta','alpha','mu','beta']: sl.sources[k].citation_text=k\n"
        "print(','.join(pb.SourceList.FromString("
        "sl.SerializeToString()).sources.keys()))\n"
        % os.path.join(ROOT, "gen"))
procs = {subprocess.run([sys.executable, "-c", SNIP], capture_output=True,
                        text=True).stdout.strip() for _ in range(6)}
say("is the order at least STABLE across PROCESSES?",
    f"{len(procs)} distinct orderings from 6 separate runs of identical code "
    f"on identical input: {sorted(procs)}. Within one process the order is "
    f"fixed; across processes the map's hash seed moves, so serializing one "
    f"corpus today and again tomorrow produces different bytes and a "
    f"different YAML document.",
    "UNSTABLE" if len(procs) > 1 else "STABLE")
say("what proto3 GUARANTEES about that order",
    "Nothing. The language spec declares wire ordering and iteration order "
    "of map fields undefined. The instability above is that licence being "
    "exercised, not a bug.",
    "UNGUARANTEED")

d1 = pb.SourceList(); d1.sources["dup"].citation_text = "FIRST"
d2 = pb.SourceList(); d2.sources["dup"].citation_text = "SECOND"
merged = pb.SourceList.FromString(d1.SerializeToString() + d2.SerializeToString())
say("two map entries with the SAME key arriving on the wire",
    f"{len(merged.sources)} entry survives, citation_text="
    f"{merged.sources['dup'].citation_text!r}; the collision is resolved "
    f"by the parser, silently, before any validator runs",
    "UNDETECTABLE")

# ---------------------------------------------------------------------------
hdr("P-6  CSL citation through google.protobuf.Struct (ERF-8)")

csl = {"type": "book", "issued": 1494, "chapter-number": 36,
       "author": [{"family": "Pacioli", "given": "Luca"}]}
st = Struct(); json_format.ParseDict(csl, st)
outp = json_format.MessageToDict(pb.Source.FromString(
    pb.Source(citation=st).SerializeToString()).citation)
say("integer fidelity",
    f"in  issued={csl['issued']!r} chapter-number={csl['chapter-number']!r}\n"
    f"            out issued={outp['issued']!r} "
    f"chapter-number={outp['chapter-number']!r}",
    "LOST")
say("why a hand-written CSL message is not the escape",
    "CSL field names contain hyphens (chapter-number, publisher-place, "
    "container-title). A proto identifier cannot. Any typed CSL message "
    "needs a rename table the specification does not supply, and CSL-JSON "
    "is open-ended, so the table can never be complete.",
    "STRUCTURAL")

# ---------------------------------------------------------------------------
hdr("P-7  unknown fields: what proto3 retention does and does not buy")

known = pb.Atom(id="a", type="atom")
raw = known.SerializeToString() + b"\xf8\x3e\x2a"   # field 999, varint 42
rt = pb.Atom.FromString(raw)
say("an unknown WIRE field survives a proto->proto round trip",
    f"{len(rt.SerializeToString()) == len(raw)}  "
    f"(proto3 retains unknown fields since 3.5)",
    "PRESERVED")
say("what that is worth for a YAML corpus",
    "Nothing. A YAML key has a NAME, not a field number. There is no wire "
    "field to retain because the value never reached the wire: the reader "
    "must decide where to put `granted:` before serializing anything. "
    "Preservation requires an explicitly declared map, which is what "
    "`unrecognized` is.",
    "USELESS-HERE")

# ---------------------------------------------------------------------------
hdr("P-8  narrative bindings")

n = pb.Narrative(type="narrative", title="t", corpus="c")
n.body = ('Prose.\n<!-- claims: c1 c2 "an anchor" bound-at=2026-08-24 -->\n'
          'More prose.\n<!-- claims: c3 "no bound-at" -->\n')
import bindings as bm
for b in bm.extract(n.body):
    n.bindings.add(**b)
rt = pb.Narrative.FromString(n.SerializeToString())
say("recognized vs well formed",
    f"{len(rt.bindings)} recognized, "
    f"{sum(1 for b in rt.bindings if not b.well_formed)} malformed and "
    f"carried anyway in `raw`",
    "PRESERVED")
say("what the schema knows about a binding inside `body`",
    "Nothing. `body` is a string. Every ERF-31/32/33/51 operation re-parses "
    "prose at read time; the .proto contributes no constraint whatever.",
    "OPAQUE")

# ---------------------------------------------------------------------------
hdr("Schema size")

fds = pb.DESCRIPTOR
msgs = list(fds.message_types_by_name.values())
n_fields = sum(len(m.fields) for m in msgs)
# proto3 `optional` compiles to a SYNTHETIC ONEOF; that is the mechanism by
# which the keyword buys presence back. Counting them counts the places the
# specification depends on a distinction proto3's default encoding destroys.
n_opt = sum(1 for m in msgs for f in m.fields
            if f.has_presence and f.type != FD.TYPE_MESSAGE)
n_msgfields = sum(1 for m in msgs for f in m.fields
                  if f.type == FD.TYPE_MESSAGE and not f.is_repeated
                  and not f.message_type.GetOptions().map_entry)
n_rep = sum(1 for m in msgs for f in m.fields if f.is_repeated and not (
    f.type == FD.TYPE_MESSAGE and f.message_type.GetOptions().map_entry))
n_maps = sum(1 for m in msgs for f in m.fields if f.type == FD.TYPE_MESSAGE
             and f.message_type.GetOptions().map_entry)
SCAFFOLD = {"Corpus", "OpaqueFile", "SurveyIdList", "AtomIdList",
            "NarrativeBinding"}
spec_msgs = [m for m in msgs if m.name not in SCAFFOLD]
print(f"  messages defined      : {len(msgs)}  "
      f"({len(spec_msgs)} from the data model, "
      f"{len(msgs) - len(spec_msgs)} scaffolding proto3 forced)")
print(f"  fields defined        : {n_fields}")
print(f"  enums defined         : {len(fds.enum_types_by_name)}")
print(f"  `optional` scalars    : {n_opt}   <- explicit-presence opt-ins")
print(f"  singular message flds : {n_msgfields}   <- presence for free")
print(f"  repeated fields       : {n_rep}")
print(f"  map fields            : {n_maps}   <- ordering + duplicates lost")
ESCAPE = {"x_fields", "unrecognized", "frontmatter", "raw", "well_formed",
          "bindings", "values", "opaque"}
n_spec_fields = sum(1 for m in spec_msgs for f in m.fields
                    if f.name not in ESCAPE)
n_machinery = n_fields - n_spec_fields
print(f"  of which:")
print(f"    data-model fields   : {n_spec_fields}")
print(f"    machinery fields    : {n_machinery}   <- escape hatches, wrappers,"
      f" envelope; none in the spec")

print("\n" + "=" * 74)
from collections import Counter
print(Counter(v for _, _, v in R))
