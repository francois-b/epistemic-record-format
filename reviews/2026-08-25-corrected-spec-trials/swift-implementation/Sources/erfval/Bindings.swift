import Foundation

// ---------------------------------------------------------------------------
// ERF-31, narrative bindings.
//
// Grammar as given:
//   narrative-binding ::= "<!--" ws* "claims:" ws+ ids ws+ anchor
//                         ws+ "bound-at=" date ws* "-->"
//   date     ::= YYYY "-" MM "-" DD
//   ids      ::= id (ws+ id)*
//   id       ::= one or more characters, none of them whitespace or '"'
//   anchor   ::= '"' char* '"'
//   char     ::= any character other than '"' and '\', or one of the
//                two-character escapes '\"' and '\\'
//
// "A binding that does not match this grammar MUST be reported, never skipped.
//  A comment opening `<!--` followed by `claims:` IS a narrative binding:
//  recognizing one and validating one are separate acts, and a consumer
//  performs them in that order."
//
// "A binding's passage is the text from the end of the previous binding's
//  marker, or the start of the body where there is none, to the start of its
//  own marker."
// ---------------------------------------------------------------------------

struct NarrativeBinding {
    /// Scalar offsets into the body.
    let markerStart: Int
    let markerEnd: Int          // exclusive
    let raw: String
    let wellFormed: Bool
    let grammarError: String?
    let claimIds: [String]
    let anchor: String?         // already unescaped
    let boundAt: String?        // as written, YYYY-MM-DD
    let boundAtIsCalendarDate: Bool
    /// The passage this binding closes, filled in after all bindings are found.
    var passage: String = ""
}

enum BindingScanner {

    /// Recognize, then validate. Returns bindings in document order.
    ///
    /// `commentFirst` selects between the two readings of how far a binding's
    /// marker extends (ambiguities.md, ERF-31 #1):
    ///   false (default) -- apply the ERF-31 grammar directly to the document
    ///     text. `-->` is a legal `id` character and a legal `char`, so the
    ///     grammar's own terminal is the first `-->` the production reaches,
    ///     not the first one in the text.
    ///   true -- delimit the HTML comment first (CommonMark: it ends at the
    ///     first `-->`), then require the grammar to match that slice exactly.
    static func scan(body: String, commentFirst: Bool = false) -> [NarrativeBinding] {
        let s = Array(body.unicodeScalars)
        var out: [NarrativeBinding] = []
        var i = 0

        while i < s.count {
            guard let open = findLiteral("<!--", in: s, from: i) else { break }

            // Recognition: `<!--` ws* `claims:`
            var p = open + 4
            while p < s.count && isWS(s[p]) { p += 1 }
            guard matchLiteral("claims:", in: s, at: p) else {
                // An ordinary HTML comment. Not a narrative binding.
                i = open + 4
                continue
            }

            var limit = s.count
            if commentFirst {
                if let arrow = findLiteral("-->", in: s, from: open + 4) { limit = arrow + 3 }
            }

            // It IS a narrative binding. Now validate.
            switch parseBinding(s, from: open, limit: limit, mustEndAtLimit: commentFirst) {
            case .success(let b):
                out.append(b)
                i = b.markerEnd
            case .failure(let err):
                // Malformed. Its marker extent is undefined by the grammar;
                // we take `<!--` to the first following `-->`, or to end of
                // body when there is none. See ambiguities.md, ERF-31 #2.
                let end: Int
                if commentFirst { end = limit }
                else if let arrow = findLiteral("-->", in: s, from: open + 4) { end = arrow + 3 }
                else { end = s.count }
                out.append(NarrativeBinding(
                    markerStart: open, markerEnd: end,
                    raw: String(String.UnicodeScalarView(s[open..<end])),
                    wellFormed: false, grammarError: err,
                    claimIds: [], anchor: nil, boundAt: nil, boundAtIsCalendarDate: false))
                i = end
            }
        }

        // Fill in each binding's passage.
        var result: [NarrativeBinding] = []
        var prevEnd = 0
        for var b in out {
            b.passage = String(String.UnicodeScalarView(s[prevEnd..<b.markerStart]))
            prevEnd = b.markerEnd
            result.append(b)
        }
        return result
    }

    // MARK: - grammar

    private enum ParseResult {
        case success(NarrativeBinding)
        case failure(String)
    }

    private static func parseBinding(_ s: [Unicode.Scalar], from open: Int,
                                     limit: Int, mustEndAtLimit: Bool) -> ParseResult {
        let end = min(limit, s.count)
        func inRange(_ i: Int) -> Bool { i < end }
        var p = open + 4                                  // past "<!--"
        while inRange(p) && isWS(s[p]) { p += 1 }         // ws*
        guard matchLiteral("claims:", in: s, at: p) else { return .failure("expected `claims:`") }
        p += 7

        // ws+
        var n = 0
        while inRange(p) && isWS(s[p]) { p += 1; n += 1 }
        guard n > 0 else { return .failure("expected whitespace after `claims:`") }

        // ids ::= id (ws+ id)*, with id = one or more chars, none of them
        // whitespace or '"'. Ids therefore run up to the first '"', which is
        // the only character that can open the anchor.
        var ids: [String] = []
        while true {
            guard inRange(p) else { return .failure("comment ends inside the id list; no anchor found") }
            if s[p] == "\"" { break }
            var idScalars: [Unicode.Scalar] = []
            while inRange(p) && !isWS(s[p]) && s[p] != "\"" {
                idScalars.append(s[p]); p += 1
            }
            guard !idScalars.isEmpty else { return .failure("empty id") }
            ids.append(String(String.UnicodeScalarView(idScalars)))
            var w = 0
            while inRange(p) && isWS(s[p]) { p += 1; w += 1 }
            if inRange(p) && s[p] == "\"" {
                guard w > 0 else { return .failure("no whitespace between the last id and the anchor") }
                break
            }
            guard w > 0 else { return .failure("comment ends before an anchor was found") }
        }
        guard !ids.isEmpty else { return .failure("no claim ids") }
        guard inRange(p), s[p] == "\"" else { return .failure("expected the opening quote of the anchor") }

        // anchor ::= '"' char* '"'
        p += 1
        var anchor = ""
        var closed = false
        while inRange(p) {
            let c = s[p]
            if c == "\"" { closed = true; p += 1; break }
            if c == "\\" {
                guard inRange(p + 1) else { return .failure("anchor ends on a lone backslash") }
                let nxt = s[p + 1]
                guard nxt == "\"" || nxt == "\\" else {
                    return .failure("illegal escape `\\\(String(nxt))` in the anchor; only \\\" and \\\\ are defined")
                }
                anchor.unicodeScalars.append(nxt)
                p += 2
                continue
            }
            anchor.unicodeScalars.append(c)
            p += 1
        }
        guard closed else { return .failure("unterminated anchor") }

        // ws+
        var w2 = 0
        while inRange(p) && isWS(s[p]) { p += 1; w2 += 1 }
        guard w2 > 0 else { return .failure("expected whitespace after the anchor") }

        guard matchLiteral("bound-at=", in: s, at: p) else { return .failure("expected `bound-at=`") }
        p += 9

        // date ::= YYYY "-" MM "-" DD
        guard p + 10 <= end else { return .failure("truncated bound-at date") }
        let dateScalars = Array(s[p..<(p + 10)])
        let date = String(String.UnicodeScalarView(dateScalars))
        guard isDateShape(dateScalars) else { return .failure("bound-at is not YYYY-MM-DD: `\(date)`") }
        p += 10

        while inRange(p) && isWS(s[p]) { p += 1 }         // ws*
        guard matchLiteral("-->", in: s, at: p) else { return .failure("expected `-->`") }
        p += 3

        return .success(NarrativeBinding(
            markerStart: open, markerEnd: p,
            raw: String(String.UnicodeScalarView(s[open..<p])),
            wellFormed: true, grammarError: nil,
            claimIds: ids, anchor: anchor, boundAt: date,
            boundAtIsCalendarDate: isCalendarDate(date)))
    }

    // MARK: - helpers

    /// `ws` is not defined in the grammar. Read as Unicode White_Space, which
    /// lets a binding span lines. See ambiguities.md, ERF-31 #4.
    static func isWS(_ u: Unicode.Scalar) -> Bool { u.properties.isWhitespace }

    private static func isDateShape(_ d: [Unicode.Scalar]) -> Bool {
        guard d.count == 10 else { return false }
        func dig(_ i: Int) -> Bool { d[i].properties.numericType == .decimal && d[i].isASCII }
        return dig(0) && dig(1) && dig(2) && dig(3) && d[4] == "-"
            && dig(5) && dig(6) && d[7] == "-" && dig(8) && dig(9)
    }

    static func isCalendarDate(_ s: String) -> Bool {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "UTC")
        f.dateFormat = "yyyy-MM-dd"
        f.isLenient = false
        return f.date(from: s) != nil
    }

    private static func findLiteral(_ lit: String, in s: [Unicode.Scalar], from: Int) -> Int? {
        let l = Array(lit.unicodeScalars)
        guard l.count <= s.count else { return nil }
        var i = max(0, from)
        while i <= s.count - l.count {
            var ok = true
            for k in 0..<l.count where s[i + k] != l[k] { ok = false; break }
            if ok { return i }
            i += 1
        }
        return nil
    }

    private static func matchLiteral(_ lit: String, in s: [Unicode.Scalar], at: Int) -> Bool {
        let l = Array(lit.unicodeScalars)
        guard at >= 0, at + l.count <= s.count else { return false }
        for k in 0..<l.count where s[at + k] != l[k] { return false }
        return true
    }
}
