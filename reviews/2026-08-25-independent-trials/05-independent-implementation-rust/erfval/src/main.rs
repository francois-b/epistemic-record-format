//! erfval — an independent validator for the Epistemic Record Format, v0.9 (draft).
//!
//! Built from SPEC.md alone: no reference implementation, no conformance fixtures, no
//! example corpora were consulted. See friction-log.md, ambiguities.md and
//! type-decisions.md beside this crate for what that cost.

// The data model of section 3 is modelled in full, including fields no requirement
// makes checkable (a finding's text, a claim's families). Those fields are decoded and
// held, so the allow is deliberate: dropping them would make the types a report of what
// this validator happens to check rather than a mirror of the specification.
#![allow(dead_code)]

mod checks;
mod corpus;
mod decode;
mod finding;
#[cfg(test)]
mod fixtures_test;
mod model;
mod narrative;
mod normalize;
mod raw;

use std::path::PathBuf;
use std::process::ExitCode;

use finding::{Report, Severity};

const USAGE: &str = "\
erfval — validate an ERF deployment (v0.9 draft)

USAGE:
    erfval <corpus-or-deployment-directory> [OPTIONS]

OPTIONS:
    --json             one JSON object per line instead of the tab-separated form
    --no-notices       suppress NOTICE findings (SHOULD departures and guidance)
    --only-violations  print only VIOLATION findings
    --dispositions     also print each claim's computed disposition (ERF-41)
    --quiet            suppress the trailing summary line
    -h, --help         this text

OUTPUT (tab-separated):
    SEVERITY  ERF-ID  SUBJECT  FIELD  FILE:LINE  MESSAGE

    SEVERITY is VIOLATION (a machine-checkable MUST is breached), FLAG (the spec says a
    validator flags rather than rejects: ERF-43, ERF-47, ERF-49, and an unavailable quote
    check under ERF-51) or NOTICE (a SHOULD departure or section-4 guidance).

EXIT CODE:
    0  no violations   1  at least one violation   2  bad invocation
";

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.is_empty() || args.iter().any(|a| a == "-h" || a == "--help") {
        print!("{USAGE}");
        return ExitCode::from(if args.is_empty() { 2 } else { 0 });
    }
    let mut root: Option<PathBuf> = None;
    let mut json = false;
    let mut no_notices = false;
    let mut only_violations = false;
    let mut dispositions = false;
    let mut quiet = false;
    for a in &args {
        match a.as_str() {
            "--json" => json = true,
            "--no-notices" => no_notices = true,
            "--only-violations" => only_violations = true,
            "--dispositions" => dispositions = true,
            "--quiet" => quiet = true,
            other if other.starts_with("--") => {
                eprintln!("erfval: unknown option {other}");
                return ExitCode::from(2);
            }
            other => {
                if root.is_some() {
                    eprintln!("erfval: more than one directory given");
                    return ExitCode::from(2);
                }
                root = Some(PathBuf::from(other));
            }
        }
    }
    let Some(root) = root else {
        eprintln!("erfval: no directory given");
        return ExitCode::from(2);
    };
    if !root.is_dir() {
        eprintln!("erfval: {} is not a directory", root.display());
        return ExitCode::from(2);
    }
    let root = root.canonicalize().unwrap_or(root);

    let mut rep = Report::new();
    let dep = corpus::load(&root, &mut rep);
    let opts = checks::Options { print_dispositions: dispositions };
    let disps = checks::validate(&dep, &mut rep, &opts);

    let mut findings = rep.findings.clone();
    findings.sort_by(|a, b| {
        a.file
            .cmp(&b.file)
            .then(a.line.cmp(&b.line))
            .then(a.severity.cmp(&b.severity))
            .then(a.req.cmp(&b.req))
            .then(a.message.cmp(&b.message))
    });
    findings.dedup_by(|a, b| {
        a.file == b.file && a.line == b.line && a.req == b.req && a.message == b.message && a.subject == b.subject && a.field == b.field
    });

    for f in &findings {
        if only_violations && f.severity != Severity::Violation {
            continue;
        }
        if no_notices && f.severity == Severity::Notice {
            continue;
        }
        if json {
            println!("{}", f.to_json(&root));
        } else {
            println!("{}", f.render(&root));
        }
    }

    if dispositions {
        for (id, d) in &disps {
            if json {
                println!(
                    "{{\"disposition\":{},\"claim\":{}}}",
                    finding::json_str(d.as_str()),
                    finding::json_str(id)
                );
            } else {
                println!("DISPOSITION\tERF-41\t{id}\t-\t-\t{}", d.as_str());
            }
        }
    }

    let (v, fl, n) = {
        let mut v = 0;
        let mut fl = 0;
        let mut n = 0;
        for f in &findings {
            match f.severity {
                Severity::Violation => v += 1,
                Severity::Flag => fl += 1,
                Severity::Notice => n += 1,
            }
        }
        (v, fl, n)
    };
    if !quiet {
        eprintln!(
            "erfval: {} corpora, {} records, {} narratives — {v} violations, {fl} flags, {n} notices",
            dep.corpora.len(),
            dep.records.len(),
            dep.narratives.len()
        );
    }
    if v > 0 {
        ExitCode::from(1)
    } else {
        ExitCode::SUCCESS
    }
}
