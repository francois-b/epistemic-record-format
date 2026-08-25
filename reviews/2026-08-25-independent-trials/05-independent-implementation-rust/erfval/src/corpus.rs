//! Finding a deployment on disk and loading it.
//!
//! The specification says nothing about file layout beyond "one record per file" (ERF-53),
//! "a corpus travels as a directory or archive of its records and captures, and the
//! declaration travels with it" (ERF-59), and "the capture, relative to the list" (the
//! `path` comment in section 3). Everything else here is a convention this implementation
//! had to invent, and it is stated in README.md so a corpus can be arranged to suit it:
//!
//! * a corpus root is any directory holding a declaration file named `corpus.yaml`,
//!   `corpus.yml`, `corpus-declaration.yaml` or `declaration.yaml`;
//! * its source list is `sources.yaml` / `sources.yml` / `source-list.yaml` in the same
//!   directory, and capture paths resolve relative to that file;
//! * every other `*.md` file under the deployment root, minus the files named as captures,
//!   is a record if its frontmatter carries a `type`, and a narrative otherwise;
//! * the directory handed to the validator is the deployment (ERF-35, ERF-36), so it may
//!   hold one corpus or several.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

use crate::decode;
use crate::finding::Report;
use crate::model::*;
use crate::narrative::{self, Narrative};
use crate::raw::{self, RawNode, RawVal};

pub const DECL_NAMES: &[&str] = &["corpus.yaml", "corpus.yml", "corpus-declaration.yaml", "declaration.yaml"];
pub const SOURCES_NAMES: &[&str] = &["sources.yaml", "sources.yml", "source-list.yaml"];

pub struct CorpusInfo {
    pub decl: CorpusDeclaration,
    pub decl_file: PathBuf,
    pub root: PathBuf,
    pub sources: Vec<Source>,
    pub sources_file: Option<PathBuf>,
}

impl CorpusInfo {
    pub fn source(&self, key: &str) -> Option<&Source> {
        self.sources.iter().find(|s| s.key == key)
    }
}

pub struct LoadedRecord {
    pub record: Record,
    pub file: PathBuf,
    /// Line of the file where the frontmatter's first line sits (frontmatter YAML line 1).
    pub offset: usize,
}

pub struct IdSighting {
    pub id: String,
    pub file: PathBuf,
    pub line: usize,
    pub type_name: String,
}

#[derive(Default)]
pub struct Deployment {
    pub root: PathBuf,
    pub corpora: Vec<CorpusInfo>,
    pub records: Vec<LoadedRecord>,
    pub by_id: HashMap<String, usize>,
    pub id_sightings: Vec<IdSighting>,
    pub narratives: Vec<Narrative>,
}

impl Deployment {
    pub fn get(&self, id: &str) -> Option<&Record> {
        self.by_id.get(id).map(|i| &self.records[*i].record)
    }
    pub fn record_file(&self, id: &str) -> Option<&Path> {
        self.by_id.get(id).map(|i| self.records[*i].file.as_path())
    }
    pub fn corpus(&self, id: &str) -> Option<&CorpusInfo> {
        self.corpora.iter().find(|c| c.decl.id == id)
    }
    pub fn claims(&self) -> impl Iterator<Item = (&Claim, &Path)> {
        self.records.iter().filter_map(|r| match &r.record {
            Record::Claim(c) => Some((c, r.file.as_path())),
            _ => None,
        })
    }
    pub fn atoms(&self) -> impl Iterator<Item = (&Atom, &Path)> {
        self.records.iter().filter_map(|r| match &r.record {
            Record::Atom(a) => Some((a, r.file.as_path())),
            _ => None,
        })
    }
    pub fn surveys(&self) -> impl Iterator<Item = (&Survey, &Path)> {
        self.records.iter().filter_map(|r| match &r.record {
            Record::Survey(s) => Some((s, r.file.as_path())),
            _ => None,
        })
    }
}

/// A file read under ERF-67's rules: UTF-8, LF, no BOM.
pub struct TextFile {
    pub text: String,
}

pub fn read_text(path: &Path, rep: &mut Report, subject: &str) -> Option<TextFile> {
    let bytes = match std::fs::read(path) {
        Ok(b) => b,
        Err(e) => {
            rep.violation("ERF-67", subject, "-", path, 0, format!("cannot read file: {e}"));
            return None;
        }
    };
    if bytes.starts_with(&[0xEF, 0xBB, 0xBF]) {
        rep.violation("ERF-67", subject, "-", path, 1, "file begins with a UTF-8 byte-order mark; ERF-67 forbids one");
    }
    let text = match String::from_utf8(bytes) {
        Ok(t) => t,
        Err(e) => {
            rep.violation("ERF-67", subject, "-", path, 0, format!("file is not valid UTF-8: {e}"));
            return None;
        }
    };
    let text = text.strip_prefix('\u{FEFF}').map(|s| s.to_string()).unwrap_or(text);
    if text.contains("\r\n") {
        let line = text[..text.find("\r\n").unwrap()].matches('\n').count() + 1;
        rep.violation("ERF-67", subject, "-", path, line, "file uses CRLF line endings; ERF-67 requires LF");
    } else if text.contains('\r') {
        rep.violation("ERF-67", subject, "-", path, 0, "file contains a bare CR; ERF-67 requires LF line endings");
    }
    Some(TextFile { text: text.replace("\r\n", "\n") })
}

/// Split `---` frontmatter from body per ERF-53. Returns (frontmatter, body, first line of
/// frontmatter). `None` when the file has no frontmatter at all.
pub fn split_frontmatter(text: &str) -> Option<(String, String, usize)> {
    let mut lines = text.split('\n');
    let first = lines.next()?;
    if first.trim_end() != "---" {
        return None;
    }
    let rest = &text[first.len() + 1..];
    let mut idx = 0usize;
    let mut fm_end = None;
    for line in rest.split('\n') {
        if line.trim_end() == "---" || line.trim_end() == "..." {
            fm_end = Some((idx, line.len()));
            break;
        }
        idx += line.len() + 1;
    }
    let (fm_start_in_rest, close_len) = fm_end?;
    let fm = rest[..fm_start_in_rest].to_string();
    let body_start = fm_start_in_rest + close_len + 1;
    let body = if body_start <= rest.len() { rest[body_start.min(rest.len())..].to_string() } else { String::new() };
    Some((fm, body, 2))
}

fn is_hidden(entry: &walkdir::DirEntry) -> bool {
    entry
        .file_name()
        .to_str()
        .map(|s| s != "." && s.starts_with('.'))
        .unwrap_or(false)
}

pub fn load(root: &Path, rep: &mut Report) -> Deployment {
    let mut dep = Deployment { root: root.to_path_buf(), ..Default::default() };

    let mut all_files: Vec<PathBuf> = Vec::new();
    for entry in WalkDir::new(root)
        .into_iter()
        .filter_entry(|e| !is_hidden(e) && e.file_name() != "target")
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            all_files.push(entry.path().to_path_buf());
        }
    }
    all_files.sort();

    // --- declarations (ERF-59) -------------------------------------------------
    let decl_files: Vec<PathBuf> = all_files
        .iter()
        .filter(|p| p.file_name().and_then(|n| n.to_str()).map(|n| DECL_NAMES.contains(&n)).unwrap_or(false))
        .cloned()
        .collect();

    if decl_files.is_empty() {
        rep.violation("ERF-59", "-", "-", root, 0,
            format!("no corpus declaration found under this directory; expected one of {DECL_NAMES:?}"));
    }

    let mut capture_files: Vec<PathBuf> = Vec::new();

    for decl_file in &decl_files {
        let Some(tf) = read_text(decl_file, rep, "-") else { continue };
        let parsed = match raw::parse(&tf.text) {
            Ok(p) => p,
            Err(e) => {
                rep.violation("ERF-59", "-", "-", decl_file, 0, format!("declaration does not parse as YAML: {e}"));
                continue;
            }
        };
        if parsed.documents > 1 {
            rep.violation("ERF-59", "-", "-", decl_file, 0, "declaration file holds more than one YAML document");
        }
        let Some(root_node) = &parsed.root else {
            rep.violation("ERF-59", "-", "-", decl_file, 0, "declaration file is empty");
            continue;
        };
        let Some(map) = root_node.as_map() else {
            rep.violation("ERF-59", "-", "-", decl_file, 0,
                format!("declaration must be a mapping, found a {}", root_node.kind_name()));
            continue;
        };
        let mut ctx = Ctx::new(rep, "-", decl_file, 0);
        let Some(decl) = decode::decode_declaration(&mut ctx, map) else { continue };
        raw::report_issues(rep, &parsed.issues, &decl.id, decl_file, 0);

        let corpus_root = decl_file.parent().unwrap_or(root).to_path_buf();

        // --- source list (ERF-3) ------------------------------------------------
        let sources_file = SOURCES_NAMES
            .iter()
            .map(|n| corpus_root.join(n))
            .find(|p| p.is_file());
        let mut sources: Vec<Source> = Vec::new();
        if let Some(sf) = &sources_file {
            if let Some(stf) = read_text(sf, rep, &decl.id) {
                match raw::parse(&stf.text) {
                    Err(e) => rep.violation("ERF-3", &decl.id, "-", sf, 0, format!("source list does not parse as YAML: {e}")),
                    Ok(p) => {
                        raw::report_issues(rep, &p.issues, &decl.id, sf, 0);
                        if let Some(rn) = &p.root {
                            // The spec's example nests the entries under a `sources:` key;
                            // ERF-3 says only "a YAML document". Both shapes are accepted.
                            let entries: Option<&RawNode> = match rn.as_map() {
                                Some(m) if m.entries.len() == 1 && m.has("sources") => m.get("sources"),
                                Some(_) => Some(rn),
                                None => None,
                            };
                            match entries.map(|e| (&e.val, e)) {
                                Some((RawVal::Map(m), _)) => {
                                    for (key, kline, node) in &m.entries {
                                        let mut ctx = Ctx::new(rep, key, sf, 0);
                                        if let Some(mut s) = decode::decode_source(&mut ctx, key, node) {
                                            s.line = *kline;
                                            if let Some(p) = &s.path {
                                                capture_files.push(sf.parent().unwrap_or(&corpus_root).join(p));
                                            }
                                            sources.push(s);
                                        }
                                    }
                                }
                                _ => rep.violation("ERF-3", &decl.id, "-", sf, 0,
                                    "source list must be a mapping of source id to Source entry"),
                            }
                        } else {
                            rep.violation("ERF-3", &decl.id, "-", sf, 0, "source list file is empty");
                        }
                    }
                }
            }
        }

        dep.corpora.push(CorpusInfo { decl, decl_file: decl_file.clone(), root: corpus_root, sources, sources_file });
    }

    // --- records and narratives -------------------------------------------------
    for path in &all_files {
        if decl_files.contains(path) {
            continue;
        }
        if capture_files.iter().any(|c| c == path) {
            continue;
        }
        let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if SOURCES_NAMES.contains(&name) {
            continue;
        }
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if ext != "md" && ext != "markdown" {
            continue;
        }
        let Some(tf) = read_text(path, rep, "-") else { continue };
        let Some((fm, body, offset)) = split_frontmatter(&tf.text) else {
            // No frontmatter: not a record and not a narrative. It is still scanned for
            // narrative bindings, because ERF-33's report duty does not depend on the
            // carrier having frontmatter.
            let bindings = narrative::parse_bindings(&tf.text, path, rep);
            if !bindings.is_empty() {
                rep.violation("ERF-34", "-", "-", path, 1,
                    "this file carries narrative bindings but no frontmatter; a narrative carries frontmatter with title, corpus, and created");
                dep.narratives.push(Narrative { file: path.clone(), title: None, corpus: None, created: None, bindings, text: tf.text.clone() });
            }
            continue;
        };
        let parsed = match raw::parse(&fm) {
            Ok(p) => p,
            Err(e) => {
                rep.violation("ERF-65", "-", "-", path, offset, format!("frontmatter does not parse as YAML: {e}"));
                continue;
            }
        };
        let Some(root_node) = &parsed.root else {
            rep.violation("§3", "-", "-", path, offset, "frontmatter is empty");
            continue;
        };
        let Some(map) = root_node.as_map() else {
            rep.violation("§3", "-", "-", path, offset,
                format!("frontmatter must be a mapping, found a {}", root_node.kind_name()));
            continue;
        };

        let ty = map.get("type").and_then(|n| n.as_scalar()).map(|(t, _)| t.to_string());
        match ty.as_deref() {
            None => {
                // ERF-34: a narrative. It is not a record and has no interface in section 3.
                let bindings = narrative::parse_bindings(&tf.text, path, rep);
                let title = map.get("title").and_then(|n| n.as_scalar()).map(|(t, _)| t.to_string());
                let corpus = map.get("corpus").and_then(|n| n.as_scalar()).map(|(t, _)| t.to_string());
                let created = map.get("created").map(|_| ());
                raw::report_issues(rep, &parsed.issues, "-", path, offset - 1);
                dep.narratives.push(Narrative {
                    file: path.clone(),
                    title,
                    corpus,
                    created: created.map(|_| "present".to_string()),
                    bindings,
                    text: tf.text.clone(),
                });
            }
            Some(t @ ("atom" | "claim" | "survey")) => {
                let id_line = map.key_line("id");
                let id = map.get("id").and_then(|n| n.as_scalar()).map(|(s, _)| s.to_string());
                if let Some(id) = &id {
                    dep.id_sightings.push(IdSighting {
                        id: id.clone(),
                        file: path.clone(),
                        line: id_line + offset - 1,
                        type_name: t.to_string(),
                    });
                }
                let subject = id.clone().unwrap_or_else(|| "-".to_string());
                raw::report_issues(rep, &parsed.issues, &subject, path, offset - 1);
                let mut ctx = Ctx::new(rep, &subject, path, offset - 1);
                let decoded = match t {
                    "atom" => decode::decode_atom(&mut ctx, map, &body).map(Record::Atom),
                    "claim" => decode::decode_claim(&mut ctx, map, &body).map(Record::Claim),
                    _ => decode::decode_survey(&mut ctx, map, &body).map(Record::Survey),
                };
                if let Some(record) = decoded {
                    let idx = dep.records.len();
                    // A duplicate id keeps the first record in the index; ERF-38 reports
                    // the duplication separately from the id_sightings list.
                    dep.by_id.entry(record.id().to_string()).or_insert(idx);
                    dep.records.push(LoadedRecord { record, file: path.clone(), offset: offset - 1 });
                }
            }
            Some(other) => {
                // ERF-57: an unknown record type is reported and preserved, never a reason
                // to refuse the corpus.
                rep.flag("ERF-57", "-", "type", path, map.key_line("type") + offset - 1,
                    format!("unrecognized record type `{other}`; preserved as opaque data and not validated further"));
            }
        }
    }

    dep
}
