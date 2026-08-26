import Foundation

// ---------------------------------------------------------------------------
// The ERF-53 loss probe.
//
// Section 7: "Conformance is a property of a corpus as loaded into the model,
// and is the same in every binding. Every binding MUST round-trip a corpus
// through the model without changing any record, any field, or any verdict".
// ERF-53: "Loss is any difference, after loading, in a value the model types
// or in a narrative's text: two forms are equivalent when they load to the
// same model instance".
//
// That definition is only testable if "the model instance" has a canonical
// form to compare. This emits one: every value the model of section 3 types,
// in a deterministic ordering, plus each narrative's text. Two bindings that
// load the same corpus emit byte-identical dumps if and only if neither lost.
//
// What it deliberately does NOT emit, because ERF-53 does not call it loss:
// unknown and `x_` extension fields (typed by nothing), the contents of a
// `citation` block (`CSL` is an alias section 3 omits), a narrative's
// frontmatter, key order, and comments. See ambiguities.md, ERF-53 #1-#3.
// ---------------------------------------------------------------------------

enum ModelDump {

    static func emit(_ corpus: Corpus, dispositions: [String: DispositionResult]) -> String {
        var out: [String] = []
        out.append("# ERF model instance dump (canonical; for ERF-53 round-trip comparison)")

        if let d = corpus.declaration {
            out.append("declaration")
            out.append("  id = \(q(d.id))")
            out.append("  title = \(q(d.title))")
            out.append("  spec_version = \(q(d.specVersion))")
            out.append("  classification = \(q(d.classification))")
            out.append("  owner = \(q(d.owner))")
        }

        out.append("sources (\(corpus.sources.count))")
        for k in corpus.sources.keys.sorted() {
            let s = corpus.sources[k]!
            out.append("  source \(k)")
            out.append("    citation_text = \(q(s.citationText))")
            out.append("    status = \(q(s.status))")
            out.append("    normalized = \(q(s.normalized))")
            out.append("    normalized_digest = \(q(s.normalizedDigest))")
            out.append("    reason = \(q(s.reason))")
            out.append("    licence = \(q(s.licence))")
            out.append("    excerpt.by = \(q(s.excerptBy))")
            out.append("    extraction = \(q(s.extraction))")
            out.append("    normalization = \(q(s.normalization))")
            out.append("    received.timestamp = \(q(s.receivedTimestamp))")
        }

        out.append("atoms (\(corpus.atoms.count))")
        for k in corpus.atoms.keys.sorted() {
            let a = corpus.atoms[k]!
            out.append("  atom \(k)")
            out.append("    corpus = \(q(a.corpus))")
            out.append("    finding = \(q(a.finding))")
            out.append("    quote = \(q(a.quote))")
            out.append("    source = \(q(a.source))")
            out.append("    source_quality = \(q(a.sourceQuality))")
            out.append("    as_of_date = \(q(a.asOfDate))")
            out.append("    limitations = \(q(a.limitations))")
            out.append("    created = \(stamp(a.created))")
            out.append("    last_modified = \(stamp(a.lastModified))")
            for (i, au) in a.findingAudit.enumerated() {
                out.append("    finding_audit[\(i)] = \(q(au.auditor)) \(q(au.verdict)) \(q(au.rawTimestamp)) \(q(au.proto))")
            }
        }

        out.append("claims (\(corpus.claims.count))")
        for k in corpus.claims.keys.sorted() {
            let c = corpus.claims[k]!
            out.append("  claim \(k)")
            out.append("    corpus = \(q(c.corpus))")
            out.append("    title = \(q(c.title))")
            out.append("    epistemic_kind = \(q(c.epistemicKind))")
            out.append("    created = \(stamp(c.created))")
            out.append("    last_modified = \(stamp(c.lastModified))")
            out.append("    families = [\(c.families.map(q).joined(separator: ", "))]")
            out.append("    atoms_for = [\(c.atomsFor.map(q).joined(separator: ", "))]")
            out.append("    atoms_against = [\(c.atomsAgainst.map(q).joined(separator: ", "))]")
            out.append("    surveys = [\(c.surveys.map(q).joined(separator: ", "))]")
            for (i, e) in c.edges.enumerated() {
                out.append("    edges[\(i)] = \(q(e.to)) \(q(e.relation))")
            }
            for (i, s) in c.standings.enumerated() {
                var line = "    standings[\(i)] = \(q(s.rawTimestamp)) \(q(s.stance)) \(q(s.by)) \(q(s.why))"
                if let eas = s.evidenceAtStance {
                    line += " evidence_at_stance{for=[\(eas.forIds.map(q).joined(separator: ", "))] against=[\(eas.againstIds.map(q).joined(separator: ", "))]}"
                } else {
                    line += " evidence_at_stance=<absent>"
                }
                out.append(line)
            }
            for (i, au) in c.evidenceAudit.enumerated() {
                out.append("    evidence_audit[\(i)] = \(q(au.auditor)) \(q(au.verdict)) \(q(au.rawTimestamp)) \(q(au.proto))")
            }
            out.append("    body = \(q(c.body))")
            out.append("    -- computed disposition = \(dispositions[k]?.disposition.rawValue ?? "?")")
        }

        out.append("surveys (\(corpus.surveys.count))")
        for k in corpus.surveys.keys.sorted() {
            let s = corpus.surveys[k]!
            out.append("  survey \(k)")
            out.append("    corpus = \(q(s.corpus))")
            out.append("    title = \(q(s.title))")
            out.append("    conducted = \(stamp(s.conducted))")
            out.append("    last_modified = \(stamp(s.lastModified))")
            out.append("    prior_survey = \(q(s.priorSurvey))")
            for (i, a) in s.searches.enumerated() {
                out.append("    searches[\(i)] = \(q(a.tool)) \(q(a.query)) \(q(a.scope)) \(q(a.hitsReported)) \(q(a.timestamp?.raw))")
            }
        }

        out.append("narratives (\(corpus.narratives.count))")
        for n in corpus.narratives.sorted(by: { $0.file < $1.file }) {
            out.append("  narrative \(n.file)")
            out.append("    text = \(q(n.body))")
            for (i, b) in n.bindings.enumerated() {
                out.append("    binding[\(i)] wellFormed=\(b.wellFormed) ids=[\(b.claimIds.joined(separator: " "))] anchor=\(q(b.anchor)) bound-at=\(q(b.boundAt))")
            }
        }
        return out.joined(separator: "\n") + "\n"
    }

    private static func stamp(_ a: ActorStamp?) -> String {
        guard let a = a else { return "<absent>" }
        return "{\(q(a.rawTimestamp)), \(q(a.by))}"
    }

    private static func q(_ s: String?) -> String {
        guard let s = s else { return "<absent>" }
        var e = ""
        for c in s {
            switch c {
            case "\\": e += "\\\\"
            case "\"": e += "\\\""
            case "\n": e += "\\n"
            case "\t": e += "\\t"
            default: e.append(c)
            }
        }
        return "\"" + e + "\""
    }
}
