//! Discovery and loading. "Discovery is by content and never by path: every
//! file carries `type` (`ERF-54`)." So the walk takes every regular file under
//! the root, tries to read a YAML document out of it, and dispatches on what it
//! finds; nothing here reads meaning out of a directory name.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde_json::Value;
use walkdir::WalkDir;

use crate::model::RecordType;
use crate::report::{Kind, Layer, Report};
use crate::yamlload::{self, YamlDiag};

pub struct FileDoc {
    pub rel: String,
    #[allow(dead_code)]
    pub abs: PathBuf,
    /// The frontmatter, loaded under `ERF-65`'s schema.
    pub front: Value,
    /// The markdown body, which the model attaches as `body` where a file has
    /// one (section 3). Empty string when the file is frontmatter alone.
    pub body: String,
    /// True when the file was written as `---` frontmatter plus a body, rather
    /// than as a bare YAML document.
    pub had_fences: bool,
    pub raw_type: Option<String>,
    pub rtype: Option<RecordType>,
    pub yaml_diags: Vec<YamlDiag>,
    #[allow(dead_code)]
    pub non_string_scalars: Vec<(String, &'static str)>,
    /// The model instance: frontmatter with `body` attached where the model
    /// says the file has one.
    pub instance: Value,
}

impl FileDoc {
    pub fn id(&self) -> Option<&str> {
        self.front.get("id").and_then(|v| v.as_str())
    }
    pub fn corpus(&self) -> Option<&str> {
        self.front.get("corpus").and_then(|v| v.as_str())
    }
    pub fn str_field(&self, k: &str) -> Option<&str> {
        self.front.get(k).and_then(|v| v.as_str())
    }
    pub fn arr(&self, k: &str) -> Option<&Vec<Value>> {
        self.front.get(k).and_then(|v| v.as_array())
    }
}

pub struct Loaded {
    #[allow(dead_code)]
    pub root: PathBuf,
    pub docs: Vec<FileDoc>,
    /// Files with no `type`: not part of the corpus (`ERF-54`), reported as
    /// ignored rather than dropped in silence (`ERF-57`).
    pub ignored: Vec<(String, String)>,
}

fn rel_of(root: &Path, p: &Path) -> String {
    p.strip_prefix(root)
        .unwrap_or(p)
        .to_string_lossy()
        .replace('\\', "/")
}

/// Split `---` frontmatter from a markdown body. Content-based, not
/// extension-based: a file that opens with a `---` line is frontmatter plus
/// body, anything else is a bare YAML document with no body.
fn split_frontmatter(text: &str) -> (String, String, bool) {
    let t = text.strip_prefix('\u{FEFF}').unwrap_or(text);
    if !(t.starts_with("---\n") || t.starts_with("---\r\n") || t == "---" || t.starts_with("---\r")) {
        return (t.to_string(), String::new(), false);
    }
    let after = match t.find('\n') {
        Some(i) => &t[i + 1..],
        None => "",
    };
    let mut off = 0usize;
    for line in after.split_inclusive('\n') {
        let trimmed = line.trim_end_matches(['\n', '\r']);
        if trimmed == "---" || trimmed == "..." {
            let front = &after[..off];
            let body = &after[off + line.len()..];
            return (front.to_string(), body.to_string(), true);
        }
        off += line.len();
    }
    // No closing fence: the whole remainder is frontmatter and there is no body.
    (after.to_string(), String::new(), true)
}

pub fn load(root: &Path, rep: &mut Report) -> Loaded {
    let mut docs = Vec::new();
    let mut ignored = Vec::new();

    let mut paths: Vec<PathBuf> = WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .map(|e| e.into_path())
        .filter(|p| {
            !p.components()
                .any(|c| c.as_os_str().to_string_lossy().starts_with('.'))
        })
        .collect();
    paths.sort();

    for p in paths {
        let rel = rel_of(root, &p);
        let bytes = match std::fs::read(&p) {
            Ok(b) => b,
            Err(e) => {
                ignored.push((rel.clone(), format!("unreadable: {e}")));
                continue;
            }
        };
        // ERF-67: UTF-8, LF line endings, no byte-order mark.
        let text = match String::from_utf8(bytes.clone()) {
            Ok(t) => t,
            Err(_) => {
                ignored.push((rel.clone(), "not UTF-8; cannot carry a `type`".into()));
                rep.push(
                    Kind::Violation,
                    Layer::Binding,
                    "ERF-67",
                    &rel,
                    "file is not valid UTF-8",
                );
                continue;
            }
        };
        let looks_structured = text.trim_start().starts_with("---")
            || text.contains("\ntype:")
            || text.starts_with("type:");
        if bytes.starts_with(&[0xEF, 0xBB, 0xBF]) && looks_structured {
            rep.push(
                Kind::Violation,
                Layer::Binding,
                "ERF-67",
                &rel,
                "file carries a byte-order mark",
            );
        }
        if text.contains("\r\n") && looks_structured {
            rep.push(
                Kind::Violation,
                Layer::Binding,
                "ERF-67",
                &rel,
                "file uses CRLF line endings; the binding requires LF",
            );
        }

        let (front_text, body, had_fences) = split_frontmatter(&text);
        let loaded = match yamlload::load(&front_text) {
            Ok(l) => l,
            Err(e) => {
                if looks_structured {
                    rep.push(
                        Kind::Violation,
                        Layer::Binding,
                        "ERF-65",
                        &rel,
                        format!("frontmatter does not parse as YAML: {e}"),
                    );
                } else {
                    ignored.push((rel.clone(), "does not parse as YAML".into()));
                }
                continue;
            }
        };
        let raw_type = loaded
            .value
            .get("type")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let type_present = loaded.value.get("type").is_some();
        if !type_present {
            ignored.push((rel.clone(), "carries no `type`".into()));
            continue;
        }
        let rtype = raw_type.as_deref().and_then(RecordType::parse);

        let mut instance = loaded.value.clone();
        if let Some(rt) = rtype {
            if rt.has_body() {
                if let Value::Object(ref mut m) = instance {
                    m.insert("body".into(), Value::String(body.clone()));
                }
            }
        }

        docs.push(FileDoc {
            rel,
            abs: p,
            front: loaded.value,
            body,
            had_fences,
            raw_type,
            rtype,
            yaml_diags: loaded.diags,
            non_string_scalars: loaded.non_string_scalars,
            instance,
        });
    }

    Loaded {
        root: root.to_path_buf(),
        docs,
        ignored,
    }
}

/// An index of every record id in the loaded set, and every source id.
pub struct Index {
    pub records: BTreeMap<String, Vec<(RecordType, String)>>,
    pub sources: BTreeMap<String, (String, Value)>,
    #[allow(dead_code)]
    pub decl_ids: Vec<String>,
}

pub fn index(l: &Loaded) -> Index {
    let mut records: BTreeMap<String, Vec<(RecordType, String)>> = BTreeMap::new();
    let mut sources: BTreeMap<String, (String, Value)> = BTreeMap::new();
    let mut decl_ids = Vec::new();
    for d in &l.docs {
        match d.rtype {
            Some(rt) if rt.is_record() => {
                if let Some(id) = d.id() {
                    records
                        .entry(id.to_string())
                        .or_default()
                        .push((rt, d.rel.clone()));
                }
            }
            Some(RecordType::CorpusDeclaration) => {
                if let Some(id) = d.id() {
                    decl_ids.push(id.to_string());
                }
            }
            Some(RecordType::SourceList) => {
                if let Some(Value::Object(m)) = d.front.get("sources") {
                    for (k, v) in m {
                        sources
                            .entry(k.clone())
                            .or_insert_with(|| (d.rel.clone(), v.clone()));
                    }
                }
            }
            _ => {}
        }
    }
    Index {
        records,
        sources,
        decl_ids,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn frontmatter_splits_at_the_closing_fence() {
        let (f, b, fenced) = split_frontmatter("---\nid: x\n---\nbody text\n");
        assert_eq!(f, "id: x\n");
        assert_eq!(b, "body text\n");
        assert!(fenced);
    }

    #[test]
    fn a_bare_yaml_document_has_no_body() {
        let (f, b, fenced) = split_frontmatter("type: sources\nsources: {}\n");
        assert!(f.starts_with("type: sources"));
        assert_eq!(b, "");
        assert!(!fenced);
    }
}
