//! erfval — a strict validator for the Epistemic Record Format, v0.9.0 draft,
//! built from SPEC.md, erf.schema.json and bindings/yaml-markdown.md alone.
//!
//! Usage: erfval [--quiet] [--no-info] [--schema PATH] <corpus-dir> [<corpus-dir> ...]
//!
//! Exit 0 when the corpus conforms (flags may be present), 1 when it does not,
//! 2 when the validator could not run.

mod checks;
mod fold;
mod load;
mod model;
mod narrative;
mod report;
mod schema;
mod util;
mod yamlload;

use report::{Kind, Reporter};
use std::path::PathBuf;

fn main() {
    let mut dirs: Vec<PathBuf> = Vec::new();
    let mut show_info = true;
    let mut quiet = false;
    let mut schema_path: Option<PathBuf> = None;
    let mut args = std::env::args().skip(1);
    while let Some(a) = args.next() {
        match a.as_str() {
            "--no-info" => show_info = false,
            "--quiet" | "-q" => {
                quiet = true;
                show_info = false;
            }
            "--schema" => schema_path = args.next().map(PathBuf::from),
            "-h" | "--help" => {
                eprintln!(
                    "erfval [--quiet] [--no-info] [--schema PATH] <corpus-dir> [<corpus-dir> ...]\n\
                     \n\
                     One directory per corpus. Give every corpus of a deployment on one\n\
                     command line, or ERF-35, ERF-36 and ERF-38 are reported as partial."
                );
                std::process::exit(0);
            }
            other if other.starts_with('-') => {
                eprintln!("erfval: unknown option {}", other);
                std::process::exit(2);
            }
            other => dirs.push(PathBuf::from(other)),
        }
    }
    if dirs.is_empty() {
        eprintln!("erfval: give at least one corpus directory (--help)");
        std::process::exit(2);
    }

    let schema_src = match &schema_path {
        None => schema::EMBEDDED_SCHEMA.to_string(),
        Some(p) => match std::fs::read_to_string(p) {
            Ok(s) => s,
            Err(e) => {
                eprintln!("erfval: cannot read {}: {}", p.display(), e);
                std::process::exit(2);
            }
        },
    };
    let schemas = match schema::Schemas::load(&schema_src) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("erfval: the data model will not compile: {}", e);
            std::process::exit(2);
        }
    };

    let mut rep = Reporter::default();
    let mut corpora = Vec::new();
    for (i, d) in dirs.iter().enumerate() {
        if !d.is_dir() {
            eprintln!("erfval: {} is not a directory", d.display());
            std::process::exit(2);
        }
        let r = load::scan_corpus(i, d, &mut rep);
        corpora.push(r.corpus);
    }

    checks::run(corpora, &schemas, &mut rep);

    // Stable order: kind, then requirement number, then place.
    rep.findings.sort_by(|a, b| {
        a.kind
            .cmp(&b.kind)
            .then(req_key(&a.req).cmp(&req_key(&b.req)))
            .then(a.where_.cmp(&b.where_))
            .then(a.message.cmp(&b.message))
    });

    for f in &rep.findings {
        if f.kind == Kind::Info && !show_info {
            continue;
        }
        println!("{}", f);
    }

    let v = rep.count(Kind::Violation);
    if !quiet {
        println!(
            "\n{} violation(s), {} flag(s), {} unperformed check(s), {} partial, {} note(s).",
            v,
            rep.count(Kind::Flag),
            rep.count(Kind::Unperformed),
            rep.count(Kind::Partial),
            rep.count(Kind::Info),
        );
        println!(
            "{}",
            if v == 0 {
                "The corpus conforms. A flag is not a violation (SPEC section 1)."
            } else {
                "The corpus does not conform."
            }
        );
    }
    std::process::exit(if v == 0 { 0 } else { 1 });
}

fn req_key(r: &str) -> (u8, u32, String) {
    if let Some(n) = r.strip_prefix("ERF-") {
        if let Ok(x) = n.parse::<u32>() {
            return (0, x, String::new());
        }
    }
    if let Some(n) = r.strip_prefix("YAMLB-") {
        if let Ok(x) = n.parse::<u32>() {
            return (1, x, String::new());
        }
    }
    (2, 0, r.to_string())
}
