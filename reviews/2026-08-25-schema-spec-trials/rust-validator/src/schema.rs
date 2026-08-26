//! Validation against the normative data model (SPEC section 3), and the
//! mapping from a schema failure back to a requirement id.
//!
//! The schema is compiled once per record type rather than through the
//! top-level `oneOf`, because a `oneOf` failure reports only "valid under none
//! of them" and a validator that cannot say which field is wrong is not useful.
//! The `type` discriminator (ERF-54) selects the branch, which is exactly what
//! the model says it is for.

use crate::model::FileKind;
use jsonschema::error::ValidationErrorKind;
use jsonschema::Validator;
use serde_json::{json, Value};

pub const EMBEDDED_SCHEMA: &str = include_str!("../../SCHEMA-as-tried.json");

pub struct Schemas {
    pub atom: Validator,
    pub claim: Validator,
    pub survey: Validator,
    pub corpus: Validator,
    pub sources: Validator,
    pub narrative: Validator,
}

fn branch(root: &Value, def: &str) -> Result<Validator, String> {
    let mut s = json!({ "$ref": format!("#/$defs/{}", def) });
    s.as_object_mut()
        .unwrap()
        .insert("$defs".into(), root["$defs"].clone());
    s.as_object_mut().unwrap().insert(
        "$schema".into(),
        json!("https://json-schema.org/draft/2020-12/schema"),
    );
    jsonschema::validator_for(&s).map_err(|e| format!("compiling {}: {}", def, e))
}

impl Schemas {
    pub fn load(src: &str) -> Result<Schemas, String> {
        let root: Value = serde_json::from_str(src).map_err(|e| e.to_string())?;
        Ok(Schemas {
            atom: branch(&root, "Atom")?,
            claim: branch(&root, "Claim")?,
            survey: branch(&root, "Survey")?,
            corpus: branch(&root, "CorpusDeclaration")?,
            sources: branch(&root, "SourceList")?,
            narrative: branch(&root, "Narrative")?,
        })
    }

    pub fn for_kind(&self, k: FileKind) -> &Validator {
        match k {
            FileKind::Atom => &self.atom,
            FileKind::Claim => &self.claim,
            FileKind::Survey => &self.survey,
            FileKind::CorpusDecl => &self.corpus,
            FileKind::SourceList => &self.sources,
            FileKind::Narrative => &self.narrative,
        }
    }
}

pub struct SchemaFinding {
    pub req: &'static str,
    pub message: String,
    /// true when the failure is a string-typed field that arrived as another
    /// type, which the binding makes ERF-65's violation.
    pub is_scalar_type_error: bool,
}

/// Map a schema failure onto the requirement that gives it its reason.
/// SPEC section 3: "Where a requirement below is marked *Shape*, the schema
/// holds the enforceable form and the requirement holds the reason."
fn req_for(kind: FileKind, path: &str, err: &ValidationErrorKind) -> &'static str {
    let last = path.rsplit('/').next().unwrap_or("");
    // Required-property failures name the property, not the path.
    if let ValidationErrorKind::Required { property } = err {
        let p = property.as_str().unwrap_or("");
        return match p {
            "type" => "ERF-54",
            "corpus" => "ERF-17",
            "normalized" => "ERF-4",
            "reason" => "ERF-5",
            "why" => "ERF-39",
            "by" | "timestamp" => "ERF-58",
            "protocol" | "auditor" => "ERF-11",
            "verdict" => "ERF-12",
            "spec_version" => "ERF-59",
            "id" if kind == FileKind::Atom => "ERF-13",
            "id" => "ERF-36",
            "searches" | "conducted" => "ERF-28",
            "tool" | "query" => "ERF-26",
            "hits_reported" => "ERF-27",
            "sources" => "ERF-3",
            "body" => "ERF-53",
            "title" if kind == FileKind::Claim => "ERF-18",
            "created" => "ERF-47",
            "source" => "ERF-4",
            "quote" => "ERF-6",
            "source_quality" => "ERF-9",
            "epistemic_kind" => "SPEC-5",
            "finding" => "ERF-11",
            "relation" | "to" => "SPEC-5",
            "stance" => "ERF-41",
            "citation_text" => "ERF-7",
            "status" => "ERF-5",
            "what" | "note" => "ERF-27",
            _ => "SPEC-3",
        };
    }
    if matches!(err, ValidationErrorKind::AdditionalProperties { .. }) {
        return "ERF-55";
    }
    if matches!(err, ValidationErrorKind::Not { .. }) && last == "citation_text" {
        return "ERF-7";
    }
    // Otherwise the field itself decides, via the index in section 3.1.
    match last {
        "stance" => "ERF-41",
        "by" if path.contains("standings") => "ERF-21",
        "by" => "SPEC-2",
        "why" => "ERF-39",
        "owner" => "SPEC-2",
        "verdict" => "ERF-12",
        "auditor" | "protocol" => "ERF-11",
        "timestamp" if path.contains("standings") => "ERF-19",
        "timestamp" => "SPEC-3",
        "as_of_date" => "ERF-14",
        "citation_text" => "ERF-7",
        "status" => "ERF-5",
        "normalized" => "ERF-4",
        "reason" => "ERF-5",
        "licence" | "licence_name" => "ERF-68",
        "digest" | "normalized_digest" => "ERF-71",
        "extraction" | "normalization" => "ERF-70",
        "source_quality" => "ERF-9",
        "epistemic_kind" => "SPEC-5",
        "relation" => "SPEC-5",
        "spec_version" => "ERF-61",
        "hits_reported" => "ERF-27",
        "tool" | "query" | "scope" => "ERF-26",
        "searches" => "ERF-28",
        "quote" => "ERF-6",
        "title" if kind == FileKind::Claim => "ERF-18",
        "type" => "ERF-54",
        "corpus" => "ERF-17",
        "id" if kind == FileKind::Atom => "ERF-13",
        "id" => "ERF-36",
        "atoms_for" | "atoms_against" => "ERF-23",
        "surveys" => "ERF-25",
        "edges" => "SPEC-5",
        "standings" => "ERF-19",
        "body" => "ERF-53",
        _ => "SPEC-3",
    }
}

pub fn validate(schemas: &Schemas, kind: FileKind, instance: &Value) -> Vec<SchemaFinding> {
    let mut out = Vec::new();
    for err in schemas.for_kind(kind).iter_errors(instance) {
        let path = err.instance_path().to_string();
        let kindref = err.kind();
        let req = req_for(kind, &path, kindref);
        let rendered = err.to_string();
        // "A validator MUST report a string-typed field that arrived as any
        //  other type, and the report is a violation." (ERF-65). `citation` is
        //  typed by CSL and outside the rule.
        let is_scalar_type_error = matches!(kindref, ValidationErrorKind::Type { .. })
            && rendered.contains("is not of type \"string\"")
            && !path.contains("/citation");
        let where_ = if path.is_empty() {
            "the record".to_string()
        } else {
            path.clone()
        };
        out.push(SchemaFinding {
            req,
            message: format!("{} — {}", where_, rendered),
            is_scalar_type_error,
        });
    }
    out
}
