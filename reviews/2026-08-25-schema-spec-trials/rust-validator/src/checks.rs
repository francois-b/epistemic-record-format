//! Every machine-checkable MUST the validator runs, requirement by requirement.
//! README.md carries the same list in prose; ambiguities.md carries the readings.

use crate::fold::{self, QuoteVerdict};
use crate::load::Corpus;
use crate::model::*;
use crate::narrative;
use crate::report::Reporter;
use crate::schema::Schemas;
use crate::util::{compare, parse_stamp, Ord3, Stamp};
use serde_json::Value;
use sha2::{Digest as _, Sha256};

fn sha256_hex(bytes: &[u8]) -> String {
    let d = Sha256::digest(bytes);
    let mut out = String::from("sha256:");
    for b in d.iter() {
        out.push_str(&format!("{:02x}", b));
    }
    out
}
use std::collections::{BTreeMap, BTreeSet, HashMap};

pub struct RecRef {
    pub corpus: usize,
    pub file: usize,
    pub kind: FileKind,
    pub rel: String,
}

pub struct Deployment {
    pub corpora: Vec<Corpus>,
    /// record id -> every file claiming it
    pub ids: BTreeMap<String, Vec<RecRef>>,
    /// corpus id -> declaring file
    pub declared: BTreeMap<String, String>,
    /// (corpus index) -> folded normalized text per source id, or the reason it is unavailable
    pub texts: HashMap<(usize, String), Result<Vec<char>, String>>,
}

fn last_change(v: &Value) -> Option<Stamp> {
    let (lm, _) = stamp_of(v, "last_modified");
    if lm.is_some() {
        return lm;
    }
    let (c, _) = stamp_of(v, "created");
    c
}

fn text_like(p: &std::path::Path) -> bool {
    matches!(
        p.extension().and_then(|e| e.to_str()).unwrap_or(""),
        "md" | "markdown" | "txt" | "text" | ""
    )
}

// ===========================================================================

pub fn run(corpora: Vec<Corpus>, schemas: &Schemas, rep: &mut Reporter) -> Deployment {
    let mut dep = Deployment {
        corpora,
        ids: BTreeMap::new(),
        declared: BTreeMap::new(),
        texts: HashMap::new(),
    };

    index(&mut dep, rep);
    schema_pass(&dep, schemas, rep);
    empty_lists_and_extensions(&dep, rep);
    declaration_pass(&dep, rep);
    sources_pass(&mut dep, rep);
    atoms_pass(&dep, rep);
    claims_pass(&dep, rep);
    surveys_pass(&dep, rep);
    references_pass(&dep, rep);
    graph_pass(&dep, rep);
    narratives_pass(&dep, rep);
    unperformed(&dep, rep);
    dep
}

// --- indexing, ERF-36 / ERF-38 ---------------------------------------------

fn index(dep: &mut Deployment, rep: &mut Reporter) {
    for ci in 0..dep.corpora.len() {
        for fi in 0..dep.corpora[ci].files.len() {
            let f = &dep.corpora[ci].files[fi];
            let Some(kind) = f.kind else {
                // ERF-57: "A consumer MUST preserve unknown fields and unknown
                // record types as opaque data, MUST report them". ERF-55:
                // a producer originates nothing the declared version does not
                // define. Detection belongs to the validator (ERF-57).
                rep.violation(
                    "ERF-55",
                    &f.rel,
                    format!(
                        "`type: {}` is not one of the six the model defines; a consumer \
                         preserves it, a validator reports it",
                        f.raw_type
                    ),
                );
                continue;
            };
            if matches!(kind, FileKind::CorpusDecl) {
                if let Some(id) = s(&f.value, "id") {
                    let rel = f.rel.clone();
                    if let Some(prev) = dep.declared.insert(id.clone(), rel.clone()) {
                        rep.violation(
                            "ERF-54",
                            &rel,
                            format!("a second declaration of corpus `{}` (also {})", id, prev),
                        );
                    }
                }
                continue;
            }
            if matches!(kind, FileKind::SourceList | FileKind::Narrative) {
                continue;
            }
            if let Some(id) = s(&f.value, "id") {
                let rel = f.rel.clone();
                dep.ids.entry(id).or_default().push(RecRef {
                    corpus: ci,
                    file: fi,
                    kind,
                    rel,
                });
            }
        }
    }
    for (id, refs) in &dep.ids {
        if refs.len() > 1 {
            let where_ = refs
                .iter()
                .map(|r| format!("{} ({})", r.rel, r.kind.as_str()))
                .collect::<Vec<_>>()
                .join(", ");
            rep.violation(
                "ERF-38",
                "",
                format!(
                    "the id `{}` is held by {} records, regardless of type: {}",
                    id,
                    refs.len(),
                    where_
                ),
            );
        }
    }
    if dep.corpora.len() < 2 {
        rep.partial(
            "ERF-36",
            "deployment-unique ids checked over one corpus only; a deployment is \
             \"the set of corpora read and cited together\" and this run saw one",
        );
        rep.partial(
            "ERF-38",
            "duplicate-id rejection is deployment-wide and this run saw one corpus",
        );
        rep.partial(
            "ERF-35",
            "reference resolution is deployment-wide (\"MUST resolve within the \
             deployment\") and this run saw one corpus; an unresolved id here may \
             resolve in a sibling corpus",
        );
    }
}

// --- the data model ---------------------------------------------------------

fn schema_pass(dep: &Deployment, schemas: &Schemas, rep: &mut Reporter) {
    for c in &dep.corpora {
        for f in &c.files {
            let Some(kind) = f.kind else { continue };
            for sf in crate::schema::validate(schemas, kind, &f.value) {
                if sf.is_scalar_type_error {
                    rep.violation(
                        "ERF-65",
                        &f.rel,
                        format!(
                            "a string-typed field arrived as another type: {}",
                            sf.message
                        ),
                    );
                } else {
                    rep.violation(sf.req, &f.rel, sf.message);
                }
            }
        }
    }
}

/// ERF-55 (empty lists omitted) and ERF-72 (the `x_` namespace).
fn empty_lists_and_extensions(dep: &Deployment, rep: &mut Reporter) {
    fn walk(v: &Value, path: &str, rel: &str, rep: &mut Reporter) {
        match v {
            Value::Array(a) => {
                if a.is_empty() {
                    rep.violation(
                        "ERF-55",
                        rel,
                        format!("`{}` is an empty list; empty lists MUST be omitted", path),
                    );
                }
                for (i, e) in a.iter().enumerate() {
                    walk(e, &format!("{}/{}", path, i), rel, rep);
                }
            }
            Value::Object(o) => {
                for (k, e) in o {
                    let p = format!("{}/{}", path, k);
                    if k.starts_with("x_") {
                        // ERF-72: "a validator MUST NOT report it under ERF-55"
                        rep.info("ERF-72", rel, format!("extension field `{}`", p));
                        continue;
                    }
                    walk(e, &p, rel, rep);
                }
            }
            _ => {}
        }
    }
    for c in &dep.corpora {
        for f in &c.files {
            if f.kind.is_none() {
                continue;
            }
            // `body` is a string; skip it so prose is not walked.
            let mut v = f.value.clone();
            if let Some(o) = v.as_object_mut() {
                o.remove("body");
            }
            walk(&v, "", &f.rel, rep);
        }
    }
}

// --- the declaration, ERF-59 / ERF-54 / ERF-17 / ERF-60 / ERF-61 -----------

fn declaration_pass(dep: &Deployment, rep: &mut Reporter) {
    for c in &dep.corpora {
        let decls: Vec<&File> = c
            .files
            .iter()
            .filter(|f| f.kind == Some(FileKind::CorpusDecl))
            .collect();
        let where_ = c.root.display().to_string();
        if decls.is_empty() {
            rep.violation(
                "ERF-59",
                &where_,
                "the corpus carries no declaration; exactly one file MUST carry `type: corpus`",
            );
            continue;
        }
        if decls.len() > 1 {
            rep.violation(
                "ERF-54",
                &where_,
                format!(
                    "{} files carry `type: corpus`; a validator MUST reject two declarations",
                    decls.len()
                ),
            );
        }
        let d = decls[0];
        let corpus_id = s(&d.value, "id").unwrap_or_default();
        if let Some(sv) = s(&d.value, "spec_version") {
            let parts: Vec<&str> = sv.split(['.', '-', '+']).collect();
            let major: u32 = parts.first().and_then(|p| p.parse().ok()).unwrap_or(0);
            let minor: u32 = parts.get(1).and_then(|p| p.parse().ok()).unwrap_or(0);
            if major != 0 {
                rep.violation(
                    "ERF-60",
                    &d.rel,
                    format!(
                        "this validator was built from spec 0.9.0 and does not support MAJOR \
                         version {}; refusing openly rather than guessing",
                        major
                    ),
                );
            } else if minor != 9 {
                rep.flag(
                    "ERF-60",
                    &d.rel,
                    format!(
                        "declared spec_version {} is a MINOR version this validator was not \
                         built from (0.9.0); unrecognized content is preserved and reported, \
                         never dropped",
                        sv
                    ),
                );
            }
        }
        // Source list, ERF-3
        let lists: Vec<&File> = c
            .files
            .iter()
            .filter(|f| f.kind == Some(FileKind::SourceList))
            .collect();
        if lists.is_empty() {
            rep.violation(
                "ERF-3",
                &where_,
                "the corpus keeps no source list; a corpus MUST keep one, one entry per work",
            );
        } else if lists.len() > 1 {
            rep.flag(
                "ERF-3",
                &where_,
                format!(
                    "{} files carry `type: sources`; the requirement says \"a source list\" \
                     and the binding shows one, so source ids are checked for uniqueness \
                     across all of them",
                    lists.len()
                ),
            );
        }

        // ERF-17: `corpus` MUST name a declared corpus.
        for f in &c.files {
            if !matches!(
                f.kind,
                Some(FileKind::Atom)
                    | Some(FileKind::Claim)
                    | Some(FileKind::Survey)
                    | Some(FileKind::Narrative)
            ) {
                continue;
            }
            let Some(named) = s(&f.value, "corpus") else {
                continue;
            };
            if !dep.declared.contains_key(&named) {
                rep.violation(
                    "ERF-17",
                    &f.rel,
                    format!("`corpus: {}` names no declared corpus in this run", named),
                );
            } else if named != corpus_id {
                rep.flag(
                    "ERF-17",
                    &f.rel,
                    format!(
                        "`corpus: {}` is declared elsewhere in the deployment, not by the \
                         declaration holding this file (`{}`)",
                        named, corpus_id
                    ),
                );
            }
        }
    }
}

// --- sources, ERF-1 / 2 / 4 / 5 / 7 / 68 / 70 / 71 -------------------------

fn sources_pass(dep: &mut Deployment, rep: &mut Reporter) {
    let mut seen_ids: Vec<(usize, String, String)> = Vec::new();
    let mut collected: Vec<(usize, String, Value, std::path::PathBuf, String)> = Vec::new();

    for c in &dep.corpora {
        for f in &c.files {
            if f.kind != Some(FileKind::SourceList) {
                continue;
            }
            let dir = f.abs.parent().unwrap_or(&c.root).to_path_buf();
            let Some(map) = f.value.get("sources").and_then(|v| v.as_object()) else {
                continue;
            };
            for (sid, src) in map {
                if let Some((_, _, prev)) =
                    seen_ids.iter().find(|(ci, s, _)| *ci == c.index && s == sid)
                {
                    rep.violation(
                        "ERF-3",
                        &f.rel,
                        format!(
                            "source id `{}` is not unique within the corpus (also {})",
                            sid, prev
                        ),
                    );
                }
                seen_ids.push((c.index, sid.clone(), f.rel.clone()));
                collected.push((c.index, sid.clone(), src.clone(), dir.clone(), f.rel.clone()));
            }
        }
    }

    for (ci, sid, src, dir, rel) in collected {
        let at = format!("{} [{}]", rel, sid);
        let status = s(&src, "status").and_then(|x| SourceStatus::parse(&x));
        let ships = matches!(
            status,
            Some(SourceStatus::Shipped) | Some(SourceStatus::ShippedAsQuotation)
        );

        // ERF-1: the normalized text MUST exist before any check runs against it.
        if ships {
            match s(&src, "normalized") {
                None => {
                    dep.texts.insert(
                        (ci, sid.clone()),
                        Err("the source names no normalized text".into()),
                    );
                }
                Some(np) => {
                    let full = dir.join(&np);
                    match std::fs::read(&full) {
                        Err(e) => {
                            rep.violation(
                                "ERF-1",
                                &at,
                                format!(
                                    "the normalized text `{}` does not exist, so no check can \
                                     run against it: {}",
                                    np, e
                                ),
                            );
                            dep.texts
                                .insert((ci, sid.clone()), Err("the file is not held".into()));
                        }
                        Ok(bytes) => {
                            if let Some(d) = s(&src, "normalized_digest") {
                                let got = sha256_hex(&bytes);
                                if got != d {
                                    rep.flag(
                                        "ERF-53",
                                        &at,
                                        format!(
                                            "`normalized_digest` does not match the bytes held \
                                             ({} on disk); no requirement makes the digest \
                                             binding, so this is a flag",
                                            got
                                        ),
                                    );
                                }
                            }
                            match String::from_utf8(bytes) {
                                Err(_) => {
                                    dep.texts.insert(
                                        (ci, sid.clone()),
                                        Err("the normalized text is not UTF-8 text".into()),
                                    );
                                }
                                Ok(t) => {
                                    if t.chars().any(|c| {
                                        c == '\u{0}'
                                            || (c.is_control() && c != '\n' && c != '\r' && c != '\t')
                                    }) {
                                        dep.texts.insert(
                                            (ci, sid.clone()),
                                            Err("the normalized text is not text or markdown"
                                                .into()),
                                        );
                                    } else {
                                        dep.texts.insert(
                                            (ci, sid.clone()),
                                            Ok(fold::fold(&t).chars().collect()),
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            dep.texts.insert(
                (ci, sid.clone()),
                Err(format!(
                    "the source records an absence (`status: {}`)",
                    s(&src, "status").unwrap_or_default()
                )),
            );
        }

        // ERF-68
        if status == Some(SourceStatus::Shipped) {
            if src.get("licence").is_none() {
                rep.flag(
                    "ERF-68",
                    &at,
                    "a source whose normalized text ships SHOULD name its licence; absent, \
                     it is unclear whether `status: shipped-as-quotation` was owed \
                     instead",
                );
            } else if src.get("licence_name").is_none() {
                rep.flag(
                    "ERF-68",
                    &at,
                    "`licence` is named without the plain name alongside",
                );
            }
        }

        // ERF-2 / ERF-71 / ERF-70
        let received = src.get("received");
        let url = received.and_then(|r| s(r, "url"));
        let rpath = received.and_then(|r| s(r, "path"));
        let rts = received.and_then(|r| r.get("timestamp")).is_some();
        let digest = received.and_then(|r| s(r, "digest"));

        if url.is_some() && !rts {
            rep.flag(
                "ERF-2",
                &at,
                "`received.url` without `received.timestamp`: nothing says which version was \
                 read. Whether the artifact is mutable at its location is a judgment the \
                 corpus does not carry, so this is a flag and not a violation",
            );
        }
        if let Some(rp) = &rpath {
            let full = dir.join(rp);
            if !full.exists() {
                rep.flag(
                    "ERF-2",
                    &at,
                    format!("`received.path` names `{}`, which the corpus does not hold", rp),
                );
            } else if let Some(d) = &digest {
                let Ok(bytes) = std::fs::read(&full) else {
                    continue;
                };
                let got = sha256_hex(&bytes);
                if &got != d {
                    rep.violation(
                        "ERF-71",
                        &at,
                        format!(
                            "`received.digest` does not match the raw file held ({} on disk); \
                             the digest is what lets a reader confirm the same bytes",
                            got
                        ),
                    );
                }
            }
        }

        let extraction = s(&src, "extraction");
        let raw_is_text = match (&rpath, &url) {
            (Some(p), _) => Some(text_like(std::path::Path::new(p))),
            (None, Some(u)) => {
                let tail = u.split(['?', '#']).next().unwrap_or(u);
                Some(text_like(std::path::Path::new(tail)))
            }
            (None, None) => None,
        };
        match (raw_is_text, &extraction, ships) {
            (Some(false), None, true) => rep.violation(
                "ERF-70",
                &at,
                "the raw file is not text, so normalized text was produced from another \
                 format and the extracting tool and its exact version MUST be named",
            ),
            (Some(true), Some(t), _) => rep.flag(
                "ERF-70",
                &at,
                format!(
                    "`extraction: {}` on a source that arrived as text; both fields are \
                     absent when the step did not happen",
                    t
                ),
            ),
            (None, None, true) => rep.unperformed(
                "ERF-70",
                format!(
                    "{}: the source records no raw file, so whether extraction was owed is \
                     not decidable from the corpus",
                    at
                ),
            ),
            _ => {}
        }

        let is_excerpt = src.get("excerpt").is_some();
        if (is_excerpt || extraction.is_some()) && digest.is_none() {
            rep.flag(
                "ERF-71",
                &at,
                "an excerpt or a conversion SHOULD carry `received.digest`; without it the \
                 conversion step cannot be re-run against known bytes",
            );
        }

        // ERF-7, beyond what the schema's `://` test catches.
        if let Some(ct) = s(&src, "citation_text") {
            let l = ct.to_lowercase();
            if l.contains("www.")
                || l.contains(".com/")
                || l.contains(".org/")
                || l.contains("doi.org")
            {
                rep.flag(
                    "ERF-7",
                    &at,
                    "`citation_text` looks like it carries a locator; the schema's test is \
                     `://` alone, which a bare domain passes",
                );
            }
        }
    }
}

// --- atoms ------------------------------------------------------------------

fn atoms_pass(dep: &Deployment, rep: &mut Reporter) {
    // ERF-69: a normalized text that holds a quote and nothing else proves nothing.
    let mut quote_by_source: HashMap<(usize, String), Vec<String>> = HashMap::new();

    for c in &dep.corpora {
        for f in &c.files {
            if f.kind != Some(FileKind::Atom) {
                continue;
            }
            let v = &f.value;
            let id = s(v, "id").unwrap_or_default();

            // ERF-13, the shape half.
            if !id.is_empty() {
                let ok = id
                    .rsplit_once('-')
                    .map(|(p, n)| !p.is_empty() && !n.is_empty() && n.bytes().all(|b| b.is_ascii_digit()))
                    .unwrap_or(false);
                if !ok {
                    rep.flag(
                        "ERF-13",
                        &f.rel,
                        format!(
                            "`id: {}` is not the stated shape, \"a mint-time prefix and a \
                             sequence number (kwg-117)\"; the schema's `Id` pattern permits \
                             it, so the two disagree and this is a flag",
                            id
                        ),
                    );
                }
            }

            // ERF-48
            check_last_modified(v, &f.rel, rep);

            // ERF-9 / ERF-10 guidance
            match s(v, "source_quality").and_then(|x| SourceQuality::parse(&x)) {
                Some(SourceQuality::Medium) | Some(SourceQuality::Low) => {
                    if v.get("limitations").is_none() {
                        rep.flag(
                            "ERF-9",
                            &f.rel,
                            "`source_quality` is medium or low with no `limitations`: a reader \
                             learns that something is thin and not what",
                        );
                    }
                }
                _ => {}
            }

            // ERF-47, the finding audit against the atom it judged.
            let change = last_change(v);
            for a in audits_of(v, "finding_audit") {
                staleness(rep, "ERF-47", &f.rel, &a.timestamp, &change, &format!(
                    "the finding audit by `{}` under `{}`", a.auditor, a.protocol));
            }

            // ERF-4 and the quote check.
            let Some(src_id) = s(v, "source") else { continue };
            let key = (c.index, src_id.clone());
            let Some(text) = dep.texts.get(&key) else {
                rep.violation(
                    "ERF-4",
                    &f.rel,
                    format!(
                        "`source: {}` names no entry in the corpus's source list",
                        src_id
                    ),
                );
                continue;
            };
            let Some(quote) = s(v, "quote") else { continue };

            // ERF-6, the elision spelling.
            let stripped = quote.replace("[...]", "");
            if stripped.contains("...") || stripped.contains('…') {
                rep.flag(
                    "ERF-6",
                    &f.rel,
                    "the quote carries a bare `...` or `…` outside an elision marker; under \
                     ERF-52 that is a literal source character and is checked as one",
                );
            }

            match text {
                Err(why) => {
                    // ERF-51: "it MUST report the check as unavailable rather
                    // than pass or fail it".
                    rep.unperformed(
                        "ERF-50",
                        format!(
                            "{}: the quote check is unavailable — {}",
                            f.rel, why
                        ),
                    );
                }
                Ok(folded) => {
                    quote_by_source
                        .entry(key.clone())
                        .or_default()
                        .push(quote.clone());
                    match fold::check_quote_folded(&quote, folded) {
                        QuoteVerdict::Ok => {}
                        QuoteVerdict::Fail(why) => rep.violation(
                            "ERF-52",
                            &f.rel,
                            format!("the quote is not verbatim from the normalized text: {}", why),
                        ),
                    }
                }
            }
        }
    }

    // ERF-69's checkable sliver.
    for ((ci, sid), quotes) in &quote_by_source {
        let Some(Ok(text)) = dep.texts.get(&(*ci, sid.clone())) else {
            continue;
        };
        let tlen = text.len();
        for q in quotes {
            let qlen = fold::fold(q).chars().count();
            if qlen == 0 {
                continue;
            }
            if qlen == tlen {
                rep.violation(
                    "ERF-69",
                    &format!("source `{}`", sid),
                    "the normalized text holds the quoted passage and nothing else, which \
                     \"proves nothing, because it is a copy of the thing it is meant to check\"",
                );
            } else if (tlen as f64) < 1.5 * (qlen as f64) {
                rep.flag(
                    "ERF-69",
                    &format!("source `{}`", sid),
                    format!(
                        "the normalized text ({} characters folded) is barely longer than a \
                         quote it carries ({}); ERF-69 wants \"enough adjacent text for the \
                         passage's place in the work to be legible\"",
                        tlen, qlen
                    ),
                );
            }
        }
    }
}

// --- ERF-48 ----------------------------------------------------------------

fn check_last_modified(v: &Value, rel: &str, rep: &mut Reporter) {
    let (created, _) = stamp_of(v, "created");
    let (lm, lmraw) = stamp_of(v, "last_modified");
    let (Some(c), Some(l)) = (created, lm) else {
        return;
    };
    match compare(&l, &c) {
        Ord3::Less => rep.violation(
            "ERF-48",
            rel,
            format!(
                "`last_modified` ({}) is earlier than `created`",
                lmraw
            ),
        ),
        Ord3::Equal if l.is_instant() => rep.flag(
            "ERF-48",
            rel,
            "`last_modified` is the same instant as `created`; at instant precision \
             \"later\" does not admit the same instant",
        ),
        _ => {}
    }
}

// --- ERF-47 -----------------------------------------------------------------

fn staleness(
    rep: &mut Reporter,
    req: &str,
    rel: &str,
    judged_at: &Option<Stamp>,
    changed_at: &Option<Stamp>,
    what: &str,
) {
    let (Some(j), Some(ch)) = (judged_at, changed_at) else {
        rep.flag(
            req,
            rel,
            format!("{} cannot be ordered against the change it judged", what),
        );
        return;
    };
    match compare(j, ch) {
        Ord3::Less => rep.flag(req, rel, format!("{} is stale: it is older than the last change to what it judged", what)),
        // "Where the two stamps differ in precision and the coarser one cannot
        //  order them [...] the comparison MUST resolve to stale."
        Ord3::Indeterminate => rep.flag(
            req,
            rel,
            format!(
                "{} is stale: it and the last change to what it judged fall on the same day \
                 at differing precision, and a check that cannot tell says look",
                what
            ),
        ),
        Ord3::Equal | Ord3::Greater => {}
    }
}

// --- claims -----------------------------------------------------------------

pub fn dispositions(dep: &Deployment, rep: &mut Reporter) -> HashMap<String, Disposition> {
    let mut out = HashMap::new();
    for c in &dep.corpora {
        for f in &c.files {
            if f.kind != Some(FileKind::Claim) {
                continue;
            }
            let id = s(&f.value, "id").unwrap_or_default();
            out.insert(id, disposition_of(&f.value, &f.rel, rep));
        }
    }
    out
}

/// ERF-41, in full.
fn disposition_of(v: &Value, rel: &str, rep: &mut Reporter) -> Disposition {
    let entries = standings_of(v);
    // per person, the newest admissible entry
    let mut newest: BTreeMap<String, (Stamp, usize, Stance)> = BTreeMap::new();
    for e in &entries {
        match e.admissible() {
            Err(why) => {
                rep.violation(
                    "ERF-41",
                    rel,
                    format!(
                        "standing entry {} is inadmissible and is treated as never written: {}",
                        e.index, why
                    ),
                );
            }
            Ok((stance, ts)) => {
                match newest.get(&e.by) {
                    None => {
                        newest.insert(e.by.clone(), (ts, e.index, stance));
                    }
                    Some((prev_ts, prev_idx, _)) => {
                        match compare(&ts, prev_ts) {
                            Ord3::Greater => {
                                newest.insert(e.by.clone(), (ts, e.index, stance));
                            }
                            Ord3::Equal => {
                                // "Where one person's newest entries share an
                                //  instant, the later in the ledger is current
                                //  and a validator MUST flag the collision".
                                rep.flag(
                                    "ERF-41",
                                    rel,
                                    format!(
                                        "entries {} and {} by `{}` share an instant; the later \
                                         in the ledger is current",
                                        prev_idx, e.index, e.by
                                    ),
                                );
                                newest.insert(e.by.clone(), (ts, e.index, stance));
                            }
                            Ord3::Indeterminate => {
                                // Unreachable: every admissible entry is an instant.
                                rep.flag(
                                    "ERF-41",
                                    rel,
                                    format!("entries {} and {} by `{}` cannot be ordered", prev_idx, e.index, e.by),
                                );
                            }
                            Ord3::Less => {}
                        }
                    }
                }
            }
        }
        // ERF-20
        if e.evidence_at_stance.is_none() {
            rep.flag(
                "ERF-20",
                rel,
                format!(
                    "standing entry {} carries no `evidence_at_stance`; which evidence the \
                     ruler faced cannot be recovered later",
                    e.index
                ),
            );
        }
        // ERF-39 is *Shape*: the schema requires `why` with minLength 1 and a
        // `human:` `by`, and schema_pass reports both under ERF-39/ERF-21.
        let _ = e.why_present;
    }
    let current: Vec<Stance> = newest.values().map(|(_, _, st)| *st).collect();
    disposition(&current)
}

fn claims_pass(dep: &Deployment, rep: &mut Reporter) {
    for c in &dep.corpora {
        for f in &c.files {
            if f.kind != Some(FileKind::Claim) {
                continue;
            }
            let v = &f.value;
            check_last_modified(v, &f.rel, rep);

            // ERF-18
            let title = s(v, "title").unwrap_or_default();
            let body = f.body.clone().unwrap_or_default();
            let first_para = body
                .trim_start()
                .split("\n\n")
                .next()
                .unwrap_or("")
                .trim()
                .to_string();
            let norm = |x: &str| {
                x.split_whitespace().collect::<Vec<_>>().join(" ")
            };
            if body.trim().is_empty() {
                rep.flag(
                    "ERF-18",
                    &f.rel,
                    "the claim has no body; the body SHOULD open by restating the title and \
                     carries the working notes",
                );
            } else if norm(&first_para) != norm(&title) {
                rep.flag(
                    "ERF-18",
                    &f.rel,
                    "the body does not open with the title verbatim; keeping the restatement \
                     verbatim is what makes later drift visible",
                );
            }

            // ERF-24, on kinds that owe no backing.
            let kind = s(v, "epistemic_kind").and_then(|x| EpistemicKind::parse(&x));
            if matches!(kind, Some(EpistemicKind::Bet) | Some(EpistemicKind::Commitment))
                && v.get("evidence_audit").is_some()
            {
                rep.flag(
                    "ERF-24",
                    &f.rel,
                    "`bet` and `commitment` owe no backing, \"so they have nothing to audit\", \
                     yet the record carries an `evidence_audit`",
                );
            }

            // ERF-47, the backing audit against everything it judged.
            let mut change = last_change(v);
            for aid in id_list(v, "atoms_for")
                .into_iter()
                .chain(id_list(v, "atoms_against"))
            {
                if let Some(rf) = dep.ids.get(&aid).and_then(|r| r.first()) {
                    let av = &dep.corpora[rf.corpus].files[rf.file].value;
                    change = later(change, last_change(av));
                }
            }
            for sid in id_list(v, "surveys") {
                if let Some(rf) = dep.ids.get(&sid).and_then(|r| r.first()) {
                    let sv = &dep.corpora[rf.corpus].files[rf.file].value;
                    let (cond, _) = stamp_of(sv, "conducted");
                    change = later(change, later(last_change(sv), cond));
                }
            }
            for a in audits_of(v, "evidence_audit") {
                staleness(
                    rep,
                    "ERF-47",
                    &f.rel,
                    &a.timestamp,
                    &change,
                    &format!("the backing audit by `{}` under `{}`", a.auditor, a.protocol),
                );
            }
        }
    }
}

fn later(a: Option<Stamp>, b: Option<Stamp>) -> Option<Stamp> {
    match (a, b) {
        (Some(x), Some(y)) => Some(match compare(&x, &y) {
            Ord3::Less => y,
            // Indeterminate resolves toward the newer reading, which is what
            // makes ERF-47 say "stale".
            Ord3::Indeterminate => {
                if y.is_instant() {
                    y
                } else {
                    x
                }
            }
            _ => x,
        }),
        (Some(x), None) => Some(x),
        (None, b) => b,
    }
}

// --- surveys ----------------------------------------------------------------

fn surveys_pass(dep: &Deployment, rep: &mut Reporter) {
    for c in &dep.corpora {
        for f in &c.files {
            if f.kind != Some(FileKind::Survey) {
                continue;
            }
            let v = &f.value;
            check_last_modified(v, &f.rel, rep);
            let id = s(v, "id").unwrap_or_default();
            let (cond, cond_raw) = stamp_of(v, "conducted");
            if v.get("prior_survey").is_some() {
                let day = cond.map(|st| {
                    let (y, m, d) = st.day();
                    format!("{:04}-{:02}-{:02}", y, m, d)
                });
                if let Some(day) = day {
                    if !id.ends_with(&day) {
                        rep.flag(
                            "ERF-28",
                            &f.rel,
                            format!(
                                "a re-run's id SHOULD end with the conducted date; `{}` does \
                                 not end with `{}`",
                                id, day
                            ),
                        );
                    }
                }
            }
            // An act's own timestamp, where present, must be readable.
            if let Some(acts) = v.get("searches").and_then(|x| x.as_array()) {
                for (i, a) in acts.iter().enumerate() {
                    if let Some(t) = a.get("timestamp").and_then(|x| x.as_str()) {
                        if parse_stamp(t).is_err() {
                            rep.violation(
                                "ERF-28",
                                &f.rel,
                                format!("search act {}: `timestamp: {}` is not a date or an instant", i, t),
                            );
                        }
                    }
                }
            }
            let _ = cond_raw;
        }
    }
}

// --- ERF-35 -----------------------------------------------------------------

fn references_pass(dep: &Deployment, rep: &mut Reporter) {
    let resolve = |id: &str| -> Option<FileKind> {
        dep.ids.get(id).and_then(|r| r.first()).map(|r| r.kind)
    };
    for c in &dep.corpora {
        for f in &c.files {
            let v = &f.value;
            let check = |field: &str, ids: Vec<String>, want: FileKind, rep: &mut Reporter| {
                for id in ids {
                    match resolve(&id) {
                        None => rep.violation(
                            "ERF-35",
                            &f.rel,
                            format!(
                                "`{}` names `{}`, which resolves to no record in the deployment",
                                field, id
                            ),
                        ),
                        Some(k) if k != want => rep.violation(
                            "ERF-35",
                            &f.rel,
                            format!(
                                "`{}` names `{}`, which resolves to a {} and not a {}",
                                field,
                                id,
                                k.as_str(),
                                want.as_str()
                            ),
                        ),
                        Some(_) => {}
                    }
                    if id.contains('/') || id.ends_with(".md") || id.ends_with(".yaml") {
                        rep.flag(
                            "ERF-15",
                            &f.rel,
                            format!("`{}` names `{}`, which reads as a location", field, id),
                        );
                    }
                }
            };
            match f.kind {
                Some(FileKind::Claim) => {
                    check("atoms_for", id_list(v, "atoms_for"), FileKind::Atom, rep);
                    check(
                        "atoms_against",
                        id_list(v, "atoms_against"),
                        FileKind::Atom,
                        rep,
                    );
                    check("surveys", id_list(v, "surveys"), FileKind::Survey, rep);
                    for e in edges_of(v) {
                        check("edges.to", vec![e.to.clone()], FileKind::Claim, rep);
                    }
                    // "A reference recording a *past state* MUST NOT be a
                    //  violation when it fails to resolve, and a validator MUST
                    //  flag it instead" (ERF-35).
                    for st in standings_of(v) {
                        if let Some((fo, ag)) = st.evidence_at_stance {
                            for id in fo.into_iter().chain(ag) {
                                if resolve(&id).is_none() {
                                    rep.flag(
                                        "ERF-35",
                                        &f.rel,
                                        format!(
                                            "`evidence_at_stance` on entry {} names `{}`, which \
                                             resolves to nothing; it records what a ruler faced \
                                             then, so this is a flag",
                                            st.index, id
                                        ),
                                    );
                                }
                            }
                        }
                    }
                }
                Some(FileKind::Survey) => {
                    if let Some(p) = s(v, "prior_survey") {
                        check("prior_survey", vec![p], FileKind::Survey, rep);
                    }
                    if let Some(nr) = v.get("notable_results").and_then(|x| x.as_array()) {
                        for r in nr {
                            check(
                                "notable_results[].atoms",
                                id_list(r, "atoms"),
                                FileKind::Atom,
                                rep,
                            );
                        }
                    }
                }
                _ => {}
            }
        }
    }
}

// --- ERF-43 / ERF-44 / ERF-49 ----------------------------------------------

fn graph_pass(dep: &Deployment, rep: &mut Reporter) {
    let disp = dispositions(dep, rep);

    // claim id -> (kind, rel, edges)
    let mut claims: BTreeMap<String, (Option<EpistemicKind>, String, Vec<Edge>, Value)> =
        BTreeMap::new();
    for c in &dep.corpora {
        for f in &c.files {
            if f.kind != Some(FileKind::Claim) {
                continue;
            }
            let id = s(&f.value, "id").unwrap_or_default();
            claims.insert(
                id,
                (
                    s(&f.value, "epistemic_kind").and_then(|x| EpistemicKind::parse(&x)),
                    f.rel.clone(),
                    edges_of(&f.value),
                    f.value.clone(),
                ),
            );
        }
    }

    // ERF-43: self-edges; ERF-44: conflicts-with once per pair.
    let mut conflict_pairs: BTreeSet<(String, String)> = BTreeSet::new();
    for (id, (_, rel, edges, _)) in &claims {
        let mut seen: BTreeSet<(String, String)> = BTreeSet::new();
        for e in edges {
            if e.to == *id {
                rep.violation(
                    "ERF-43",
                    rel,
                    format!(
                        "a self-edge (`{}` -> itself); self-edges MUST NOT exist in any relation",
                        e.raw_relation
                    ),
                );
            }
            let key = (e.raw_relation.clone(), e.to.clone());
            if !seen.insert(key) {
                rep.flag(
                    "ERF-44",
                    rel,
                    format!(
                        "the edge `{} -> {}` is stored more than once on this claim",
                        e.raw_relation, e.to
                    ),
                );
            }
            if e.relation == Some(Relation::ConflictsWith) {
                let pair = if *id <= e.to {
                    (id.clone(), e.to.clone())
                } else {
                    (e.to.clone(), id.clone())
                };
                if !conflict_pairs.insert(pair.clone()) {
                    rep.violation(
                        "ERF-44",
                        rel,
                        format!(
                            "`conflicts-with` between `{}` and `{}` is stored twice; it MUST \
                             be stored once per pair, the reciprocal derived",
                            pair.0, pair.1
                        ),
                    );
                }
            }
        }
    }

    // The premise relation. ERF-24: "An argument's premises are the targets of
    // its own outgoing `assumes` edges together with the claims that carry
    // `supports` edges pointing at it".
    let mut premises: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    let mut decomposes: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    for id in claims.keys() {
        premises.insert(id.clone(), BTreeSet::new());
        decomposes.insert(id.clone(), BTreeSet::new());
    }
    for (id, (_, _, edges, _)) in &claims {
        for e in edges {
            // "a premise id that resolves to nothing is ERF-35's violation and
            //  is absent from the relation"
            if !claims.contains_key(&e.to) {
                continue;
            }
            match e.relation {
                Some(Relation::Assumes) => {
                    premises.get_mut(id).unwrap().insert(e.to.clone());
                }
                Some(Relation::Supports) => {
                    premises.get_mut(&e.to).unwrap().insert(id.clone());
                }
                Some(Relation::DecomposesInto) => {
                    decomposes.get_mut(id).unwrap().insert(e.to.clone());
                }
                Some(Relation::ConflictsWith) | None => {}
            }
        }
    }

    // Cycles, "whether or not any closure reaches the cycle".
    for (name, rel_map, req) in [
        ("the premise relation", &premises, "ERF-43"),
        ("`decomposes-into`", &decomposes, "ERF-43"),
    ] {
        for cyc in find_cycles(rel_map) {
            rep.violation(
                req,
                "",
                format!("{} admits a cycle: {}", name, cyc.join(" -> ")),
            );
        }
    }

    // Closures.
    for (id, (kind, rel, _, v)) in &claims {
        let stood_on = matches!(
            disp.get(id),
            Some(Disposition::Active) | Some(Disposition::Contested) | Some(Disposition::Rejected)
        );
        match kind {
            Some(EpistemicKind::Argument) => {
                let closure = closure_of(id, &premises);
                for m in &closure {
                    if disp.get(m) == Some(&Disposition::Retired) {
                        rep.flag(
                            "ERF-43",
                            rel,
                            format!(
                                "the premise closure contains `{}`, whose disposition is \
                                 retired; a retired premise hollows every argument above it",
                                m
                            ),
                        );
                    }
                    let leaf = premises.get(m).map(|p| p.is_empty()).unwrap_or(true);
                    if leaf && claims.get(m).and_then(|(k, ..)| *k) == Some(EpistemicKind::Argument)
                    {
                        rep.violation(
                            "ERF-43",
                            rel,
                            format!(
                                "the premise closure terminates in `{}`, which is itself an \
                                 `argument` with no premises; a closure MUST terminate in \
                                 non-argument leaves",
                                m
                            ),
                        );
                    }
                }
                if closure.is_empty() && stood_on {
                    rep.flag(
                        "ERF-49",
                        rel,
                        "an `argument` someone stands on with no premises: no outgoing \
                         `assumes` edge and no incoming `supports` edge",
                    );
                }
            }
            Some(EpistemicKind::Observation) => {
                if stood_on
                    && id_list(v, "atoms_for").is_empty()
                    && id_list(v, "surveys").is_empty()
                {
                    rep.flag(
                        "ERF-49",
                        rel,
                        "an `observation` someone stands on with empty `atoms_for` and empty \
                         `surveys`: unbacked",
                    );
                }
            }
            Some(EpistemicKind::Bet) | Some(EpistemicKind::Commitment) | None => {}
        }
    }

    // Report every computed disposition: it is never stored (ERF-22, ERF-41),
    // so a validator that computes it should say what it got.
    for (id, (_, rel, _, _)) in &claims {
        if let Some(d) = disp.get(id) {
            rep.info("ERF-41", rel, format!("disposition: {}", d.as_str()));
        }
    }
}

fn closure_of(start: &str, premises: &BTreeMap<String, BTreeSet<String>>) -> BTreeSet<String> {
    // "The closure is what the edges reach and excludes the argument itself
    //  [...] followed over distinct claims, a claim reached twice visited once,
    //  so that a validator terminates on any input."
    let mut out = BTreeSet::new();
    let mut stack: Vec<String> = premises
        .get(start)
        .map(|p| p.iter().cloned().collect())
        .unwrap_or_default();
    while let Some(n) = stack.pop() {
        if n == start || !out.insert(n.clone()) {
            continue;
        }
        if let Some(ps) = premises.get(&n) {
            for p in ps {
                stack.push(p.clone());
            }
        }
    }
    out
}

fn find_cycles(rel: &BTreeMap<String, BTreeSet<String>>) -> Vec<Vec<String>> {
    let mut out = Vec::new();
    let mut colour: BTreeMap<&str, u8> = rel.keys().map(|k| (k.as_str(), 0u8)).collect();
    let mut path: Vec<String> = Vec::new();
    fn dfs<'a>(
        n: &'a str,
        rel: &'a BTreeMap<String, BTreeSet<String>>,
        colour: &mut BTreeMap<&'a str, u8>,
        path: &mut Vec<String>,
        out: &mut Vec<Vec<String>>,
    ) {
        colour.insert(n, 1);
        path.push(n.to_string());
        if let Some(next) = rel.get(n) {
            for m in next {
                match colour.get(m.as_str()).copied().unwrap_or(0) {
                    0 => dfs(m, rel, colour, path, out),
                    1 => {
                        let at = path.iter().position(|x| x == m).unwrap_or(0);
                        let mut cyc: Vec<String> = path[at..].to_vec();
                        cyc.push(m.clone());
                        out.push(cyc);
                    }
                    _ => {}
                }
            }
        }
        path.pop();
        colour.insert(n, 2);
    }
    let keys: Vec<String> = rel.keys().cloned().collect();
    for k in &keys {
        if colour.get(k.as_str()).copied().unwrap_or(0) == 0 {
            dfs(k, rel, &mut colour, &mut path, &mut out);
        }
    }
    out
}

// --- narratives, ERF-31 / 32 / 33 / YAMLB-1 --------------------------------

fn narratives_pass(dep: &Deployment, rep: &mut Reporter) {
    for c in &dep.corpora {
        for f in &c.files {
            if f.kind != Some(FileKind::Narrative) {
                continue;
            }
            let body = f.body.clone().unwrap_or_default();
            let off = f.body_line_offset;
            let scan = narrative::scan(&body);
            let chars: Vec<char> = body.chars().collect();

            for bad in &scan.bad {
                rep.violation(
                    "YAMLB-1",
                    &f.rel,
                    format!(
                        "line {}: a candidate binding fails the grammar and closes no passage, \
                         so the claims it names vanish from the narrative — {}",
                        bad.line, bad.why
                    ),
                );
            }
            if scan.bindings.is_empty() && scan.bad.is_empty() && !body.trim().is_empty() {
                rep.flag(
                    "ERF-31",
                    &f.rel,
                    "the narrative carries no narrative binding; a passage that asserts \
                     something SHOULD end with one",
                );
            }

            let mut prev_end = 0usize;
            for b in &scan.bindings {
                // "A binding's passage is the text from the end of the previous
                //  binding's marker, or the start of the body where there is
                //  none, to the start of its own marker."
                let passage: String = chars[prev_end.min(b.start)..b.start].iter().collect();
                prev_end = b.end;

                // ERF-31 / ERF-33: every id MUST resolve to a claim.
                for id in &b.ids {
                    match dep.ids.get(id).and_then(|r| r.first()) {
                        None => rep.violation(
                            "ERF-31",
                            &f.rel,
                            format!(
                                "line {}: the narrative binding names `{}`, which resolves to \
                                 no record; reported and not dropped (ERF-33)",
                                b.line + off, id
                            ),
                        ),
                        Some(r) if r.kind != FileKind::Claim => rep.violation(
                            "ERF-31",
                            &f.rel,
                            format!(
                                "line {}: the narrative binding names `{}`, which resolves to \
                                 a {} and not a claim",
                                b.line + off,
                                id,
                                r.kind.as_str()
                            ),
                        ),
                        Some(_) => {}
                    }
                }

                // ERF-31: the anchor MUST occur in its passage, "a flag and not
                // a violation".
                let folded: Vec<char> = fold::fold(&passage).chars().collect();
                match fold::check_quote_folded(&b.anchor, &folded) {
                    QuoteVerdict::Ok => {}
                    QuoteVerdict::Fail(why) => rep.flag(
                        "ERF-31",
                        &f.rel,
                        format!(
                            "line {}: the anchor {:?} does not occur in its passage: {}",
                            b.line + off, b.anchor, why
                        ),
                    ),
                }

                // ERF-32
                let bound = parse_stamp(&b.bound_at).ok();
                for id in &b.ids {
                    let Some(r) = dep.ids.get(id).and_then(|x| x.first()) else {
                        rep.flag(
                            "ERF-32",
                            &f.rel,
                            format!(
                                "line {}: staleness against `{}` is indeterminate; a check \
                                 that cannot tell says look, never rest",
                                b.line + off, id
                            ),
                        );
                        continue;
                    };
                    let cv = &dep.corpora[r.corpus].files[r.file].value;
                    let (lm, _) = stamp_of(cv, "last_modified");
                    if lm.is_none() {
                        continue; // never edited since minting: the binding is current
                    }
                    staleness(
                        rep,
                        "ERF-32",
                        &f.rel,
                        &bound,
                        &lm,
                        &format!("the narrative binding at line {} on `{}`", b.line + off, id),
                    );
                }
            }
        }
    }
}

// --- what this validator does not check ------------------------------------

fn unperformed(dep: &Deployment, rep: &mut Reporter) {
    let n = |req: &str, why: &str, r: &mut Reporter| r.unperformed(req, why.to_string());

    n("ERF-2", "a raw file's immutability, and that a later revision was minted as a new source rather than an overwrite: not decidable from one snapshot of the corpus", rep);
    n("ERF-8", "that `citation_text` is rendered from `citation` and carries everything it shows: needs a CSL processor and a judgment about what the string shows", rep);
    n("ERF-9", "the grade itself (provenance distance and attester accountability): a judgment about the source, not a fact in the corpus", rep);
    n("ERF-10", "that the grade was assessed against the substance rather than the utterance: a judgment", rep);
    n("ERF-11", "that a finding audit's verdict is the judgment it claims to be, and that no mechanical-check result is stored under a name the schema happens to allow", rep);
    n("ERF-12", "that a failed, unparseable or abandoned audit was not written as a verdict: the corpus records the verdict, never the run", rep);
    n("ERF-13", "that an id was never renamed and never reused: needs the substrate's history", rep);
    n("ERF-14", "that `as_of_date` is at the precision the source gave and no finer: needs the source read as a human reads it", rep);
    n("ERF-18", "that the title states the claim: a reading", rep);
    n("ERF-19", "that `standings` was never edited or deleted: needs the substrate's history (ERF-63)", rep);
    n("ERF-22", "that a claim's origin story lives in working notes: a reading", rep);
    n("ERF-23", "that evidence against a claim is not modelled as a rival claim: a judgment about two records' content", rep);
    n("ERF-24", "the backing audit's own question, per epistemic kind: the judgment the audit records, not a fact a validator recomputes", rep);
    n("ERF-25", "that a universal negative was audited as scoped: detecting a universal negative from a title is a reading", rep);
    n("ERF-26", "that `tool` names a concrete instrument rather than a category: a judgment", rep);
    n("ERF-27", "that `hits_reported` states no precision the instrument did not give: a judgment", rep);
    n("ERF-28", "that `searches` and each act's reported yield never changed after the fact: needs the substrate's history", rep);
    n("ERF-37", "that a producer verified an id was unused before writing: a producer-class duty with no trace in the corpus", rep);
    n("ERF-40", "append-only enforcement for `standings`, `finding_audit` and `evidence_audit`: \"verified against the substrate's history\", which this validator does not read", rep);
    n("ERF-42", "how a consumer presents `rejected` and `retired`: a consumer rule. This validator never conflates them; it prints both by name", rep);
    n("ERF-48", "that `last_modified` is later than any *prior* `last_modified`, and that a same-day second edit was written as a full instant: only the current stamp survives in the file", rep);
    n("ERF-50", "that the quote check ran as a gate at minting and after any transform that moves atoms between homes: a producer-class duty", rep);
    n("ERF-53", "that a store round-trips this corpus through the model without loss: a property of a store, not of the bytes on disk. The one loss vector reachable from the file is checked, under ERF-65", rep);
    n("ERF-54", "that no meaning lives in a path: unfalsifiable from the corpus. This validator dispatches on `type` alone and reads no path as a signal", rep);
    n("ERF-55", "that no field the *declared* spec_version leaves undefined was originated: this validator holds one schema, 0.9.0, and checks against that", rep);
    n("ERF-57", "consumer tolerance: a validator's duty is detection, which is the opposite half of the same rule", rep);
    n("ERF-62", "that the corpus has exactly one authoritative home and every index over it is a projection: a deployment fact", rep);
    n("ERF-63", "that the substrate preserves an edit history sufficient to verify ERF-40", rep);
    n("ERF-67", "that a record body is valid CommonMark: every UTF-8 string is valid CommonMark, so the clause excludes nothing a validator can fail. Encoding, LF endings and the BOM are checked", rep);
    n("ERF-68", "that a named `licence` is a real SPDX identifier: the SPDX list is a network fact this validator does not hold", rep);
    n("ERF-69", "the fidelity check one level up (that the normalized text occurs, under the fold, in the normalization of the whole extracted source): needs the raw file and the tools of ERF-70. The sliver that is checkable from the corpus — a normalized text that holds its quote and nothing else — is checked", rep);
    n("ERF-70", "that the named extracting and normalizing tools are deterministic, and that the named versions are the ones that ran", rep);
    n("ERF-51", "the conformance case files (`conformance/cases/normalization.txt`, `conformance/cases/quote-check.yaml`) are normative for this check's exact behavior and govern over any reading of the prose. This validator was built from the prose alone and has not been run against them", rep);
    let _ = dep;
}
