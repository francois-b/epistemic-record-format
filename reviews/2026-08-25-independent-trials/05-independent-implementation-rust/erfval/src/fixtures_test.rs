//! Integration checks over the hand-built corpora in ../tests.

use crate::checks::{self, Options};
use crate::corpus;
use crate::finding::{Report, Severity};
use std::path::PathBuf;

fn run(name: &str) -> Report {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..").join("tests").join(name);
    let root = root.canonicalize().expect("fixture corpus exists");
    let mut rep = Report::new();
    let dep = corpus::load(&root, &mut rep);
    checks::validate(&dep, &mut rep, &Options { print_dispositions: false });
    rep
}

fn reqs(rep: &Report, sev: Severity) -> Vec<String> {
    let mut v: Vec<String> = rep
        .findings
        .iter()
        .filter(|f| f.severity == sev)
        .map(|f| f.req.clone())
        .collect();
    v.sort();
    v.dedup();
    v
}

#[test]
fn clean_corpus_has_no_violations() {
    let rep = run("corpus-clean");
    let v: Vec<String> = rep
        .findings
        .iter()
        .filter(|f| f.severity == Severity::Violation)
        .map(|f| f.render(std::path::Path::new("")))
        .collect();
    assert!(v.is_empty(), "conforming corpus reported violations:\n{}", v.join("\n"));
}

#[test]
fn clean_corpus_reports_the_unavailable_check() {
    let rep = run("corpus-clean");
    assert!(rep
        .findings
        .iter()
        .any(|f| f.severity == Severity::Flag && f.req == "ERF-51" && f.subject == "kwg-119"));
}

#[test]
fn violation_corpus_trips_the_expected_requirements() {
    let rep = run("corpus-violations");
    let got = reqs(&rep, Severity::Violation);
    for want in [
        "ERF-1", "ERF-4", "ERF-5", "ERF-6", "ERF-7", "ERF-9", "ERF-11", "ERF-12", "ERF-14",
        "ERF-15", "ERF-17", "ERF-19", "ERF-21", "ERF-22", "ERF-26", "ERF-27", "ERF-31",
        "ERF-32", "ERF-33", "ERF-34", "ERF-35", "ERF-38", "ERF-39", "ERF-43", "ERF-44",
        "ERF-48", "ERF-52", "ERF-53", "ERF-55", "ERF-58", "ERF-61", "ERF-66", "ERF-67",
        "ERF-68", "ERF-71", "§2",
    ] {
        assert!(got.contains(&want.to_string()), "expected a {want} violation, got {got:?}");
    }
    let flags = reqs(&rep, Severity::Flag);
    for want in ["ERF-43", "ERF-47", "ERF-49", "ERF-51", "ERF-57"] {
        assert!(flags.contains(&want.to_string()), "expected a {want} flag, got {flags:?}");
    }
}

#[test]
fn deployment_scope_is_the_whole_directory() {
    let rep = run("deployment-two-corpora");
    let got = reqs(&rep, Severity::Violation);
    // ERF-36/38 across corpora, ERF-62 two homes, ERF-3 a corpus with no source list.
    for want in ["ERF-3", "ERF-38", "ERF-62"] {
        assert!(got.contains(&want.to_string()), "expected a {want} violation, got {got:?}");
    }
    // A bare id resolving across a corpus boundary is legal (ERF-15, ERF-35).
    assert!(!rep
        .findings
        .iter()
        .any(|f| f.req == "ERF-35" && f.subject == "cross-corpus-evidence"));
}

#[test]
fn dispositions_cover_every_reading() {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..").join("tests").join("deployment-two-corpora");
    let root = root.canonicalize().unwrap();
    let mut rep = Report::new();
    let dep = corpus::load(&root, &mut rep);
    let ds = checks::validate(&dep, &mut rep, &Options { print_dispositions: true });
    let find = |id: &str| ds.iter().find(|(i, _)| i == id).map(|(_, d)| d.as_str());
    assert_eq!(find("disposition-proposal"), Some("proposal"));
    assert_eq!(find("cross-corpus-evidence"), Some("active"));
    assert_eq!(find("disposition-contested"), Some("contested"));
    assert_eq!(find("disposition-rejected"), Some("rejected"));
    assert_eq!(find("disposition-retired"), Some("retired"));
}
