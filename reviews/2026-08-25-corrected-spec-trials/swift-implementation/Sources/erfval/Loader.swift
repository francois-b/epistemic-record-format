import Foundation

// ---------------------------------------------------------------------------
// Loading a corpus. Discovery is by content and never by path (ERF-54): walk
// what we were given, read each file's `type`, dispatch on it. A file carrying
// no `type` is not part of the corpus; we ignore it and report that we did.
// ---------------------------------------------------------------------------

final class Loader {
    let root: URL
    let report: Report
    let corpus = Corpus()
    /// Map from source-list file directory to the source ids declared in it,
    /// so a `normalized:` path can be resolved relative to its own document.
    var sourceListDir: [String: URL] = [:]

    init(root: URL, report: Report) {
        self.root = root
        self.report = report
    }

    func load() {
        let files = walk(root)
        for url in files {
            loadFile(url)
        }
        if corpus.declarationFiles.isEmpty {
            report.add(.violation, "ERF-59", relative(root), nil,
                       "the corpus carries no declaration: no file declares `type: corpus`")
        }
        if corpus.declarationFiles.count > 1 {
            report.add(.violation, "ERF-54", relative(root), nil,
                       "exactly one file in a corpus MUST carry `type: corpus`; found \(corpus.declarationFiles.count): \(corpus.declarationFiles.joined(separator: ", "))")
        }
        if !corpus.ignoredFiles.isEmpty {
            report.add(.info, "ERF-54/ERF-57", relative(root), nil,
                       "ignored \(corpus.ignoredFiles.count) file(s) carrying no `type`: \(corpus.ignoredFiles.sorted().joined(separator: ", "))")
        }
    }

    private func walk(_ dir: URL) -> [URL] {
        var out: [URL] = []
        let fm = FileManager.default
        guard let e = fm.enumerator(at: dir, includingPropertiesForKeys: [.isRegularFileKey],
                                    options: [.skipsHiddenFiles]) else { return out }
        for case let url as URL in e {
            var isDir: ObjCBool = false
            if fm.fileExists(atPath: url.path, isDirectory: &isDir), !isDir.boolValue {
                out.append(url)
            }
        }
        return out.sorted { $0.path < $1.path }
    }

    func relative(_ url: URL) -> String {
        let r = root.standardizedFileURL.path
        let p = url.standardizedFileURL.path
        if p.hasPrefix(r) {
            let s = String(p.dropFirst(r.count).drop(while: { $0 == "/" }))
            return s.isEmpty ? "<corpus root>" : s
        }
        return p
    }

    // MARK: - one file

    private func loadFile(_ url: URL) {
        let rel = relative(url)
        guard let data = try? Data(contentsOf: url) else {
            corpus.ignoredFiles.append(rel); return
        }
        // BINDING ERF-67: UTF-8, LF, no BOM.
        if data.starts(with: [0xEF, 0xBB, 0xBF]) {
            report.add(.violation, "ERF-67", rel, 1, "file begins with a UTF-8 byte-order mark")
        }
        guard let text = String(data: data, encoding: .utf8) else {
            corpus.ignoredFiles.append(rel)
            report.add(.info, "ERF-67", rel, nil, "file is not valid UTF-8; ignored")
            return
        }
        if text.contains("\r\n") {
            report.add(.violation, "ERF-67", rel, nil, "file uses CRLF line endings; LF is required")
        }

        let (frontText, body, fenced, offset) = splitFrontmatter(text)
        guard let frontText = frontText else {
            corpus.ignoredFiles.append(rel); return
        }
        let parser = YamlParser(text: frontText)
        let doc = parser.parseDocument()
        guard let map = doc.root?.mapping else {
            corpus.ignoredFiles.append(rel); return
        }
        // A file carrying no `type` is not part of the corpus (ERF-54), so
        // parse diagnostics about it are not the corpus's business.
        guard let typeNode = map["type"], let type = typeNode.scalarText, !type.isEmpty else {
            corpus.ignoredFiles.append(rel); return
        }
        for d in doc.diagnostics {
            report.add(d.requirement == nil ? .info : .violation,
                       d.requirement ?? "parse", rel, d.line + offset, d.message)
        }
        reportDuplicateKeys(map, rel, offset)
        _ = fenced

        switch type {
        case "corpus":   loadDeclaration(map, rel, offset)
        case "sources":  loadSourceList(map, rel, offset, dir: url.deletingLastPathComponent())
        case "atom":     loadAtom(map, rel, offset, body: body)
        case "claim":    loadClaim(map, rel, offset, body: body)
        case "survey":   loadSurvey(map, rel, offset, body: body)
        case "narrative": loadNarrative(map, rel, offset, body: body)
        default:
            // ERF-57: a consumer preserves and reports unknown record types.
            report.add(.info, "ERF-57", rel, typeNode.line + offset,
                       "unrecognized `type: \(type)`; preserved as opaque data and not validated")
        }
    }

    /// Returns (frontmatter text, body, wasFenced, line offset of frontmatter).
    private func splitFrontmatter(_ text: String) -> (String?, String, Bool, Int) {
        var lines = text.components(separatedBy: "\n")
        if lines.first?.trimmingCharacters(in: .whitespaces) == "---" {
            var end: Int? = nil
            for i in 1..<lines.count {
                let t = lines[i].trimmingCharacters(in: .whitespaces)
                if t == "---" || t == "..." { end = i; break }
            }
            if let e = end {
                let front = lines[1..<e].joined(separator: "\n")
                let body = e + 1 < lines.count ? lines[(e + 1)...].joined(separator: "\n") : ""
                return (front, body, true, 1)
            }
            // An opening fence with no closing fence: read the whole file as a
            // YAML document (this is the declaration / source-list shape when
            // the author wrote a leading document-start marker).
            lines.removeFirst()
            return (lines.joined(separator: "\n"), "", false, 1)
        }
        // No fence: a bare YAML document (declaration, source list) or a plain
        // markdown file. We try to parse it; a file with no `type` is ignored.
        return (text, "", false, 0)
    }

    private func reportDuplicateKeys(_ m: YMapping, _ rel: String, _ offset: Int) {
        for (k, line) in m.duplicateKeys {
            report.add(.violation, "ERF-66", rel, line + offset,
                       "duplicate frontmatter key `\(k)`")
        }
        for k in m.keys {
            if let sub = m[k]?.mapping { reportDuplicateKeys(sub, rel, offset) }
            if let seq = m[k]?.sequence {
                for item in seq { if let sm = item.mapping { reportDuplicateKeys(sm, rel, offset) } }
            }
        }
    }

    // MARK: - ERF-65 type arrival

    /// "A validator MUST report a string-typed field that arrived as any other
    /// type." (BINDING ERF-65)
    @discardableResult
    private func str(_ m: YMapping, _ key: String, _ rel: String, _ offset: Int,
                     path: String? = nil) -> String? {
        guard let n = m[key] else { return nil }
        let p = path ?? key
        if n.isString { return n.scalarText }
        report.add(.violation, "ERF-65", rel, n.line + offset,
                   "string-typed field `\(p)` arrived as \(n.typeName) (`\(n.scalarText ?? "…")`); a producer MUST quote it")
        return n.scalarText
    }

    private func strList(_ m: YMapping, _ key: String, _ rel: String, _ offset: Int) -> [String] {
        guard let n = m[key] else { return [] }   // ERF-56: omitted list -> empty list
        guard let seq = n.sequence else {
            report.add(.violation, "ERF-65", rel, n.line + offset,
                       "list-typed field `\(key)` arrived as \(n.typeName)")
            return []
        }
        if seq.isEmpty {
            report.add(.violation, "ERF-55", rel, n.line + offset,
                       "empty list `\(key)` is present; empty lists MUST be omitted")
        }
        var out: [String] = []
        for (i, item) in seq.enumerated() {
            if item.isString, let t = item.scalarText { out.append(t) }
            else {
                report.add(.violation, "ERF-65", rel, item.line + offset,
                           "string-typed element `\(key)[\(i)]` arrived as \(item.typeName) (`\(item.scalarText ?? "…")`)")
                if let t = item.scalarText { out.append(t) }
            }
        }
        return out
    }

    private func actorStamp(_ m: YMapping, _ key: String, _ rel: String, _ offset: Int) -> ActorStamp? {
        guard let n = m[key] else { return nil }
        guard let sub = n.mapping else {
            report.add(.violation, "ERF-65", rel, n.line + offset,
                       "`\(key)` must be a {timestamp, by} mapping; arrived as \(n.typeName)")
            return nil
        }
        let ts = str(sub, "timestamp", rel, offset, path: "\(key).timestamp")
        let by = str(sub, "by", rel, offset, path: "\(key).by")
        if sub["timestamp"] == nil {
            report.add(.violation, "ERF-58", rel, n.line + offset, "`\(key)` carries no `timestamp`")
        }
        checkActor(by, rel, n.line + offset, "\(key).by")
        return ActorStamp(timestamp: ts.flatMap { Stamp.parse($0) }, rawTimestamp: ts, by: by)
    }

    /// Section 2, *actor*: "`human:<id>` for a person, `<producer>/<version>`
    /// for a model or agent, `process:<id>` for automation. Every actor id
    /// MUST follow this convention."
    private func checkActor(_ a: String?, _ rel: String, _ line: Int, _ path: String) {
        guard let a = a, !a.isEmpty else { return }
        let ok = a.hasPrefix("human:") && a.count > 6
            || a.hasPrefix("process:") && a.count > 8
            || (a.contains("/") && !a.hasPrefix("/") && !a.hasSuffix("/"))
        if !ok {
            report.add(.violation, "section 2 (actor)", rel, line,
                       "`\(path)` = `\(a)` is not `human:<id>`, `<producer>/<version>` or `process:<id>`")
        }
    }

    private func unknownKeys(_ m: YMapping, _ spec: [FieldSpec], _ rel: String, _ offset: Int, _ what: String) {
        let known = Set(spec.map { $0.key })
        for k in m.keys where !known.contains(k) {
            if k.hasPrefix("x_") {
                report.add(.info, "ERF-72", rel, m[k]?.line ?? 0 + offset,
                           "extension field `\(k)` on \(what); not reported as unknown")
                continue
            }
            report.add(.violation, "ERF-55", rel, (m[k]?.line ?? 0) + offset,
                       "unknown field `\(k)` on \(what); a producer MUST NOT originate a field the declared spec_version does not define")
        }
    }

    // MARK: - record loaders

    private func loadDeclaration(_ m: YMapping, _ rel: String, _ offset: Int) {
        corpus.declarationFiles.append(rel)
        unknownKeys(m, Schema.declaration, rel, offset, "the corpus declaration")
        let id = str(m, "id", rel, offset)
        let title = str(m, "title", rel, offset)
        let sv = str(m, "spec_version", rel, offset)
        let owner = str(m, "owner", rel, offset)
        let cls = str(m, "classification", rel, offset)
        for req in ["id", "title", "spec_version"] where m[req] == nil {
            report.add(.violation, "ERF-59", rel, 1, "declaration is missing `\(req)`")
        }
        if let sv = sv, !Stamp.matches(sv, "^[0-9]+\\.[0-9]+\\.[0-9]+([-+].*)?$") {
            report.add(.violation, "ERF-61", rel, m["spec_version"]?.line ?? 1,
                       "`spec_version` = `\(sv)` is not Semantic Versioning 2.0.0")
        }
        checkActor(owner, rel, m["owner"]?.line ?? 1, "owner")
        if corpus.declaration == nil {
            corpus.declaration = Declaration(file: rel, id: id, title: title, specVersion: sv,
                                             owner: owner, classification: cls)
        }
    }

    private func loadSourceList(_ m: YMapping, _ rel: String, _ offset: Int, dir: URL) {
        corpus.sourceListFiles.append(rel)
        sourceListDir[rel] = dir
        // ERF-3: "a document whose top level is a mapping of exactly two keys".
        let extra = m.keys.filter { $0 != "type" && $0 != "sources" }
        if !extra.isEmpty {
            report.add(.violation, "ERF-3", rel, 1,
                       "the source list's top level must be exactly `type` and `sources`; also found: \(extra.joined(separator: ", "))")
        }
        guard let sourcesNode = m["sources"] else {
            report.add(.violation, "ERF-3", rel, 1, "source list carries no `sources` mapping")
            return
        }
        guard let sm = sourcesNode.mapping else {
            report.add(.violation, "ERF-3", rel, sourcesNode.line + offset,
                       "`sources` must be a mapping keyed by source id; arrived as \(sourcesNode.typeName)")
            return
        }
        for key in sm.keys {
            guard let node = sm[key], let entry = node.mapping else {
                report.add(.violation, "ERF-3", rel, sm[key]?.line ?? 0 + offset,
                           "source `\(key)` is not a mapping")
                continue
            }
            unknownKeys(entry, Schema.source, rel, offset, "source `\(key)`")
            let citation = str(entry, "citation_text", rel, offset, path: "sources.\(key).citation_text")
            let status = str(entry, "status", rel, offset, path: "sources.\(key).status")
            let normalized = str(entry, "normalized", rel, offset, path: "sources.\(key).normalized")
            let digest = str(entry, "normalized_digest", rel, offset, path: "sources.\(key).normalized_digest")
            let reason = str(entry, "reason", rel, offset, path: "sources.\(key).reason")
            let licence = str(entry, "licence", rel, offset, path: "sources.\(key).licence")
            let extraction = str(entry, "extraction", rel, offset, path: "sources.\(key).extraction")
            let normalization = str(entry, "normalization", rel, offset, path: "sources.\(key).normalization")
            var excerptBy: String? = nil
            if entry["excerpt"] != nil { excerptBy = actorStamp(entry, "excerpt", rel, offset)?.by }
            var receivedTs: String? = nil
            if let rNode = entry["received"] {
                if let rm = rNode.mapping {
                    for k in rm.keys where !Schema.receivedFields.contains(k) {
                        report.add(.violation, "ERF-55", rel, (rm[k]?.line ?? 0) + offset,
                                   "unknown field `received.\(k)` on source `\(key)`")
                    }
                    for k in Schema.receivedFields where rm[k] != nil {
                        _ = str(rm, k, rel, offset, path: "sources.\(key).received.\(k)")
                    }
                    receivedTs = rm["timestamp"]?.scalarText
                } else {
                    report.add(.violation, "ERF-65", rel, rNode.line + offset,
                               "`sources.\(key).received` must be a mapping; arrived as \(rNode.typeName)")
                }
            }
            // ERF-7: citation_text MUST NOT contain a URL.
            if let c = citation, Stamp.matches(c, "https?://") {
                report.add(.violation, "ERF-7", rel, entry["citation_text"]?.line ?? 0 + offset,
                           "source `\(key)`: `citation_text` contains a URL")
            }
            if citation == nil {
                report.add(.violation, "ERF-3", rel, node.line + offset,
                           "source `\(key)` carries no `citation_text`")
            }
            // ERF-4 / ERF-5.
            let absenceStatuses: Set<String> = ["not-redistributable", "access-restricted", "licence-unverified"]
            let shipStatuses: Set<String> = ["shipped", "shipped-as-quotation"]
            if normalized == nil {
                if let st = status, absenceStatuses.contains(st) {
                    if reason == nil || reason!.isEmpty {
                        report.add(.violation, "ERF-5", rel, node.line + offset,
                                   "source `\(key)` records an absence with status `\(st)` but no `reason`")
                    }
                } else {
                    report.add(.violation, "ERF-4", rel, node.line + offset,
                               "source `\(key)` gives no `normalized` path and does not record an absence with a closed-set `status` and a `reason`")
                }
            } else if let st = status, !shipStatuses.contains(st), !absenceStatuses.contains(st) {
                report.add(.violation, "ERF-5", rel, node.line + offset,
                           "source `\(key)`: status `\(st)` is outside the closed set")
            }
            if status == nil {
                report.add(.violation, "ERF-5", rel, node.line + offset, "source `\(key)` carries no `status`")
            }
            _ = digest; _ = licence
            if corpus.sources[key] != nil {
                report.add(.violation, "ERF-3", rel, node.line + offset,
                           "duplicate source id `\(key)` in the corpus's source list")
            }
            corpus.sources[key] = SourceEntry(id: key, citationText: citation, status: status,
                                              normalized: normalized, normalizedDigest: digest,
                                              reason: reason, licence: licence, excerptBy: excerptBy,
                                              extraction: extraction, normalization: normalization,
                                              receivedTimestamp: receivedTs, line: node.line + offset)
        }
    }

    private func claimId(_ m: YMapping, _ rel: String, _ offset: Int) -> String? {
        guard let n = m["id"] else {
            report.add(.violation, "ERF-36", rel, 1, "record carries no `id`")
            return nil
        }
        guard let id = n.scalarText, !id.isEmpty else { return nil }
        if !n.isString {
            report.add(.violation, "ERF-65", rel, n.line + offset,
                       "string-typed field `id` arrived as \(n.typeName) (`\(id)`); a producer MUST quote it")
        }
        if let owner = corpus.idOwner[id] {
            report.add(.violation, "ERF-38", rel, n.line + offset,
                       "duplicate record id `\(id)`; already used by \(owner)")
        } else {
            corpus.idOwner[id] = rel
        }
        return id
    }

    private func loadAtom(_ m: YMapping, _ rel: String, _ offset: Int, body: String) {
        unknownKeys(m, Schema.atom, rel, offset, "atom")
        guard let id = claimId(m, rel, offset) else { return }
        if !Stamp.matches(id, "-[0-9]+$") {
            report.add(.violation, "ERF-13", rel, m["id"]?.line ?? 1,
                       "atom id `\(id)` is not a mint-time prefix plus a sequence number")
        }
        if !body.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            report.add(.violation, "ERF-53", rel, nil,
                       "an atom's body is empty, so its file is frontmatter and nothing else; found \(body.trimmingCharacters(in: .whitespacesAndNewlines).count) characters of body")
        }
        let quality = str(m, "source_quality", rel, offset)
        if let q = quality, !["high", "medium", "low"].contains(q) {
            report.add(.violation, "ERF-9", rel, m["source_quality"]?.line ?? 1,
                       "`source_quality` = `\(q)` is outside the closed set {high, medium, low}")
        }
        let audits = auditList(m, "finding_audit", rel, offset)
        let asOf = str(m, "as_of_date", rel, offset)
        if let a = asOf, Stamp.parse(a) == nil {
            report.add(.violation, "ERF-14", rel, m["as_of_date"]?.line ?? 1,
                       "`as_of_date` = `\(a)` is not a year, a year and month, or a full date")
        }
        let atom = Atom(id: id, file: rel, corpus: str(m, "corpus", rel, offset),
                        finding: str(m, "finding", rel, offset),
                        quote: str(m, "quote", rel, offset),
                        source: str(m, "source", rel, offset),
                        sourceQuality: quality, asOfDate: asOf,
                        limitations: str(m, "limitations", rel, offset),
                        created: actorStamp(m, "created", rel, offset),
                        lastModified: actorStamp(m, "last_modified", rel, offset),
                        findingAudit: audits, line: 1)
        for req in ["finding", "quote", "source", "source_quality", "created"] where m[req] == nil {
            report.add(.violation, "ERF-\(req == "source" ? "4" : "6")", rel, 1, "atom `\(id)` is missing `\(req)`")
        }
        if m["corpus"] == nil {
            report.add(.violation, "ERF-54", rel, 1, "atom `\(id)` carries no `corpus`")
        }
        corpus.atoms[id] = atom
    }

    private func auditList(_ m: YMapping, _ key: String, _ rel: String, _ offset: Int) -> [AuditEntry] {
        guard let n = m[key] else { return [] }
        guard let seq = n.sequence else {
            report.add(.violation, "ERF-65", rel, n.line + offset, "`\(key)` must be a list; arrived as \(n.typeName)")
            return []
        }
        if seq.isEmpty {
            report.add(.violation, "ERF-55", rel, n.line + offset, "empty list `\(key)` is present; empty lists MUST be omitted")
        }
        var out: [AuditEntry] = []
        for (i, item) in seq.enumerated() {
            guard let em = item.mapping else {
                report.add(.violation, "ERF-65", rel, item.line + offset, "`\(key)[\(i)]` is not a mapping")
                continue
            }
            for k in em.keys where !["auditor", "verdict", "timestamp", "protocol"].contains(k) {
                report.add(.violation, "ERF-55", rel, (em[k]?.line ?? 0) + offset, "unknown field `\(key)[\(i)].\(k)`")
            }
            let auditor = str(em, "auditor", rel, offset, path: "\(key)[\(i)].auditor")
            let verdict = str(em, "verdict", rel, offset, path: "\(key)[\(i)].verdict")
            let ts = str(em, "timestamp", rel, offset, path: "\(key)[\(i)].timestamp")
            let proto = str(em, "protocol", rel, offset, path: "\(key)[\(i)].protocol")
            if let v = verdict, !["SUPPORTED", "PARTIAL", "UNSUPPORTED"].contains(v) {
                report.add(.violation, "ERF-12", rel, (em["verdict"]?.line ?? 0) + offset,
                           "verdict `\(v)` is outside {SUPPORTED, PARTIAL, UNSUPPORTED}")
            }
            for req in ["auditor", "verdict", "timestamp", "protocol"] where em[req] == nil {
                report.add(.violation, "ERF-11", rel, item.line + offset, "`\(key)[\(i)]` is missing `\(req)`")
            }
            out.append(AuditEntry(auditor: auditor, verdict: verdict,
                                  timestamp: ts.flatMap { Stamp.parse($0) }, rawTimestamp: ts,
                                  proto: proto, line: item.line + offset))
        }
        return out
    }

    private func loadClaim(_ m: YMapping, _ rel: String, _ offset: Int, body: String) {
        unknownKeys(m, Schema.claim, rel, offset, "claim")
        guard let id = claimId(m, rel, offset) else { return }
        let kind = str(m, "epistemic_kind", rel, offset)
        if let k = kind, !["observation", "argument", "bet", "commitment"].contains(k) {
            report.add(.violation, "ERF-24", rel, m["epistemic_kind"]?.line ?? 1,
                       "`epistemic_kind` = `\(k)` is outside the closed set")
        }
        if m["epistemic_kind"] == nil {
            report.add(.violation, "ERF-24", rel, 1, "claim `\(id)` carries no `epistemic_kind`")
        }
        if m["title"] == nil {
            report.add(.violation, "ERF-18", rel, 1, "claim `\(id)` carries no `title`")
        }
        if m["corpus"] == nil {
            report.add(.violation, "ERF-17", rel, 1, "claim `\(id)` carries no `corpus`")
        }
        // ERF-22: a claim MUST NOT store a state field.
        for banned in ["status", "state", "disposition"] where m[banned] != nil {
            report.add(.violation, "ERF-22", rel, m[banned]?.line ?? 1,
                       "claim `\(id)` stores `\(banned)`; the disposition is computed, never stored")
        }
        let edges = edgeList(m, rel, offset, claim: id)
        let standings = standingList(m, rel, offset, claim: id)
        let claim = Claim(id: id, file: rel, corpus: str(m, "corpus", rel, offset),
                          title: str(m, "title", rel, offset), epistemicKind: kind,
                          created: actorStamp(m, "created", rel, offset),
                          lastModified: actorStamp(m, "last_modified", rel, offset),
                          families: strList(m, "families", rel, offset),
                          atomsFor: strList(m, "atoms_for", rel, offset),
                          atomsAgainst: strList(m, "atoms_against", rel, offset),
                          surveys: strList(m, "surveys", rel, offset),
                          edges: edges, standings: standings,
                          evidenceAudit: auditList(m, "evidence_audit", rel, offset),
                          body: body, line: 1)
        corpus.claims[id] = claim
    }

    private func edgeList(_ m: YMapping, _ rel: String, _ offset: Int, claim: String) -> [Edge] {
        guard let n = m["edges"] else { return [] }
        guard let seq = n.sequence else {
            report.add(.violation, "ERF-65", rel, n.line + offset, "`edges` must be a list; arrived as \(n.typeName)")
            return []
        }
        if seq.isEmpty {
            report.add(.violation, "ERF-55", rel, n.line + offset, "empty list `edges` is present; empty lists MUST be omitted")
        }
        var out: [Edge] = []
        var seenConflicts = Set<String>()
        for (i, item) in seq.enumerated() {
            guard let em = item.mapping else {
                report.add(.violation, "ERF-65", rel, item.line + offset, "`edges[\(i)]` is not a mapping")
                continue
            }
            for k in em.keys where !["to", "relation"].contains(k) {
                report.add(.violation, "ERF-55", rel, (em[k]?.line ?? 0) + offset, "unknown field `edges[\(i)].\(k)`")
            }
            guard let to = str(em, "to", rel, offset, path: "edges[\(i)].to"),
                  let rel2 = str(em, "relation", rel, offset, path: "edges[\(i)].relation") else {
                report.add(.violation, "ERF-43", rel, item.line + offset, "`edges[\(i)]` needs both `to` and `relation`")
                continue
            }
            if !["supports", "assumes", "decomposes-into", "conflicts-with"].contains(rel2) {
                report.add(.violation, "section 5", rel, item.line + offset,
                           "relation `\(rel2)` is outside the closed set")
            }
            if to == claim {
                report.add(.violation, "ERF-43", rel, item.line + offset,
                           "self-edge on claim `\(claim)`; self-edges MUST NOT exist")
            }
            if rel2 == "conflicts-with" {
                if seenConflicts.contains(to) {
                    report.add(.violation, "ERF-44", rel, item.line + offset,
                               "`conflicts-with` stored twice for the pair (\(claim), \(to))")
                }
                seenConflicts.insert(to)
            }
            out.append(Edge(to: to, relation: rel2, line: item.line + offset))
        }
        return out
    }

    private func standingList(_ m: YMapping, _ rel: String, _ offset: Int, claim: String) -> [StandingEntry] {
        guard let n = m["standings"] else { return [] }
        guard let seq = n.sequence else {
            report.add(.violation, "ERF-65", rel, n.line + offset, "`standings` must be a list; arrived as \(n.typeName)")
            return []
        }
        if seq.isEmpty {
            report.add(.violation, "ERF-55", rel, n.line + offset, "empty list `standings` is present; empty lists MUST be omitted")
        }
        var out: [StandingEntry] = []
        for (i, item) in seq.enumerated() {
            guard let em = item.mapping else {
                report.add(.violation, "ERF-65", rel, item.line + offset, "`standings[\(i)]` is not a mapping")
                continue
            }
            for k in em.keys where !["timestamp", "stance", "by", "why", "evidence_at_stance"].contains(k) {
                report.add(.violation, "ERF-55", rel, (em[k]?.line ?? 0) + offset, "unknown field `standings[\(i)].\(k)`")
            }
            let ts = str(em, "timestamp", rel, offset, path: "standings[\(i)].timestamp")
            let stance = str(em, "stance", rel, offset, path: "standings[\(i)].stance")
            let by = str(em, "by", rel, offset, path: "standings[\(i)].by")
            let why = str(em, "why", rel, offset, path: "standings[\(i)].why")

            // ERF-19: a full RFC 3339 instant carrying both a time and an offset.
            if let t = ts {
                if !Stamp.isFullInstant(t) {
                    report.add(.violation, "ERF-19", rel, (em["timestamp"]?.line ?? 0) + offset,
                               "standing `timestamp` = `\(t)` is not a full RFC 3339 instant with a time and an offset")
                }
            } else {
                report.add(.violation, "ERF-19", rel, item.line + offset, "`standings[\(i)]` carries no `timestamp`")
            }
            // ERF-21 / ERF-39.
            if let b = by {
                if !b.hasPrefix("human:") {
                    report.add(.violation, "ERF-21", rel, (em["by"]?.line ?? 0) + offset,
                               "a standing's `by` MUST be a `human:` actor; found `\(b)`")
                }
            } else {
                report.add(.violation, "ERF-39", rel, item.line + offset, "`standings[\(i)]` carries no `by`")
            }
            if why == nil || why!.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                report.add(.violation, "ERF-39", rel, item.line + offset,
                           "`standings[\(i)]` has an empty `why`; an entry without a reason is a toggle, not a judgment")
            }
            // ERF-41: a stance outside the vocabulary is a producer error and
            // MUST be reported. The disposition computation drops it.
            if let s = stance {
                if !["for", "against", "withdrawn"].contains(s) {
                    report.add(.violation, "ERF-41/ERF-55", rel, (em["stance"]?.line ?? 0) + offset,
                               "stance `\(s)` is outside the vocabulary {for, against, withdrawn}; the entry is left out of the disposition computation as though absent")
                }
            } else {
                report.add(.violation, "ERF-19", rel, item.line + offset, "`standings[\(i)]` carries no `stance`")
            }

            var eas: (forIds: [String], againstIds: [String])? = nil
            if let easNode = em["evidence_at_stance"] {
                if let easMap = easNode.mapping {
                    eas = (strListInner(easMap, "atoms_for", rel, offset, "standings[\(i)].evidence_at_stance"),
                           strListInner(easMap, "atoms_against", rel, offset, "standings[\(i)].evidence_at_stance"))
                } else {
                    report.add(.violation, "ERF-65", rel, easNode.line + offset,
                               "`standings[\(i)].evidence_at_stance` must be a mapping; arrived as \(easNode.typeName)")
                }
            }
            out.append(StandingEntry(rawTimestamp: ts, timestamp: ts.flatMap { Stamp.parse($0) },
                                     stance: stance, by: by, why: why, evidenceAtStance: eas,
                                     index: i, line: item.line + offset))
        }
        return out
    }

    private func strListInner(_ m: YMapping, _ key: String, _ rel: String, _ offset: Int, _ prefix: String) -> [String] {
        guard let n = m[key] else { return [] }
        guard let seq = n.sequence else {
            report.add(.violation, "ERF-65", rel, n.line + offset, "`\(prefix).\(key)` must be a list; arrived as \(n.typeName)")
            return []
        }
        var out: [String] = []
        for (i, it) in seq.enumerated() {
            if it.isString, let t = it.scalarText { out.append(t) }
            else {
                report.add(.violation, "ERF-65", rel, it.line + offset,
                           "string-typed element `\(prefix).\(key)[\(i)]` arrived as \(it.typeName)")
                if let t = it.scalarText { out.append(t) }
            }
        }
        return out
    }

    private func loadSurvey(_ m: YMapping, _ rel: String, _ offset: Int, body: String) {
        unknownKeys(m, Schema.survey, rel, offset, "survey")
        guard let id = claimId(m, rel, offset) else { return }
        if m["title"] == nil {
            report.add(.violation, "ERF-28", rel, 1, "survey `\(id)` carries no `title`; the title MUST state what was sought")
        }
        var acts: [SearchAct] = []
        if let n = m["searches"] {
            if let seq = n.sequence {
                if seq.isEmpty {
                    report.add(.violation, "ERF-55", rel, n.line + offset, "empty list `searches` is present")
                }
                for (i, item) in seq.enumerated() {
                    guard let sm = item.mapping else {
                        report.add(.violation, "ERF-65", rel, item.line + offset, "`searches[\(i)]` is not a mapping")
                        continue
                    }
                    for k in sm.keys where !["tool", "query", "scope", "hits_reported", "timestamp"].contains(k) {
                        report.add(.violation, "ERF-55", rel, (sm[k]?.line ?? 0) + offset, "unknown field `searches[\(i)].\(k)`")
                    }
                    let tool = str(sm, "tool", rel, offset, path: "searches[\(i)].tool")
                    let query = str(sm, "query", rel, offset, path: "searches[\(i)].query")
                    let scope = str(sm, "scope", rel, offset, path: "searches[\(i)].scope")
                    let hits = str(sm, "hits_reported", rel, offset, path: "searches[\(i)].hits_reported")
                    let ts = str(sm, "timestamp", rel, offset, path: "searches[\(i)].timestamp")
                    if tool == nil || tool!.isEmpty {
                        report.add(.violation, "ERF-26", rel, item.line + offset, "`searches[\(i)]` names no `tool`")
                    }
                    if query == nil || query!.isEmpty {
                        report.add(.violation, "ERF-26", rel, item.line + offset, "`searches[\(i)]` names no `query`")
                    }
                    if sm["hits_reported"] == nil {
                        report.add(.violation, "ERF-27", rel, item.line + offset, "`searches[\(i)]` records no `hits_reported`")
                    }
                    acts.append(SearchAct(tool: tool, query: query, scope: scope, hitsReported: hits,
                                          timestamp: ts.flatMap { Stamp.parse($0) }, line: item.line + offset))
                }
            } else {
                report.add(.violation, "ERF-65", rel, n.line + offset, "`searches` must be a list; arrived as \(n.typeName)")
            }
        } else {
            report.add(.violation, "ERF-26", rel, 1, "survey `\(id)` records no `searches`")
        }
        var notableAtoms: [String] = []
        if let n = m["notable_results"], let seq = n.sequence {
            if seq.isEmpty {
                report.add(.violation, "ERF-55", rel, n.line + offset, "empty list `notable_results` is present")
            }
            for (i, item) in seq.enumerated() {
                guard let nm = item.mapping else { continue }
                for k in nm.keys where !["what", "note", "atoms"].contains(k) {
                    report.add(.violation, "ERF-55", rel, (nm[k]?.line ?? 0) + offset, "unknown field `notable_results[\(i)].\(k)`")
                }
                _ = str(nm, "what", rel, offset, path: "notable_results[\(i)].what")
                _ = str(nm, "note", rel, offset, path: "notable_results[\(i)].note")
                notableAtoms += strListInner(nm, "atoms", rel, offset, "notable_results[\(i)]")
            }
        }
        corpus.surveys[id] = Survey(id: id, file: rel, corpus: str(m, "corpus", rel, offset),
                                    title: str(m, "title", rel, offset),
                                    conducted: actorStamp(m, "conducted", rel, offset),
                                    lastModified: actorStamp(m, "last_modified", rel, offset),
                                    searches: acts, notableAtoms: notableAtoms,
                                    priorSurvey: str(m, "prior_survey", rel, offset), line: 1)
        _ = body
    }

    private func loadNarrative(_ m: YMapping, _ rel: String, _ offset: Int, body: String) {
        unknownKeys(m, Schema.narrative, rel, offset, "narrative")
        // ERF-34: `title`, `corpus`, and `created` (the {timestamp, by} stamp).
        for req in ["title", "corpus", "created"] where m[req] == nil {
            report.add(.violation, "ERF-34", rel, 1, "narrative carries no `\(req)`")
        }
        let n = Narrative(file: rel, title: str(m, "title", rel, offset),
                          corpus: str(m, "corpus", rel, offset),
                          created: actorStamp(m, "created", rel, offset),
                          body: body,
                          bindings: BindingScanner.scan(body: body, commentFirst: Options.commentFirst))
        corpus.narratives.append(n)
    }
}
