"""YAML dict <-> generated protobuf message, both directions.

Descriptor-driven, so the mapping cannot silently drift from erf.proto. Every
place a decision had to be made that the specification did not make is marked
DECISION and cross-referenced to ambiguities.md.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "gen"))

from google.protobuf import json_format, descriptor
from google.protobuf.struct_pb2 import Struct, Value
import erf_pb2 as pb

FD = descriptor.FieldDescriptor

# --------------------------------------------------------------------------
# Enum value tables. Written out rather than derived, because three of the six
# vocabularies use a casing or a separator that no mechanical rule produces
# from the proto member name: "decomposes-into" (hyphen, illegal in a proto
# identifier) and "SUPPORTED" (uppercase). See what-the-schema-cannot-say #V1.
# --------------------------------------------------------------------------

ENUM_YAML = {
    "erf.v0_9.EpistemicKind": {
        "observation": 1, "argument": 2, "bet": 3, "commitment": 4},
    "erf.v0_9.Stance": {
        "for": 1, "against": 2, "withdrawn": 3},
    "erf.v0_9.Relation": {
        "supports": 1, "assumes": 2,
        "decomposes-into": 3, "conflicts-with": 4},
    "erf.v0_9.SourceQuality": {
        "high": 1, "medium": 2, "low": 3},
    "erf.v0_9.Verdict": {
        "SUPPORTED": 1, "PARTIAL": 2, "UNSUPPORTED": 3},
    "erf.v0_9.SourceStatus": {
        "shipped": 1, "shipped-as-quotation": 2, "not-redistributable": 3,
        "access-restricted": 4, "licence-unverified": 5},
}
ENUM_PROTO = {name: {v: k for k, v in table.items()}
              for name, table in ENUM_YAML.items()}

# Wrapper messages that stand in for an OPTIONAL LIST (proto3 forbids
# `optional repeated`). Their single `values` field carries the list; the
# wrapper's own presence carries the `?`.
LIST_WRAPPERS = {"erf.v0_9.SurveyIdList", "erf.v0_9.AtomIdList"}

# Maps that exist to absorb what the closed schema cannot name.
ESCAPE_MAPS = {"x_fields", "unrecognized", "frontmatter"}

# Fields whose YAML name differs from the proto field name.
YAML_NAME = {("erf.v0_9.OpaqueFile", "type_value"): "type"}


class Loss(Exception):
    pass


def _yaml_name(msg_full_name, field_name):
    return YAML_NAME.get((msg_full_name, field_name), field_name)


# --------------------------------------------------------------------------
# YAML -> proto
# --------------------------------------------------------------------------

def to_proto(data, msg, notes=None):
    """Populate `msg` from the mapping `data`. Returns list of notes."""
    notes = notes if notes is not None else []
    d = msg.DESCRIPTOR
    known = {}
    for f in d.fields:
        if f.name in ESCAPE_MAPS:
            continue
        known[_yaml_name(d.full_name, f.name)] = f

    for key, value in data.items():
        f = known.get(key)
        if f is None:
            # ERF-72 extension namespace, or ERF-57 unknown field.
            target = "x_fields" if key.startswith("x_") else "unrecognized"
            if any(x.name == target for x in d.fields):
                json_format.ParseDict(value, msg.__getattribute__(target)[key])
                notes.append(("escape", d.full_name, key, target))
            else:
                raise Loss(f"{d.full_name}: no home for key {key!r}")
            continue
        _set_field(msg, f, value, notes)
    return notes


def _set_field(msg, f, value, notes):
    d = msg.DESCRIPTOR

    # map<string, Value> handled above; map<string, Source> here.
    if f.type == FD.TYPE_MESSAGE and f.message_type.GetOptions().map_entry:
        vt = f.message_type.fields_by_name["value"]
        container = getattr(msg, f.name)
        for k, v in value.items():
            if vt.type == FD.TYPE_MESSAGE:
                to_proto(v, container[k], notes)
            else:
                container[k] = v
        return

    if f.is_repeated:
        container = getattr(msg, f.name)
        for item in value:
            if f.type == FD.TYPE_MESSAGE:
                to_proto(item, container.add(), notes)
            elif f.type == FD.TYPE_ENUM:
                container.append(_enum_in(f, item, notes))
            else:
                container.append(item)
        return

    if f.type == FD.TYPE_ENUM:
        setattr(msg, f.name, _enum_in(f, value, notes))
        return

    if f.type == FD.TYPE_MESSAGE:
        sub = getattr(msg, f.name)
        full = f.message_type.full_name
        if full == "google.protobuf.Struct":
            json_format.ParseDict(value, sub)
            notes.append(("struct", d.full_name, f.name, None))
        elif full in LIST_WRAPPERS:
            sub.SetInParent()          # <- makes an EMPTY wrapper PRESENT
            for item in value:
                sub.values.append(item)
        else:
            sub.SetInParent()          # <- present even if `value` is {}
            to_proto(value, sub, notes)
        return

    setattr(msg, f.name, value)


def _enum_in(f, value, notes):
    table = ENUM_YAML[f.enum_type.full_name]
    if value in table:
        return table[value]
    # Section 5: "A value outside them is a validation failure, not a dialect."
    # proto3 open enums can hold an unknown NUMBER but not an unknown STRING,
    # so an illegal YAML value has nowhere to go except the zero member -- which
    # is indistinguishable from an omitted field. See finding F1.
    notes.append(("enum-illegal", f.containing_type.full_name, f.name, value))
    return 0


# --------------------------------------------------------------------------
# proto -> YAML
# --------------------------------------------------------------------------

def from_proto(msg):
    d = msg.DESCRIPTOR
    out = {}
    for f in d.fields:
        if f.name in ESCAPE_MAPS:
            continue
        name = _yaml_name(d.full_name, f.name)

        if f.type == FD.TYPE_MESSAGE and f.message_type.GetOptions().map_entry:
            container = getattr(msg, f.name)
            # DECISION (#A3): a map field has no presence. ERF-3 requires the
            # source list's `sources` key to be WRITTEN even when the corpus
            # has none, so this one map is emitted unconditionally and every
            # other map is emitted only when non-empty. That asymmetry is a
            # rule living in code because the schema cannot hold it.
            always = (d.full_name == "erf.v0_9.SourceList" and f.name == "sources")
            if container or always:
                vt = f.message_type.fields_by_name["value"]
                out[name] = {
                    k: (from_proto(container[k]) if vt.type == FD.TYPE_MESSAGE
                        else container[k])
                    for k in container
                }
            continue

        if f.is_repeated:
            container = getattr(msg, f.name)
            # ERF-55: "Empty lists MUST be omitted: a field's absence means
            # none." proto3 agrees exactly: an empty repeated field is absent.
            if not container:
                continue
            if f.type == FD.TYPE_MESSAGE:
                out[name] = [from_proto(x) for x in container]
            elif f.type == FD.TYPE_ENUM:
                out[name] = [_enum_out(f, x) for x in container]
            else:
                out[name] = list(container)
            continue

        if f.type == FD.TYPE_MESSAGE:
            if not msg.HasField(f.name):
                continue
            sub = getattr(msg, f.name)
            full = f.message_type.full_name
            if full == "google.protobuf.Struct":
                out[name] = json_format.MessageToDict(sub)
            elif full in LIST_WRAPPERS:
                out[name] = list(sub.values)
            else:
                out[name] = from_proto(sub)
            continue

        if f.has_presence:
            if not msg.HasField(f.name):
                continue
            v = getattr(msg, f.name)
            out[name] = _enum_out(f, v) if f.type == FD.TYPE_ENUM else v
            continue

        # No presence. This is where proto3 conflates "absent" with "zero".
        v = getattr(msg, f.name)
        if f.type == FD.TYPE_ENUM:
            if v == 0:
                continue        # cannot tell omitted from illegal-zero
            out[name] = _enum_out(f, v)
            continue
        if v in ("", 0, 0.0, False):
            # DECISION (#A4): omit. The alternative -- always emit -- would
            # write `limitations: ""` onto every atom that never had one.
            continue
        out[name] = v

    for escape in ("x_fields", "unrecognized"):
        if any(x.name == escape for x in d.fields):
            container = getattr(msg, escape)
            for k in container:
                out[k] = json_format.MessageToDict(container[k])
    return out


def _enum_out(f, v):
    table = ENUM_PROTO[f.enum_type.full_name]
    return table.get(v, f"<UNSPECIFIED:{v}>")


# --------------------------------------------------------------------------
# Record-type dispatch (ERF-54: read the `type`, never the path).
# --------------------------------------------------------------------------

TYPE_TO_MESSAGE = {
    "atom": pb.Atom,
    "claim": pb.Claim,
    "survey": pb.Survey,
    "corpus": pb.CorpusDeclaration,
    "sources": pb.SourceList,
    "narrative": pb.Narrative,
}
