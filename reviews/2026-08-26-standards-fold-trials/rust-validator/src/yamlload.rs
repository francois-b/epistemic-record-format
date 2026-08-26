//! YAML frontmatter loading at the parser's *event* level.
//!
//! `ERF-67`: "`ERF-66` cannot be checked through a YAML library's tree, since
//! duplicate keys, anchors, aliases and tags are resolved away before a tree
//! exists; a validator reads the parser's event stream." So this module never
//! asks a library for a tree. It collects the event stream, checks `ERF-66`
//! (no duplicate key, anchor, alias or explicit tag) against it, resolves plain
//! scalars under YAML 1.2's **JSON schema** as `ERF-65` requires, and builds a
//! `serde_json::Value` from what is left.

use serde_json::{Map, Value};
use yaml_rust2::parser::{Event, MarkedEventReceiver, Parser};
use yaml_rust2::scanner::{Marker, TScalarStyle};

#[derive(Debug, Clone)]
pub struct YamlDiag {
    /// `ERF-65` or `ERF-66`.
    pub req: &'static str,
    pub line: usize,
    pub msg: String,
}

#[derive(Debug)]
pub struct Loaded {
    pub value: Value,
    pub diags: Vec<YamlDiag>,
    /// Every scalar that arrived as a non-string under the JSON schema, by
    /// JSON-pointer path. `ERF-65` makes a string-typed field arriving as
    /// another type a violation, and the model is what says which are
    /// string-typed, so the decision is deferred to the schema pass.
    pub non_string_scalars: Vec<(String, &'static str)>,
}

struct Collector {
    events: Vec<(Event, Marker)>,
}

impl MarkedEventReceiver for Collector {
    fn on_event(&mut self, ev: Event, mark: Marker) {
        self.events.push((ev, mark));
    }
}

/// YAML 1.2 core JSON-schema scalar resolution, as `ERF-65` pins it: "Under it
/// only `null`, the literals `true` and `false`, and JSON's own number grammar
/// resolve to non-string scalars; everything else stays a string." Plus the
/// binding's own sentence: "An empty scalar resolves to `null`."
fn resolve_plain(s: &str) -> (Value, &'static str) {
    if s.is_empty() {
        return (Value::Null, "null");
    }
    if s == "null" {
        return (Value::Null, "null");
    }
    if s == "true" {
        return (Value::Bool(true), "boolean");
    }
    if s == "false" {
        return (Value::Bool(false), "boolean");
    }
    if is_json_number(s) {
        // Parse through serde_json so the number keeps JSON's own semantics.
        if let Ok(v) = serde_json::from_str::<Value>(s) {
            if v.is_number() {
                return (v, "number");
            }
        }
    }
    (Value::String(s.to_string()), "string")
}

/// JSON's number grammar (RFC 8259): `-? (0 | [1-9][0-9]*) (. [0-9]+)? ([eE] [-+]? [0-9]+)?`.
/// Deliberately strict: `012`, `0.9.0`, `.5`, `1.` and `+1` are not numbers and
/// therefore stay strings, which is what the binding's examples assert.
fn is_json_number(s: &str) -> bool {
    let b = s.as_bytes();
    let mut i = 0usize;
    if i < b.len() && b[i] == b'-' {
        i += 1;
    }
    let int_start = i;
    if i < b.len() && b[i] == b'0' {
        i += 1;
    } else {
        while i < b.len() && b[i].is_ascii_digit() {
            i += 1;
        }
    }
    if i == int_start {
        return false;
    }
    if i < b.len() && b[i] == b'.' {
        i += 1;
        let f = i;
        while i < b.len() && b[i].is_ascii_digit() {
            i += 1;
        }
        if i == f {
            return false;
        }
    }
    if i < b.len() && (b[i] == b'e' || b[i] == b'E') {
        i += 1;
        if i < b.len() && (b[i] == b'+' || b[i] == b'-') {
            i += 1;
        }
        let e = i;
        while i < b.len() && b[i].is_ascii_digit() {
            i += 1;
        }
        if i == e {
            return false;
        }
    }
    i == b.len()
}

pub fn load(text: &str) -> Result<Loaded, String> {
    let mut c = Collector { events: Vec::new() };
    let mut p = Parser::new_from_str(text);
    p.load(&mut c, true).map_err(|e| format!("{e}"))?;

    let mut st = State {
        ev: c.events,
        i: 0,
        diags: Vec::new(),
        non_string: Vec::new(),
    };
    st.expect(Event::StreamStart)?;
    let mut docs = 0usize;
    let mut first = Value::Null;
    loop {
        match st.peek() {
            Some(Event::DocumentStart) => {
                st.i += 1;
                let v = st.node(String::new())?;
                if docs == 0 {
                    first = v;
                }
                docs += 1;
                if matches!(st.peek(), Some(Event::DocumentEnd)) {
                    st.i += 1;
                }
            }
            Some(Event::StreamEnd) | None => break,
            other => return Err(format!("unexpected YAML event {other:?}")),
        }
    }
    if docs > 1 {
        st.diags.push(YamlDiag {
            req: "ERF-65",
            line: 0,
            msg: format!("frontmatter holds {docs} YAML documents; one record is one document"),
        });
    }
    Ok(Loaded {
        value: first,
        diags: st.diags,
        non_string_scalars: st.non_string,
    })
}

struct State {
    ev: Vec<(Event, Marker)>,
    i: usize,
    diags: Vec<YamlDiag>,
    non_string: Vec<(String, &'static str)>,
}

impl State {
    fn peek(&self) -> Option<&Event> {
        self.ev.get(self.i).map(|(e, _)| e)
    }
    fn expect(&mut self, want: Event) -> Result<(), String> {
        match self.ev.get(self.i) {
            Some((e, _)) if *e == want => {
                self.i += 1;
                Ok(())
            }
            other => Err(format!("expected {want:?}, found {other:?}")),
        }
    }

    fn note_structure(&mut self, aid: usize, tag: &Option<yaml_rust2::scanner::Tag>, mark: Marker) {
        // ERF-66: no anchor, no explicit tag.
        if aid != 0 {
            self.diags.push(YamlDiag {
                req: "ERF-66",
                line: mark.line(),
                msg: "frontmatter carries a YAML anchor".into(),
            });
        }
        if let Some(t) = tag {
            self.diags.push(YamlDiag {
                req: "ERF-66",
                line: mark.line(),
                msg: format!("frontmatter carries an explicit tag !<{}{}>", t.handle, t.suffix),
            });
        }
    }

    fn node(&mut self, path: String) -> Result<Value, String> {
        let (ev, mark) = match self.ev.get(self.i) {
            Some((e, m)) => (e.clone(), *m),
            None => return Err("unexpected end of YAML event stream".into()),
        };
        self.i += 1;
        match ev {
            Event::Scalar(s, style, aid, tag) => {
                self.note_structure(aid, &tag, mark);
                if style == TScalarStyle::Plain {
                    let (v, kind) = resolve_plain(&s);
                    if kind != "string" {
                        self.non_string.push((path, kind));
                    }
                    Ok(v)
                } else {
                    // Quoted, literal and folded scalars are strings in every schema.
                    Ok(Value::String(s))
                }
            }
            Event::Alias(_) => {
                self.diags.push(YamlDiag {
                    req: "ERF-66",
                    line: mark.line(),
                    msg: "frontmatter carries a YAML alias".into(),
                });
                Ok(Value::Null)
            }
            Event::SequenceStart(aid, tag) => {
                self.note_structure(aid, &tag, mark);
                let mut out = Vec::new();
                let mut n = 0usize;
                loop {
                    if matches!(self.peek(), Some(Event::SequenceEnd)) {
                        self.i += 1;
                        break;
                    }
                    let v = self.node(format!("{path}/{n}"))?;
                    out.push(v);
                    n += 1;
                }
                Ok(Value::Array(out))
            }
            Event::MappingStart(aid, tag) => {
                self.note_structure(aid, &tag, mark);
                let mut out = Map::new();
                let mut seen: Vec<String> = Vec::new();
                loop {
                    if matches!(self.peek(), Some(Event::MappingEnd)) {
                        self.i += 1;
                        break;
                    }
                    let kmark = self.ev.get(self.i).map(|(_, m)| *m).unwrap_or(mark);
                    let kv = self.node(format!("{path}/<key>"))?;
                    let key = match kv {
                        Value::String(s) => s,
                        Value::Bool(b) => b.to_string(),
                        Value::Null => "null".to_string(),
                        Value::Number(n) => n.to_string(),
                        _ => {
                            return Err("a non-scalar mapping key is outside this binding".into());
                        }
                    };
                    // ERF-66: no duplicate key. The tree cannot show this, so it
                    // is caught here, on the event stream.
                    if seen.contains(&key) {
                        self.diags.push(YamlDiag {
                            req: "ERF-66",
                            line: kmark.line(),
                            msg: format!("duplicate key `{key}`"),
                        });
                    }
                    seen.push(key.clone());
                    let v = self.node(format!("{path}/{key}"))?;
                    out.insert(key, v);
                }
                Ok(Value::Object(out))
            }
            other => Err(format!("unexpected YAML event {other:?}")),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn json_number_grammar_is_json_not_yaml() {
        assert!(is_json_number("0"));
        assert!(is_json_number("-1.5"));
        assert!(is_json_number("1e3"));
        assert!(is_json_number("2018"));
        assert!(!is_json_number("012"));
        assert!(!is_json_number("0.9.0"));
        assert!(!is_json_number("no"));
        assert!(!is_json_number("on"));
        assert!(!is_json_number(".5"));
        assert!(!is_json_number("1."));
        assert!(!is_json_number("0x1f"));
        assert!(!is_json_number("1_000"));
    }

    #[test]
    fn a_bare_timestamp_stays_a_string() {
        // ERF-65's named hazard: YAML 1.1's timestamp type.
        let l = load("timestamp: 2026-08-22T10:30:00Z\n").unwrap();
        assert!(l.value["timestamp"].is_string());
        assert!(l.non_string_scalars.is_empty());
    }

    #[test]
    fn a_bare_year_arrives_as_a_number() {
        let l = load("as_of_date: 2018\n").unwrap();
        assert!(l.value["as_of_date"].is_number());
        assert_eq!(l.non_string_scalars.len(), 1);
    }

    #[test]
    fn tilde_is_a_string_under_the_json_schema() {
        let l = load("reason: ~\n").unwrap();
        assert_eq!(l.value["reason"], Value::String("~".into()));
    }

    #[test]
    fn duplicate_keys_anchors_aliases_tags_are_caught() {
        let l = load("a: 1\na: 2\nb: &x hi\nc: *x\nd: !!str 5\n").unwrap();
        let msgs: Vec<&str> = l.diags.iter().map(|d| d.msg.as_str()).collect();
        assert!(msgs.iter().any(|m| m.contains("duplicate key")));
        assert!(msgs.iter().any(|m| m.contains("anchor")));
        assert!(msgs.iter().any(|m| m.contains("alias")));
        assert!(msgs.iter().any(|m| m.contains("explicit tag")));
    }
}
