//! ERF-51 (the fold) and ERF-52 (the span check).
//!
//! ERF-51 is quoted in full in README.md. Every departure or reading is in
//! ambiguities.md; the two that matter are marked HERE in the code.

use unicode_general_category::{get_general_category, GeneralCategory as GC};
use unicode_normalization::UnicodeNormalization;

pub const PARA: char = '\u{2029}';

/// "A word character is a letter, digit or combining mark (Unicode `L`, `N`, `M`)."
pub fn is_word(c: char) -> bool {
    matches!(
        get_general_category(c),
        GC::UppercaseLetter
            | GC::LowercaseLetter
            | GC::TitlecaseLetter
            | GC::ModifierLetter
            | GC::OtherLetter
            | GC::DecimalNumber
            | GC::LetterNumber
            | GC::OtherNumber
            | GC::NonspacingMark
            | GC::SpacingMark
            | GC::EnclosingMark
    )
}

fn is_digit(c: char) -> bool {
    matches!(
        get_general_category(c),
        GC::DecimalNumber | GC::LetterNumber | GC::OtherNumber
    )
}

fn is_letter(c: char) -> bool {
    matches!(
        get_general_category(c),
        GC::UppercaseLetter
            | GC::LowercaseLetter
            | GC::TitlecaseLetter
            | GC::ModifierLetter
            | GC::OtherLetter
    )
}

fn is_format(c: char) -> bool {
    get_general_category(c) == GC::Format
}

fn is_ws(c: char) -> bool {
    // Rust's char::is_whitespace is exactly the Unicode White_Space property.
    c.is_whitespace()
}

fn is_marker(c: char) -> bool {
    c == '*' || c == '_' || c == '`'
}

/// One pass of ERF-51 step 2, decided against the string as it entered the pass.
fn markers_once(input: &[char]) -> (Vec<char>, bool) {
    let mut out = Vec::with_capacity(input.len());
    let mut changed = false;
    for (i, &c) in input.iter().enumerate() {
        if is_marker(c) {
            let left = i
                .checked_sub(1)
                .map(|j| is_word(input[j]))
                .unwrap_or(false);
            let right = input.get(i + 1).copied().map(is_word).unwrap_or(false);
            // "Remove a marker that has a word character on exactly one side;
            //  keep one that has word characters on both sides or on neither."
            if left != right {
                changed = true;
                continue;
            }
        }
        out.push(c);
    }
    (out, changed)
}

/// ERF-51, the whole ordered sequence.
pub fn fold(s: &str) -> String {
    // 1. NFC, then remove every format character (Cf).
    let step1: Vec<char> = s.nfc().filter(|c| !is_format(*c)).collect();

    // 2. The marker rule.
    //    HERE (ambiguity 1): run to a fixed point rather than once. A single pass
    //    leaves `**bold**` as `*bold*`, which no quote written in prose can match,
    //    and the requirement's stated purpose is that "the normalized text is
    //    markdown and the quote is the prose inside it".
    let mut cur = step1;
    let cap = cur.len() + 2;
    for _ in 0..cap {
        let (next, changed) = markers_once(&cur);
        cur = next;
        if !changed {
            break;
        }
    }

    // 3. Collapse each whitespace run to a single space, except a run holding a
    //    blank line, which collapses to U+2029; then trim.
    let mut out: Vec<char> = Vec::with_capacity(cur.len());
    let mut i = 0usize;
    while i < cur.len() {
        let c = cur[i];
        if !is_ws(c) {
            out.push(c);
            i += 1;
            continue;
        }
        let start = i;
        while i < cur.len() && is_ws(cur[i]) {
            i += 1;
        }
        let run = &cur[start..i];
        // A blank line is two line terminators with nothing but horizontal space
        // between them. CR LF counts once. U+2028/U+2029 in the run force it.
        let mut breaks = 0usize;
        let mut j = 0usize;
        while j < run.len() {
            match run[j] {
                '\r' => {
                    breaks += 1;
                    if run.get(j + 1) == Some(&'\n') {
                        j += 1;
                    }
                }
                '\n' | '\u{0085}' | '\u{2028}' => breaks += 1,
                '\u{2029}' => breaks += 2,
                _ => {}
            }
            j += 1;
        }
        out.push(if breaks >= 2 { PARA } else { ' ' });
    }
    // trim
    while matches!(out.first(), Some(&c) if is_ws(c) || c == PARA) {
        out.remove(0);
    }
    while matches!(out.last(), Some(&c) if is_ws(c) || c == PARA) {
        out.pop();
    }
    out.into_iter().collect()
}

/// "A character is **word-internal** when it joins two word characters: `.`,
///  `,`, `:` or `/` between digits (`12.5`, `1,000`), an apostrophe between
///  letters (`board's`), a hyphen between word characters (`non-binding`)."
///
/// HERE (ambiguity): `'` is spelled with a typewriter apostrophe in the
/// requirement. U+2019 is accepted too; see ambiguities.md.
fn is_word_internal(c: char, before: Option<char>, after: Option<char>) -> bool {
    let (b, a) = match (before, after) {
        (Some(b), Some(a)) => (b, a),
        _ => return false,
    };
    match c {
        '.' | ',' | ':' | '/' => is_digit(b) && is_digit(a),
        '\'' | '\u{2019}' => is_letter(b) && is_letter(a),
        '-' => is_word(b) && is_word(a),
        _ => false,
    }
}

#[derive(Debug)]
pub enum QuoteVerdict {
    Ok,
    Fail(String),
}

/// ERF-52. `quote` is the raw field value; `text` is the *unfolded* normalized
/// text (folded here, once, by the caller for reuse).
pub fn check_quote_folded(quote: &str, text_folded: &[char]) -> QuoteVerdict {
    // "The quote MUST be split on `[...]` BEFORE normalization" — the marker is
    // the exact five characters, and it is the only wildcard (ERF-52).
    let raw_spans: Vec<&str> = quote.split("[...]").collect();
    let folded: Vec<Vec<char>> = raw_spans
        .iter()
        .map(|s| fold(s).chars().collect::<Vec<char>>())
        .collect();
    let spans: Vec<&Vec<char>> = folded.iter().filter(|s| !s.is_empty()).collect();

    if spans.is_empty() {
        // "A quote whose spans are all empty MUST fail rather than trivially pass."
        return QuoteVerdict::Fail("every span of the quote is empty after the fold".into());
    }

    match search(&spans, 0, 0, text_folded) {
        Some(_) => QuoteVerdict::Ok,
        None => {
            // Report the first span that cannot be placed at all, which is the
            // useful diagnostic even when the failure is really an ordering one.
            for (i, s) in spans.iter().enumerate() {
                if occurrences(s, text_folded, 0).is_empty() {
                    return QuoteVerdict::Fail(format!(
                        "span {} of {} does not occur in the normalized text as whole words: {:?}",
                        i + 1,
                        spans.len(),
                        truncate(&s.iter().collect::<String>(), 90)
                    ));
                }
            }
            QuoteVerdict::Fail(
                "the spans occur but not in order without overlap in the normalized text".into(),
            )
        }
    }
}

fn truncate(s: &str, n: usize) -> String {
    if s.chars().count() <= n {
        s.to_string()
    } else {
        let t: String = s.chars().take(n).collect();
        format!("{}…", t)
    }
}

/// Backtracking placement: "in order, without overlap". The requirement does not
/// state a matching strategy; leftmost-greedy can fail where an ordering exists,
/// so this searches. See ambiguities.md.
fn search(spans: &[&Vec<char>], idx: usize, from: usize, text: &[char]) -> Option<usize> {
    if idx == spans.len() {
        return Some(from);
    }
    for pos in occurrences(spans[idx], text, from) {
        let end = pos + spans[idx].len();
        if let Some(r) = search(spans, idx + 1, end, text) {
            return Some(r);
        }
    }
    None
}

/// Every position >= `from` where `span` occurs in `text` as whole words.
fn occurrences(span: &[char], text: &[char], from: usize) -> Vec<usize> {
    let mut out = Vec::new();
    if span.is_empty() || span.len() > text.len() {
        return out;
    }
    let last = text.len() - span.len();
    let mut p = from;
    while p <= last {
        if text[p..p + span.len()] == span[..] && whole_words(span, text, p) {
            out.push(p);
        }
        p += 1;
    }
    out
}

/// "where a span begins or ends with a word character, the character beside it
///  in the text MUST NOT be a word character or a word-internal one."
fn whole_words(span: &[char], text: &[char], p: usize) -> bool {
    let n = span.len();
    if is_word(span[0]) && p > 0 {
        let prev = text[p - 1];
        if is_word(prev) {
            return false;
        }
        let before = if p >= 2 { Some(text[p - 2]) } else { None };
        if is_word_internal(prev, before, Some(span[0])) {
            return false;
        }
    }
    if is_word(span[n - 1]) && p + n < text.len() {
        let next = text[p + n];
        if is_word(next) {
            return false;
        }
        let after = text.get(p + n + 1).copied();
        if is_word_internal(next, Some(span[n - 1]), after) {
            return false;
        }
    }
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    fn f(s: &str) -> String {
        fold(s)
    }

    #[test]
    fn format_characters_go() {
        assert_eq!(f("soft\u{00ad}hyphen"), "softhyphen");
        assert_eq!(f("zero\u{200b}width"), "zerowidth");
    }

    #[test]
    fn nfc_composes() {
        assert_eq!(f("e\u{0301}"), "\u{e9}");
    }

    #[test]
    fn markers() {
        assert_eq!(f("MAX_LEN"), "MAX_LEN");
        assert_eq!(f("3*4"), "3*4");
        assert_eq!(f("a * b"), "a * b");
        assert_eq!(f("_italic_"), "italic");
        assert_eq!(f("**bold**"), "bold");
        assert_eq!(f("`code`"), "code");
    }

    #[test]
    fn whitespace_and_paragraphs() {
        assert_eq!(f("a   b"), "a b");
        assert_eq!(f("a\nb"), "a b");
        assert_eq!(f("a\n\nb"), "a\u{2029}b");
        assert_eq!(f("  a  "), "a");
    }

    #[test]
    fn whole_word_examples_from_erf_52() {
        let text: Vec<char> = fold("Revenue fell 12.5 percent").chars().collect();
        assert!(matches!(
            check_quote_folded("Revenue fell 12", &text),
            QuoteVerdict::Fail(_)
        ));
        assert!(matches!(
            check_quote_folded("Revenue fell 12.5", &text),
            QuoteVerdict::Ok
        ));

        let text2: Vec<char> = fold("the plan was non-binding, and management did not recommend it")
            .chars()
            .collect();
        assert!(matches!(
            check_quote_folded("binding, and management did not recommend", &text2),
            QuoteVerdict::Fail(_)
        ));
        assert!(matches!(
            check_quote_folded("non-binding, and management did not recommend", &text2),
            QuoteVerdict::Ok
        ));
    }

    #[test]
    fn elision_marker() {
        let text: Vec<char> = fold("alpha beta gamma delta epsilon").chars().collect();
        assert!(matches!(
            check_quote_folded("alpha [...] epsilon", &text),
            QuoteVerdict::Ok
        ));
        // out of order
        assert!(matches!(
            check_quote_folded("epsilon [...] alpha", &text),
            QuoteVerdict::Fail(_)
        ));
        // a bare ellipsis is a literal source character
        assert!(matches!(
            check_quote_folded("alpha ... epsilon", &text),
            QuoteVerdict::Fail(_)
        ));
    }

    #[test]
    fn empty_spans_fail() {
        let text: Vec<char> = fold("anything at all").chars().collect();
        assert!(matches!(
            check_quote_folded("[...]", &text),
            QuoteVerdict::Fail(_)
        ));
        assert!(matches!(
            check_quote_folded("[...][...]", &text),
            QuoteVerdict::Fail(_)
        ));
    }

    #[test]
    fn no_span_crosses_a_paragraph_boundary() {
        let text: Vec<char> = fold("end of one.\n\nStart of two.").chars().collect();
        assert!(matches!(
            check_quote_folded("end of one. Start of two.", &text),
            QuoteVerdict::Fail(_)
        ));
        assert!(matches!(
            check_quote_folded("end of one.\n\nStart of two.", &text),
            QuoteVerdict::Ok
        ));
    }

    #[test]
    fn case_is_not_folded() {
        let text: Vec<char> = fold("The Ledger").chars().collect();
        assert!(matches!(
            check_quote_folded("the ledger", &text),
            QuoteVerdict::Fail(_)
        ));
    }

    #[test]
    fn backtracking_finds_an_ordering() {
        // "bb" occurs twice; the leftmost occurrence blocks "cc", the second does not.
        let text: Vec<char> = fold("bb xx bb cc").chars().collect();
        assert!(matches!(
            check_quote_folded("bb [...] cc", &text),
            QuoteVerdict::Ok
        ));
    }
}
