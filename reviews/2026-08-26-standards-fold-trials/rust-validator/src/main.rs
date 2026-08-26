//! `erfval`: a strict validator for the Epistemic Record Format, built from
//! `SPEC.md`, `erf.schema.json` and `bindings/yaml-markdown.md` alone.


use std::path::PathBuf;
use std::process::ExitCode;

use clap::Parser as ClapParser;

use erfval::checks;
use erfval::model::RecordType;
use erfval::norm::FoldMode;
use erfval::report::Report;

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

    let roots: Vec<&std::path::Path> = cli.roots.iter().map(|p| p.as_path()).collect();
    let (rep, dep) = match erfval::validate(&roots, mode) {
        Ok(x) => x,
        Err(e) => {
            eprintln!("erfval: {e}");
            return ExitCode::from(2);
        }
    };

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
