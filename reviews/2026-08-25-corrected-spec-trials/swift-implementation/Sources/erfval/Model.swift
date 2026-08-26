import Foundation

/// Reading switches for the places where the prose admits more than one
/// implementation. Defaults are the readings argued for in ambiguities.md.
enum Options {
    /// ERF-31 #1: delimit the HTML comment at the first `-->` before applying
    /// the binding grammar, rather than letting the grammar find its own `-->`.
    static var commentFirst = false
}

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

enum Severity: String {
    case violation = "VIOLATION"
    case flag = "FLAG"
    case info = "INFO"
}

struct Finding {
    let severity: Severity
    let requirement: String
    let file: String
    let line: Int?
    let message: String
}

final class Report {
    private(set) var findings: [Finding] = []
    func add(_ s: Severity, _ req: String, _ file: String, _ line: Int?, _ msg: String) {
        findings.append(Finding(severity: s, requirement: req, file: file, line: line, message: msg))
    }
    var violations: [Finding] { findings.filter { $0.severity == .violation } }
    var flags: [Finding] { findings.filter { $0.severity == .flag } }
    var infos: [Finding] { findings.filter { $0.severity == .info } }
}

// ---------------------------------------------------------------------------
// Timestamps
// ---------------------------------------------------------------------------

struct Stamp {
    enum Precision: Int { case year = 0, yearMonth = 1, date = 2, instant = 3 }
    let raw: String
    let precision: Precision
    let instant: Date?       // populated for .instant
    let dayKey: String?      // "YYYY-MM-DD" when precision >= .date

    static func parse(_ raw: String) -> Stamp? {
        let s = raw.trimmingCharacters(in: .whitespaces)
        if s.count == 4, s.allSatisfy({ $0.isASCII && $0.isNumber }) {
            return Stamp(raw: s, precision: .year, instant: nil, dayKey: nil)
        }
        if s.count == 7, matches(s, "^[0-9]{4}-[0-9]{2}$") {
            return Stamp(raw: s, precision: .yearMonth, instant: nil, dayKey: nil)
        }
        if s.count == 10, matches(s, "^[0-9]{4}-[0-9]{2}-[0-9]{2}$") {
            return Stamp(raw: s, precision: .date, instant: nil, dayKey: s)
        }
        if let d = rfc3339(s) {
            return Stamp(raw: s, precision: .instant, instant: d, dayKey: String(s.prefix(10)))
        }
        return nil
    }

    static func isFullInstant(_ raw: String) -> Bool {
        return parse(raw)?.precision == .instant
    }

    /// A full RFC 3339 instant: a date, a time, and an offset (ERF-19).
    private static func rfc3339(_ s: String) -> Date? {
        guard matches(s, "^[0-9]{4}-[0-9]{2}-[0-9]{2}[Tt ][0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]+)?([Zz]|[+-][0-9]{2}:[0-9]{2})$")
        else { return nil }
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: s) { return d }
        let g = ISO8601DateFormatter()
        g.formatOptions = [.withInternetDateTime]
        return g.date(from: s)
    }

    static func matches(_ s: String, _ pattern: String) -> Bool {
        return s.range(of: pattern, options: .regularExpression) != nil
    }
}

enum Staleness: String { case current, stale, indeterminate }

/// ERF-47. "a `finding_audit`, `evidence_audit`, or narrative binding older
/// than the last change to what it judged is flagged stale. Where the two
/// stamps differ in precision and the coarser one cannot order them (a bare
/// date against a full instant on the same day), the comparison MUST resolve
/// to stale [...] Two bare dates that are equal read as current."
func stalenessOf(judgedAt: Stamp?, changedAt: Stamp?) -> Staleness {
    guard let j = judgedAt, let c = changedAt else { return .indeterminate }
    if let jd = j.dayKey, let cd = c.dayKey {
        if cd > jd { return .stale }
        if cd < jd { return .current }
        // Same day.
        if j.precision == .instant && c.precision == .instant,
           let ji = j.instant, let ci = c.instant {
            return ci > ji ? .stale : .current
        }
        if j.precision == .date && c.precision == .date { return .current }
        // Mixed precision on the same day: cannot order, resolve to stale.
        return .stale
    }
    return .indeterminate
}

// ---------------------------------------------------------------------------
// Loaded documents
// ---------------------------------------------------------------------------

struct LoadedFile {
    let path: String
    let relPath: String
    let type: String?
    let front: YMapping?
    let body: String
    let hasFrontmatterFence: Bool
    let diagnostics: [YamlDiagnostic]
}

struct ActorStamp {
    let timestamp: Stamp?
    let rawTimestamp: String?
    let by: String?
}

struct AuditEntry {
    let auditor: String?
    let verdict: String?
    let timestamp: Stamp?
    let rawTimestamp: String?
    let proto: String?
    let line: Int
}

struct StandingEntry {
    let rawTimestamp: String?
    let timestamp: Stamp?
    let stance: String?
    let by: String?
    let why: String?
    let evidenceAtStance: (forIds: [String], againstIds: [String])?
    let index: Int
    let line: Int
}

struct Edge { let to: String; let relation: String; let line: Int }

struct Atom {
    let id: String
    let file: String
    let corpus: String?
    let finding: String?
    let quote: String?
    let source: String?
    let sourceQuality: String?
    let asOfDate: String?
    let limitations: String?
    let created: ActorStamp?
    let lastModified: ActorStamp?
    let findingAudit: [AuditEntry]
    let line: Int
}

struct Claim {
    let id: String
    let file: String
    let corpus: String?
    let title: String?
    let epistemicKind: String?
    let created: ActorStamp?
    let lastModified: ActorStamp?
    let families: [String]
    let atomsFor: [String]
    let atomsAgainst: [String]
    let surveys: [String]
    let edges: [Edge]
    let standings: [StandingEntry]
    let evidenceAudit: [AuditEntry]
    let body: String
    let line: Int
}

struct SearchAct {
    let tool: String?
    let query: String?
    let scope: String?
    let hitsReported: String?
    let timestamp: Stamp?
    let line: Int
}

struct Survey {
    let id: String
    let file: String
    let corpus: String?
    let title: String?
    let conducted: ActorStamp?
    let lastModified: ActorStamp?
    let searches: [SearchAct]
    let notableAtoms: [String]
    let priorSurvey: String?
    let line: Int
}

struct SourceEntry {
    let id: String
    let citationText: String?
    let status: String?
    let normalized: String?
    let normalizedDigest: String?
    let reason: String?
    let licence: String?
    let excerptBy: String?
    let extraction: String?
    let normalization: String?
    let receivedTimestamp: String?
    let line: Int
}

struct Narrative {
    let file: String
    let title: String?
    let corpus: String?
    let created: ActorStamp?
    let body: String
    let bindings: [NarrativeBinding]
}

struct Declaration {
    let file: String
    let id: String?
    let title: String?
    let specVersion: String?
    let owner: String?
    let classification: String?
}

final class Corpus {
    var declaration: Declaration?
    var declarationFiles: [String] = []
    var sources: [String: SourceEntry] = [:]
    var sourceListFiles: [String] = []
    var atoms: [String: Atom] = [:]
    var claims: [String: Claim] = [:]
    var surveys: [String: Survey] = [:]
    var narratives: [Narrative] = []
    var idOwner: [String: String] = [:]     // id -> file, for ERF-36/38
    var ignoredFiles: [String] = []
}

// ---------------------------------------------------------------------------
// ERF-65: which fields the model types as strings.
//
// The model of section 3 types these as `string` or as a string-literal union.
// Note the gap recorded in ambiguities.md (ERF-65 #1): section 3 says it
// "omits the file's [...] identifier alias definitions (`AtomId`, `ClaimId`,
// `SurveyId`, `SourceId`, `CorpusId`, `FamilyName`, `CSL`)" and that
// `types/erf.ts` governs. Every id-bearing field below is therefore typed by a
// definition this document does not contain; we infer `string` for the six id
// aliases and treat `CSL` as untyped-by-the-model (so nothing inside a
// `citation` block is checked here).
// ---------------------------------------------------------------------------

struct FieldSpec {
    let key: String
    let kind: Kind
    enum Kind {
        case string                       // scalar, must load as a string
        case stringList                   // sequence of strings
        case actorStamp                   // {timestamp: string, by: string}
        case auditList
        case standingList
        case edgeList
        case searchActList
        case notableResultsList
        case untyped                      // present in the file, not typed by the model
    }
}

enum Schema {
    static let atom: [FieldSpec] = [
        .init(key: "id", kind: .string), .init(key: "type", kind: .string),
        .init(key: "corpus", kind: .string), .init(key: "finding", kind: .string),
        .init(key: "quote", kind: .string), .init(key: "source", kind: .string),
        .init(key: "source_quality", kind: .string), .init(key: "as_of_date", kind: .string),
        .init(key: "limitations", kind: .string),
        .init(key: "created", kind: .actorStamp), .init(key: "last_modified", kind: .actorStamp),
        .init(key: "finding_audit", kind: .auditList),
    ]
    static let claim: [FieldSpec] = [
        .init(key: "id", kind: .string), .init(key: "type", kind: .string),
        .init(key: "corpus", kind: .string), .init(key: "title", kind: .string),
        .init(key: "epistemic_kind", kind: .string), .init(key: "short_name", kind: .string),
        .init(key: "semantic_query", kind: .string),
        .init(key: "created", kind: .actorStamp), .init(key: "last_modified", kind: .actorStamp),
        .init(key: "families", kind: .stringList), .init(key: "atoms_for", kind: .stringList),
        .init(key: "atoms_against", kind: .stringList), .init(key: "surveys", kind: .stringList),
        .init(key: "edges", kind: .edgeList), .init(key: "standings", kind: .standingList),
        .init(key: "evidence_audit", kind: .auditList),
    ]
    static let survey: [FieldSpec] = [
        .init(key: "id", kind: .string), .init(key: "type", kind: .string),
        .init(key: "corpus", kind: .string), .init(key: "title", kind: .string),
        .init(key: "conducted", kind: .actorStamp), .init(key: "last_modified", kind: .actorStamp),
        .init(key: "searches", kind: .searchActList),
        .init(key: "notable_results", kind: .notableResultsList),
        .init(key: "prior_survey", kind: .string),
    ]
    static let declaration: [FieldSpec] = [
        .init(key: "type", kind: .string), .init(key: "id", kind: .string),
        .init(key: "title", kind: .string), .init(key: "spec_version", kind: .string),
        .init(key: "classification", kind: .string), .init(key: "owner", kind: .string),
    ]
    static let source: [FieldSpec] = [
        .init(key: "citation_text", kind: .string), .init(key: "citation", kind: .untyped),
        .init(key: "received", kind: .untyped), .init(key: "status", kind: .string),
        .init(key: "normalized", kind: .string), .init(key: "normalized_digest", kind: .string),
        .init(key: "reason", kind: .string), .init(key: "licence", kind: .string),
        .init(key: "licence_name", kind: .string), .init(key: "excerpt", kind: .actorStamp),
        .init(key: "extraction", kind: .string), .init(key: "normalization", kind: .string),
    ]
    static let receivedFields = ["url", "path", "digest", "timestamp"]
    static let narrative: [FieldSpec] = [
        .init(key: "type", kind: .string), .init(key: "title", kind: .string),
        .init(key: "corpus", kind: .string), .init(key: "created", kind: .actorStamp),
    ]
}
