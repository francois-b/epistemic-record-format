//! `ERF-51` (the fold) and `ERF-52` (the quote check).
//!
//! Every step here belongs to a standard the spec names, and each is run by the
//! library that implements that standard rather than re-derived:
//!   * CommonMark 0.31.2  -> `pulldown-cmark` (CommonMark-only options)
//!   * UAX #15 (NFC)      -> `unicode-normalization`
//!   * UCD `Default_Ignorable_Code_Point`, `White_Space` -> ICU4X `icu_properties`
//!   * UAX #29 word boundaries -> `unicode-segmentation`

use icu_properties::CodePointSetData;
use icu_properties::props::{DefaultIgnorableCodePoint, WhiteSpace};
use pulldown_cmark::{Event, Options, Parser, Tag, TagEnd};
use unicode_normalization::UnicodeNormalization;
use unicode_segmentation::UnicodeSegmentation;

/// U+2029 PARAGRAPH SEPARATOR: `ERF-51` step 1's block separator.
pub const PS: char = '\u{2029}';

/// How `ERF-51` step 3 is read. See `ambiguities.md`, A-1.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum FoldMode {
    /// Step 3 collapses runs of `White_Space` **other than** U+2029, and a run
    /// touching a U+2029 collapses to the separator alone. The block boundary
    /// step 1 inserts survives into the output, which is what `ERF-52`'s
    /// "no span crosses a paragraph separator" needs in order to mean anything.
    SeparatorPreserving,
    /// Step 3 read to the letter: U+2029 carries `White_Space=Yes`, so a run
    /// containing one collapses to a single space like any other run, and the
    /// separator step 1 inserted is gone by the end of step 3.
    Literal,
}

impl Default for FoldMode {
    fn default() -> Self {
        FoldMode::SeparatorPreserving
    }
}

fn is_default_ignorable(c: char) -> bool {
    CodePointSetData::new::<DefaultIgnorableCodePoint>().contains(c)
}
fn is_white_space(c: char) -> bool {
    CodePointSetData::new::<WhiteSpace>().contains(c)
}

/// `ERF-51` step 1. "Render the text as CommonMark to its plain text: the
/// literal content of every text and code node, a link's text, an image's
/// description, nothing for raw HTML, a soft or hard line break as one space;
/// each leaf block (a paragraph, a heading, a list item's content, a code
/// block) separated from the next by U+2029 PARAGRAPH SEPARATOR."
pub fn commonmark_plain(src: &str) -> String {
    let opts = Options::empty(); // CommonMark 0.31.2, no extensions.
    let parser = Parser::new_ext(src, opts);
    let mut blocks: Vec<String> = Vec::new();
    let mut cur = String::new();
    fn flush(cur: &mut String, blocks: &mut Vec<String>) {
        if !cur.is_empty() {
            blocks.push(std::mem::take(cur));
        }
    }
    for ev in parser {
        match ev {
            Event::Text(t) => cur.push_str(&t),
            Event::Code(t) => cur.push_str(&t), // a code node's literal content
            Event::SoftBreak | Event::HardBreak => cur.push(' '),
            Event::Html(_) | Event::InlineHtml(_) => {} // nothing for raw HTML
            Event::FootnoteReference(_) | Event::TaskListMarker(_) => {}
            Event::Rule => {} // a thematic break has no text
            Event::InlineMath(t) | Event::DisplayMath(t) => cur.push_str(&t),
            // Entering or leaving a block closes whatever leaf block was open.
            // A tight list item holds inline content with no Paragraph of its
            // own, which is why the requirement names "a list item's content"
            // among the leaf blocks; a nested list inside one must not fuse
            // with its parent's text.
            Event::Start(Tag::CodeBlock(_))
            | Event::Start(Tag::List(_))
            | Event::Start(Tag::Item)
            | Event::Start(Tag::BlockQuote(_))
            | Event::Start(Tag::HtmlBlock) => flush(&mut cur, &mut blocks),
            Event::End(TagEnd::Paragraph)
            | Event::End(TagEnd::Heading(_))
            | Event::End(TagEnd::CodeBlock)
            | Event::End(TagEnd::HtmlBlock)
            | Event::End(TagEnd::Item) => flush(&mut cur, &mut blocks),
            _ => {}
        }
    }
    flush(&mut cur, &mut blocks);
    blocks.join(&PS.to_string())
}

/// `ERF-51` step 2: Unicode NFC (UAX #15), then remove every code point
/// carrying `Default_Ignorable_Code_Point`.
pub fn nfc_and_strip_ignorables(s: &str) -> String {
    s.nfc().filter(|c| !is_default_ignorable(*c)).collect()
}

/// `ERF-51` step 3: collapse each run of Unicode `White_Space` to a single
/// space, and trim. See `FoldMode` for the one reading this tool had to make.
pub fn collapse_ws(s: &str, mode: FoldMode) -> String {
    let mut out = String::with_capacity(s.len());
    let mut run: Option<bool> = None; // Some(saw_ps)
    for c in s.chars() {
        if is_white_space(c) {
            let saw = run.unwrap_or(false) || (mode == FoldMode::SeparatorPreserving && c == PS);
            run = Some(saw);
        } else {
            if let Some(saw_ps) = run.take() {
                if !out.is_empty() {
                    out.push(if saw_ps { PS } else { ' ' });
                }
            }
            out.push(c);
        }
    }
    // A trailing run is dropped: step 3 trims.
    out
}

/// The whole of `ERF-51`, "applied identically to the quote and to the
/// normalized text, so that two conforming tools reach the same verdict on the
/// same pair". Case is never folded.
pub fn fold(src: &str, mode: FoldMode) -> String {
    collapse_ws(&nfc_and_strip_ignorables(&commonmark_plain(src)), mode)
}

/// Steps 1 and 3 only, used by the `ERF-6` copying check: it asks whether step
/// 2 (NFC and ignorable removal) was *needed* to make the quote match, which is
/// the trace a retyped quote leaves and a copied one does not.
pub fn fold_without_step2(src: &str, mode: FoldMode) -> String {
    collapse_ws(&commonmark_plain(src), mode)
}

// ---------------------------------------------------------------------------
// ERF-52
// ---------------------------------------------------------------------------

/// The one exact omission marker. "Only the exact marker `[...]` MUST be
/// treated as an omission, and it is the only wildcard."
pub const ELISION: &str = "[...]";

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum QuoteVerdict {
    /// Every non-empty span occurred, in order, without overlap, on word
    /// boundaries. Carries the byte ranges the spans matched.
    Occurs(Vec<(usize, usize)>),
    /// The quote's spans are all empty. "A quote whose spans are all empty MUST
    /// fail rather than trivially pass."
    AllSpansEmpty,
    /// A span never occurs at all, on a boundary or otherwise.
    SpanAbsent { index: usize, span: String },
    /// Every span occurs somewhere, but not in order / without overlap / on
    /// boundaries simultaneously.
    NoConsistentPlacement { index: usize, span: String },
}

impl QuoteVerdict {
    pub fn ok(&self) -> bool {
        matches!(self, QuoteVerdict::Occurs(_))
    }
}

/// Split the quote on the exact marker **before** normalization, "because
/// normalization would otherwise fold the marker", then fold each span
/// independently.
pub fn spans_of(quote: &str, mode: FoldMode) -> Vec<String> {
    quote.split(ELISION).map(|s| fold(s, mode)).collect()
}

/// The same split, with step 2 held back on both sides. Used only by the
/// `ERF-6` copying check.
pub fn spans_of_without_step2(quote: &str, mode: FoldMode) -> Vec<String> {
    quote
        .split(ELISION)
        .map(|s| fold_without_step2(s, mode))
        .collect()
}

/// The word-boundary set of `text` under UAX #29's default rules, with
/// `ERF-52`'s one stated departure: "a hyphen (`-`, U+2010, U+2011) between two
/// letters or digits does not break a word".
pub fn word_boundaries(text: &str) -> Vec<bool> {
    let n = text.len();
    let mut b = vec![false; n + 1];
    for (i, w) in text.split_word_bound_indices() {
        b[i] = true;
        b[i + w.len()] = true;
    }
    b[0] = true;
    b[n] = true;
    // The departure. A hyphen flanked by letters or digits joins the two sides
    // into one word, so the boundaries UAX #29 puts on either side of it go.
    let bytes: Vec<(usize, char)> = text.char_indices().collect();
    for k in 0..bytes.len() {
        let (i, c) = bytes[k];
        if c != '-' && c != '\u{2010}' && c != '\u{2011}' {
            continue;
        }
        if k == 0 || k + 1 >= bytes.len() {
            continue;
        }
        let prev = bytes[k - 1].1;
        let next = bytes[k + 1].1;
        if prev.is_alphanumeric() && next.is_alphanumeric() {
            b[i] = false;
            b[i + c.len_utf8()] = false;
        }
    }
    b
}

/// All byte offsets at which `needle` occurs in `haystack`.
fn occurrences(haystack: &str, needle: &str) -> Vec<usize> {
    if needle.is_empty() {
        return Vec::new();
    }
    let mut out = Vec::new();
    let mut from = 0usize;
    while let Some(p) = haystack[from..].find(needle) {
        let at = from + p;
        out.push(at);
        from = at + 1;
        if from > haystack.len() {
            break;
        }
    }
    out
}

/// `ERF-52` in full, over an already-folded `text`.
pub fn quote_check(quote: &str, text: &str, mode: FoldMode) -> QuoteVerdict {
    quote_check_inner(quote, text, mode, true)
}

/// `ERF-52` run with step 2 of `ERF-51` held back on both the quote and the
/// text. This is not a conformance check: it is the `ERF-6` question, "did the
/// author copy this or retype it?", asked mechanically. A quote taken from the
/// normalized text by copying matches the source's own code points; one that
/// only matches after NFC and ignorable-removal came from somewhere else.
pub fn quote_check_without_step2(quote: &str, text_step13: &str, mode: FoldMode) -> QuoteVerdict {
    quote_check_inner(quote, text_step13, mode, false)
}

fn quote_check_inner(quote: &str, text: &str, mode: FoldMode, step2: bool) -> QuoteVerdict {
    let spans: Vec<String> = if step2 {
        spans_of(quote, mode)
    } else {
        spans_of_without_step2(quote, mode)
    };
    let non_empty: Vec<(usize, String)> = spans
        .iter()
        .enumerate()
        .filter(|(_, s)| !s.is_empty())
        .map(|(i, s)| (i, s.clone()))
        .collect();
    if non_empty.is_empty() {
        return QuoteVerdict::AllSpansEmpty;
    }

    let bounds = word_boundaries(text);
    // Candidate placements per span: every occurrence whose start and end fall
    // on a word boundary of the normalized text.
    let mut cands: Vec<Vec<(usize, usize)>> = Vec::new();
    for (idx, s) in &non_empty {
        let raw = occurrences(text, s);
        if raw.is_empty() {
            return QuoteVerdict::SpanAbsent {
                index: *idx,
                span: s.clone(),
            };
        }
        let ok: Vec<(usize, usize)> = raw
            .into_iter()
            .map(|a| (a, a + s.len()))
            .filter(|(a, b)| bounds[*a] && bounds[*b])
            .collect();
        if ok.is_empty() {
            return QuoteVerdict::SpanAbsent {
                index: *idx,
                span: s.clone(),
            };
        }
        cands.push(ok);
    }

    // "in order, without overlap": a placement is a strictly increasing,
    // non-overlapping selection. Searched, not taken greedily, because the
    // leftmost choice for one span can strand a later one.
    fn search(
        cands: &[Vec<(usize, usize)>],
        k: usize,
        min: usize,
        out: &mut Vec<(usize, usize)>,
        deepest: &mut usize,
    ) -> bool {
        if k == cands.len() {
            return true;
        }
        if k > *deepest {
            *deepest = k;
        }
        for &(a, b) in &cands[k] {
            if a < min {
                continue;
            }
            out.push((a, b));
            if search(cands, k + 1, b, out, deepest) {
                return true;
            }
            out.pop();
        }
        false
    }

    let mut placed: Vec<(usize, usize)> = Vec::new();
    let mut deepest = 0usize;
    match search(&cands, 0, 0, &mut placed, &mut deepest) {
        true => {
            // `ERF-52`: "No span crosses a paragraph separator (`ERF-51`)
            // unless the quote holds the same break." Asserted rather than
            // enforced: spans are matched as literal substrings, so a matched
            // region containing a separator means the span contained one too.
            // Under `FoldMode::Literal` there are no separators left to cross.
            for ((_, s), (a, b)) in non_empty.iter().zip(placed.iter()) {
                debug_assert_eq!(text[*a..*b].contains(PS), s.contains(PS));
            }
            QuoteVerdict::Occurs(placed)
        }
        false => {
            let (idx, s) = &non_empty[deepest];
            QuoteVerdict::NoConsistentPlacement {
                index: *idx,
                span: s.clone(),
            }
        }
    }
}

/// Bracketed near-markers that are not the one exact marker: `[…]`, `[ ... ]`,
/// `[....]`, `(...)`. `ERF-52` says only `[...]` is an omission, so each of
/// these is a literal that will be checked as one; a person should look.
pub fn near_markers(quote: &str) -> Vec<String> {
    let mut out = Vec::new();
    for p in ["[…]", "[ ... ]", "[..]", "[....]", "(...)", "[. . .]", "[…]", "[ … ]"] {
        if quote.contains(p) && !out.iter().any(|q: &String| q == p) {
            out.push(p.to_string());
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    const M: FoldMode = FoldMode::SeparatorPreserving;

    #[test]
    fn a_soft_break_becomes_one_space_and_blocks_get_a_separator() {
        let t = fold("one\ntwo\n\nthree\n", M);
        assert_eq!(t, format!("one two{PS}three"));
    }

    #[test]
    fn raw_html_contributes_nothing_and_a_link_gives_its_text() {
        assert_eq!(fold("<!-- secret -->\n\nvisible\n", M), "visible");
        assert_eq!(fold("see [the docs](http://x/y)\n", M), "see the docs");
        assert_eq!(fold("![a red car](car.png)\n", M), "a red car");
    }

    #[test]
    fn ignorables_go_and_nfc_composes() {
        // soft hyphen, ZWSP, BOM
        assert_eq!(fold("re\u{00AD}sult\u{200B}s\u{FEFF}\n", M), "results");
        // e + combining acute == precomposed e-acute
        assert_eq!(fold("cafe\u{0301}\n", M), fold("café\n", M));
    }

    #[test]
    fn case_is_never_folded() {
        assert_ne!(fold("All entries\n", M), fold("all entries\n", M));
    }

    #[test]
    fn the_hyphen_departure_is_the_spec_example() {
        let text = fold("the plan was non-binding, and management did not recommend it\n", M);
        let v = quote_check("binding, and management did not recommend", &text, M);
        assert!(!v.ok(), "a word fragment must not occur: {v:?}");
        let v2 = quote_check("non-binding, and management did not recommend", &text, M);
        assert!(v2.ok(), "the whole word must occur: {v2:?}");
    }

    #[test]
    fn uax29_reads_a_decimal_as_one_word() {
        let text = fold("Revenue fell 12.5 percent\n", M);
        assert!(!quote_check("Revenue fell 12", &text, M).ok());
        assert!(quote_check("Revenue fell 12.5", &text, M).ok());
    }

    #[test]
    fn a_span_may_not_cross_a_block_boundary() {
        let text = fold("first paragraph ends here\n\nsecond starts\n", M);
        assert!(!quote_check("ends here second starts", &text, M).ok());
    }

    #[test]
    fn spans_run_in_order_and_do_not_overlap() {
        let text = fold("alpha beta gamma\n", M);
        assert!(quote_check("alpha [...] gamma", &text, M).ok());
        assert!(!quote_check("gamma [...] alpha", &text, M).ok());
        assert!(!quote_check("alpha beta [...] beta gamma", &text, M).ok());
    }

    #[test]
    fn an_all_empty_quote_fails() {
        let text = fold("anything\n", M);
        assert_eq!(quote_check("[...]", &text, M), QuoteVerdict::AllSpansEmpty);
    }

    #[test]
    fn backtracking_finds_a_placement_a_greedy_pass_would_miss() {
        let text = fold("aa bb aa cc\n", M);
        // "aa" first matches at 0; "aa cc" then only fits at the second "aa".
        assert!(quote_check("aa [...] aa cc", &text, M).ok());
    }
}
