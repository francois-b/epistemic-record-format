import Foundation

// ---------------------------------------------------------------------------
// A YAML 1.2 subset parser with JSON-schema scalar resolution.
//
// Why hand-written: BINDING ERF-65 requires frontmatter to "parse under YAML
// 1.2 using the JSON schema, the narrowest of the three the specification
// defines. Under it only `null`, the literals `true` and `false`, and JSON's
// own number grammar resolve to non-string scalars; everything else stays a
// string." No off-the-shelf Swift YAML parser exposes schema selection (the
// binding document itself records two cold implementations hitting this on
// 2026-08-25), and a validator that cannot control scalar resolution cannot
// implement ERF-65's reporting duty at all.
//
// The subset covered is documented in README.md. It is a subset, not YAML.
// ---------------------------------------------------------------------------

enum YScalarStyle {
    case plain, singleQuoted, doubleQuoted, literal, folded
    var isQuoted: Bool { self == .singleQuoted || self == .doubleQuoted }
}

/// The resolved tag under the YAML 1.2 JSON schema.
enum YResolved: String {
    case string, null, bool, int, float
}

final class YNode {
    enum Kind {
        case scalar(text: String, style: YScalarStyle, resolved: YResolved)
        case mapping(YMapping)
        case sequence([YNode])
    }
    let kind: Kind
    let line: Int
    init(_ kind: Kind, line: Int) { self.kind = kind; self.line = line }

    var scalarText: String? {
        if case .scalar(let t, _, _) = kind { return t }
        return nil
    }
    var scalarStyle: YScalarStyle? {
        if case .scalar(_, let s, _) = kind { return s }
        return nil
    }
    var resolved: YResolved? {
        if case .scalar(_, _, let r) = kind { return r }
        return nil
    }
    var mapping: YMapping? {
        if case .mapping(let m) = kind { return m }
        return nil
    }
    var sequence: [YNode]? {
        if case .sequence(let s) = kind { return s }
        return nil
    }
    /// A human-readable name for the arrived-as type, used by ERF-65 reporting.
    var typeName: String {
        switch kind {
        case .mapping: return "mapping"
        case .sequence: return "sequence"
        case .scalar(_, let style, let r):
            if style.isQuoted || style == .literal || style == .folded { return "string" }
            switch r {
            case .string: return "string"
            case .null: return "null"
            case .bool: return "boolean"
            case .int: return "integer"
            case .float: return "float"
            }
        }
    }
    /// True when this node loaded as a string under the JSON schema.
    var isString: Bool { typeName == "string" }
}

/// An ordered mapping. Order is preserved so a canonical model dump is
/// reproducible, and duplicate keys are recorded rather than silently merged
/// (BINDING ERF-66).
final class YMapping {
    private(set) var keys: [String] = []
    private var storage: [String: YNode] = [:]
    private(set) var duplicateKeys: [(String, Int)] = []
    let line: Int
    init(line: Int) { self.line = line }

    func insert(_ key: String, _ node: YNode, line: Int) {
        if storage[key] != nil {
            duplicateKeys.append((key, line))
            // YAML leaves the response to duplicates at the processor's
            // discretion, which is the ambiguity ERF-66 declines. We keep the
            // first and record the collision.
            return
        }
        keys.append(key)
        storage[key] = node
    }
    subscript(_ key: String) -> YNode? { storage[key] }
    var isEmpty: Bool { keys.isEmpty }
}

struct YamlDiagnostic {
    let line: Int
    let message: String
    /// Set when the diagnostic is itself a requirement violation.
    let requirement: String?
}

struct YamlDocument {
    let root: YNode?
    let diagnostics: [YamlDiagnostic]
}

// ---------------------------------------------------------------------------

final class YamlParser {
    private var lines: [String]
    private var i: Int = 0
    private(set) var diagnostics: [YamlDiagnostic] = []
    /// Line numbers here are 1-based within the text handed to the parser;
    /// the caller adds the frontmatter offset.
    init(text: String) {
        // Split preserving nothing; the caller has already checked line endings.
        self.lines = text.components(separatedBy: "\n")
        if lines.last == "" { lines.removeLast() }
    }

    func parseDocument() -> YamlDocument {
        // A leading bare document-start marker is tolerated.
        skipBlanks()
        if i < lines.count, lines[i].trimmingCharacters(in: .whitespaces) == "---" { i += 1 }
        skipBlanks()
        guard i < lines.count else {
            return YamlDocument(root: nil, diagnostics: diagnostics)
        }
        let node = parseBlock(minIndent: 0)
        skipBlanks()
        if i < lines.count {
            let t = lines[i].trimmingCharacters(in: .whitespaces)
            if t != "..." && t != "---" {
                diag(i, "trailing content the parser could not attach to the document", nil)
            }
        }
        return YamlDocument(root: node, diagnostics: diagnostics)
    }

    // MARK: - line helpers

    private func diag(_ idx: Int, _ msg: String, _ req: String?) {
        diagnostics.append(YamlDiagnostic(line: idx + 1, message: msg, requirement: req))
    }

    private func skipBlanks() {
        while i < lines.count {
            let t = lines[i].trimmingCharacters(in: .whitespaces)
            if t.isEmpty || t.hasPrefix("#") { i += 1 } else { break }
        }
    }

    private func indent(of line: String) -> Int {
        var n = 0
        for c in line {
            if c == " " { n += 1 }
            else if c == "\t" {
                // A tab in indentation is illegal YAML; report and stop counting.
                return n
            } else { break }
        }
        return n
    }

    private func isBlank(_ idx: Int) -> Bool {
        guard idx < lines.count else { return true }
        let t = lines[idx].trimmingCharacters(in: .whitespaces)
        return t.isEmpty || t.hasPrefix("#")
    }

    /// Index of the next non-blank line at or after idx, or lines.count.
    private func nextContent(from idx: Int) -> Int {
        var j = idx
        while j < lines.count && isBlank(j) { j += 1 }
        return j
    }

    // MARK: - block parsing

    private func parseBlock(minIndent: Int) -> YNode? {
        skipBlanks()
        guard i < lines.count else { return nil }
        let ind = indent(of: lines[i])
        if ind < minIndent { return nil }
        let body = String(lines[i].dropFirst(ind))
        if body == "-" || body.hasPrefix("- ") || body.hasPrefix("-\t") {
            return parseSequence(indent: ind)
        }
        return parseMapping(indent: ind)
    }

    private func parseSequence(indent seqIndent: Int) -> YNode {
        var items: [YNode] = []
        let startLine = i
        while true {
            skipBlanks()
            guard i < lines.count else { break }
            let ind = indent(of: lines[i])
            if ind != seqIndent { break }
            let body = String(lines[i].dropFirst(ind))
            guard body == "-" || body.hasPrefix("- ") || body.hasPrefix("-\t") else { break }
            let itemLine = i
            var rest = String(body.dropFirst(1))
            let leading = rest.prefix { $0 == " " || $0 == "\t" }.count
            rest = String(rest.dropFirst(leading))
            let contentColumn = seqIndent + 1 + leading

            if rest.isEmpty || rest.hasPrefix("#") {
                // Item content is on the following lines.
                i += 1
                if let n = parseBlock(minIndent: seqIndent + 1) {
                    items.append(n)
                } else {
                    items.append(YNode(.scalar(text: "", style: .plain, resolved: .null), line: itemLine + 1))
                }
                continue
            }

            // A compact nested mapping inside a sequence item:  - key: value
            if rest.hasPrefix("{") || rest.hasPrefix("[") || rest.hasPrefix("\"") || rest.hasPrefix("'")
                || rest.hasPrefix("|") || rest.hasPrefix(">") {
                let n = parseInlineValue(rest, keyIndent: contentColumn, lineIdx: itemLine)
                items.append(n)
                continue
            }
            if let colon = unquotedColonSplit(rest) {
                _ = colon
                // Re-parse this line and any continuation as a mapping whose
                // first key sits at contentColumn.
                lines[itemLine] = String(repeating: " ", count: contentColumn) + rest
                let m = parseMapping(indent: contentColumn)
                items.append(m)
                continue
            }
            let n = parseInlineValue(rest, keyIndent: contentColumn, lineIdx: itemLine)
            items.append(n)
        }
        return YNode(.sequence(items), line: startLine + 1)
    }

    private func parseMapping(indent mapIndent: Int) -> YNode {
        let m = YMapping(line: i + 1)
        while true {
            skipBlanks()
            guard i < lines.count else { break }
            let ind = indent(of: lines[i])
            if ind != mapIndent { break }
            let body = String(lines[i].dropFirst(ind))
            if body == "-" || body.hasPrefix("- ") { break }
            if body.hasPrefix("---") || body.hasPrefix("...") { break }
            guard let colonIdx = unquotedColonSplit(body) else {
                diag(i, "line is neither a mapping entry nor a sequence item: \(body.prefix(60))", nil)
                i += 1
                continue
            }
            let rawKey = String(body[body.startIndex..<colonIdx]).trimmingCharacters(in: .whitespaces)
            var rest = String(body[body.index(after: colonIdx)...])
            let lead = rest.prefix { $0 == " " || $0 == "\t" }.count
            rest = String(rest.dropFirst(lead))
            let keyLine = i
            let key = unquoteKey(rawKey, lineIdx: keyLine)

            if rest.isEmpty || rest.hasPrefix("#") {
                i += 1
                let nxt = nextContent(from: i)
                if nxt < lines.count && indent(of: lines[nxt]) > mapIndent {
                    if let child = parseBlock(minIndent: mapIndent + 1) {
                        m.insert(key, child, line: keyLine + 1)
                        continue
                    }
                }
                // An empty value resolves to null under the JSON schema.
                m.insert(key, YNode(.scalar(text: "", style: .plain, resolved: .null), line: keyLine + 1), line: keyLine + 1)
                continue
            }
            let value = parseInlineValue(rest, keyIndent: mapIndent, lineIdx: keyLine)
            m.insert(key, value, line: keyLine + 1)
        }
        return YNode(.mapping(m), line: m.line)
    }

    private func unquoteKey(_ raw: String, lineIdx: Int) -> String {
        if raw.hasPrefix("\"") && raw.hasSuffix("\"") && raw.count >= 2 {
            return unescapeDoubleQuoted(String(raw.dropFirst().dropLast()))
        }
        if raw.hasPrefix("'") && raw.hasSuffix("'") && raw.count >= 2 {
            return String(raw.dropFirst().dropLast()).replacingOccurrences(of: "''", with: "'")
        }
        return raw
    }

    /// Finds the `:` that separates a block mapping key from its value: the
    /// first colon outside quotes and outside flow brackets that is followed by
    /// a space, a tab, or end of line.
    private func unquotedColonSplit(_ s: String) -> String.Index? {
        var inSingle = false, inDouble = false, depth = 0
        var idx = s.startIndex
        var prevWasBackslash = false
        while idx < s.endIndex {
            let c = s[idx]
            if inDouble {
                if prevWasBackslash { prevWasBackslash = false }
                else if c == "\\" { prevWasBackslash = true }
                else if c == "\"" { inDouble = false }
            } else if inSingle {
                if c == "'" { inSingle = false }
            } else {
                switch c {
                case "\"": inDouble = true
                case "'": inSingle = true
                case "[", "{": depth += 1
                case "]", "}": depth -= 1
                case ":":
                    if depth == 0 {
                        let n = s.index(after: idx)
                        if n == s.endIndex || s[n] == " " || s[n] == "\t" { return idx }
                    }
                case "#":
                    if depth == 0, idx > s.startIndex {
                        let p = s[s.index(before: idx)]
                        if p == " " || p == "\t" { return nil }
                    }
                default: break
                }
            }
            idx = s.index(after: idx)
        }
        return nil
    }

    // MARK: - values

    private func parseInlineValue(_ rest: String, keyIndent: Int, lineIdx: Int) -> YNode {
        var rest = rest

        // ERF-66: anchors, aliases and explicit tags are refused, not adjudicated.
        while let first = rest.first, first == "&" || first == "*" || first == "!" {
            let token = rest.prefix { $0 != " " && $0 != "\t" }
            let what = first == "&" ? "anchor" : (first == "*" ? "alias" : "explicit tag")
            diag(lineIdx, "frontmatter contains a YAML \(what) (`\(token)`)", "ERF-66")
            rest = String(rest.dropFirst(token.count)).trimmingCharacters(in: .whitespaces)
            if first == "*" {
                // An alias has no further content to parse.
                return YNode(.scalar(text: String(token), style: .plain, resolved: .string), line: lineIdx + 1)
            }
            if rest.isEmpty { return YNode(.scalar(text: "", style: .plain, resolved: .null), line: lineIdx + 1) }
        }

        if rest.hasPrefix("|") || rest.hasPrefix(">") {
            return parseBlockScalar(header: rest, keyIndent: keyIndent, lineIdx: lineIdx)
        }
        if rest.hasPrefix("\"") {
            return parseQuoted(rest, double: true, lineIdx: lineIdx)
        }
        if rest.hasPrefix("'") {
            return parseQuoted(rest, double: false, lineIdx: lineIdx)
        }
        if rest.hasPrefix("[") || rest.hasPrefix("{") {
            return parseFlow(rest, lineIdx: lineIdx)
        }
        return parsePlain(rest, keyIndent: keyIndent, lineIdx: lineIdx)
    }

    private func parseBlockScalar(header: String, keyIndent: Int, lineIdx: Int) -> YNode {
        let folded = header.hasPrefix(">")
        let chomp: Character? = header.dropFirst().first { $0 == "-" || $0 == "+" }
        i = lineIdx + 1
        var collected: [String] = []
        var blockIndent: Int? = nil
        while i < lines.count {
            let raw = lines[i]
            if raw.trimmingCharacters(in: .whitespaces).isEmpty {
                collected.append("")
                i += 1
                continue
            }
            let ind = indent(of: raw)
            if ind <= keyIndent { break }
            if blockIndent == nil { blockIndent = ind }
            collected.append(String(raw.dropFirst(min(ind, blockIndent!))))
            i += 1
        }
        while let last = collected.last, last.isEmpty { collected.removeLast() }
        var text: String
        if folded {
            var out: [String] = []
            var cur = ""
            for l in collected {
                if l.isEmpty { out.append(cur); cur = "" }
                else if cur.isEmpty { cur = l }
                else { cur += " " + l }
            }
            out.append(cur)
            text = out.joined(separator: "\n")
        } else {
            text = collected.joined(separator: "\n")
        }
        if chomp != "-" { text += "\n" }
        if chomp == "-" { /* stripped */ }
        return YNode(.scalar(text: text, style: folded ? .folded : .literal, resolved: .string), line: lineIdx + 1)
    }

    /// Reads a quoted scalar that may span lines (YAML line folding: a break
    /// becomes a space, a blank line becomes a newline).
    private func parseQuoted(_ first: String, double: Bool, lineIdx: Int) -> YNode {
        let q: Character = double ? "\"" : "'"
        var segments: [String] = []
        var cur = String(first.dropFirst())
        var idx = lineIdx
        var closed = false
        var raw = ""

        func scan(_ s: String) -> (body: String, closedAt: String.Index?) {
            var j = s.startIndex
            var esc = false
            while j < s.endIndex {
                let c = s[j]
                if double {
                    if esc { esc = false }
                    else if c == "\\" { esc = true }
                    else if c == q { return (String(s[s.startIndex..<j]), j) }
                } else {
                    if c == q {
                        let n = s.index(after: j)
                        if n < s.endIndex && s[n] == q { j = n }        // '' escape
                        else { return (String(s[s.startIndex..<j]), j) }
                    }
                }
                j = s.index(after: j)
            }
            return (s, nil)
        }

        while true {
            let (bodyPart, at) = scan(cur)
            if let _ = at {
                segments.append(bodyPart)
                closed = true
                break
            }
            segments.append(bodyPart)
            idx += 1
            if idx >= lines.count { break }
            cur = lines[idx].trimmingCharacters(in: .whitespaces)
            raw = cur
            _ = raw
        }
        i = idx + 1
        if !closed {
            diag(lineIdx, "unterminated quoted scalar", nil)
        }
        // Fold: join lines with a single space, blank line -> newline.
        var text = ""
        for (n, seg) in segments.enumerated() {
            if n == 0 { text = seg; continue }
            if seg.isEmpty { text += "\n" }
            else if text.hasSuffix("\n") { text += seg }
            else { text += " " + seg }
        }
        if double { text = unescapeDoubleQuoted(text) }
        else { text = text.replacingOccurrences(of: "''", with: "'") }
        return YNode(.scalar(text: text, style: double ? .doubleQuoted : .singleQuoted, resolved: .string),
                     line: lineIdx + 1)
    }

    private func parseFlow(_ first: String, lineIdx: Int) -> YNode {
        var buf = first
        var idx = lineIdx
        while !flowBalanced(buf) {
            idx += 1
            if idx >= lines.count { break }
            buf += " " + lines[idx].trimmingCharacters(in: .whitespaces)
        }
        i = idx + 1
        var scanner = FlowScanner(text: buf, line: lineIdx + 1, parser: self)
        let node = scanner.parse()
        return node ?? YNode(.scalar(text: buf, style: .plain, resolved: .string), line: lineIdx + 1)
    }

    private func flowBalanced(_ s: String) -> Bool {
        var depth = 0, inS = false, inD = false, esc = false
        var seen = false
        for c in s {
            if inD { if esc { esc = false } else if c == "\\" { esc = true } else if c == "\"" { inD = false }; continue }
            if inS { if c == "'" { inS = false }; continue }
            switch c {
            case "\"": inD = true
            case "'": inS = true
            case "[", "{": depth += 1; seen = true
            case "]", "}": depth -= 1
            default: break
            }
        }
        return seen && depth <= 0
    }

    private func parsePlain(_ rest: String, keyIndent: Int, lineIdx: Int) -> YNode {
        var text = stripTrailingComment(rest)
        var idx = lineIdx + 1
        // Multi-line plain scalar continuation: more-indented lines that do not
        // themselves read as a mapping entry or a sequence item.
        while idx < lines.count {
            if lines[idx].trimmingCharacters(in: .whitespaces).isEmpty { break }
            let ind = indent(of: lines[idx])
            if ind <= keyIndent { break }
            let body = String(lines[idx].dropFirst(ind))
            if body.hasPrefix("- ") || body == "-" { break }
            if unquotedColonSplit(body) != nil { break }
            if body.hasPrefix("#") { break }
            text += " " + stripTrailingComment(body)
            idx += 1
        }
        i = idx
        let trimmed = text.trimmingCharacters(in: .whitespaces)
        return YNode(.scalar(text: trimmed, style: .plain, resolved: resolveJSONSchema(trimmed)),
                     line: lineIdx + 1)
    }

    fileprivate func stripTrailingComment(_ s: String) -> String {
        var inS = false, inD = false, esc = false
        var idx = s.startIndex
        while idx < s.endIndex {
            let c = s[idx]
            if inD { if esc { esc = false } else if c == "\\" { esc = true } else if c == "\"" { inD = false } }
            else if inS { if c == "'" { inS = false } }
            else if c == "\"" { inD = true }
            else if c == "'" { inS = true }
            else if c == "#" {
                if idx == s.startIndex { return "" }
                let p = s[s.index(before: idx)]
                if p == " " || p == "\t" { return String(s[s.startIndex..<idx]).trimmingCharacters(in: .whitespaces) }
            }
            idx = s.index(after: idx)
        }
        return s.trimmingCharacters(in: .whitespaces)
    }
}

// ---------------------------------------------------------------------------
// Scalar resolution under the YAML 1.2 JSON schema (BINDING ERF-65).
//
// "Under it only `null`, the literals `true` and `false`, and JSON's own
// number grammar resolve to non-string scalars; everything else stays a
// string."
//
// Note what this rules OUT that a YAML 1.1 core-schema parser would resolve:
// `yes`/`no`/`on`/`off`, `~`, `Null`/`NULL`/`True`/`FALSE`, `0o17`, `0x1F`,
// sexagesimals, `.inf`/`.nan`, and unquoted timestamps.
// ---------------------------------------------------------------------------

func resolveJSONSchema(_ s: String) -> YResolved {
    if s.isEmpty { return .null }
    if s == "null" { return .null }
    if s == "true" || s == "false" { return .bool }
    return jsonNumberKind(s) ?? .string
}

/// JSON's own number grammar: -?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?
/// A leading zero on a multi-digit integer (`012`) is NOT a JSON number, and a
/// leading `+`, a bare `.5`, `1.`, `0x10`, `1_000` and `Infinity` are not either.
func jsonNumberKind(_ s: String) -> YResolved? {
    var idx = s.startIndex
    let end = s.endIndex
    func peek() -> Character? { idx < end ? s[idx] : nil }
    func take() -> Character? { guard idx < end else { return nil }; let c = s[idx]; idx = s.index(after: idx); return c }

    if peek() == "-" { _ = take() }
    guard let first = take(), first.isASCII, first.isNumber else { return nil }
    if first == "0" {
        if let n = peek(), n.isASCII, n.isNumber { return nil }   // 012 is not a JSON number
    } else {
        while let n = peek(), n.isASCII, n.isNumber { _ = take() }
    }
    var isFloat = false
    if peek() == "." {
        _ = take()
        guard let d = peek(), d.isASCII, d.isNumber else { return nil }
        while let n = peek(), n.isASCII, n.isNumber { _ = take() }
        isFloat = true
    }
    if let e = peek(), e == "e" || e == "E" {
        _ = take()
        if let sgn = peek(), sgn == "+" || sgn == "-" { _ = take() }
        guard let d = peek(), d.isASCII, d.isNumber else { return nil }
        while let n = peek(), n.isASCII, n.isNumber { _ = take() }
        isFloat = true
    }
    guard idx == end else { return nil }
    return isFloat ? .float : .int
}

func unescapeDoubleQuoted(_ s: String) -> String {
    var out = ""
    var it = s.startIndex
    while it < s.endIndex {
        let c = s[it]
        if c != "\\" { out.append(c); it = s.index(after: it); continue }
        it = s.index(after: it)
        guard it < s.endIndex else { out.append("\\"); break }
        let e = s[it]
        switch e {
        case "n": out.append("\n")
        case "t": out.append("\t")
        case "r": out.append("\r")
        case "0": out.append("\0")
        case "\\": out.append("\\")
        case "\"": out.append("\"")
        case "/": out.append("/")
        case "u":
            var hex = ""
            var k = s.index(after: it)
            var n = 0
            while k < s.endIndex && n < 4 { hex.append(s[k]); k = s.index(after: k); n += 1 }
            if let v = UInt32(hex, radix: 16), let sc = Unicode.Scalar(v) { out.unicodeScalars.append(sc) }
            it = s.index(before: k)
        default: out.append(e)
        }
        it = s.index(after: it)
    }
    return out
}

// ---------------------------------------------------------------------------

private struct FlowScanner {
    let chars: [Character]
    var p: Int = 0
    let line: Int
    unowned let parser: YamlParser

    init(text: String, line: Int, parser: YamlParser) {
        self.chars = Array(text)
        self.line = line
        self.parser = parser
    }

    mutating func parse() -> YNode? {
        skipWS()
        return parseNode()
    }

    mutating func skipWS() { while p < chars.count && (chars[p] == " " || chars[p] == "\t") { p += 1 } }

    mutating func parseNode() -> YNode? {
        skipWS()
        guard p < chars.count else { return nil }
        switch chars[p] {
        case "[": return parseSeq()
        case "{": return parseMap()
        case "\"": return parseQuotedFlow(double: true)
        case "'": return parseQuotedFlow(double: false)
        default: return parsePlainFlow()
        }
    }

    mutating func parseSeq() -> YNode {
        p += 1
        var items: [YNode] = []
        while true {
            skipWS()
            if p >= chars.count { break }
            if chars[p] == "]" { p += 1; break }
            if chars[p] == "," { p += 1; continue }
            guard let n = parseNode() else { break }
            items.append(n)
        }
        return YNode(.sequence(items), line: line)
    }

    mutating func parseMap() -> YNode {
        p += 1
        let m = YMapping(line: line)
        while true {
            skipWS()
            if p >= chars.count { break }
            if chars[p] == "}" { p += 1; break }
            if chars[p] == "," { p += 1; continue }
            guard let keyNode = parseNode() else { break }
            let key = keyNode.scalarText ?? ""
            skipWS()
            if p < chars.count && chars[p] == ":" { p += 1 }
            skipWS()
            let value = parseNode() ?? YNode(.scalar(text: "", style: .plain, resolved: .null), line: line)
            m.insert(key, value, line: line)
        }
        return YNode(.mapping(m), line: line)
    }

    mutating func parseQuotedFlow(double: Bool) -> YNode {
        let q: Character = double ? "\"" : "'"
        p += 1
        var out = ""
        var esc = false
        while p < chars.count {
            let c = chars[p]
            if double {
                if esc { out.append("\\"); out.append(c); esc = false; p += 1; continue }
                if c == "\\" { esc = true; p += 1; continue }
                if c == q { p += 1; break }
            } else {
                if c == q {
                    if p + 1 < chars.count && chars[p + 1] == q { out.append(q); p += 2; continue }
                    p += 1; break
                }
            }
            out.append(c)
            p += 1
        }
        let text = double ? unescapeDoubleQuoted(out) : out
        return YNode(.scalar(text: text, style: double ? .doubleQuoted : .singleQuoted, resolved: .string), line: line)
    }

    mutating func parsePlainFlow() -> YNode {
        var out = ""
        while p < chars.count {
            let c = chars[p]
            if c == "," || c == "]" || c == "}" || c == ":" { break }
            out.append(c)
            p += 1
        }
        let t = out.trimmingCharacters(in: .whitespaces)
        return YNode(.scalar(text: t, style: .plain, resolved: resolveJSONSchema(t)), line: line)
    }
}
