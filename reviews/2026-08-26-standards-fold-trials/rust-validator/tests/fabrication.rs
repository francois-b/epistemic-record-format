//! Fabrication attempts against the quote check.
//!
//! Each test below is an attempt to get a green verdict for a quotation the
//! source never said. The ones that fail the check are the check working. The
//! ones that PASS are recorded here just as loudly, because a validator that
//! quietly greenlights a meaning-inverting quotation is worse than one that
//! says nothing: these are the attacks `ERF-51` and `ERF-52` do not stop, and
//! they are the reason `ERF-11`'s judgment half exists.

use erfval::norm::{self, FoldMode};

const M: FoldMode = FoldMode::SeparatorPreserving;

/// The source text every fabrication below is checked against.
const SOURCE: &str = "\
# Committee findings, March 2026

The plan was non-binding, and management did not recommend it.

Revenue fell 12.5 percent in the year to March, the second consecutive
decline.

The committee said it does not believe the tool is reliable.

Members reviewed the board's minutes and the plan\u{2019}s appendix.

See the [full disclosure](https://example.org/secret-terms) for terms.

<!-- internal: the vote was 4 to 3 -->
";

fn passes(quote: &str) -> bool {
    let text = norm::fold(SOURCE, M);
    norm::quote_check(quote, &text, M).ok()
}

// ---------------------------------------------------------------------------
// Fabrications the check STOPS.
// ---------------------------------------------------------------------------

#[test]
fn f01_splice_across_a_paragraph_boundary_fails() {
    // Two true sentences from different paragraphs, joined into one breath.
    assert!(!passes(
        "management did not recommend it. Revenue fell 12.5 percent"
    ));
}

#[test]
fn f02_splice_from_a_heading_into_the_prose_fails() {
    assert!(!passes("Committee findings, March 2026 The plan was non-binding"));
}

#[test]
fn f03_word_fragment_inverts_the_meaning_and_fails() {
    // "non-binding" cut down to "binding" reverses what the committee said.
    assert!(!passes("binding, and management did not recommend it."));
}

#[test]
fn f04_number_truncation_fails() {
    // "fell 12.5 percent" trimmed to "fell 12" understates the decline; UAX #29
    // reads `12.5` as one word, so the cut cannot land on a boundary.
    assert!(!passes("Revenue fell 12"));
    assert!(!passes("Revenue fell 12.5 percen"));
}

#[test]
fn f05_case_change_fails() {
    assert!(!passes("the plan was non-binding, and management did not recommend it."));
}

#[test]
fn f06_apostrophe_swap_fails() {
    // The source carries U+2019; an ASCII apostrophe is a different quotation,
    // and NFC does not equate them.
    assert!(passes("the board's minutes"));
    assert!(!passes("the plan's appendix"));
    assert!(passes("the plan\u{2019}s appendix"));
}

#[test]
fn f07_reordering_two_true_spans_fails() {
    assert!(!passes("Revenue fell 12.5 percent [...] The plan was non-binding"));
}

#[test]
fn f08_reusing_one_occurrence_for_two_spans_fails() {
    assert!(!passes("does not believe [...] does not believe"));
}

#[test]
fn f09_an_elision_marker_alone_fails() {
    assert!(!passes("[...]"));
    assert!(!passes("[...][...]"));
}

#[test]
fn f10_a_near_marker_is_not_a_wildcard() {
    // `[…]` and `[ ... ]` are literal text, not omissions, so the quote they
    // sit in has to occur with them in it. It does not.
    assert!(!passes("The plan was non-binding […] the tool is reliable."));
    assert!(!passes("The plan was non-binding [ ... ] the tool is reliable."));
    assert!(!norm::near_markers("a […] b").is_empty());
}

#[test]
fn f11_link_target_is_not_quotable_text() {
    assert!(passes("full disclosure"));
    assert!(!passes("https://example.org/secret-terms"));
}

#[test]
fn f12_html_comment_content_is_not_quotable() {
    // Raw HTML contributes nothing to the fold, so what is hidden in a comment
    // cannot be quoted as if the source had said it.
    assert!(!passes("the vote was 4 to 3"));
}

#[test]
fn f13_inserting_a_word_fails() {
    assert!(!passes("management did not strongly recommend it."));
}

#[test]
fn f14_dropping_a_negation_without_a_marker_fails() {
    assert!(!passes("The committee said it does believe the tool is reliable."));
}

// ---------------------------------------------------------------------------
// Fabrications the check LETS THROUGH. Recorded, not hidden.
// ---------------------------------------------------------------------------

#[test]
fn g01_an_elision_can_invert_the_meaning_and_still_pass() {
    // The source says the committee does NOT believe the tool is reliable.
    // With one legal elision marker, the quotation says it does. The check
    // passes it, correctly by its own rules: "The text between two spans is
    // unbounded by design: an elision marker is the author's assertion that
    // they removed material, and whether the removal misleads is a judgment
    // for the audit, not a distance a validator can measure."
    assert!(passes(
        "The committee said it [...] believe the tool is reliable."
    ));
}

#[test]
fn g02_an_elision_can_join_two_paragraphs_into_one_sentence() {
    // Nothing in ERF-52 bounds an elision's reach, so a marker crosses a
    // paragraph, a heading, or the whole document.
    assert!(passes("The plan was non-binding [...] the tool is reliable."));
    assert!(passes("Committee findings [...] the tool is reliable."));
}

#[test]
fn g03_emphasis_and_markup_are_invisible_to_the_quote() {
    // A source that stressed a word loses the stress in the fold, so a
    // quotation that flattens the emphasis passes. Legitimate, and worth
    // knowing: the quote is of the rendered text, not of the file.
    let src = "The tool is *never* reliable.\n";
    let t = norm::fold(src, M);
    assert!(norm::quote_check("The tool is never reliable.", &t, M).ok());
}

#[test]
fn g04_invisible_characters_in_the_quote_are_forgiven() {
    // Deliberately: a soft hyphen or a zero-width space is an extractor's
    // artifact, not an author's choice.
    assert!(passes("The plan was non\u{00AD}-bind\u{200B}ing,"));
}

#[test]
fn g05_a_decomposed_accent_is_forgiven() {
    let src = "The café closed.\n";
    let t = norm::fold(src, M);
    assert!(norm::quote_check("The cafe\u{0301} closed.", &t, M).ok());
}

#[test]
fn g06_line_wrapping_differences_are_forgiven() {
    assert!(passes(
        "Revenue fell 12.5 percent in the year to March, the second consecutive decline."
    ));
}

// ---------------------------------------------------------------------------
// The reading of ERF-51 step 3 that this tool did not take.
// ---------------------------------------------------------------------------

#[test]
fn h01_the_literal_reading_of_step_three_lets_the_splice_through() {
    // Under FoldMode::Literal, U+2029 carries White_Space=Yes and is collapsed
    // to a space by step 3, so the block boundary step 1 inserted is gone and
    // f01's splice passes. This is why the tool preserves the separator.
    let t = norm::fold(SOURCE, FoldMode::Literal);
    assert!(
        norm::quote_check(
            "management did not recommend it. Revenue fell 12.5 percent",
            &t,
            FoldMode::Literal
        )
        .ok(),
        "the literal reading of step 3 was expected to admit this splice"
    );
}
