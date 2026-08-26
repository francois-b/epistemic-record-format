import Foundation

// ---------------------------------------------------------------------------
// ERF-51. "Normalization MUST be this ordered sequence, applied identically to
// the quote and to the normalized text, so that two conforming tools reach the
// same verdict on the same pair:
//   1. Unicode NFC.
//   2. Remove the markdown emphasis and code markers `*`, `_`, and `` ` ``.
//   3. Collapse whitespace runs to a single space, then trim.
// Case MUST NOT be folded."
//
// The named form is NFC (the spec argues at length against NFKC, which was the
// earlier choice).
//
// Two decisions the prose does not make, recorded in ambiguities.md:
//   (a) "whitespace" is read as the Unicode White_Space property, not ASCII
//       [ \t\r\n\f\v]. This makes NBSP (U+00A0) and the ideographic space
//       (U+3000) collapse to a plain space.
//   (b) step 2 removes EVERY occurrence of the three characters, not only
//       those functioning as CommonMark emphasis or code delimiters.
// ---------------------------------------------------------------------------

enum ERF51 {

    static func normalize(_ input: String) -> String {
        // 1. Unicode NFC.
        let nfc = input.precomposedStringWithCanonicalMapping

        // 2. Remove `*`, `_`, `` ` ``.
        var stripped = String.UnicodeScalarView()
        stripped.reserveCapacity(nfc.unicodeScalars.count)
        for u in nfc.unicodeScalars {
            if u == "*" || u == "_" || u == "`" { continue }
            stripped.append(u)
        }

        // 3. Collapse whitespace runs to a single space, then trim.
        var out = String.UnicodeScalarView()
        out.reserveCapacity(stripped.count)
        var pendingSpace = false
        var wroteAny = false
        for u in stripped {
            if isWhitespace(u) {
                if wroteAny { pendingSpace = true }
                continue
            }
            if pendingSpace { out.append(" "); pendingSpace = false }
            out.append(u)
            wroteAny = true
        }
        return String(String.UnicodeScalarView(out))
    }

    /// Unicode White_Space. See ambiguity (a).
    static func isWhitespace(_ u: Unicode.Scalar) -> Bool {
        return u.properties.isWhitespace
    }

    /// "a letter, digit, or combining mark" for ERF-52's whole-word rule.
    /// Read as: general category L* (letter), Nd (decimal digit), and
    /// Mn/Mc/Me (combining mark). Nl and No are NOT included; see
    /// ambiguities.md, ERF-52 reading 3.
    static func isWordScalar(_ u: Unicode.Scalar) -> Bool {
        switch u.properties.generalCategory {
        case .uppercaseLetter, .lowercaseLetter, .titlecaseLetter,
             .modifierLetter, .otherLetter,
             .decimalNumber,
             .nonspacingMark, .spacingMark, .enclosingMark:
            return true
        default:
            return false
        }
    }
}
