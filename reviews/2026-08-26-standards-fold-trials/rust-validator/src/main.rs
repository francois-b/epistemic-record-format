//! `erfval`: a strict validator for the Epistemic Record Format, built from
//! `SPEC.md`, `erf.schema.json` and `bindings/yaml-markdown.md` alone.


use std::collections::BTreeMap;
use std::path::PathBuf;
use std::process::ExitCode;

use clap::Parser as ClapParser;

use erfval::checks::{self, CorpusCtx, Deployment, Strictness};
use erfval::corpus;
use erfval::model::RecordType;
use erfval::norm::FoldMode;
use erfval::report::Report;
use erfval::schema;

#[derive(ClapParser, Debug)]
#[command(
    name = "erfval",
    about = "Validate an Epistemic Record Format corpus.",
    long_about = "Reports three kinds of thing, each line carrying a requirement id:\n\
                  VIOLATION   the corpus does not conform\n\
                  FLAG        the corpus conforms; a person should look\n\
                  UNPERFORMED a check this validator did not run, or ran only in part\n\
                  Exit code 1 on any violation."
)]
struct Cli {
    /// One or more corpus directories. Two or more are read as one deployment,
    /// which is what ERF-35, ERF-36 and ERF-38 are scoped to.
    #[arg(required = true)]
    roots: Vec<PathBuf>,

    /// Read ERF-51 step 3 to the letter, collapsing U+2029 like any other
    /// White_Space. See ambiguities.md, A-1: this destroys the paragraph
    /// boundary ERF-52 relies on.
    #[arg(long)]
    erf51_literal: bool,

    /// Print the computed disposition of every claim (ERF-41), which is never a
    /// stored field.
    #[arg(long)]
    dispositions: bool,

    /// Suppress the UNPERFORMED section. Off by default: naming what was not
    /// checked is a duty of the Validator conformance class, not a courtesy.
    #[arg(long)]
    no_unperformed: bool,
}

fn main() -> ExitCode {
    let cli = Cli::parse();
    let mode = if cli.erf51_literal {
        FoldMode::Literal
    } else {
        FoldMode::SeparatorPreserving
    };

    let schemas = match schema::build() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("erfval: the embedded data model does not compile: {e}");
            return ExitCode::from(2);
        }
    };

    let mut rep = Report::new();
    let mut corpora = Vec::new();
    for root in &cli.roots {
        if !root.is_dir() {
            eprintln!("erfval: `{}` is not a directory", root.display());
            return ExitCode::from(2);
        }
        let label = root
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| root.display().to_string());
        let loaded = corpus::load(root, &mut rep);
        let index = corpus::index(&loaded);
        corpora.push(CorpusCtx {
            root: root.clone(),
            label,
            loaded,
            index,
            decl_id: None,
            strictness: Strictness::Known,
            texts: BTreeMap::new(),
        });
    }

    let mut dep = Deployment { corpora, mode };
    checks::run(&mut dep, &schemas, &mut rep);

    print!("{}", rep.render(cli.no_unperformed));

    if cli.dispositions {
        println!("\n== COMPUTED DISPOSITIONS (ERF-41; never a stored field) ==");
        let mut sink = Report::new();
        for c in &dep.corpora {
            for d in c
                .loaded
                .docs
                .iter()
                .filter(|d| d.rtype == Some(RecordType::Claim))
            {
                let disp = checks::disposition_for(d, &mut sink);
                println!("{:<12} {}  {}", disp.as_str(), d.rel, d.id().unwrap_or("?"));
            }
        }
    }

    let v = rep.violations();
    println!(
        "\n{} violation(s), {} flag(s), {} unperformed check(s) named. Corpus {}.",
        v,
        rep.flags(),
        rep.unperformeds(),
        if v == 0 { "CONFORMS" } else { "DOES NOT CONFORM" }
    );
    if v == 0 { ExitCode::SUCCESS } else { ExitCode::from(1) }
}
