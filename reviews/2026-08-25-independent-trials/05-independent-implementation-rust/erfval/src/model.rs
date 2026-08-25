//! Section 3's data model as Rust types, plus the decoder that produces them.
//!
//! Every decision the prose did not settle is marked `TYPE-DECISION` and repeated in
//! type-decisions.md. The rule of thumb used throughout: `Option<T>` only where section 3
//! writes `?`, closed `enum` only where section 3 writes a string-literal union, and a
//! dedicated sum type wherever a string field carries an internal grammar the spec
//! constrains (timestamps, actors, digests).

use std::path::{Path, PathBuf};

use crate::finding::Report;
use crate::raw::{RawMap, RawNode, Style};

// ---------------------------------------------------------------------------
// Scalars with grammar
// ---------------------------------------------------------------------------

/// TYPE-DECISION (§3, ERF-19, ERF-47, ERF-58).
/// Section 3 types every timestamp as `string` and comments `// RFC 3339`, but ERF-19
/// says only a standing's timestamp must be a full instant, ERF-47 legislates comparing a
/// bare date against a full instant, and the spec's own examples write
/// `created: {timestamp: 2026-07-19}`. A bare date is not an RFC 3339 date-time, so the
/// comment and the examples disagree. Modelled as a sum type carrying both admitted
/// precisions plus the parse failure, because a validator has to be able to say
/// "unparseable" without panicking and has to compare across precisions.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Timestamp {
    /// `YYYY-MM-DD`, no time, no offset.
    Date { y: i32, m: u32, d: u32 },
    /// A full RFC 3339 instant: date, time, and offset.
    Instant { y: i32, m: u32, d: u32, secs: i64, offset_secs: i64 },
    /// Syntactically neither. Kept so downstream checks can report rather than crash.
    Malformed(String),
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum Precision {
    DateOnly,
    Instant,
    Unknown,
}

impl Timestamp {
    pub fn parse(s: &str) -> Timestamp {
        let b = s.as_bytes();
        let date = |b: &[u8]| -> Option<(i32, u32, u32)> {
            if b.len() < 10 {
                return None;
            }
            let ok = b[..4].iter().all(|c| c.is_ascii_digit())
                && b[4] == b'-'
                && b[5].is_ascii_digit()
                && b[6].is_ascii_digit()
                && b[7] == b'-'
                && b[8].is_ascii_digit()
                && b[9].is_ascii_digit();
            if !ok {
                return None;
            }
            let y: i32 = std::str::from_utf8(&b[0..4]).ok()?.parse().ok()?;
            let m: u32 = std::str::from_utf8(&b[5..7]).ok()?.parse().ok()?;
            let d: u32 = std::str::from_utf8(&b[8..10]).ok()?.parse().ok()?;
            if !(1..=12).contains(&m) || !(1..=31).contains(&d) {
                return None;
            }
            Some((y, m, d))
        };
        let Some((y, m, d)) = date(b) else {
            return Timestamp::Malformed(s.to_string());
        };
        if b.len() == 10 {
            return Timestamp::Date { y, m, d };
        }
        // RFC 3339: date "T" time offset. The separator may be lowercase 't' or, per the
        // RFC's own note, a space; ERF does not say, so both are accepted here.
        let sep = b[10];
        if !(sep == b'T' || sep == b't' || sep == b' ') {
            return Timestamp::Malformed(s.to_string());
        }
        let rest = &s[11..];
        if rest.len() < 8 {
            return Timestamp::Malformed(s.to_string());
        }
        let hh: i64 = match rest[0..2].parse() {
            Ok(v) => v,
            Err(_) => return Timestamp::Malformed(s.to_string()),
        };
        if rest.as_bytes()[2] != b':' {
            return Timestamp::Malformed(s.to_string());
        }
        let mm: i64 = match rest[3..5].parse() {
            Ok(v) => v,
            Err(_) => return Timestamp::Malformed(s.to_string()),
        };
        if rest.as_bytes()[5] != b':' {
            return Timestamp::Malformed(s.to_string());
        }
        let ss: i64 = match rest[6..8].parse() {
            Ok(v) => v,
            Err(_) => return Timestamp::Malformed(s.to_string()),
        };
        let mut i = 8;
        let rb = rest.as_bytes();
        if i < rb.len() && rb[i] == b'.' {
            i += 1;
            let start = i;
            while i < rb.len() && rb[i].is_ascii_digit() {
                i += 1;
            }
            if i == start {
                return Timestamp::Malformed(s.to_string());
            }
        }
        // The offset is mandatory for an instant (ERF-19 requires "a time and an offset").
        let offset_secs = if i < rb.len() && (rb[i] == b'Z' || rb[i] == b'z') {
            if i + 1 != rb.len() {
                return Timestamp::Malformed(s.to_string());
            }
            0
        } else if i + 6 == rb.len() && (rb[i] == b'+' || rb[i] == b'-') {
            let sign = if rb[i] == b'-' { -1 } else { 1 };
            let oh: i64 = match rest[i + 1..i + 3].parse() {
                Ok(v) => v,
                Err(_) => return Timestamp::Malformed(s.to_string()),
            };
            if rb[i + 3] != b':' {
                return Timestamp::Malformed(s.to_string());
            }
            let om: i64 = match rest[i + 4..i + 6].parse() {
                Ok(v) => v,
                Err(_) => return Timestamp::Malformed(s.to_string()),
            };
            sign * (oh * 3600 + om * 60)
        } else {
            // A time with no offset. RFC 3339 requires one, so this is malformed rather
            // than a third precision: inventing "local time" would let ERF-19 pass on a
            // stamp that cannot be ordered against another zone.
            return Timestamp::Malformed(s.to_string());
        };
        Timestamp::Instant { y, m, d, secs: hh * 3600 + mm * 60 + ss, offset_secs }
    }

    pub fn precision(&self) -> Precision {
        match self {
            Timestamp::Date { .. } => Precision::DateOnly,
            Timestamp::Instant { .. } => Precision::Instant,
            Timestamp::Malformed(_) => Precision::Unknown,
        }
    }

    /// Days since a fixed epoch, for ordering by calendar day. UTC-normalized for instants.
    pub fn day_number(&self) -> Option<i64> {
        let (y, m, d, shift) = match self {
            Timestamp::Date { y, m, d } => (*y, *m, *d, 0i64),
            Timestamp::Instant { y, m, d, secs, offset_secs } => {
                let utc = secs - offset_secs;
                let shift = if utc < 0 {
                    -1
                } else if utc >= 86400 {
                    1
                } else {
                    0
                };
                (*y, *m, *d, shift)
            }
            Timestamp::Malformed(_) => return None,
        };
        Some(days_from_civil(y, m, d) + shift)
    }

    /// Seconds since epoch for an instant, UTC-normalized. `None` for a bare date.
    pub fn instant_secs(&self) -> Option<i64> {
        match self {
            Timestamp::Instant { y, m, d, secs, offset_secs } => {
                Some(days_from_civil(*y, *m, *d) * 86400 + secs - offset_secs)
            }
            _ => None,
        }
    }
}

fn days_from_civil(y: i32, m: u32, d: u32) -> i64 {
    // Howard Hinnant's civil_from_days inverse; proleptic Gregorian.
    let y = y as i64 - if m <= 2 { 1 } else { 0 };
    let era = if y >= 0 { y } else { y - 399 } / 400;
    let yoe = y - era * 400;
    let mp = ((m as i64) + 9) % 12;
    let doy = (153 * mp + 2) / 5 + d as i64 - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146097 + doe - 719468
}

/// The result of an ERF-47 staleness comparison. Not `Ordering`: the spec's rule is not a
/// total order (a same-day mixed-precision pair resolves to "stale", not to "equal").
#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum Freshness {
    Current,
    Stale,
    /// One of the two stamps did not parse, so nothing can be said.
    Indeterminate,
}

/// ERF-47: is `judgement` older than `change`?
pub fn freshness(judgement: &Timestamp, change: &Timestamp) -> Freshness {
    let (Some(jd), Some(cd)) = (judgement.day_number(), change.day_number()) else {
        return Freshness::Indeterminate;
    };
    if jd < cd {
        return Freshness::Stale;
    }
    if jd > cd {
        return Freshness::Current;
    }
    // Same calendar day.
    match (judgement.instant_secs(), change.instant_secs()) {
        (Some(a), Some(b)) => {
            if a < b {
                Freshness::Stale
            } else {
                Freshness::Current
            }
        }
        // "Two bare dates that are equal read as current."
        (None, None) => Freshness::Current,
        // "Where the two stamps differ in precision and the coarser one cannot order them
        // ... the comparison MUST resolve to stale."
        _ => Freshness::Stale,
    }
}

/// TYPE-DECISION (§2, ERF-21, ERF-39).
/// `Actor` is a TypeScript template-literal union. Its middle arm `${string}/${string}`
/// matches any string containing a slash, so the union is not disjoint and is very nearly
/// open: `foo:bar/baz` satisfies it. Modelled as a closed enum with an explicit
/// `Malformed` arm, tried in the order human / process / producer-slash-version, because
/// only `human:` carries a normative consequence (ERF-21).
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ActorId {
    Human(String),
    Process(String),
    /// `<producer>/<version>` — a model or agent.
    Machine { producer: String, version: String },
    Malformed(String),
}

impl ActorId {
    pub fn parse(s: &str) -> ActorId {
        if let Some(rest) = s.strip_prefix("human:") {
            if rest.is_empty() {
                return ActorId::Malformed(s.to_string());
            }
            return ActorId::Human(rest.to_string());
        }
        if let Some(rest) = s.strip_prefix("process:") {
            if rest.is_empty() {
                return ActorId::Malformed(s.to_string());
            }
            return ActorId::Process(rest.to_string());
        }
        if let Some((p, v)) = s.split_once('/') {
            if !p.is_empty() && !v.is_empty() && !p.contains(':') {
                return ActorId::Machine { producer: p.to_string(), version: v.to_string() };
            }
        }
        ActorId::Malformed(s.to_string())
    }
    pub fn is_human(&self) -> bool {
        matches!(self, ActorId::Human(_))
    }
    pub fn as_written(&self) -> String {
        match self {
            ActorId::Human(x) => format!("human:{x}"),
            ActorId::Process(x) => format!("process:{x}"),
            ActorId::Machine { producer, version } => format!("{producer}/{version}"),
            ActorId::Malformed(x) => x.clone(),
        }
    }
}

// ---------------------------------------------------------------------------
// Closed vocabularies (section 5: "A value outside them is a validation failure")
// ---------------------------------------------------------------------------

macro_rules! closed_enum {
    ($name:ident, $req:expr, { $($variant:ident => $text:expr),+ $(,)? }) => {
        #[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
        pub enum $name { $($variant),+ }
        impl $name {
            pub const REQ: &'static str = $req;
            pub fn parse(s: &str) -> Option<$name> {
                match s { $($text => Some($name::$variant),)+ _ => None }
            }
            pub fn as_str(&self) -> &'static str {
                match self { $($name::$variant => $text),+ }
            }
            pub fn all() -> &'static [&'static str] { &[$($text),+] }
        }
    };
}

closed_enum!(EpistemicKind, "ERF-24", {
    Observation => "observation",
    Argument => "argument",
    Bet => "bet",
    Commitment => "commitment",
});

closed_enum!(Stance, "ERF-19", {
    For => "for",
    Against => "against",
    Withdrawn => "withdrawn",
});

closed_enum!(Relation, "ERF-43", {
    Supports => "supports",
    Assumes => "assumes",
    DecomposesInto => "decomposes-into",
    ConflictsWith => "conflicts-with",
});

closed_enum!(SourceQuality, "ERF-9", {
    High => "high",
    Medium => "medium",
    Low => "low",
});

closed_enum!(Verdict, "ERF-12", {
    Supported => "SUPPORTED",
    Partial => "PARTIAL",
    Unsupported => "UNSUPPORTED",
});

closed_enum!(SourceStatus, "ERF-5", {
    Shipped => "shipped",
    ShippedAsQuotation => "shipped-as-quotation",
    NotRedistributable => "not-redistributable",
    AccessRestricted => "access-restricted",
    LicenceUnverified => "licence-unverified",
});

impl SourceStatus {
    /// ERF-4/ERF-5: the two halves of the status set behave differently.
    pub fn ships_capture(self) -> bool {
        matches!(self, SourceStatus::Shipped | SourceStatus::ShippedAsQuotation)
    }
}

/// ERF-41. Computed, never stored, never parsed from a file: no `parse`, by design.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum Disposition {
    Proposal,
    Active,
    Contested,
    Rejected,
    Retired,
}

impl Disposition {
    pub fn as_str(&self) -> &'static str {
        match self {
            Disposition::Proposal => "proposal",
            Disposition::Active => "active",
            Disposition::Contested => "contested",
            Disposition::Rejected => "rejected",
            Disposition::Retired => "retired",
        }
    }
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

#[derive(Clone, Debug)]
pub struct ActorStamp {
    pub timestamp: Timestamp,
    pub by: ActorId,
}

#[derive(Clone, Debug)]
pub struct AuditEntry {
    /// ERF-11: deliberately NOT an `Actor` — a bare model or tool identifier.
    pub auditor: String,
    pub verdict: Verdict,
    pub timestamp: Timestamp,
    pub protocol: String,
}

#[derive(Clone, Debug)]
pub struct EvidenceAtStance {
    pub atoms_for: Vec<String>,
    pub atoms_against: Vec<String>,
}

#[derive(Clone, Debug)]
pub struct StandingEntry {
    pub timestamp: Timestamp,
    pub stance: Stance,
    /// Typed `human:${string}` in section 3, so the human-ness is a type error rather than
    /// a value error; ERF-21/ERF-39 restate it, and those are the ids reported.
    pub by: ActorId,
    pub why: String,
    pub evidence_at_stance: Option<EvidenceAtStance>,
    /// Not in the data model: the entry's ordinal in the file. ERF-41 needs a tie-break
    /// when one person's two newest entries carry the same stamp, and an append-only
    /// ledger's file order is the only evidence of sequence available.
    pub ordinal: usize,
}

#[derive(Clone, Debug)]
pub struct Atom {
    pub id: String,
    pub corpus: String,
    pub finding: String,
    pub quote: String,
    pub source: String,
    pub source_quality: SourceQuality,
    pub as_of_date: Option<Timestamp>,
    pub limitations: Option<String>,
    pub created: ActorStamp,
    pub last_modified: Option<ActorStamp>,
    pub finding_audit: Vec<AuditEntry>,
}

#[derive(Clone, Debug)]
pub struct Edge {
    pub to: String,
    pub relation: Relation,
}

#[derive(Clone, Debug)]
pub struct Claim {
    pub id: String,
    pub corpus: String,
    pub title: String,
    pub epistemic_kind: EpistemicKind,
    pub created: ActorStamp,
    pub last_modified: Option<ActorStamp>,
    pub short_name: Option<String>,
    pub families: Vec<String>,
    pub atoms_for: Vec<String>,
    pub atoms_against: Vec<String>,
    /// TYPE-DECISION: `surveys?` is the one optional list in section 3. ERF-56 says an
    /// omitted list materializes as empty, which makes `Option<Vec<_>>` a distinction
    /// without a difference, so it is flattened to `Vec` like every other list.
    pub surveys: Vec<String>,
    pub edges: Vec<Edge>,
    pub standings: Vec<StandingEntry>,
    pub evidence_audit: Vec<AuditEntry>,
    pub semantic_query: Option<String>,
    pub body: String,
}

#[derive(Clone, Debug)]
pub struct SearchAct {
    pub tool: String,
    pub query: String,
    pub scope: Option<String>,
    /// ERF-27: text, always. A YAML number here is a type violation, not a coercion.
    pub hits_reported: String,
    pub timestamp: Option<Timestamp>,
}

#[derive(Clone, Debug)]
pub struct NotableResult {
    pub what: String,
    pub note: String,
    pub atoms: Vec<String>,
}

#[derive(Clone, Debug)]
pub struct Survey {
    pub id: String,
    pub corpus: String,
    pub title: String,
    pub conducted: ActorStamp,
    pub searches: Vec<SearchAct>,
    pub notable_results: Vec<NotableResult>,
    pub prior_survey: Option<String>,
    pub last_modified: Option<ActorStamp>,
    pub body: String,
}

#[derive(Clone, Debug)]
pub enum Record {
    Atom(Atom),
    Claim(Claim),
    Survey(Survey),
}

impl Record {
    pub fn id(&self) -> &str {
        match self {
            Record::Atom(a) => &a.id,
            Record::Claim(c) => &c.id,
            Record::Survey(s) => &s.id,
        }
    }
    pub fn corpus(&self) -> &str {
        match self {
            Record::Atom(a) => &a.corpus,
            Record::Claim(c) => &c.corpus,
            Record::Survey(s) => &s.corpus,
        }
    }
    pub fn type_name(&self) -> &'static str {
        match self {
            Record::Atom(_) => "atom",
            Record::Claim(_) => "claim",
            Record::Survey(_) => "survey",
        }
    }
    /// The stamp ERF-47 calls "the last change to what it judged".
    pub fn last_change(&self) -> &Timestamp {
        match self {
            Record::Atom(a) => a.last_modified.as_ref().map(|s| &s.timestamp).unwrap_or(&a.created.timestamp),
            Record::Claim(c) => c.last_modified.as_ref().map(|s| &s.timestamp).unwrap_or(&c.created.timestamp),
            Record::Survey(s) => s.last_modified.as_ref().map(|x| &x.timestamp).unwrap_or(&s.conducted.timestamp),
        }
    }
}

// ---------------------------------------------------------------------------
// Corpus-level structures (not records)
// ---------------------------------------------------------------------------

#[derive(Clone, Debug)]
pub struct CorpusDeclaration {
    pub id: String,
    pub title: String,
    pub spec_version: String,
    pub classification: Option<String>,
    pub owner: Option<ActorId>,
}

#[derive(Clone, Debug)]
pub struct Fetched {
    pub url: String,
    pub digest: Option<String>,
}

#[derive(Clone, Debug)]
pub struct Converter {
    pub tool: String,
    pub deterministic: bool,
}

#[derive(Clone, Debug)]
pub struct Source {
    pub key: String,
    pub citation_text: String,
    /// TYPE-DECISION: `citation?: CSL` is an opaque CSL-JSON object. The spec excludes the
    /// `CSL` alias from the inline mirror, so the shape is undefined here; kept as the raw
    /// node so ERF-55's unknown-key rule is not applied to a schema this spec never states.
    pub citation: Option<RawNode>,
    pub fetched: Option<Fetched>,
    pub status: SourceStatus,
    pub path: Option<String>,
    pub reason: Option<String>,
    pub licence: Option<String>,
    pub licence_name: Option<String>,
    /// TYPE-DECISION: `excerpt?: boolean`. Absent and `false` are distinguishable in the
    /// type and mean the same thing operationally; kept as `Option<bool>` so a validator
    /// can tell "said no" from "said nothing" if a later requirement needs to.
    pub excerpt: Option<bool>,
    pub converter: Option<Converter>,
    pub line: usize,
}

// ---------------------------------------------------------------------------
// Decoding
// ---------------------------------------------------------------------------

pub struct Ctx<'a> {
    pub rep: &'a mut Report,
    pub subject: String,
    pub file: PathBuf,
    /// Frontmatter starts on line 2 of the file, so YAML line numbers shift by this much.
    pub offset: usize,
}

impl<'a> Ctx<'a> {
    pub fn new(rep: &'a mut Report, subject: &str, file: &Path, offset: usize) -> Self {
        Ctx { rep, subject: subject.to_string(), file: file.to_path_buf(), offset }
    }

    fn v(&mut self, req: &str, field: &str, line: usize, msg: impl Into<String>) {
        let (s, f) = (self.subject.clone(), self.file.clone());
        self.rep.violation(req, &s, field, &f, line + self.offset, msg);
    }
    fn n(&mut self, req: &str, field: &str, line: usize, msg: impl Into<String>) {
        let (s, f) = (self.subject.clone(), self.file.clone());
        self.rep.notice(req, &s, field, &f, line + self.offset, msg);
    }

    /// ERF-55 + ERF-72 + ERF-58: keys outside the declared shape.
    pub fn check_keys(&mut self, map: &RawMap, known: &[&str], path: &str, what: &str) {
        for (k, line) in map.keys() {
            if known.contains(&k) {
                continue;
            }
            if k.starts_with("x_") {
                self.n("ERF-72", &join(path, k), line, format!("extension field `{k}` on {what}; this version assigns it no meaning"));
                continue;
            }
            if matches!(k, "date" | "time" | "when" | "datetime" | "ts" | "at" | "on") {
                self.v("ERF-58", &join(path, k), line, format!("`{k}` on {what}: the event-time key MUST be `timestamp`, everywhere"));
                continue;
            }
            if what == "a claim" && matches!(k, "disposition" | "state" | "status" | "granted") {
                self.v("ERF-22", &join(path, k), line, format!("`{k}` on a claim: a claim MUST NOT store a state field; the disposition is computed (ERF-41)"));
                continue;
            }
            if what == "an atom" && matches!(k, "quote_check" | "verified" | "check" | "quote_verified" | "capture_ok") {
                self.v("ERF-11", &join(path, k), line, format!("`{k}` on an atom: the mechanical check is recomputable, so its result MUST NOT be stored"));
                continue;
            }
            self.v("ERF-55", &join(path, k), line, format!("unknown field `{k}` on {what}; a producer MUST NOT originate a field the declared spec_version does not define (extensions use the `x_` prefix, ERF-72)"));
        }
    }

    pub fn req_string(&mut self, map: &RawMap, key: &str, path: &str, req: &str) -> Option<String> {
        match map.get(key) {
            None => {
                self.v(req, &join(path, key), map_line(map), format!("required field `{key}` is missing"));
                None
            }
            Some(node) => self.string_at(node, &join(path, key), req),
        }
    }

    pub fn opt_string(&mut self, map: &RawMap, key: &str, path: &str, req: &str) -> Option<String> {
        match map.get(key) {
            None => None,
            Some(node) => self.string_at(node, &join(path, key), req),
        }
    }

    fn string_at(&mut self, node: &RawNode, field: &str, req: &str) -> Option<String> {
        match node.as_scalar() {
            Some((text, style)) => {
                // ERF-65: under the JSON schema these three resolve to non-strings, so an
                // unquoted `null`/`true`/`123` in a string-typed field is a type error and
                // not a string that happens to look like one.
                if style == Style::Plain
                    && (text == "null" || text == "true" || text == "false" || crate::raw::is_json_number(text))
                {
                    self.v(req, field, node.line, format!("`{text}` resolves to a non-string under the YAML 1.2 JSON schema (ERF-65); this field is typed `string` — quote it"));
                    return None;
                }
                if style == Style::Plain && text.is_empty() {
                    self.v(req, field, node.line, "empty value where a string is required");
                    return None;
                }
                Some(text.to_string())
            }
            None => {
                self.v(req, field, node.line, format!("expected a string, found a {}", node.kind_name()));
                None
            }
        }
    }

    pub fn req_nonempty(&mut self, map: &RawMap, key: &str, path: &str, req: &str) -> Option<String> {
        let s = self.req_string(map, key, path, req)?;
        if s.trim().is_empty() {
            let line = map.key_line(key);
            self.v(req, &join(path, key), line, format!("`{key}` is present but empty"));
            return None;
        }
        Some(s)
    }

    pub fn req_map<'m>(&mut self, map: &'m RawMap, key: &str, path: &str, req: &str) -> Option<&'m RawMap> {
        match map.get(key) {
            None => {
                self.v(req, &join(path, key), map_line(map), format!("required field `{key}` is missing"));
                None
            }
            Some(node) => match node.as_map() {
                Some(m) => Some(m),
                None => {
                    self.v(req, &join(path, key), node.line, format!("expected a mapping, found a {}", node.kind_name()));
                    None
                }
            },
        }
    }

    /// A list-typed field. ERF-56: absent means empty. ERF-55: present-but-empty is a
    /// serialization violation, because "empty lists MUST be omitted".
    pub fn list<'m>(&mut self, map: &'m RawMap, key: &str, path: &str, req: &str) -> Vec<&'m RawNode> {
        match map.get(key) {
            None => Vec::new(),
            Some(node) => match node.as_seq() {
                Some(items) => {
                    if items.is_empty() {
                        self.v("ERF-55", &join(path, key), node.line, format!("`{key}` is an empty list; empty lists MUST be omitted (a field's absence means none)"));
                    }
                    items.iter().collect()
                }
                None => {
                    self.v(req, &join(path, key), node.line, format!("expected a list, found a {}", node.kind_name()));
                    Vec::new()
                }
            },
        }
    }

    pub fn id_list(&mut self, map: &RawMap, key: &str, path: &str, req: &str) -> Vec<String> {
        let items: Vec<(String, usize)> = self
            .list(map, key, path, req)
            .into_iter()
            .enumerate()
            .filter_map(|(i, n)| n.as_scalar().map(|(t, _)| (t.to_string(), n.line)).or_else(|| {
                Some((format!("<{} at index {}>", n.kind_name(), i), n.line))
            }))
            .collect();
        let mut out = Vec::new();
        for (i, (text, line)) in items.into_iter().enumerate() {
            let field = format!("{}[{}]", join(path, key), i);
            if text.starts_with('<') {
                self.v(req, &field, line, "expected an id string");
                continue;
            }
            // ERF-15: bare ids, no location encoded.
            if text.contains('/') || text.contains('#') || text.ends_with(".md") || text.contains("..") {
                self.v("ERF-15", &field, line, format!("`{text}` encodes a location; references MUST be bare ids"));
            }
            out.push(text);
        }
        out
    }

    pub fn timestamp(&mut self, map: &RawMap, key: &str, path: &str, req: &str) -> Option<Timestamp> {
        let s = self.req_string(map, key, path, req)?;
        let ts = Timestamp::parse(&s);
        if let Timestamp::Malformed(_) = ts {
            let line = map.key_line(key);
            self.v(req, &join(path, key), line, format!("`{s}` is neither an RFC 3339 instant nor a bare YYYY-MM-DD date"));
        }
        Some(ts)
    }

    pub fn actor_stamp(&mut self, map: &RawMap, key: &str, path: &str, req: &str) -> Option<ActorStamp> {
        let m = self.req_map(map, key, path, req)?.clone();
        let p = join(path, key);
        self.check_keys(&m, &["timestamp", "by"], &p, "an ActorStamp");
        let timestamp = self.timestamp(&m, "timestamp", &p, req)?;
        let by_s = self.req_nonempty(&m, "by", &p, req)?;
        let by = ActorId::parse(&by_s);
        if let ActorId::Malformed(_) = by {
            let line = m.key_line("by");
            self.v("§2", &join(&p, "by"), line, format!("actor id `{by_s}` follows none of `human:<id>`, `<producer>/<version>`, `process:<id>`"));
        }
        Some(ActorStamp { timestamp, by })
    }

    pub fn audit_list(&mut self, map: &RawMap, key: &str, path: &str) -> Vec<AuditEntry> {
        let nodes: Vec<RawNode> = self.list(map, key, path, "§3").into_iter().cloned().collect();
        let mut out = Vec::new();
        for (i, node) in nodes.iter().enumerate() {
            let p = format!("{}[{}]", join(path, key), i);
            let Some(m) = node.as_map() else {
                self.v("§3", &p, node.line, format!("expected an audit entry mapping, found a {}", node.kind_name()));
                continue;
            };
            self.check_keys(m, &["auditor", "verdict", "timestamp", "protocol"], &p, "an audit entry");
            let auditor = self.req_nonempty(m, "auditor", &p, "ERF-11");
            let verdict_s = self.req_nonempty(m, "verdict", &p, "ERF-12");
            let timestamp = self.timestamp(m, "timestamp", &p, "ERF-58");
            let protocol = self.req_nonempty(m, "protocol", &p, "ERF-11");
            let verdict = match verdict_s.as_deref().and_then(Verdict::parse) {
                Some(v) => Some(v),
                None => {
                    if let Some(vs) = &verdict_s {
                        let line = m.key_line("verdict");
                        self.v("ERF-12", &join(&p, "verdict"), line, format!("`{vs}` is not a verdict; a verdict MUST be exactly one of SUPPORTED, PARTIAL, UNSUPPORTED (a failed or abandoned audit is not written as a verdict)"));
                    }
                    None
                }
            };
            if let (Some(auditor), Some(verdict), Some(timestamp), Some(protocol)) =
                (auditor, verdict, timestamp, protocol)
            {
                out.push(AuditEntry { auditor, verdict, timestamp, protocol });
            }
        }
        out
    }
}

pub fn join(path: &str, key: &str) -> String {
    if path.is_empty() {
        key.to_string()
    } else {
        format!("{path}.{key}")
    }
}

fn map_line(map: &RawMap) -> usize {
    map.entries.first().map(|(_, l, _)| *l).unwrap_or(1)
}
