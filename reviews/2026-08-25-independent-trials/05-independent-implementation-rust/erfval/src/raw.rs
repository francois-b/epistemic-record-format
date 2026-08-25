//! A raw YAML tree with source lines, built from yaml-rust2's event stream.
//!
//! Why not serde_yaml: ERF-66 forbids duplicate keys, anchors, aliases and explicit tags,
//! and ERF-65 pins the resolution schema. A deserializer that silently resolves the last
//! duplicate and expands aliases cannot report any of that. The event stream can, and it
//! also gives line numbers for every finding. The cost is decoding by hand, which is the
//! point of this trial: every optionality decision has to be written down.

use std::path::Path;
use yaml_rust2::parser::{Event, MarkedEventReceiver, Parser, Tag};
use yaml_rust2::scanner::{Marker, TScalarStyle};

use crate::finding::{Report, Severity};

#[derive(Clone, Debug, PartialEq, Eq, Copy)]
pub enum Style {
    Plain,
    SingleQuoted,
    DoubleQuoted,
    Literal,
    Folded,
}

impl From<TScalarStyle> for Style {
    fn from(s: TScalarStyle) -> Style {
        match s {
            TScalarStyle::Plain => Style::Plain,
            TScalarStyle::SingleQuoted => Style::SingleQuoted,
            TScalarStyle::DoubleQuoted => Style::DoubleQuoted,
            TScalarStyle::Literal => Style::Literal,
            TScalarStyle::Folded => Style::Folded,
        }
    }
}

#[derive(Clone, Debug)]
pub enum RawVal {
    Scalar { text: String, style: Style },
    Seq(Vec<RawNode>),
    Map(RawMap),
    /// An alias node. ERF-66 forbids these; the tree keeps a placeholder so decoding of the
    /// rest of the document can continue.
    Alias,
}

#[derive(Clone, Debug)]
pub struct RawNode {
    pub val: RawVal,
    pub line: usize,
}

#[derive(Clone, Debug, Default)]
pub struct RawMap {
    /// Insertion order is preserved and duplicates are kept, so ERF-66 can see them.
    pub entries: Vec<(String, usize, RawNode)>,
}

impl RawMap {
    pub fn get(&self, key: &str) -> Option<&RawNode> {
        self.entries.iter().find(|(k, _, _)| k == key).map(|(_, _, v)| v)
    }
    pub fn key_line(&self, key: &str) -> usize {
        self.entries
            .iter()
            .find(|(k, _, _)| k == key)
            .map(|(_, l, _)| *l)
            .unwrap_or(0)
    }
    pub fn has(&self, key: &str) -> bool {
        self.get(key).is_some()
    }
    pub fn keys(&self) -> impl Iterator<Item = (&str, usize)> {
        self.entries.iter().map(|(k, l, _)| (k.as_str(), *l))
    }
}

impl RawNode {
    pub fn as_map(&self) -> Option<&RawMap> {
        match &self.val {
            RawVal::Map(m) => Some(m),
            _ => None,
        }
    }
    pub fn as_seq(&self) -> Option<&Vec<RawNode>> {
        match &self.val {
            RawVal::Seq(s) => Some(s),
            _ => None,
        }
    }
    pub fn as_scalar(&self) -> Option<(&str, Style)> {
        match &self.val {
            RawVal::Scalar { text, style } => Some((text.as_str(), *style)),
            _ => None,
        }
    }
    pub fn kind_name(&self) -> &'static str {
        match &self.val {
            RawVal::Scalar { .. } => "scalar",
            RawVal::Seq(_) => "list",
            RawVal::Map(_) => "mapping",
            RawVal::Alias => "alias",
        }
    }
}

/// Structural facts the event stream sees and a loaded tree cannot.
#[derive(Default)]
pub struct RawIssues {
    pub anchors: Vec<usize>,
    pub aliases: Vec<usize>,
    pub tags: Vec<(usize, String)>,
    pub duplicate_keys: Vec<(String, usize)>,
    /// Plain scalars whose resolution differs between the YAML 1.2 JSON schema (ERF-65)
    /// and the broader schemas common libraries default to.
    pub schema_sensitive: Vec<(String, usize, &'static str)>,
}

struct Builder {
    stack: Vec<Frame>,
    root: Option<RawNode>,
    issues: RawIssues,
    docs: usize,
}

enum Frame {
    Seq(Vec<RawNode>, usize),
    Map(RawMap, usize, Option<(String, usize)>),
}

impl Builder {
    fn place(&mut self, node: RawNode) {
        match self.stack.last_mut() {
            None => {
                if self.root.is_none() {
                    self.root = Some(node);
                }
            }
            Some(Frame::Seq(items, _)) => items.push(node),
            Some(Frame::Map(map, _, pending)) => match pending.take() {
                None => {
                    // this node is a key; only scalar keys are legal in a record
                    let key = match &node.val {
                        RawVal::Scalar { text, .. } => text.clone(),
                        _ => "<non-scalar key>".to_string(),
                    };
                    *pending = Some((key, node.line));
                }
                Some((key, kline)) => {
                    if map.entries.iter().any(|(k, _, _)| *k == key) {
                        self.issues.duplicate_keys.push((key.clone(), kline));
                    }
                    map.entries.push((key, kline, node));
                }
            },
        }
    }
}

impl MarkedEventReceiver for Builder {
    fn on_event(&mut self, ev: Event, mark: Marker) {
        let line = mark.line();
        match ev {
            Event::DocumentStart => self.docs += 1,
            Event::Scalar(text, style, anchor, tag) => {
                if anchor != 0 {
                    self.issues.anchors.push(line);
                }
                if let Some(t) = tag {
                    self.issues.tags.push((line, format_tag(&t)));
                }
                let style: Style = style.into();
                if style == Style::Plain {
                    if let Some(why) = schema_sensitivity(&text) {
                        self.issues.schema_sensitive.push((text.clone(), line, why));
                    }
                }
                self.place(RawNode { val: RawVal::Scalar { text, style }, line });
            }
            Event::Alias(_) => {
                self.issues.aliases.push(line);
                self.place(RawNode { val: RawVal::Alias, line });
            }
            Event::SequenceStart(anchor, tag) => {
                if anchor != 0 {
                    self.issues.anchors.push(line);
                }
                if let Some(t) = tag {
                    self.issues.tags.push((line, format_tag(&t)));
                }
                self.stack.push(Frame::Seq(Vec::new(), line));
            }
            Event::SequenceEnd => {
                if let Some(Frame::Seq(items, line)) = self.stack.pop() {
                    self.place(RawNode { val: RawVal::Seq(items), line });
                }
            }
            Event::MappingStart(anchor, tag) => {
                if anchor != 0 {
                    self.issues.anchors.push(line);
                }
                if let Some(t) = tag {
                    self.issues.tags.push((line, format_tag(&t)));
                }
                self.stack.push(Frame::Map(RawMap::default(), line, None));
            }
            Event::MappingEnd => {
                if let Some(Frame::Map(map, line, _)) = self.stack.pop() {
                    self.place(RawNode { val: RawVal::Map(map), line });
                }
            }
            _ => {}
        }
    }
}

fn format_tag(t: &Tag) -> String {
    format!("{}{}", t.handle, t.suffix)
}

/// Under YAML 1.2's JSON schema only `null`, `true`, `false` and JSON's number grammar
/// resolve to non-strings (ERF-65). These plain scalars resolve to something else under
/// the Core schema or under YAML 1.1, which is where two conforming parsers disagree.
fn schema_sensitivity(text: &str) -> Option<&'static str> {
    let t = text;
    if t.is_empty() {
        return None; // an empty value is handled by the field decoders
    }
    let lower = t.to_ascii_lowercase();
    if is_json_number(t) || t == "true" || t == "false" || t == "null" {
        return None; // resolves identically everywhere
    }
    if matches!(lower.as_str(), "true" | "false" | "null") {
        return Some("resolves to a boolean/null under the YAML Core schema, to a string under the JSON schema");
    }
    if t == "~" {
        return Some("resolves to null under the YAML Core schema, to the string \"~\" under the JSON schema");
    }
    if matches!(lower.as_str(), "yes" | "no" | "on" | "off" | "y" | "n") {
        return Some("resolves to a boolean under YAML 1.1, to a string under the JSON schema");
    }
    if is_yaml11_timestamp(t) {
        return Some("YAML 1.1 resolves this to a timestamp; ERF-65 says quote it so a reader on a legacy schema still receives a string");
    }
    if is_core_number_only(t) {
        return Some("resolves to a number under the YAML Core schema, to a string under the JSON schema");
    }
    None
}

pub fn is_json_number(t: &str) -> bool {
    let b = t.as_bytes();
    let mut i = 0;
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

fn is_core_number_only(t: &str) -> bool {
    if is_json_number(t) {
        return false;
    }
    let lower = t.to_ascii_lowercase();
    if lower.starts_with("0x") || lower.starts_with("0o") {
        return true;
    }
    if matches!(lower.as_str(), ".inf" | "-.inf" | "+.inf" | ".nan") {
        return true;
    }
    // +1, .5, 1., 007
    let s = t.strip_prefix('+').unwrap_or(t);
    let s = s.strip_prefix('-').unwrap_or(s);
    if s.is_empty() {
        return false;
    }
    let mut seen_digit = false;
    let mut dots = 0;
    for c in s.chars() {
        if c.is_ascii_digit() {
            seen_digit = true;
        } else if c == '.' {
            dots += 1;
        } else if c == 'e' || c == 'E' {
            return seen_digit && t != "e";
        } else {
            return false;
        }
    }
    seen_digit && dots <= 1
}

fn is_yaml11_timestamp(t: &str) -> bool {
    let b = t.as_bytes();
    if b.len() < 8 {
        return false;
    }
    // YYYY-MM-DD prefix is enough to trip the 1.1 timestamp resolver
    let ok = b[0].is_ascii_digit()
        && b[1].is_ascii_digit()
        && b[2].is_ascii_digit()
        && b[3].is_ascii_digit()
        && b[4] == b'-'
        && b[5].is_ascii_digit()
        && b[6].is_ascii_digit()
        && b[7] == b'-';
    ok
}

pub struct ParsedYaml {
    pub root: Option<RawNode>,
    pub issues: RawIssues,
    pub documents: usize,
}

/// Parse one YAML text. Returns Err with the parser's message when it will not parse at all.
pub fn parse(text: &str) -> Result<ParsedYaml, String> {
    let mut b = Builder {
        stack: Vec::new(),
        root: None,
        issues: RawIssues::default(),
        docs: 0,
    };
    let mut p = Parser::new_from_str(text);
    match p.load(&mut b, true) {
        Ok(()) => Ok(ParsedYaml { root: b.root, issues: b.issues, documents: b.docs }),
        Err(e) => Err(format!("{e}")),
    }
}

/// Report the structural issues the event stream saw. `line_offset` shifts line numbers
/// from the YAML fragment's coordinates into the file's.
pub fn report_issues(
    rep: &mut Report,
    issues: &RawIssues,
    subject: &str,
    file: &Path,
    line_offset: usize,
) {
    for l in &issues.anchors {
        rep.violation("ERF-66", subject, "-", file, l + line_offset, "YAML anchor in frontmatter");
    }
    for l in &issues.aliases {
        rep.violation("ERF-66", subject, "-", file, l + line_offset, "YAML alias in frontmatter");
    }
    for (l, t) in &issues.tags {
        rep.violation(
            "ERF-66",
            subject,
            "-",
            file,
            l + line_offset,
            format!("explicit YAML tag `{t}` in frontmatter"),
        );
    }
    for (k, l) in &issues.duplicate_keys {
        rep.violation(
            "ERF-66",
            subject,
            k,
            file,
            l + line_offset,
            format!("duplicate key `{k}`; two conforming parsers may legally disagree about this file"),
        );
    }
    for (text, l, why) in &issues.schema_sensitive {
        rep.push(
            Severity::Notice,
            "ERF-65",
            subject,
            "-",
            file,
            l + line_offset,
            format!("unquoted scalar `{text}`: {why}"),
        );
    }
}
