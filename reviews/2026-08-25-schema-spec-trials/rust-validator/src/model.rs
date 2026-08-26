//! The closed vocabularies as enums, and the typed view the relational checks
//! (ERF-41, ERF-43, ERF-49) run over. Section 5: "Closed sets. A value outside
//! them is a validation failure, not a dialect."

use crate::util::Stamp;
use serde_json::Value;

macro_rules! closed {
    ($name:ident { $( $variant:ident => $lit:literal ),* $(,)? }) => {
        #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
        pub enum $name { $( $variant ),* }
        impl $name {
            pub fn parse(s: &str) -> Option<Self> {
                match s { $( $lit => Some($name::$variant), )* _ => None }
            }
            #[allow(dead_code)]
            pub fn as_str(&self) -> &'static str {
                match self { $( $name::$variant => $lit, )* }
            }
        }
    };
}

closed!(Stance { For => "for", Against => "against", Withdrawn => "withdrawn" });
closed!(EpistemicKind {
    Observation => "observation",
    Argument => "argument",
    Bet => "bet",
    Commitment => "commitment",
});
closed!(Relation {
    Supports => "supports",
    Assumes => "assumes",
    DecomposesInto => "decomposes-into",
    ConflictsWith => "conflicts-with",
});
closed!(Verdict {
    Supported => "SUPPORTED",
    Partial => "PARTIAL",
    Unsupported => "UNSUPPORTED",
});
closed!(SourceQuality { High => "high", Medium => "medium", Low => "low" });
closed!(SourceStatus {
    Shipped => "shipped",
    ShippedAsQuotation => "shipped-as-quotation",
    NotRedistributable => "not-redistributable",
    AccessRestricted => "access-restricted",
    LicenceUnverified => "licence-unverified",
});
closed!(FileKind {
    Atom => "atom",
    Claim => "claim",
    Survey => "survey",
    CorpusDecl => "corpus",
    SourceList => "sources",
    Narrative => "narrative",
});

/// ERF-41's five readings. Never a stored field.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Disposition {
    Proposal,
    Active,
    Contested,
    Rejected,
    Retired,
}

impl Disposition {
    pub fn as_str(&self) -> &'static str {
        // ERF-42: `rejected` and `retired` MUST NOT be conflated. They are two
        // distinct strings here and nowhere collapsed.
        match self {
            Disposition::Proposal => "proposal",
            Disposition::Active => "active",
            Disposition::Contested => "contested",
            Disposition::Rejected => "rejected",
            Disposition::Retired => "retired",
        }
    }
}

/// Section 2: "`human:<id>` for a person, `<producer>/<version>` for a model or
/// agent, `process:<id>` for automation."
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ActorForm {
    Human,
    Agent,
    Process,
    Malformed,
}

pub fn actor_form(s: &str) -> ActorForm {
    let bad = |t: &str| t.chars().any(|c| c.is_whitespace() || c == '"' || c == '<' || c == '>');
    if let Some(rest) = s.strip_prefix("human:") {
        if !rest.is_empty() && !rest.contains('/') && !bad(rest) {
            return ActorForm::Human;
        }
        return ActorForm::Malformed;
    }
    if let Some(rest) = s.strip_prefix("process:") {
        if !rest.is_empty() && !bad(rest) {
            return ActorForm::Process;
        }
        return ActorForm::Malformed;
    }
    if let Some((p, v)) = s.split_once('/') {
        if !p.is_empty() && !v.is_empty() && !p.contains(':') && !bad(p) && !bad(v) {
            return ActorForm::Agent;
        }
    }
    ActorForm::Malformed
}

// ---------------------------------------------------------------------------

#[derive(Debug, Clone)]
pub struct StandingEntry {
    pub index: usize,
    pub stance: Option<Stance>,
    pub raw_stance: String,
    pub by: String,
    pub timestamp_raw: String,
    pub timestamp: Option<Stamp>,
    pub why_present: bool,
    pub evidence_at_stance: Option<(Vec<String>, Vec<String>)>,
}

impl StandingEntry {
    /// ERF-41: "An entry is admissible when its `stance` is in the vocabulary,
    /// its `timestamp` is an instant (ERF-19) and its `by` is a `human:` actor
    /// (ERF-21)".
    pub fn admissible(&self) -> Result<(Stance, Stamp), String> {
        let Some(stance) = self.stance else {
            return Err(format!(
                "`stance: {}` is outside the vocabulary",
                self.raw_stance
            ));
        };
        let Some(ts) = self.timestamp else {
            return Err(format!(
                "`timestamp: {}` is not an RFC 3339 instant",
                self.timestamp_raw
            ));
        };
        if !ts.is_instant() {
            return Err(format!(
                "`timestamp: {}` is a bare date, not an instant",
                self.timestamp_raw
            ));
        }
        if actor_form(&self.by) != ActorForm::Human {
            return Err(format!("`by: {}` is not a `human:` actor", self.by));
        }
        Ok((stance, ts))
    }
}

#[derive(Debug, Clone)]
pub struct AuditEntry {
    pub auditor: String,
    #[allow(dead_code)]
    pub verdict: Option<Verdict>,
    pub timestamp: Option<Stamp>,
    #[allow(dead_code)]
    pub timestamp_raw: String,
    pub protocol: String,
}

#[derive(Debug, Clone)]
pub struct Edge {
    pub to: String,
    pub relation: Option<Relation>,
    pub raw_relation: String,
}

/// One file that carries a `type`, loaded.
#[derive(Debug)]
pub struct File {
    /// path relative to the corpus root, for reporting
    pub rel: String,
    pub abs: std::path::PathBuf,
    pub kind: Option<FileKind>,
    pub raw_type: String,
    /// the instance handed to the schema: frontmatter plus `body` where the
    /// model has one (section 3)
    pub value: Value,
    pub body: Option<String>,
    /// how many lines of the file precede the body, so narrative-binding
    /// diagnostics can name a line in the file rather than in the body
    pub body_line_offset: usize,
    #[allow(dead_code)]
    pub corpus_dir: usize,
}

pub fn s(v: &Value, k: &str) -> Option<String> {
    v.get(k).and_then(|x| x.as_str()).map(str::to_string)
}

pub fn id_list(v: &Value, k: &str) -> Vec<String> {
    v.get(k)
        .and_then(|x| x.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|e| e.as_str().map(str::to_string))
                .collect()
        })
        .unwrap_or_default()
}

pub fn stamp_of(v: &Value, k: &str) -> (Option<Stamp>, String) {
    match v.get(k).and_then(|x| x.get("timestamp")) {
        Some(Value::String(t)) => (crate::util::parse_stamp(t).ok(), t.clone()),
        Some(other) => (None, other.to_string()),
        None => (None, String::new()),
    }
}

pub fn standings_of(v: &Value) -> Vec<StandingEntry> {
    let Some(arr) = v.get("standings").and_then(|x| x.as_array()) else {
        return Vec::new();
    };
    arr.iter()
        .enumerate()
        .map(|(index, e)| {
            let raw_stance = e
                .get("stance")
                .map(|x| x.as_str().map(str::to_string).unwrap_or_else(|| x.to_string()))
                .unwrap_or_default();
            let ts_raw = e
                .get("timestamp")
                .map(|x| x.as_str().map(str::to_string).unwrap_or_else(|| x.to_string()))
                .unwrap_or_default();
            StandingEntry {
                index,
                stance: Stance::parse(&raw_stance),
                raw_stance,
                by: s(e, "by").unwrap_or_default(),
                timestamp: crate::util::parse_stamp(&ts_raw).ok(),
                timestamp_raw: ts_raw,
                why_present: e
                    .get("why")
                    .and_then(|x| x.as_str())
                    .map(|x| !x.is_empty())
                    .unwrap_or(false),
                evidence_at_stance: e.get("evidence_at_stance").map(|eas| {
                    (id_list(eas, "atoms_for"), id_list(eas, "atoms_against"))
                }),
            }
        })
        .collect()
}

pub fn audits_of(v: &Value, key: &str) -> Vec<AuditEntry> {
    let Some(arr) = v.get(key).and_then(|x| x.as_array()) else {
        return Vec::new();
    };
    arr.iter()
        .map(|e| {
            let ts_raw = e
                .get("timestamp")
                .map(|x| x.as_str().map(str::to_string).unwrap_or_else(|| x.to_string()))
                .unwrap_or_default();
            AuditEntry {
                auditor: s(e, "auditor").unwrap_or_default(),
                verdict: s(e, "verdict").and_then(|x| Verdict::parse(&x)),
                timestamp: crate::util::parse_stamp(&ts_raw).ok(),
                timestamp_raw: ts_raw,
                protocol: s(e, "protocol").unwrap_or_default(),
            }
        })
        .collect()
}

pub fn edges_of(v: &Value) -> Vec<Edge> {
    let Some(arr) = v.get("edges").and_then(|x| x.as_array()) else {
        return Vec::new();
    };
    arr.iter()
        .map(|e| {
            let raw = e
                .get("relation")
                .map(|x| x.as_str().map(str::to_string).unwrap_or_else(|| x.to_string()))
                .unwrap_or_default();
            Edge {
                to: s(e, "to").unwrap_or_default(),
                relation: Relation::parse(&raw),
                raw_relation: raw,
            }
        })
        .collect()
}

/// ERF-41, written so the compiler forces every case.
///
/// "No standings: `proposal`. Otherwise discard every current `withdrawn`,
///  withdrawal being exit and not opposition, and read the rest: none
///  remaining, `retired`; all `for`, `active`; all `against`, `rejected`;
///  both, `contested`."
pub fn disposition(current: &[Stance]) -> Disposition {
    if current.is_empty() {
        return Disposition::Proposal;
    }
    let mut any_for = false;
    let mut any_against = false;
    let mut any_live = false;
    for st in current {
        match st {
            Stance::For => {
                any_for = true;
                any_live = true;
            }
            Stance::Against => {
                any_against = true;
                any_live = true;
            }
            Stance::Withdrawn => {}
        }
    }
    match (any_live, any_for, any_against) {
        (false, _, _) => Disposition::Retired,
        (true, true, false) => Disposition::Active,
        (true, false, true) => Disposition::Rejected,
        (true, true, true) => Disposition::Contested,
        // Unreachable by construction: any_live is set only by For or Against.
        (true, false, false) => unreachable!("a live stance is `for` or `against`"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn erf_41_every_case() {
        use Stance::*;
        assert_eq!(disposition(&[]), Disposition::Proposal);
        assert_eq!(disposition(&[Withdrawn]), Disposition::Retired);
        assert_eq!(disposition(&[Withdrawn, Withdrawn]), Disposition::Retired);
        assert_eq!(disposition(&[For]), Disposition::Active);
        assert_eq!(disposition(&[For, Withdrawn]), Disposition::Active);
        assert_eq!(disposition(&[Against]), Disposition::Rejected);
        assert_eq!(disposition(&[Against, Withdrawn]), Disposition::Rejected);
        assert_eq!(disposition(&[For, Against]), Disposition::Contested);
        assert_eq!(
            disposition(&[For, Against, Withdrawn]),
            Disposition::Contested
        );
    }

    #[test]
    fn actor_forms_are_disjoint() {
        assert_eq!(actor_form("human:fb"), ActorForm::Human);
        assert_eq!(actor_form("agent/claude-fable-5"), ActorForm::Agent);
        assert_eq!(actor_form("process:nightly"), ActorForm::Process);
        assert_eq!(actor_form("human:fb/x"), ActorForm::Malformed);
        assert_eq!(actor_form("plain"), ActorForm::Malformed);
    }
}
