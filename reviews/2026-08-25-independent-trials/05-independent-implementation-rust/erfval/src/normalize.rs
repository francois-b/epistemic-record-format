//! ERF-51 and ERF-52: the normalization sequence and the quote check.
//!
//! The spec says the conformance case files in the parent repository are normative for the
//! exact behavior of ERF-51 "where a reading of the prose and a case disagree". This trial
//! has only the prose, so every judgement call below is a reading of the prose alone and
//! is listed in friction-log.md.

use regex::Regex;
use std::sync::OnceLock;
use unicode_normalization::UnicodeNormalization;

struct Res {
    md_link_inline: Regex,
    md_link_ref: Regex,
    brace_blob: Regex,
    paren_target: Regex,
    blockquote: Regex,
    space_before_punct: Regex,
    hyphen_newline: Regex,
    multi_hyphen: Regex,
    dash_spacing: Regex,
    ws_runs: Regex,
}

fn res() -> &'static Res {
    static R: OnceLock<Res> = OnceLock::new();
    R.get_or_init(|| Res {
        // (a) markdown link syntax reduces to its link text. The leading `!` of an image
        // goes with the syntax: keeping it would leave a stray `!` in the text, which no
        // reading of "reduces to its link text" wants.
        md_link_inline: Regex::new(r"!?\[([^\[\]]*)\]\([^()]*\)").unwrap(),
        md_link_ref: Regex::new(r"!?\[([^\[\]]*)\]\[[^\[\]]*\]").unwrap(),
        // (b) attribute blobs in braces
        brace_blob: Regex::new(r"\{[^{}]*\}").unwrap(),
        // (c) parenthesized link targets: absolute, protocol-relative, root-relative,
        // fragment-only. A relative target like `(notes.md)` is left alone: the spec lists
        // four forms and a bare parenthetical is ordinary prose.
        paren_target: Regex::new(r"\((?:[A-Za-z][A-Za-z0-9+.\-]*://[^\s()]*|//[^\s()]*|/[^\s()]*|#[^\s()]*)\)").unwrap(),
        // (d) blockquote markers at the start of a line, each with one following space
        blockquote: Regex::new(r"(?m)^[ \t]*(?:>[ ]?)+").unwrap(),
        // (f) a space before , . ; : ! ?
        space_before_punct: Regex::new(r"[ \t]+([,.;:!?])").unwrap(),
        // (7) words broken across lines
        hyphen_newline: Regex::new(r"-\n[ \t]*").unwrap(),
        // (8) runs of two or more hyphens
        multi_hyphen: Regex::new(r"-{2,}").unwrap(),
        // (10) whitespace either side of a hyphen
        dash_spacing: Regex::new(r"\s*-\s*").unwrap(),
        // (11) whitespace runs
        ws_runs: Regex::new(r"\s+").unwrap(),
    })
}

/// The markup-unwrapping steps (a) through (f), which ERF-51 makes mandatory and runs
/// before step 1.
pub fn unwrap_markup(input: &str) -> String {
    let r = res();
    let mut s = input.to_string();
    // (a) run to a fixed point so that nested link text is reduced too
    for _ in 0..8 {
        let next = r.md_link_inline.replace_all(&s, "$1").to_string();
        let next = r.md_link_ref.replace_all(&next, "$1").to_string();
        if next == s {
            break;
        }
        s = next;
    }
    // (b)
    s = r.brace_blob.replace_all(&s, "").to_string();
    // (c)
    s = r.paren_target.replace_all(&s, "").to_string();
    // (d)
    s = r.blockquote.replace_all(&s, "").to_string();
    // (e)
    s = s
        .chars()
        .filter(|c| !matches!(c, '[' | ']' | '®' | '™' | '©' | '^' | '\\'))
        .collect();
    // (f)
    s = r.space_before_punct.replace_all(&s, "$1").to_string();
    s
}

/// The full ERF-51 sequence: unwrapping steps (a)-(f), then steps 1-11.
pub fn normalize(input: &str) -> String {
    let r = res();
    let mut s = unwrap_markup(input);
    // 1. Unicode NFKC
    s = s.nfkc().collect::<String>();
    // 2. soft hyphens
    s = s.replace('\u{00AD}', "");
    // 3. typographic single quotes
    s = s.replace(['\u{2018}', '\u{2019}', '\u{201B}'], "'");
    // 4. typographic double quotes
    s = s.replace(['\u{201C}', '\u{201D}', '\u{201F}'], "\"");
    // 5. straight double quotes (after 4, deliberately)
    s = s.replace('"', "");
    // 6. dash variants
    s = s
        .chars()
        .map(|c| match c {
            '\u{2010}'..='\u{2015}' | '\u{2212}' => '-',
            c => c,
        })
        .collect();
    // 7. words broken across lines
    s = r.hyphen_newline.replace_all(&s, "").to_string();
    // 8. runs of hyphens
    s = r.multi_hyphen.replace_all(&s, "-").to_string();
    // 9. emphasis and code markers
    s = s.chars().filter(|c| !matches!(c, '*' | '_' | '`')).collect();
    // 10. dash spacing
    s = r.dash_spacing.replace_all(&s, "-").to_string();
    // 11. whitespace runs, then trim
    s = r.ws_runs.replace_all(&s, " ").to_string();
    s.trim().to_string()
}

#[derive(Debug, PartialEq, Eq)]
pub enum QuoteVerdict {
    Pass,
    /// The 0-based index of the span that could not be found, and the span text.
    SpanMissing(usize, String),
    /// ERF-52: "A quote whose spans are all empty MUST fail rather than trivially pass."
    AllSpansEmpty,
}

/// ERF-52. The quote is split on the exact marker `[...]` BEFORE normalization, each span
/// is normalized independently, and every non-empty span must occur in the normalized
/// capture in order and without overlap.
pub fn check_quote(quote: &str, capture: &str) -> QuoteVerdict {
    let hay = normalize(capture);
    let spans: Vec<String> = quote.split("[...]").map(normalize).collect();
    // "Non-empty" is tested after normalization: a span that normalizes away has nothing
    // to look for. (A reading; the prose does not say which side of normalization it means.)
    if spans.iter().all(|s| s.is_empty()) {
        return QuoteVerdict::AllSpansEmpty;
    }
    let mut cursor = 0usize;
    for (i, span) in spans.iter().enumerate() {
        if span.is_empty() {
            continue;
        }
        match hay[cursor..].find(span.as_str()) {
            Some(pos) => cursor = cursor + pos + span.len(),
            None => return QuoteVerdict::SpanMissing(i, span.clone()),
        }
    }
    QuoteVerdict::Pass
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn step_order_quotes() {
        // A quotation typed with straight quotes and the same typed with typographic ones
        // must normalize to the same string (ERF-51 step 5's stated reason).
        assert_eq!(normalize("he said \"hello\""), normalize("he said \u{201C}hello\u{201D}"));
    }

    #[test]
    fn case_is_not_folded() {
        assert_ne!(normalize("Hello"), normalize("hello"));
    }

    #[test]
    fn line_break_hyphen_join() {
        assert_eq!(normalize("double-\n   entry"), "doubleentry");
    }

    #[test]
    fn dash_spacing_and_runs() {
        assert_eq!(normalize("entries -- that is"), "entries-that is");
        assert_eq!(normalize("entries \u{2014} that is"), "entries-that is");
    }

    #[test]
    fn markup_unwrapping() {
        assert_eq!(normalize("see [the ledger](https://example.com/a) now"), "see the ledger now");
        assert_eq!(normalize("heading {.cls #id} text"), "heading text");
        assert_eq!(normalize("> quoted line"), "quoted line");
        assert_eq!(normalize("word ®™© and ^ and \\"), "word and and");
        assert_eq!(normalize("spaced , comma ."), "spaced, comma.");
    }

    #[test]
    fn soft_hyphen_and_nfkc() {
        assert_eq!(normalize("dou\u{00AD}ble"), "double");
        assert_eq!(normalize("\u{FB01}le"), "file"); // NFKC ligature fold
    }

    #[test]
    fn elision_marker_is_the_only_wildcard() {
        let capture = "All entries made in the ledger have to be double entries";
        assert_eq!(check_quote("All entries [...] double entries", capture), QuoteVerdict::Pass);
        // a bare ... is literal
        assert!(matches!(check_quote("All entries ... double entries", capture), QuoteVerdict::SpanMissing(..)));
    }

    #[test]
    fn spans_must_occur_in_order_without_overlap() {
        let capture = "alpha beta gamma";
        assert_eq!(check_quote("alpha[...]gamma", capture), QuoteVerdict::Pass);
        assert!(matches!(check_quote("gamma[...]alpha", capture), QuoteVerdict::SpanMissing(..)));
        // no overlap: the second span may not reuse the first span's characters
        assert!(matches!(check_quote("alpha beta[...]beta gamma", capture), QuoteVerdict::SpanMissing(..)));
    }

    #[test]
    fn all_empty_spans_fail() {
        assert_eq!(check_quote("[...]", "anything"), QuoteVerdict::AllSpansEmpty);
        assert_eq!(check_quote("  [...]  ", "anything"), QuoteVerdict::AllSpansEmpty);
    }
}
