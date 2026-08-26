//! Every corpus in `tests/corpora/` is run through the validator.
//!
//! `conforming/` must produce no violation. `flags-worth-a-look/` must produce
//! no violation and several flags, because "a corpus carrying flags and no
//! violations conforms". Every `bad-<req>-<what>/` must produce at least one
//! violation carrying the requirement its directory name states.
//!
//! Regenerate the corpora with `python3 tests/make-corpora.py`.

use std::path::{Path, PathBuf};

use erfval::norm::FoldMode;
use erfval::report::Kind;

fn corpora_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/corpora")
}

fn run(dir: &Path) -> erfval::report::Report {
    erfval::validate(&[dir], FoldMode::SeparatorPreserving)
        .unwrap_or_else(|e| panic!("{}: {e}", dir.display()))
        .0
}

/// `bad-erf52-word-fragment` -> `ERF-52`; `bad-yamlb1s-...` -> `YAMLB-1s`.
fn req_from_dir(name: &str) -> String {
    let rest = name.strip_prefix("bad-").expect("a bad corpus");
    let tok = rest.split('-').next().unwrap();
    if let Some(n) = tok.strip_prefix("erf") {
        format!("ERF-{n}")
    } else if let Some(n) = tok.strip_prefix("yamlb") {
        format!("YAMLB-{n}")
    } else if let Some(n) = tok.strip_prefix("spec") {
        format!("SPEC-{n}")
    } else {
        panic!("cannot read a requirement id out of `{name}`")
    }
}

#[test]
fn the_conforming_corpus_conforms() {
    let rep = run(&corpora_dir().join("conforming"));
    let vs: Vec<String> = rep
        .findings
        .iter()
        .filter(|f| f.kind == Kind::Violation)
        .map(|f| format!("{} {} {}", f.req, f.loc, f.msg))
        .collect();
    assert!(vs.is_empty(), "unexpected violations:\n{}", vs.join("\n"));
    assert!(
        rep.unperformeds() > 30,
        "the naming duty is not a formality; expected the unperformed list to be long"
    );
}

#[test]
fn flags_are_not_violations() {
    let rep = run(&corpora_dir().join("flags-worth-a-look"));
    let vs: Vec<String> = rep
        .findings
        .iter()
        .filter(|f| f.kind == Kind::Violation)
        .map(|f| format!("{} {} {}", f.req, f.loc, f.msg))
        .collect();
    assert!(vs.is_empty(), "a flagged corpus still conforms:\n{}", vs.join("\n"));
    for want in [
        "ERF-6", "ERF-13", "ERF-18", "ERF-20", "ERF-26", "ERF-31", "ERF-32",
        "ERF-35", "ERF-43", "ERF-47", "ERF-69",
    ] {
        assert!(
            rep.findings
                .iter()
                .any(|f| f.kind == Kind::Flag && f.req == want),
            "expected a {want} flag"
        );
    }
}

#[test]
fn every_bad_corpus_violates_the_requirement_it_names() {
    let mut checked = 0usize;
    let mut entries: Vec<PathBuf> = std::fs::read_dir(corpora_dir())
        .unwrap()
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| {
            p.is_dir()
                && p.file_name()
                    .map(|n| n.to_string_lossy().starts_with("bad-"))
                    .unwrap_or(false)
        })
        .collect();
    entries.sort();
    for dir in entries {
        let name = dir.file_name().unwrap().to_string_lossy().to_string();
        let want = req_from_dir(&name);
        let rep = run(&dir);
        let got: Vec<&str> = rep
            .findings
            .iter()
            .filter(|f| f.kind == Kind::Violation)
            .map(|f| f.req.as_str())
            .collect();
        assert!(
            got.contains(&want.as_str()),
            "{name}: expected a {want} violation, got {got:?}"
        );
        checked += 1;
    }
    assert!(checked >= 30, "expected the bad-corpus set to be broad, saw {checked}");
}

#[test]
fn ids_clash_only_when_the_deployment_is_read_as_one() {
    // ERF-36 is deployment-wide. Two corpora that are each clean can still
    // clash, and a run over one corpus must say it checked only part.
    let a = corpora_dir().join("conforming");
    let b = corpora_dir().join("flags-worth-a-look");
    let (rep, _) = erfval::validate(&[&a, &b], FoldMode::SeparatorPreserving).unwrap();
    assert!(
        rep.findings
            .iter()
            .any(|f| f.kind == Kind::Violation && f.req == "ERF-38"),
        "two corpora sharing record ids must clash when read as one deployment"
    );
    assert!(
        !rep.findings
            .iter()
            .any(|f| f.kind == Kind::Unperformed && f.msg.starts_with("PARTIAL") && f.req == "ERF-36"),
        "a two-corpus run is no longer partial in the single-corpus sense"
    );

    let single = run(&a);
    assert!(
        single
            .findings
            .iter()
            .any(|f| f.kind == Kind::Unperformed && f.req == "ERF-36" && f.msg.starts_with("PARTIAL")),
        "a single-corpus run MUST name ERF-36 as partial"
    );
}
