"""
erf_yaml.py -- reading and writing ERF frontmatter.

Two halves:

  READ   a YAML 1.2 JSON-schema loader [ERF-65] that also refuses duplicate
         keys, anchors, aliases and explicit tags [ERF-66]. Stock
         `yaml.safe_load` satisfies neither requirement: PyYAML implements
         YAML 1.1 (so an unquoted `2026-07-19` becomes a datetime.date, which
         is the exact hazard ERF-65 names) and silently keeps the last of a
         duplicate pair.

  WRITE  a hand-rolled canonical emitter. PyYAML's dumper cannot be used: it
         emits YAML 1.1 (quoting `no` and `on`), sorts or preserves keys by
         its own rule, and folds long scalars at a width the format does not
         define.

The emitter's style is a CHOICE, not a requirement -- the specification fixes
no key order, no scalar style and no line width. See round-trip-report.md.
"""

import re
import yaml

# ---------------------------------------------------------------- reading --


class ErfYamlError(Exception):
    pass


class ErfLoader(yaml.SafeLoader):
    """YAML 1.2 JSON schema [ERF-65] + the ERF-66 refusals."""


# [ERF-65] "Under it only `null`, the literals `true` and `false`, and JSON's
# own number grammar resolve to non-string scalars; everything else stays a
# string." Clearing the inherited YAML 1.1 resolver table is what removes the
# timestamp type, the y/n/yes/no booleans, the sexagesimals and the `~` null.
ErfLoader.yaml_implicit_resolvers = {}
ErfLoader.add_implicit_resolver("tag:yaml.org,2002:null", re.compile(r"^null$"), ["n"])
ErfLoader.add_implicit_resolver("tag:yaml.org,2002:bool", re.compile(r"^(true|false)$"), ["t", "f"])
ErfLoader.add_implicit_resolver(
    "tag:yaml.org,2002:int", re.compile(r"^-?(0|[1-9][0-9]*)$"), list("-0123456789")
)
ErfLoader.add_implicit_resolver(
    "tag:yaml.org,2002:float",
    re.compile(r"^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][-+]?[0-9]+)$|^-?(0|[1-9][0-9]*)\.[0-9]+$"),
    list("-0123456789"),
)


def _compose_node(self, parent, index):
    # [ERF-66] "MUST NOT contain a duplicate key, an anchor, an alias, or an
    # explicit tag." All four are legal YAML; the format declines them because
    # "two conforming parsers may legally disagree about the same file".
    if self.check_event(yaml.AliasEvent):
        ev = self.peek_event()
        raise ErfYamlError("ERF-66: alias *%s in frontmatter" % ev.anchor)
    ev = self.peek_event()
    if getattr(ev, "anchor", None) is not None:
        raise ErfYamlError("ERF-66: anchor &%s in frontmatter" % ev.anchor)
    if getattr(ev, "tag", None) is not None:
        raise ErfYamlError("ERF-66: explicit tag %s in frontmatter" % ev.tag)
    return yaml.composer.Composer.compose_node(self, parent, index)


ErfLoader.compose_node = _compose_node


def _construct_mapping(self, node, deep=False):
    seen = set()
    for key_node, _ in node.value:
        key = self.construct_object(key_node, deep=True)
        if key in seen:
            raise ErfYamlError("ERF-66: duplicate key %r in frontmatter" % key)
        seen.add(key)
    return yaml.constructor.SafeConstructor.construct_mapping(self, node, deep=deep)


ErfLoader.construct_mapping = _construct_mapping


FM_RE = re.compile(r"\A---\n(.*?\n)?---\n", re.S)


def split_file(text):
    """Split an interchange file into (frontmatter_text, body_text).

    [ERF-53] "one record per file: YAML frontmatter plus markdown body ... An
    atom's body is empty, so its file is frontmatter alone; the shape is still
    frontmatter plus body, not a bare YAML document."
    """
    m = FM_RE.match(text)
    if not m:
        raise ErfYamlError("ERF-53: file is not frontmatter plus body")
    return (m.group(1) or ""), text[m.end():]


def load_frontmatter(fm_text):
    """Parse frontmatter, returning (dict, key_order)."""
    data = yaml.load(fm_text, Loader=ErfLoader) if fm_text.strip() else {}
    if data is None:
        data = {}
    if not isinstance(data, dict):
        raise ErfYamlError("ERF-53: frontmatter is not a mapping")
    return data, list(data.keys())


def load_document(text):
    """Parse a whole YAML document (declaration, source list) under the same
    rules. [ERF-3][ERF-59] both say "a YAML document under the rules of
    section 7" -- see friction-log 2026-08-25 (ERF-59) on what that means for
    a file that is not a record."""
    data = yaml.load(text, Loader=ErfLoader)
    if data is None:
        data = {}
    if not isinstance(data, dict):
        raise ErfYamlError("expected a mapping at the top level")
    return data


def check_encoding(raw_bytes, rel_path):
    """[ERF-67] UTF-8, LF line endings, no byte-order mark."""
    problems = []
    if raw_bytes.startswith(b"\xef\xbb\xbf"):
        problems.append("ERF-67: byte-order mark")
    if b"\r" in raw_bytes:
        problems.append("ERF-67: CR present; line endings must be LF")
    try:
        raw_bytes.decode("utf-8")
    except UnicodeDecodeError as exc:
        problems.append("ERF-67: not valid UTF-8 (%s)" % exc)
    return problems


# ---------------------------------------------------------------- writing --
#
# The canonical style, stated once so the round-trip report can point at it:
#
#   * keys in data-model order (section 3), extension/unknown keys last, in
#     the order they were read;
#   * empty lists omitted entirely [ERF-55];
#   * block mappings at the top level;
#   * ActorStamp values and `converter` as one-line flow mappings, matching
#     the examples in 4.1/4.2/4.5;
#   * id lists (families, atoms_for, atoms_against, surveys) as one-line flow
#     sequences, matching `atoms_for: [kwg-014, kwg-015, kwg-016]`;
#   * audit entries and edges as one-line flow mappings inside a block
#     sequence;
#   * standings, searches and notable_results as block mappings inside a
#     block sequence;
#   * scalars plain where that is unambiguous, double-quoted otherwise;
#   * NEVER folded across lines, at any width.
#
# Every one of those bullets is a decision the specification does not make.

_PLAIN_SAFE = re.compile(r"\A[A-Za-z0-9_][A-Za-z0-9 _./:+@()'-]*\Z")
_TIMESTAMPISH = re.compile(r"\A[0-9]{4}-[0-9]{2}-[0-9]{2}([T ].*)?\Z")
_JSONISH = re.compile(
    r"\A(null|true|false|-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][-+]?[0-9]+)?)\Z"
)


def _needs_quotes(s, in_flow=False):
    if s == "":
        return True
    if not _PLAIN_SAFE.match(s):
        return True
    if _JSONISH.match(s):
        # would resolve to a non-string scalar under ERF-65
        return True
    if s.endswith(" ") or s.endswith(":"):
        return True
    if in_flow and any(c in s for c in ",{}[]:"):
        # a plain scalar in flow context may not carry a colon or a flow
        # indicator without ambiguity
        return True
    if _TIMESTAMPISH.match(s):
        # [ERF-65] "A producer SHOULD quote a timestamp regardless, so that a
        # reader on a legacy schema still receives a string." Honoured here,
        # which means this writer quotes timestamps the specification's own
        # examples leave bare (friction-log 2026-08-25, ERF-65).
        return True
    if ": " in s or " #" in s:
        return True
    return False


def scalar(value, in_flow=False):
    """Emit one scalar, never folded."""
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        return repr(value)
    s = str(value)
    if _needs_quotes(s, in_flow=in_flow):
        out = s.replace("\\", "\\\\").replace('"', '\\"')
        out = out.replace("\n", "\\n").replace("\t", "\\t").replace("\r", "\\r")
        return '"%s"' % out
    return s


def flow_map(pairs):
    return "{" + ", ".join("%s: %s" % (k, scalar(v, in_flow=True)) for k, v in pairs) + "}"


def flow_seq(items):
    return "[" + ", ".join(scalar(i, in_flow=True) for i in items) + "]"


def block_map(pairs, indent):
    """A block mapping, used inside block sequences."""
    pad = " " * indent
    out = []
    for k, v in pairs:
        if isinstance(v, list):
            out.append("%s%s: %s" % (pad, k, flow_seq(v)))
        elif isinstance(v, dict):
            out.append("%s%s: %s" % (pad, k, flow_map(list(v.items()))))
        else:
            out.append("%s%s: %s" % (pad, k, scalar(v)))
    return out


def json_to_yaml(value, indent=0):
    """Emit an arbitrary preserved value [ERF-57]: unknown fields come back in
    a canonical shape, which round-trips their MEANING but not their bytes."""
    pad = " " * indent
    if isinstance(value, dict):
        if not value:
            return ["%s{}" % pad]
        lines = []
        for k, v in value.items():
            if isinstance(v, (dict, list)) and v:
                lines.append("%s%s:" % (pad, k))
                lines.extend(json_to_yaml(v, indent + 2))
            else:
                lines.append("%s%s: %s" % (pad, k, scalar(v) if not isinstance(v, (dict, list))
                                           else ("{}" if isinstance(v, dict) else "[]")))
        return lines
    if isinstance(value, list):
        if not value:
            return ["%s[]" % pad]
        lines = []
        for item in value:
            if isinstance(item, dict):
                inner = json_to_yaml(item, indent + 2)
                inner[0] = pad + "- " + inner[0].lstrip()
                lines.extend(inner)
            elif isinstance(item, list):
                lines.append("%s- %s" % (pad, flow_seq(item)))
            else:
                lines.append("%s- %s" % (pad, scalar(item)))
        return lines
    return ["%s%s" % (pad, scalar(value))]
