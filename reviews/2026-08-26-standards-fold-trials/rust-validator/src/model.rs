//! The closed vocabularies of SPEC section 5, each an enum with no default arm,
//! plus the timestamp algebra `ERF-19`, `ERF-47` and `ERF-48` need.
//!
//! "Closed sets. A value outside them is a validation failure, not a dialect."
//! Nothing here parses leniently: a value off the list returns `None` and the
//! caller reports it against the requirement that owns the field.

use chrono::{DateTime, FixedOffset, NaiveDate};

// ---------------------------------------------------------------------------
// Closed vocabularies
// ---------------------------------------------------------------------------

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum RecordType {
    Atom,
    Claim,
    Survey,
    CorpusDeclaration,
    SourceList,
    Narrative,
}

impl RecordType {
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "atom" => Some(RecordType::Atom),
            "claim" => Some(RecordType::Claim),
            "survey" => Some(RecordType::Survey),
            "corpus" => Some(RecordType::CorpusDeclaration),
            "sources" => Some(RecordType::SourceList),
            "narrative" => Some(RecordType::Narrative),
            _ => None,
        }
    }
    pub fn as_str(&self) -> &'static str {
        match self {
            RecordType::Atom => "atom",
            RecordType::Claim => "claim",
            RecordType::Survey => "survey",
            RecordType::CorpusDeclaration => "corpus",
            RecordType::SourceList => "sources",
            RecordType::Narrative => "narrative",
        }
    }
    /// "a record" in the format's own sense: SPEC section 2, "*record*: one
    /// atom, claim, or survey". A declaration, a source list and a narrative
    /// are files a corpus holds and are not records (`ERF-34`).
    pub fn is_record(&self) -> bool {
        matches!(self, RecordType::Atom | RecordType::Claim | RecordType::Survey)
    }
    /// Which files carry a markdown body in the model (section 3).
    pub fn has_body(&self) -> bool {
        matches!(self, RecordType::Claim | RecordType::Survey | RecordType::Narrative)
    }
    pub fn schema_def(&self) -> &'static str {
        match self {
            RecordType::Atom => "Atom",
            RecordType::Claim => "Claim",
            RecordType::Survey => "Survey",
            RecordType::CorpusDeclaration => "CorpusDeclaration",
            RecordType::SourceList => "SourceList",
            RecordType::Narrative => "Narrative",
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Verdict {
    Supported,
    Partial,
    Unsupported,
}

impl Verdict {
    /// `ERF-12`: "A verdict MUST be exactly one of `SUPPORTED`, `PARTIAL` or
    /// `UNSUPPORTED`, and a failed, unparseable or abandoned audit MUST NOT be
    /// written as one."
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "SUPPORTED" => Some(Verdict::Supported),
            "PARTIAL" => Some(Verdict::Partial),
            "UNSUPPORTED" => Some(Verdict::Unsupported),
            _ => None,
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Stance {
    For,
    Against,
    Withdrawn,
}

impl Stance {
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "for" => Some(Stance::For),
            "against" => Some(Stance::Against),
            "withdrawn" => Some(Stance::Withdrawn),
            _ => None,
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum EpistemicKind {
    Observation,
    Argument,
    Bet,
    Commitment,
}

impl EpistemicKind {
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "observation" => Some(EpistemicKind::Observation),
            "argument" => Some(EpistemicKind::Argument),
            "bet" => Some(EpistemicKind::Bet),
            "commitment" => Some(EpistemicKind::Commitment),
            _ => None,
        }
    }
    pub fn as_str(&self) -> &'static str {
        match self {
            EpistemicKind::Observation => "observation",
            EpistemicKind::Argument => "argument",
            EpistemicKind::Bet => "bet",
            EpistemicKind::Commitment => "commitment",
        }
    }
    /// `ERF-24`: "`bet` and `commitment` owe no backing, so they have nothing
    /// to audit; auditability is computable from the kind."
    pub fn owes_backing(&self) -> bool {
        match self {
            EpistemicKind::Observation | EpistemicKind::Argument => true,
            EpistemicKind::Bet | EpistemicKind::Commitment => false,
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Relation {
    Supports,
    Assumes,
    DecomposesInto,
    ConflictsWith,
}

impl Relation {
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "supports" => Some(Relation::Supports),
            "assumes" => Some(Relation::Assumes),
            "decomposes-into" => Some(Relation::DecomposesInto),
            "conflicts-with" => Some(Relation::ConflictsWith),
            _ => None,
        }
    }
    pub fn as_str(&self) -> &'static str {
        match self {
            Relation::Supports => "supports",
            Relation::Assumes => "assumes",
            Relation::DecomposesInto => "decomposes-into",
            Relation::ConflictsWith => "conflicts-with",
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum SourceQuality {
    High,
    Medium,
    Low,
}

impl SourceQuality {
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "high" => Some(SourceQuality::High),
            "medium" => Some(SourceQuality::Medium),
            "low" => Some(SourceQuality::Low),
            _ => None,
        }
    }
    /// Section 4.2: "Where `source_quality` is `medium` or `low`, put the
    /// reason in `limitations`."
    pub fn owes_limitations(&self) -> bool {
        match self {
            SourceQuality::High => false,
            SourceQuality::Medium | SourceQuality::Low => true,
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum SourceStatus {
    Shipped,
    ShippedAsQuotation,
    NotRedistributable,
    AccessRestricted,
    LicenceUnverified,
}

impl SourceStatus {
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "shipped" => Some(SourceStatus::Shipped),
            "shipped-as-quotation" => Some(SourceStatus::ShippedAsQuotation),
            "not-redistributable" => Some(SourceStatus::NotRedistributable),
            "access-restricted" => Some(SourceStatus::AccessRestricted),
            "licence-unverified" => Some(SourceStatus::LicenceUnverified),
            _ => None,
        }
    }
    /// The schema's conditional: a status that ships names `normalized`,
    /// anything else names `reason` (`ERF-4`, `ERF-5`).
    pub fn ships(&self) -> bool {
        match self {
            SourceStatus::Shipped | SourceStatus::ShippedAsQuotation => true,
            SourceStatus::NotRedistributable
            | SourceStatus::AccessRestricted
            | SourceStatus::LicenceUnverified => false,
        }
    }
}

/// The computed reading of a claim's standings (`ERF-41`). Never a stored field.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
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

/// The three actor forms of SPEC section 2, disjoint by construction.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum ActorForm {
    Human,
    Agent,
    Process,
}

impl ActorForm {
    /// The patterns are the schema's, not re-derived: `HumanActor`,
    /// `AgentActor`, `ProcessActor`.
    pub fn classify(s: &str) -> Option<Self> {
        let bad = |c: char| c.is_whitespace() || c == '"' || c == '<' || c == '>';
        if let Some(rest) = s.strip_prefix("human:") {
            if !rest.is_empty() && !rest.contains('/') && !rest.chars().any(bad) {
                return Some(ActorForm::Human);
            }
            return None;
        }
        if let Some(rest) = s.strip_prefix("process:") {
            if !rest.is_empty() && !rest.chars().any(bad) {
                return Some(ActorForm::Process);
            }
            return None;
        }
        if let Some((p, v)) = s.split_once('/') {
            if !p.is_empty()
                && !v.is_empty()
                && !p.contains(':')
                && !p.chars().any(bad)
                && !v.chars().any(|c| bad(c) || c == '/')
            {
                return Some(ActorForm::Agent);
            }
        }
        None
    }
}

// ---------------------------------------------------------------------------
// Timestamps
// ---------------------------------------------------------------------------

/// "A date where nothing is ordered, an instant where something is (`ERF-19`)."
/// The two precisions are kept apart because `ERF-47` and `ERF-48` both turn on
/// which one they are looking at.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Stamp {
    Date(NaiveDate),
    Instant(DateTime<FixedOffset>),
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum StampError {
    /// Matches the schema's `Date` pattern but is not a calendar date.
    NotACalendarDate,
    /// Matches the schema's `Instant` pattern but is not an RFC 3339
    /// `date-time`: seconds missing, or a field out of range.
    NotRfc3339Instant,
    /// Neither shape.
    Unrecognized,
}

impl Stamp {
    pub fn parse(s: &str) -> Result<Stamp, StampError> {
        let looks_date = s.len() == 10
            && s.as_bytes().iter().enumerate().all(|(i, c)| {
                if i == 4 || i == 7 { *c == b'-' } else { c.is_ascii_digit() }
            });
        if looks_date {
            return NaiveDate::parse_from_str(s, "%Y-%m-%d")
                .map(Stamp::Date)
                .map_err(|_| StampError::NotACalendarDate);
        }
        if s.contains('T') {
            // RFC 3339 governs its own ground (SPEC section 1). chrono's
            // parse_from_rfc3339 is that standard's reference reading, and it
            // requires the seconds the schema's pattern makes optional.
            return DateTime::parse_from_rfc3339(s)
                .map(Stamp::Instant)
                .map_err(|_| StampError::NotRfc3339Instant);
        }
        Err(StampError::Unrecognized)
    }

    pub fn is_instant(&self) -> bool {
        matches!(self, Stamp::Instant(_))
    }

    pub fn date(&self) -> NaiveDate {
        match self {
            Stamp::Date(d) => *d,
            Stamp::Instant(i) => i.date_naive(),
        }
    }

    /// `ERF-47`'s comparison. "a `finding_audit`, `evidence_audit`, or
    /// narrative binding older than the last change to what it judged is
    /// flagged stale. Where the two stamps differ in precision and the coarser
    /// one cannot order them (a bare date against a full instant on the same
    /// day), the comparison MUST resolve to stale... Two bare dates that are
    /// equal read as current."
    pub fn judged_stale(judgment: &Stamp, change: &Stamp) -> bool {
        match (judgment, change) {
            (Stamp::Instant(a), Stamp::Instant(b)) => a < b,
            (Stamp::Date(a), Stamp::Date(b)) => a < b,
            _ => {
                let (a, b) = (judgment.date(), change.date());
                if a == b {
                    true // mixed precision on the same day: cannot tell, so stale.
                } else {
                    a < b
                }
            }
        }
    }

    /// `ERF-48`'s comparison. "Any change to a record MUST set `last_modified`
    /// to a timestamp later than its `created`... At date precision 'later'
    /// admits the same day."
    pub fn not_later_than(later: &Stamp, earlier: &Stamp) -> bool {
        match (later, earlier) {
            (Stamp::Instant(a), Stamp::Instant(b)) => a <= b,
            _ => later.date() < earlier.date(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rfc3339_needs_its_seconds_even_where_the_schema_pattern_does_not() {
        assert!(matches!(Stamp::parse("2026-08-22T10:30Z"), Err(StampError::NotRfc3339Instant)));
        assert!(Stamp::parse("2026-08-22T10:30:00Z").is_ok());
        assert!(Stamp::parse("2026-08-22T10:30:00+02:00").is_ok());
    }

    #[test]
    fn the_schema_pattern_admits_dates_the_calendar_does_not() {
        assert!(matches!(Stamp::parse("2026-13-45"), Err(StampError::NotACalendarDate)));
        assert!(matches!(Stamp::parse("2026-02-30"), Err(StampError::NotACalendarDate)));
    }

    #[test]
    fn staleness_across_precisions_resolves_to_stale_on_one_day() {
        let d = Stamp::parse("2026-08-22").unwrap();
        let i = Stamp::parse("2026-08-22T10:00:00Z").unwrap();
        assert!(Stamp::judged_stale(&d, &i));
        assert!(Stamp::judged_stale(&i, &d));
        let d2 = Stamp::parse("2026-08-22").unwrap();
        assert!(!Stamp::judged_stale(&d, &d2));
    }

    #[test]
    fn actor_forms_are_disjoint() {
        assert_eq!(ActorForm::classify("human:fb"), Some(ActorForm::Human));
        assert_eq!(ActorForm::classify("agent/claude-fable-5"), Some(ActorForm::Agent));
        assert_eq!(ActorForm::classify("process:nightly"), Some(ActorForm::Process));
        assert_eq!(ActorForm::classify("human:fb/2"), None);
        assert_eq!(ActorForm::classify("deepseek-v4-pro"), None);
    }
}
