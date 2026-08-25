//! ERF-31 to ERF-34: narratives and their narrative bindings.
//!
//! The grammar is given in ERF-31 and is implemented literally, including the rule that
//! ids are separated by whitespace and never by commas.

use std::path::{Path, PathBuf};

use crate::finding::Report;
use crate::model::Timestamp;

#[derive(Clone, Debug)]
pub struct Binding {
    pub claims: Vec<String>,
    pub anchor: String,
    /// TYPE-DECISION: the grammar brackets `bound-at` as optional while ERF-32's first
    /// sentence says a narrative binding MUST record it. `Option` keeps both readings
    /// available: absence is reported as an ERF-32 violation *and* drives the
    /// `indeterminate` staleness result the same requirement mandates.
    pub bound_at: Option<Timestamp>,
    pub line: usize,
    pub raw: String,
}

#[derive(Clone, Debug)]
pub struct Narrative {
    pub file: PathBuf,
    pub title: Option<String>,
    pub corpus: Option<String>,
    pub created: Option<String>,
    pub bindings: Vec<Binding>,
    pub text: String,
}

/// Find every HTML comment that opens with `claims:` and parse it under ERF-31's grammar.
pub fn parse_bindings(text: &str, file: &Path, rep: &mut Report) -> Vec<Binding> {
    let mut out = Vec::new();
    let bytes = text.as_bytes();
    let mut i = 0usize;
    while let Some(start) = text[i..].find("<!--") {
        let abs = i + start;
        let Some(endrel) = text[abs..].find("-->") else { break };
        let end = abs + endrel + 3;
        let inner = &text[abs + 4..abs + endrel];
        let line = bytes[..abs].iter().filter(|b| **b == b'\n').count() + 1;
        let trimmed = inner.trim_start();
        if trimmed.starts_with("claims:") {
            match parse_one(trimmed, line, &text[abs..end]) {
                Ok(b) => out.push(b),
                Err(msg) => rep.violation("ERF-31", "-", "-", file, line,
                    format!("malformed narrative binding: {msg}")),
            }
        }
        i = end;
    }
    out
}

fn parse_one(inner: &str, line: usize, raw: &str) -> Result<Binding, String> {
    let rest = inner.strip_prefix("claims:").ok_or("does not open with `claims:`")?;
    if !rest.starts_with(char::is_whitespace) {
        return Err("`claims:` must be followed by whitespace".to_string());
    }
    let mut claims: Vec<String> = Vec::new();
    let mut anchor: Option<String> = None;
    let mut bound_at_text: Option<String> = None;

    let mut chars = rest.char_indices().peekable();
    let bytes = rest.as_bytes();
    // Walk tokens, honouring the quoted anchor.
    let mut pos = 0usize;
    loop {
        while pos < bytes.len() && (bytes[pos] as char).is_ascii_whitespace() {
            pos += 1;
        }
        if pos >= bytes.len() {
            break;
        }
        if bytes[pos] == b'"' {
            // anchor
            let close = rest[pos + 1..].find('"').ok_or("anchor's closing quote is missing")?;
            if anchor.is_some() {
                return Err("more than one quoted anchor".to_string());
            }
            anchor = Some(rest[pos + 1..pos + 1 + close].to_string());
            pos = pos + 1 + close + 1;
            continue;
        }
        let start = pos;
        while pos < bytes.len() && !(bytes[pos] as char).is_ascii_whitespace() && bytes[pos] != b'"' {
            pos += 1;
        }
        let tok = &rest[start..pos];
        if let Some(d) = tok.strip_prefix("bound-at=") {
            if anchor.is_none() {
                return Err("`bound-at=` appears before the anchor; the grammar puts it after".to_string());
            }
            bound_at_text = Some(d.to_string());
            continue;
        }
        if anchor.is_some() {
            return Err(format!("unexpected token `{tok}` after the anchor"));
        }
        if tok.contains(',') {
            return Err(format!("id `{tok}` contains a comma; ids are separated by whitespace, never by commas"));
        }
        claims.push(tok.to_string());
    }
    let _ = chars.next();

    if claims.is_empty() {
        return Err("names no claim ids".to_string());
    }
    let Some(anchor) = anchor else {
        return Err("the anchor is REQUIRED: a narrative binding without one can only point at a line number".to_string());
    };
    if anchor.trim().is_empty() {
        return Err("the anchor is empty".to_string());
    }
    let bound_at = match bound_at_text {
        None => None,
        Some(t) => {
            let ts = Timestamp::parse(&t);
            match ts {
                Timestamp::Date { .. } => Some(ts),
                _ => return Err(format!("`bound-at={t}` is not a YYYY-MM-DD date")),
            }
        }
    };
    Ok(Binding { claims, anchor, bound_at, line, raw: raw.to_string() })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::finding::Report;

    fn one(s: &str) -> Result<Binding, String> {
        parse_one(s.trim_start_matches("<!--").trim().trim_end_matches("-->").trim(), 1, s)
    }

    #[test]
    fn spec_example_parses() {
        let b = one("<!-- claims: no-continuous-claim-check \"no test that runs on claims\" bound-at=2026-08-23 -->").unwrap();
        assert_eq!(b.claims, vec!["no-continuous-claim-check"]);
        assert_eq!(b.anchor, "no test that runs on claims");
        assert!(b.bound_at.is_some());
    }

    #[test]
    fn commas_are_rejected() {
        assert!(one("<!-- claims: a, b \"x\" -->").is_err());
    }

    #[test]
    fn anchor_required() {
        assert!(one("<!-- claims: a b -->").is_err());
    }

    #[test]
    fn bound_at_optional_in_grammar() {
        let b = one("<!-- claims: a b \"anchor text\" -->").unwrap();
        assert_eq!(b.claims.len(), 2);
        assert!(b.bound_at.is_none());
    }

    #[test]
    fn finds_bindings_in_prose() {
        let mut rep = Report::new();
        let text = "Some prose.\n\n<!-- claims: c1 \"Some prose\" bound-at=2026-01-02 -->\n";
        let bs = parse_bindings(text, Path::new("x.md"), &mut rep);
        assert_eq!(bs.len(), 1);
        assert_eq!(bs[0].line, 3);
    }
}
