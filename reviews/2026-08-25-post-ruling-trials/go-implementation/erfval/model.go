package main

import (
	"regexp"
	"strings"
	"time"
)

type Record struct {
	File   *LoadedFile
	Type   string // atom | claim | survey
	ID     string
	Corpus string
	FM     *Val
	Owner  *Corpus
}

type Source struct {
	ID  string
	Val *Val
}

// ---------------------------------------------------------------------------
// Known field sets, for ERF-55's "A producer MUST NOT originate a field the
// declared spec_version does not define" and ERF-72's `x_` exemption.
// ---------------------------------------------------------------------------

var knownFields = map[string]map[string]bool{
	"atom": set("id", "type", "corpus", "finding", "quote", "source",
		"source_quality", "as_of_date", "limitations", "created",
		"last_modified", "finding_audit"),
	"claim": set("id", "type", "corpus", "title", "epistemic_kind", "created",
		"last_modified", "short_name", "families", "atoms_for",
		"atoms_against", "surveys", "edges", "standings", "evidence_audit",
		"semantic_query", "body"),
	"survey": set("id", "type", "corpus", "title", "conducted", "searches",
		"notable_results", "prior_survey", "last_modified", "body"),
	"corpus":    set("type", "id", "title", "spec_version", "classification", "owner"),
	"sources":   set("type", "sources"),
	"narrative": set("type", "title", "corpus", "created"),
}

var sourceFields = set("citation_text", "citation", "received", "status",
	"normalized", "normalized_digest", "reason", "licence", "licence_name",
	"excerpt", "extraction", "normalization")

var receivedFields = set("url", "path", "digest", "timestamp")
var stampFields = set("timestamp", "by")
var standingFields = set("timestamp", "stance", "by", "why", "evidence_at_stance")
var evidenceAtStanceFields = set("atoms_for", "atoms_against")
var auditFields = set("auditor", "verdict", "timestamp", "protocol")
var searchActFields = set("tool", "query", "scope", "hits_reported", "timestamp")
var notableFields = set("what", "note", "atoms")
var edgeFields = set("to", "relation")

// listFields per record type, for ERF-55 ("Empty lists MUST be omitted") and
// ERF-56 ("A reader MUST materialize an omitted list-typed field as an empty
// list").
var listFields = map[string][]string{
	"atom":   {"finding_audit"},
	"claim":  {"families", "atoms_for", "atoms_against", "surveys", "edges", "standings", "evidence_audit"},
	"survey": {"searches", "notable_results"},
}

func set(ss ...string) map[string]bool {
	m := map[string]bool{}
	for _, s := range ss {
		m[s] = true
	}
	return m
}

// ---------------------------------------------------------------------------
// Closed vocabularies (section 5). "A value outside them is a validation
// failure, not a dialect."
// ---------------------------------------------------------------------------

var epistemicKinds = set("observation", "argument", "bet", "commitment")
var stances = set("for", "against", "withdrawn")
var relations = set("supports", "assumes", "decomposes-into", "conflicts-with")
var sourceQualities = set("high", "medium", "low")
var verdicts = set("SUPPORTED", "PARTIAL", "UNSUPPORTED")
var sourceStatuses = set("shipped", "shipped-as-quotation", "not-redistributable",
	"access-restricted", "licence-unverified")

// absenceStatuses is ERF-5's closed set: the statuses that record that no
// normalized text is held.
var absenceStatuses = set("not-redistributable", "access-restricted", "licence-unverified")

// ---------------------------------------------------------------------------
// Actor grammar. Section 2, Definitions: "actor: `human:<id>` for a person,
// `<producer>/<version>` for a model or agent, `process:<id>` for automation.
// Every actor id MUST follow this convention."
//
// Note this is a MUST that carries no ERF number, so it belongs to no
// conformance class by the section-1 wording. See ambiguities.md A-08.
// ---------------------------------------------------------------------------

var reHumanActor = regexp.MustCompile(`^human:[^\s/]+$`)
var reProcessActor = regexp.MustCompile(`^process:[^\s/]+$`)
var reAgentActor = regexp.MustCompile(`^[^\s:/]+/[^\s/]+$`)

func validActor(s string) bool {
	return reHumanActor.MatchString(s) || reProcessActor.MatchString(s) || reAgentActor.MatchString(s)
}
func isHumanActor(s string) bool { return reHumanActor.MatchString(s) }

// ---------------------------------------------------------------------------
// Timestamps.
// ---------------------------------------------------------------------------

type TSPrecision int

const (
	TSInvalid TSPrecision = iota
	TSYear
	TSMonth
	TSDate
	TSInstant
)

type TS struct {
	Raw       string
	Precision TSPrecision
	T         time.Time // start of the represented period, in UTC
}

var reYear = regexp.MustCompile(`^\d{4}$`)
var reYearMonth = regexp.MustCompile(`^\d{4}-\d{2}$`)
var reDate = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

// parseTS accepts a bare year, a year-month, a bare date, or a full RFC 3339
// instant. The format uses bare dates for `created`, `conducted`, `bound-at`
// and `as_of_date`, and requires a full instant only in `standings` (ERF-19).
func parseTS(s string) TS {
	s = strings.TrimSpace(s)
	switch {
	case reYear.MatchString(s):
		if t, err := time.Parse("2006", s); err == nil {
			return TS{s, TSYear, t.UTC()}
		}
	case reYearMonth.MatchString(s):
		if t, err := time.Parse("2006-01", s); err == nil {
			return TS{s, TSMonth, t.UTC()}
		}
	case reDate.MatchString(s):
		if t, err := time.Parse("2006-01-02", s); err == nil {
			return TS{s, TSDate, t.UTC()}
		}
	default:
		if t, err := time.Parse(time.RFC3339, s); err == nil {
			return TS{s, TSInstant, t.UTC()}
		}
		if t, err := time.Parse(time.RFC3339Nano, s); err == nil {
			return TS{s, TSInstant, t.UTC()}
		}
	}
	return TS{Raw: s, Precision: TSInvalid}
}

// sameDay reports whether two timestamps fall on the same calendar day in UTC.
func sameDay(a, b TS) bool {
	ay, am, ad := a.T.Date()
	by, bm, bd := b.T.Date()
	return ay == by && am == bm && ad == bd
}

// StalenessVerdict is the ERF-47 / ERF-32 three-way answer.
type StalenessVerdict int

const (
	StaleCurrent StalenessVerdict = iota
	StaleStale
	StaleIndeterminate
)

// isStale implements ERF-47: "a finding_audit, evidence_audit, or narrative
// binding older than the last change to what it judged is flagged stale.
// Where the two stamps differ in precision and the coarser one cannot order
// them (a bare date against a full instant on the same day), the comparison
// MUST resolve to stale [...]. Two bare dates that are equal read as current."
//
// judged = the stamp on the thing judged (the change). judge = the stamp on
// the judgment (audit timestamp, or a binding's bound-at).
func isStale(judge, judged TS) StalenessVerdict {
	if judge.Precision == TSInvalid || judged.Precision == TSInvalid {
		return StaleIndeterminate
	}
	if judged.T.After(judge.T) && !sameDay(judge, judged) {
		return StaleStale
	}
	if sameDay(judge, judged) {
		if judge.Precision == judged.Precision {
			// Two stamps of equal precision on the same day.
			if judged.T.After(judge.T) {
				return StaleStale
			}
			return StaleCurrent
		}
		// Differing precision on the same day: the coarser cannot order them.
		return StaleStale
	}
	if judged.T.After(judge.T) {
		return StaleStale
	}
	return StaleCurrent
}
