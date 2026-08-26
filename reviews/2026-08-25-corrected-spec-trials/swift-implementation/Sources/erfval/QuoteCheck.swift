import Foundation

// ---------------------------------------------------------------------------
// ERF-52, the quote check.
//
// "Only the exact marker `[...]` MUST be treated as an omission, and it is the
// only wildcard. [...] The quote MUST be split on `[...]` BEFORE normalization
// [...] each span is then normalized independently. Every non-empty span MUST
// occur in the normalized text, in order and without overlap, **and as whole
// words**: where a span begins with a letter, digit, or combining mark, the
// character before its occurrence MUST NOT be one, and where it ends with one,
// the character after MUST NOT be one. A span that opens or closes on
// punctuation is unconstrained on that side [...] A quote whose spans are all
// empty MUST fail rather than trivially pass."
// ---------------------------------------------------------------------------

struct QuoteCheckResult {
    enum Outcome {
        case pass
        case fail(String)
        /// ERF-51: "Facing a normalized text that is not text or markdown it
        /// MUST report the check as unavailable rather than pass or fail it,
        /// exactly as it does for a text it does not hold."
        case unavailable(String)
    }
    let outcome: Outcome
    /// Diagnostics for the trial log: the spans as normalized, and where each matched.
    let spanTrace: [String]
}

enum QuoteCheck {

    static let elisionMarker = "[...]"

    static func check(quote: String, normalizedText: String) -> QuoteCheckResult {
        // Split BEFORE normalization: "normalization may fold or strip
        // brackets and would otherwise destroy the marker".
        let rawSpans = splitOnElision(quote)
        let spans = rawSpans.map { ERF51.normalize($0) }
        let nonEmpty = spans.filter { !$0.isEmpty }

        var trace: [String] = []
        trace.append("spans(raw)=\(rawSpans.count) nonEmpty=\(nonEmpty.count)")
        for (n, s) in spans.enumerated() { trace.append("  span[\(n)] = \(debugQuote(s))") }

        if nonEmpty.isEmpty {
            return QuoteCheckResult(outcome: .fail("every span of the quote is empty after normalization"),
                                    spanTrace: trace)
        }

        let hay = Array(ERF51.normalize(normalizedText).unicodeScalars)
        var cursor = 0

        for (n, span) in nonEmpty.enumerated() {
            let needle = Array(span.unicodeScalars)
            guard let at = findWholeWord(needle: needle, in: hay, from: cursor) else {
                return QuoteCheckResult(
                    outcome: .fail("span \(n) (\(debugQuote(span))) does not occur as whole words in the normalized text at or after offset \(cursor)"),
                    spanTrace: trace)
            }
            trace.append("  span[\(n)] matched at scalar offset \(at)")
            // "in order and without overlap": the next span starts at or after
            // the end of this one.
            cursor = at + needle.count
        }
        return QuoteCheckResult(outcome: .pass, spanTrace: trace)
    }

    /// Split on the literal five characters `[...]`. Adjacent markers yield
    /// empty spans, which are then dropped as empty.
    static func splitOnElision(_ s: String) -> [String] {
        return s.components(separatedBy: elisionMarker)
    }

    /// Leftmost occurrence at or after `from` that satisfies the whole-word
    /// rule on both sides.
    ///
    /// Leftmost-valid-first is complete here: the only constraint a later span
    /// carries is "start at or after the previous span's end", so taking the
    /// earliest legal match for span i never rules out a match for span i+1
    /// that a later choice would have allowed. No backtracking is needed.
    static func findWholeWord(needle: [Unicode.Scalar], in hay: [Unicode.Scalar], from: Int) -> Int? {
        guard !needle.isEmpty else { return nil }
        guard from <= hay.count - needle.count else { return nil }
        let startsWord = ERF51.isWordScalar(needle[0])
        let endsWord = ERF51.isWordScalar(needle[needle.count - 1])

        var i = from
        while i <= hay.count - needle.count {
            var match = true
            for k in 0..<needle.count where hay[i + k] != needle[k] { match = false; break }
            if match {
                var ok = true
                if startsWord, i > 0, ERF51.isWordScalar(hay[i - 1]) { ok = false }
                let after = i + needle.count
                if ok, endsWord, after < hay.count, ERF51.isWordScalar(hay[after]) { ok = false }
                if ok { return i }
            }
            i += 1
        }
        return nil
    }

    static func debugQuote(_ s: String) -> String {
        return "\"" + s.replacingOccurrences(of: "\"", with: "\\\"") + "\""
    }
}
