//! YAMLB-1: the narrative binding's spelling, its recognition, and its grammar.
//!
//! narrative-binding ::= "<!--" ws* "claims:" ws+ ids ws+ anchor
//!                       ws+ "bound-at=" date ws* "-->"

#[derive(Debug)]
pub struct Binding {
    pub ids: Vec<String>,
    pub anchor: String,
    pub bound_at: String,
    /// char offset of `<!--` in the body
    pub start: usize,
    /// char offset just past `-->` in the body
    pub end: usize,
    pub line: usize,
}

#[derive(Debug)]
pub struct BadCandidate {
    pub start: usize,
    pub end: usize,
    pub line: usize,
    pub why: String,
}

#[derive(Debug, Default)]
pub struct Scan {
    pub bindings: Vec<Binding>,
    pub bad: Vec<BadCandidate>,
}

/// Character positions of the body that CommonMark would read as code: fenced
/// code blocks, indented code blocks, and inline code spans. YAMLB-1:
/// "A candidate is `<!--` followed by `claims:` where CommonMark would read an
/// HTML comment, never inside a code span or a code block".
fn code_mask(body: &[char]) -> Vec<bool> {
    let mut mask = vec![false; body.len()];
    // Split into lines, keeping offsets.
    let mut lines: Vec<(usize, usize)> = Vec::new(); // (start, end-exclusive, no newline)
    let mut s = 0usize;
    for (i, &c) in body.iter().enumerate() {
        if c == '\n' {
            lines.push((s, i));
            s = i + 1;
        }
    }
    if s <= body.len() {
        lines.push((s, body.len()));
    }

    let mut fence: Option<(char, usize)> = None; // (char, run length)
    let mut prev_blank = true;
    for &(ls, le) in &lines {
        let line: String = body[ls..le].iter().collect();
        let trimmed_start = line.len() - line.trim_start_matches(' ').len();
        let t = line.trim_start_matches(' ');
        let blank = t.trim().is_empty();

        if let Some((fc, flen)) = fence {
            // inside a fenced block: mask everything, look for the closing fence
            for m in mask.iter_mut().take(le).skip(ls) {
                *m = true;
            }
            let run = t.chars().take_while(|&c| c == fc).count();
            if trimmed_start <= 3 && run >= flen && t.chars().skip(run).all(|c| c == ' ') {
                fence = None;
            }
            prev_blank = blank;
            continue;
        }

        // opening fence?
        if trimmed_start <= 3 {
            for fc in ['`', '~'] {
                let run = t.chars().take_while(|&c| c == fc).count();
                if run >= 3 {
                    fence = Some((fc, run));
                    break;
                }
            }
            if fence.is_some() {
                for m in mask.iter_mut().take(le).skip(ls) {
                    *m = true;
                }
                prev_blank = blank;
                continue;
            }
        }

        // indented code block: >= 4 leading spaces, and not a paragraph continuation
        if trimmed_start >= 4 && prev_blank && !blank {
            for m in mask.iter_mut().take(le).skip(ls) {
                *m = true;
            }
            prev_blank = false;
            continue;
        }

        // inline code spans on this line and the ones after it (CommonMark allows
        // a code span to span lines; this scans within the whole body region
        // between blank lines, approximated per line, which is enough for the
        // hazard YAMLB-1 names).
        mask_code_spans(body, ls, le, &mut mask);
        prev_blank = blank;
    }
    mask
}

fn mask_code_spans(body: &[char], ls: usize, le: usize, mask: &mut [bool]) {
    let mut i = ls;
    while i < le {
        if body[i] == '`' {
            let mut n = 0usize;
            while i + n < le && body[i + n] == '`' {
                n += 1;
            }
            // look for a closing run of exactly n backticks
            let mut j = i + n;
            let mut closed = None;
            while j < le {
                if body[j] == '`' {
                    let mut m = 0usize;
                    while j + m < le && body[j + m] == '`' {
                        m += 1;
                    }
                    if m == n {
                        closed = Some(j + m);
                        break;
                    }
                    j += m;
                } else {
                    j += 1;
                }
            }
            if let Some(endp) = closed {
                for m in mask.iter_mut().take(endp).skip(i) {
                    *m = true;
                }
                i = endp;
                continue;
            }
            i += n;
            continue;
        }
        i += 1;
    }
}

fn line_of(body: &[char], pos: usize) -> usize {
    1 + body[..pos.min(body.len())].iter().filter(|&&c| c == '\n').count()
}

fn starts_with_at(body: &[char], pos: usize, pat: &str) -> bool {
    let p: Vec<char> = pat.chars().collect();
    pos + p.len() <= body.len() && body[pos..pos + p.len()] == p[..]
}

fn find_at(body: &[char], from: usize, pat: &str) -> Option<usize> {
    let p: Vec<char> = pat.chars().collect();
    if p.len() > body.len() {
        return None;
    }
    (from..=body.len().saturating_sub(p.len())).find(|&i| body[i..i + p.len()] == p[..])
}

pub fn scan(body_text: &str) -> Scan {
    let body: Vec<char> = body_text.chars().collect();
    let mask = code_mask(&body);
    let mut out = Scan::default();

    let mut i = 0usize;
    while i < body.len() {
        if !starts_with_at(&body, i, "<!--") || mask[i] {
            i += 1;
            continue;
        }
        // "A candidate is `<!--` followed by `claims:`" (ws* between them).
        let mut k = i + 4;
        while k < body.len() && body[k].is_whitespace() {
            k += 1;
        }
        if !starts_with_at(&body, k, "claims:") {
            // an ordinary HTML comment: skip past it
            i = find_at(&body, i + 4, "-->").map(|p| p + 3).unwrap_or(body.len());
            continue;
        }
        let line = line_of(&body, i);

        // "A candidate is delimited at the first `-->` before the grammar is
        //  applied [...] a candidate whose first `-->` comes after another
        //  `<!--`, or never, is unterminated, extends to the end of its own line".
        let close = find_at(&body, i + 4, "-->");
        let next_open = find_at(&body, i + 4, "<!--");
        let unterminated = match (close, next_open) {
            (None, _) => true,
            (Some(c), Some(o)) => o < c,
            (Some(_), None) => false,
        };
        if unterminated {
            let eol = find_at(&body, i, "\n").unwrap_or(body.len());
            out.bad.push(BadCandidate {
                start: i,
                end: eol,
                line,
                why: "unterminated: the first `-->` never comes, or comes after another `<!--`"
                    .into(),
            });
            i = eol.max(i + 1);
            continue;
        }
        let c = close.unwrap();
        let inner: Vec<char> = body[k + "claims:".len()..c].to_vec();
        match parse_inner(&inner) {
            Ok((ids, anchor, bound_at)) => out.bindings.push(Binding {
                ids,
                anchor,
                bound_at,
                start: i,
                end: c + 3,
                line,
            }),
            Err(why) => out.bad.push(BadCandidate {
                start: i,
                end: c + 3,
                line,
                why,
            }),
        }
        i = c + 3;
    }
    out
}

/// ws+ ids ws+ anchor ws+ "bound-at=" date ws*
fn parse_inner(inner: &[char]) -> Result<(Vec<String>, String, String), String> {
    let mut p = 0usize;
    let ws0 = p;
    while p < inner.len() && inner[p].is_whitespace() {
        p += 1;
    }
    if p == ws0 {
        return Err("no whitespace after `claims:`".into());
    }
    // ids: one or more tokens of characters other than whitespace, '"', '<', '>'.
    let mut ids: Vec<String> = Vec::new();
    loop {
        if p >= inner.len() {
            return Err("the candidate ends before its anchor".into());
        }
        if inner[p] == '"' {
            break;
        }
        let start = p;
        while p < inner.len()
            && !inner[p].is_whitespace()
            && inner[p] != '"'
            && inner[p] != '<'
            && inner[p] != '>'
        {
            p += 1;
        }
        if p == start {
            return Err(format!(
                "the character {:?} is legal in no part of the grammar here",
                inner[p]
            ));
        }
        ids.push(inner[start..p].iter().collect());
        let ws = p;
        while p < inner.len() && inner[p].is_whitespace() {
            p += 1;
        }
        if p == ws && p < inner.len() && inner[p] != '"' {
            return Err("ids must be separated by whitespace".into());
        }
        if p == ws && p < inner.len() && inner[p] == '"' {
            return Err("the anchor must be preceded by whitespace".into());
        }
    }
    if ids.is_empty() {
        return Err("no claim ids before the anchor".into());
    }
    if ids.iter().any(|s| s.contains(',')) {
        return Err(
            "ids are separated by whitespace and never by commas; a comma is part of no id".into(),
        );
    }
    // anchor: '"' char+ '"', with the two escapes \" and \\
    if inner.get(p) != Some(&'"') {
        return Err("no opening quote for the anchor".into());
    }
    p += 1;
    let mut anchor = String::new();
    let mut closed = false;
    while p < inner.len() {
        match inner[p] {
            '"' => {
                closed = true;
                p += 1;
                break;
            }
            '\\' => match inner.get(p + 1) {
                Some('"') => {
                    anchor.push('"');
                    p += 2;
                }
                Some('\\') => {
                    anchor.push('\\');
                    p += 2;
                }
                _ => {
                    return Err(
                        "a backslash in the anchor must open one of the two escapes, \\\" or \\\\"
                            .into(),
                    )
                }
            },
            c => {
                anchor.push(c);
                p += 1;
            }
        }
    }
    if !closed {
        return Err("the anchor is not closed".into());
    }
    if anchor.is_empty() {
        return Err("the anchor is empty; the grammar requires char+".into());
    }
    let ws = p;
    while p < inner.len() && inner[p].is_whitespace() {
        p += 1;
    }
    if p == ws {
        return Err("no whitespace between the anchor and `bound-at=`".into());
    }
    let rest: String = inner[p..].iter().collect();
    let rest_t = rest.trim_end();
    let Some(date) = rest_t.strip_prefix("bound-at=") else {
        return Err(format!(
            "expected `bound-at=` and a date, found {:?}",
            crate::util::truncate(rest_t, 40)
        ));
    };
    if date.len() != 10 || !crate::util::is_date_shape(date) {
        return Err(format!("`bound-at={}` is not YYYY-MM-DD", date));
    }
    Ok((ids, anchor, date.to_string()))
}
