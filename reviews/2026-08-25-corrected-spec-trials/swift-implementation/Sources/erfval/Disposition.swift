import Foundation

// ---------------------------------------------------------------------------
// ERF-41.
//
// "Disposition MUST be computed, never stored, from the current stances alone,
//  meaning each person's newest entry. With no standings at all the
//  disposition is `proposal`. Otherwise discard every current stance of
//  `withdrawn` [...] nothing remaining means `retired`; all `for` means
//  `active`; all `against` means `rejected`; both `for` and `against`
//  remaining means `contested`. A standing whose `stance` is outside that
//  vocabulary is a producer error (`ERF-55`), MUST be reported, and MUST be
//  left out of this computation as though the entry were absent [...] With
//  that, every input has exactly one reading."
// ---------------------------------------------------------------------------

enum Disposition: String {
    case proposal, active, contested, rejected, retired
}

struct DispositionResult {
    let disposition: Disposition
    let trace: [String]
}

enum DispositionCalc {

    static let vocabulary: Set<String> = ["for", "against", "withdrawn"]

    static func compute(_ standings: [StandingEntry]) -> DispositionResult {
        var trace: [String] = []

        // "left out of this computation as though the entry were absent".
        // We read this as removal from the ledger BEFORE per-person newest
        // selection, so a person's last valid entry still governs, and a claim
        // all of whose entries are out-of-vocabulary has "no standings at all"
        // and is a proposal. See ambiguities.md, ERF-41 #1.
        let usable = standings.filter { s in
            guard let st = s.stance else { return false }
            return vocabulary.contains(st)
        }
        trace.append("entries=\(standings.count) usable=\(usable.count) (out-of-vocabulary entries dropped as though absent)")

        if usable.isEmpty {
            trace.append("no standings at all -> proposal")
            return DispositionResult(disposition: .proposal, trace: trace)
        }

        // Current stance = each person's newest entry.
        var newest: [String: StandingEntry] = [:]
        for e in usable {
            let person = e.by ?? "<no by>"
            guard let prev = newest[person] else { newest[person] = e; continue }
            if isNewer(e, than: prev) { newest[person] = e }
        }
        for (p, e) in newest.sorted(by: { $0.key < $1.key }) {
            trace.append("  current stance of \(p): \(e.stance ?? "?") @ \(e.rawTimestamp ?? "?")")
        }

        // Discard every current stance of `withdrawn`.
        let remaining = newest.values.filter { $0.stance != "withdrawn" }
        if remaining.isEmpty {
            trace.append("nothing remaining after discarding withdrawn -> retired")
            return DispositionResult(disposition: .retired, trace: trace)
        }
        let hasFor = remaining.contains { $0.stance == "for" }
        let hasAgainst = remaining.contains { $0.stance == "against" }
        let d: Disposition
        if hasFor && hasAgainst { d = .contested }
        else if hasFor { d = .active }
        else { d = .rejected }
        trace.append("remaining: for=\(hasFor) against=\(hasAgainst) -> \(d.rawValue)")
        return DispositionResult(disposition: d, trace: trace)
    }

    /// "each person's newest entry". Ordering is by the RFC 3339 instant
    /// ERF-19 requires. Two entries by one person at the SAME instant are not
    /// addressed by the spec; we break the tie by ledger position, since
    /// `standings` is append-only and later position means later append.
    /// See ambiguities.md, ERF-41 #2.
    private static func isNewer(_ a: StandingEntry, than b: StandingEntry) -> Bool {
        let ai = a.timestamp?.instant
        let bi = b.timestamp?.instant
        switch (ai, bi) {
        case let (x?, y?):
            if x != y { return x > y }
            return a.index > b.index
        case (_?, nil): return true          // a parseable instant beats an unparseable one
        case (nil, _?): return false
        case (nil, nil): return a.index > b.index
        }
    }
}
