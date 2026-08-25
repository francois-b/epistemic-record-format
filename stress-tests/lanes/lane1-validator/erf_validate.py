#!/usr/bin/env python3
"""ERF validator — built cold from SPEC.md (v0.9.0 draft) alone.

Usage: python3 erf_validate.py <corpus-directory> [--quiet-info]

Output: one finding per line:
    LEVEL [REQ] record-or-file :: field :: message

LEVEL is one of:
    VIOLATION   — a machine-checkable MUST is broken (non-conformance)
    FLAG        — the spec says flag/report, not reject (staleness, unbacked,
                  retired leaves, indeterminate bindings, opaque content)
    UNAVAILABLE — a check the validator must report as unavailable rather
                  than pass or fail (quote check without a held text capture)
    INFO        — orientation output, not a conformance statement

REQ is an ERF-N requirement id, or one of the pseudo-ids for unnumbered
normative text (see README.md): S2.ACTOR (section 2 actor convention),
S3.DM (section 3 data model shape), S5.VOCAB (section 5 closed sets).

Exit code: 1 if any VIOLATION was found, else 0.
"""

import os
import re
import sys
import unicodedata
from datetime import datetime, timezone

try:
    import yaml
except ImportError:
    sys.stderr.write("erf_validate: requires PyYAML (pip install pyyaml)\n")
    sys.exit(3)

# ---------------------------------------------------------------------------
# YAML loading under the YAML 1.2 JSON schema (ERF-65) with ERF-66 checks
# ---------------------------------------------------------------------------

class ErfYamlError(Exception):
    pass


class ErfLoader(yaml.SafeLoader):
    """SafeLoader with implicit resolvers replaced by the JSON schema:
    only null, true/false, and JSON's number grammar resolve to
    non-string scalars; everything else stays a string (ERF-65)."""

    def __init__(self, stream):
        super().__init__(stream)
        self.erf_dup_keys = []  # (key, mark) pairs

    def construct_mapping(self, node, deep=False):
        if not isinstance(node, yaml.MappingNode):
            raise yaml.constructor.ConstructorError(
                None, None, "expected a mapping node", node.start_mark)
        mapping = {}
        for key_node, value_node in node.value:
            key = self.construct_object(key_node, deep=True)
            if not isinstance(key, str):
                key = str(key)
            if key in mapping:
                self.erf_dup_keys.append((key, key_node.start_mark.line + 1))
            mapping[key] = self.construct_object(value_node, deep=deep)
        return mapping


# Wipe the YAML 1.1 core-schema resolvers (timestamps, yes/no, octal, sexagesimal...)
ErfLoader.yaml_implicit_resolvers = {}
ErfLoader.add_implicit_resolver(
    'tag:yaml.org,2002:null', re.compile(r'^null$'), ['n'])
ErfLoader.add_implicit_resolver(
    'tag:yaml.org,2002:bool', re.compile(r'^(?:true|false)$'), ['t', 'f'])
ErfLoader.add_implicit_resolver(
    'tag:yaml.org,2002:int',
    re.compile(r'^-?(?:0|[1-9][0-9]*)$'), list('-0123456789'))
ErfLoader.add_implicit_resolver(
    'tag:yaml.org,2002:float',
    re.compile(r'^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+(?:[eE][-+]?[0-9]+)?|[eE][-+]?[0-9]+)$'),
    list('-0123456789'))


def yaml_structure_issues(text):
    """Scan raw YAML for anchors, aliases, and explicit tags (ERF-66).
    Returns list of (what, line)."""
    issues = []
    try:
        for ev in yaml.parse(text, Loader=yaml.SafeLoader):
            if isinstance(ev, yaml.AliasEvent):
                issues.append(("alias", ev.start_mark.line + 1))
            else:
                anchor = getattr(ev, 'anchor', None)
                if anchor is not None:
                    issues.append(("anchor", ev.start_mark.line + 1))
                tag = getattr(ev, 'tag', None)
                if tag is not None and not isinstance(ev, yaml.DocumentStartEvent):
                    issues.append(("explicit tag", ev.start_mark.line + 1))
    except yaml.YAMLError:
        pass  # the load pass reports the parse error itself
    return issues


def load_yaml_documents(text):
    """Load all documents of a YAML stream under the JSON schema.
    Returns (docs, dup_keys, error)."""
    loader = ErfLoader(text)
    docs, dups, err = [], [], None
    try:
        while loader.check_data():
            docs.append(loader.get_data())
    except yaml.YAMLError as e:
        err = str(e).replace("\n", " ")
    finally:
        dups = loader.erf_dup_keys
        try:
            loader.dispose()
        except Exception:
            pass
    return docs, dups, err


# ---------------------------------------------------------------------------
# Timestamps
# ---------------------------------------------------------------------------

DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
INSTANT_RE = re.compile(
    r'^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:\d{2})$')


def ts_kind(v):
    if not isinstance(v, str):
        return None
    if DATE_RE.match(v):
        return "date"
    if INSTANT_RE.match(v):
        return "instant"
    return None


def ts_date(v):
    return v[:10]


def ts_epoch(v):
    try:
        return datetime.fromisoformat(v.replace('z', 'Z').replace('Z', '+00:00')).timestamp()
    except ValueError:
        return None


def compare_check_vs_change(check, change):
    """ERF-47: return 'stale' or 'current' comparing a check stamp against
    the last-change stamp of what it judged. Mixed precision on the same
    day resolves to stale; two equal bare dates read as current."""
    ck, cg = ts_kind(check), ts_kind(change)
    if ck is None or cg is None:
        return "stale"  # a check that cannot tell says look, never rest
    if ck == "instant" and cg == "instant":
        return "stale" if ts_epoch(check) < ts_epoch(change) else "current"
    d_check, d_change = ts_date(check), ts_date(change)
    if d_check != d_change:
        return "stale" if d_check < d_change else "current"
    if ck == "date" and cg == "date":
        return "current"
    return "stale"  # mixed precision, same day: cannot order


def last_modified_orders_after_created(lm, created):
    """ERF-48: last_modified must be later than created; at date precision
    'later' admits the same day. Returns True when the ordering holds."""
    lk, ck = ts_kind(lm), ts_kind(created)
    if lk is None or ck is None:
        return True  # format errors are reported separately
    if lk == "instant" and ck == "instant":
        return ts_epoch(lm) > ts_epoch(created)
    d_lm, d_cr = ts_date(lm), ts_date(created)
    if d_lm == d_cr:
        return True  # a bare date cannot order within one day
    return d_lm > d_cr


# ---------------------------------------------------------------------------
# Actor convention (section 2, unnumbered MUST)
# ---------------------------------------------------------------------------

def actor_ok(v):
    if not isinstance(v, str) or not v:
        return False
    if v.startswith("human:"):
        return len(v) > len("human:")
    if v.startswith("process:"):
        return len(v) > len("process:")
    if "/" in v:
        head, _, tail = v.partition("/")
        return bool(head) and bool(tail)
    return False


# ---------------------------------------------------------------------------
# Quote-check normalization (ERF-51), unwrapping steps first, then 1-11
# ---------------------------------------------------------------------------

def normalize(text):
    t = text
    # a. Markdown link syntax reduces to its link text.
    t = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', t)
    # b. Attribute blobs in braces are removed.
    t = re.sub(r'\{[^}]*\}', '', t)
    # c. Parenthesized link targets removed: absolute, protocol-relative,
    #    root-relative, fragment-only.
    t = re.sub(r'\((?:[A-Za-z][A-Za-z0-9+.-]*://|//|/|#)[^\s)]*\)', '', t)
    # d. Blockquote markers at line start, with one following space if present.
    t = re.sub(r'(?m)^(?:> ?)+', '', t)
    # e. Square brackets and the symbols (straight quotes NOT removed here).
    t = re.sub(r'[\[\]®™©^\\]', '', t)
    # f. A space before , . ; : ! ? is removed.
    t = re.sub(r'\s+(?=[,.;:!?])', '', t)
    # 1. Unicode NFKC.
    t = unicodedata.normalize('NFKC', t)
    # 2. Remove soft hyphens.
    t = t.replace('­', '')
    # 3. Fold typographic single quotes.
    t = re.sub(r'[‘’‛]', "'", t)
    # 4. Fold typographic double quotes.
    t = re.sub(r'[“”‟]', '"', t)
    # 5. Remove straight double quotes (after step 4).
    t = t.replace('"', '')
    # 6. Fold dash variants.
    t = re.sub(r'[‐-―−]', '-', t)
    # 7. Join words broken across lines.
    t = re.sub(r'-\n[ \t]*', '', t)
    # 8. Collapse runs of two or more hyphens.
    t = re.sub(r'--+', '-', t)
    # 9. Remove emphasis and code markers.
    t = re.sub(r'[*_`]', '', t)
    # 10. Unify dash spacing.
    t = re.sub(r'\s*-\s*', '-', t)
    # 11. Collapse whitespace runs, then trim. Case is NOT folded.
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def quote_spans(quote):
    """ERF-52: split on the exact marker [...] BEFORE normalization."""
    return quote.split('[...]')


def quote_occurs(quote, capture_text):
    """Returns (ok, detail). Spans matched in order, without overlap."""
    spans = quote_spans(quote)
    norm_spans = [normalize(s) for s in spans]
    if all(s == '' for s in norm_spans):
        return False, "all spans empty after normalization (must fail, not trivially pass)"
    ncap = normalize(capture_text)
    pos = 0
    for i, s in enumerate(norm_spans):
        if s == '':
            continue
        idx = ncap.find(s, pos)
        if idx < 0:
            return False, "span %d not found in normalized capture: %r" % (
                i + 1, s if len(s) < 80 else s[:77] + '...')
        pos = idx + len(s)
    return True, ""


# ---------------------------------------------------------------------------
# Findings
# ---------------------------------------------------------------------------

class Report:
    def __init__(self):
        self.findings = []  # (level, req, where, field, message)

    def add(self, level, req, where, field, message):
        self.findings.append((level, req, where, field, message))

    def violation(self, req, where, field, message):
        self.add("VIOLATION", req, where, field, message)

    def flag(self, req, where, field, message):
        self.add("FLAG", req, where, field, message)

    def unavailable(self, req, where, field, message):
        self.add("UNAVAILABLE", req, where, field, message)

    def info(self, req, where, field, message):
        self.add("INFO", req, where, field, message)


# ---------------------------------------------------------------------------
# File-level checks (ERF-67, ERF-53)
# ---------------------------------------------------------------------------

def read_text_file(path, rep, rel):
    """Byte-level checks + decode. Returns text or None."""
    with open(path, 'rb') as f:
        raw = f.read()
    if raw.startswith(b'\xef\xbb\xbf'):
        rep.violation("ERF-67", rel, "(file)", "file carries a byte-order mark")
        raw = raw[3:]
    if b'\r' in raw:
        rep.violation("ERF-67", rel, "(file)",
                      "file contains CR bytes; line endings must be LF")
        raw = raw.replace(b'\r\n', b'\n').replace(b'\r', b'\n')
    try:
        return raw.decode('utf-8', errors='strict')
    except UnicodeDecodeError as e:
        rep.violation("ERF-67", rel, "(file)", "file is not valid UTF-8: %s" % e)
        return raw.decode('utf-8', errors='replace')


def split_frontmatter(text):
    """Returns (frontmatter_text, body, ok). ok=False when no frontmatter
    block delimited by --- lines was found."""
    if not text.startswith('---\n'):
        return None, text, False
    m = re.search(r'\n---[ \t]*(?:\n|$)', text[4:])
    if not m:
        return None, text, False
    fm = text[4:4 + m.start()]
    body = text[4 + m.end():]
    return fm, body, True


# ---------------------------------------------------------------------------
# Shape validation
# ---------------------------------------------------------------------------

STANCES = {"for", "against", "withdrawn"}
VERDICTS = {"SUPPORTED", "PARTIAL", "UNSUPPORTED"}
KINDS = {"observation", "argument", "bet", "commitment"}
RELATIONS = {"supports", "assumes", "decomposes-into", "conflicts-with"}
QUALITIES = {"high", "medium", "low"}
SOURCE_STATUSES = {"shipped", "shipped-as-quotation", "not-redistributable",
                   "access-restricted", "licence-unverified"}
ABSENCE_STATUSES = {"not-redistributable", "access-restricted", "licence-unverified"}

ATOM_ID_RE = re.compile(r'^\S+-\d+$')  # mint-time prefix plus sequence number
URL_IN_TEXT_RE = re.compile(r'(?:[A-Za-z][A-Za-z0-9+.-]*://|\bwww\.)')


def is_ext_field(key):
    return isinstance(key, str) and key.startswith('x_')


def check_unknown_keys(rep, where, mapping, allowed, req="ERF-55", ctx=""):
    for k in mapping:
        if k not in allowed and not is_ext_field(k):
            rep.violation(req, where, (ctx + k) if ctx else k,
                          "unknown field not defined by the declared spec_version "
                          "(extension fields use the x_ prefix, ERF-72)")


def req_str(rep, where, mapping, key, req, ctx="", nonempty=True):
    v = mapping.get(key)
    if not isinstance(v, str) or (nonempty and not v.strip()):
        rep.violation(req, where, ctx + key,
                      "required string field missing, empty, or not a string "
                      "(got %s)" % type(v).__name__)
        return None
    return v


def check_stamp(rep, where, v, field, req="S3.DM"):
    """ActorStamp: {timestamp, by}. Bare date or full RFC 3339 instant."""
    if not isinstance(v, dict):
        rep.violation(req, where, field, "ActorStamp must be a mapping "
                      "{timestamp, by} (got %s)" % type(v).__name__)
        return
    check_unknown_keys(rep, where, v, {"timestamp", "by"}, ctx=field + ".")
    ts = v.get("timestamp")
    if ts_kind(ts) is None:
        rep.violation("ERF-58" if "timestamp" not in v else "S3.DM", where,
                      field + ".timestamp",
                      "timestamp missing or not a bare date / RFC 3339 instant: %r" % (ts,))
    by = v.get("by")
    if not actor_ok(by):
        rep.violation("S2.ACTOR", where, field + ".by",
                      "actor id must be human:<id>, <producer>/<version>, "
                      "or process:<id>: %r" % (by,))


def check_audit_list(rep, where, v, field):
    if not isinstance(v, list):
        rep.violation("S3.DM", where, field, "must be a list of audit entries")
        return
    if v == []:
        rep.violation("ERF-55", where, field, "empty list must be omitted")
        return
    for i, e in enumerate(v):
        ctx = "%s[%d]." % (field, i)
        if not isinstance(e, dict):
            rep.violation("S3.DM", where, ctx[:-1], "audit entry must be a mapping")
            continue
        check_unknown_keys(rep, where, e,
                           {"auditor", "verdict", "timestamp", "protocol"}, ctx=ctx)
        req_str(rep, where, e, "auditor", "ERF-11", ctx=ctx)
        req_str(rep, where, e, "protocol", "ERF-11", ctx=ctx)
        verdict = e.get("verdict")
        if verdict not in VERDICTS:
            rep.violation("ERF-12", where, ctx + "verdict",
                          "verdict must be exactly one of SUPPORTED, PARTIAL, "
                          "UNSUPPORTED: %r" % (verdict,))
        if ts_kind(e.get("timestamp")) is None:
            rep.violation("S3.DM", where, ctx + "timestamp",
                          "audit timestamp missing or malformed: %r" % (e.get("timestamp"),))


def check_id_list(rep, where, v, field, req="S3.DM"):
    ids = []
    if not isinstance(v, list):
        rep.violation(req, where, field, "must be a list of ids")
        return ids
    if v == []:
        rep.violation("ERF-55", where, field, "empty list must be omitted")
        return ids
    for i, x in enumerate(v):
        if not isinstance(x, str) or not x:
            rep.violation(req, where, "%s[%d]" % (field, i),
                          "reference must be a bare id string: %r" % (x,))
            continue
        if '/' in x or '\\' in x or x.startswith('.'):
            rep.violation("ERF-15", where, "%s[%d]" % (field, i),
                          "reference must be a bare id and must not encode "
                          "location: %r" % (x,))
        ids.append(x)
    return ids


class Record:
    def __init__(self, rtype, data, body, path, rel):
        self.rtype = rtype
        self.data = data
        self.body = body
        self.path = path
        self.rel = rel
        self.id = data.get("id") if isinstance(data.get("id"), str) else None
        self.corpus = data.get("corpus")

    @property
    def where(self):
        return "%s:%s" % (self.rtype, self.id) if self.id else self.rel

    def effective_change(self):
        lm = self.data.get("last_modified")
        if isinstance(lm, dict) and ts_kind(lm.get("timestamp")):
            return lm["timestamp"]
        cr = self.data.get("created") or self.data.get("conducted")
        if isinstance(cr, dict) and ts_kind(cr.get("timestamp")):
            return cr["timestamp"]
        return None


# ---------------------------------------------------------------------------
# The validator
# ---------------------------------------------------------------------------

class Validator:
    def __init__(self, root):
        self.root = os.path.abspath(root)
        self.rep = Report()
        self.declarations = {}   # corpus id -> (decl dict, file rel)
        self.decl_dirs = {}      # corpus id -> directory holding declaration
        self.sources = {}        # corpus id -> {source id -> (entry, listdir, rel)}
        self.records = []        # Record
        self.registry = {}       # record id -> Record
        self.narratives = []     # (rel, path, text, fm, has_fm)
        self.capture_paths = set()

    def rel(self, path):
        return os.path.relpath(path, self.root)

    # -- discovery ----------------------------------------------------------

    def run(self):
        yaml_files, md_files = [], []
        for dirpath, dirnames, filenames in os.walk(self.root):
            dirnames[:] = [d for d in dirnames if not d.startswith('.')]
            for fn in sorted(filenames):
                if fn.startswith('.'):
                    continue
                p = os.path.join(dirpath, fn)
                if fn.endswith(('.yaml', '.yml')):
                    yaml_files.append(p)
                elif fn.endswith(('.md', '.markdown')):
                    md_files.append(p)

        source_list_docs = []  # (mapping, path)
        for p in yaml_files:
            self.scan_yaml_file(p, source_list_docs)

        if not self.declarations:
            self.rep.violation("ERF-59", self.rel(self.root), "(corpus)",
                               "no corpus declaration found (a YAML document "
                               "with id, title, spec_version)")

        for doc, p in source_list_docs:
            self.attach_source_list(doc, p)

        for cid in self.declarations:
            if cid not in self.sources:
                self.sources[cid] = {}

        self.validate_source_lists()

        # capture paths are excluded from record/narrative scanning
        for cid, entries in self.sources.items():
            for sid, (entry, listdir, _rel) in entries.items():
                path = entry.get("path")
                if isinstance(path, str):
                    self.capture_paths.add(
                        os.path.normpath(os.path.join(listdir, path)))

        for p in md_files:
            if os.path.normpath(p) in self.capture_paths:
                continue
            self.scan_md_file(p)

        self.check_registry()
        for r in self.records:
            if r.rtype == "atom":
                self.check_atom(r)
            elif r.rtype == "claim":
                self.check_claim(r)
            elif r.rtype == "survey":
                self.check_survey(r)
        self.check_cross_record()
        self.check_graph()
        self.run_quote_checks()
        self.check_narratives()
        return self.rep

    def scan_yaml_file(self, path, source_list_docs):
        rel = self.rel(path)
        text = read_text_file(path, self.rep, rel)
        if text is None:
            return
        for what, line in yaml_structure_issues(text):
            self.rep.violation("ERF-66", rel, "(yaml)",
                               "%s at line %d (duplicate keys, anchors, aliases, "
                               "explicit tags are all forbidden)" % (what, line))
        docs, dups, err = load_yaml_documents(text)
        for key, line in dups:
            self.rep.violation("ERF-66", rel, key,
                               "duplicate key at line %d" % line)
        if err:
            self.rep.violation("ERF-65", rel, "(yaml)",
                               "does not parse as YAML: %s" % err)
            return
        for doc in docs:
            if not isinstance(doc, dict):
                continue
            if "spec_version" in doc or ("id" in doc and "title" in doc
                                         and "sources" not in doc):
                self.take_declaration(doc, path, rel)
                # a declaration file MAY also inline its source list
                if "sources" in doc:
                    source_list_docs.append((doc, path))
            elif "sources" in doc:
                source_list_docs.append((doc, path))
            else:
                self.rep.info("ERF-57", rel, "(yaml)",
                              "unrecognized YAML document (neither declaration "
                              "nor source list); preserved as opaque")

    def take_declaration(self, doc, path, rel):
        allowed = {"id", "title", "spec_version", "classification", "owner",
                   "sources"}
        # 'sources' tolerated so one file can hold declaration + source list;
        # every other unknown key is a producer error.
        check_unknown_keys(self.rep, rel, doc, allowed)
        cid = req_str(self.rep, rel, doc, "id", "ERF-59")
        req_str(self.rep, rel, doc, "title", "ERF-59")
        sv = req_str(self.rep, rel, doc, "spec_version", "ERF-59")
        if sv is not None:
            if not re.match(r'^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)'
                            r'(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$', sv):
                self.rep.violation("ERF-61", rel, "spec_version",
                                   "not Semantic Versioning 2.0.0: %r" % sv)
            elif not sv.startswith("0."):
                self.rep.violation("ERF-60", rel, "spec_version",
                                   "unsupported MAJOR version %s: this validator "
                                   "implements 0.x; refusing to certify (validated "
                                   "best-effort, results advisory)" % sv)
        owner = doc.get("owner")
        if owner is not None and not actor_ok(owner):
            self.rep.violation("S2.ACTOR", rel, "owner",
                               "owner must be an actor id: %r" % (owner,))
        if cid:
            if cid in self.declarations:
                self.rep.violation("ERF-59", rel, "id",
                                   "corpus %r declared more than once "
                                   "(also in %s)" % (cid, self.declarations[cid][1]))
            else:
                self.declarations[cid] = (doc, rel)
                self.decl_dirs[cid] = os.path.dirname(path)

    def attach_source_list(self, doc, path):
        rel = self.rel(path)
        srcs = doc.get("sources")
        if not isinstance(srcs, dict):
            self.rep.violation("ERF-3", rel, "sources",
                               "source list must be a mapping of source id to entry")
            return
        # associate with a corpus: nearest declaration directory at or above
        listdir = os.path.dirname(path)
        owner_cid = None
        if doc.get("id") in self.declarations:
            owner_cid = doc["id"]
        else:
            best = None
            for cid, d in self.decl_dirs.items():
                if os.path.commonpath([d, listdir]) == d:
                    if best is None or len(d) > len(self.decl_dirs[best]):
                        best = cid
            owner_cid = best
        if owner_cid is None and len(self.declarations) == 1:
            owner_cid = next(iter(self.declarations))
        if owner_cid is None:
            self.rep.violation("ERF-3", rel, "sources",
                               "cannot associate source list with any declared corpus")
            return
        bucket = self.sources.setdefault(owner_cid, {})
        for sid, entry in srcs.items():
            if sid in bucket:
                self.rep.violation("ERF-3", rel, "sources.%s" % sid,
                                   "source id %r not unique within corpus %r "
                                   "(also in %s)" % (sid, owner_cid, bucket[sid][2]))
                continue
            bucket[sid] = (entry, listdir, rel)

    # -- source list --------------------------------------------------------

    def validate_source_lists(self):
        allowed = {"citation_text", "citation", "fetched", "status", "path",
                   "reason", "licence", "licence_name", "excerpt", "converter"}
        for cid, entries in self.sources.items():
            for sid, (entry, listdir, rel) in entries.items():
                where = "source:%s" % sid
                if not isinstance(entry, dict):
                    self.rep.violation("ERF-3", rel, where,
                                       "source entry must follow the Source shape")
                    continue
                check_unknown_keys(self.rep, where, entry, allowed)
                ct = req_str(self.rep, where, entry, "citation_text", "ERF-3")
                if ct and URL_IN_TEXT_RE.search(ct):
                    self.rep.violation("ERF-7", where, "citation_text",
                                       "citation_text must not contain a URL "
                                       "(a citation identifies a work; the locator "
                                       "is fetched.url)")
                status = entry.get("status")
                if status not in SOURCE_STATUSES:
                    self.rep.violation("ERF-5", where, "status",
                                       "status must be one of %s: %r" %
                                       (sorted(SOURCE_STATUSES), status))
                path = entry.get("path")
                reason = entry.get("reason")
                if status in ("shipped", "shipped-as-quotation"):
                    if not isinstance(path, str) or not path:
                        self.rep.violation("ERF-4", where, "path",
                                           "a shipped source must give its capture's path")
                elif status in ABSENCE_STATUSES:
                    if not isinstance(reason, str) or not reason.strip():
                        self.rep.violation("ERF-5", where, "reason",
                                           "a source recording an absence must carry a "
                                           "human-readable reason")
                    if path is not None:
                        self.rep.violation("ERF-5", where, "path",
                                           "status %r records an absence but a capture "
                                           "path is given" % status)
                if path is None and reason is None and status not in SOURCE_STATUSES:
                    self.rep.violation("ERF-4", where, "path",
                                       "every source must either give its capture's "
                                       "path or record that no capture is held and why")
                fetched = entry.get("fetched")
                if fetched is not None:
                    if not isinstance(fetched, dict):
                        self.rep.violation("S3.DM", where, "fetched",
                                           "fetched must be a mapping {url, digest?}")
                    else:
                        check_unknown_keys(self.rep, where, fetched,
                                           {"url", "digest"}, ctx="fetched.")
                        req_str(self.rep, where, fetched, "url", "ERF-7",
                                ctx="fetched.")
                        digest = fetched.get("digest")
                        if digest is not None and (
                                not isinstance(digest, str)
                                or not re.match(r'^sha256:[0-9a-f]{64}$', digest)):
                            self.rep.violation("ERF-71", where, "fetched.digest",
                                               "digest must name its algorithm as "
                                               "\"sha256:<hex>\": %r" % (digest,))
                conv = entry.get("converter")
                if conv is not None:
                    if not isinstance(conv, dict):
                        self.rep.violation("ERF-70", where, "converter",
                                           "converter must be a mapping "
                                           "{tool, deterministic}")
                    else:
                        check_unknown_keys(self.rep, where, conv,
                                           {"tool", "deterministic"}, ctx="converter.")
                        req_str(self.rep, where, conv, "tool", "ERF-70",
                                ctx="converter.")
                        det = conv.get("deterministic")
                        if not isinstance(det, bool):
                            self.rep.violation("ERF-70", where,
                                               "converter.deterministic",
                                               "must be true or false: %r" % (det,))
                        elif det is False:
                            self.rep.flag("ERF-70", where,
                                          "converter.deterministic",
                                          "non-deterministic converter declared: this "
                                          "source's checks are reproducible by no one "
                                          "but their author")
                exc = entry.get("excerpt")
                if exc is not None and not isinstance(exc, bool):
                    self.rep.violation("ERF-69", where, "excerpt",
                                       "excerpt must be true or false: %r" % (exc,))
                cit = entry.get("citation")
                if cit is not None and not isinstance(cit, dict):
                    self.rep.violation("ERF-8", where, "citation",
                                       "citation, when present, is a CSL mapping")
                lic = entry.get("licence")
                if lic is not None and not isinstance(lic, str):
                    self.rep.violation("ERF-68", where, "licence",
                                       "licence must be an SPDX identifier string")

    # -- records ------------------------------------------------------------

    def scan_md_file(self, path):
        rel = self.rel(path)
        text = read_text_file(path, self.rep, rel)
        if text is None:
            return
        fm_text, body, has_fm = split_frontmatter(text)
        has_binding = '<!--' in text and re.search(r'<!--\s*claims:', text)
        if not has_fm:
            if has_binding:
                self.narratives.append((rel, path, text, {}, False))
            return  # not a record, not binding-bearing: out of scope
        for what, line in yaml_structure_issues(fm_text):
            self.rep.violation("ERF-66", rel, "(frontmatter)",
                               "%s at line %d" % (what, line))
        docs, dups, err = load_yaml_documents(fm_text)
        for key, line in dups:
            self.rep.violation("ERF-66", rel, key,
                               "duplicate key at line %d" % line)
        if err:
            self.rep.violation("ERF-65", rel, "(frontmatter)",
                               "frontmatter does not parse: %s" % err)
            return
        data = docs[0] if docs else None
        if not isinstance(data, dict):
            self.rep.violation("ERF-53", rel, "(frontmatter)",
                               "frontmatter must be a YAML mapping")
            return
        rtype = data.get("type")
        if rtype in ("atom", "claim", "survey"):
            self.records.append(Record(rtype, data, body, path, rel))
        elif rtype is None:
            if has_binding:
                self.narratives.append((rel, path, text, data, True))
            elif "id" in data and "corpus" in data:
                self.rep.violation("ERF-54", rel, "type",
                                   "record-shaped file does not self-describe: "
                                   "no type field")
            # else: an ordinary document; out of scope
        else:
            self.rep.flag("ERF-57", rel, "type",
                          "unknown record type %r: preserved as opaque data, "
                          "not validated" % (rtype,))

    def check_registry(self):
        for r in self.records:
            if r.id is None:
                self.rep.violation("S3.DM", r.rel, "id",
                                   "record has no usable id")
                continue
            if r.id in self.registry:
                other = self.registry[r.id]
                self.rep.violation("ERF-38", r.where, "id",
                                   "duplicate record id across the deployment "
                                   "(ERF-36): also %s in %s" % (other.rtype, other.rel))
            else:
                self.registry[r.id] = r

    def check_common(self, r, allowed):
        check_unknown_keys(self.rep, r.where, r.data, allowed)
        rid = r.data.get("id")
        if not isinstance(rid, str) or not rid:
            pass  # reported in check_registry
        elif '/' in rid or '\\' in rid:
            self.rep.violation("ERF-15", r.where, "id",
                               "id must not encode location: %r" % rid)
        if not isinstance(r.corpus, str) or not r.corpus:
            self.rep.violation("ERF-54", r.where, "corpus",
                               "every record must carry corpus")
        elif self.declarations and r.corpus not in self.declarations:
            if r.rtype == "atom":
                self.rep.flag("ERF-17", r.where, "corpus",
                              "corpus %r is not declared in this deployment "
                              "(ERF-17 states the rule for claims; applied to "
                              "atoms as a flag)" % r.corpus)
            else:
                self.rep.violation("ERF-17", r.where, "corpus",
                                   "corpus must name a declared corpus (ERF-59): "
                                   "%r" % r.corpus)
        stamp_key = "conducted" if r.rtype == "survey" else "created"
        if stamp_key not in r.data:
            self.rep.violation("S3.DM", r.where, stamp_key,
                               "required ActorStamp missing")
        else:
            check_stamp(self.rep, r.where, r.data[stamp_key], stamp_key)
        lm = r.data.get("last_modified")
        if lm is not None:
            check_stamp(self.rep, r.where, lm, "last_modified")
            cr = r.data.get(stamp_key)
            if (isinstance(lm, dict) and isinstance(cr, dict)
                    and ts_kind(lm.get("timestamp")) and ts_kind(cr.get("timestamp"))
                    and not last_modified_orders_after_created(
                        lm["timestamp"], cr["timestamp"])):
                self.rep.violation("ERF-48", r.where, "last_modified.timestamp",
                                   "last_modified (%s) is not later than %s (%s)"
                                   % (lm["timestamp"], stamp_key, cr["timestamp"]))

    def check_atom(self, r):
        allowed = {"id", "type", "corpus", "finding", "quote", "source",
                   "source_quality", "as_of_date", "limitations", "created",
                   "last_modified", "finding_audit"}
        self.check_common(r, allowed)
        if r.body.strip():
            self.rep.violation("ERF-53", r.where, "(body)",
                               "an atom's body is empty; its file is frontmatter "
                               "and nothing else")
        if r.id and not ATOM_ID_RE.match(r.id):
            self.rep.violation("ERF-13", r.where, "id",
                               "atom id must be a mint-time prefix plus a sequence "
                               "number (e.g. kwg-117): %r" % r.id)
        req_str(self.rep, r.where, r.data, "finding", "S3.DM")
        req_str(self.rep, r.where, r.data, "quote", "ERF-6")
        req_str(self.rep, r.where, r.data, "source", "ERF-4")
        q = r.data.get("source_quality")
        if q not in QUALITIES:
            self.rep.violation("ERF-9", r.where, "source_quality",
                               "must be one of high, medium, low: %r" % (q,))
        aod = r.data.get("as_of_date")
        if aod is not None and ts_kind(aod) is None:
            self.rep.violation("ERF-14", r.where, "as_of_date",
                               "as_of_date must be a date: %r" % (aod,))
        lim = r.data.get("limitations")
        if lim is not None and not isinstance(lim, str):
            self.rep.violation("S3.DM", r.where, "limitations", "must be a string")
        fa = r.data.get("finding_audit")
        if fa is not None:
            check_audit_list(self.rep, r.where, fa, "finding_audit")
            self.audit_staleness(r, fa, "finding_audit")
        # ERF-4: source id resolves in the atom's corpus's source list
        src = r.data.get("source")
        if isinstance(src, str) and src:
            cid = r.corpus if r.corpus in self.sources else None
            if cid is None:
                if len(self.sources) == 1:
                    cid = next(iter(self.sources))
            if cid is None:
                pass  # corpus problem already reported
            elif not self.sources[cid]:
                self.rep.violation("ERF-3", r.where, "source",
                                   "corpus %r has no source list to resolve %r "
                                   "against" % (r.corpus, src))
            elif src not in self.sources[cid]:
                self.rep.violation("ERF-4", r.where, "source",
                                   "source id %r not in the source list of corpus "
                                   "%r" % (src, cid))

    def audit_staleness(self, r, entries, field):
        change = r.effective_change()
        if change is None or r.data.get("last_modified") is None:
            return  # never edited since minting: nothing to be stale against
        for i, e in enumerate(entries):
            if not isinstance(e, dict):
                continue
            ts = e.get("timestamp")
            if ts_kind(ts) is None:
                continue
            if compare_check_vs_change(ts, change) == "stale":
                self.rep.flag("ERF-47", r.where, "%s[%d]" % (field, i),
                              "audit (%s) is older than the record's last change "
                              "(%s): stale" % (ts, change))

    def check_claim(self, r):
        allowed = {"id", "type", "corpus", "title", "epistemic_kind", "created",
                   "last_modified", "short_name", "families", "atoms_for",
                   "atoms_against", "surveys", "edges", "standings",
                   "evidence_audit", "semantic_query"}
        self.check_common(r, allowed)
        req_str(self.rep, r.where, r.data, "title", "ERF-18")
        kind = r.data.get("epistemic_kind")
        if kind not in KINDS:
            self.rep.violation("S5.VOCAB", r.where, "epistemic_kind",
                               "must be one of %s: %r" % (sorted(KINDS), kind))
        for f in ("state", "status", "disposition"):
            if f in r.data:
                self.rep.violation("ERF-22", r.where, f,
                                   "a claim must not store a state field; the "
                                   "disposition is computed (ERF-41)")
        for f in ("short_name", "semantic_query"):
            v = r.data.get(f)
            if v is not None and not isinstance(v, str):
                self.rep.violation("S3.DM", r.where, f, "must be a string")
        fam = r.data.get("families")
        if fam is not None:
            check_id_list(self.rep, r.where, fam, "families")
        for f in ("atoms_for", "atoms_against", "surveys"):
            v = r.data.get(f)
            if v is not None:
                check_id_list(self.rep, r.where, v, f)
        edges = r.data.get("edges")
        if edges is not None:
            self.check_edges(r, edges)
        st = r.data.get("standings")
        if st is not None:
            self.check_standings(r, st)
        ea = r.data.get("evidence_audit")
        if ea is not None:
            check_audit_list(self.rep, r.where, ea, "evidence_audit")
            self.audit_staleness(r, ea, "evidence_audit")
            if kind in ("bet", "commitment") and isinstance(ea, list) and ea:
                self.rep.flag("ERF-24", r.where, "evidence_audit",
                              "a %s owes no backing, so it has nothing to audit; "
                              "evidence_audit entries recorded anyway" % kind)

    def check_edges(self, r, edges):
        if not isinstance(edges, list):
            self.rep.violation("S3.DM", r.where, "edges", "must be a list")
            return
        if edges == []:
            self.rep.violation("ERF-55", r.where, "edges",
                               "empty list must be omitted")
            return
        for i, e in enumerate(edges):
            ctx = "edges[%d]" % i
            if not isinstance(e, dict):
                self.rep.violation("S3.DM", r.where, ctx,
                                   "edge must be a mapping {to, relation}")
                continue
            check_unknown_keys(self.rep, r.where, e, {"to", "relation"},
                               ctx=ctx + ".")
            to = e.get("to")
            if not isinstance(to, str) or not to:
                self.rep.violation("S3.DM", r.where, ctx + ".to",
                                   "edge target must be a claim id")
            relv = e.get("relation")
            if relv not in RELATIONS:
                self.rep.violation("S5.VOCAB", r.where, ctx + ".relation",
                                   "must be one of %s: %r"
                                   % (sorted(RELATIONS), relv))
            if isinstance(to, str) and r.id and to == r.id:
                self.rep.violation("ERF-43", r.where, ctx,
                                   "self-edges must not exist")

    def check_standings(self, r, st):
        if not isinstance(st, list):
            self.rep.violation("S3.DM", r.where, "standings", "must be a list")
            return
        if st == []:
            self.rep.violation("ERF-55", r.where, "standings",
                               "empty list must be omitted")
            return
        for i, e in enumerate(st):
            ctx = "standings[%d]" % i
            if not isinstance(e, dict):
                self.rep.violation("S3.DM", r.where, ctx,
                                   "standing entry must be a mapping")
                continue
            check_unknown_keys(self.rep, r.where, e,
                               {"timestamp", "stance", "by", "why",
                                "evidence_at_stance"}, ctx=ctx + ".")
            ts = e.get("timestamp")
            if ts_kind(ts) != "instant":
                self.rep.violation("ERF-19", r.where, ctx + ".timestamp",
                                   "a standing timestamp must be a full RFC 3339 "
                                   "instant with time and offset, never a bare "
                                   "date: %r" % (ts,))
            stance = e.get("stance")
            if stance not in STANCES:
                self.rep.violation("S5.VOCAB", r.where, ctx + ".stance",
                                   "must be one of %s: %r"
                                   % (sorted(STANCES), stance))
            by = e.get("by")
            if not (isinstance(by, str) and by.startswith("human:")
                    and len(by) > 6):
                self.rep.violation("ERF-21", r.where, ctx + ".by",
                                   "a standing's by must be a human: actor "
                                   "(ERF-39): %r" % (by,))
            why = e.get("why")
            if not isinstance(why, str) or not why.strip():
                self.rep.violation("ERF-39", r.where, ctx + ".why",
                                   "a standing entry must carry a non-empty why "
                                   "(ERF-19): an entry without a reason is a "
                                   "toggle, not a judgment")
            eas = e.get("evidence_at_stance")
            if eas is not None:
                if not isinstance(eas, dict):
                    self.rep.violation("ERF-20", r.where,
                                       ctx + ".evidence_at_stance",
                                       "must be {atoms_for: [ids], "
                                       "atoms_against: [ids]}")
                else:
                    for k in eas:
                        if k not in ("atoms_for", "atoms_against"):
                            self.rep.violation("ERF-20", r.where,
                                               ctx + ".evidence_at_stance." + k,
                                               "only the id lists belong here; "
                                               "drift is derived, never stored")
                    for k in ("atoms_for", "atoms_against"):
                        v = eas.get(k)
                        if v is None:
                            continue
                        if isinstance(v, int):
                            self.rep.violation("ERF-20", r.where,
                                               "%s.evidence_at_stance.%s" % (ctx, k),
                                               "counts are not an acceptable digest; "
                                               "record the ids")
                        elif isinstance(v, list):
                            for j, x in enumerate(v):
                                if not isinstance(x, str):
                                    self.rep.violation(
                                        "ERF-20", r.where,
                                        "%s.evidence_at_stance.%s[%d]" % (ctx, k, j),
                                        "must be an atom id, not %r" % (x,))
                                elif x not in self.registry:
                                    # deferred: registry filled before cross checks
                                    pass
                        else:
                            self.rep.violation("ERF-20", r.where,
                                               "%s.evidence_at_stance.%s" % (ctx, k),
                                               "must be a list of atom ids")

    def check_survey(self, r):
        allowed = {"id", "type", "corpus", "title", "conducted", "searches",
                   "notable_results", "prior_survey", "last_modified"}
        self.check_common(r, allowed)
        req_str(self.rep, r.where, r.data, "title", "ERF-28")
        searches = r.data.get("searches")
        if searches is None:
            pass  # an omitted list means none (ERF-56)
        elif not isinstance(searches, list):
            self.rep.violation("S3.DM", r.where, "searches", "must be a list")
        elif searches == []:
            self.rep.violation("ERF-55", r.where, "searches",
                               "empty list must be omitted")
        else:
            for i, act in enumerate(searches):
                ctx = "searches[%d]" % i
                if not isinstance(act, dict):
                    self.rep.violation("S3.DM", r.where, ctx,
                                       "search act must be a mapping")
                    continue
                check_unknown_keys(self.rep, r.where, act,
                                   {"tool", "query", "scope", "hits_reported",
                                    "timestamp"}, ctx=ctx + ".")
                req_str(self.rep, r.where, act, "tool", "ERF-26", ctx=ctx + ".")
                req_str(self.rep, r.where, act, "query", "ERF-26", ctx=ctx + ".")
                hits = act.get("hits_reported")
                if not isinstance(hits, str) or not hits.strip():
                    self.rep.violation("ERF-27", r.where, ctx + ".hits_reported",
                                       "yield must be recorded as text, as the "
                                       "instrument reported it: %r" % (hits,))
                sc = act.get("scope")
                if sc is not None and not isinstance(sc, str):
                    self.rep.violation("ERF-26", r.where, ctx + ".scope",
                                       "scope must be a string")
                ats = act.get("timestamp")
                if ats is not None and ts_kind(ats) is None:
                    self.rep.violation("ERF-28", r.where, ctx + ".timestamp",
                                       "act timestamp malformed: %r" % (ats,))
        nr = r.data.get("notable_results")
        if nr is None:
            pass
        elif not isinstance(nr, list):
            self.rep.violation("S3.DM", r.where, "notable_results",
                               "must be a list")
        elif nr == []:
            self.rep.violation("ERF-55", r.where, "notable_results",
                               "empty list must be omitted")
        else:
            for i, e in enumerate(nr):
                ctx = "notable_results[%d]" % i
                if not isinstance(e, dict):
                    self.rep.violation("S3.DM", r.where, ctx,
                                       "entry must be a mapping {what, note, atoms?}")
                    continue
                check_unknown_keys(self.rep, r.where, e,
                                   {"what", "note", "atoms"}, ctx=ctx + ".")
                req_str(self.rep, r.where, e, "what", "ERF-27", ctx=ctx + ".")
                req_str(self.rep, r.where, e, "note", "ERF-27", ctx=ctx + ".")
                atoms = e.get("atoms")
                if atoms is not None:
                    check_id_list(self.rep, r.where, atoms, ctx + ".atoms")
        ps = r.data.get("prior_survey")
        if ps is not None and (not isinstance(ps, str) or not ps):
            self.rep.violation("S3.DM", r.where, "prior_survey",
                               "must be a survey id string")

    # -- cross-record invariants -------------------------------------------

    def resolve(self, rid):
        return self.registry.get(rid)

    def check_cross_record(self):
        for r in self.records:
            if r.rtype == "claim":
                for f in ("atoms_for", "atoms_against"):
                    for i, x in enumerate(r.data.get(f) or []):
                        if not isinstance(x, str):
                            continue
                        t = self.resolve(x)
                        if t is None:
                            self.rep.violation("ERF-35", r.where,
                                               "%s[%d]" % (f, i),
                                               "reference %r resolves to no record "
                                               "in the deployment" % x)
                        elif t.rtype != "atom":
                            self.rep.violation("ERF-35", r.where,
                                               "%s[%d]" % (f, i),
                                               "%r resolves to a %s, not an atom"
                                               % (x, t.rtype))
                for i, x in enumerate(r.data.get("surveys") or []):
                    if not isinstance(x, str):
                        continue
                    t = self.resolve(x)
                    if t is None:
                        self.rep.violation("ERF-35", r.where, "surveys[%d]" % i,
                                           "reference %r resolves to no record" % x)
                    elif t.rtype != "survey":
                        self.rep.violation("ERF-35", r.where, "surveys[%d]" % i,
                                           "%r resolves to a %s, not a survey"
                                           % (x, t.rtype))
                for i, e in enumerate(r.data.get("edges") or []):
                    if not isinstance(e, dict):
                        continue
                    to = e.get("to")
                    if not isinstance(to, str) or not to:
                        continue
                    t = self.resolve(to)
                    if t is None:
                        self.rep.violation("ERF-35", r.where, "edges[%d].to" % i,
                                           "edge target %r resolves to no record" % to)
                    elif t.rtype != "claim":
                        self.rep.violation("ERF-35", r.where, "edges[%d].to" % i,
                                           "edges are claim-to-claim only; %r is a %s"
                                           % (to, t.rtype))
                for i, e in enumerate(r.data.get("standings") or []):
                    if not isinstance(e, dict):
                        continue
                    eas = e.get("evidence_at_stance")
                    if isinstance(eas, dict):
                        for k in ("atoms_for", "atoms_against"):
                            v_ = eas.get(k)
                            if not isinstance(v_, list):
                                continue
                            for j, x in enumerate(v_):
                                if isinstance(x, str) and x not in self.registry:
                                    self.rep.flag(
                                        "ERF-35", r.where,
                                        "standings[%d].evidence_at_stance.%s[%d]"
                                        % (i, k, j),
                                        "id %r resolves to no record (flag: "
                                        "evidence_at_stance is not among ERF-35's "
                                        "enumerated fields)" % x)
            elif r.rtype == "survey":
                ps = r.data.get("prior_survey")
                if isinstance(ps, str) and ps and ps not in self.registry:
                    self.rep.flag("ERF-35", r.where, "prior_survey",
                                  "prior_survey %r resolves to no record (flag: "
                                  "not among ERF-35's enumerated fields)" % ps)
                for i, e in enumerate(r.data.get("notable_results") or []):
                    if isinstance(e, dict):
                        for j, x in enumerate(e.get("atoms") or []):
                            if isinstance(x, str) and x not in self.registry:
                                self.rep.flag("ERF-35", r.where,
                                              "notable_results[%d].atoms[%d]" % (i, j),
                                              "atom id %r resolves to no record "
                                              "(flag: not among ERF-35's enumerated "
                                              "fields)" % x)

    # -- dispositions and the graph ----------------------------------------

    def disposition(self, claim):
        """ERF-41: computed from each person's newest entry."""
        st = [e for e in (claim.data.get("standings") or [])
              if isinstance(e, dict) and e.get("stance") in STANCES]
        if not st:
            return "proposal"
        newest = {}
        for idx, e in enumerate(st):
            by = e.get("by")
            key = by if isinstance(by, str) else "?%d" % idx
            prev = newest.get(key)
            if prev is None:
                newest[key] = e
            else:
                t_new, t_old = e.get("timestamp"), prev.get("timestamp")
                en, eo = (ts_epoch(t_new) if ts_kind(t_new) == "instant" else None,
                          ts_epoch(t_old) if ts_kind(t_old) == "instant" else None)
                if en is None or eo is None or en >= eo:
                    newest[key] = e  # file order breaks ties / bad stamps
        current = [e["stance"] for e in newest.values()]
        remaining = [s for s in current if s != "withdrawn"]
        if not remaining:
            return "retired"
        if all(s == "for" for s in remaining):
            return "active"
        if all(s == "against" for s in remaining):
            return "rejected"
        return "contested"

    def check_graph(self):
        claims = {r.id: r for r in self.records
                  if r.rtype == "claim" and r.id}
        # conflicts-with stored once per pair (ERF-44)
        conflict_dirs = {}
        for r in claims.values():
            for e in (r.data.get("edges") or []):
                if isinstance(e, dict) and e.get("relation") == "conflicts-with":
                    to = e.get("to")
                    if isinstance(to, str):
                        conflict_dirs.setdefault(frozenset((r.id, to)), set()).add(r.id)
        for pair, holders in conflict_dirs.items():
            if len(holders) > 1:
                a, b = sorted(pair)
                self.rep.violation("ERF-44", "claim:%s" % a, "edges",
                                   "conflicts-with between %r and %r is stored on "
                                   "both claims; store once, derive the reciprocal"
                                   % (a, b))

        # acyclicity of assumes + decomposes-into (ERF-43)
        dep = {cid: [] for cid in claims}
        for r in claims.values():
            for e in (r.data.get("edges") or []):
                if (isinstance(e, dict)
                        and e.get("relation") in ("assumes", "decomposes-into")
                        and isinstance(e.get("to"), str) and e["to"] in claims
                        and e["to"] != r.id):
                    dep[r.id].append(e["to"])
        for cyc in find_cycles(dep):
            self.rep.violation("ERF-43", "claim:%s" % cyc[0], "edges",
                               "assumes/decomposes-into admit no cycles: "
                               + " -> ".join(cyc + [cyc[0]]))

        # premise graph: outgoing assumes + incoming supports (ERF-24)
        premises = {cid: set() for cid in claims}
        for r in claims.values():
            for e in (r.data.get("edges") or []):
                if not isinstance(e, dict):
                    continue
                to = e.get("to")
                if not (isinstance(to, str) and to in claims):
                    continue
                if e.get("relation") == "assumes":
                    premises[r.id].add(to)
                elif e.get("relation") == "supports":
                    premises[to].add(r.id)

        dispositions = {cid: self.disposition(r) for cid, r in claims.items()}

        for cid, r in claims.items():
            if r.data.get("epistemic_kind") != "argument":
                continue
            # walk the premise closure; only arguments continue the chain
            seen, stack, leaves, cyclic = set(), [(cid, ())], set(), False
            while stack:
                node, path = stack.pop()
                for p in premises.get(node, ()):
                    if p in path or p == cid:
                        cyclic = True
                        continue
                    if claims[p].data.get("epistemic_kind") == "argument":
                        if premises.get(p):
                            if p not in seen:
                                seen.add(p)
                                stack.append((p, path + (node,)))
                        else:
                            leaves.add(p)  # an argument leaf
                    else:
                        leaves.add(p)
                    seen.add(p)
            if cyclic:
                self.rep.violation("ERF-43", r.where, "edges",
                                   "premise closure does not terminate: cycle "
                                   "through the argument's premises")
            for leaf in sorted(leaves):
                if claims[leaf].data.get("epistemic_kind") == "argument":
                    self.rep.violation("ERF-43", r.where, "edges",
                                       "premise closure terminates in an argument "
                                       "leaf (%r has no premises of its own); it "
                                       "must terminate in non-argument leaves" % leaf)
                elif dispositions.get(leaf) == "retired":
                    self.rep.flag("ERF-43", r.where, "edges",
                                  "premise closure terminates in a leaf whose "
                                  "disposition is retired: %r" % leaf)

        # ERF-49: unbacked flags, for claims someone currently stands on
        for cid, r in claims.items():
            st = r.data.get("standings") or []
            newest_for = False
            # someone stands on it: at least one current stance is 'for'
            newest = {}
            for idx, e in enumerate(st):
                if not isinstance(e, dict):
                    continue
                by = e.get("by") if isinstance(e.get("by"), str) else "?%d" % idx
                prev = newest.get(by)
                if prev is None:
                    newest[by] = e
                else:
                    tn, to_ = e.get("timestamp"), prev.get("timestamp")
                    en = ts_epoch(tn) if ts_kind(tn) == "instant" else None
                    eo = ts_epoch(to_) if ts_kind(to_) == "instant" else None
                    if en is None or eo is None or en >= eo:
                        newest[by] = e
            newest_for = any(e.get("stance") == "for" for e in newest.values())
            if not newest_for:
                continue
            kind = r.data.get("epistemic_kind")
            if kind == "observation":
                if not (r.data.get("atoms_for") or r.data.get("surveys")):
                    self.rep.flag("ERF-49", r.where, "atoms_for",
                                  "unbacked: an observation someone stands on "
                                  "with empty atoms_for and empty surveys")
            elif kind == "argument":
                if not premises.get(cid):
                    self.rep.flag("ERF-49", r.where, "edges",
                                  "unbacked: an argument someone stands on with "
                                  "no premises (no outgoing assumes edge, no "
                                  "incoming supports edge)")

    # -- quote checks -------------------------------------------------------

    def run_quote_checks(self):
        TEXT_EXT = ('.md', '.markdown', '.txt')
        for r in self.records:
            if r.rtype != "atom":
                continue
            quote = r.data.get("quote")
            src = r.data.get("source")
            if not isinstance(quote, str) or not quote or not isinstance(src, str):
                continue
            cid = r.corpus if r.corpus in self.sources else (
                next(iter(self.sources)) if len(self.sources) == 1 else None)
            entry = None
            if cid and src in self.sources.get(cid, {}):
                entry, listdir, _rel = self.sources[cid][src]
            if entry is None or not isinstance(entry, dict):
                continue  # resolution failure already reported (ERF-4)
            path = entry.get("path")
            if not isinstance(path, str) or not path:
                self.rep.unavailable("ERF-51", r.where, "quote",
                                     "quote check unavailable: source %r holds no "
                                     "capture (status %r)"
                                     % (src, entry.get("status")))
                continue
            cap = os.path.normpath(os.path.join(listdir, path))
            if not os.path.isfile(cap):
                self.rep.unavailable("ERF-51", r.where, "quote",
                                     "quote check unavailable: capture %r not held "
                                     "in this copy of the corpus" % path)
                continue
            if not cap.endswith(TEXT_EXT):
                self.rep.unavailable("ERF-51", r.where, "quote",
                                     "quote check unavailable: capture %r is not "
                                     "text or markdown; a validator never converts"
                                     % path)
                continue
            with open(cap, 'rb') as f:
                cap_text = f.read().decode('utf-8', errors='replace')
            ok, detail = quote_occurs(quote, cap_text)
            if not ok:
                if "all spans empty" in detail:
                    self.rep.violation("ERF-52", r.where, "quote", detail)
                else:
                    self.rep.violation("ERF-6", r.where, "quote",
                                       "quote is not verbatim from the capture "
                                       "(normalized per ERF-51): " + detail)

    # -- narratives ---------------------------------------------------------

    BINDING_RE = re.compile(r'<!--(.*?)-->', re.S)
    BINDING_BODY_RE = re.compile(
        r'^\s*claims:\s+((?:[^\s"]+\s+)*[^\s"]+)\s+"([^"]*)"'
        r'(?:\s+bound-at=(\d{4}-\d{2}-\d{2}))?\s*$')

    def check_narratives(self):
        for rel, path, text, fm, has_fm in self.narratives:
            where = "narrative:%s" % rel
            if not has_fm:
                self.rep.violation("ERF-34", where, "(frontmatter)",
                                   "a narrative carries frontmatter with title, "
                                   "corpus, and created; none found")
            else:
                for k in ("title", "corpus", "created"):
                    if k not in fm:
                        self.rep.violation("ERF-34", where, k,
                                           "narrative frontmatter must carry %r" % k)
                if "created" in fm:
                    check_stamp(self.rep, where, fm["created"], "created")
                c = fm.get("corpus")
                if (isinstance(c, str) and self.declarations
                        and c not in self.declarations):
                    self.rep.flag("ERF-34", where, "corpus",
                                  "narrative names corpus %r, which is not "
                                  "declared in this deployment" % c)
            for m in self.BINDING_RE.finditer(text):
                inner = m.group(1)
                if not re.match(r'\s*claims:', inner):
                    continue
                bm = self.BINDING_BODY_RE.match(inner)
                if not bm:
                    self.rep.violation("ERF-31", where, "(binding)",
                                       "marker does not match the narrative-binding "
                                       "grammar: %r" % inner.strip()[:100])
                    continue
                ids = bm.group(1).split()
                anchor = bm.group(2)
                bound_at = bm.group(3)
                if not anchor:
                    self.rep.violation("ERF-31", where, "(binding)",
                                       "the anchor is REQUIRED and must be a "
                                       "verbatim substring of the passage")
                elif anchor not in text[:m.start()]:
                    self.rep.violation("ERF-31", where, "(binding)",
                                       "anchor %r is not a verbatim substring of "
                                       "the passage preceding the marker" % anchor)
                for rid in ids:
                    t = self.resolve(rid)
                    if t is None:
                        self.rep.violation("ERF-33", where, "(binding)",
                                           "binding names %r, which resolves to no "
                                           "record; never drop or invent" % rid)
                        continue
                    if t.rtype != "claim":
                        self.rep.flag("ERF-31", where, "(binding)",
                                      "binding names %r, a %s, where the grammar "
                                      "names claims" % (rid, t.rtype))
                        continue
                    if bound_at is None:
                        continue  # handled below, once per binding
                    lm = t.data.get("last_modified")
                    if isinstance(lm, dict) and ts_kind(lm.get("timestamp")):
                        if compare_check_vs_change(
                                bound_at, lm["timestamp"]) == "stale":
                            self.rep.flag("ERF-32", where, "(binding)",
                                          "stale: claim %r was modified (%s) after "
                                          "bound-at (%s)"
                                          % (rid, lm["timestamp"], bound_at))
                if bound_at is None:
                    self.rep.violation("ERF-32", where, "(binding)",
                                       "binding lacks bound-at; staleness is "
                                       "indeterminate, never current (ids: %s)"
                                       % " ".join(ids))


def find_cycles(graph):
    """Return a list of cycles (each a list of nodes) in a dict adjacency."""
    cycles, seen = [], set()
    state = {}  # 0 unvisited implicit, 1 in-stack, 2 done

    def dfs(n, path):
        state[n] = 1
        path.append(n)
        for m in graph.get(n, ()):
            if state.get(m) == 1:
                cyc = tuple(path[path.index(m):])
                key = frozenset(cyc)
                if key not in seen:
                    seen.add(key)
                    cycles.append(list(cyc))
            elif state.get(m) != 2:
                dfs(m, path)
        path.pop()
        state[n] = 2

    for n in graph:
        if state.get(n) != 2:
            dfs(n, [])
    return cycles


# ---------------------------------------------------------------------------

def main(argv):
    args = [a for a in argv[1:] if not a.startswith('--')]
    quiet_info = '--quiet-info' in argv
    if len(args) != 1:
        sys.stderr.write(__doc__)
        return 2
    root = args[0]
    if not os.path.isdir(root):
        sys.stderr.write("erf_validate: not a directory: %s\n" % root)
        return 2
    v = Validator(root)
    rep = v.run()
    order = {"VIOLATION": 0, "FLAG": 1, "UNAVAILABLE": 2, "INFO": 3}
    counts = {}
    for level, req, where, field, msg in sorted(
            rep.findings, key=lambda f: (order[f[0]], f[2], f[1])):
        counts[level] = counts.get(level, 0) + 1
        if quiet_info and level == "INFO":
            continue
        print("%s [%s] %s :: %s :: %s" % (level, req, where, field, msg))
    n_rec = len(v.records)
    print("-- %d record(s), %d corpus declaration(s), %d narrative(s); "
          "%d violation(s), %d flag(s), %d unavailable, %d info"
          % (n_rec, len(v.declarations), len(v.narratives),
             counts.get("VIOLATION", 0), counts.get("FLAG", 0),
             counts.get("UNAVAILABLE", 0), counts.get("INFO", 0)))
    return 1 if counts.get("VIOLATION") else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
