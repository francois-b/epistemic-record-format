//! Narrative bindings: `ERF-31` (what one is and what it must satisfy) spelled
//! by `YAMLB-1` (an HTML comment, with a grammar).
//!
//! "Recognition precedes validation. A candidate is `<!--` followed by
//! `claims:` where CommonMark would read an HTML comment, never inside a code
//! span or a code block... A candidate is delimited at the first `-->` before
//! the grammar is applied, so that a greedy `ids` cannot eat the next binding;
//! a candidate whose first `-->` comes after another `<!--`, or never, is
//! unterminated, extends to the end of its own line so the bindings after it
//! stay visible, and is reported."

use pulldown_cmark::{Event, Options, Parser, Tag, TagEnd};

#[derive(Debug, Clone)]
pub struct Candidate {
    /// Byte range of the marker in the body.
    pub start: usize,
    pub end: usize,
    pub text: String,
    pub unterminated: bool,
    pub parsed: Result<Binding, String>,
}

#[derive(Debug, Clone)]
pub struct Binding {
    pub ids: Vec<String>,
    /// The anchor with `\"` and `\\` decoded: "The escapes are decoded before
    /// the anchor is folded (`ERF-31`)."
    pub anchor: String,
    pub bound_at: String,
}

/// Byte ranges CommonMark would read as a code span or a code block; a `<!--`
/// inside one is not a candidate.
fn code_ranges(body: &str) -> Vec<(usize, usize)> {
    let mut out = Vec::new();
    let p = Parser::new_ext(body, Options::empty()).into_offset_iter();
    let mut block: Option<usize> = None;
    for (ev, r) in p {
        match ev {
            Event::Code(_) => out.push((r.start, r.end)),
            Event::Start(Tag::CodeBlock(_)) => block = Some(r.start),
            Event::End(TagEnd::CodeBlock) => {
                if let Some(s) = block.take() {
                    out.push((s, r.end));
                }
            }
            _ => {}
        }
    }
    out
}

fn in_ranges(rs: &[(usize, usize)], p: usize) -> bool {
    rs.iter().any(|(a, b)| p >= *a && p < *b)
}

fn is_ws(c: char) -> bool {
    // `ws ::= any Unicode White_Space character, line breaks included`
    icu_properties::CodePointSetData::new::<icu_properties::props::WhiteSpace>().contains(c)
}

pub fn candidates(body: &str) -> Vec<Candidate> {
    let codes = code_ranges(body);
    let mut out = Vec::new();
    let mut from = 0usize;
    while let Some(rel) = body[from..].find("<!--") {
        let p = from + rel;
        from = p + 4;
        if in_ranges(&codes, p) {
            continue;
        }
        // `<!--` ws* `claims:`
        let after = &body[p + 4..];
        let skipped: usize = after
            .chars()
            .take_while(|c| is_ws(*c))
            .map(|c| c.len_utf8())
            .sum();
        if !after[skipped..].starts_with("claims:") {
            continue;
        }
        let close = body[p + 4..].find("-->").map(|i| p + 4 + i);
        let next_open = body[p + 4..].find("<!--").map(|i| p + 4 + i);
        let unterminated = match (close, next_open) {
            (None, _) => true,
            (Some(c), Some(n)) => n < c,
            (Some(_), None) => false,
        };
        let (start, end) = if unterminated {
            let eol = body[p..].find('\n').map(|i| p + i).unwrap_or(body.len());
            (p, eol)
        } else {
            (p, close.unwrap() + 3)
        };
        let text = body[start..end].to_string();
        let parsed = if unterminated {
            Err("unterminated: no `-->` before the next `<!--` or before the end of the body".into())
        } else {
            parse_marker(&text)
        };
        out.push(Candidate {
            start,
            end,
            text,
            unterminated,
            parsed,
        });
        from = end;
    }
    out
}

/// `YAMLB-1`'s grammar, applied to an already-delimited candidate.
///
/// ```text
/// narrative-binding ::= "<!--" ws* "claims:" ws+ ids ws+ anchor
///                       ws+ "bound-at=" date ws* "-->"
/// ```
pub fn parse_marker(text: &str) -> Result<Binding, String> {
    let inner = text
        .strip_prefix("<!--")
        .ok_or("does not open with `<!--`")?
        .strip_suffix("-->")
        .ok_or("does not close with `-->`")?;
    let cs: Vec<char> = inner.chars().collect();
    let mut i = 0usize;
    let skip_ws = |cs: &Vec<char>, i: &mut usize| -> usize {
        let start = *i;
        while *i < cs.len() && is_ws(cs[*i]) {
            *i += 1;
        }
        *i - start
    };
    skip_ws(&cs, &mut i);
    let kw: String = cs[i..].iter().take(7).collect();
    if kw != "claims:" {
        return Err("no `claims:` keyword".into());
    }
    i += 7;
    if skip_ws(&cs, &mut i) == 0 {
        return Err("no whitespace after `claims:`".into());
    }

    // ids ::= id (ws+ id)* ; an id may not hold '"', '<' or '>', so the anchor's
    // opening quote is what ends the list. No commas: the binding says so.
    let mut ids: Vec<String> = Vec::new();
    loop {
        if i >= cs.len() {
            return Err("ends after the ids: no anchor".into());
        }
        if cs[i] == '"' {
            break;
        }
        let mut id = String::new();
        while i < cs.len() && !is_ws(cs[i]) && cs[i] != '"' {
            if cs[i] == '<' || cs[i] == '>' {
                return Err(format!("id contains `{}`, which an id may not hold", cs[i]));
            }
            id.push(cs[i]);
            i += 1;
        }
        if id.is_empty() {
            return Err("empty id".into());
        }
        if id.contains(',') {
            return Err(format!(
                "id `{id}` holds a comma; ids are separated by whitespace and never by commas"
            ));
        }
        ids.push(id);
        if skip_ws(&cs, &mut i) == 0 && i < cs.len() && cs[i] != '"' {
            return Err("ids run together".into());
        }
    }
    if ids.is_empty() {
        return Err("no claim ids".into());
    }

    // anchor ::= '"' char+ '"' with the two escapes.
    i += 1; // opening quote
    let mut anchor = String::new();
    let mut closed = false;
    while i < cs.len() {
        match cs[i] {
            '"' => {
                i += 1;
                closed = true;
                break;
            }
            '\\' => {
                i += 1;
                match cs.get(i) {
                    Some('"') => anchor.push('"'),
                    Some('\\') => anchor.push('\\'),
                    other => {
                        return Err(format!(
                            "anchor holds `\\{}`; the only escapes are `\\\"` and `\\\\`",
                            other.map(|c| c.to_string()).unwrap_or_default()
                        ));
                    }
                }
                i += 1;
            }
            c => {
                anchor.push(c);
                i += 1;
            }
        }
    }
    if !closed {
        return Err("anchor is not closed".into());
    }
    if anchor.is_empty() {
        return Err("anchor is empty; the grammar requires `char+`".into());
    }

    if skip_ws(&cs, &mut i) == 0 {
        return Err("no whitespace after the anchor".into());
    }
    let rest: String = cs[i..].iter().collect();
    let date = rest
        .strip_prefix("bound-at=")
        .ok_or("no `bound-at=`; every part is required")?;
    let date = date.trim_end_matches(|c: char| is_ws(c));
    if date.trim_end_matches(|c: char| is_ws(c)) != date || date.chars().any(is_ws) {
        return Err("whitespace inside `bound-at=`".into());
    }
    let ok = date.len() == 10
        && date.as_bytes().iter().enumerate().all(|(k, c)| {
            if k == 4 || k == 7 { *c == b'-' } else { c.is_ascii_digit() }
        });
    if !ok {
        return Err(format!("`bound-at={date}` is not YYYY-MM-DD"));
    }
    Ok(Binding {
        ids,
        anchor,
        bound_at: date.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_binding_documents_own_example_parses() {
        let b = parse_marker(
            "<!-- claims: no-continuous-claim-check \"no test that runs on claims\" bound-at=2026-08-23 -->",
        )
        .unwrap();
        assert_eq!(b.ids, vec!["no-continuous-claim-check"]);
        assert_eq!(b.anchor, "no test that runs on claims");
        assert_eq!(b.bound_at, "2026-08-23");
    }

    #[test]
    fn commas_between_ids_are_refused() {
        assert!(parse_marker("<!-- claims: a, b \"x\" bound-at=2026-08-23 -->").is_err());
    }

    #[test]
    fn every_part_is_required() {
        assert!(parse_marker("<!-- claims: a \"x\" -->").is_err());
        assert!(parse_marker("<!-- claims: \"x\" bound-at=2026-08-23 -->").is_err());
        assert!(parse_marker("<!-- claims: a bound-at=2026-08-23 -->").is_err());
        assert!(parse_marker("<!-- claims: a \"\" bound-at=2026-08-23 -->").is_err());
    }

    #[test]
    fn the_anchor_carries_two_escapes() {
        let b = parse_marker("<!-- claims: a \"he said \\\"no\\\"\" bound-at=2026-08-23 -->").unwrap();
        assert_eq!(b.anchor, "he said \"no\"");
    }

    #[test]
    fn a_code_span_swallows_no_candidate() {
        let body = "Mention `<!-- claims: x \"y\" bound-at=2026-08-23 -->` inline.\n\nReal.\n<!-- claims: real \"Real\" bound-at=2026-08-23 -->\n";
        let c = candidates(body);
        assert_eq!(c.len(), 1);
        assert_eq!(c[0].parsed.as_ref().unwrap().ids, vec!["real"]);
    }

    #[test]
    fn an_unterminated_candidate_stops_at_its_own_line() {
        let body = "A\n<!-- claims: a \"A\" bound-at=2026-08-23\nB\n<!-- claims: b \"B\" bound-at=2026-08-23 -->\n";
        let c = candidates(body);
        assert_eq!(c.len(), 2);
        assert!(c[0].unterminated);
        assert!(!c[1].unterminated);
        assert_eq!(c[1].parsed.as_ref().unwrap().ids, vec!["b"]);
    }
}
