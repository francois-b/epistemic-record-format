package main

import (
	"strings"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

// ---------------------------------------------------------------------------
// ERF-51: "Normalization MUST be this ordered sequence, applied identically to
// the quote and to the normalized text, so that two conforming tools reach the
// same verdict on the same pair:
//
//   1. Unicode NFKC.
//   2. Remove the markdown emphasis and code markers `*`, `_`, and `` ` ``.
//   3. Collapse whitespace runs to a single space, then trim.
//
// Case MUST NOT be folded."
//
// Open questions this implementation had to settle itself; see ambiguities.md:
//   A-05: which characters count as "whitespace" in step 3. Chosen:
//         unicode.IsSpace. The spec does not say, and NFKC in step 1 leaves
//         NBSP (U+00A0) alone while turning some other spaces into U+0020.
//   A-06: step 2 removes the three characters unconditionally, including
//         inside a word and including a literal asterisk the source itself
//         contains. The spec says "remove the markdown emphasis and code
//         markers", which could be read as "remove them where they function
//         as markers" - unimplementable without a CommonMark parser.
// ---------------------------------------------------------------------------

var markerRemover = strings.NewReplacer("*", "", "_", "", "`", "")

// Normalize applies the ERF-51 sequence.
func Normalize(s string) string {
	// 1. Unicode NFKC.
	s = norm.NFKC.String(s)
	// 2. Remove `*`, `_`, and backtick.
	s = markerRemover.Replace(s)
	// 3. Collapse whitespace runs to a single space, then trim.
	var b strings.Builder
	b.Grow(len(s))
	inSpace := false
	for _, r := range s {
		if unicode.IsSpace(r) {
			inSpace = true
			continue
		}
		if inSpace && b.Len() > 0 {
			b.WriteRune(' ')
		}
		inSpace = false
		b.WriteRune(r)
	}
	return b.String()
}

// ---------------------------------------------------------------------------
// ERF-52 / ERF-6 / ERF-50: the quote check.
// ---------------------------------------------------------------------------

const elisionMarker = "[...]"

type QuoteResult int

const (
	QuotePass QuoteResult = iota
	QuoteFail
	QuoteUnavailable
)

type QuoteCheck struct {
	Result QuoteResult
	// Detail explains a failure or an unavailability.
	Detail string
	// FailedSpan is the index of the first span that could not be placed.
	FailedSpan int
	Spans      []string
}

// CheckQuote runs the ERF-52 procedure of a quote against a normalized text
// that is already in hand.
//
//	"The quote MUST be split on `[...]` BEFORE normalization, because
//	 normalization may fold or strip brackets and would otherwise destroy the
//	 marker; each span is then normalized independently. Every non-empty span
//	 MUST occur in the normalized text, in order and without overlap. A quote
//	 whose spans are all empty MUST fail rather than trivially pass."
func CheckQuote(quote, normalizedText string) QuoteCheck {
	rawSpans := strings.Split(quote, elisionMarker)

	// Each span is normalized independently.
	spans := make([]string, 0, len(rawSpans))
	for _, s := range rawSpans {
		spans = append(spans, Normalize(s))
	}

	// "A quote whose spans are all empty MUST fail rather than trivially
	// pass." Emptiness is judged AFTER normalization here: a span of only
	// whitespace normalizes to "". See ambiguities.md A-03.
	allEmpty := true
	for _, s := range spans {
		if s != "" {
			allEmpty = false
			break
		}
	}
	if allEmpty {
		return QuoteCheck{Result: QuoteFail, Spans: spans,
			Detail: "every span of the quote is empty after normalization (ERF-52: must fail rather than trivially pass)"}
	}

	hay := Normalize(normalizedText)

	// "in order and without overlap": take the earliest legal occurrence of
	// each span at or after the end of the previous one. Earliest-first is
	// optimal for this problem - deferring a match can never enable a later
	// one - so no backtracking is needed.
	cursor := 0
	for i, s := range spans {
		if s == "" {
			continue // empty spans impose no constraint
		}
		idx := strings.Index(hay[cursor:], s)
		if idx < 0 {
			return QuoteCheck{Result: QuoteFail, Spans: spans, FailedSpan: i,
				Detail: "span " + itoa(i+1) + " of " + itoa(len(spans)) + " not found in the normalized text at or after the previous span: " + truncate(s, 80)}
		}
		cursor = cursor + idx + len(s)
	}
	return QuoteCheck{Result: QuotePass, Spans: spans}
}

func itoa(i int) string {
	if i == 0 {
		return "0"
	}
	neg := i < 0
	if neg {
		i = -i
	}
	var b []byte
	for i > 0 {
		b = append([]byte{byte('0' + i%10)}, b...)
		i /= 10
	}
	if neg {
		return "-" + string(b)
	}
	return string(b)
}

func truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n]) + "..."
}
