//! Raw frontmatter -> typed records. Every required field that is missing or ill-typed is
//! reported and the record is dropped from the typed set (its id is still registered, so
//! ERF-35 references to it resolve and ERF-36 still sees it).
//!
//! Citation policy: where a numbered requirement restates a field's presence (ERF-4 for an
//! atom's source, ERF-17 for `corpus`, ERF-19 for a standing's parts, ERF-26/27 for a
//! search act, ERF-59 for the declaration) that id is cited. Where no requirement covers
//! "this required field is missing" — which is most of section 3 — the citation is `§3`.
//! That the specification numbers no requirement for its own required fields is recorded
//! as a defect in ambiguities.md.

use crate::model::*;
use crate::raw::{RawMap, RawNode, Style};

const ATOM_KEYS: &[&str] = &[
    "id", "type", "corpus", "finding", "quote", "source", "source_quality", "as_of_date",
    "limitations", "created", "last_modified", "finding_audit",
];
const CLAIM_KEYS: &[&str] = &[
    "id", "type", "corpus", "title", "epistemic_kind", "created", "last_modified",
    "short_name", "families", "atoms_for", "atoms_against", "surveys", "edges", "standings",
    "evidence_audit", "semantic_query",
];
const SURVEY_KEYS: &[&str] = &[
    "id", "type", "corpus", "title", "conducted", "searches", "notable_results",
    "prior_survey", "last_modified",
];
pub const DECL_KEYS: &[&str] = &["id", "title", "spec_version", "classification", "owner"];
pub const SOURCE_KEYS: &[&str] = &[
    "citation_text", "citation", "fetched", "status", "path", "reason", "licence",
    "licence_name", "excerpt", "converter",
];

fn check_type(ctx: &mut Ctx, map: &RawMap, expect: &str) {
    if let Some(node) = map.get("type") {
        if let Some((t, _)) = node.as_scalar() {
            if t != expect {
                ctx.rep.violation(
                    "ERF-54",
                    &ctx.subject.clone(),
                    "type",
                    &ctx.file.clone(),
                    node.line + ctx.offset,
                    format!("`type: {t}` does not match the decoded record type `{expect}`"),
                );
            }
        }
    }
}

pub fn decode_atom(ctx: &mut Ctx, map: &RawMap, body: &str) -> Option<Atom> {
    ctx.check_keys(map, ATOM_KEYS, "", "an atom");
    check_type(ctx, map, "atom");
    let id = ctx.req_nonempty(map, "id", "", "ERF-13")?;
    ctx.subject = id.clone();
    let corpus = ctx.req_nonempty(map, "corpus", "", "ERF-54")?;
    let finding = ctx.req_nonempty(map, "finding", "", "§3");
    let quote = ctx.req_nonempty(map, "quote", "", "ERF-6");
    let source = ctx.req_nonempty(map, "source", "", "ERF-4");
    let sq_s = ctx.req_nonempty(map, "source_quality", "", "ERF-9");
    let source_quality = match sq_s.as_deref().and_then(SourceQuality::parse) {
        Some(v) => Some(v),
        None => {
            if let Some(s) = &sq_s {
                let line = map.key_line("source_quality");
                ctx.rep.violation("ERF-9", &id, "source_quality", &ctx.file.clone(), line + ctx.offset,
                    format!("`{s}` is outside the closed set {:?}", SourceQuality::all()));
            }
            None
        }
    };
    let as_of_date = match map.get("as_of_date") {
        None => None,
        Some(_) => ctx.timestamp(map, "as_of_date", "", "ERF-14"),
    };
    let limitations = ctx.opt_string(map, "limitations", "", "ERF-14");
    let created = ctx.actor_stamp(map, "created", "", "ERF-47");
    let last_modified = match map.get("last_modified") {
        None => None,
        Some(_) => ctx.actor_stamp(map, "last_modified", "", "ERF-48"),
    };
    let finding_audit = ctx.audit_list(map, "finding_audit", "");

    // ERF-53: an atom's body is empty, so its file is frontmatter alone.
    if !body.trim().is_empty() {
        ctx.rep.violation("ERF-53", &id, "body", &ctx.file.clone(), 0,
            "an atom's body MUST be empty; the file is frontmatter and nothing else");
    }

    Some(Atom {
        id,
        corpus,
        finding: finding?,
        quote: quote?,
        source: source?,
        source_quality: source_quality?,
        as_of_date,
        limitations,
        created: created?,
        last_modified,
        finding_audit,
    })
}

pub fn decode_claim(ctx: &mut Ctx, map: &RawMap, body: &str) -> Option<Claim> {
    ctx.check_keys(map, CLAIM_KEYS, "", "a claim");
    check_type(ctx, map, "claim");
    let id = ctx.req_nonempty(map, "id", "", "ERF-36")?;
    ctx.subject = id.clone();
    let corpus = ctx.req_nonempty(map, "corpus", "", "ERF-17")?;
    let title = ctx.req_nonempty(map, "title", "", "ERF-18");
    let kind_s = ctx.req_nonempty(map, "epistemic_kind", "", "ERF-24");
    let epistemic_kind = match kind_s.as_deref().and_then(EpistemicKind::parse) {
        Some(v) => Some(v),
        None => {
            if let Some(s) = &kind_s {
                let line = map.key_line("epistemic_kind");
                ctx.rep.violation("ERF-24", &id, "epistemic_kind", &ctx.file.clone(), line + ctx.offset,
                    format!("`{s}` is outside the closed set {:?}", EpistemicKind::all()));
            }
            None
        }
    };
    let created = ctx.actor_stamp(map, "created", "", "ERF-47");
    let last_modified = match map.get("last_modified") {
        None => None,
        Some(_) => ctx.actor_stamp(map, "last_modified", "", "ERF-48"),
    };
    let short_name = ctx.opt_string(map, "short_name", "", "§3");
    let families = ctx.id_list(map, "families", "", "§3");
    let atoms_for = ctx.id_list(map, "atoms_for", "", "ERF-23");
    let atoms_against = ctx.id_list(map, "atoms_against", "", "ERF-23");
    let surveys = ctx.id_list(map, "surveys", "", "ERF-25");
    let edges = decode_edges(ctx, map);
    let standings = decode_standings(ctx, map);
    let evidence_audit = ctx.audit_list(map, "evidence_audit", "");
    let semantic_query = ctx.opt_string(map, "semantic_query", "", "§3");

    Some(Claim {
        id,
        corpus,
        title: title?,
        epistemic_kind: epistemic_kind?,
        created: created?,
        last_modified,
        short_name,
        families,
        atoms_for,
        atoms_against,
        surveys,
        edges,
        standings,
        evidence_audit,
        semantic_query,
        body: body.to_string(),
    })
}

fn decode_edges(ctx: &mut Ctx, map: &RawMap) -> Vec<Edge> {
    let nodes: Vec<RawNode> = ctx.list(map, "edges", "", "§3").into_iter().cloned().collect();
    let mut out = Vec::new();
    for (i, node) in nodes.iter().enumerate() {
        let p = format!("edges[{i}]");
        let Some(m) = node.as_map() else {
            ctx.rep.violation("§3", &ctx.subject.clone(), &p, &ctx.file.clone(), node.line + ctx.offset,
                format!("expected an edge mapping, found a {}", node.kind_name()));
            continue;
        };
        ctx.check_keys(m, &["to", "relation"], &p, "an edge");
        let to = ctx.req_nonempty(m, "to", &p, "ERF-35");
        if let Some(t) = &to {
            if t.contains('/') || t.contains('#') || t.ends_with(".md") {
                ctx.rep.violation("ERF-15", &ctx.subject.clone(), &format!("{p}.to"), &ctx.file.clone(),
                    m.key_line("to") + ctx.offset, format!("`{t}` encodes a location; references MUST be bare ids"));
            }
        }
        let rel_s = ctx.req_nonempty(m, "relation", &p, "ERF-43");
        let relation = match rel_s.as_deref().and_then(Relation::parse) {
            Some(r) => Some(r),
            None => {
                if let Some(s) = &rel_s {
                    ctx.rep.violation("ERF-43", &ctx.subject.clone(), &format!("{p}.relation"), &ctx.file.clone(),
                        m.key_line("relation") + ctx.offset,
                        format!("`{s}` is outside the closed set {:?}", Relation::all()));
                }
                None
            }
        };
        if let (Some(to), Some(relation)) = (to, relation) {
            out.push(Edge { to, relation });
        }
    }
    out
}

fn decode_standings(ctx: &mut Ctx, map: &RawMap) -> Vec<StandingEntry> {
    let nodes: Vec<RawNode> = ctx.list(map, "standings", "", "ERF-19").into_iter().cloned().collect();
    let mut out = Vec::new();
    for (i, node) in nodes.iter().enumerate() {
        let p = format!("standings[{i}]");
        let Some(m) = node.as_map() else {
            ctx.rep.violation("ERF-19", &ctx.subject.clone(), &p, &ctx.file.clone(), node.line + ctx.offset,
                format!("expected a standing entry mapping, found a {}", node.kind_name()));
            continue;
        };
        ctx.check_keys(m, &["timestamp", "stance", "by", "why", "evidence_at_stance"], &p, "a standing entry");
        let timestamp = ctx.timestamp(m, "timestamp", &p, "ERF-19");
        // ERF-19: a standing's timestamp MUST be a full RFC 3339 instant.
        if let Some(ts) = &timestamp {
            match ts.precision() {
                Precision::DateOnly => ctx.rep.violation("ERF-19", &ctx.subject.clone(), &format!("{p}.timestamp"),
                    &ctx.file.clone(), m.key_line("timestamp") + ctx.offset,
                    "a standing's timestamp MUST be a full RFC 3339 instant carrying both a time and an offset, never a bare date"),
                Precision::Unknown => {}
                Precision::Instant => {}
            }
        }
        let stance_s = ctx.req_nonempty(m, "stance", &p, "ERF-19");
        let stance = match stance_s.as_deref().and_then(Stance::parse) {
            Some(s) => Some(s),
            None => {
                if let Some(s) = &stance_s {
                    ctx.rep.violation("ERF-19", &ctx.subject.clone(), &format!("{p}.stance"), &ctx.file.clone(),
                        m.key_line("stance") + ctx.offset,
                        format!("`{s}` is outside the closed set {:?}", Stance::all()));
                }
                None
            }
        };
        let by_s = ctx.req_nonempty(m, "by", &p, "ERF-39");
        let by = by_s.as_deref().map(ActorId::parse);
        if let Some(a) = &by {
            if !a.is_human() {
                ctx.rep.violation("ERF-21", &ctx.subject.clone(), &format!("{p}.by"), &ctx.file.clone(),
                    m.key_line("by") + ctx.offset,
                    format!("`{}` is not a `human:` actor; an LLM can propose a claim, only a person takes a stance", a.as_written()));
            }
        }
        // ERF-19/ERF-39: a non-empty why. req_nonempty already reports an empty one.
        let why = ctx.req_nonempty(m, "why", &p, "ERF-39");
        let evidence_at_stance = match m.get("evidence_at_stance") {
            None => None,
            Some(n) => match n.as_map() {
                None => {
                    ctx.rep.violation("ERF-20", &ctx.subject.clone(), &format!("{p}.evidence_at_stance"),
                        &ctx.file.clone(), n.line + ctx.offset,
                        format!("expected a mapping of atoms_for/atoms_against, found a {}", n.kind_name()));
                    None
                }
                Some(em) => {
                    let ep = format!("{p}.evidence_at_stance");
                    ctx.check_keys(em, &["atoms_for", "atoms_against"], &ep, "an evidence_at_stance stamp");
                    Some(EvidenceAtStance {
                        atoms_for: ctx.id_list(em, "atoms_for", &ep, "ERF-20"),
                        atoms_against: ctx.id_list(em, "atoms_against", &ep, "ERF-20"),
                    })
                }
            },
        };
        if let (Some(timestamp), Some(stance), Some(by), Some(why)) = (timestamp, stance, by, why) {
            out.push(StandingEntry { timestamp, stance, by, why, evidence_at_stance, ordinal: i });
        }
    }
    out
}

pub fn decode_survey(ctx: &mut Ctx, map: &RawMap, body: &str) -> Option<Survey> {
    ctx.check_keys(map, SURVEY_KEYS, "", "a survey");
    check_type(ctx, map, "survey");
    let id = ctx.req_nonempty(map, "id", "", "ERF-28")?;
    ctx.subject = id.clone();
    let corpus = ctx.req_nonempty(map, "corpus", "", "ERF-17")?;
    let title = ctx.req_nonempty(map, "title", "", "ERF-28");
    let conducted = ctx.actor_stamp(map, "conducted", "", "ERF-28");
    let searches = decode_searches(ctx, map);
    let notable_results = decode_notables(ctx, map);
    let prior_survey = ctx.opt_string(map, "prior_survey", "", "ERF-28");
    let last_modified = match map.get("last_modified") {
        None => None,
        Some(_) => ctx.actor_stamp(map, "last_modified", "", "ERF-48"),
    };
    Some(Survey {
        id,
        corpus,
        title: title?,
        conducted: conducted?,
        searches,
        notable_results,
        prior_survey,
        last_modified,
        body: body.to_string(),
    })
}

fn decode_searches(ctx: &mut Ctx, map: &RawMap) -> Vec<SearchAct> {
    let nodes: Vec<RawNode> = ctx.list(map, "searches", "", "ERF-26").into_iter().cloned().collect();
    let mut out = Vec::new();
    for (i, node) in nodes.iter().enumerate() {
        let p = format!("searches[{i}]");
        let Some(m) = node.as_map() else {
            ctx.rep.violation("ERF-26", &ctx.subject.clone(), &p, &ctx.file.clone(), node.line + ctx.offset,
                format!("expected a search act mapping, found a {}", node.kind_name()));
            continue;
        };
        ctx.check_keys(m, &["tool", "query", "scope", "hits_reported", "timestamp"], &p, "a search act");
        let tool = ctx.req_nonempty(m, "tool", &p, "ERF-26");
        let query = ctx.req_nonempty(m, "query", &p, "ERF-26");
        let scope = ctx.opt_string(m, "scope", &p, "ERF-26");
        // ERF-27: hits_reported is text. A YAML number is the failure this guards against:
        // it states a precision the instrument may not have given.
        let hits_reported = match m.get("hits_reported") {
            None => {
                ctx.rep.violation("ERF-27", &ctx.subject.clone(), &format!("{p}.hits_reported"), &ctx.file.clone(),
                    node.line + ctx.offset, "required field `hits_reported` is missing");
                None
            }
            Some(n) => match n.as_scalar() {
                Some((t, style)) => {
                    if style == Style::Plain && crate::raw::is_json_number(t) {
                        ctx.rep.violation("ERF-27", &ctx.subject.clone(), &format!("{p}.hits_reported"),
                            &ctx.file.clone(), n.line + ctx.offset,
                            format!("`{t}` resolves to a number; `hits_reported` records the yield as text, as the instrument reported it, so quote it"));
                        Some(t.to_string())
                    } else if t.trim().is_empty() {
                        ctx.rep.violation("ERF-27", &ctx.subject.clone(), &format!("{p}.hits_reported"),
                            &ctx.file.clone(), n.line + ctx.offset, "`hits_reported` is present but empty");
                        None
                    } else {
                        Some(t.to_string())
                    }
                }
                None => {
                    ctx.rep.violation("ERF-27", &ctx.subject.clone(), &format!("{p}.hits_reported"), &ctx.file.clone(),
                        n.line + ctx.offset, format!("expected text, found a {}", n.kind_name()));
                    None
                }
            },
        };
        let timestamp = match m.get("timestamp") {
            None => None,
            Some(_) => ctx.timestamp(m, "timestamp", &p, "ERF-28"),
        };
        if let (Some(tool), Some(query), Some(hits_reported)) = (tool, query, hits_reported) {
            out.push(SearchAct { tool, query, scope, hits_reported, timestamp });
        }
    }
    out
}

fn decode_notables(ctx: &mut Ctx, map: &RawMap) -> Vec<NotableResult> {
    let nodes: Vec<RawNode> = ctx.list(map, "notable_results", "", "ERF-27").into_iter().cloned().collect();
    let mut out = Vec::new();
    for (i, node) in nodes.iter().enumerate() {
        let p = format!("notable_results[{i}]");
        let Some(m) = node.as_map() else {
            ctx.rep.violation("ERF-27", &ctx.subject.clone(), &p, &ctx.file.clone(), node.line + ctx.offset,
                format!("expected a notable result mapping, found a {}", node.kind_name()));
            continue;
        };
        ctx.check_keys(m, &["what", "note", "atoms"], &p, "a notable result");
        let what = ctx.req_nonempty(m, "what", &p, "ERF-27");
        let note = ctx.req_nonempty(m, "note", &p, "ERF-27");
        let atoms = ctx.id_list(m, "atoms", &p, "ERF-35");
        if let (Some(what), Some(note)) = (what, note) {
            out.push(NotableResult { what, note, atoms });
        }
    }
    out
}

pub fn decode_declaration(ctx: &mut Ctx, map: &RawMap) -> Option<CorpusDeclaration> {
    ctx.check_keys(map, DECL_KEYS, "", "a corpus declaration");
    let id = ctx.req_nonempty(map, "id", "", "ERF-59")?;
    ctx.subject = id.clone();
    let title = ctx.req_nonempty(map, "title", "", "ERF-59");
    let spec_version = ctx.req_nonempty(map, "spec_version", "", "ERF-59");
    let classification = ctx.opt_string(map, "classification", "", "ERF-59");
    let owner_s = ctx.opt_string(map, "owner", "", "ERF-59");
    let owner = owner_s.as_deref().map(ActorId::parse);
    if let Some(ActorId::Malformed(s)) = &owner {
        ctx.rep.violation("§2", &id, "owner", &ctx.file.clone(), map.key_line("owner") + ctx.offset,
            format!("actor id `{s}` follows none of `human:<id>`, `<producer>/<version>`, `process:<id>`"));
    }
    Some(CorpusDeclaration { id, title: title?, spec_version: spec_version?, classification, owner })
}

pub fn decode_source(ctx: &mut Ctx, key: &str, node: &RawNode) -> Option<Source> {
    let Some(map) = node.as_map() else {
        ctx.rep.violation("ERF-3", key, "-", &ctx.file.clone(), node.line + ctx.offset,
            format!("source entry `{key}` is a {}, not a mapping following the Source shape", node.kind_name()));
        return None;
    };
    ctx.subject = key.to_string();
    ctx.check_keys(map, SOURCE_KEYS, "", "a source");
    let citation_text = ctx.req_nonempty(map, "citation_text", "", "ERF-7");
    let citation = map.get("citation").cloned();
    let fetched = match map.get("fetched") {
        None => None,
        Some(n) => match n.as_map() {
            None => {
                ctx.rep.violation("ERF-7", key, "fetched", &ctx.file.clone(), n.line + ctx.offset,
                    format!("expected a mapping, found a {}", n.kind_name()));
                None
            }
            Some(fm) => {
                ctx.check_keys(fm, &["url", "digest"], "fetched", "a fetched block");
                let url = ctx.req_nonempty(fm, "url", "fetched", "ERF-7");
                let digest = ctx.opt_string(fm, "digest", "fetched", "ERF-71");
                url.map(|url| Fetched { url, digest })
            }
        },
    };
    let status_s = ctx.req_nonempty(map, "status", "", "ERF-5");
    let status = match status_s.as_deref().and_then(SourceStatus::parse) {
        Some(s) => Some(s),
        None => {
            if let Some(s) = &status_s {
                ctx.rep.violation("ERF-5", key, "status", &ctx.file.clone(), map.key_line("status") + ctx.offset,
                    format!("`{s}` is outside the closed set {:?}", SourceStatus::all()));
            }
            None
        }
    };
    let path = ctx.opt_string(map, "path", "", "ERF-4");
    let reason = ctx.opt_string(map, "reason", "", "ERF-5");
    let licence = ctx.opt_string(map, "licence", "", "ERF-68");
    let licence_name = ctx.opt_string(map, "licence_name", "", "ERF-68");
    let excerpt = match map.get("excerpt") {
        None => None,
        Some(n) => match n.as_scalar() {
            Some(("true", Style::Plain)) => Some(true),
            Some(("false", Style::Plain)) => Some(false),
            Some((t, _)) => {
                ctx.rep.violation("ERF-69", key, "excerpt", &ctx.file.clone(), n.line + ctx.offset,
                    format!("`{t}` is not a boolean; under the YAML 1.2 JSON schema only the unquoted literals true and false are booleans (ERF-65)"));
                None
            }
            None => {
                ctx.rep.violation("ERF-69", key, "excerpt", &ctx.file.clone(), n.line + ctx.offset,
                    format!("expected a boolean, found a {}", n.kind_name()));
                None
            }
        },
    };
    let converter = match map.get("converter") {
        None => None,
        Some(n) => match n.as_map() {
            None => {
                ctx.rep.violation("ERF-70", key, "converter", &ctx.file.clone(), n.line + ctx.offset,
                    format!("expected a mapping, found a {}", n.kind_name()));
                None
            }
            Some(cm) => {
                ctx.check_keys(cm, &["tool", "deterministic"], "converter", "a converter block");
                let tool = ctx.req_nonempty(cm, "tool", "converter", "ERF-70");
                let deterministic = match cm.get("deterministic") {
                    None => {
                        ctx.rep.violation("ERF-70", key, "converter.deterministic", &ctx.file.clone(),
                            n.line + ctx.offset,
                            "a converter MUST state whether it is deterministic; a non-deterministic converter marks its check as reproducible by no one but its author");
                        None
                    }
                    Some(d) => match d.as_scalar() {
                        Some(("true", Style::Plain)) => Some(true),
                        Some(("false", Style::Plain)) => Some(false),
                        Some((t, _)) => {
                            ctx.rep.violation("ERF-70", key, "converter.deterministic", &ctx.file.clone(),
                                d.line + ctx.offset, format!("`{t}` is not a boolean"));
                            None
                        }
                        None => None,
                    },
                };
                match (tool, deterministic) {
                    (Some(tool), Some(deterministic)) => Some(Converter { tool, deterministic }),
                    _ => None,
                }
            }
        },
    };
    Some(Source {
        key: key.to_string(),
        citation_text: citation_text?,
        citation,
        fetched,
        status: status?,
        path,
        reason,
        licence,
        licence_name,
        excerpt,
        converter,
        line: node.line,
    })
}
