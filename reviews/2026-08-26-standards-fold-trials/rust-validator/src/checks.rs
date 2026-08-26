//! Every machine-checkable requirement, in requirement order within its group.
//! Each function quotes the sentence it enforces so the reading is auditable.

use std::collections::{BTreeMap, BTreeSet};
use std::path::PathBuf;

use serde_json::Value;
use sha2::{Digest, Sha256};

use crate::corpus::{FileDoc, Index, Loaded};
use crate::model::*;
use crate::nbinding;
use crate::norm::{self, FoldMode, QuoteVerdict};
use crate::report::{Kind, Layer, Report};
use crate::schema::{self, Schemas};

/// `ERF-60`: "A validator therefore reads `spec_version` before anything else
/// and sets its strictness by it."
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Strictness {
    /// A version this validator knows: an unknown record type or field is a
    /// producer error (`ERF-55`).
    Known,
    /// A MINOR newer than this validator knows: the same content is expected,
    /// MUST be preserved and reported, and MUST NOT count as a violation.
    NewerMinor,
}

pub const SUPPORTED_MAJOR: u64 = 0;
pub const SUPPORTED_MINOR: u64 = 9;

pub struct CorpusCtx {
    pub root: PathBuf,
    pub label: String,
    pub loaded: Loaded,
    pub index: Index,
    pub decl_ids: Vec<String>,
    pub strictness: Strictness,
    /// Folded normalized text per source id, and whether it was available.
    pub texts: BTreeMap<String, Result<String, String>>,
}

pub struct Deployment {
    pub corpora: Vec<CorpusCtx>,
    pub mode: FoldMode,
}

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------

fn s(v: Option<&Value>) -> Option<&str> {
    v.and_then(|x| x.as_str())
}

fn walk_keys(v: &Value, path: &str, out: &mut Vec<(String, String)>) {
    match v {
        Value::Object(m) => {
            for (k, sub) in m {
                let p = format!("{path}/{k}");
                out.push((p.clone(), k.clone()));
                walk_keys(sub, &p, out);
            }
        }
        Value::Array(a) => {
            for (i, sub) in a.iter().enumerate() {
                walk_keys(sub, &format!("{path}/{i}"), out);
            }
        }
        _ => {}
    }
}

fn walk_arrays(v: &Value, path: &str, out: &mut Vec<(String, usize)>) {
    match v {
        Value::Object(m) => {
            for (k, sub) in m {
                walk_arrays(sub, &format!("{path}/{k}"), out);
            }
        }
        Value::Array(a) => {
            out.push((path.to_string(), a.len()));
            for (i, sub) in a.iter().enumerate() {
                walk_arrays(sub, &format!("{path}/{i}"), out);
            }
        }
        _ => {}
    }
}

/// `ERF-15`: "References MUST be bare ids and MUST NOT encode location."
fn encodes_location(id: &str) -> bool {
    id.contains("://")
        || id.contains('/')
        || id.contains('\\')
        || id.starts_with('.')
        || id.ends_with(".md")
        || id.ends_with(".markdown")
        || id.ends_with(".yaml")
        || id.ends_with(".yml")
        || id.ends_with(".json")
        || id.starts_with('#')
}

/// A deliberately small slice of the SPDX License List. `ERF-68` leans on SPDX
/// and SPDX governs its own ground; this tool holds no copy of the list and
/// makes no network call, so membership below is a hint and its absence is a
/// flag, never a violation. The full check is named UNPERFORMED.
const SPDX_SUBSET: &[&str] = &[
    "CC0-1.0", "CC-BY-4.0", "CC-BY-SA-4.0", "CC-BY-NC-4.0", "CC-BY-ND-4.0",
    "CC-BY-3.0", "CC-BY-SA-3.0", "MIT", "Apache-2.0", "BSD-2-Clause",
    "BSD-3-Clause", "GPL-2.0-only", "GPL-3.0-only", "GPL-3.0-or-later",
    "LGPL-2.1-only", "LGPL-3.0-only", "MPL-2.0", "ISC", "Unlicense",
    "OGL-UK-3.0", "PDDL-1.0", "ODbL-1.0", "AGPL-3.0-only", "Zlib",
];

/// The instant or date inside an `ActorStamp`-shaped field (`ERF-58`: the
/// event-time key is always `timestamp`).
fn stamp_at(front: &Value, key: &str) -> Option<Stamp> {
    Stamp::parse(front.get(key)?.get("timestamp")?.as_str()?).ok()
}

/// The last change to a record: `last_modified` where it exists, else the
/// minting stamp (`ERF-48`: "A record never edited since minting correctly
/// carries no `last_modified` at all").
fn last_change(d: &FileDoc) -> Option<Stamp> {
    for k in ["last_modified", "created", "conducted"] {
        if let Some(st) = stamp_at(&d.front, k) {
            return Some(st);
        }
    }
    None
}

// ---------------------------------------------------------------------------
// entry point
// ---------------------------------------------------------------------------

pub fn run(dep: &mut Deployment, schemas: &Schemas, rep: &mut Report) {
    for c in dep.corpora.iter_mut() {
        declaration(c, rep);
    }
    for c in dep.corpora.iter_mut() {
        binding_layer(c, rep);
        schema_layer(c, schemas, rep);
        load_texts(c, rep, dep.mode);
    }
    for c in dep.corpora.iter() {
        sources(c, rep);
        atoms(c, rep, dep.mode);
        claims(c, rep);
        surveys(c, rep);
        narratives(c, rep, dep.mode);
    }
    deployment_wide(dep, rep);
    naming_duty(dep, rep);
}

// ---------------------------------------------------------------------------
// ERF-54, ERF-59, ERF-60, ERF-61, ERF-17
// ---------------------------------------------------------------------------

fn declaration(c: &mut CorpusCtx, rep: &mut Report) {
    let decls: Vec<&FileDoc> = c
        .loaded
        .docs
        .iter()
        .filter(|d| d.rtype == Some(RecordType::CorpusDeclaration))
        .collect();
    match decls.len() {
        0 => rep.violation(
            "ERF-59",
            &c.label,
            "no file carries `type: corpus`; a corpus MUST carry exactly one declaration",
        ),
        1 => {}
        n => {
            rep.violation(
                "ERF-54",
                &c.label,
                format!("{n} files carry `type: corpus`; a validator MUST reject two declarations"),
            );
            rep.violation(
                "ERF-59",
                &c.label,
                format!("{n} declarations; a corpus MUST carry exactly one"),
            );
        }
    }
    let decl = decls.first().copied();
    c.decl_ids = decls.iter().filter_map(|d| d.id()).map(|s| s.to_string()).collect();

    // ERF-60/ERF-61: read `spec_version` before anything else.
    let sv = decl.and_then(|d| d.str_field("spec_version"));
    c.strictness = Strictness::Known;
    if let Some(sv) = sv {
        match parse_semver(sv) {
            None => rep.violation(
                "ERF-61",
                decl.map(|d| d.rel.as_str()).unwrap_or(&c.label),
                format!("`spec_version: {sv}` is not Semantic Versioning 2.0.0"),
            ),
            Some((maj, min, _)) => {
                if maj != SUPPORTED_MAJOR {
                    rep.violation(
                        "ERF-60",
                        decl.map(|d| d.rel.as_str()).unwrap_or(&c.label),
                        format!(
                            "refusing: MAJOR version {maj} is unsupported (this validator reads {SUPPORTED_MAJOR}.x). \
                             Reading a corpus under the wrong major is worse than refusing it."
                        ),
                    );
                } else if min > SUPPORTED_MINOR {
                    c.strictness = Strictness::NewerMinor;
                    rep.flag(
                        "ERF-60",
                        decl.map(|d| d.rel.as_str()).unwrap_or(&c.label),
                        format!(
                            "MINOR version {min} is newer than this validator knows ({SUPPORTED_MAJOR}.{SUPPORTED_MINOR}); \
                             unknown fields and record types are reported as unrecognized, not as violations"
                        ),
                    );
                }
            }
        }
    }

    // ERF-54 + ERF-17, over every file.
    for d in &c.loaded.docs {
        match (&d.rtype, &d.raw_type) {
            (None, Some(raw)) => {
                let k = if c.strictness == Strictness::NewerMinor {
                    Kind::Flag
                } else {
                    Kind::Violation
                };
                rep.push(
                    k,
                    Layer::Model,
                    "ERF-57",
                    &d.rel,
                    format!("unrecognized record type `{raw}`: preserved and reported, never interpreted"),
                );
            }
            _ => {}
        }
        if let Some(rt) = d.rtype {
            if rt.is_record() || rt == RecordType::Narrative {
                match d.corpus() {
                    None => rep.violation("ERF-17", &d.rel, "no `corpus` field"),
                    Some(cid) => {
                        if !c.decl_ids.is_empty() && !c.decl_ids.iter().any(|x| x == cid) {
                            rep.violation(
                                "ERF-17",
                                &d.rel,
                                format!(
                                    "`corpus: {cid}` names no declared corpus (declared here: {})",
                                    c.decl_ids.join(", ")
                                ),
                            );
                        }
                    }
                }
            }
        }
    }
    for (rel, why) in &c.loaded.ignored {
        rep.flag(
            "ERF-54",
            rel,
            format!("not part of the corpus and ignored ({why}); reported rather than dropped in silence"),
        );
    }
}

fn parse_semver(s: &str) -> Option<(u64, u64, u64)> {
    let core = s.split(['-', '+']).next()?;
    let mut it = core.split('.');
    let a = it.next()?;
    let b = it.next()?;
    let c = it.next()?;
    if it.next().is_some() {
        return None;
    }
    for p in [a, b, c] {
        if p.is_empty() || (p.len() > 1 && p.starts_with('0')) || !p.bytes().all(|x| x.is_ascii_digit()) {
            return None;
        }
    }
    Some((a.parse().ok()?, b.parse().ok()?, c.parse().ok()?))
}

// ---------------------------------------------------------------------------
// ERF-65, ERF-66, ERF-67 and the binding's section 1
// ---------------------------------------------------------------------------

fn binding_layer(c: &mut CorpusCtx, rep: &mut Report) {
    for d in &c.loaded.docs {
        for diag in &d.yaml_diags {
            rep.push(
                Kind::Violation,
                Layer::Binding,
                diag.req,
                &format!("{}:{}", d.rel, diag.line),
                diag.msg.clone(),
            );
        }
        let Some(rt) = d.rtype else { continue };

        // The binding's section 1: one record per file, YAML frontmatter then a
        // markdown body; an atom's body is empty; the declaration and the
        // source list are YAML documents with no body.
        if !rt.has_body() && !d.body.trim().is_empty() {
            rep.violation_binding(
                "YAMLB-1s",
                &d.rel,
                format!(
                    "a `{}` file carries a markdown body ({} bytes); the model gives it none",
                    rt.as_str(),
                    d.body.trim().len()
                ),
            );
        }
        if rt.has_body() && d.front.get("body").is_some() {
            rep.violation_binding(
                "YAMLB-1s",
                &d.rel,
                "`body` appears as a frontmatter key; in this binding the body is the file body",
            );
        }
        if rt.has_body() && d.body.trim().is_empty() {
            rep.flag(
                if rt == RecordType::Survey { "ERF-28" } else { "ERF-18" },
                &d.rel,
                "the file's body is empty; the model gives this record type a body",
            );
        }
        if rt.is_record() && !d.had_fences {
            rep.violation_binding(
                "YAMLB-1s",
                &d.rel,
                "record written as a bare YAML document; the shape is frontmatter plus body",
            );
        }
    }
}

// ---------------------------------------------------------------------------
// The data model (section 3), plus ERF-55 and ERF-72
// ---------------------------------------------------------------------------

fn schema_layer(c: &mut CorpusCtx, schemas: &Schemas, rep: &mut Report) {
    for d in &c.loaded.docs {
        let Some(rt) = d.rtype else { continue };
        // Section 3 states the model check against the whole schema, whose top
        // level is a `oneOf` over the six definitions. Dispatching on `type`
        // and checking the one definition gives usable diagnostics; this
        // asserts the two agree, so the readable path never diverges from the
        // sentence the specification actually wrote.
        let per_type: Vec<_> = schema::validate(schemas, rt, &d.instance);
        if per_type.is_empty() && !schemas.whole.is_valid(&d.instance) {
            rep.violation(
                "SPEC-3",
                &d.rel,
                "file validates against its own definition but not against the model's top-level `oneOf`",
            );
        }
        for f in per_type {
            let lenient = c.strictness == Strictness::NewerMinor && f.is_unknown_field;
            let kind = if lenient { Kind::Flag } else { Kind::Violation };
            let layer = if f.is_wire_type_error { Layer::Binding } else { Layer::Model };
            rep.push(
                kind,
                layer,
                f.req,
                &format!("{}{}", d.rel, f.path),
                f.msg,
            );
        }

        // ERF-55: "Empty lists MUST be omitted, a field's absence meaning none".
        let mut arrs = Vec::new();
        walk_arrays(&d.front, "", &mut arrs);
        for (p, n) in arrs {
            if n == 0 {
                rep.violation(
                    "ERF-55",
                    &format!("{}{}", d.rel, p),
                    "empty list written out; an empty list MUST be omitted",
                );
            }
        }

        // ERF-72 / ERF-57: extension fields are reported, never counted under ERF-55.
        let mut keys = Vec::new();
        walk_keys(&d.front, "", &mut keys);
        for (p, k) in &keys {
            if k.starts_with("x_") {
                rep.flag(
                    "ERF-72",
                    &format!("{}{}", d.rel, p),
                    "extension field: reported as unknown, never reported under ERF-55",
                );
                // ERF-11 and ERF-22 forbid two things the schema can only keep
                // out of its own namespace. An extension field is the one place
                // they could be smuggled back in.
                let low = k.to_ascii_lowercase();
                if rt == RecordType::Atom && (low.contains("quote_check") || low.contains("verbatim") || low.contains("quote_ok")) {
                    rep.flag(
                        "ERF-11",
                        &format!("{}{}", d.rel, p),
                        "an extension field on an atom appears to store the mechanical check's result, which MUST NOT be stored",
                    );
                }
                if rt == RecordType::Claim && (low.contains("disposition") || low.contains("state") || low.contains("status")) {
                    rep.flag(
                        "ERF-22",
                        &format!("{}{}", d.rel, p),
                        "an extension field on a claim appears to store a state field; the disposition is computed (ERF-41)",
                    );
                }
            }
        }

        // ERF-58: "The event-time key MUST be `timestamp`, everywhere."
        for stamp_field in ["created", "last_modified", "conducted", "excerpt", "received"] {
            if let Some(Value::Object(m)) = d.front.get(stamp_field) {
                if !m.contains_key("timestamp") {
                    for alt in ["date", "when", "at", "time", "ts", "datetime", "on"] {
                        if m.contains_key(alt) {
                            rep.violation(
                                "ERF-58",
                                &format!("{}/{stamp_field}", d.rel),
                                format!("event time is keyed `{alt}`; the event-time key MUST be `timestamp`, everywhere"),
                            );
                        }
                    }
                }
            }
        }

        // Section 2: "Every actor id MUST follow this convention." Reported
        // under SPEC-2 because the sentence carries no ERF number.
        for (p, k) in &keys {
            if k == "by" {
                if let Some(v) = pointer(&d.front, p).and_then(|x| x.as_str()) {
                    if ActorForm::classify(v).is_none() {
                        rep.violation(
                            "SPEC-2",
                            &format!("{}{}", d.rel, p),
                            format!("`by: {v}` is none of `human:<id>`, `<producer>/<version>`, `process:<id>`"),
                        );
                    }
                }
            }
        }

        // Calendar and RFC 3339 validity, which the schema's patterns do not
        // reach. RFC 3339 is cited as normative and governs its own ground.
        for (p, k) in &keys {
            let req = match k.as_str() {
                "timestamp" => {
                    if p.contains("/standings/") { "ERF-19" } else if p.contains("/searches/") { "ERF-28" }
                    else if p.contains("_audit/") { "ERF-11" }
                    else if p.contains("/received") { "ERF-2" }
                    else if p.contains("/excerpt") { "ERF-69" }
                    else { "ERF-58" }
                }
                "as_of_date" => "ERF-14",
                _ => continue,
            };
            let Some(v) = pointer(&d.front, p).and_then(|x| x.as_str()) else { continue };
            if k == "as_of_date" {
                continue; // AsOfDate admits year and year-month; the schema pattern is the rule.
            }
            match Stamp::parse(v) {
                Ok(st) => {
                    if p.contains("/standings/") && !st.is_instant() {
                        rep.violation("ERF-19", &format!("{}{}", d.rel, p), format!("`{v}` is a bare date; a standing's timestamp MUST be a full RFC 3339 instant"));
                    }
                }
                Err(StampError::NotACalendarDate) => rep.violation(
                    req,
                    &format!("{}{}", d.rel, p),
                    format!("`{v}` matches the schema's date pattern but is not a calendar date (RFC 3339)"),
                ),
                Err(StampError::NotRfc3339Instant) => rep.violation(
                    req,
                    &format!("{}{}", d.rel, p),
                    format!("`{v}` is not an RFC 3339 date-time (seconds are required; offsets and fields must be in range)"),
                ),
                Err(StampError::Unrecognized) => rep.violation(
                    req,
                    &format!("{}{}", d.rel, p),
                    format!("`{v}` is neither an RFC 3339 full-date nor an RFC 3339 date-time"),
                ),
            }
        }

        // ERF-15, over every id-bearing field.
        for (field, path) in id_refs(d) {
            if encodes_location(&path.1) {
                rep.violation(
                    "ERF-15",
                    &format!("{}/{}", d.rel, field),
                    format!("`{}` encodes a location; references MUST be bare ids", path.1),
                );
            }
        }
    }
}

fn pointer<'a>(v: &'a Value, p: &str) -> Option<&'a Value> {
    if p.is_empty() {
        return Some(v);
    }
    v.pointer(p)
}

/// Every id-bearing field of a record, as (field label, (kind, value)).
fn id_refs(d: &FileDoc) -> Vec<(String, (&'static str, String))> {
    let mut out = Vec::new();
    let mut push = |f: &str, k: &'static str, v: &Value| {
        if let Some(x) = v.as_str() {
            out.push((f.to_string(), (k, x.to_string())));
        }
    };
    for (f, k) in [
        ("atoms_for", "atom"),
        ("atoms_against", "atom"),
        ("surveys", "survey"),
        ("families", "family"),
    ] {
        if let Some(a) = d.arr(f) {
            for v in a {
                push(f, k, v);
            }
        }
    }
    if let Some(v) = d.front.get("prior_survey") {
        push("prior_survey", "survey", v);
    }
    if let Some(v) = d.front.get("source") {
        push("source", "source", v);
    }
    if let Some(a) = d.arr("edges") {
        for e in a {
            if let Some(v) = e.get("to") {
                push("edges.to", "claim", v);
            }
        }
    }
    if let Some(a) = d.arr("notable_results") {
        for n in a {
            if let Some(x) = n.get("atoms").and_then(|v| v.as_array()) {
                for v in x {
                    push("notable_results.atoms", "atom", v);
                }
            }
        }
    }
    if let Some(a) = d.arr("standings") {
        for st in a {
            if let Some(e) = st.get("evidence_at_stance") {
                for f in ["atoms_for", "atoms_against"] {
                    if let Some(x) = e.get(f).and_then(|v| v.as_array()) {
                        for v in x {
                            push(&format!("evidence_at_stance.{f}"), "past-atom", v);
                        }
                    }
                }
            }
        }
    }
    out
}

// ---------------------------------------------------------------------------
// Normalized texts: ERF-1, ERF-51
// ---------------------------------------------------------------------------

fn load_texts(c: &mut CorpusCtx, rep: &mut Report, mode: FoldMode) {
    let mut out = BTreeMap::new();
    for (sid, (list_rel, sv)) in &c.index.sources {
        let status = s(sv.get("status")).and_then(SourceStatus::parse);
        let normalized = s(sv.get("normalized"));
        let base = c
            .root
            .join(list_rel)
            .parent()
            .map(|p| p.to_path_buf())
            .unwrap_or_else(|| c.root.clone());
        match (status, normalized) {
            (Some(st), Some(np)) if st.ships() => {
                let p = base.join(np);
                if !p.exists() {
                    rep.violation(
                        "ERF-1",
                        &format!("{list_rel}/sources/{sid}"),
                        format!("`normalized: {np}` does not exist; a source's normalized text MUST exist before any check runs against it"),
                    );
                    out.insert(sid.clone(), Err(format!("normalized text `{np}` is not held")));
                    continue;
                }
                let ext = p
                    .extension()
                    .map(|e| e.to_string_lossy().to_ascii_lowercase())
                    .unwrap_or_default();
                if !matches!(ext.as_str(), "md" | "markdown" | "txt" | "text") {
                    // ERF-51: "A validator therefore never converts. Facing a
                    // normalized text that is not text or markdown it MUST
                    // report the check as unavailable rather than pass or fail it."
                    out.insert(
                        sid.clone(),
                        Err(format!("normalized text `{np}` is not text or markdown; this validator never converts")),
                    );
                    continue;
                }
                match std::fs::read(&p) {
                    Ok(bytes) => match String::from_utf8(bytes.clone()) {
                        Ok(t) => {
                            if let Some(dg) = s(sv.get("normalized_digest")) {
                                check_digest(rep, &format!("{list_rel}/sources/{sid}/normalized_digest"), dg, &bytes);
                            }
                            out.insert(sid.clone(), Ok(norm::fold(&t, mode)));
                        }
                        Err(_) => {
                            out.insert(sid.clone(), Err("normalized text is not valid UTF-8".into()));
                        }
                    },
                    Err(e) => {
                        out.insert(sid.clone(), Err(format!("normalized text unreadable: {e}")));
                    }
                }
            }
            (Some(_), _) => {
                out.insert(
                    sid.clone(),
                    Err("the source records an absence; no normalized text is held".into()),
                );
            }
            (None, _) => {
                out.insert(sid.clone(), Err("source has no readable `status`".into()));
            }
        }
    }
    c.texts = out;
}

fn check_digest(rep: &mut Report, loc: &str, declared: &str, bytes: &[u8]) {
    let Some(hex_part) = declared.strip_prefix("sha256:") else {
        rep.violation("ERF-71", loc, format!("`{declared}` does not name its algorithm as `sha256:<hex>`"));
        return;
    };
    let mut h = Sha256::new();
    h.update(bytes);
    let got = hex::encode(h.finalize());
    if got != hex_part {
        rep.violation(
            "ERF-71",
            loc,
            format!("digest does not match the bytes the corpus holds (declared {hex_part}, computed {got})"),
        );
    }
}

// ---------------------------------------------------------------------------
// 4.1 The source
// ---------------------------------------------------------------------------

fn sources(c: &CorpusCtx, rep: &mut Report) {
    let lists: Vec<&FileDoc> = c
        .loaded
        .docs
        .iter()
        .filter(|d| d.rtype == Some(RecordType::SourceList))
        .collect();
    if lists.is_empty() {
        rep.violation(
            "ERF-3",
            &c.label,
            "no file carries `type: sources`; a corpus MUST keep a source list",
        );
    }
    // ERF-3: "keyed by a source id unique within the corpus".
    let mut seen: BTreeMap<String, Vec<String>> = BTreeMap::new();
    for l in &lists {
        if let Some(Value::Object(m)) = l.front.get("sources") {
            for k in m.keys() {
                seen.entry(k.clone()).or_default().push(l.rel.clone());
            }
        }
    }
    for (k, wheres) in &seen {
        if wheres.len() > 1 {
            rep.violation(
                "ERF-3",
                &c.label,
                format!("source id `{k}` appears in {} source lists ({})", wheres.len(), wheres.join(", ")),
            );
        }
    }

    for (sid, (rel, sv)) in &c.index.sources {
        let loc = format!("{rel}/sources/{sid}");
        let status = s(sv.get("status")).and_then(SourceStatus::parse);

        // ERF-7: "`citation_text` MUST NOT contain a URL." The schema forbids
        // `://`; a URL without a scheme passes it, so the prose is checked too.
        if let Some(ct) = s(sv.get("citation_text")) {
            let low = ct.to_ascii_lowercase();
            if low.contains("www.") || low.contains("http") || low.contains("doi.org") {
                rep.flag(
                    "ERF-7",
                    &loc,
                    "`citation_text` holds something that reads as a locator; the schema only forbids `://`",
                );
            }
        }

        // ERF-8, in the only part decidable without a CSL processor.
        if let Some(cit) = sv.get("citation") {
            let ct = s(sv.get("citation_text")).unwrap_or("");
            if let Some(t) = s(cit.get("title")) {
                if !ct.contains(t) {
                    rep.flag("ERF-8", &loc, format!("`citation.title` (\"{t}\") does not appear in the rendered `citation_text`"));
                }
            }
            if let Some(auths) = cit.get("author").and_then(|v| v.as_array()) {
                for a in auths {
                    if let Some(f) = s(a.get("family")) {
                        if !ct.contains(f) {
                            rep.flag("ERF-8", &loc, format!("`citation.author` family name \"{f}\" does not appear in `citation_text`"));
                        }
                    }
                }
            }
            if let Some(y) = cit.get("issued").and_then(|v| v.as_i64()) {
                if !ct.contains(&y.to_string()) {
                    rep.flag("ERF-8", &loc, format!("`citation.issued` ({y}) does not appear in `citation_text`"));
                }
            }
        }

        // ERF-2.
        if let Some(r) = sv.get("received") {
            let url = s(r.get("url"));
            let path = s(r.get("path"));
            let digest = s(r.get("digest"));
            let ts = r.get("timestamp");
            if path.is_none() && (url.is_none() || digest.is_none()) {
                rep.flag(
                    "ERF-2",
                    &loc,
                    "the corpus does not hold the raw file, so `received` should carry both `url` and `digest`",
                );
            }
            if let Some(u) = url {
                let web = u.starts_with("http://") || u.starts_with("https://");
                if web && ts.is_none() {
                    rep.violation(
                        "ERF-2",
                        &loc,
                        "raw file sits at a web location, whose bytes the corpus does not control, and `received.timestamp` is absent",
                    );
                }
            }
            if let Some(p) = path {
                let base = c.root.join(rel).parent().map(|x| x.to_path_buf()).unwrap_or_else(|| c.root.clone());
                let full = base.join(p);
                if !full.exists() {
                    rep.flag("ERF-2", &loc, format!("`received.path: {p}` names a raw file the corpus does not hold"));
                } else if let (Some(dg), Ok(bytes)) = (digest, std::fs::read(&full)) {
                    check_digest(rep, &format!("{loc}/received.digest"), dg, &bytes);
                }
            }
        }

        // ERF-68. Only `shipped` owes a licence: `shipped-as-quotation` is by
        // this requirement's own words what a text ships as when there is no
        // licence, so demanding one there would contradict the sentence that
        // created the status.
        if let Some(st) = status {
            if st == SourceStatus::Shipped {
                let lic = s(sv.get("licence"));
                match lic {
                    None => rep.flag(
                        "ERF-68",
                        &loc,
                        "a source whose normalized text ships names no `licence`; an absent licence reads as an oversight",
                    ),
                    Some(l) => {
                        if !SPDX_SUBSET.contains(&l) {
                            rep.flag(
                                "ERF-68",
                                &loc,
                                format!("`licence: {l}` is not in this tool's bundled slice of the SPDX License List; membership is unchecked"),
                            );
                        }
                        if sv.get("licence_name").is_none() {
                            rep.flag("ERF-68", &loc, "an SPDX identifier with no `licence_name` alongside");
                        }
                    }
                }
            }
        }

        // ERF-70: a raw file in another format owes a named, versioned extractor.
        if let Some(p) = sv.get("received").and_then(|r| s(r.get("path"))).or(sv.get("received").and_then(|r| s(r.get("url")))) {
            let ext = p.rsplit('.').next().unwrap_or("").to_ascii_lowercase();
            let texty = matches!(ext.as_str(), "md" | "markdown" | "txt" | "text");
            if !texty && sv.get("extraction").is_none() && status.map(|s| s.ships()).unwrap_or(false) {
                rep.flag(
                    "ERF-70",
                    &loc,
                    format!("raw file looks like `.{ext}`, not text, and the source names no `extraction` tool"),
                );
            }
        }
        for k in ["extraction", "normalization"] {
            if let Some(v) = s(sv.get(k)) {
                if !v.chars().any(|c| c.is_ascii_digit()) {
                    rep.flag("ERF-70", &loc, format!("`{k}: {v}` names no exact version"));
                }
            }
        }

        // ERF-71.
        if sv.get("extraction").is_some() || sv.get("excerpt").is_some() {
            if sv.get("received").and_then(|r| r.get("digest")).is_none() {
                rep.flag(
                    "ERF-71",
                    &loc,
                    "normalized text is an excerpt or a conversion and `received.digest` is absent",
                );
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 4.2 The atom: ERF-4, ERF-6, ERF-11, ERF-13, ERF-50, ERF-51, ERF-52
// ---------------------------------------------------------------------------

fn atoms(c: &CorpusCtx, rep: &mut Report, mode: FoldMode) {
    for d in c.loaded.docs.iter().filter(|d| d.rtype == Some(RecordType::Atom)) {
        let loc = d.rel.clone();

        // ERF-13's shape half.
        if let Some(id) = d.id() {
            let seq_shaped = id
                .rsplit_once('-')
                .map(|(p, n)| !p.is_empty() && !n.is_empty() && n.bytes().all(|b| b.is_ascii_digit()))
                .unwrap_or(false);
            if !seq_shaped {
                rep.flag(
                    "ERF-13",
                    &loc,
                    format!("id `{id}` is not a mint-time prefix and a sequence number (`kwg-117`); the schema's `Id` admits it"),
                );
            }
        }

        // Section 4.2's advice made checkable: a medium or low grade owes a reason.
        if let Some(q) = s(d.front.get("source_quality")).and_then(SourceQuality::parse) {
            if q.owes_limitations() && s(d.front.get("limitations")).map(|x| x.trim().is_empty()).unwrap_or(true) {
                rep.flag(
                    "ERF-9",
                    &loc,
                    "`source_quality` is medium or low and `limitations` says nothing about what is thin",
                );
            }
        }

        // ERF-11: the auditor is a bare instrument identifier, never an Actor.
        if let Some(a) = d.arr("finding_audit") {
            for (i, e) in a.iter().enumerate() {
                if let Some(au) = s(e.get("auditor")) {
                    if ActorForm::classify(au).is_some() {
                        rep.flag(
                            "ERF-11",
                            &format!("{loc}/finding_audit/{i}"),
                            format!("`auditor: {au}` reads as an Actor; an audit entry names the instrument, deliberately not a role"),
                        );
                    }
                }
                if let Some(v) = s(e.get("verdict")) {
                    if Verdict::parse(v).is_none() {
                        rep.violation("ERF-12", &format!("{loc}/finding_audit/{i}"), format!("`{v}` is not one of SUPPORTED, PARTIAL, UNSUPPORTED"));
                    }
                }
            }
        }

        // ERF-4 and the quote check.
        let Some(src) = d.str_field("source") else { continue };
        let Some(q) = d.str_field("quote") else { continue };
        if !c.index.sources.contains_key(src) {
            rep.violation(
                "ERF-4",
                &loc,
                format!("`source: {src}` names no entry in the source list"),
            );
            rep.push(
                Kind::Unperformed,
                Layer::Model,
                "ERF-50",
                &loc,
                "quote check not run: the atom names no source in the list",
            );
            continue;
        }
        for nm in norm::near_markers(q) {
            rep.flag(
                "ERF-52",
                &loc,
                format!("quote holds `{nm}`, which is not the exact marker `[...]` and is checked as literal text"),
            );
        }
        match c.texts.get(src) {
            None | Some(Err(_)) => {
                let why = c
                    .texts
                    .get(src)
                    .and_then(|r| r.as_ref().err().cloned())
                    .unwrap_or_else(|| "no normalized text".into());
                rep.push(
                    Kind::Unperformed,
                    Layer::Model,
                    "ERF-50",
                    &loc,
                    format!("quote check unavailable: {why}"),
                );
            }
            Some(Ok(text)) => {
                let v = norm::quote_check(q, text, mode);
                match &v {
                    QuoteVerdict::Occurs(ranges) => {
                        // ERF-6, in the part a validator can see: did step 2 of
                        // the fold have to do work to make this match? A quote
                        // taken by copying matches without it.
                        let raw_ok = {
                            let t2 = norm::fold_without_step2(&raw_text_of(c, src), mode);
                            norm::quote_check_without_step2(q, &t2, mode).ok()
                        };
                        if !raw_ok {
                            rep.flag(
                                "ERF-6",
                                &loc,
                                "quote matches only once NFC and ignorable-removal have run; a quote taken by copying matches the source's own code points",
                            );
                        }
                        // ERF-69: an excerpt "MUST contain the quoted passage
                        // together with enough adjacent text for the passage's
                        // place in the work to be legible".
                        let covered: usize = ranges.iter().map(|(a, b)| b - a).sum();
                        if covered >= text.len() {
                            rep.flag(
                                "ERF-69",
                                &loc,
                                "the normalized text holds the quote and nothing else; a text holding the quote alone proves nothing",
                            );
                        }
                    }
                    QuoteVerdict::AllSpansEmpty => rep.violation(
                        "ERF-52",
                        &loc,
                        "every span of the quote is empty; such a quote MUST fail rather than trivially pass",
                    ),
                    QuoteVerdict::SpanAbsent { index, span } => rep.violation(
                        "ERF-52",
                        &loc,
                        format!("span {index} does not occur in the normalized text as whole words: {}", trunc(span)),
                    ),
                    QuoteVerdict::NoConsistentPlacement { index, span } => rep.violation(
                        "ERF-52",
                        &loc,
                        format!("span {index} occurs, but not in order and without overlap with its neighbours: {}", trunc(span)),
                    ),
                }
            }
        }
    }
}

fn raw_text_of(c: &CorpusCtx, sid: &str) -> String {
    let Some((rel, sv)) = c.index.sources.get(sid) else { return String::new() };
    let Some(np) = s(sv.get("normalized")) else { return String::new() };
    let base = c.root.join(rel).parent().map(|p| p.to_path_buf()).unwrap_or_else(|| c.root.clone());
    std::fs::read_to_string(base.join(np)).unwrap_or_default()
}

fn trunc(s: &str) -> String {
    let cs: Vec<char> = s.chars().collect();
    if cs.len() <= 70 {
        format!("\"{s}\"")
    } else {
        format!("\"{}…\"", cs[..70].iter().collect::<String>())
    }
}

// ---------------------------------------------------------------------------
// 4.3-4.4 The claim: ERF-18..ERF-25, ERF-39..ERF-44, ERF-47, ERF-48
// ---------------------------------------------------------------------------

pub struct ClaimView {
    pub rel: String,
    pub id: String,
    pub kind: Option<EpistemicKind>,
    pub disposition: Disposition,
    pub premises: Vec<String>,
    pub decomposes: Vec<String>,
}

fn claims(c: &CorpusCtx, rep: &mut Report) {
    let claim_docs: Vec<&FileDoc> = c
        .loaded
        .docs
        .iter()
        .filter(|d| d.rtype == Some(RecordType::Claim))
        .collect();

    let mut views: BTreeMap<String, ClaimView> = BTreeMap::new();
    // Incoming `supports` edges: a premise arrives from the other side too.
    let mut incoming_supports: BTreeMap<String, Vec<String>> = BTreeMap::new();

    for d in &claim_docs {
        let Some(id) = d.id() else { continue };
        if let Some(a) = d.arr("edges") {
            for e in a {
                let (Some(to), Some(r)) = (s(e.get("to")), s(e.get("relation")).and_then(Relation::parse)) else { continue };
                if r == Relation::Supports {
                    incoming_supports.entry(to.to_string()).or_default().push(id.to_string());
                }
            }
        }
    }

    for d in &claim_docs {
        let loc = d.rel.clone();
        let Some(id) = d.id().map(|x| x.to_string()) else { continue };
        let kind = s(d.front.get("epistemic_kind")).and_then(EpistemicKind::parse);

        // ERF-18: "The body SHOULD open by restating it, and keeping the
        // restatement verbatim is what makes later drift visible to a reader."
        if let Some(title) = d.str_field("title") {
            let first = d
                .body
                .split("\n\n")
                .map(|p| p.trim())
                .find(|p| !p.is_empty())
                .unwrap_or("");
            if !first.is_empty() {
                let ft = norm::fold(first, FoldMode::SeparatorPreserving);
                let tt = norm::fold(title, FoldMode::SeparatorPreserving);
                if ft != tt {
                    rep.flag(
                        "ERF-18",
                        &loc,
                        "the body's opening is not the title restated verbatim; whether it still states the same claim is a reading no rule numbers",
                    );
                }
            }
        }

        // ERF-24 / section 2's *unbacked* reading.
        if let Some(k) = kind {
            if !k.owes_backing() && d.arr("evidence_audit").map(|a| !a.is_empty()).unwrap_or(false) {
                rep.flag(
                    "ERF-24",
                    &loc,
                    format!("a `{}` owes no backing and has nothing to audit, yet carries an `evidence_audit`", k.as_str()),
                );
            }
        }

        // ERF-25, heuristically: a universal negative resting on atoms alone.
        if let Some(t) = d.str_field("title") {
            let low = t.to_ascii_lowercase();
            let universal_negative = low.starts_with("no ")
                || low.contains(" no shipped ")
                || low.contains("nothing in the")
                || low.contains("there is no ");
            let has_surveys = d.arr("surveys").map(|a| !a.is_empty()).unwrap_or(false);
            if universal_negative && !has_surveys {
                rep.flag(
                    "ERF-25",
                    &loc,
                    "title reads as a universal negative and the claim cites no surveys; atoms can only quote what exists (heuristic)",
                );
            }
        }

        // ERF-35: references resolve, to the type the field's name says.
        for (field, (want, val)) in id_refs(d) {
            let found = c.index.records.get(&val);
            match want {
                "family" => {}
                "past-atom" => {
                    // ERF-35: a reference recording a past state is flagged, never a violation.
                    let ok = matches!(found.and_then(|v| v.first()), Some((RecordType::Atom, _)));
                    if !ok {
                        rep.flag(
                            "ERF-35",
                            &format!("{loc}/{field}"),
                            format!("`{val}` records what the ruler faced and no longer resolves to an atom; a corpus changing afterwards is a permitted act"),
                        );
                    }
                }
                want => {
                    let expect = match want {
                        "atom" => RecordType::Atom,
                        "survey" => RecordType::Survey,
                        "claim" => RecordType::Claim,
                        _ => continue,
                    };
                    match found.and_then(|v| v.first()) {
                        None => rep.violation(
                            "ERF-35",
                            &format!("{loc}/{field}"),
                            format!("`{val}` resolves to no record in the deployment"),
                        ),
                        Some((got, _)) if *got != expect => rep.violation(
                            "ERF-35",
                            &format!("{loc}/{field}"),
                            format!("`{val}` resolves to a {} where the field's name says {}", got.as_str(), expect.as_str()),
                        ),
                        _ => {}
                    }
                }
            }
        }

        // ERF-43's self-edge rule and ERF-44.
        let mut premises: Vec<String> = Vec::new();
        let mut decomposes: Vec<String> = Vec::new();
        let mut conflicts: Vec<String> = Vec::new();
        if let Some(a) = d.arr("edges") {
            for (i, e) in a.iter().enumerate() {
                let (Some(to), Some(r)) = (s(e.get("to")), s(e.get("relation")).and_then(Relation::parse)) else { continue };
                if to == id {
                    rep.violation(
                        "ERF-43",
                        &format!("{loc}/edges/{i}"),
                        format!("self-edge `{}` -> itself; self-edges MUST NOT exist in any relation", r.as_str()),
                    );
                    continue;
                }
                match r {
                    Relation::Assumes => premises.push(to.to_string()),
                    Relation::DecomposesInto => decomposes.push(to.to_string()),
                    Relation::ConflictsWith => conflicts.push(to.to_string()),
                    Relation::Supports => {}
                }
            }
        }
        for t in &conflicts {
            if let Some(other) = claim_docs.iter().find(|x| x.id() == Some(t.as_str())) {
                if let Some(a) = other.arr("edges") {
                    let back = a.iter().any(|e| {
                        s(e.get("to")) == Some(id.as_str())
                            && s(e.get("relation")) == Some("conflicts-with")
                    });
                    if back && id.as_str() < t.as_str() {
                        rep.violation(
                            "ERF-44",
                            &loc,
                            format!("`conflicts-with` between `{id}` and `{t}` is stored on both records; it MUST be stored once per pair, the reciprocal derived"),
                        );
                    }
                }
            }
        }
        if let Some(more) = incoming_supports.get(&id) {
            premises.extend(more.iter().cloned());
        }

        let disposition = disposition_of(d, rep);
        views.insert(
            id.clone(),
            ClaimView {
                rel: loc.clone(),
                id: id.clone(),
                kind,
                disposition,
                premises,
                decomposes,
            },
        );
    }

    graph_rules(&views, rep);
    staleness(c, rep);
}

/// `ERF-41` in full.
pub fn disposition_for(d: &FileDoc, rep: &mut Report) -> Disposition {
    disposition_of(d, rep)
}

fn disposition_of(d: &FileDoc, rep: &mut Report) -> Disposition {
    let loc = &d.rel;
    let Some(entries) = d.arr("standings") else {
        return Disposition::Proposal;
    };
    // "each person's newest admissible entry"
    #[derive(Clone)]
    struct E {
        by: String,
        stance: Stance,
        ts: Stamp,
        order: usize,
    }
    let mut adm: Vec<E> = Vec::new();
    for (i, e) in entries.iter().enumerate() {
        let stance = s(e.get("stance")).and_then(Stance::parse);
        let ts = s(e.get("timestamp")).map(Stamp::parse);
        let by = s(e.get("by"));
        let human = by.map(|b| ActorForm::classify(b) == Some(ActorForm::Human)).unwrap_or(false);
        let instant = matches!(ts, Some(Ok(st)) if st.is_instant());
        if stance.is_none() || !human || !instant {
            rep.violation(
                "ERF-41",
                &format!("{loc}/standings/{i}"),
                "inadmissible standing entry (stance off the vocabulary, timestamp not an instant, or `by` not a `human:` actor); \
                 it is a producer error and is treated as never written",
            );
            continue;
        }
        adm.push(E {
            by: by.unwrap().to_string(),
            stance: stance.unwrap(),
            ts: ts.unwrap().unwrap(),
            order: i,
        });
    }
    if adm.is_empty() {
        return Disposition::Proposal;
    }
    let mut newest: BTreeMap<String, E> = BTreeMap::new();
    for e in &adm {
        match newest.get(&e.by) {
            None => {
                newest.insert(e.by.clone(), e.clone());
            }
            Some(prev) => {
                let (Stamp::Instant(a), Stamp::Instant(b)) = (prev.ts, e.ts) else { continue };
                if b > a {
                    newest.insert(e.by.clone(), e.clone());
                } else if b == a {
                    // "Where one person's newest entries share an instant, the
                    // later in the ledger is current and a validator MUST flag
                    // the collision."
                    rep.flag(
                        "ERF-41",
                        &format!("{loc}/standings/{}", e.order),
                        format!("`{}` has two entries at the same instant; the later in the ledger is current", e.by),
                    );
                    if e.order > prev.order {
                        newest.insert(e.by.clone(), e.clone());
                    }
                }
            }
        }
    }
    let current: Vec<Stance> = newest
        .values()
        .map(|e| e.stance)
        .filter(|st| *st != Stance::Withdrawn)
        .collect();
    if current.is_empty() {
        return Disposition::Retired;
    }
    let has_for = current.iter().any(|x| *x == Stance::For);
    let has_against = current.iter().any(|x| *x == Stance::Against);
    match (has_for, has_against) {
        (true, true) => Disposition::Contested,
        (true, false) => Disposition::Active,
        (false, true) => Disposition::Rejected,
        (false, false) => unreachable!("withdrawn entries are already discarded"),
    }
}

/// `ERF-43`'s closure, cycle and leaf rules; `ERF-20`'s stamping SHOULD.
fn graph_rules(views: &BTreeMap<String, ClaimView>, rep: &mut Report) {
    // "The premise relation over all claims MUST admit no cycles ... whether or
    // not any closure reaches the cycle".
    if let Some(cyc) = find_cycle(views, |v| &v.premises) {
        rep.violation(
            "ERF-43",
            &views.get(&cyc[0]).map(|v| v.rel.clone()).unwrap_or_default(),
            format!("the premise relation holds a cycle: {}", cyc.join(" -> ")),
        );
    }
    if let Some(cyc) = find_cycle(views, |v| &v.decomposes) {
        rep.violation(
            "ERF-43",
            &views.get(&cyc[0]).map(|v| v.rel.clone()).unwrap_or_default(),
            format!("`decomposes-into` holds a cycle: {}", cyc.join(" -> ")),
        );
    }

    for v in views.values() {
        if v.kind != Some(EpistemicKind::Argument) {
            continue;
        }
        // "The closure is what the edges reach and excludes the argument
        // itself... followed over distinct claims, a claim reached twice
        // visited once, so that a validator terminates on any input."
        let mut seen: BTreeSet<String> = BTreeSet::new();
        let mut stack: Vec<String> = v.premises.clone();
        while let Some(p) = stack.pop() {
            if p == v.id || !seen.insert(p.clone()) {
                continue;
            }
            if let Some(pv) = views.get(&p) {
                for q in &pv.premises {
                    stack.push(q.clone());
                }
            }
        }
        for p in &seen {
            let Some(pv) = views.get(p) else { continue };
            if pv.disposition == Disposition::Retired {
                rep.flag(
                    "ERF-43",
                    &v.rel,
                    format!("premise closure contains `{p}`, whose disposition is retired; a retired premise hollows every argument above it"),
                );
            }
            if pv.kind == Some(EpistemicKind::Argument) && pv.premises.is_empty() {
                rep.violation(
                    "ERF-43",
                    &v.rel,
                    format!(
                        "premise closure ends at `{p}`, an argument with no premises of its own; the closure MUST terminate in non-argument leaves"
                    ),
                );
            }
        }
    }
}

fn find_cycle(
    views: &BTreeMap<String, ClaimView>,
    edges: impl Fn(&ClaimView) -> &Vec<String>,
) -> Option<Vec<String>> {
    let mut state: BTreeMap<String, u8> = BTreeMap::new();
    let mut path: Vec<String> = Vec::new();
    fn dfs(
        n: &str,
        views: &BTreeMap<String, ClaimView>,
        edges: &dyn Fn(&ClaimView) -> &Vec<String>,
        state: &mut BTreeMap<String, u8>,
        path: &mut Vec<String>,
    ) -> Option<Vec<String>> {
        state.insert(n.to_string(), 1);
        path.push(n.to_string());
        if let Some(v) = views.get(n) {
            for m in edges(v) {
                match state.get(m.as_str()).copied().unwrap_or(0) {
                    0 => {
                        if let Some(c) = dfs(m, views, edges, state, path) {
                            return Some(c);
                        }
                    }
                    1 => {
                        let at = path.iter().position(|x| x == m).unwrap_or(0);
                        let mut c: Vec<String> = path[at..].to_vec();
                        c.push(m.clone());
                        return Some(c);
                    }
                    _ => {}
                }
            }
        }
        path.pop();
        state.insert(n.to_string(), 2);
        None
    }
    for k in views.keys() {
        if state.get(k.as_str()).copied().unwrap_or(0) == 0 {
            if let Some(c) = dfs(k, views, &edges, &mut state, &mut path) {
                return Some(c);
            }
        }
    }
    None
}

// ---------------------------------------------------------------------------
// ERF-20, ERF-47, ERF-48
// ---------------------------------------------------------------------------

fn staleness(c: &CorpusCtx, rep: &mut Report) {
    let by_id: BTreeMap<&str, &FileDoc> = c
        .loaded
        .docs
        .iter()
        .filter(|d| d.rtype.map(|r| r.is_record()).unwrap_or(false))
        .filter_map(|d| d.id().map(|i| (i, d)))
        .collect();

    for d in &c.loaded.docs {
        let Some(rt) = d.rtype else { continue };
        if !rt.is_record() && rt != RecordType::Narrative {
            continue;
        }
        // ERF-48.
        let created = stamp_at(&d.front, "created").or_else(|| stamp_at(&d.front, "conducted"));
        let lm = stamp_at(&d.front, "last_modified");
        if let (Some(cr), Some(m)) = (created, lm) {
            if Stamp::not_later_than(&m, &cr) {
                rep.violation(
                    "ERF-48",
                    &d.rel,
                    "`last_modified` is not later than `created`",
                );
            }
        }

        // ERF-47 for finding_audit: what it judged is the atom.
        if rt == RecordType::Atom {
            if let (Some(a), Some(change)) = (d.arr("finding_audit"), last_change(d)) {
                for (i, e) in a.iter().enumerate() {
                    let Some(Ok(ts)) = s(e.get("timestamp")).map(Stamp::parse) else { continue };
                    if Stamp::judged_stale(&ts, &change) {
                        rep.flag(
                            "ERF-47",
                            &format!("{}/finding_audit/{i}", d.rel),
                            "audit is older than the last change to the atom it judged",
                        );
                    }
                }
            }
        }

        // ERF-47 for evidence_audit: what it judged is the statement and the
        // atoms cited (section 4.4: "an atom added to either list, a cited atom
        // modified, the statement edited").
        if rt == RecordType::Claim {
            if let Some(a) = d.arr("evidence_audit") {
                let mut changes: Vec<(String, Stamp)> = Vec::new();
                if let Some(ch) = last_change(d) {
                    changes.push(("the statement".into(), ch));
                }
                for f in ["atoms_for", "atoms_against"] {
                    if let Some(ids) = d.arr(f) {
                        for v in ids {
                            if let Some(id) = v.as_str() {
                                if let Some(at) = by_id.get(id) {
                                    if let Some(ch) = last_change(at) {
                                        changes.push((format!("cited atom `{id}`"), ch));
                                    }
                                }
                            }
                        }
                    }
                }
                for (i, e) in a.iter().enumerate() {
                    let Some(Ok(ts)) = s(e.get("timestamp")).map(Stamp::parse) else { continue };
                    for (what, ch) in &changes {
                        if Stamp::judged_stale(&ts, ch) {
                            rep.flag(
                                "ERF-47",
                                &format!("{}/evidence_audit/{i}", d.rel),
                                format!("backing audit is older than the last change to {what}"),
                            );
                        }
                    }
                }
            }
            // ERF-20.
            if let Some(a) = d.arr("standings") {
                for (i, e) in a.iter().enumerate() {
                    if e.get("evidence_at_stance").is_none() {
                        rep.flag(
                            "ERF-20",
                            &format!("{}/standings/{i}", d.rel),
                            "no `evidence_at_stance`: which evidence the ruler faced cannot be recovered later",
                        );
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 4.5 The survey
// ---------------------------------------------------------------------------

fn surveys(c: &CorpusCtx, rep: &mut Report) {
    let categories = [
        "web search", "search", "internet search", "google", "web", "llm",
        "ai search", "manual search", "grep", "literature review", "reading",
    ];
    for d in c.loaded.docs.iter().filter(|d| d.rtype == Some(RecordType::Survey)) {
        if let Some(a) = d.arr("searches") {
            for (i, act) in a.iter().enumerate() {
                if let Some(t) = s(act.get("tool")) {
                    let low = t.trim().to_ascii_lowercase();
                    if categories.contains(&low.as_str()) {
                        rep.flag(
                            "ERF-26",
                            &format!("{}/searches/{i}", d.rel),
                            format!("`tool: {t}` reads as a category, not a concrete instrument; yields are comparable only where instruments are named"),
                        );
                    }
                }
            }
        }
        // ERF-28: a re-run "SHOULD name its predecessor in `prior_survey`, and
        // its id SHOULD end with the conducted date".
        if d.front.get("prior_survey").is_some() {
            let conducted = d
                .front
                .get("conducted")
                .and_then(|v| s(v.get("timestamp")))
                .map(|t| t.chars().take(10).collect::<String>())
                .unwrap_or_default();
            if let Some(id) = d.id() {
                if !conducted.is_empty() && !id.ends_with(&conducted) {
                    rep.flag(
                        "ERF-28",
                        &d.rel,
                        format!("a re-run's id SHOULD end with the conducted date (`{conducted}`)"),
                    );
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 4.6 The narrative: ERF-31, ERF-32, ERF-33, ERF-34, YAMLB-1
// ---------------------------------------------------------------------------

fn narratives(c: &CorpusCtx, rep: &mut Report, mode: FoldMode) {
    let claim_lm: BTreeMap<String, Option<Stamp>> = c
        .loaded
        .docs
        .iter()
        .filter(|d| d.rtype == Some(RecordType::Claim))
        .filter_map(|d| {
            d.id().map(|i| {
                (
                    i.to_string(),
                    d.front
                        .get("last_modified")
                        .and_then(|v| s(v.get("timestamp")))
                        .and_then(|t| Stamp::parse(t).ok()),
                )
            })
        })
        .collect();

    for d in c.loaded.docs.iter().filter(|d| d.rtype == Some(RecordType::Narrative)) {
        let cands = nbinding::candidates(&d.body);
        let mut passage_start = 0usize;
        for cand in &cands {
            let line = 1 + d.body[..cand.start].matches('\n').count();
            let loc = format!("{}:{}", d.rel, line);
            match &cand.parsed {
                Err(e) => {
                    // "A candidate that fails the binding's grammar is not a
                    // binding, closes no passage, and MUST be reported rather
                    // than skipped: a binding dropped in silence makes the
                    // claims it named vanish from the narrative."
                    rep.violation_binding(
                        "YAMLB-1",
                        &loc,
                        format!(
                            "candidate narrative binding is not one ({e}); it closes no passage{}: {}",
                            if cand.unterminated { ", and extends only to the end of its own line so the bindings after it stay visible" } else { "" },
                            trunc(&cand.text)
                        ),
                    );
                }
                Ok(b) => {
                    let passage = &d.body[passage_start..cand.start];
                    passage_start = cand.end;

                    for id in &b.ids {
                        match c.index.records.get(id).and_then(|v| v.first()) {
                            None => {
                                rep.violation(
                                    "ERF-31",
                                    &loc,
                                    format!("narrative binding names `{id}`, which resolves to no record"),
                                );
                                rep.flag(
                                    "ERF-33",
                                    &loc,
                                    format!("reported rather than dropped: `{id}` resolves to nothing and no record is invented for it"),
                                );
                                rep.flag(
                                    "ERF-32",
                                    &loc,
                                    format!("staleness of the binding on `{id}` is indeterminate; a check that cannot tell says look, never rest"),
                                );
                            }
                            Some((RecordType::Claim, _)) => {}
                            Some((got, _)) => rep.violation(
                                "ERF-31",
                                &loc,
                                format!("narrative binding names `{id}`, which resolves to a {}; every id MUST resolve to a claim", got.as_str()),
                            ),
                        }
                    }

                    // "the anchor MUST occur in its passage under the test a
                    // quote meets (ERF-52), the fold and whole words... A
                    // validator MUST flag an anchor that does not occur in its
                    // passage, a flag and not a violation."
                    let folded = norm::fold(passage, mode);
                    if !norm::quote_check(&b.anchor, &folded, mode).ok() {
                        rep.flag(
                            "ERF-31",
                            &loc,
                            format!("anchor does not occur in its passage under ERF-52: {}", trunc(&b.anchor)),
                        );
                    }

                    // ERF-32.
                    let Ok(bound) = Stamp::parse(&b.bound_at) else {
                        rep.violation_binding("YAMLB-1", &loc, format!("`bound-at={}` is not a calendar date", b.bound_at));
                        continue;
                    };
                    for id in &b.ids {
                        match claim_lm.get(id) {
                            Some(Some(lm)) => {
                                if Stamp::judged_stale(&bound, lm) {
                                    rep.flag(
                                        "ERF-32",
                                        &loc,
                                        format!("stale: `{id}` carries a `last_modified` later than `bound-at={}`", b.bound_at),
                                    );
                                }
                            }
                            Some(None) => {}
                            None => {}
                        }
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// ERF-36, ERF-38
// ---------------------------------------------------------------------------

fn deployment_wide(dep: &Deployment, rep: &mut Report) {
    let mut all: BTreeMap<String, Vec<(RecordType, String)>> = BTreeMap::new();
    for c in &dep.corpora {
        for (id, v) in &c.index.records {
            all.entry(id.clone()).or_default().extend(
                v.iter().map(|(t, r)| (*t, format!("{}/{}", c.label, r))),
            );
        }
    }
    for (id, wheres) in &all {
        if wheres.len() > 1 {
            rep.violation(
                "ERF-38",
                &wheres[0].1,
                format!(
                    "record id `{id}` is held by {} records ({}); ids are unique across every corpus in the deployment regardless of type (ERF-36)",
                    wheres.len(),
                    wheres.iter().map(|(t, r)| format!("{} {r}", t.as_str())).collect::<Vec<_>>().join(", ")
                ),
            );
        }
    }
}

// ---------------------------------------------------------------------------
// Section 2's naming duty
// ---------------------------------------------------------------------------

fn naming_duty(dep: &Deployment, rep: &mut Report) {
    let partial = dep.corpora.len() == 1;
    if partial {
        for r in ["ERF-35", "ERF-36", "ERF-38"] {
            rep.unperformed(
                r,
                "PARTIAL: run over one corpus. Ids are deployment-unique and this validator saw one corpus, so a clash with a sibling corpus is unchecked.",
            );
        }
    }
    for (req, why) in UNPERFORMED {
        rep.unperformed(req, *why);
    }
}

/// Every requirement this validator does not check, or checks only in part,
/// with the reason. Section 2: "A validator MUST name the requirements it does
/// not check."
pub const UNPERFORMED: &[(&str, &str)] = &[
    ("ERF-2", "PARTIAL: raw-file immutability (\"a revision arriving later MUST be a new source, never an overwrite\") needs the substrate's history, which a corpus directory does not carry."),
    ("ERF-6", "PARTIAL: the producer's act (\"MUST take a quote from the normalized text by copying... and MUST NOT regenerate it\") is not observable from the corpus. What is checked is its trace: a quote that needs step 2 of the fold to match is flagged."),
    ("ERF-8", "PARTIAL: \"`citation_text` MUST be rendered from it\" needs a CSL processor and the Chicago style; this tool holds neither and makes no network call. Only the presence of the citation's title, author family names and year in `citation_text` is checked, as flags."),
    ("ERF-9", "The grade is a judgment about an attester and a chain. Only the enum and the medium/low-owes-`limitations` advice are checked."),
    ("ERF-10", "\"assessed against the substance the finding conveys\" is a reading of the finding against its source; not decidable from the corpus."),
    ("ERF-11", "PARTIAL: the audited judgment (\"does the quote, in context, support the finding?\") is by construction not recomputable. Only the entry's shape, the auditor-is-not-an-Actor reading, and the not-stored rule are checked."),
    ("ERF-12", "PARTIAL: \"a failed, unparseable or abandoned audit MUST NOT be written as one\" is a fact about a run this tool never saw. Only the vocabulary is checked."),
    ("ERF-13", "PARTIAL: permanence (\"never renamed and never reused\") needs the substrate's history. Only the id's shape is checked, and as a flag, because the schema's `Id` admits any non-whitespace string."),
    ("ERF-14", "PARTIAL: \"at the precision the source gave and no finer\" needs the source read by a person. Only the shape is checked."),
    ("ERF-18", "PARTIAL: \"`title` MUST state the claim\" is a judgment. Only the SHOULD about the body's opening restatement is checked, as a flag."),
    ("ERF-19", "PARTIAL: append-only (\"entries MUST NOT be edited or deleted\") is verified against the substrate's history (ERF-40), which this tool does not read. Only the instant-precision half is checked."),
    ("ERF-22", "PARTIAL: \"A claim MUST NOT store a state field\" is enforced structurally by the schema's closed property set; only an `x_` field whose name reads as a state is flagged."),
    ("ERF-23", "\"Evidence against a claim MUST NOT be modeled as a rival claim\" needs a reading of two claims' meanings."),
    ("ERF-24", "PARTIAL: whether the backing audit asked the question the kind sets is not in the record. Only the premise sources and the bet/commitment-owes-nothing rule are checked."),
    ("ERF-25", "PARTIAL: which claims are universal negatives is a reading of their titles. A heuristic flag only; the scoped-audit obligation itself is unchecked."),
    ("ERF-26", "PARTIAL: whether a `query` is in the instrument's own terms is a judgment. Only a category-shaped `tool` is flagged."),
    ("ERF-27", "PARTIAL: \"MUST NOT state precision the instrument did not give\" needs the instrument's own output. Only the text type is checked."),
    ("ERF-28", "PARTIAL: \"`searches` and each act's reported yield MUST NOT change after the fact\" needs the substrate's history. \"The `title` MUST state what was sought\" is a judgment."),
    ("ERF-31", "PARTIAL: \"A passage that asserts something SHOULD end with a narrative binding\" needs a reading of which passages assert. Unbound passages are not counted."),
    ("ERF-37", "A producer's act before writing (\"MUST verify that an id is unused in the deployment\"), not a state of the corpus. ERF-38's detection is what a validator can do."),
    ("ERF-40", "Append-only \"verified against the substrate's history\": this tool reads a directory, not a history. Nothing here can tell an appended ledger from a rewritten one."),
    ("ERF-42", "A consumer's rendering duty (`rejected` and `retired` not presented identically). This tool computes and names each disposition distinctly and asserts nothing about other consumers."),
    ("ERF-50", "PARTIAL: \"MUST run as a gate at minting and after any transform that moves atoms between homes\" is a fact about a producer's pipeline. The check's re-runnability is what is exercised here."),
    ("ERF-51", "PARTIAL: the case files `erf-cases-normalization.txt` and `erf-cases-quote-check.txt` are named normative for the sequence's exact behaviour (\"where a reading of the prose and a case disagree, the case governs\"). This implementation was built from the prose alone and has never been run against them."),
    ("ERF-53", "Round-tripping a corpus through the model without loss is a property of a binding implementation, not of a corpus; a validator reading one binding cannot observe it."),
    ("ERF-56", "Implemented as this tool's own behaviour (an omitted list is materialized as empty), not as a check over the corpus."),
    ("ERF-57", "Implemented as this tool's own behaviour: unknown fields and unknown record types are preserved and reported, and no corpus is rejected solely for holding them."),
    ("ERF-62", "\"A corpus MUST have exactly one authoritative home\" is a fact about a deployment's arrangements, not about the bytes in a directory."),
    ("ERF-63", "A statement of what a substrate MAY be; nothing to check."),
    ("ERF-68", "PARTIAL: SPDX governs its own list and this tool holds a hand-written slice of it, offline. An identifier outside that slice is flagged, never rejected. \"a text shipping under no licence as a short quotation MUST carry `status: shipped-as-quotation`\" needs the licence facts, which are not in the corpus."),
    ("ERF-69", "PARTIAL: excerpt fidelity (\"the normalized text MUST occur, under the folding of ERF-51, in the normalization of the whole extracted source\") needs the raw file and the extraction tool of ERF-70. Only the degenerate case, a normalized text that is the quote and nothing else, is flagged. Whether a text is an excerpt at all is not stated in the record."),
    ("ERF-70", "PARTIAL: \"that tool MUST be deterministic\" cannot be established without running it twice. Only the presence of a version-bearing tool name is checked, and only where the raw file's extension suggests a conversion happened."),
    ("ERF-71", "PARTIAL: confirming the digest against the artifact at `received.url` needs a network fetch, which ERF-1 forbids a check from making. Digests are verified only against bytes the corpus itself holds."),
    ("ERF-72", "Implemented as this tool's behaviour: `x_` fields are reported as unknown and never counted under ERF-55."),
];
