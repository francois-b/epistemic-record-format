//! Section 6's invariants, plus every other machine-checkable MUST that applies to a
//! corpus and its records.

use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};
use std::path::{Path, PathBuf};

use crate::corpus::{CorpusInfo, Deployment};
use crate::finding::Report;
use crate::model::*;
use crate::normalize::{check_quote, QuoteVerdict};

pub struct Options {
    pub print_dispositions: bool,
}

pub fn validate(dep: &Deployment, rep: &mut Report, opts: &Options) -> Vec<(String, Disposition)> {
    check_declarations(dep, rep);
    check_ids(dep, rep);
    check_membership(dep, rep);
    check_references(dep, rep);
    check_graph(dep, rep);
    check_timestamps(dep, rep);
    check_atoms(dep, rep);
    check_sources(dep, rep);
    check_claims(dep, rep);
    check_surveys(dep, rep);
    check_narratives(dep, rep);

    let mut dispositions = Vec::new();
    if opts.print_dispositions {
        for (c, _) in dep.claims() {
            dispositions.push((c.id.clone(), disposition(c)));
        }
        dispositions.sort_by(|a, b| a.0.cmp(&b.0));
    }
    dispositions
}

// ---------------------------------------------------------------------------
// ERF-41: the computed disposition
// ---------------------------------------------------------------------------

/// True when `a` is later than `b`. Falls back to file order when the two stamps cannot be
/// ordered, which a conforming corpus never needs (ERF-19 requires full instants) but a
/// validator must survive.
fn later(a: &StandingEntry, b: &StandingEntry) -> bool {
    match (a.timestamp.day_number(), b.timestamp.day_number()) {
        (Some(x), Some(y)) if x != y => x > y,
        (Some(_), Some(_)) => match (a.timestamp.instant_secs(), b.timestamp.instant_secs()) {
            (Some(x), Some(y)) if x != y => x > y,
            _ => a.ordinal > b.ordinal,
        },
        _ => a.ordinal > b.ordinal,
    }
}

pub fn disposition(c: &Claim) -> Disposition {
    if c.standings.is_empty() {
        return Disposition::Proposal;
    }
    let mut newest: HashMap<String, &StandingEntry> = HashMap::new();
    for e in &c.standings {
        let key = e.by.as_written();
        match newest.get(&key) {
            Some(prev) if !later(e, prev) => {}
            _ => {
                newest.insert(key, e);
            }
        }
    }
    let current: Vec<Stance> = newest
        .values()
        .map(|e| e.stance)
        .filter(|s| *s != Stance::Withdrawn)
        .collect();
    if current.is_empty() {
        return Disposition::Retired;
    }
    let has_for = current.iter().any(|s| *s == Stance::For);
    let has_against = current.iter().any(|s| *s == Stance::Against);
    match (has_for, has_against) {
        (true, true) => Disposition::Contested,
        (true, false) => Disposition::Active,
        (false, true) => Disposition::Rejected,
        (false, false) => Disposition::Retired,
    }
}

fn stood_on(c: &Claim) -> bool {
    matches!(disposition(c), Disposition::Active | Disposition::Contested)
}

// ---------------------------------------------------------------------------

fn check_declarations(dep: &Deployment, rep: &mut Report) {
    let mut seen: HashMap<&str, &Path> = HashMap::new();
    for c in &dep.corpora {
        // ERF-62: exactly one authoritative home.
        if let Some(prev) = seen.get(c.decl.id.as_str()) {
            rep.violation("ERF-62", &c.decl.id, "id", &c.decl_file, 0,
                format!("a second declaration for corpus `{}` (first at {}); a corpus MUST have exactly one authoritative home",
                    c.decl.id, rel(&dep.root, prev)));
        }
        seen.insert(&c.decl.id, &c.decl_file);

        // ERF-61: SemVer 2.0.0.
        match parse_semver(&c.decl.spec_version) {
            None => rep.violation("ERF-61", &c.decl.id, "spec_version", &c.decl_file, 0,
                format!("`{}` is not a Semantic Versioning 2.0.0 version", c.decl.spec_version)),
            Some((major, _, _)) => {
                // ERF-60: a consumer refusing an unsupported MAJOR must say so. This
                // validator implements v0.9 of the format.
                if major != 0 {
                    rep.notice("ERF-60", &c.decl.id, "spec_version", &c.decl_file, 0,
                        format!("this validator implements spec_version 0.x; corpus declares major {major}, and its records are validated under rules that may have changed meaning"));
                }
            }
        }

        // ERF-3: a corpus MUST keep a source list.
        let has_atoms = dep.atoms().any(|(a, _)| a.corpus == c.decl.id);
        if c.sources_file.is_none() {
            if has_atoms {
                rep.violation("ERF-3", &c.decl.id, "-", &c.root, 0,
                    format!("no source list found for this corpus (expected one of {:?} beside the declaration), but its atoms name sources", crate::corpus::SOURCES_NAMES));
            } else {
                rep.notice("ERF-3", &c.decl.id, "-", &c.root, 0,
                    "a corpus MUST keep a source list; none found (the corpus has no atoms, so nothing resolves against it yet)");
            }
        }
    }
}

fn parse_semver(s: &str) -> Option<(u64, u64, u64)> {
    let core = s.split(['-', '+']).next()?;
    let parts: Vec<&str> = core.split('.').collect();
    if parts.len() != 3 {
        return None;
    }
    let mut out = [0u64; 3];
    for (i, p) in parts.iter().enumerate() {
        if p.is_empty() || (p.len() > 1 && p.starts_with('0')) || !p.bytes().all(|b| b.is_ascii_digit()) {
            return None;
        }
        out[i] = p.parse().ok()?;
    }
    Some((out[0], out[1], out[2]))
}

fn check_ids(dep: &Deployment, rep: &mut Report) {
    // ERF-36 / ERF-38: deployment-unique ids, regardless of record type.
    let mut first: HashMap<&str, &crate::corpus::IdSighting> = HashMap::new();
    for s in &dep.id_sightings {
        match first.get(s.id.as_str()) {
            None => {
                first.insert(&s.id, s);
            }
            Some(prev) => rep.violation("ERF-38", &s.id, "id", &s.file, s.line,
                format!("duplicate record id `{}` (also {} at {}); ids are unique across every corpus in the deployment, regardless of record type (ERF-36)",
                    s.id, article(&prev.type_name), rel(&dep.root, &prev.file))),
        }
    }
    // ERF-13: an atom's id is a mint-time prefix plus a sequence number.
    for (a, file) in dep.atoms() {
        if !id_is_prefix_number(&a.id) {
            rep.notice("ERF-13", &a.id, "id", file, 0,
                "an atom's id is described as a mint-time prefix plus a sequence number (`kwg-117`); this one is not in that shape");
        }
    }
}

fn id_is_prefix_number(id: &str) -> bool {
    match id.rsplit_once('-') {
        Some((prefix, num)) => !prefix.is_empty() && !num.is_empty() && num.bytes().all(|b| b.is_ascii_digit()),
        None => false,
    }
}

fn check_membership(dep: &Deployment, rep: &mut Report) {
    let declared: HashSet<&str> = dep.corpora.iter().map(|c| c.decl.id.as_str()).collect();
    for lr in &dep.records {
        let cid = lr.record.corpus();
        if !declared.contains(cid) {
            let req = if matches!(lr.record, Record::Atom(_)) { "ERF-54" } else { "ERF-17" };
            rep.violation(req, lr.record.id(), "corpus", &lr.file, 0,
                format!("`corpus: {cid}` names no declared corpus in this deployment (ERF-59)"));
        }
    }
}

fn rel(root: &Path, p: &Path) -> String {
    p.strip_prefix(root).unwrap_or(p).display().to_string()
}

fn article(k: &str) -> String {
    match k {
        "atom" => "an atom".to_string(),
        other => format!("a {other}"),
    }
}

fn kind_of(dep: &Deployment, id: &str) -> Option<&'static str> {
    dep.get(id).map(|r| r.type_name())
}

fn check_references(dep: &Deployment, rep: &mut Report) {
    // ERF-35: every reference resolves within the deployment.
    let mut check = |rep: &mut Report, owner: &str, field: &str, file: &Path, target: &str, want: &'static str| {
        match kind_of(dep, target) {
            None => rep.violation("ERF-35", owner, field, file, 0,
                format!("`{target}` resolves to no record in the deployment")),
            Some(k) if k != want => rep.violation("ERF-35", owner, field, file, 0,
                format!("`{target}` is {}; this field names {}", article(k), article(want))),
            Some(_) => {}
        }
    };
    for (c, file) in dep.claims() {
        for (i, id) in c.atoms_for.iter().enumerate() {
            check(rep, &c.id, &format!("atoms_for[{i}]"), file, id, "atom");
        }
        for (i, id) in c.atoms_against.iter().enumerate() {
            check(rep, &c.id, &format!("atoms_against[{i}]"), file, id, "atom");
        }
        for (i, id) in c.surveys.iter().enumerate() {
            check(rep, &c.id, &format!("surveys[{i}]"), file, id, "survey");
        }
        for (i, e) in c.edges.iter().enumerate() {
            check(rep, &c.id, &format!("edges[{i}].to"), file, &e.to, "claim");
        }
        for (i, s) in c.standings.iter().enumerate() {
            if let Some(ev) = &s.evidence_at_stance {
                for (j, id) in ev.atoms_for.iter().chain(ev.atoms_against.iter()).enumerate() {
                    if kind_of(dep, id).is_none() {
                        rep.notice("ERF-20", &c.id, &format!("standings[{i}].evidence_at_stance[{j}]"), file, 0,
                            format!("`{id}` stamped at ruling time resolves to no record now"));
                    }
                }
            }
        }
    }
    for (s, file) in dep.surveys() {
        if let Some(p) = &s.prior_survey {
            check(rep, &s.id, "prior_survey", file, p, "survey");
        }
        for (i, n) in s.notable_results.iter().enumerate() {
            for (j, id) in n.atoms.iter().enumerate() {
                check(rep, &s.id, &format!("notable_results[{i}].atoms[{j}]"), file, id, "atom");
            }
        }
    }
}

fn check_graph(dep: &Deployment, rep: &mut Report) {
    // ERF-43: self-edges, cycles, premise closure. ERF-44: one edge per conflicting pair.
    let mut conflicts: BTreeMap<(String, String), Vec<(String, PathBuf)>> = BTreeMap::new();
    let mut seen_edges: BTreeSet<(String, String, &'static str)> = BTreeSet::new();

    for (c, file) in dep.claims() {
        for (i, e) in c.edges.iter().enumerate() {
            if e.to == c.id {
                rep.violation("ERF-43", &c.id, &format!("edges[{i}]"), file, 0,
                    format!("self-edge `{} -{}-> {}`; self-edges MUST NOT exist", c.id, e.relation.as_str(), e.to));
            }
            let key = (c.id.clone(), e.to.clone(), e.relation.as_str());
            if !seen_edges.insert(key) {
                rep.notice("§3", &c.id, &format!("edges[{i}]"), file, 0,
                    format!("duplicate edge `{} -{}-> {}`", c.id, e.relation.as_str(), e.to));
            }
            if e.relation == Relation::ConflictsWith {
                let mut pair = [c.id.clone(), e.to.clone()];
                pair.sort();
                conflicts
                    .entry((pair[0].clone(), pair[1].clone()))
                    .or_default()
                    .push((c.id.clone(), file.to_path_buf()));
            }
        }
    }
    for ((a, b), holders) in &conflicts {
        if holders.len() > 1 {
            let (owner, file) = &holders[holders.len() - 1];
            rep.violation("ERF-44", owner, "edges", file, 0,
                format!("`conflicts-with` between `{a}` and `{b}` is stored {} times; it MUST be stored once per pair, the reciprocal derived", holders.len()));
        }
    }

    // Cycles per relation (ERF-43: `assumes` and `decomposes-into` MUST admit no cycles).
    for rel in [Relation::Assumes, Relation::DecomposesInto] {
        let mut adj: HashMap<&str, Vec<&str>> = HashMap::new();
        for (c, _) in dep.claims() {
            for e in c.edges.iter().filter(|e| e.relation == rel) {
                adj.entry(c.id.as_str()).or_default().push(e.to.as_str());
            }
        }
        if let Some(cycle) = find_cycle(&adj) {
            let owner = cycle[0].to_string();
            let file = dep.record_file(&owner).map(|p| p.to_path_buf()).unwrap_or_default();
            rep.violation("ERF-43", &owner, "edges", &file, 0,
                format!("`{}` cycle: {}", rel.as_str(), cycle.join(" -> ")));
        }
    }

    // Premise closure (ERF-24 + ERF-43).
    let mut premises: HashMap<&str, Vec<&str>> = HashMap::new();
    for (c, _) in dep.claims() {
        let entry = premises.entry(c.id.as_str()).or_default();
        for e in c.edges.iter().filter(|e| e.relation == Relation::Assumes) {
            entry.push(e.to.as_str());
        }
    }
    for (c, _) in dep.claims() {
        for e in c.edges.iter().filter(|e| e.relation == Relation::Supports) {
            premises.entry(e.to.as_str()).or_default().push(c.id.as_str());
        }
    }

    for (c, file) in dep.claims() {
        if c.epistemic_kind != EpistemicKind::Argument {
            continue;
        }
        let mut stack = vec![c.id.as_str()];
        let mut path: Vec<&str> = Vec::new();
        let mut visited: HashSet<&str> = HashSet::new();
        let mut leaves: BTreeSet<&str> = BTreeSet::new();
        let mut cycle_reported = false;
        // iterative DFS with an explicit path for cycle reporting
        fn walk<'a>(
            node: &'a str,
            premises: &HashMap<&'a str, Vec<&'a str>>,
            path: &mut Vec<&'a str>,
            visited: &mut HashSet<&'a str>,
            leaves: &mut BTreeSet<&'a str>,
            cycle: &mut Option<Vec<String>>,
        ) {
            if path.contains(&node) {
                if cycle.is_none() {
                    let mut c: Vec<String> = path.iter().map(|s| s.to_string()).collect();
                    c.push(node.to_string());
                    *cycle = Some(c);
                }
                return;
            }
            if !visited.insert(node) {
                return;
            }
            path.push(node);
            let kids = premises.get(node).cloned().unwrap_or_default();
            if kids.is_empty() && path.len() > 1 {
                leaves.insert(node);
            }
            for k in kids {
                walk(k, premises, path, visited, leaves, cycle);
            }
            path.pop();
        }
        let mut cycle = None;
        stack.clear();
        walk(c.id.as_str(), &premises, &mut path, &mut visited, &mut leaves, &mut cycle);
        if let Some(cy) = cycle {
            rep.violation("ERF-43", &c.id, "edges", file, 0,
                format!("premise closure does not terminate: {}", cy.join(" -> ")));
            cycle_reported = true;
        }
        for leaf in &leaves {
            let Some(rec) = dep.get(leaf) else { continue };
            if let Record::Claim(lc) = rec {
                if lc.epistemic_kind == EpistemicKind::Argument && !cycle_reported {
                    rep.violation("ERF-43", &c.id, "edges", file, 0,
                        format!("premise closure terminates in `{leaf}`, itself an argument with no premises; the closure MUST terminate in non-argument leaves"));
                }
                // ERF-43: a flag, not a violation.
                if disposition(lc) == Disposition::Retired {
                    rep.flag("ERF-43", &c.id, "edges", file, 0,
                        format!("premise closure terminates in `{leaf}`, whose computed disposition is retired"));
                }
            }
        }
    }
}

fn find_cycle<'a>(adj: &HashMap<&'a str, Vec<&'a str>>) -> Option<Vec<String>> {
    let mut state: HashMap<&str, u8> = HashMap::new();
    let mut path: Vec<&str> = Vec::new();
    fn dfs<'a>(
        n: &'a str,
        adj: &HashMap<&'a str, Vec<&'a str>>,
        state: &mut HashMap<&'a str, u8>,
        path: &mut Vec<&'a str>,
    ) -> Option<Vec<String>> {
        state.insert(n, 1);
        path.push(n);
        for m in adj.get(n).cloned().unwrap_or_default() {
            match state.get(m).copied().unwrap_or(0) {
                1 => {
                    let start = path.iter().position(|x| *x == m).unwrap_or(0);
                    let mut c: Vec<String> = path[start..].iter().map(|s| s.to_string()).collect();
                    c.push(m.to_string());
                    return Some(c);
                }
                0 => {
                    if let Some(c) = dfs(m, adj, state, path) {
                        return Some(c);
                    }
                }
                _ => {}
            }
        }
        path.pop();
        state.insert(n, 2);
        None
    }
    let mut keys: Vec<&str> = adj.keys().copied().collect();
    keys.sort();
    for k in keys {
        if state.get(k).copied().unwrap_or(0) == 0 {
            if let Some(c) = dfs(k, adj, &mut state, &mut path) {
                return Some(c);
            }
        }
    }
    None
}

fn check_timestamps(dep: &Deployment, rep: &mut Report) {
    for lr in &dep.records {
        let (created, last_modified, id) = match &lr.record {
            Record::Atom(a) => (&a.created.timestamp, a.last_modified.as_ref(), &a.id),
            Record::Claim(c) => (&c.created.timestamp, c.last_modified.as_ref(), &c.id),
            Record::Survey(s) => (&s.conducted.timestamp, s.last_modified.as_ref(), &s.id),
        };
        // ERF-48: later than created; at date precision the same day is admitted.
        if let Some(lm) = last_modified {
            let bad = match (created.day_number(), lm.timestamp.day_number()) {
                (Some(c), Some(l)) if l < c => true,
                (Some(c), Some(l)) if l == c => match (created.instant_secs(), lm.timestamp.instant_secs()) {
                    (Some(a), Some(b)) => b <= a,
                    _ => false, // a bare date cannot order within one day; admitted
                },
                _ => false,
            };
            if bad {
                rep.violation("ERF-48", id, "last_modified.timestamp", &lr.file, 0,
                    "`last_modified` is not later than `created`");
            }
        }
    }

    // ERF-47: staleness of the audit lists.
    for (a, file) in dep.atoms() {
        let change = a.last_modified.as_ref().map(|s| &s.timestamp).unwrap_or(&a.created.timestamp);
        for (i, e) in a.finding_audit.iter().enumerate() {
            match freshness(&e.timestamp, change) {
                Freshness::Stale => rep.flag("ERF-47", &a.id, &format!("finding_audit[{i}]"), file, 0,
                    format!("verdict by `{}` is older than the atom's last change; a check that cannot tell says look", e.auditor)),
                Freshness::Indeterminate => rep.flag("ERF-47", &a.id, &format!("finding_audit[{i}]"), file, 0,
                    "cannot order this verdict against the atom's last change (a stamp did not parse)"),
                Freshness::Current => {}
            }
        }
    }
    for (c, file) in dep.claims() {
        // "the last change to what it judged": the claim, and the atoms it cites (4.4).
        let mut change = c.last_modified.as_ref().map(|s| s.timestamp.clone()).unwrap_or_else(|| c.created.timestamp.clone());
        let mut driver = format!("claim `{}`", c.id);
        for id in c.atoms_for.iter().chain(c.atoms_against.iter()) {
            if let Some(Record::Atom(a)) = dep.get(id) {
                let ac = a.last_modified.as_ref().map(|s| &s.timestamp).unwrap_or(&a.created.timestamp);
                if freshness(&change, ac) == Freshness::Stale {
                    change = ac.clone();
                    driver = format!("cited atom `{id}`");
                }
            }
        }
        for (i, e) in c.evidence_audit.iter().enumerate() {
            match freshness(&e.timestamp, &change) {
                Freshness::Stale => rep.flag("ERF-47", &c.id, &format!("evidence_audit[{i}]"), file, 0,
                    format!("verdict by `{}` is older than the last change to what it judged ({driver})", e.auditor)),
                Freshness::Indeterminate => rep.flag("ERF-47", &c.id, &format!("evidence_audit[{i}]"), file, 0,
                    "cannot order this verdict against the last change to what it judged"),
                Freshness::Current => {}
            }
        }
    }
}

fn check_atoms(dep: &Deployment, rep: &mut Report) {
    let mut capture_cache: HashMap<PathBuf, Option<String>> = HashMap::new();
    for (a, file) in dep.atoms() {
        let Some(corpus) = dep.corpus(&a.corpus) else { continue };
        // ERF-4: the named source id MUST exist in the corpus's source list.
        let Some(src) = corpus.source(&a.source) else {
            rep.violation("ERF-4", &a.id, "source", file, 0,
                format!("`{}` is not a key in corpus `{}`'s source list", a.source, a.corpus));
            continue;
        };
        // 4.2 guidance: a medium or low grade puts its reason in `limitations`.
        if matches!(a.source_quality, SourceQuality::Medium | SourceQuality::Low)
            && a.limitations.as_deref().map(|s| s.trim().is_empty()).unwrap_or(true)
        {
            rep.notice("ERF-14", &a.id, "limitations", file, 0,
                format!("`source_quality: {}` with no `limitations`; section 4.2 asks for the reason so a reader learns what is thin", a.source_quality.as_str()));
        }
        // ERF-50/51/52: the mechanical quote check.
        quote_check(dep, rep, a, file, corpus, src, &mut capture_cache);
    }
}

fn quote_check(
    _dep: &Deployment,
    rep: &mut Report,
    a: &Atom,
    file: &Path,
    corpus: &CorpusInfo,
    src: &Source,
    cache: &mut HashMap<PathBuf, Option<String>>,
) {
    let Some(rel) = &src.path else {
        rep.flag("ERF-51", &a.id, "quote", file, 0,
            format!("quote check unavailable: source `{}` holds no capture ({})", src.key, src.status.as_str()));
        return;
    };
    let base = src_dir(corpus);
    let cap_path = base.join(rel);
    let ext = cap_path.extension().and_then(|e| e.to_str()).unwrap_or("").to_ascii_lowercase();
    if !matches!(ext.as_str(), "md" | "markdown" | "txt" | "text" | "") {
        rep.flag("ERF-51", &a.id, "quote", file, 0,
            format!("quote check unavailable: capture `{rel}` is not text or markdown, and a validator never converts"));
        return;
    }
    let text = cache
        .entry(cap_path.clone())
        .or_insert_with(|| std::fs::read_to_string(&cap_path).ok())
        .clone();
    let Some(text) = text else {
        // ERF-1: a capture MUST exist before any check runs against a source.
        rep.violation("ERF-1", &a.id, "quote", file, 0,
            format!("capture `{rel}` named by source `{}` is not present; no check can run against it", src.key));
        return;
    };
    match check_quote(&a.quote, &text) {
        QuoteVerdict::Pass => {}
        QuoteVerdict::AllSpansEmpty => rep.violation("ERF-52", &a.id, "quote", file, 0,
            "the quote's spans are all empty; such a quote MUST fail rather than trivially pass"),
        QuoteVerdict::SpanMissing(i, span) => rep.violation("ERF-6", &a.id, "quote", file, 0,
            format!("span {i} of the quote does not occur in the normalized capture `{rel}` (in order, without overlap): \"{}\"", elide(&span))),
    }
}

fn elide(s: &str) -> String {
    if s.chars().count() <= 60 {
        s.to_string()
    } else {
        let head: String = s.chars().take(57).collect();
        format!("{head}...")
    }
}

fn src_dir(corpus: &CorpusInfo) -> PathBuf {
    corpus
        .sources_file
        .as_ref()
        .and_then(|p| p.parent())
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| corpus.root.clone())
}

fn check_sources(dep: &Deployment, rep: &mut Report) {
    for corpus in &dep.corpora {
        let file = corpus.sources_file.clone().unwrap_or_else(|| corpus.root.clone());
        for s in &corpus.sources {
            let line = s.line;
            // ERF-7: a citation identifies a work; a locator retrieves one copy.
            if looks_like_url(&s.citation_text) {
                rep.violation("ERF-7", &s.key, "citation_text", &file, line,
                    "`citation_text` contains a URL; the retrieved locator is `fetched.url`");
            }
            if let Some(f) = &s.fetched {
                if !f.url.contains("://") {
                    rep.violation("ERF-7", &s.key, "fetched.url", &file, line,
                        format!("`{}` is not a retrieval locator", f.url));
                }
                // ERF-2: a web page is mutable and its capture MUST be dated. Section 3
                // gives a source no field for the capture's date, so this cannot be checked.
                if f.url.starts_with("http") && s.path.is_some() {
                    rep.notice("ERF-2", &s.key, "fetched", &file, line,
                        "a web page's capture MUST be dated, and the `Source` shape of section 3 defines no field to date it; this check cannot run");
                }
                if let Some(d) = &f.digest {
                    if let Some(msg) = bad_digest(d) {
                        rep.violation("ERF-71", &s.key, "fetched.digest", &file, line, msg);
                    }
                }
            }
            // ERF-4 / ERF-5: absence is explicit.
            match (s.status.ships_capture(), s.path.is_some(), s.reason.is_some()) {
                (true, false, _) => rep.violation("ERF-4", &s.key, "path", &file, line,
                    format!("`status: {}` ships a capture but no `path` is given", s.status.as_str())),
                (false, true, _) => rep.violation("ERF-5", &s.key, "status", &file, line,
                    format!("`status: {}` records an absence, but a capture `path` is given", s.status.as_str())),
                (false, false, false) => rep.violation("ERF-5", &s.key, "reason", &file, line,
                    format!("`status: {}` records an absence and MUST carry a human-readable `reason`", s.status.as_str())),
                _ => {}
            }
            if s.path.is_none() && s.reason.is_none() {
                rep.violation("ERF-4", &s.key, "-", &file, line,
                    "a source MUST either give its capture's path or record that no capture is held and why");
            }
            if let Some(r) = &s.reason {
                if r.trim().is_empty() {
                    rep.violation("ERF-5", &s.key, "reason", &file, line, "`reason` is present but empty");
                }
            }
            // ERF-68: a capture that ships under no licence MUST say so via the status.
            if s.status == SourceStatus::Shipped && s.licence.is_none() && s.licence_name.is_none() {
                rep.violation("ERF-68", &s.key, "licence", &file, line,
                    "`status: shipped` names no licence; a capture shipping under none MUST carry `shipped-as-quotation` rather than leaving the permission unstated");
            }
            if s.status == SourceStatus::ShippedAsQuotation && (s.licence.is_some() || s.licence_name.is_some()) {
                rep.notice("ERF-68", &s.key, "licence", &file, line,
                    "`shipped-as-quotation` means shipping under no licence, but a licence is named");
            }
            if let Some(l) = &s.licence {
                if l.contains(' ') {
                    rep.notice("ERF-68", &s.key, "licence", &file, line,
                        format!("`{l}` does not look like an SPDX identifier; the licence's plain name belongs in `licence_name`"));
                }
                if s.licence_name.is_none() {
                    rep.notice("ERF-68", &s.key, "licence_name", &file, line,
                        "an SPDX identifier does not explain itself; the licence's plain name belongs alongside it");
                }
            }
            // ERF-71: an excerpt or a conversion SHOULD carry fetched.digest.
            let digest = s.fetched.as_ref().and_then(|f| f.digest.as_ref());
            if (s.excerpt == Some(true) || s.converter.is_some()) && digest.is_none() && s.fetched.is_some() {
                rep.notice("ERF-71", &s.key, "fetched.digest", &file, line,
                    "an excerpt or a conversion SHOULD carry the digest of the retrieved artifact, so a reader can confirm it is the one the author held");
            }
            // ERF-70: name the tool and its exact version.
            if let Some(c) = &s.converter {
                if !c.tool.chars().any(|ch| ch.is_ascii_digit()) {
                    rep.notice("ERF-70", &s.key, "converter.tool", &file, line,
                        format!("`{}` names no version; ERF-70 asks for the tool and its exact version", c.tool));
                }
                if !c.deterministic {
                    rep.notice("ERF-70", &s.key, "converter.deterministic", &file, line,
                        "a non-deterministic converter marks this source's check as reproducible by no one but its author");
                }
            }
            // ERF-8: a partial check. A full one needs a CSL processor.
            if let Some(cit) = &s.citation {
                if let Some(m) = cit.as_map() {
                    if let Some(issued) = m.get("issued").and_then(|n| n.as_scalar()).map(|(t, _)| t.to_string()) {
                        let year: String = issued.chars().take(4).collect();
                        if year.len() == 4 && year.bytes().all(|b| b.is_ascii_digit()) && !s.citation_text.contains(&year) {
                            rep.notice("ERF-8", &s.key, "citation_text", &file, line,
                                format!("`citation.issued` is {year} but `citation_text` does not show it; citation_text MUST be rendered from the citation block"));
                        }
                    }
                } else {
                    rep.violation("ERF-8", &s.key, "citation", &file, line,
                        format!("`citation` must be a CSL mapping, found a {}", cit.kind_name()));
                }
            }
            // ERF-69: an excerpt must contain adjacent context. Not machine-checkable;
            // the only checkable half is that the flag is set at all.
            if s.excerpt == Some(true) && s.path.is_none() {
                rep.violation("ERF-69", &s.key, "excerpt", &file, line,
                    "`excerpt: true` with no capture path: an excerpt is a property of a capture that ships");
            }
        }
    }
}

fn bad_digest(d: &str) -> Option<String> {
    let Some((alg, hex)) = d.split_once(':') else {
        return Some(format!("`{d}` does not name its algorithm; the form is \"sha256:<hex>\""));
    };
    if alg.is_empty() || !alg.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-') {
        return Some(format!("`{d}` does not name a digest algorithm"));
    }
    if hex.is_empty() || !hex.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Some(format!("`{d}` is not hexadecimal"));
    }
    if alg == "sha256" && hex.len() != 64 {
        return Some(format!("`{d}` is not a 64-character sha256 digest"));
    }
    None
}

fn looks_like_url(s: &str) -> bool {
    s.contains("://") || s.contains("www.") || s.contains("http:") || s.contains("https:")
}

fn check_claims(dep: &Deployment, rep: &mut Report) {
    for (c, file) in dep.claims() {
        // ERF-49: the unbacked flag.
        if stood_on(c) {
            match c.epistemic_kind {
                EpistemicKind::Observation => {
                    if c.atoms_for.is_empty() && c.surveys.is_empty() {
                        rep.flag("ERF-49", &c.id, "atoms_for", file, 0,
                            "unbacked: an observation someone stands on with empty `atoms_for` and empty `surveys`");
                    }
                }
                EpistemicKind::Argument => {
                    let has_assumes = c.edges.iter().any(|e| e.relation == Relation::Assumes);
                    let has_incoming_supports = dep.claims().any(|(o, _)| {
                        o.id != c.id && o.edges.iter().any(|e| e.relation == Relation::Supports && e.to == c.id)
                    });
                    if !has_assumes && !has_incoming_supports {
                        rep.flag("ERF-49", &c.id, "edges", file, 0,
                            "unbacked: an argument someone stands on with no premises (no outgoing `assumes` edge and no incoming `supports` edge)");
                    }
                }
                EpistemicKind::Bet | EpistemicKind::Commitment => {}
            }
        }
        // ERF-24: bets and commitments owe no backing, so they have nothing to audit.
        if matches!(c.epistemic_kind, EpistemicKind::Bet | EpistemicKind::Commitment)
            && !c.evidence_audit.is_empty()
        {
            rep.notice("ERF-24", &c.id, "evidence_audit", file, 0,
                format!("a `{}` owes no backing and so has nothing to audit, but an evidence_audit is recorded", c.epistemic_kind.as_str()));
        }
        // ERF-23: the same atom on both sides.
        for id in &c.atoms_for {
            if c.atoms_against.contains(id) {
                rep.notice("ERF-23", &c.id, "atoms_against", file, 0,
                    format!("`{id}` is listed both for and against"));
            }
        }
        // ERF-18: the body SHOULD open by restating the title, verbatim.
        let first_para = c.body.trim_start().split("\n\n").next().unwrap_or("").trim().to_string();
        let squash = |s: &str| s.split_whitespace().collect::<Vec<_>>().join(" ");
        if first_para.is_empty() {
            rep.notice("ERF-18", &c.id, "body", file, 0, "the body is empty; it SHOULD open by restating the title, then carry the working notes");
        } else if !squash(&first_para).starts_with(&squash(&c.title)) {
            rep.notice("ERF-18", &c.id, "body", file, 0,
                "the body does not open by restating the title verbatim; keeping the restatement verbatim is what makes later drift visible");
        }
    }
}

fn check_surveys(dep: &Deployment, rep: &mut Report) {
    for (s, file) in dep.surveys() {
        if s.searches.is_empty() {
            rep.notice("ERF-26", &s.id, "searches", file, 0, "a survey records search acts; this one records none");
        }
        // ERF-28: the id SHOULD end with the conducted date.
        if !ends_with_date(&s.id) {
            rep.notice("ERF-28", &s.id, "id", file, 0, "a survey's id SHOULD end with the date it was conducted");
        } else if let Timestamp::Date { y, m, d } | Timestamp::Instant { y, m, d, .. } = s.conducted.timestamp {
            let tail: String = s.id.chars().rev().take(10).collect::<Vec<_>>().into_iter().rev().collect();
            let want = format!("{y:04}-{m:02}-{d:02}");
            if tail != want {
                rep.notice("ERF-28", &s.id, "id", file, 0,
                    format!("the id ends with `{tail}` but the survey was conducted {want}"));
            }
        }
    }
}

fn ends_with_date(id: &str) -> bool {
    let tail: Vec<char> = id.chars().rev().take(10).collect();
    if tail.len() < 10 {
        return false;
    }
    let t: String = tail.into_iter().rev().collect();
    matches!(Timestamp::parse(&t), Timestamp::Date { .. })
}

fn check_narratives(dep: &Deployment, rep: &mut Report) {
    let declared: HashSet<&str> = dep.corpora.iter().map(|c| c.decl.id.as_str()).collect();
    for n in &dep.narratives {
        // ERF-34: a narrative carries frontmatter with title, corpus, and created.
        for (field, present) in [
            ("title", n.title.is_some()),
            ("corpus", n.corpus.is_some()),
            ("created", n.created.is_some()),
        ] {
            if !present && !n.bindings.is_empty() {
                rep.violation("ERF-34", "-", field, &n.file, 1,
                    format!("a narrative carries frontmatter with `title`, `corpus`, and `created`; `{field}` is missing"));
            }
        }
        if let Some(c) = &n.corpus {
            if !declared.contains(c.as_str()) && !n.bindings.is_empty() {
                rep.violation("ERF-34", "-", "corpus", &n.file, 1,
                    format!("`corpus: {c}` names no declared corpus in this deployment"));
            }
        }
        for b in &n.bindings {
            // ERF-31: the anchor is a verbatim substring of the passage.
            let without = n.text.replace(&b.raw, "");
            if !without.contains(&b.anchor) {
                rep.violation("ERF-31", "-", "anchor", &n.file, b.line,
                    format!("the anchor \"{}\" is not a verbatim substring of the document's prose", elide(&b.anchor)));
            }
            // ERF-32 / ERF-33.
            match &b.bound_at {
                None => {
                    rep.violation("ERF-32", "-", "bound-at", &n.file, b.line,
                        "a narrative binding MUST record `bound-at`, the date it was made, in the marker itself");
                    rep.flag("ERF-32", "-", "bound-at", &n.file, b.line,
                        "staleness indeterminate: a validator that cannot tell must say so rather than reassure");
                }
                Some(bound_at) => {
                    for id in &b.claims {
                        match dep.get(id) {
                            None => rep.violation("ERF-33", "-", "claims", &n.file, b.line,
                                format!("`{id}` resolves to no record; a narrative claiming support from a record that does not exist is a defect in the narrative")),
                            Some(Record::Claim(c)) => {
                                if let Some(lm) = &c.last_modified {
                                    if freshness(bound_at, &lm.timestamp) == Freshness::Stale {
                                        rep.flag("ERF-32", "-", "bound-at", &n.file, b.line,
                                            format!("stale: claim `{id}` carries a `last_modified` later than this narrative binding's bound-at date"));
                                    }
                                }
                            }
                            Some(other) => rep.violation("ERF-33", "-", "claims", &n.file, b.line,
                                format!("`{id}` is {}, not a claim", article(other.type_name()))),
                        }
                    }
                }
            }
            if b.bound_at.is_none() {
                for id in &b.claims {
                    if dep.get(id).is_none() {
                        rep.violation("ERF-33", "-", "claims", &n.file, b.line,
                            format!("`{id}` resolves to no record"));
                    }
                }
            }
        }
    }
}
