//! `erfval`: a strict validator for the Epistemic Record Format, built from
//! `SPEC.md`, `erf.schema.json` and `bindings/yaml-markdown.md` alone, with no
//! sight of any other implementation.

pub mod checks;
pub mod corpus;
pub mod model;
pub mod nbinding;
pub mod norm;
pub mod report;
pub mod schema;
pub mod yamlload;

use std::collections::BTreeMap;
use std::path::Path;

/// Validate one or more corpus directories as a single deployment.
/// Returns the report and the loaded deployment (for the disposition listing).
pub fn validate(
    roots: &[&Path],
    mode: norm::FoldMode,
) -> Result<(report::Report, checks::Deployment), String> {
    let schemas = schema::build()?;
    let mut rep = report::Report::new();
    let mut corpora = Vec::new();
    for root in roots {
        if !root.is_dir() {
            return Err(format!("`{}` is not a directory", root.display()));
        }
        let label = root
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| root.display().to_string());
        let loaded = corpus::load(root, &mut rep);
        let index = corpus::index(&loaded);
        corpora.push(checks::CorpusCtx {
            root: root.to_path_buf(),
            label,
            loaded,
            index,
            decl_ids: Vec::new(),
            strictness: checks::Strictness::Known,
            texts: BTreeMap::new(),
        });
    }
    let mut dep = checks::Deployment { corpora, mode };
    checks::run(&mut dep, &schemas, &mut rep);
    Ok((rep, dep))
}
