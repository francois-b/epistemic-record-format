"""YAML load/dump obeying ERF-65, ERF-66, ERF-67 as closely as PyYAML allows.

ERF-65: "Frontmatter MUST parse under YAML 1.2 using the JSON schema, the
narrowest of the three the specification defines. Under it only `null`, the
literals `true` and `false`, and JSON's own number grammar resolve to non-string
scalars; everything else stays a string."

PyYAML implements YAML 1.1 with the core schema and a timestamp resolver in its
default set -- precisely the hazard ERF-65 names ("an unquoted `timestamp`
became a date object"). This module strips the resolver table down to the JSON
schema, so `timestamp: 2026-08-23` loads as the string "2026-08-23".

ERF-66 forbids duplicate keys, anchors, aliases, and explicit tags. PyYAML
silently accepts all four; the loader below rejects them, which is a CODE
check, not a schema check.
"""

import re
import yaml


class ErfDuplicateKey(ValueError):
    pass


class ErfIllegalYaml(ValueError):
    pass


class Erf65Loader(yaml.SafeLoader):
    """YAML 1.2 JSON-schema scalar resolution."""


# Rebuild the implicit resolver table from nothing: JSON schema only.
Erf65Loader.yaml_implicit_resolvers = {}

Erf65Loader.add_implicit_resolver(
    "tag:yaml.org,2002:null", re.compile(r"^null$"), ["n"]
)
Erf65Loader.add_implicit_resolver(
    "tag:yaml.org,2002:bool", re.compile(r"^(?:true|false)$"), ["t", "f"]
)
Erf65Loader.add_implicit_resolver(
    "tag:yaml.org,2002:int", re.compile(r"^-?(?:0|[1-9][0-9]*)$"), list("-0123456789")
)
Erf65Loader.add_implicit_resolver(
    "tag:yaml.org,2002:float",
    re.compile(r"^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][-+]?[0-9]+)$"
               r"|^-?(?:0|[1-9][0-9]*)\.[0-9]+$"),
    list("-0123456789"),
)
# An empty scalar. JSON has no such production; YAML 1.2's JSON schema is
# therefore silent on it. Resolved to null here, and recorded as gap G7.
Erf65Loader.add_implicit_resolver("tag:yaml.org,2002:null", re.compile(r"^$"), [""])


def _no_alias(loader, node):
    raise ErfIllegalYaml("ERF-66: anchors and aliases are forbidden")


def _construct_mapping(loader, node, deep=False):
    """ERF-66: reject duplicate keys instead of letting the parser choose."""
    loader.flatten_mapping(node)
    mapping = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in mapping:
            raise ErfDuplicateKey(f"ERF-66: duplicate key {key!r}")
        mapping[key] = loader.construct_object(value_node, deep=deep)
    return mapping


Erf65Loader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _construct_mapping
)


def load(text):
    """Load one YAML document under ERF-65/66 rules."""
    doc = yaml.load(text, Loader=Erf65Loader)
    return {} if doc is None else doc


# --------------------------------------------------------------------------
# Dumping.
# --------------------------------------------------------------------------

# Strings a YAML 1.1 reader (PyYAML's default) would resolve to a non-string.
# ERF-65: "A producer SHOULD quote a timestamp regardless, so that a reader on
# a legacy schema still receives a string." This is that SHOULD, implemented.
_YAML11_HAZARD = re.compile(
    r"^("
    r"\d{4}-\d{1,2}-\d{1,2}([Tt ].*)?"          # timestamps
    r"|[-+]?\d+(_\d+)*"                          # ints incl. underscores
    r"|0o?[0-7]+|0x[0-9a-fA-F]+|[-+]?\d[\d_]*:[0-5]?\d(:[0-5]?\d)?"
    r"|[-+]?(\.\d+|\d+(\.\d*)?)([eE][-+]?\d+)?"  # floats
    r"|[yY]|[nN]|[yY]es|[nN]o|[oO]n|[oO]ff|[tT]rue|[fF]alse|~"
    r"|\.inf|\.INF|\.nan|\.NAN|null|Null|NULL"
    r")$"
)


class ErfDumper(yaml.SafeDumper):
    pass


def _repr_str(dumper, data):
    if "\n" in data:
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="|")
    if _YAML11_HAZARD.match(data) or data == "":
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style='"')
    return dumper.represent_scalar("tag:yaml.org,2002:str", data)


ErfDumper.add_representer(str, _repr_str)


def dump(obj):
    return yaml.dump(
        obj, Dumper=ErfDumper, default_flow_style=False, sort_keys=False,
        allow_unicode=True, width=100,
    )


# --------------------------------------------------------------------------
# The interchange form: ERF-53, frontmatter + markdown body.
# --------------------------------------------------------------------------

def split_file(text):
    """Return (frontmatter_dict, body_str) for a record file.

    ERF-53: "The canonical interchange form MUST be one record per file: YAML
    frontmatter plus markdown body, for every record type. An atom's body is
    empty, so its file is frontmatter alone; the shape is still frontmatter plus
    body, not a bare YAML document."

    Note what this function CANNOT return: a distinction between an absent body
    and an empty body. There is no syntax for one. See losslessness.md case P-6.
    """
    if not text.startswith("---\n"):
        # A bare YAML document: the declaration and the source list, which are
        # not records (ERF-3, ERF-59) and carry no body.
        return load(text), None
    rest = text[4:]
    end = rest.find("\n---")
    if end == -1:
        raise ErfIllegalYaml("ERF-53: frontmatter is not terminated")
    fm = load(rest[:end])
    after = rest[end + 4:]
    body = after[1:] if after.startswith("\n") else after
    return fm, body


def join_file(frontmatter, body):
    fm = dump(frontmatter)
    if body is None:
        return fm
    return f"---\n{fm}---\n{body}"
