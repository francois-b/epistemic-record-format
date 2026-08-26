//! Discovery and the interchange form.
//!
//! ERF-54: "Every file a corpus holds MUST self-describe with `type`, no
//! meaning MAY live in a path [...] a consumer discovers a corpus by reading:
//! it walks what it was given and dispatches on `type`; a file without one is
//! not part of the corpus, and a consumer MUST ignore it and report that it
//! did".

use crate::model::{File, FileKind};
use crate::report::{Kind, Reporter};
use crate::yamlload;
use serde_json::Value;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

pub struct Corpus {
    pub index: usize,
    pub root: PathBuf,
    pub files: Vec<File>,
}

fn rel(root: &Path, p: &Path) -> String {
    p.strip_prefix(root)
        .unwrap_or(p)
        .to_string_lossy()
        .to_string()
}

/// Split a file into (frontmatter, body). The binding: "One record per file:
/// YAML frontmatter, then a markdown body, for every record type [...] The
/// declaration and the source list are YAML documents with no body."
pub fn split_frontmatter(text: &str) -> (&str, Option<&str>) {
    let (fm, body) = split_frontmatter_inner(text);
    (fm, body)
}

fn split_frontmatter_inner(text: &str) -> (&str, Option<&str>) {
    let t = text.strip_prefix('\u{feff}').unwrap_or(text);
    if !(t.starts_with("---\n") || t == "---" || t.starts_with("---\r\n")) {
        return (t, None);
    }
    let after = &t[4.min(t.len())..];
    let mut off = 0usize;
    for line in after.split_inclusive('\n') {
        let trimmed = line.trim_end_matches(['\n', '\r']);
        if trimmed == "---" || trimmed == "..." {
            let fm = &after[..off];
            let body_start = off + line.len();
            return (fm, Some(&after[body_start.min(after.len())..]));
        }
        off += line.len();
    }
    (after, None)
}

pub struct ScanResult {
    pub corpus: Corpus,
    /// paths named by the source list as normalized text or raw file
    #[allow(dead_code)]
    pub referenced_texts: Vec<PathBuf>,
}

pub fn scan_corpus(index: usize, root: &Path, rep: &mut Reporter) -> ScanResult {
    // Pass one: read every file, keep the ones that self-describe.
    let mut candidates: Vec<(PathBuf, Vec<u8>)> = Vec::new();
    for e in WalkDir::new(root).follow_links(false).sort_by_file_name() {
        let Ok(e) = e else { continue };
        if !e.file_type().is_file() {
            continue;
        }
        let p = e.path();
        if p.components().any(|c| {
            let s = c.as_os_str().to_string_lossy();
            s == ".git" || s == "target"
        }) {
            continue;
        }
        match std::fs::read(p) {
            Ok(b) => candidates.push((p.to_path_buf(), b)),
            Err(err) => rep.add(
                Kind::Info,
                "ERF-54",
                &rel(root, p),
                format!("unreadable, so not part of the corpus: {}", err),
            ),
        }
    }

    // First look for the source list(s), to learn which files are normalized
    // texts and raw files rather than records.
    let mut referenced: Vec<PathBuf> = Vec::new();
    for (p, bytes) in &candidates {
        let Ok(text) = std::str::from_utf8(bytes) else {
            continue;
        };
        let (fm, _) = split_frontmatter(text);
        let Ok(loaded) = yamlload::load(fm) else {
            continue;
        };
        if loaded.value.get("type").and_then(|t| t.as_str()) != Some("sources") {
            continue;
        }
        let dir = p.parent().unwrap_or(root);
        if let Some(map) = loaded.value.get("sources").and_then(|s| s.as_object()) {
            for (_k, src) in map {
                if let Some(n) = src.get("normalized").and_then(|x| x.as_str()) {
                    referenced.push(dir.join(n));
                }
                if let Some(n) = src
                    .get("received")
                    .and_then(|r| r.get("path"))
                    .and_then(|x| x.as_str())
                {
                    referenced.push(dir.join(n));
                }
            }
        }
    }
    let is_referenced = |p: &Path| referenced.iter().any(|r| paths_eq(r, p));

    // Pass two: build the corpus.
    let mut files: Vec<File> = Vec::new();
    for (p, bytes) in &candidates {
        let r = rel(root, p);
        if is_referenced(p) {
            continue; // a normalized text or a raw file, not a record
        }
        let had_bom = bytes.starts_with(&[0xEF, 0xBB, 0xBF]);
        let text = match std::str::from_utf8(bytes) {
            Ok(t) => t,
            Err(_) => {
                rep.info(
                    "ERF-54",
                    &r,
                    "not UTF-8, carries no readable `type`, so not part of the corpus",
                );
                continue;
            }
        };
        let (fm, body) = split_frontmatter(text);
        let loaded = match yamlload::load(fm) {
            Ok(l) => l,
            Err(e) => {
                // A file with frontmatter delimiters that will not parse is a
                // record-shaped file that breaks ERF-65; a file without them is
                // simply not ours.
                if text.starts_with("---") {
                    rep.violation("ERF-65", &r, format!("frontmatter does not parse: {}", e));
                } else {
                    rep.info(
                        "ERF-54",
                        &r,
                        "does not parse as YAML and carries no `type`, so not part of the corpus",
                    );
                }
                continue;
            }
        };
        let raw_type = match loaded.value.get("type") {
            Some(Value::String(s)) => s.clone(),
            Some(other) => {
                rep.violation(
                    "ERF-54",
                    &r,
                    format!("`type` is not a string: {}", other),
                );
                other.to_string()
            }
            None => {
                rep.info(
                    "ERF-54",
                    &r,
                    "carries no `type`, so it is not part of the corpus and is ignored",
                );
                continue;
            }
        };
        let kind = FileKind::parse(&raw_type);

        // ERF-67, on files the corpus actually holds.
        if had_bom {
            rep.violation("ERF-67", &r, "carries a byte-order mark");
        }
        if text.contains('\r') {
            rep.violation("ERF-67", &r, "carries CR; the binding requires LF line endings");
        }

        for d in &loaded.diags {
            let where_ = if d.path.is_empty() {
                r.clone()
            } else {
                format!("{}{}", r, d.path)
            };
            if d.violation {
                rep.violation(d.req, &where_, format!("line {}: {}", d.line, d.detail));
            } else {
                rep.flag(d.req, &where_, format!("line {}: {}", d.line, d.detail));
            }
        }

        // Attach the body where the model has one (section 3).
        let mut value = loaded.value;
        let body_owned = body.map(|b| b.to_string());
        match kind {
            Some(FileKind::Claim) | Some(FileKind::Survey) | Some(FileKind::Narrative) => {
                let b = body_owned.clone().unwrap_or_default();
                if let Some(o) = value.as_object_mut() {
                    o.insert("body".into(), Value::String(b));
                }
            }
            Some(FileKind::Atom) => {
                if body_owned.as_deref().map(|b| !b.trim().is_empty()) == Some(true) {
                    rep.violation(
                        "ERF-53",
                        &r,
                        "an atom's body is empty, so its file is frontmatter and nothing \
                         else; this one carries body text",
                    );
                }
            }
            Some(FileKind::CorpusDecl) | Some(FileKind::SourceList) => {
                if body_owned.as_deref().map(|b| !b.trim().is_empty()) == Some(true) {
                    rep.violation(
                        "ERF-53",
                        &r,
                        "the declaration and the source list are YAML documents with no body",
                    );
                }
            }
            None => {}
        }

        let body_line_offset = match body {
            Some(b) => text[..text.len() - b.len()].matches('\n').count(),
            None => 0,
        };
        files.push(File {
            rel: r,
            abs: p.clone(),
            kind,
            raw_type,
            value,
            body: body_owned,
            body_line_offset,
            corpus_dir: index,
        });
    }

    ScanResult {
        corpus: Corpus {
            index,
            root: root.to_path_buf(),
            files,
        },
        referenced_texts: referenced,
    }
}

fn paths_eq(a: &Path, b: &Path) -> bool {
    let ca = std::fs::canonicalize(a).ok();
    let cb = std::fs::canonicalize(b).ok();
    match (ca, cb) {
        (Some(x), Some(y)) => x == y,
        _ => a == b,
    }
}
