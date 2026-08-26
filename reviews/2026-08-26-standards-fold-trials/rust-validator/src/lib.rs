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
