#!/usr/bin/env python3
"""
erf_validate.py -- a validator for the Epistemic Record Format, v0.9 (draft),
in the YAML/Markdown binding version 1.

Built cold from SPEC-as-tried.md and BINDING-as-tried.md alone.

Usage:  python3 erf_validate.py <corpus-directory> [--json] [--quiet]

Exit code 1 if any violation was found, 0 otherwise (flags and notices do not
fail the run: SPEC section 1, "A flag is not a violation").

Dependencies: Python 3 standard library + PyYAML.
"""

import argparse
import json
import os
import re
import sys
import unicodedata
from datetime import datetime

try:
    import yaml
except ImportError:  # pragma: no cover
    sys.stderr.write("PyYAML is required: pip install pyyaml\n")
    raise SystemExit(2)


# ---------------------------------------------------------------------------
# 1. The YAML loader: YAML 1.2 JSON schema resolution on top of PyYAML
# ---------------------------------------------------------------------------
# BINDING ERF-65: "Frontmatter MUST parse under YAML 1.2 using the JSON schema
# [...] Under it only `null`, the literals `true` and `false`, and JSON's own
# number grammar resolve to non-string scalars; everything else stays a
# string."
#
# PyYAML ships YAML 1.1 resolution and offers no schema selector, so the
# resolver table is replaced wholesale.  See yaml-behaviour.md.

class JsonSchemaLoader(yaml.SafeLoader):
    # Empty dict, not inherited: add_implicit_resolver() then appends to *this*
    # table rather than copying PyYAML's 1.1 one into the subclass.
    yaml_implicit_resolvers = {}


JsonSchemaLoader.add_implicit_resolver(
    'tag:yaml.org,2002:null', re.compile(r'^null$'), ['n'])
# YAML 1.2's JSON schema has no production for the empty scalar (JSON has no
# such token).  Choice recorded in ambiguities.md: empty plain scalar -> null.
JsonSchemaLoader.add_implicit_resolver(
    'tag:yaml.org,2002:null', re.compile(r'^$'), [''])
JsonSchemaLoader.add_implicit_resolver(
    'tag:yaml.org,2002:bool', re.compile(r'^(true|false)$'), ['t', 'f'])
JsonSchemaLoader.add_implicit_resolver(
    'tag:yaml.org,2002:int', re.compile(r'^-?(0|[1-9][0-9]*)$'),
    list('-0123456789'))
JsonSchemaLoader.add_implicit_resolver(
    'tag:yaml.org,2002:float',
    re.compile(r'^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][-+]?[0-9]+)?$'),
    list('-0123456789'))

# A reference YAML 1.1 resolver, used only to report which plain scalars would
# have been retyped by a legacy (default-PyYAML) reader.  BINDING ERF-65: "A
# producer SHOULD quote a timestamp regardless, so that a reader on a legacy
# schema still receives a string."
_LEGACY_RESOLVER = yaml.resolver.Resolver()
_STR_TAG = 'tag:yaml.org,2002:str'


def legacy_tag(value):
    try:
        return _LEGACY_RESOLVER.resolve(yaml.nodes.ScalarNode, value,
                                        (True, False))
    except Exception:
        return _STR_TAG


# ---------------------------------------------------------------------------
# 2. Report
# ---------------------------------------------------------------------------

VIOLATION = 'violation'
FLAG = 'flag'
NOTICE = 'notice'
_ORDER = {VIOLATION: 0, FLAG: 1, NOTICE: 2}


class Report:
    def __init__(self):
        self.items = []

    def add(self, severity, req, where, msg):
        self.items.append({'severity': severity, 'requirement': req,
                           'where': where, 'message': msg})

    def violation(self, req, where, msg):
        self.add(VIOLATION, req, where, msg)

    def flag(self, req, where, msg):
        self.add(FLAG, req, where, msg)

    def notice(self, req, where, msg):
        self.add(NOTICE, req, where, msg)

    def counts(self):
        c = {VIOLATION: 0, FLAG: 0, NOTICE: 0}
        for i in self.items:
            c[i['severity']] += 1
        return c

    def sorted_items(self):
        return sorted(self.items,
                      key=lambda i: (_ORDER[i['severity']], i['where'],
                                     i['requirement']))


# ---------------------------------------------------------------------------
# 3. ERF-51 normalization and the ERF-52 quote check
# ---------------------------------------------------------------------------

_MARKERS = {ord('*'): None, ord('_'): None, ord('`'): None}


def erf51_fold(s):
    """SPEC ERF-51, applied identically to a quote and to a normalized text.

    1. Unicode NFC.
    2. Remove the markdown emphasis and code markers `*`, `_` and backtick.
    3. Collapse whitespace runs to a single space, then trim.

    Case is NOT folded.
    """
    s = unicodedata.normalize('NFC', s)
    s = s.translate(_MARKERS)
    s = ' '.join(s.split())          # collapse + trim, in one gesture
    return s


def _wordish(ch):
    """A "letter, digit, or combining mark" for ERF-52's whole-words rule.

    Chosen reading: Unicode general categories L*, N* and M*.  See
    ambiguities.md (ERF-52, reading A) -- "digit" could also mean Nd alone.
    """
    return unicodedata.category(ch)[0] in ('L', 'N', 'M')


def _boundaries_ok(text, start, span):
    end = start + len(span)
    if _wordish(span[0]) and start > 0 and _wordish(text[start - 1]):
        return False
    if _wordish(span[-1]) and end < len(text) and _wordish(text[end]):
        return False
    return True


_STEP_BUDGET = 400000


def locate_spans(text, spans):
    """Place every span in `text`, in order and without overlap, each occurring
    as whole words (ERF-52).  Returns a list of (start, end) or None.

    Full backtracking: a greedy leftmost scan is incomplete, because the
    earliest boundary-legal occurrence of span i can starve span i+1 where a
    later occurrence of span i would not.  See ambiguities.md (ERF-52,
    reading B).
    """
    steps = [0]

    def rec(i, pos):
        if i == len(spans):
            return []
        s = spans[i]
        start = pos
        while True:
            steps[0] += 1
            if steps[0] > _STEP_BUDGET:
                raise TimeoutError('span search budget exhausted')
            k = text.find(s, start)
            if k < 0:
                return None
            if _boundaries_ok(text, k, s):
                rest = rec(i + 1, k + len(s))
                if rest is not None:
                    return [(k, k + len(s))] + rest
            start = k + 1

    return rec(0, 0)


def quote_check(quote, normalized_text):
    """SPEC ERF-6, ERF-50, ERF-51, ERF-52.

    Returns (ok: bool, detail: str).
    """
    # ERF-52: "The quote MUST be split on `[...]` BEFORE normalization".
    raw_spans = quote.split('[...]')
    spans = [erf51_fold(s) for s in raw_spans]
    non_empty = [s for s in spans if s]
    if not non_empty:
        # ERF-52: "A quote whose spans are all empty MUST fail rather than
        # trivially pass."
        return False, 'every span of the quote is empty after normalization'
    text = erf51_fold(normalized_text)
    try:
        placement = locate_spans(text, non_empty)
    except TimeoutError as exc:
        return False, str(exc)
    if placement is None:
        # Report which span first fails on its own, for a usable diagnostic.
        for s in non_empty:
            found = False
            k = text.find(s)
            while k >= 0:
                if _boundaries_ok(text, k, s):
                    found = True
                    break
                k = text.find(s, k + 1)
            if not found:
                if s in text:
                    return False, ('span %r occurs in the normalized text but '
                                   'not as whole words (ERF-52)' % s[:70])
                return False, 'span %r does not occur in the normalized text' % s[:70]
        return False, ('every span occurs individually, but not in order '
                       'without overlap (ERF-52)')
    return True, 'ok'


# ---------------------------------------------------------------------------
# 4. Narrative bindings: ERF-31, ERF-32, ERF-33
# ---------------------------------------------------------------------------

# "A comment opening `<!--` followed by `claims:` IS a narrative binding":
# recognition, deliberately looser than the grammar.
_RECOGNIZE = re.compile(r'[ \t\r\n\f\v]*claims:')

# The grammar of ERF-31, transcribed.  `ws` is undefined in the spec; read as
# whitespace (ambiguities.md, ERF-31 reading C).
_GRAMMAR = re.compile(
    r'\A<!--\s*claims:\s+'
    r'(?P<ids>[^\s"]+(?:\s+[^\s"]+)*)\s+'
    r'"(?P<anchor>(?:[^"\\]|\\"|\\\\)*)"\s+'
    r'bound-at=(?P<date>[0-9]{4}-[0-9]{2}-[0-9]{2})\s*-->\Z')


def recognize_bindings(body):
    """Return [(start, end, text, closed)] for every recognized candidate.

    A candidate is any HTML comment whose opening `<!--` is followed (after
    optional whitespace) by `claims:`.  Non-candidate comments are skipped
    whole, so a `<!--` inside another comment's text cannot start a candidate.
    """
    out = []
    i = 0
    n = len(body)
    while i < n:
        j = body.find('<!--', i)
        if j < 0:
            break
        close = body.find('-->', j + 4)
        is_cand = bool(_RECOGNIZE.match(body, j + 4))
        if is_cand:
            if close < 0:
                out.append((j, n, body[j:], False))
                i = n
            else:
                out.append((j, close + 3, body[j:close + 3], True))
                i = close + 3
        else:
            i = (close + 3) if close >= 0 else (j + 4)
    return out


def unescape_anchor(a):
    """The two escapes of ERF-31: '\\"' and '\\\\'."""
    out = []
    k = 0
    while k < len(a):
        if a[k] == '\\' and k + 1 < len(a) and a[k + 1] in '"\\':
            out.append(a[k + 1])
            k += 2
        else:
            out.append(a[k])
            k += 1
    return ''.join(out)


# ---------------------------------------------------------------------------
# 5. Timestamps
# ---------------------------------------------------------------------------

_DATE_RE = re.compile(r'\A(\d{4})-(\d{2})-(\d{2})\Z')
_INSTANT_RE = re.compile(
    r'\A(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2}):(\d{2})(\.\d+)?'
    r'([Zz]|[+-]\d{2}:\d{2})\Z')


class Stamp:
    """A parsed timestamp that remembers its precision (ERF-19, ERF-47)."""

    __slots__ = ('raw', 'kind', 'dt', 'date')

    def __init__(self, raw):
        self.raw = raw
        self.kind = 'invalid'
        self.dt = None
        self.date = None
        if not isinstance(raw, str):
            return
        m = _DATE_RE.match(raw)
        if m:
            try:
                self.date = datetime(int(m.group(1)), int(m.group(2)),
                                     int(m.group(3))).date()
                self.kind = 'date'
            except ValueError:
                pass
            return
        m = _INSTANT_RE.match(raw)
        if m:
            iso = raw.replace(' ', 'T')
            if iso[-1] in 'Zz':
                iso = iso[:-1] + '+00:00'
            try:
                self.dt = datetime.fromisoformat(iso)
                self.date = self.dt.date()
                self.kind = 'instant'
            except ValueError:
                pass

    @property
    def ok(self):
        return self.kind != 'invalid'

    def order_key(self):
        """A sort key for the standings ledger.  A bare date sorts at the
        start of its day; an invalid stamp sorts before everything."""
        if self.kind == 'instant':
            return (1, self.dt.timestamp())
        if self.kind == 'date':
            return (1, datetime(self.date.year, self.date.month,
                                self.date.day).timestamp())
        return (0, 0.0)


def strictly_later(a, b):
    """ERF-47/ERF-48 comparison.  Returns True if `a` is later than `b`,
    False if not, and None if the precisions cannot order them."""
    if not (a.ok and b.ok):
        return None
    if a.date != b.date:
        return a.date > b.date
    # Same calendar day.
    if a.kind == 'date' and b.kind == 'date':
        return False                      # equal at date precision
    if a.kind == 'instant' and b.kind == 'instant':
        return a.dt > b.dt
    return None                           # coarser one cannot order them


# ---------------------------------------------------------------------------
# 6. The string-typed field map (BINDING ERF-65)
# ---------------------------------------------------------------------------

S = 'str'


def L(inner):
    return ('list', inner)


ACTOR_STAMP = {'timestamp': S, 'by': S}
AUDIT = {'auditor': S, 'verdict': S, 'timestamp': S, 'protocol': S}

ATOM_SPEC = {
    'id': S, 'type': S, 'corpus': S, 'finding': S, 'quote': S, 'source': S,
    'source_quality': S, 'as_of_date': S, 'limitations': S,
    'created': ACTOR_STAMP, 'last_modified': ACTOR_STAMP,
    'finding_audit': L(AUDIT),
}

EVIDENCE_AT_STANCE = {'atoms_for': L(S), 'atoms_against': L(S)}
STANDING = {'timestamp': S, 'stance': S, 'by': S, 'why': S,
            'evidence_at_stance': EVIDENCE_AT_STANCE}
EDGE = {'to': S, 'relation': S}

CLAIM_SPEC = {
    'id': S, 'type': S, 'corpus': S, 'title': S, 'epistemic_kind': S,
    'created': ACTOR_STAMP, 'last_modified': ACTOR_STAMP, 'short_name': S,
    'families': L(S), 'atoms_for': L(S), 'atoms_against': L(S),
    'surveys': L(S), 'edges': L(EDGE), 'standings': L(STANDING),
    'evidence_audit': L(AUDIT), 'semantic_query': S, 'body': S,
}

SEARCH_ACT = {'tool': S, 'query': S, 'scope': S, 'hits_reported': S,
              'timestamp': S}
NOTABLE = {'what': S, 'note': S, 'atoms': L(S)}

SURVEY_SPEC = {
    'id': S, 'type': S, 'corpus': S, 'title': S, 'conducted': ACTOR_STAMP,
    'searches': L(SEARCH_ACT), 'notable_results': L(NOTABLE),
    'prior_survey': S, 'last_modified': ACTOR_STAMP, 'body': S,
}

DECL_SPEC = {'type': S, 'id': S, 'title': S, 'spec_version': S,
             'classification': S, 'owner': S}

RECEIVED = {'url': S, 'path': S, 'digest': S, 'timestamp': S}
SOURCE_SPEC = {
    'citation_text': S, 'citation': 'opaque', 'received': RECEIVED,
    'status': S, 'normalized': S, 'normalized_digest': S, 'reason': S,
    'licence': S, 'licence_name': S, 'excerpt': ACTOR_STAMP,
    'extraction': S, 'normalization': S,
}
SOURCES_SPEC = {'type': S, 'sources': 'sourcemap'}

# ERF-34 names three fields for a narrative and types `created` as an
# ActorStamp; `title` "a string", `corpus` "the id of the corpus".
NARRATIVE_SPEC = {'type': S, 'title': S, 'corpus': S, 'created': ACTOR_STAMP}

SPEC_BY_TYPE = {
    'atom': ATOM_SPEC, 'claim': CLAIM_SPEC, 'survey': SURVEY_SPEC,
    'corpus': DECL_SPEC, 'sources': SOURCES_SPEC, 'narrative': NARRATIVE_SPEC,
}


def string_paths(spec, prefix=()):
    """Every path in a spec whose value is string-typed, list indices written
    as '[]'.  Used to match the plain-scalar survey against the model."""
    out = set()
    if spec == S:
        out.add(prefix)
        return out
    if isinstance(spec, tuple) and spec[0] == 'list':
        return string_paths(spec[1], prefix + ('[]',))
    if isinstance(spec, dict):
        for k, v in spec.items():
            out |= string_paths(v, prefix + (k,))
    return out


ALL_STRING_PATHS = {}
for _t, _s in SPEC_BY_TYPE.items():
    ALL_STRING_PATHS[_t] = string_paths(_s)
# Source entries live under sources.<id>; register their string paths with a
# wildcard segment.
for _p in string_paths(SOURCE_SPEC):
    ALL_STRING_PATHS['sources'].add(('sources', '*') + _p)


# ---------------------------------------------------------------------------
# 7. File loading
# ---------------------------------------------------------------------------

_FM_RE = re.compile(r'\A---[ \t]*\n(.*?)\n---[ \t]*(?:\n|\Z)', re.S)


class LoadedFile:
    def __init__(self, path, rel):
        self.path = path
        self.rel = rel
        self.data = None
        self.body = ''
        self.has_frontmatter = False
        self.type = None
        self.plain_scalars = []      # (path_tuple, value, legacy_tag)
        self.ok = False


def walk_node(node, path, out_scalars, report, where, seen_anchor):
    """Walk a composed node tree: collect plain scalars with their paths, and
    report duplicate keys (BINDING ERF-66)."""
    if isinstance(node, yaml.ScalarNode):
        style = node.style
        if style in (None, ''):
            out_scalars.append((path, node.value, legacy_tag(node.value)))
        return
    if isinstance(node, yaml.SequenceNode):
        for child in node.value:
            walk_node(child, path + ('[]',), out_scalars, report, where,
                      seen_anchor)
        return
    if isinstance(node, yaml.MappingNode):
        keys = []
        for kn, vn in node.value:
            kname = kn.value if isinstance(kn, yaml.ScalarNode) else '?'
            if kname in keys:
                report.violation('ERF-66', where,
                                 'duplicate key %r in frontmatter' % kname)
            keys.append(kname)
            if isinstance(kn, yaml.ScalarNode) and kn.style in (None, ''):
                out_scalars.append((path + ('<key>', str(kname)), kn.value,
                                    legacy_tag(kn.value)))
            walk_node(vn, path + (str(kname),), out_scalars, report, where,
                      seen_anchor)
        return


def scan_events(text, report, where):
    """BINDING ERF-66: no anchors, aliases or explicit tags."""
    try:
        for ev in yaml.parse(text, Loader=JsonSchemaLoader):
            if isinstance(ev, yaml.events.AliasEvent):
                report.violation('ERF-66', where, 'YAML alias *%s used'
                                 % ev.anchor)
                continue
            anchor = getattr(ev, 'anchor', None)
            if anchor:
                report.violation('ERF-66', where, 'YAML anchor &%s used'
                                 % anchor)
            tag = getattr(ev, 'tag', None)
            if tag is not None:
                implicit = getattr(ev, 'implicit', None)
                if isinstance(implicit, tuple):
                    explicit = not (implicit[0] or implicit[1])
                else:
                    explicit = not implicit
                if explicit:
                    report.violation('ERF-66', where,
                                     'explicit YAML tag %s used' % tag)
    except yaml.YAMLError:
        pass          # the load below reports the parse failure


def load_file(path, rel, report):
    lf = LoadedFile(path, rel)
    raw = open(path, 'rb').read()

    # BINDING ERF-67: UTF-8, LF line endings, no BOM.
    if raw.startswith(b'\xef\xbb\xbf'):
        report.violation('ERF-67', rel, 'file begins with a UTF-8 byte-order mark')
        raw = raw[3:]
    try:
        text = raw.decode('utf-8')
    except UnicodeDecodeError:
        return lf                      # not a corpus file; caller reports
    if '\r\n' in text or '\r' in text:
        report.violation('ERF-67', rel, 'file contains CR; LF line endings required')
        text = text.replace('\r\n', '\n').replace('\r', '\n')

    m = _FM_RE.match(text)
    if m:
        fm_text, body = m.group(1), text[m.end():]
        lf.has_frontmatter = True
    else:
        fm_text, body = text, ''
    if not fm_text.strip():
        return lf

    try:
        data = yaml.load(fm_text, Loader=JsonSchemaLoader)
    except yaml.YAMLError as exc:
        if lf.has_frontmatter:
            report.violation('ERF-65', rel, 'YAML did not parse: %s'
                             % str(exc).replace('\n', ' ')[:200])
        return lf
    if not isinstance(data, dict):
        return lf
    if 'type' not in data:
        return lf

    lf.data = data
    lf.body = body
    lf.type = data.get('type')
    lf.ok = True

    scan_events(fm_text, report, rel)
    try:
        node = yaml.compose(fm_text, Loader=JsonSchemaLoader)
        if node is not None:
            walk_node(node, (), lf.plain_scalars, report, rel, set())
    except yaml.YAMLError:
        pass
    return lf


# ---------------------------------------------------------------------------
# 8. The type checks (BINDING ERF-65, SPEC ERF-55, ERF-56, ERF-72)
# ---------------------------------------------------------------------------

def check_shape(data, spec, path, rel, report, rectype):
    """Walk a loaded record against its spec: string typing (ERF-65), unknown
    fields (ERF-55/ERF-72) and present-but-empty lists (ERF-55)."""
    if not isinstance(data, dict):
        report.violation('ERF-65', rel,
                         '%s: expected a mapping, got %s'
                         % (dotted(path), type(data).__name__))
        return
    for key, val in data.items():
        if not isinstance(key, str):
            report.violation('ERF-65', rel,
                             '%s: mapping key %r arrived as %s, not a string'
                             % (dotted(path), key, type(key).__name__))
            continue
        if key.startswith('x_'):
            report.notice('ERF-72', rel, 'extension field %s present'
                          % dotted(path + (key,)))
            continue
        if key not in spec:
            report.violation('ERF-55', rel,
                             'unknown field %s on a %s (not defined by '
                             'spec_version, and not an x_ extension)'
                             % (dotted(path + (key,)), rectype))
            continue
        sub = spec[key]
        p = path + (key,)
        if sub == 'opaque':
            continue
        if sub == S:
            if not isinstance(val, str):
                report.violation(
                    'ERF-65', rel,
                    '%s is string-typed by the model but arrived as %s (%r)'
                    % (dotted(p), type(val).__name__, val))
        elif isinstance(sub, tuple) and sub[0] == 'list':
            if not isinstance(val, list):
                report.violation('ERF-65', rel,
                                 '%s is list-typed but arrived as %s'
                                 % (dotted(p), type(val).__name__))
                continue
            if not val:
                report.violation('ERF-55', rel,
                                 '%s is an empty list; empty lists MUST be '
                                 'omitted' % dotted(p))
            inner = sub[1]
            for n, item in enumerate(val):
                ip = p + ('[%d]' % n,)
                if inner == S:
                    if not isinstance(item, str):
                        report.violation(
                            'ERF-65', rel,
                            '%s is string-typed but arrived as %s (%r)'
                            % (dotted(ip), type(item).__name__, item))
                else:
                    check_shape(item, inner, ip, rel, report, rectype)
        elif isinstance(sub, dict):
            check_shape(val, sub, p, rel, report, rectype)


def dotted(path):
    out = ''
    for seg in path:
        if seg.startswith('['):
            out += seg
        else:
            out += ('.' if out else '') + seg
    return out or '<root>'


def check_legacy_retype(lf, report):
    """BINDING ERF-65's producer duty, checked as a flag: a plain scalar at a
    string-typed path that a YAML 1.1 reader would hand back as another type.
    Under the pinned JSON schema it is a string here, so this is not a
    violation -- but the binding tells producers to quote it anyway."""
    paths = ALL_STRING_PATHS.get(lf.type)
    if not paths:
        return
    for path, value, tag in lf.plain_scalars:
        if tag == _STR_TAG:
            continue
        if path and path[-2:-1] == ('<key>',):
            # a mapping key; sources keys are string-typed (ERF-65's "012")
            if lf.type == 'sources' and len(path) >= 2 and path[0] == 'sources':
                report.flag('ERF-65', lf.rel,
                            'source id %r is unquoted and a YAML 1.1 reader '
                            'resolves it as %s' % (value, tag.split(':')[-1]))
            continue
        norm = tuple('[]' if p.startswith('[') else p for p in path)
        if lf.type == 'sources' and len(norm) > 1 and norm[0] == 'sources':
            norm = ('sources', '*') + norm[2:]
        if norm in paths:
            report.flag('ERF-65', lf.rel,
                        '%s is unquoted (%r); a reader on YAML 1.1 -- which '
                        'is every common library default -- resolves it as %s'
                        % (dotted(path), value, tag.split(':')[-1]))


# ---------------------------------------------------------------------------
# 9. The corpus
# ---------------------------------------------------------------------------

VERDICTS = {'SUPPORTED', 'PARTIAL', 'UNSUPPORTED'}
STANCES = {'for', 'against', 'withdrawn'}
KINDS = {'observation', 'argument', 'bet', 'commitment'}
RELATIONS = {'supports', 'assumes', 'decomposes-into', 'conflicts-with'}
QUALITIES = {'high', 'medium', 'low'}
ABSENCE_STATUSES = {'not-redistributable', 'access-restricted',
                    'licence-unverified'}
ALL_STATUSES = ABSENCE_STATUSES | {'shipped', 'shipped-as-quotation'}
ACTOR_RE = re.compile(r'\A(human:.+|process:.+|[^/]+/[^/]+)\Z')


class Corpus:
    def __init__(self, root, report):
        self.root = os.path.abspath(root)
        self.report = report
        self.files = []
        self.declaration = None
        self.source_lists = []
        self.sources = {}
        self.source_list_dir = self.root
        self.records = {}        # id -> (type, data, rel)
        self.claims = {}
        self.atoms = {}
        self.surveys = {}
        self.narratives = []
        self.referenced_texts = set()

    # -- discovery ---------------------------------------------------------
    def load(self):
        rep = self.report
        untyped = []
        for dirpath, dirnames, filenames in os.walk(self.root):
            dirnames[:] = sorted(d for d in dirnames
                                 if d not in ('.git', '__pycache__'))
            for fn in sorted(filenames):
                if fn.startswith('.'):
                    continue
                p = os.path.join(dirpath, fn)
                rel = os.path.relpath(p, self.root)
                lf = load_file(p, rel, rep)
                if not lf.ok:
                    untyped.append(lf)
                    continue
                self.files.append(lf)

        # ERF-54 dispatch
        decls = [f for f in self.files if f.type == 'corpus']
        if not decls:
            rep.violation('ERF-59', '<corpus>',
                          'no file carries `type: corpus`: the corpus has no '
                          'declaration')
        elif len(decls) > 1:
            rep.violation('ERF-54', '<corpus>',
                          'two or more files carry `type: corpus` (%s)'
                          % ', '.join(f.rel for f in decls))
        if decls:
            self.declaration = decls[0]

        for f in self.files:
            if f.type == 'sources':
                self.source_lists.append(f)
        if not self.source_lists:
            rep.violation('ERF-3', '<corpus>', 'the corpus keeps no source list')
        for f in self.source_lists:
            d = f.data
            extra = set(d) - {'type', 'sources'}
            if extra:
                rep.violation('ERF-3', f.rel,
                              'source list top level has keys beyond `type` '
                              'and `sources`: %s' % ', '.join(sorted(extra)))
            entries = d.get('sources')
            if not isinstance(entries, dict):
                rep.violation('ERF-3', f.rel,
                              '`sources` is not a mapping of source id to entry')
                continue
            self.source_list_dir = os.path.dirname(f.path) or self.root
            for sid, entry in entries.items():
                if sid in self.sources:
                    rep.violation('ERF-3', f.rel,
                                  'source id %r listed twice' % sid)
                self.sources[str(sid)] = (entry, f.rel)

        for f in self.files:
            t = f.type
            if t in ('atom', 'claim', 'survey'):
                rid = f.data.get('id')
                if not isinstance(rid, str) or not rid:
                    rep.violation('ERF-36', f.rel, 'record carries no usable `id`')
                    continue
                if rid in self.records:
                    rep.violation('ERF-38', f.rel,
                                  'duplicate record id %r (also in %s)'
                                  % (rid, self.records[rid][2]))
                    continue
                self.records[rid] = (t, f.data, f.rel)
                {'atom': self.atoms, 'claim': self.claims,
                 'survey': self.surveys}[t][rid] = f
            elif t == 'narrative':
                self.narratives.append(f)
            elif t not in ('corpus', 'sources'):
                rep.notice('ERF-57', f.rel,
                           'unknown record type %r preserved as opaque data' % t)

        # normalized texts and raw files are named from the source list and
        # cannot themselves carry `type`; everything else untyped is reported.
        for entry, _ in self.sources.values():
            if isinstance(entry, dict):
                if isinstance(entry.get('normalized'), str):
                    self.referenced_texts.add(entry['normalized'])
                rc = entry.get('received')
                if isinstance(rc, dict) and isinstance(rc.get('path'), str):
                    self.referenced_texts.add(rc['path'])
        for lf in untyped:
            if any(lf.rel.endswith(t) or t.endswith(lf.rel)
                   for t in self.referenced_texts):
                continue
            rep.notice('ERF-54', lf.rel,
                       'file carries no `type`: not part of the corpus, ignored')

    # -- helpers -----------------------------------------------------------
    def text_for_source(self, sid):
        """Return (text, status) where status is 'ok' | 'absent' | 'unavailable'."""
        entry = self.sources.get(sid, (None, None))[0]
        if not isinstance(entry, dict):
            return None, 'absent'
        rel = entry.get('normalized')
        if not isinstance(rel, str) or not rel:
            return None, 'absent'
        for base in (self.source_list_dir, self.root):
            p = os.path.join(base, rel)
            if os.path.exists(p):
                try:
                    return open(p, 'rb').read().decode('utf-8'), 'ok'
                except UnicodeDecodeError:
                    return None, 'unavailable'
        return None, 'unavailable'

    def get_list(self, data, key):
        """ERF-56: an omitted list-typed field materializes as an empty list."""
        v = data.get(key)
        return v if isinstance(v, list) else []

    # -- per record --------------------------------------------------------
    def check_records(self):
        rep = self.report
        for f in self.files:
            spec = SPEC_BY_TYPE.get(f.type)
            if spec is not None and f.type != 'sources':
                check_shape(f.data, spec, (), f.rel, rep, f.type)
            check_legacy_retype(f, rep)
        for f in self.source_lists:
            entries = f.data.get('sources')
            if isinstance(entries, dict):
                for sid, entry in entries.items():
                    if not isinstance(sid, str):
                        rep.violation('ERF-65', f.rel,
                                      'source id %r arrived as %s, not a '
                                      'string' % (sid, type(sid).__name__))
                    check_shape(entry, SOURCE_SPEC, ('sources', str(sid)),
                                f.rel, rep, 'source')

        for rid, lf in self.atoms.items():
            self.check_atom(rid, lf)
        for rid, lf in self.claims.items():
            self.check_claim(rid, lf)
        for rid, lf in self.surveys.items():
            self.check_survey(rid, lf)
        for _, (entry, rel) in self.sources.items():
            self.check_source(entry, rel)

    def check_source(self, entry, rel):
        rep = self.report
        if not isinstance(entry, dict):
            return
        status = entry.get('status')
        if status not in ALL_STATUSES:
            rep.violation('ERF-5', rel, 'source `status` %r is outside the '
                          'closed set' % status)
        ct = entry.get('citation_text')
        if isinstance(ct, str) and re.search(r'https?://|www\.', ct):
            rep.violation('ERF-7', rel,
                          '`citation_text` contains a URL')
        # ERF-4: normalized text, or a recorded absence.
        if not entry.get('normalized'):
            if not entry.get('reason'):
                rep.violation('ERF-4', rel,
                              'source holds no normalized text and records no '
                              '`reason`; absence MUST be explicit')
            if status in ('shipped', 'shipped-as-quotation'):
                rep.violation('ERF-5', rel,
                              'status %r but no normalized text ships' % status)
        else:
            if status in ABSENCE_STATUSES:
                rep.violation('ERF-5', rel,
                              'status %r but a normalized text is named' % status)
        if entry.get('excerpt') is not None:
            ex = entry['excerpt']
            if not isinstance(ex, dict) or not ex.get('by') or not ex.get('timestamp'):
                rep.violation('ERF-69', rel,
                              '`excerpt` MUST record who selected the passage '
                              'and when')

    def check_stamp(self, data, key, rel, req='ERF-58', required=False):
        st = data.get(key)
        if st is None:
            if required:
                self.report.violation(req, rel, 'missing `%s` stamp' % key)
            return None
        if not isinstance(st, dict):
            return None
        if 'timestamp' not in st:
            self.report.violation('ERF-58', rel,
                                  '`%s` has no `timestamp` key' % key)
            return None
        s = Stamp(st.get('timestamp'))
        if not s.ok:
            self.report.violation('ERF-58', rel,
                                  '`%s.timestamp` %r is not an RFC 3339 date '
                                  'or instant' % (key, st.get('timestamp')))
        by = st.get('by')
        if isinstance(by, str) and not ACTOR_RE.match(by):
            self.report.violation('ERF-58', rel,
                                  '`%s.by` %r does not follow the actor '
                                  'convention (section 2)' % (key, by))
        return s

    def check_modified(self, data, rel):
        c = self.check_stamp(data, 'created', rel, required=True)
        if 'last_modified' in data:
            m = self.check_stamp(data, 'last_modified', rel)
            if c and m and c.ok and m.ok:
                later = strictly_later(m, c)
                if later is False:
                    self.report.violation(
                        'ERF-48', rel,
                        '`last_modified` (%s) is not later than `created` (%s)'
                        % (m.raw, c.raw))
        return c

    def check_atom(self, rid, lf):
        rep, d, rel = self.report, lf.data, lf.rel
        if lf.body.strip():
            rep.violation('ERF-53', rel,
                          "an atom's body is empty; this file has one")
        if not re.match(r'\A[a-z0-9]+(-[a-z0-9]+)*-\d+\Z', rid or ''):
            rep.flag('ERF-13', rel,
                     "atom id %r is not a mint-time prefix plus a sequence "
                     "number" % rid)
        if d.get('source_quality') not in QUALITIES:
            rep.violation('ERF-9', rel, '`source_quality` %r is outside the '
                          'closed set' % d.get('source_quality'))
        if not d.get('finding'):
            rep.violation('ERF-11', rel, 'atom has no `finding`')
        self.check_modified(d, rel)
        for n, a in enumerate(self.get_list(d, 'finding_audit')):
            if isinstance(a, dict) and a.get('verdict') not in VERDICTS:
                rep.violation('ERF-12', rel,
                              'finding_audit[%d] verdict %r is outside '
                              '{SUPPORTED, PARTIAL, UNSUPPORTED}'
                              % (n, a.get('verdict')))
        # ERF-4 + the quote check
        sid = d.get('source')
        if not isinstance(sid, str) or sid not in self.sources:
            rep.violation('ERF-4', rel,
                          'atom names source %r, which is not in the source '
                          'list' % sid)
            return
        quote = d.get('quote')
        if not isinstance(quote, str):
            rep.violation('ERF-6', rel, 'atom has no string `quote`')
            return
        if re.search(r'\[\s*\.\.\.\s*\]', quote) and '[...]' not in quote:
            rep.violation('ERF-52', rel,
                          'quote carries a bracketed ellipsis that is not the '
                          'exact marker `[...]`')
        text, status = self.text_for_source(sid)
        if status == 'absent':
            rep.notice('ERF-1', rel,
                       'quote check unavailable: source %r ships no normalized '
                       'text' % sid)
            return
        if status == 'unavailable':
            rep.notice('ERF-51', rel,
                       'quote check unavailable: the normalized text of %r is '
                       'not text or markdown, or is missing' % sid)
            return
        ok, detail = quote_check(quote, text)
        if not ok:
            rep.violation('ERF-50', rel, 'quote check failed: %s' % detail)

    def check_survey(self, rid, lf):
        rep, d, rel = self.report, lf.data, lf.rel
        if not d.get('title'):
            rep.violation('ERF-28', rel, 'survey has no `title`')
        self.check_stamp(d, 'conducted', rel, required=True)
        acts = self.get_list(d, 'searches')
        if not acts:
            rep.violation('ERF-26', rel, 'survey records no search act')
        for n, a in enumerate(acts):
            if not isinstance(a, dict):
                continue
            if not a.get('tool'):
                rep.violation('ERF-26', rel, 'searches[%d] names no `tool`' % n)
            if not a.get('query'):
                rep.violation('ERF-26', rel, 'searches[%d] names no `query`' % n)
            if not isinstance(a.get('hits_reported'), str):
                rep.violation('ERF-27', rel,
                              'searches[%d] `hits_reported` MUST be text' % n)
        if 'last_modified' in d:
            self.check_stamp(d, 'last_modified', rel)

    def check_claim(self, rid, lf):
        rep, d, rel = self.report, lf.data, lf.rel
        if not d.get('title'):
            rep.violation('ERF-18', rel, 'claim has no `title`')
        if not d.get('corpus'):
            rep.violation('ERF-17', rel, 'claim carries no `corpus`')
        kind = d.get('epistemic_kind')
        if kind not in KINDS:
            rep.violation('ERF-24', rel,
                          '`epistemic_kind` %r is outside the closed set' % kind)
        self.check_modified(d, rel)
        for key in ('atoms_for', 'atoms_against'):
            for aid in self.get_list(d, key):
                if isinstance(aid, str) and re.search(r'[/\\#]', aid):
                    rep.violation('ERF-15', rel,
                                  '%s reference %r encodes a location' % (key, aid))
        for n, e in enumerate(self.get_list(d, 'edges')):
            if not isinstance(e, dict):
                continue
            if e.get('relation') not in RELATIONS:
                rep.violation('ERF-24', rel,
                              'edges[%d] relation %r is outside the closed set'
                              % (n, e.get('relation')))
        for n, st in enumerate(self.get_list(d, 'standings')):
            if not isinstance(st, dict):
                continue
            by = st.get('by')
            if not (isinstance(by, str) and by.startswith('human:')):
                rep.violation('ERF-21', rel,
                              'standings[%d] `by` %r is not a human: actor'
                              % (n, by))
            if not (isinstance(st.get('why'), str) and st['why'].strip()):
                rep.violation('ERF-39', rel,
                              'standings[%d] has no non-empty `why`' % n)
            ts = st.get('timestamp')
            s = Stamp(ts) if isinstance(ts, str) else Stamp(None)
            if s.kind != 'instant':
                rep.violation('ERF-19', rel,
                              'standings[%d] `timestamp` %r MUST be a full RFC '
                              '3339 instant with a time and an offset'
                              % (n, ts))
            stance = st.get('stance')
            if stance not in STANCES:
                rep.violation('ERF-41', rel,
                              'standings[%d] stance %r is outside {for, '
                              'against, withdrawn}; it is a producer error and '
                              'is left out of the disposition' % (n, stance))
            eas = st.get('evidence_at_stance')
            if isinstance(eas, dict):
                for key in ('atoms_for', 'atoms_against'):
                    for aid in eas.get(key) or []:
                        if aid not in self.records:
                            rep.flag('ERF-35', rel,
                                     'standings[%d].evidence_at_stance.%s names '
                                     '%r, which resolves to nothing; a past '
                                     'state, so a flag' % (n, key, aid))

    # -- corpus-level ------------------------------------------------------
    def check_references(self):
        rep = self.report
        for rid, lf in list(self.claims.items()) + list(self.surveys.items()):
            d, rel = lf.data, lf.rel
            refs = []
            for key in ('atoms_for', 'atoms_against', 'surveys'):
                refs += [(key, x) for x in self.get_list(d, key)]
            for e in self.get_list(d, 'edges'):
                if isinstance(e, dict) and 'to' in e:
                    refs.append(('edges.to', e['to']))
            if isinstance(d.get('prior_survey'), str):
                refs.append(('prior_survey', d['prior_survey']))
            for nr in self.get_list(d, 'notable_results'):
                if isinstance(nr, dict):
                    refs += [('notable_results.atoms', a)
                             for a in (nr.get('atoms') or [])]
            for key, ref in refs:
                if not isinstance(ref, str) or ref not in self.records:
                    rep.violation('ERF-35', rel,
                                  '%s names %r, which resolves to no record'
                                  % (key, ref))

    def premise_map(self):
        """ERF-24/ERF-43: Y is a premise of X when X assumes Y, or Y supports X.
        Returns {claim_id: set(premise ids)} -- the oriented premise relation,
        X -> its premises."""
        pm = {cid: set() for cid in self.claims}
        for cid, lf in self.claims.items():
            for e in self.get_list(lf.data, 'edges'):
                if not isinstance(e, dict):
                    continue
                to, rel = e.get('to'), e.get('relation')
                if not isinstance(to, str):
                    continue
                if rel == 'assumes':
                    pm[cid].add(to)
                elif rel == 'supports' and to in pm:
                    pm[to].add(cid)
        # premises naming nothing are already ERF-35 violations; drop them so
        # the closure is over records that exist
        for cid in pm:
            pm[cid] = {p for p in pm[cid] if p in self.claims}
        return pm

    def find_cycles(self, graph):
        """Every cycle in an oriented relation, by iterative DFS with colours.

        ERF-43 authorises the thing that makes this terminate: "The closure is
        followed over distinct claims, a claim reached twice being visited
        once, so that a validator terminates on any input, conforming or not."
        """
        WHITE, GREY, BLACK = 0, 1, 2
        colour = {n: WHITE for n in graph}
        cycles = []
        seen = set()
        for root in sorted(graph):
            if colour[root] != WHITE:
                continue
            colour[root] = GREY
            path = [root]
            stack = [(root, iter(sorted(graph[root])))]
            while stack:
                node, it = stack[-1]
                nxt = next(it, None)
                if nxt is None:
                    colour[node] = BLACK
                    stack.pop()
                    path.pop()
                    continue
                if nxt not in colour:
                    continue
                if colour[nxt] == GREY:
                    cyc = path[path.index(nxt):] + [nxt]
                    canon = frozenset(cyc)
                    if canon not in seen:
                        seen.add(canon)
                        cycles.append(cyc)
                elif colour[nxt] == WHITE:
                    colour[nxt] = GREY
                    path.append(nxt)
                    stack.append((nxt, iter(sorted(graph[nxt]))))
        return cycles

    def check_graph(self):
        """SPEC ERF-43, ERF-44, ERF-49."""
        rep = self.report
        # self-edges
        for cid, lf in self.claims.items():
            for e in self.get_list(lf.data, 'edges'):
                if isinstance(e, dict) and e.get('to') == cid:
                    rep.violation('ERF-43', lf.rel,
                                  'self-edge on %r (relation %r)'
                                  % (cid, e.get('relation')))
        # ERF-44: conflicts-with stored once per pair
        conflicts = set()
        for cid, lf in self.claims.items():
            for e in self.get_list(lf.data, 'edges'):
                if isinstance(e, dict) and e.get('relation') == 'conflicts-with':
                    to = e.get('to')
                    if isinstance(to, str):
                        if (to, cid) in conflicts:
                            rep.violation('ERF-44', lf.rel,
                                          'conflicts-with stored on both %r and '
                                          '%r' % (cid, to))
                        conflicts.add((cid, to))

        pm = self.premise_map()
        for cyc in self.find_cycles(pm):
            rep.violation('ERF-43', self.claims[cyc[0]].rel,
                          'the premise relation has a cycle: %s'
                          % ' -> '.join(cyc))

        # decomposes-into cycles
        dm = {cid: set() for cid in self.claims}
        for cid, lf in self.claims.items():
            for e in self.get_list(lf.data, 'edges'):
                if (isinstance(e, dict) and e.get('relation') == 'decomposes-into'
                        and e.get('to') in dm):
                    dm[cid].add(e['to'])
        for cyc in self.find_cycles(dm):
            rep.violation('ERF-43', self.claims[cyc[0]].rel,
                          'decomposes-into has a cycle: %s' % ' -> '.join(cyc))

        dispositions = {cid: self.disposition(cid) for cid in self.claims}

        for cid, lf in self.claims.items():
            kind = lf.data.get('epistemic_kind')
            if kind != 'argument':
                continue
            # closure: what the edges reach, excluding the argument itself
            closure = set()
            frontier = list(pm.get(cid, ()))
            while frontier:
                n = frontier.pop()
                if n in closure or n == cid:
                    continue
                closure.add(n)
                frontier.extend(pm.get(n, ()))
            leaves = [n for n in sorted(closure) if not pm.get(n)]
            for leaf in leaves:
                if self.claims[leaf].data.get('epistemic_kind') == 'argument':
                    rep.violation('ERF-43', lf.rel,
                                  "argument %r's premise closure terminates in "
                                  "%r, which is itself an argument with no "
                                  "premises" % (cid, leaf))
                if dispositions.get(leaf) == 'retired':
                    rep.flag('ERF-43', lf.rel,
                             "argument %r's premise closure terminates in a "
                             "leaf %r whose disposition is retired"
                             % (cid, leaf))

        # ERF-49
        for cid, lf in self.claims.items():
            d = lf.data
            stood_on = bool(self.get_list(d, 'standings'))
            if not stood_on:
                continue
            kind = d.get('epistemic_kind')
            if kind == 'observation':
                if not self.get_list(d, 'atoms_for') and not self.get_list(d, 'surveys'):
                    rep.flag('ERF-49', lf.rel,
                             'observation %r is stood on with empty atoms_for '
                             'and empty surveys' % cid)
            elif kind == 'argument':
                if not pm.get(cid):
                    rep.flag('ERF-49', lf.rel,
                             'argument %r is stood on with no premises' % cid)

    def disposition(self, cid):
        """SPEC ERF-41."""
        d = self.claims[cid].data
        entries = [e for e in self.get_list(d, 'standings') if isinstance(e, dict)]
        # a stance outside the vocabulary is left out "as though the entry were
        # absent"
        entries = [e for e in entries if e.get('stance') in STANCES]
        if not entries:
            return 'proposal'
        newest = {}
        for e in entries:
            person = e.get('by')
            key = Stamp(e.get('timestamp')).order_key()
            if person not in newest or key >= newest[person][0]:
                newest[person] = (key, e.get('stance'))
        current = [s for _, s in newest.values() if s != 'withdrawn']
        if not current:
            return 'retired'
        if all(s == 'for' for s in current):
            return 'active'
        if all(s == 'against' for s in current):
            return 'rejected'
        return 'contested'

    # -- narratives --------------------------------------------------------
    def check_narratives(self):
        rep = self.report
        for lf in self.narratives:
            body = lf.body
            for key in ('title', 'corpus'):
                if not isinstance(lf.data.get(key), str):
                    rep.violation('ERF-34', lf.rel,
                                  'narrative frontmatter has no string `%s`' % key)
            self.check_stamp(lf.data, 'created', lf.rel, req='ERF-34',
                             required=True)
            cands = recognize_bindings(body)
            prev_end = 0
            for (start, end, text, closed) in cands:
                passage = body[prev_end:start]
                prev_start = prev_end
                # Reading chosen: a RECOGNIZED candidate closes the passage
                # above it, whether or not it matches the grammar.  See
                # ambiguities.md (ERF-31, reading A).
                prev_end = end
                if not closed:
                    rep.violation('ERF-31', lf.rel,
                                  'narrative binding at offset %d is never '
                                  'closed by `-->`; recognized, reported, not '
                                  'skipped' % start)
                    continue
                m = _GRAMMAR.match(text)
                if not m:
                    rep.violation('ERF-31', lf.rel,
                                  'narrative binding at offset %d does not '
                                  'match the grammar: %s' % (start, _oneline(text)))
                    continue
                ids = m.group('ids').split()
                anchor = unescape_anchor(m.group('anchor'))
                date = m.group('date')
                if not Stamp(date).ok:
                    rep.violation('ERF-31', lf.rel,
                                  'binding at offset %d has bound-at=%s, which '
                                  'matches the grammar but is not a calendar '
                                  'date' % (start, date))
                # ERF-33: ids resolve
                for i in ids:
                    if i not in self.records:
                        rep.violation('ERF-33', lf.rel,
                                      'narrative binding names %r, which '
                                      'resolves to no record' % i)
                    elif i not in self.claims:
                        rep.violation('ERF-33', lf.rel,
                                      'narrative binding names %r, which is a '
                                      '%s, not a claim'
                                      % (i, self.records[i][0]))
                # ERF-31: the anchor occurs in its passage, under ERF-51
                folded_anchor = erf51_fold(anchor)
                folded_passage = erf51_fold(passage)
                if not folded_anchor:
                    rep.flag('ERF-31', lf.rel,
                             'binding at offset %d has an empty anchor; the '
                             'grammar admits it and it can never fail' % start)
                elif folded_anchor not in folded_passage:
                    rep.flag('ERF-31', lf.rel,
                             'anchor %r of the binding at offset %d does not '
                             'occur in its passage (passage is offsets %d-%d, '
                             '%d characters after the ERF-51 fold)'
                             % (_oneline(anchor), start, prev_start, start,
                                len(folded_passage)))
                # ERF-32: staleness
                b = Stamp(date)
                for i in ids:
                    if i not in self.claims:
                        continue
                    lm = self.claims[i].data.get('last_modified')
                    if not isinstance(lm, dict):
                        continue
                    m2 = Stamp(lm.get('timestamp'))
                    later = strictly_later(m2, b)
                    if later is True:
                        rep.flag('ERF-32', lf.rel,
                                 'binding is stale: claim %r was modified %s, '
                                 'later than bound-at=%s'
                                 % (i, m2.raw, date))
                    elif later is None:
                        rep.flag('ERF-32', lf.rel,
                                 'binding staleness against %r is '
                                 'indeterminate (%s vs bound-at=%s); a check '
                                 'that cannot tell says look'
                                 % (i, m2.raw, date))

    def check_declaration(self):
        rep = self.report
        if not self.declaration:
            return
        d = self.declaration.data
        for key in ('type', 'id', 'title', 'spec_version'):
            if not isinstance(d.get(key), str) or not d[key]:
                rep.violation('ERF-59', self.declaration.rel,
                              'declaration has no string `%s`' % key)
        sv = d.get('spec_version')
        if isinstance(sv, str) and not re.match(
                r'\A\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?\Z', sv):
            rep.violation('ERF-61', self.declaration.rel,
                          '`spec_version` %r is not Semantic Versioning 2.0.0'
                          % sv)
        cid = d.get('id')
        for lf in self.files:
            if lf.type in ('atom', 'claim', 'survey'):
                if lf.data.get('corpus') != cid:
                    rep.violation('ERF-17', lf.rel,
                                  'record `corpus` %r does not name the '
                                  'declared corpus %r'
                                  % (lf.data.get('corpus'), cid))

    def report_unperformed(self):
        """Section 1's Validator class binds 'every machine-checkable MUST that
        applies to the input it accepts'.  Say plainly what this tool does not
        check, rather than letting silence read as a pass."""
        r = self.report
        for req, what in [
            ('ERF-40', 'standings append-only, which needs the substrate history'),
            ('ERF-2', 'raw-file immutability, which needs prior versions'),
            ('ERF-8', 'citation_text rendered from citation, which needs a CSL processor'),
            ('ERF-69', 'excerpt fidelity, which needs the raw file'),
            ('ERF-70', 'extraction-tool determinism, which is not machine-checkable'),
            ('ERF-71', 'received.digest against retrieved bytes, which needs the network'),
            ('ERF-36', 'id uniqueness across the deployment; only this corpus was given'),
        ]:
            r.notice(req, '<validator>', 'NOT CHECKED: ' + what)


def _oneline(s, n=90):
    s = ' '.join(s.split())
    return s if len(s) <= n else s[:n] + '...'


# ---------------------------------------------------------------------------
# 10. main
# ---------------------------------------------------------------------------

def validate(root):
    report = Report()
    corpus = Corpus(root, report)
    corpus.load()
    corpus.check_records()
    corpus.check_references()
    corpus.check_graph()
    corpus.check_narratives()
    corpus.check_declaration()
    return report, corpus


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[1])
    ap.add_argument('corpus', help='the corpus directory')
    ap.add_argument('--json', action='store_true', help='machine-readable output')
    ap.add_argument('--quiet', action='store_true', help='violations only')
    ap.add_argument('--show-unperformed', action='store_true',
                    help='list the checks this validator does not perform')
    ap.add_argument('--dispositions', action='store_true',
                    help='print each claim\'s computed disposition (ERF-41)')
    args = ap.parse_args(argv)

    if not os.path.isdir(args.corpus):
        sys.stderr.write('not a directory: %s\n' % args.corpus)
        return 2

    report, corpus = validate(args.corpus)
    if args.show_unperformed:
        corpus.report_unperformed()

    items = report.sorted_items()
    if args.quiet:
        items = [i for i in items if i['severity'] == VIOLATION]

    if args.json:
        print(json.dumps({
            'corpus': os.path.abspath(args.corpus),
            'counts': report.counts(),
            'dispositions': {c: corpus.disposition(c) for c in corpus.claims},
            'findings': items,
        }, indent=2, sort_keys=True))
    else:
        for i in items:
            print('%-9s %-8s %-40s %s' % (i['severity'].upper(),
                                          i['requirement'], i['where'],
                                          i['message']))
        if args.dispositions:
            print()
            for c in sorted(corpus.claims):
                print('disposition  %-45s %s' % (c, corpus.disposition(c)))
        c = report.counts()
        print()
        print('%d violation(s), %d flag(s), %d notice(s)'
              % (c[VIOLATION], c[FLAG], c[NOTICE]))
    return 1 if report.counts()[VIOLATION] else 0


if __name__ == '__main__':
    raise SystemExit(main())
