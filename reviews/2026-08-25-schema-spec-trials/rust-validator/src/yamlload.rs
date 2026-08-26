//! YAML frontmatter loading under the binding's rules.
//!
//! ERF-65: "Frontmatter MUST parse under YAML 1.2 using the **JSON schema** [...]
//! Under it only `null`, the literals `true` and `false`, and JSON's own number
//! grammar resolve to non-string scalars; everything else stays a string."
//!
//! No off-the-shelf loader offers that resolution (the binding's own section 6
//! records that two cold implementations found their parsers could not select
//! it), so the tree is built here from yaml-rust2's event stream. That is also
//! the only level at which ERF-66's four prohibitions (duplicate key, anchor,
//! alias, explicit tag) are observable at all: a loaded tree has already lost
//! them.

use serde_json::{Map, Value};
use yaml_rust2::parser::{Event, Parser, Tag};
use yaml_rust2::scanner::TScalarStyle;

#[derive(Debug, Clone)]
pub struct YamlDiag {
    pub req: &'static str,
    /// JSON-pointer-ish path to the offending node, "" at the document root.
    pub path: String,
    pub line: usize,
    pub detail: String,
    /// true => a MUST, reported as a violation; false => a SHOULD or an
    /// observation whose severity is decided elsewhere.
    pub violation: bool,
}

pub struct Loaded {
    pub value: Value,
    pub diags: Vec<YamlDiag>,
    /// Paths whose scalar arrived as a non-string because YAML resolution said
    /// so (ERF-65). The model's string-typed verdict comes from schema.rs.
    #[allow(dead_code)]
    pub non_string_paths: Vec<(String, usize)>,
}

/// JSON's own number grammar (RFC 8259 section 6).
pub fn is_json_number(s: &str) -> bool {
    let b = s.as_bytes();
    let mut i = 0usize;
    if i < b.len() && b[i] == b'-' {
        i += 1;
    }
    if i >= b.len() {
        return false;
    }
    if b[i] == b'0' {
        i += 1;
    } else if b[i].is_ascii_digit() {
        while i < b.len() && b[i].is_ascii_digit() {
            i += 1;
        }
    } else {
        return false;
    }
    if i < b.len() && b[i] == b'.' {
        i += 1;
        if i >= b.len() || !b[i].is_ascii_digit() {
            return false;
        }
        while i < b.len() && b[i].is_ascii_digit() {
            i += 1;
        }
    }
    if i < b.len() && (b[i] == b'e' || b[i] == b'E') {
        i += 1;
        if i < b.len() && (b[i] == b'+' || b[i] == b'-') {
            i += 1;
        }
        if i >= b.len() || !b[i].is_ascii_digit() {
            return false;
        }
        while i < b.len() && b[i].is_ascii_digit() {
            i += 1;
        }
    }
    i == b.len()
}

/// Resolution under YAML 1.2's JSON schema, as ERF-65 pins it.
fn resolve_plain(s: &str) -> Value {
    if s.is_empty() {
        return Value::Null; // "An empty scalar resolves to `null`." (ERF-65)
    }
    match s {
        "null" => Value::Null,
        "true" => Value::Bool(true),
        "false" => Value::Bool(false),
        _ if is_json_number(s) => {
            serde_json::from_str::<Value>(s).unwrap_or_else(|_| Value::String(s.to_string()))
        }
        _ => Value::String(s.to_string()),
    }
}

fn looks_like_date(s: &str) -> bool {
    let b = s.as_bytes();
    b.len() >= 10
        && b[0..4].iter().all(u8::is_ascii_digit)
        && b[4] == b'-'
        && b[5..7].iter().all(u8::is_ascii_digit)
        && b[7] == b'-'
        && b[8..10].iter().all(u8::is_ascii_digit)
}

/// Spellings a legacy YAML 1.1 reader retypes although this schema does not.
/// ERF-65: "a producer SHOULD quote as well, since most readers a file meets
/// are legacy ones."
fn legacy_hazard(s: &str) -> Option<&'static str> {
    if s.is_empty() {
        return None;
    }
    let l = s.to_ascii_lowercase();
    const BOOLS: [&str; 10] = [
        "y", "n", "yes", "no", "on", "off", "true", "false", "~", "null",
    ];
    if BOOLS.contains(&l.as_str()) {
        return Some("a YAML 1.1 reader resolves it to a boolean or to null");
    }
    if matches!(l.as_str(), ".inf" | "-.inf" | "+.inf" | ".nan") {
        return Some("a YAML 1.1 reader resolves it to a float");
    }
    let b = s.as_bytes();
    if b.len() > 1 && b[0] == b'0' && b[1..].iter().all(u8::is_ascii_digit) {
        return Some("a YAML 1.1 reader reads a leading zero as octal");
    }
    if l.starts_with("0x") || l.starts_with("0o") || l.starts_with("0b") {
        return Some("a YAML 1.1 reader reads it as a based integer");
    }
    if s.contains(':')
        && s.split(':')
            .all(|p| !p.is_empty() && p.bytes().all(|c| c.is_ascii_digit()))
    {
        return Some("a YAML 1.1 reader reads it as sexagesimal");
    }
    if s.contains('_') && s.bytes().all(|c| c.is_ascii_digit() || c == b'_') {
        return Some("a YAML 1.1 reader strips the underscores and reads an integer");
    }
    if s.matches('.').count() >= 2 && s.bytes().all(|c| c.is_ascii_digit() || c == b'.') {
        return Some("the binding names a dotted version (`0.9.0`) in this list by example");
    }
    if looks_like_date(s) {
        return Some("a YAML 1.1 reader resolves a timestamp to a date object");
    }
    None
}

enum Frame {
    Seq {
        items: Vec<Value>,
        path: String,
    },
    Map {
        map: Map<String, Value>,
        key: Option<String>,
        path: String,
        /// keys already seen, for ERF-66's duplicate-key prohibition
        seen: Vec<String>,
    },
}

impl Frame {
    fn child_path(&self) -> String {
        match self {
            Frame::Seq { items, path } => format!("{}/{}", path, items.len()),
            Frame::Map { key, path, .. } => match key {
                Some(k) => format!("{}/{}", path, k),
                None => format!("{}/<key>", path),
            },
        }
    }
}

struct Builder {
    diags: Vec<YamlDiag>,
    non_string: Vec<(String, usize)>,
    stack: Vec<Frame>,
    root: Option<Value>,
    docs: usize,
}

impl Builder {
    fn diag(&mut self, req: &'static str, path: &str, line: usize, detail: String, violation: bool) {
        self.diags.push(YamlDiag {
            req,
            path: path.to_string(),
            line,
            detail,
            violation,
        });
    }

    fn child_path(&self) -> String {
        match self.stack.last() {
            Some(f) => f.child_path(),
            None => String::new(),
        }
    }

    fn note_anchor_tag(&mut self, path: &str, line: usize, anchor: usize, tag: &Option<Tag>) {
        if anchor != 0 {
            self.diag(
                "ERF-66",
                path,
                line,
                "carries a YAML anchor; the binding declines anchors".into(),
                true,
            );
        }
        if let Some(t) = tag {
            self.diag(
                "ERF-66",
                path,
                line,
                format!(
                    "carries an explicit YAML tag `{}{}`; the binding declines explicit tags",
                    t.handle, t.suffix
                ),
                true,
            );
        }
    }

    /// Deliver a completed node to its parent (or to the document root).
    fn emit(&mut self, v: Value, line: usize) {
        enum Act {
            Root,
            SeqPush,
            MapKey(String, String, bool),
            MapVal(String),
        }
        let act = match self.stack.last() {
            None => Act::Root,
            Some(Frame::Seq { .. }) => Act::SeqPush,
            Some(Frame::Map {
                key, path, seen, ..
            }) => match key {
                None => {
                    // This node is a key. Only string keys are meaningful here.
                    let k = match &v {
                        Value::String(s) => s.clone(),
                        other => other.to_string(),
                    };
                    let dup = seen.contains(&k);
                    Act::MapKey(k, path.clone(), dup)
                }
                Some(k) => Act::MapVal(k.clone()),
            },
        };
        match act {
            Act::Root => {
                if self.root.is_none() {
                    self.root = Some(v);
                }
            }
            Act::SeqPush => {
                if let Some(Frame::Seq { items, .. }) = self.stack.last_mut() {
                    items.push(v);
                }
            }
            Act::MapKey(k, path, dup) => {
                if dup {
                    let p = format!("{}/{}", path, k);
                    self.diag(
                        "ERF-66",
                        &p,
                        line,
                        format!("duplicate key `{}` in the same mapping", k),
                        true,
                    );
                }
                if let Some(Frame::Map { key, seen, .. }) = self.stack.last_mut() {
                    if !seen.contains(&k) {
                        seen.push(k.clone());
                    }
                    *key = Some(k);
                }
            }
            Act::MapVal(k) => {
                if let Some(Frame::Map { map, key, .. }) = self.stack.last_mut() {
                    map.insert(k, v);
                    *key = None;
                }
            }
        }
    }
}

/// Parse one YAML stream into a JSON value under ERF-65's resolution,
/// collecting ERF-65 and ERF-66 diagnostics on the way.
pub fn load(text: &str) -> Result<Loaded, String> {
    let mut parser = Parser::new_from_str(text);
    let mut b = Builder {
        diags: Vec::new(),
        non_string: Vec::new(),
        stack: Vec::new(),
        root: None,
        docs: 0,
    };

    loop {
        let (ev, mark) = parser.next_token().map_err(|e| e.to_string())?;
        let line = mark.line();
        match ev {
            Event::StreamStart | Event::Nothing => {}
            Event::StreamEnd => break,
            Event::DocumentStart => {
                b.docs += 1;
                if b.docs > 1 {
                    b.diag(
                        "ERF-53",
                        "",
                        line,
                        "the file holds more than one YAML document; the binding gives \
                         one record per file"
                            .into(),
                        true,
                    );
                }
            }
            Event::DocumentEnd => {}
            Event::Alias(_) => {
                let p = b.child_path();
                b.diag(
                    "ERF-66",
                    &p,
                    line,
                    "a YAML alias; the binding declines aliases".into(),
                    true,
                );
                b.emit(Value::Null, line);
            }
            Event::Scalar(s, style, anchor, tag) => {
                let p = b.child_path();
                b.note_anchor_tag(&p, line, anchor, &tag);
                let v = if style == TScalarStyle::Plain && tag.is_none() {
                    let r = resolve_plain(&s);
                    if !r.is_string() {
                        b.non_string.push((p.clone(), line));
                    }
                    if let Some(why) = legacy_hazard(&s) {
                        b.diag(
                            "ERF-65",
                            &p,
                            line,
                            format!("plain scalar `{}` SHOULD be quoted: {}", s, why),
                            false,
                        );
                    }
                    r
                } else {
                    Value::String(s)
                };
                b.emit(v, line);
            }
            Event::SequenceStart(anchor, tag) => {
                let p = b.child_path();
                b.note_anchor_tag(&p, line, anchor, &tag);
                b.stack.push(Frame::Seq {
                    items: Vec::new(),
                    path: p,
                });
            }
            Event::SequenceEnd => {
                if let Some(Frame::Seq { items, .. }) = b.stack.pop() {
                    b.emit(Value::Array(items), line);
                }
            }
            Event::MappingStart(anchor, tag) => {
                let p = b.child_path();
                b.note_anchor_tag(&p, line, anchor, &tag);
                b.stack.push(Frame::Map {
                    map: Map::new(),
                    key: None,
                    path: p,
                    seen: Vec::new(),
                });
            }
            Event::MappingEnd => {
                if let Some(Frame::Map { map, .. }) = b.stack.pop() {
                    b.emit(Value::Object(map), line);
                }
            }
        }
    }

    Ok(Loaded {
        value: b.root.unwrap_or(Value::Null),
        diags: b.diags,
        non_string_paths: b.non_string,
    })
}
