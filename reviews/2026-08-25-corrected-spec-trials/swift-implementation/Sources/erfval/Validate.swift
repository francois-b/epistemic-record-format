import Foundation

final class Validator {
    let corpus: Corpus
    let report: Report
    let root: URL
    let loader: Loader
    var dispositions: [String: DispositionResult] = [:]
    var quoteTraces: [String] = []

    init(corpus: Corpus, report: Report, root: URL, loader: Loader) {
        self.corpus = corpus
        self.report = report
        self.root = root
        self.loader = loader
    }

    func run() {
        computeDispositions()
        checkReferences()
        checkQuotes()
        checkUnbacked()
        ClosureCheck.run(corpus: corpus, report: report)
        checkNarratives()
        checkStaleness()
    }

    // MARK: - ERF-41

    private func computeDispositions() {
        for (id, c) in corpus.claims {
            dispositions[id] = DispositionCalc.compute(c.standings)
        }
    }

    // MARK: - ERF-35

    private func checkReferences() {
        func exists(_ id: String) -> Bool {
            corpus.atoms[id] != nil || corpus.claims[id] != nil || corpus.surveys[id] != nil
        }
        for (id, c) in corpus.claims.sorted(by: { $0.key < $1.key }) {
            for (field, list) in [("atoms_for", c.atomsFor), ("atoms_against", c.atomsAgainst), ("surveys", c.surveys)] {
                for r in list where !exists(r) {
                    report.add(.violation, "ERF-35", c.file, nil,
                               "claim `\(id)`: `\(field)` names `\(r)`, which resolves to no record in the deployment")
                }
            }
            for e in c.edges where !exists(e.to) {
                report.add(.violation, "ERF-35", c.file, e.line,
                           "claim `\(id)`: `edges.to` names `\(e.to)`, which resolves to no record in the deployment")
            }
            // A reference recording a PAST state is a flag, not a violation.
            for s in c.standings {
                guard let eas = s.evidenceAtStance else { continue }
                for r in eas.forIds + eas.againstIds where !exists(r) {
                    report.add(.flag, "ERF-35", c.file, s.line,
                               "claim `\(id)`: `evidence_at_stance` names `\(r)`, which no longer resolves; a past-state reference is flagged, never a violation")
                }
            }
            // Type expectations the model states.
            for r in c.atomsFor + c.atomsAgainst where corpus.claims[r] != nil || corpus.surveys[r] != nil {
                report.add(.violation, "ERF-23", c.file, nil,
                           "claim `\(id)`: evidence list names `\(r)`, which is not an atom")
            }
            for r in c.surveys where corpus.surveys[r] == nil && (corpus.atoms[r] != nil || corpus.claims[r] != nil) {
                report.add(.violation, "ERF-25", c.file, nil,
                           "claim `\(id)`: `surveys` names `\(r)`, which is not a survey")
            }
            for e in c.edges where corpus.claims[e.to] == nil && exists(e.to) {
                report.add(.violation, "ERF-43", c.file, e.line,
                           "claim `\(id)`: `edges` names `\(e.to)`, which is not a claim; edges are claim-to-claim only")
            }
        }
        for (id, s) in corpus.surveys.sorted(by: { $0.key < $1.key }) {
            if let p = s.priorSurvey, !exists(p) {
                report.add(.violation, "ERF-35", s.file, nil,
                           "survey `\(id)`: `prior_survey` names `\(p)`, which resolves to no record")
            }
            for a in s.notableAtoms where !exists(a) {
                report.add(.violation, "ERF-35", s.file, nil,
                           "survey `\(id)`: a `notable_results` entry names atom `\(a)`, which resolves to no record")
            }
        }
        // ERF-4: every atom names a source that exists in the source list.
        for (id, a) in corpus.atoms.sorted(by: { $0.key < $1.key }) {
            guard let src = a.source else { continue }
            if corpus.sources[src] == nil {
                report.add(.violation, "ERF-4", a.file, nil,
                           "atom `\(id)` names source `\(src)`, which is not in the corpus's source list")
            }
        }
    }

    // MARK: - ERF-1, ERF-50, ERF-51, ERF-52

    private func checkQuotes() {
        var textCache: [String: String?] = [:]

        func normalizedText(for src: SourceEntry) -> String?? {
            if let c = textCache[src.id] { return c }
            guard let relPath = src.normalized else { textCache[src.id] = String?.none; return String?.none }
            // Resolution base: the directory of the source-list document that
            // declared the source, falling back to the corpus root.
            // See ambiguities.md, "path resolution".
            var candidates: [URL] = []
            for (_, dir) in loader.sourceListDir { candidates.append(dir.appendingPathComponent(relPath)) }
            candidates.append(root.appendingPathComponent(relPath))
            for c in candidates {
                if let d = try? Data(contentsOf: c) {
                    if let s = String(data: d, encoding: .utf8) {
                        textCache[src.id] = s
                        return s
                    }
                    // Not text or markdown: the check is unavailable.
                    textCache[src.id] = String?.none
                    return String?.none
                }
            }
            textCache[src.id] = String?.none
            return String?.none
        }

        for (id, a) in corpus.atoms.sorted(by: { $0.key < $1.key }) {
            guard let quote = a.quote else { continue }
            // ERF-6: bare `...` is reserved for dots the source itself contains,
            // which is a producer discipline; ERF-52 makes it a literal match.
            guard let srcId = a.source, let src = corpus.sources[srcId] else { continue }
            guard let text = normalizedText(for: src) ?? nil else {
                report.add(.info, "ERF-51", a.file, nil,
                           "atom `\(id)`: quote check UNAVAILABLE (the source's normalized text is not held, or is not text or markdown)")
                continue
            }
            let r = QuoteCheck.check(quote: quote, normalizedText: text)
            switch r.outcome {
            case .pass:
                quoteTraces.append("PASS  \(id)\n" + r.spanTrace.map { "      " + $0 }.joined(separator: "\n"))
            case .fail(let why):
                report.add(.violation, "ERF-52", a.file, nil, "atom `\(id)`: quote check FAILED: \(why)")
                quoteTraces.append("FAIL  \(id): \(why)\n" + r.spanTrace.map { "      " + $0 }.joined(separator: "\n"))
            case .unavailable(let why):
                report.add(.info, "ERF-51", a.file, nil, "atom `\(id)`: quote check unavailable: \(why)")
            }
        }
    }

    // MARK: - ERF-49

    private func checkUnbacked() {
        let graph = PremiseGraph(claims: corpus.claims)
        for (id, c) in corpus.claims.sorted(by: { $0.key < $1.key }) {
            // "an `observation` someone stands on" -- someone has taken a stance.
            let stoodOn = !c.standings.isEmpty
            guard stoodOn else { continue }
            if c.epistemicKind == "observation", c.atomsFor.isEmpty, c.surveys.isEmpty {
                report.add(.flag, "ERF-49", c.file, nil,
                           "observation `\(id)` is stood on with empty `atoms_for` and empty `surveys`: unbacked")
            }
            if c.epistemicKind == "argument", (graph.premisesOf[id] ?? []).isEmpty {
                report.add(.flag, "ERF-49", c.file, nil,
                           "argument `\(id)` is stood on with no premises (no outgoing `assumes` edge and no incoming `supports` edge): unbacked")
            }
        }
    }

    // MARK: - ERF-31, ERF-32, ERF-33

    private func checkNarratives() {
        for n in corpus.narratives {
            for (i, b) in n.bindings.enumerated() {
                if !b.wellFormed {
                    // "A binding that does not match this grammar MUST be
                    // reported, never skipped."
                    report.add(.violation, "ERF-31", n.file, nil,
                               "narrative binding #\(i + 1) does not match the grammar (\(b.grammarError ?? "?")): \(shorten(b.raw))")
                    continue
                }
                // ERF-33: every named id must resolve to a record.
                for cid in b.claimIds {
                    if corpus.claims[cid] == nil {
                        if corpus.atoms[cid] != nil || corpus.surveys[cid] != nil {
                            report.add(.violation, "ERF-33", n.file, nil,
                                       "narrative binding #\(i + 1) names `\(cid)`, which is not a claim")
                        } else {
                            report.add(.violation, "ERF-33", n.file, nil,
                                       "narrative binding #\(i + 1) names `\(cid)`, which resolves to no record")
                        }
                    }
                }
                // "The anchor occurs in its passage under ERF-51", plain
                // containment: ERF-31 invokes the fold, not ERF-52's
                // whole-words rule or its elision marker.
                if let anchor = b.anchor {
                    let a = ERF51.normalize(anchor)
                    let p = ERF51.normalize(b.passage)
                    if a.isEmpty {
                        // The empty string occurs in every text, including an
                        // empty passage, so an empty anchor can never fail.
                        // ERF-52 closed exactly this hole for quotes ("A quote
                        // whose spans are all empty MUST fail rather than
                        // trivially pass"); ERF-31 does not. ambiguities.md ERF-31 #5.
                        report.add(.flag, "ERF-31", n.file, nil,
                                   "narrative binding #\(i + 1) carries an empty anchor, which occurs in every passage and makes the check vacuous")
                    } else if !p.contains(a) {
                        report.add(.flag, "ERF-31", n.file, nil,
                                   "narrative binding #\(i + 1): anchor \(QuoteCheck.debugQuote(anchor)) does not occur in its passage (\(p.count) characters, \(shorten(p)))")
                    }
                }
                if let d = b.boundAt, !b.boundAtIsCalendarDate {
                    report.add(.violation, "ERF-32", n.file, nil,
                               "narrative binding #\(i + 1): `bound-at=\(d)` matches the date shape but is not a calendar date, so the staleness comparison cannot be run")
                }
            }
        }
    }

    private func checkStaleness() {
        // ERF-32: a binding is stale when the claim it names carries a
        // `last_modified` later than the binding's `bound-at`.
        for n in corpus.narratives {
            for (i, b) in n.bindings.enumerated() where b.wellFormed {
                guard let boundAtRaw = b.boundAt, let boundAt = Stamp.parse(boundAtRaw) else { continue }
                for cid in b.claimIds {
                    guard let c = corpus.claims[cid] else {
                        report.add(.flag, "ERF-32", n.file, nil,
                                   "narrative binding #\(i + 1) -> `\(cid)`: staleness indeterminate (the claim does not resolve)")
                        continue
                    }
                    guard let lm = c.lastModified?.timestamp else { continue }  // never edited
                    switch stalenessOf(judgedAt: boundAt, changedAt: lm) {
                    case .stale:
                        report.add(.flag, "ERF-32", n.file, nil,
                                   "narrative binding #\(i + 1) -> `\(cid)` is STALE: claim `last_modified` \(lm.raw) is later than `bound-at=\(boundAtRaw)`")
                    case .indeterminate:
                        report.add(.flag, "ERF-32", n.file, nil,
                                   "narrative binding #\(i + 1) -> `\(cid)`: staleness INDETERMINATE; MUST NOT be shown as current")
                    case .current: break
                    }
                }
            }
        }
        // ERF-47: audits older than the last change to what they judged.
        for (id, a) in corpus.atoms.sorted(by: { $0.key < $1.key }) {
            guard let lm = a.lastModified?.timestamp else { continue }
            for au in a.findingAudit {
                if stalenessOf(judgedAt: au.timestamp, changedAt: lm) == .stale {
                    report.add(.flag, "ERF-47", a.file, au.line,
                               "atom `\(id)`: `finding_audit` by \(au.auditor ?? "?") at \(au.rawTimestamp ?? "?") is stale against `last_modified` \(lm.raw)")
                }
            }
        }
        for (id, c) in corpus.claims.sorted(by: { $0.key < $1.key }) {
            guard let lm = c.lastModified?.timestamp else { continue }
            for au in c.evidenceAudit {
                if stalenessOf(judgedAt: au.timestamp, changedAt: lm) == .stale {
                    report.add(.flag, "ERF-47", c.file, au.line,
                               "claim `\(id)`: `evidence_audit` by \(au.auditor ?? "?") at \(au.rawTimestamp ?? "?") is stale against `last_modified` \(lm.raw)")
                }
            }
        }
        // ERF-48: last_modified later than created and than any prior stamp.
        for (id, a) in corpus.atoms.sorted(by: { $0.key < $1.key }) {
            checkLastModified(id: id, file: a.file, created: a.created, lastModified: a.lastModified)
        }
        for (id, c) in corpus.claims.sorted(by: { $0.key < $1.key }) {
            checkLastModified(id: id, file: c.file, created: c.created, lastModified: c.lastModified)
        }
        for (id, s) in corpus.surveys.sorted(by: { $0.key < $1.key }) {
            checkLastModified(id: id, file: s.file, created: s.conducted, lastModified: s.lastModified)
        }
    }

    private func checkLastModified(id: String, file: String, created: ActorStamp?, lastModified: ActorStamp?) {
        guard let lm = lastModified?.timestamp, let cr = created?.timestamp else { return }
        guard let lk = lm.dayKey ?? Optional(lm.raw), let ck = cr.dayKey ?? Optional(cr.raw) else { return }
        if lk < ck {
            report.add(.violation, "ERF-48", file, nil,
                       "record `\(id)`: `last_modified` \(lm.raw) is earlier than `created` \(cr.raw)")
        } else if lk == ck, lm.precision == .instant, cr.precision == .instant,
                  let li = lm.instant, let ci = cr.instant, li < ci {
            report.add(.violation, "ERF-48", file, nil,
                       "record `\(id)`: `last_modified` \(lm.raw) is earlier than `created` \(cr.raw)")
        }
    }

    private func shorten(_ s: String) -> String {
        let t = s.replacingOccurrences(of: "\n", with: "\\n")
        return t.count <= 90 ? t : String(t.prefix(87)) + "..."
    }
}
